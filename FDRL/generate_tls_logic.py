"""
Simple Traffic Light Logic Generator
Generates only RL-controlled programs for specified junctions.
All other junctions use their default SUMO programs.
"""

import os
import sys
import yaml
import traci
from xml.etree.ElementTree import Element, SubElement, tostring
from xml.dom.minidom import parseString
from sumo_simulator import SumoSimulator

def generate_rl_tls_programs(config_path='config.yaml'):
    """
    Generates RL-controlled programs ONLY for controlled junctions.
    Other junctions keep their default SUMO behavior.
    """
    print("="*70)
    print("GENERATING RL TRAFFIC LIGHT PROGRAMS")
    print("="*70)
    
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)
    
    print("\nStarting temporary SUMO simulation...")
    temp_sim = SumoSimulator(config['sumo']['config_file'], config, gui=False)
    
    controlled_junction_ids = config['system']['controlled_junctions']
    
    print(f"Controlled junctions: {len(controlled_junction_ids)}")
    
    # Generate XML
    xml_root = Element('additional')
    
    for tls_id in controlled_junction_ids:
        if tls_id not in temp_sim.junctions:
            print(f"  ✗ {tls_id}: Not found in network")
            continue
        
        junction_info = temp_sim.junctions[tls_id]
        incoming_roads = junction_info['incoming_roads']
        
        # Get number of signal groups
        controlled_links = traci.trafficlight.getControlledLinks(tls_id)
        num_signals = len(controlled_links)
        
        # Create RL program with simple phases
        tl_logic = SubElement(xml_root, 'tlLogic', {
            'id': tls_id,
            'type': 'static',
            'programID': 'rl_program',
            'offset': '0'
        })
        
        # Create one phase per incoming road (simple green phases)
        for phase_idx, road in enumerate(incoming_roads):
            # All red by default
            state = ['r'] * num_signals
            
            # Find links controlled by this road and set them green
            for link_idx, links in enumerate(controlled_links):
                if links:
                    from_lane = links[0][0]
                    from_edge = traci.lane.getEdgeID(from_lane)
                    if from_edge == road:
                        state[link_idx] = 'G'
            
            # Green phase
            SubElement(tl_logic, 'phase', {
                'duration': str(config['fdrl']['green_time']),
                'state': ''.join(state)
            })
            
            # Yellow phase
            yellow_state = ''.join(state).replace('G', 'y')
            SubElement(tl_logic, 'phase', {
                'duration': str(config['fdrl']['yellow_time']),
                'state': yellow_state
            })
        
        print(f"  ✓ {tls_id}: {len(incoming_roads)} phases created")
    
    temp_sim.close()
    
    # Save XML
    xml_string = tostring(xml_root, 'utf-8')
    pretty_xml = parseString(xml_string).toprettyxml(indent="    ")
    pretty_xml = '\n'.join([line for line in pretty_xml.split('\n') if line.strip()])
    
    sumo_dir = os.path.dirname(config['sumo']['config_file'])
    output_path = os.path.join(sumo_dir, "rl_traffic_lights.add.xml")
    
    with open(output_path, 'w') as f:
        f.write(pretty_xml)
    
    print(f"\n{'='*70}")
    print(f"SUCCESS: RL programs generated")
    print(f"  File: {output_path}")
    print(f"  Junctions: {len(controlled_junction_ids)}")
    print(f"{'='*70}")
    print("\nNEXT: Add to osm.sumocfg:")
    print('  <additional-files value="rl_traffic_lights.add.xml"/>')
    print("="*70)

if __name__ == '__main__':
    generate_rl_tls_programs()