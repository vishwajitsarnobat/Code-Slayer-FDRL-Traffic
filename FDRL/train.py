import yaml
import multiprocessing
import time
import json
import pandas as pd
import matplotlib.pyplot as plt
from federated_server import FederatedServer
from federated_client import FederatedClient
from sumo_simulator import SumoSimulator
import os

def run_server(config):
    server = FederatedServer(config)
    server.start()

def run_client(junction_info, config):
    time.sleep(2)
    client = FederatedClient(junction_info, config)
    client.run()

def save_training_plot(log_file, output_path):
    """
    Reads the final training log and generates a high-quality, publication-ready plot.
    """
    print("Generating final training performance plot...")
    try:
        with open(log_file, 'r') as f:
            logs = json.load(f)
        if not logs:
            print("Log file is empty. Cannot generate plot.")
            return

        df = pd.DataFrame(logs)
        epochs = df['epoch']
        
        # --- PLOTTING STYLE FOR RESEARCH PAPERS ---
        plt.style.use('seaborn-v0_8-whitegrid')
        plt.rcParams['font.family'] = 'serif'
        plt.rcParams['font.serif'] = ['Times New Roman'] + plt.rcParams['font.serif']
        
        fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(10, 8), sharex=True)
        
        # --- Plot 1: Cumulative Reward ---
        reward_ma = df['cumulative_reward'].rolling(window=10, min_periods=1).mean()
        ax1.plot(epochs, df['cumulative_reward'], color='lightblue', alpha=0.8, label='Epoch Reward')
        ax1.plot(epochs, reward_ma, color='darkred', linewidth=2, label='10-Epoch Moving Average')
        ax1.set_ylabel("Average Cumulative Reward", fontsize=14)
        ax1.set_title("FDRL Training Performance", fontsize=16, weight='bold')
        ax1.legend(fontsize=12)
        ax1.tick_params(axis='both', which='major', labelsize=12)
        
        # --- Plot 2: Actor and Critic Loss ---
        ax2.plot(epochs, df['actor_loss'], color='tab:orange', linewidth=2, label='Actor Loss')
        ax2.plot(epochs, df['critic_loss'], color='tab:green', linewidth=2, label='Critic Loss')
        ax2.set_ylabel("Loss", fontsize=14)
        ax2.set_xlabel("Epoch", fontsize=14)
        ax2.legend(fontsize=12)
        ax2.tick_params(axis='both', which='major', labelsize=12)
        
        plt.tight_layout()
        plt.savefig(output_path, dpi=300)
        plt.close()
        print(f"✅ Training plot saved to {output_path}")

    except Exception as e:
        print(f"Could not generate training plot. Error: {e}")


if __name__ == '__main__':
    with open('config.yaml', 'r') as f:
        config = yaml.safe_load(f)

    # ... (code for getting junction details is the same) ...
    print("Getting junction details from SUMO network...")
    temp_sim = SumoSimulator(config['sumo']['config_file'], config, gui=False)
    controlled_junction_ids = config['system']['controlled_junctions']
    controlled_junctions_info = [temp_sim.junctions[j_id] for j_id in controlled_junction_ids]
    temp_sim.close()
    print(f"Found details for {len(controlled_junctions_info)} junctions to be controlled.")

    # --- Create and start processes (NO PLOT PROCESS) ---
    server_process = multiprocessing.Process(target=run_server, args=(config,))
    client_processes = [
        multiprocessing.Process(target=run_client, args=(j_info, config))
        for j_info in controlled_junctions_info
    ]
    
    server_process.start()
    for p in client_processes: p.start()

    try:
        server_process.join()
        for p in client_processes: p.join()
    except KeyboardInterrupt:
        print("\nInterrupted by user. Terminating processes...")
    finally:
        if server_process.is_alive(): server_process.terminate()
        for p in client_processes:
            if p.is_alive(): p.terminate()
        
        # Call final plot saving function at the end ---
        output_dir = "training_results"
        os.makedirs(output_dir, exist_ok=True)
        plot_path = os.path.join(output_dir, "training_performance_plot.png")
        save_training_plot(config['system']['log_file'], plot_path)
        
    print("Training finished.")