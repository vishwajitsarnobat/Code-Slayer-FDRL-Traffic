"""
Inference Script for 3-Way Comparison
"""
import yaml
import torch
import numpy as np
import traci
import argparse
import pandas as pd
import matplotlib.pyplot as plt
import os
import csv
import time
from sumo_simulator import SumoSimulator
from ppo_agent import Actor

def run_inference(config, mode, log_file):
    print(f"\n{'='*70}")
    print(f"MODE: {mode.upper()}")
    print(f"{'='*70}\n")
    
    # Start simulation with GUI to see what's happening
    sim = SumoSimulator(config['sumo']['config_file'], config, gui=False)
    controlled_junctions = config['system']['controlled_junctions']
    vehicle_types = list(config['priority_weights'].keys())
    
    # Check vehicles - give time for loading
    print("Checking traffic (waiting for vehicles to load)...")
    for step in range(100):  # Wait up to 100 steps
        traci.simulationStep()
        loaded = traci.simulation.getLoadedNumber()
        departed = traci.simulation.getDepartedNumber()
        if loaded > 0 or departed > 0:
            break
    
    print(f"  Loaded: {loaded} vehicles")
    print(f"  Departed: {departed} vehicles")
    print(f"  Waiting: {traci.simulation.getStartingTeleportNumber()} to depart")
    
    if loaded == 0 and departed == 0:
        print("\n⚠️  ERROR: No vehicles in simulation!")
        print("   Check that route files contain vehicles with valid depart times")
        print("   Route files:")
        for vtype in vehicle_types:
            route_file = f"{config['sumo']['config_file'].replace('osm.sumocfg', '')}osm.{vtype if vtype != 'car' else 'passenger'}.trips.xml"
            if os.path.exists(route_file):
                count = os.popen(f"grep -c '<trip ' {route_file}").read().strip()
                print(f"     - {route_file}: {count} trips")
        sim.close()
        return
    
    # Load model if RL mode
    agents = {}
    if mode in ['rl', 'rl_priority']:
        if not os.path.exists('saved_models/universal_model.pth'):
            print("✗ Model not found. Run training first.")
            sim.close()
            return
        
        max_roads = config['system']['max_roads']
        state_dim = 2 * max_roads
        action_dim = max_roads
        
        # Get hidden layers from config
        hidden_layers = config['model']['hidden_layers']
        activation = config['model']['activation']
        
        print(f"\nLoading model for {len(controlled_junctions)} junctions...")
        for jid in controlled_junctions:
            # Create actor with correct config
            agents[jid] = Actor(state_dim, action_dim, config)
            agents[jid].load_state_dict(torch.load('saved_models/universal_model.pth', 
                                                   map_location='cpu'))
            agents[jid].eval()
            
            # Switch to RL program
            try:
                traci.trafficlight.setProgram(jid, 'rl_program')
                print(f"  ✓ {jid[:30]} -> RL control")
            except Exception as e:
                print(f"  ⚠️  {jid[:30]} -> keeping default (RL program not found)")
        print()
    
    # Run simulation
    print(f"Running simulation for 3600 steps...")
    step_count = 0
    
    with open(log_file, 'w', newline='') as csvfile:
        fieldnames = ['step'] + [f'{jid}_{vt}_wait' for jid in controlled_junctions for vt in vehicle_types]
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        
        for step in range(3600):
            # RL control
            if mode in ['rl', 'rl_priority']:
                for jid in controlled_junctions:
                    if jid in agents and jid in sim.junctions:
                        state = sim.get_state(jid)
                        state_tensor = torch.FloatTensor(state)
                        
                        with torch.no_grad():
                            action_probs = agents[jid](state_tensor)
                            action = torch.argmax(action_probs).item()
                        
                        # Mask invalid actions
                        actual_roads = len(sim.junctions[jid]['incoming_roads'])
                        if action < actual_roads:
                            sim.set_phase(jid, action, 
                                        config['fdrl']['yellow_time'],
                                        config['fdrl']['green_time'])
            
            try:
                traci.simulationStep()
                step_count += 1
            except Exception as e:
                print(f"\n⚠️  Simulation error at step {step}: {e}")
                break
            
            # Log every 10 steps
            if step % 10 == 0:
                row = {'step': step}
                for jid in controlled_junctions:
                    if jid not in sim.junctions:
                        continue
                    for vt in vehicle_types:
                        wait_time = 0
                        count = 0
                        for road in sim.junctions[jid]['incoming_roads']:
                            try:
                                for vid in traci.edge.getLastStepVehicleIDs(road):
                                    try:
                                        vtype = traci.vehicle.getTypeID(vid)
                                        # Map passenger -> car
                                        if vtype == 'passenger':
                                            vtype = 'car'
                                        if vtype == vt:
                                            wait_time += traci.vehicle.getWaitingTime(vid)
                                            count += 1
                                    except:
                                        pass
                            except:
                                pass
                        avg_wait = wait_time / max(count, 1)
                        row[f'{jid}_{vt}_wait'] = avg_wait
                
                writer.writerow(row)
            
            if step % 300 == 0:
                active = traci.vehicle.getIDCount()
                print(f"  Step {step}/3600... ({active} vehicles active)")
            
            # Check if simulation ended early
            if traci.simulation.getMinExpectedNumber() == 0 and step > 300:
                print(f"\n⚠️  Simulation ended at step {step} (no more vehicles)")
                break
    
    sim.close()
    print(f"✓ Inference complete: {log_file}")
    print(f"  Total steps simulated: {step_count}\n")

def plot_comparison(config, modes):
    print("Generating comparison plots...")
    
    vehicle_types = list(config['priority_weights'].keys())
    
    fig, ax = plt.subplots(figsize=(12, 6))
    
    for mode in modes:
        log_file = f'inference_results/inference_log_{mode}.csv'
        if not os.path.exists(log_file):
            continue
        
        try:
            df = pd.read_csv(log_file)
            if df.empty:
                continue
            
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            numeric_cols = [c for c in numeric_cols if c != 'step']
            
            if len(numeric_cols) > 0:
                avg_wait = df[numeric_cols].mean(axis=1)
                # Smooth with rolling average
                avg_wait_smooth = avg_wait.rolling(window=10, min_periods=1).mean()
                ax.plot(df['step'], avg_wait_smooth, label=mode.replace('_', ' ').title(), 
                       linewidth=2, alpha=0.8)
        except Exception as e:
            print(f"  ⚠️  Could not plot {mode}: {e}")
    
    ax.set_xlabel('Simulation Step', fontsize=12)
    ax.set_ylabel('Average Waiting Time (s)', fontsize=12)
    ax.set_title('Traffic Control Performance Comparison', fontsize=14, weight='bold')
    ax.legend(fontsize=11)
    ax.grid(True, alpha=0.3)
    
    plt.tight_layout()
    plt.savefig('inference_results/overall_comparison.png', dpi=300, bbox_inches='tight')
    plt.close()
    
    print("✓ Comparison plot saved: inference_results/overall_comparison.png")

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--mode', type=str, required=True, 
                       choices=['fixed', 'rl', 'rl_priority'])
    args = parser.parse_args()
    
    with open('config.yaml', 'r') as f:
        config = yaml.safe_load(f)
    
    os.makedirs('inference_results', exist_ok=True)
    log_file = f'inference_results/inference_log_{args.mode}.csv'
    
    run_inference(config, args.mode, log_file)
    
    # Try to generate comparison
    modes = ['fixed', 'rl', 'rl_priority']
    existing_modes = [m for m in modes if os.path.exists(f'inference_results/inference_log_{m}.csv')]
    
    if len(existing_modes) >= 2:
        plot_comparison(config, existing_modes)
