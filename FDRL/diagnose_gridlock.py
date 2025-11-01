"""
Quick simulation test to verify setup is working correctly.
"""

import yaml
import traci
import time

def test_simulation(duration_seconds=60):
    """
    Quick test to ensure SUMO simulation runs without errors.
    """
    print("="*70)
    print("QUICK SIMULATION TEST")
    print("="*70)
    
    with open('config.yaml', 'r') as f:
        config = yaml.safe_load(f)
    
    sumo_cmd = [
        "sumo-gui",
        "-c", config['sumo']['config_file'],
        "--start", "true",
        "--quit-on-end", "true"
    ]
    
    print("\nStarting SUMO...")
    try:
        traci.start(sumo_cmd)
    except Exception as e:
        print(f"✗ Failed to start SUMO: {e}")
        print("\nCheck:")
        print("  1. SUMO is installed")
        print("  2. config.yaml has correct path")
        print("  3. osm.sumocfg file exists")
        return
    
    print("✓ SUMO started successfully")
    
    controlled_junctions = config['system']['controlled_junctions']
    all_tls = traci.trafficlight.getIDList()
    
    print(f"\nNetwork info:")
    print(f"  Total traffic lights: {len(all_tls)}")
    print(f"  Controlled junctions: {len(controlled_junctions)}")
    
    print(f"\nRunning simulation for {duration_seconds} seconds...")
    
    step = 0
    total_wait_time = 0
    vehicle_count = 0
    
    try:
        while step < duration_seconds and traci.simulation.getMinExpectedNumber() > 0:
            traci.simulationStep()
            
            vehicles = traci.vehicle.getIDList()
            for v_id in vehicles:
                total_wait_time += traci.vehicle.getWaitingTime(v_id)
            vehicle_count += len(vehicles)
            
            step += 1
            
            if step % 10 == 0:
                print(f"  Step {step}: {len(vehicles)} vehicles active")
        
        print("\n✓ Simulation completed successfully")
        
        if vehicle_count > 0:
            avg_wait = total_wait_time / vehicle_count
            print(f"\nBasic metrics:")
            print(f"  Average wait time: {avg_wait:.2f}s")
            print(f"  Total vehicles: {vehicle_count}")
        
    except KeyboardInterrupt:
        print("\n⚠ Interrupted by user")
    except Exception as e:
        print(f"\n✗ Error during simulation: {e}")
    finally:
        traci.close()
    
    print("\n" + "="*70)
    print("TEST COMPLETE")
    print("="*70)
    print("\nIf this ran without errors, you're ready to:")
    print("  1. Train: python train.py")
    print("  2. Test: python infer.py --mode [fixed|rl|rl_priority]")
    print("="*70 + "\n")

if __name__ == '__main__':
    test_simulation()