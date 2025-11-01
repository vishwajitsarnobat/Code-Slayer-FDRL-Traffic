# Vegha: A Full-Stack FDRL-Powered Traffic Management System

Project Vegha is a comprehensive, full-stack solution for modern urban traffic management. It integrates Federated Deep Reinforcement Learning (FDRL) for intelligent traffic signal control, a real-time SUMO (Simulation of Urban MObility) server for interactive visualization, and a sophisticated Next.js web dashboard for monitoring, analytics, and control.

## 🎥 Live Demo

See Project Vegha in action:

-   **Video Demonstrations**: [**Google Drive Folder**](https://drive.google.com/drive/folders/110K_4R7uMWAP8h64za_AL2TSHoPyFBgG)
-   **YouTube Channel**: [**Project Vegha Playlist**](https://www.youtube.com/@vriddhi04/videos)

## 🏛️ System Architecture

The project is composed of three core components that work together to provide a complete training, simulation, and management ecosystem.

1.  **FDRL (Federated Deep Reinforcement Learning Engine)**: The AI core of the project. This Python-based system uses a federated learning approach to train a Proximal Policy Optimization (PPO) agent. Each traffic junction learns from its local conditions, and a central server aggregates this knowledge to build a master policy, ensuring privacy and scalability.
2.  **SUMO Server (Live Simulation Backend)**: A Flask-SocketIO server that runs a SUMO simulation in real-time. It streams vehicle positions, traffic light states, and performance metrics via WebSockets to the frontend. It also exposes controls to interact with the simulation, such as closing or opening streets.
3.  **Vegha (Web Dashboard Frontend)**: A modern, responsive web application built with Next.js. It serves as the primary user interface, providing a rich dashboard with real-time metrics, an interactive map, event management, emergency vehicle tracking, and a live view of the SUMO simulation.

## ✨ Key Features

- **AI-Powered Control**: Utilizes Deep Reinforcement Learning to dynamically adjust traffic signals, reducing congestion and wait times.
- **Privacy-Preserving Training**: Employs Federated Learning, allowing the AI to learn from multiple junctions without centralizing sensitive traffic data.
- **Live Interactive Simulation**: A web-based view of the SUMO simulation that you can control in real-time.
- **Comprehensive Monitoring**: The Vegha dashboard offers detailed analytics on system status, vehicle flow, active events, and AI-powered predictions.
- **High-Fidelity Simulation**: Built on the Eclipse SUMO suite for realistic and accurate traffic modeling.

## 🚀 Getting Started

Follow these steps to set up and run the entire project locally.

### Prerequisites

- **Eclipse SUMO**: Version `1.24.0` or later. Ensure the `SUMO_HOME` environment variable is set.
- **Python**: Version `3.12`.
- **Node.js**: Version `20.x` or later.
- **uv (Recommended)**: A fast Python package manager. Install with `pip install uv`.

### 1. Clone the Repository

```bash
git clone https://github.com/vishwajitsarnobat/FDRL-Traffic
cd FDRL-Traffic
```

### 2. Setup the Python Backend (FDRL & SUMO Server)

This setup covers both the training engine and the live simulation server.

```bash
# Navigate to the FDRL directory which contains backend dependencies
cd FDRL

# Create and activate a virtual environment
uv venv
source .venv/bin/activate  # macOS/Linux
# .venv\Scripts\Activate.ps1 # Windows

# Install Python packages
uv sync
```

### 3. Setup the Frontend (Vegha Dashboard)

Open a new terminal for this step.

```bash
# Navigate to the Vegha directory
cd Vegha

# Install Node.js dependencies
bun install

# (Optional) Create a .env.local file for environment variables
# For local development, this is not strictly needed as it defaults to localhost
echo "NEXT_PUBLIC_SOCKET_IO_URL=http://localhost:5000" > .env.local
```

### 4. Running the System

1.  **Start the SUMO Simulation Server**:
    In your first terminal (with the Python environment activated):
    ```bash
    # Navigate back to the root if you are in the FDRL directory
    cd .. 
    cd sumo_server
    uv run server.py
    ```
    This will start the server on `http://localhost:5000`.

2.  **Start the Vegha Frontend**:
    In your second terminal:
    ```bash
    cd Vegha
    bun run dev
    ```
    The web dashboard will be available at `http://localhost:3000`.

3.  **Access the Dashboard**:
    Open your browser and navigate to **`http://localhost:3000`**. You can go to the dashboard and then to the simulation page to see the live traffic.

### (Optional) Training the AI Model

To train your own traffic control model, run the scripts in the `FDRL` directory.

1.  **Discover Junctions**:
    This script analyzes your SUMO map and updates `config.yaml` with the traffic light IDs.
    ```bash
    cd FDRL
    uv run discover_junction.py
    ```

2.  **Start Training**:
    This launches the federated server and multiple clients to train the model.
    ```bash
    uv run train.py
    ```
    The trained model will be saved as `saved_models/global_model.pth`.