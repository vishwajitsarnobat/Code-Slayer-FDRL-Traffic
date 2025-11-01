import socket
import pickle
import torch
import numpy as np
import time
from torch.distributions import Categorical
from ppo_agent import PPOAgent, Memory
from sumo_simulator import SumoSimulator
from lightning.fabric import Fabric

class FederatedClient:
    
    def __init__(self, junction_info, config):
        self.junction_id = junction_info['id']
        self.incoming_roads = junction_info['incoming_roads']
        self.actual_action_dim = len(self.incoming_roads)
        
        self.max_roads = config['system']['max_roads']
        self.state_dim = 2 * self.max_roads
        self.action_dim = self.max_roads
        self.config = config
        
        print(f"\n{'='*50}")
        print(f"CLIENT: {self.junction_id[:30]}")
        print(f"{'='*50}")
        print(f"Junction Type: {self.actual_action_dim}-way")
        print(f"Model Dims: {self.action_dim} actions (universal)")
        print(f"{'='*50}\n")
        
        self.fabric = Fabric(accelerator="auto", devices=1)
        self.fabric.launch()
        
        self.agent = PPOAgent(self.state_dim, self.action_dim, config, fabric=self.fabric)
        self.memory = Memory()
        self.server_host = config['system']['server_host']
        self.server_port = config['system']['server_port']
        self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    
    def connect_to_server(self):
        """Connect with retry logic."""
        max_retries = 15
        retry_delay = 2
        
        for attempt in range(max_retries):
            try:
                self.socket.connect((self.server_host, self.server_port))
                print(f"✓ Client {self.junction_id[:20]} connected")
                
                meta_data = {
                    'junction_id': self.junction_id,
                    'state_dim': self.state_dim,
                    'action_dim': self.actual_action_dim
                }
                self.socket.sendall(pickle.dumps(meta_data))
                return
            except ConnectionRefusedError:
                if attempt < max_retries - 1:
                    print(f"  Client {self.junction_id[:20]}: Retry {attempt+1}/{max_retries}...")
                    time.sleep(retry_delay)
                else:
                    raise ConnectionRefusedError(f"Failed to connect after {max_retries} attempts")
    
    def select_action_with_masking(self, state):
        """Select action using universal model with masking."""
        state_tensor = torch.FloatTensor(state).to(self.fabric.device)
        
        with torch.no_grad():
            action_probs = self.agent.actor_old(state_tensor)
            mask = torch.zeros(self.action_dim, device=self.fabric.device)
            mask[:self.actual_action_dim] = 1.0
            masked_probs = action_probs * mask
            masked_probs = masked_probs / (masked_probs.sum() + 1e-10)
            dist = Categorical(masked_probs)
            action = dist.sample()
            action_log_prob = dist.log_prob(action)
        
        return action.item(), action_log_prob.item()
    
    def run(self):
        """Main training loop."""
        self.connect_to_server()
        
        sim = SumoSimulator(
            self.config['sumo']['config_file'],
            self.config,
            step_length=self.config['sumo']['step_length'],
            gui=False
        )
        
        for epoch in range(self.config['fdrl']['epochs']):
            # Receive global model
            data_size_bytes = self.socket.recv(8)
            if not data_size_bytes:
                break
            
            data_size = int.from_bytes(data_size_bytes, 'big')
            received_data = b""
            while len(received_data) < data_size:
                received_data += self.socket.recv(4096)
            
            global_weights = pickle.loads(received_data)
            global_weights = {k: v.to(self.fabric.device) for k, v in global_weights.items()}
            
            self.agent.actor.load_state_dict(global_weights)
            self.agent.actor_old.load_state_dict(global_weights)
            
            # Local training
            cumulative_reward = 0
            for k_step in range(self.config['fdrl']['K']):
                state = sim.get_state(self.junction_id)
                action, log_prob = self.select_action_with_masking(state)
                
                self.memory.states.append(state)
                self.memory.actions.append(action)
                self.memory.logprobs.append(log_prob)
                
                sim.set_phase(
                    self.junction_id,
                    action,
                    self.config['fdrl']['yellow_time'],
                    self.config['fdrl']['green_time']
                )
                
                reward = sim.get_reward(self.junction_id)
                self.memory.rewards.append(reward)
                self.memory.is_terminals.append(False)
                cumulative_reward += reward
            
            loss, actor_loss, critic_loss = self.agent.update(self.memory)
            self.memory.clear_memory()
            
            # Send update
            payload = {
                'weights': {k: v.cpu() for k, v in self.agent.actor.state_dict().items()},
                'log': {
                    'cumulative_reward': cumulative_reward,
                    'actor_loss': actor_loss,
                    'critic_loss': critic_loss
                }
            }
            data_bytes = pickle.dumps(payload)
            self.socket.sendall(len(data_bytes).to_bytes(8, 'big'))
            self.socket.sendall(data_bytes)
            
            if epoch % 10 == 0:
                print(f"  Epoch {epoch+1}: R={cumulative_reward:.2f}")
        
        sim.close()
        self.socket.close()
