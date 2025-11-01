import yaml
import torch
import numpy as np
import traci
import argparse
import pandas as pd
import matplotlib.pyplot as plt
import os
import multiprocessing
import csv
from sumo_simulator import SumoSimulator
from ppo_agent import Actor

def save_wait_time_breakdown_plot(log_file, junction_ids, mode, config, output_dir):
    """
    Reads the final CSV log and generates a publication-ready bar chart
    showing the average waiting time per vehicle category for each junction.
    """
    print(f"Generating wait time breakdown plots for mode '{mode}'...")
    try:
        df = pd.read_csv(log_file)
        if df.empty:
            print("Log file is empty. Cannot generate plots.")
            return

        # --- PLOTTING STYLE FOR RESEARCH PAPERS ---
        plt.style.use('seaborn-v0_8-whitegrid')
        plt.rcParams['font.family'] = 'serif'
        plt.rcParams['font.serif'] = ['Times New Roman'] + plt.rcParams['font.serif']
        
        vehicle_types = list(config['priority_weights'].keys())
        colors = plt.cm.viridis(np.linspace(0, 1, len(vehicle_types)))
        color_map = {v_type: color for v_type, color in zip(vehicle_types, colors)}

        # Determine grid size for subplots
        num_junctions = len(junction_ids)
        cols = 2 if num_junctions > 1 else 1
        rows = (num_junctions + 1) // cols
        
        fig, axes = plt.subplots(rows, cols, figsize=(10 * cols, 6 * rows), squeeze=False)
        fig.suptitle(f"Average Waiting Time per Vehicle Type (Mode: {mode.upper()})", fontsize=20, weight='bold')
        
        axes_flat = axes.flatten()

        for i, j_id in enumerate(junction_ids):
            ax = axes_flat[i]
            
            # Calculate mean waiting time for each vehicle type for this junction
            avg_wait_times = {}
            for v_type in vehicle_types:
                col_name = f'{j_id}_{v_type}_wait_time'
                if col_name in df.columns:
                    avg_wait_times[v_type] = df[col_name].mean()
            
            if not avg_wait_times: continue

            # Plotting
            names = list(avg_wait_times.keys())
            values = list(avg_wait_times.values())
            bar_colors = [color_map.get(name, 'gray') for name in names]

            ax.bar(names, values, color=bar_colors)
            ax.set_title(f"Junction '{j_id}'", fontsize=16)
            ax.set_ylabel("Average Waiting Time (s)", fontsize=14)
            ax.tick_params(axis='x', rotation=45, labelsize=12)
            ax.tick_params(axis='y', labelsize=12)

        # Hide any unused subplots
        for i in range(num_junctions, len(axes_flat)):
            axes_flat[i].set_visible(False)

        plt.tight_layout(rect=[0, 0.03, 1, 0.95])
        plot_filename = os.path.join(output_dir, f"inference_wait_time_breakdown_{mode}.png")
        plt.savefig(plot_filename, dpi=300)
        plt.close()
        print(f"✅ Wait time breakdown plot saved to {plot_filename}")

    except Exception as e:
        print(f"Could not generate final plots. Error: {e}")


def run_inference(config, mode, log_file):
    """
    Runs the SUMO simulation for inference and logs per-category waiting times.
    """
    config['sumo']['gui'] = True  # Always use GUI for inference visualization
    sim = SumoSimulator(config['sumo']['config_file'], config, step_length=config['sumo']['step_length'], gui=True)
    
    controlled_junction_ids = config['system']['controlled_junctions']
    vehicle_types = list(config['priority_weights'].keys())
    
    print(f"Starting inference in '{mode}' mode for junctions: {controlled_junction_ids}")

    agents = {}
    if mode == 'rl':
        for j_id in controlled_junction_ids:
            j_info = sim.junctions[j_id]
            actor = Actor(2 * len(j_info['incoming_roads']), len(j_info['incoming_roads']), config['model']['hidden_layers'])
            try:
                actor.load_state_dict(torch.load(config['system']['model_save_path']))
                actor.eval()
                agents[j_id] = actor
            except FileNotFoundError:
                print(f"FATAL: Model not found at {config['system']['model_save_path']}."); sim.close(); return
        sim.init_phase_timers(controlled_junction_ids)

    with open(log_file, 'w', newline='') as f:
        writer = csv.writer(f)
        
        # Create a detailed header for per-category wait times
        header = ['step']
        for j_id in controlled_junction_ids:
            for v_type in vehicle_types:
                header.append(f'{j_id}_{v_type}_wait_time')
        writer.writerow(header)
        
        step = 0
        while traci.simulation.getMinExpectedNumber() > 0:
            traci.simulationStep()
            
            # RL agent control logic (remains the same)
            if mode == 'rl':
                sim.update_phase_timers()
                for j_id in controlled_junction_ids:
                    if sim.phase_timers[j_id] >= config['fdrl']['green_time']:
                        state = sim.get_state(j_id)
                        with torch.no_grad():
                            action = torch.argmax(agents[j_id](torch.FloatTensor(state))).item()
                        sim.set_phase_inference(j_id, action, config['fdrl']['yellow_time'])

            # --- DETAILED DATA COLLECTION ---
            log_row = [step]
            for j_id in controlled_junction_ids:
                # Initialize a dictionary to store total wait time per vehicle type for this junction
                wait_times_by_type = {v_type: 0.0 for v_type in vehicle_types}
                
                # Iterate through all incoming roads to the junction
                for road_id in sim.junctions[j_id]['incoming_roads']:
                    lane_count = traci.edge.getLaneNumber(road_id)
                    lanes = [f"{road_id}_{i}" for i in range(lane_count)]
                    for lane_id in lanes:
                        vehicles = traci.lane.getLastStepVehicleIDs(lane_id)
                        for v_id in vehicles:
                            v_type = traci.vehicle.getTypeID(v_id)
                            # Add vehicle's wait time to the correct category
                            if v_type in wait_times_by_type:
                                wait_times_by_type[v_type] += traci.vehicle.getWaitingTime(v_id)
                
                # Append the collected data to the log row in the correct order
                log_row.extend(list(wait_times_by_type.values()))
            
            writer.writerow(log_row)
            f.flush()
            step += 1

    sim.close()
    print("Inference simulation finished.")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Run FDRL inference for traffic control.")
    parser.add_argument('--mode', type=str, required=True, choices=['rl', 'fixed'], help="Mode: 'rl' or 'fixed'.")
    args = parser.parse_args()

    with open('config.yaml', 'r') as f:
        config = yaml.safe_load(f)

    output_dir = "inference_results"
    os.makedirs(output_dir, exist_ok=True)
    log_file_path = os.path.join(output_dir, f"inference_log_{args.mode}.csv")
    if os.path.exists(log_file_path):
        os.remove(log_file_path)

    # Run simulation process, and when it's done, generate the breakdown plot.
    sim_process = multiprocessing.Process(target=run_inference, args=(config, args.mode, log_file_path))
    
    sim_process.start()
    try:
        sim_process.join()
    except KeyboardInterrupt:
        print("\nInterrupted by user.")
    finally:
        if sim_process.is_alive():
            sim_process.terminate()
        
        # Call the new plot saving function at the very end
        save_wait_time_breakdown_plot(log_file_path, config['system']['controlled_junctions'], args.mode, config, output_dir)
        print("Inference run complete.")