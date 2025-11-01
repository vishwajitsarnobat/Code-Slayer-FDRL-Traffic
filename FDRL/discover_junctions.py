import yaml
from ruamel.yaml import YAML
from sumo_simulator import SumoSimulator
import sys
from collections import Counter # This was only imported inside a function, moving it to the top for better practice

def discover_and_update_config(config_path='config.yaml'):
    """
    Discovers ALL controllable junctions and updates the config file.
    Also calculates MAX_ROADS for universal model padding.
    """
    print("Starting temporary SUMO simulation to discover all junctions...")

    try:
        with open(config_path, 'r') as f:
            py_config = yaml.safe_load(f)
        
        # NOTE: SumoSimulator is expected to handle the traci connection and disconnection internally
        temp_sim = SumoSimulator(py_config['sumo']['config_file'], py_config, gui=False)
        all_junctions_info = temp_sim.junctions
        temp_sim.close() # Ensure traci connection is closed

    except FileNotFoundError:
        print(f"Error: Could not find the configuration file at '{config_path}'")
        sys.exit(1)
    except Exception as e:
        print(f"\nAn error occurred while trying to connect to SUMO.")
        print(f"Please check the path in '{config_path}' is correct and SUMO is installed/accessible.")
        print(f"   Original error: {e}")
        sys.exit(1)

    eligible_ids = list(all_junctions_info.keys())

    if not eligible_ids:
        print(f"\nFATAL: No junctions with traffic lights were found.")
        print("Please check your network file.")
        sys.exit(1)

    # Calculate max_roads for universal model
    road_counts = [len(j['incoming_roads']) for j in all_junctions_info.values()]
    max_roads = max(road_counts)
    
    # Count junction types
    type_distribution = Counter(road_counts)
    
    print(f"\n{'='*60}")
    print(f"JUNCTION DISCOVERY COMPLETE")
    print(f"{'='*60}")
    print(f"Total Junctions Found: {len(eligible_ids)}")
    print(f"\nJunction Type Distribution:")
    for num_roads in sorted(type_distribution.keys()):
        count = type_distribution[num_roads]
        print(f"  {num_roads}-way junctions: {count}")
    print(f"\nMaximum roads at any junction: {max_roads}")
    print(f"{'='*60}\n")
    
    print("Sample junctions:")
    for j_id in eligible_ids[:10]:
        num_roads = len(all_junctions_info[j_id]['incoming_roads'])
        print(f"  - {j_id} ({num_roads}-way)")
    if len(eligible_ids) > 10:
        print("  ...")
    
    # Use ruamel.yaml to update config
    ryaml = YAML()
    ryaml.preserve_quotes = True # Optional: Helps preserve style/comments
    with open(config_path, 'r') as f:
        config_data = ryaml.load(f)
    
    # Update controlled junctions
    config_data['system']['controlled_junctions'] = eligible_ids
    
    # CRITICAL: Update max_roads for universal model
    config_data['system']['max_roads'] = max_roads
    
    with open(config_path, 'w') as f:
        ryaml.dump(config_data, f)
    
    print(f"\nSUCCESS: Successfully updated '{config_path}':")
    print(f"   - {len(eligible_ids)} controlled junctions")
    print(f"   - max_roads = {max_roads} (for universal model padding)")
    print(f"\nWARNING: IMPORTANT: Run generate_tls_logic.py next to fix phantom signals!")

if __name__ == '__main__':
    discover_and_update_config()