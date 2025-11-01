# sumo_simulator.py (CORRECTED)

import os
import sys
import numpy as np
import traci
import warnings
from collections import defaultdict

# In sumo_simulator.py

class SumoSimulator:
    def __init__(self, config_file, config, step_length=1.0, gui=False, queue_dist=150): # Add config
        self.config_file = config_file
        self.step_length = step_length
        self.gui = gui
        self.queue_detection_distance = queue_dist
        
        # Store priority weights from the config
        self.priority_weights = config['priority_weights']
        
        self._start_simulation()
        
        self.junctions = self._get_junctions_and_phase_maps()
        
        # We will now track WEIGHTED waiting time for the reward
        self.last_weighted_waiting_times = {j_id: 0.0 for j_id in self.junctions}

        self.phase_timers = {}
        self.current_actions = {}

    def _start_simulation(self):
        if 'SUMO_HOME' in os.environ:
            tools = os.path.join(os.environ['SUMO_HOME'], 'tools')
            sys.path.append(tools)
        else:
            sys.exit("Please declare environment variable 'SUMO_HOME'")

        sumo_binary = "sumo-gui" if self.gui else "sumo"
        sumo_cmd = [
            sumo_binary, "-c", self.config_file, "--step-length", str(self.step_length), 
            "--no-warnings", "true", "--time-to-teleport", "-1"
        ]
        traci.start(sumo_cmd)

    def _get_junctions_and_phase_maps(self):
        """
        Discovers junctions, their roads, AND dynamically creates a map from our
        action index (0, 1, 2...) to the correct green phase index in SUMO.
        """
        junctions = {}
        junction_ids = traci.trafficlight.getIDList()
        
        for j_id in junction_ids:
            incoming_roads = sorted(list(set([traci.lane.getEdgeID(lane) for lane in set(traci.trafficlight.getControlledLanes(j_id))])))
            
            action_to_phase_map = {}
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                logic = traci.trafficlight.getCompleteRedYellowGreenDefinition(j_id)
            
            if not logic: continue # Skip if no logic is defined
            
            green_phases = {}
            for i, phase in enumerate(logic[0].phases):
                state = phase.state.lower()
                if 'y' not in state and 'g' in state:
                    green_link_indices = [idx for idx, char in enumerate(state) if char == 'g']
                    for link_idx in green_link_indices:
                        try:
                            controlled_lanes = traci.trafficlight.getControlledLanes(j_id)
                            incoming_road = traci.lane.getEdgeID(controlled_lanes[link_idx])
                            if incoming_road not in green_phases:
                                green_phases[incoming_road] = i
                        except IndexError:
                            continue
            
            for action_idx, road_id in enumerate(incoming_roads):
                if road_id in green_phases:
                    action_to_phase_map[action_idx] = green_phases[road_id]

            junctions[j_id] = {
                "id": j_id,
                "incoming_roads": incoming_roads,
                "action_to_phase": action_to_phase_map
            }
        return junctions

    def set_phase(self, junction_id, action_index, yellow_time, green_time):
        """A simplified and more robust phase setting logic."""
        if action_index not in self.junctions[junction_id]['action_to_phase']:
            for _ in range(green_time):
                self.simulation_step()
            return

        target_green_phase_index = self.junctions[junction_id]['action_to_phase'][action_index]
        traci.trafficlight.setPhase(junction_id, target_green_phase_index)
        for _ in range(green_time):
            self.simulation_step()
    
    def get_state(self, junction_id):
        state = []
        junction_info = self.junctions[junction_id]
        
        for road_id in junction_info['incoming_roads']:
            lane_count = traci.edge.getLaneNumber(road_id)
            lanes = [f"{road_id}_{i}" for i in range(lane_count)]
            
            weighted_queue_length = 0.0
            weighted_max_wait_time = 0.0 # We will now use the individual vehicle's wait time

            for lane_id in lanes:
                vehicles = traci.lane.getLastStepVehicleIDs(lane_id)
                
                # Calculate weighted queue
                for v_id in vehicles:
                    if traci.vehicle.getSpeed(v_id) < 0.1:
                        v_type = traci.vehicle.getTypeID(v_id)
                        # Use a default weight of 1.0 if type is not in config
                        weight = self.priority_weights.get(v_type, 1.0)
                        weighted_queue_length += weight
                
                # Find the highest weighted waiting time on this road
                # This is more accurate than weighting the lane's total time
                for v_id in vehicles:
                    v_type = traci.vehicle.getTypeID(v_id)
                    weight = self.priority_weights.get(v_type, 1.0)
                    vehicle_wait_time = traci.vehicle.getWaitingTime(v_id)
                    
                    # We want the wait time of the highest priority vehicle
                    if vehicle_wait_time * weight > weighted_max_wait_time:
                         weighted_max_wait_time = vehicle_wait_time * weight
            
            state.extend([weighted_queue_length, weighted_max_wait_time])
            
        return np.array(state, dtype=np.float32)

    def get_reward(self, junction_id):
        REWARD_SCALING_FACTOR = 100.0 

        total_weighted_waiting_time = 0.0
        junction_info = self.junctions[junction_id]
        
        for road_id in junction_info['incoming_roads']:
            lane_count = traci.edge.getLaneNumber(road_id)
            lanes = [f"{road_id}_{i}" for i in range(lane_count)]
            for lane_id in lanes:
                vehicles = traci.lane.getLastStepVehicleIDs(lane_id)
                for v_id in vehicles:
                    v_type = traci.vehicle.getTypeID(v_id)
                    weight = self.priority_weights.get(v_type, 1.0)
                    total_weighted_waiting_time += traci.vehicle.getWaitingTime(v_id) * weight

        reward = self.last_weighted_waiting_times[junction_id] - total_weighted_waiting_time
        self.last_weighted_waiting_times[junction_id] = total_weighted_waiting_time
        
        return reward / REWARD_SCALING_FACTOR

    def simulation_step(self):
        traci.simulationStep()

    def init_phase_timers(self, junction_ids):
        self.phase_timers = {j_id: 0 for j_id in junction_ids}
        self.current_actions = {j_id: 0 for j_id in junction_ids}

    def update_phase_timers(self):
        for j_id in self.phase_timers:
            self.phase_timers[j_id] += 1

    def set_phase_inference(self, junction_id, action_index, yellow_time):
        if action_index not in self.junctions[junction_id]['action_to_phase']:
            return
        target_green_phase_index = self.junctions[junction_id]['action_to_phase'][action_index]
        # In inference, we simplify and directly set the green phase. SUMO's default
        # junction logic will handle any necessary intermediate steps.
        traci.trafficlight.setPhase(junction_id, target_green_phase_index)
        self.phase_timers[junction_id] = 0
        self.current_actions[junction_id] = action_index

    def close(self):
        traci.close()