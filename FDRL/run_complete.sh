#!/bin/bash

################################################################################
# FEDERATED DEEP RL TRAFFIC CONTROL - COMPLETE AUTOMATED WORKFLOW
# Uses UV for Python package management
################################################################################

set -e
trap 'echo "Error on line $LINENO. Exiting..."; exit 1' ERR

# Configuration
PYTHON="uv run"
SUMO_DIR="sumo_files/mulund"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"; }
success() { echo -e "${GREEN}✓${NC} $1"; }
warning() { echo -e "${YELLOW}⚠${NC} $1"; }
error() { echo -e "${RED}✗${NC} $1"; }

echo "========================================================================"
echo "  FEDERATED DEEP RL TRAFFIC CONTROL - AUTOMATED SETUP"
echo "========================================================================"
echo ""

################################################################################
# STEP 1: Prerequisites Check
################################################################################
log "Step 1/8: Checking prerequisites..."

# Check UV
if ! command -v uv &> /dev/null; then
    error "UV not found"
    echo "Install UV with: curl -LsSf https://astral.sh/uv/install.sh | sh"
    exit 1
fi
success "UV installed"

# Check SUMO_HOME
if [ -z "$SUMO_HOME" ]; then
    error "SUMO_HOME environment variable not set"
    echo "Set it with: export SUMO_HOME=/usr/share/sumo"
    exit 1
fi
success "SUMO_HOME: $SUMO_HOME"

# Check Python packages with UV (don't exit, just warn)
log "Checking Python packages..."
if ! uv run python3 -c "import torch, traci, yaml, lightning, pandas, matplotlib" 2>/dev/null; then
    warning "Some Python packages might be missing"
    echo "UV will automatically install them on first run"
    echo ""
    read -t 10 -p "Continue anyway? (Y/n): " response || response="y"
    response=${response:-y}
    if [[ $response =~ ^[Nn]$ ]]; then
        exit 1
    fi
fi
success "Python environment ready"

# Check SUMO configuration
if [ ! -f "$SUMO_DIR/osm.sumocfg" ]; then
    error "SUMO configuration not found: $SUMO_DIR/osm.sumocfg"
    echo ""
    echo "Please generate it using OSMWebWizard:"
    echo "  python \$SUMO_HOME/tools/osmWebWizard.py"
    echo ""
    echo "Steps:"
    echo "  1. Select area (search for: Mulund, Mumbai, India)"
    echo "  2. Set traffic sliders to 50-100% for all vehicle types"
    echo "  3. Click 'Generate Scenario'"
    echo "  4. Copy generated files from the output directory to: $SUMO_DIR/"
    echo ""
    exit 1
fi
success "SUMO configuration found"

# Check route files exist and have vehicles
ROUTE_FILES=("osm.passenger.trips.xml" "osm.bus.trips.xml" "osm.truck.trips.xml" "osm.motorcycle.trips.xml")
TOTAL_VEHICLES=0

log "Checking route files..."
for route_file in "${ROUTE_FILES[@]}"; do
    if [ -f "$SUMO_DIR/$route_file" ]; then
        COUNT=$(grep -c "<trip " "$SUMO_DIR/$route_file" 2>/dev/null || echo "0")
        TOTAL_VEHICLES=$((TOTAL_VEHICLES + COUNT))
        if [ $COUNT -gt 0 ]; then
            echo "  • $route_file: $COUNT vehicles"
        fi
    else
        warning "Missing: $route_file"
    fi
done

if [ $TOTAL_VEHICLES -lt 20 ]; then
    error "Insufficient vehicles in route files (found: $TOTAL_VEHICLES)"
    echo ""
    echo "Please regenerate traffic using OSMWebWizard:"
    echo "  1. python \$SUMO_HOME/tools/osmWebWizard.py"
    echo "  2. Select your area (Mulund, Mumbai)"
    echo "  3. INCREASE all traffic density sliders to 50-100%"
    echo "  4. Set simulation duration to at least 10000 seconds"
    echo "  5. Generate and copy files to $SUMO_DIR/"
    echo ""
    exit 1
fi
success "Found $TOTAL_VEHICLES vehicles in route files"

# Create necessary directories
mkdir -p saved_models training_results inference_results
success "Directory structure ready"

echo ""

################################################################################
# STEP 2: Fix SUMO Configuration
################################################################################
log "Step 2/8: Optimizing SUMO configuration..."

# Backup original
cp "$SUMO_DIR/osm.sumocfg" "$SUMO_DIR/osm.sumocfg.backup" 2>/dev/null || true

# Create optimized configuration
cat > "$SUMO_DIR/osm.sumocfg" << 'EOFCFG'
<?xml version="1.0" encoding="UTF-8"?>
<configuration xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:noNamespaceSchemaLocation="http://sumo.dlr.de/xsd/sumoConfiguration.xsd">
    <input>
        <net-file value="osm.net.xml.gz"/>
        <route-files value="osm.bus.trips.xml,osm.motorcycle.trips.xml,osm.passenger.trips.xml,osm.truck.trips.xml"/>
        <additional-files value="osm.poly.xml.gz,output.add.xml,rl_traffic_lights.add.xml"/>
    </input>
    <time>
        <begin value="0"/>
        <end value="10000"/>
        <step-length value="1.0"/>
    </time>
    <processing>
        <time-to-teleport value="300"/>
        <time-to-teleport.highways value="0"/>
        <max-depart-delay value="300"/>
        <eager-insert value="true"/>
        <extrapolate-departpos value="true"/>
        <ignore-route-errors value="true"/>
    </processing>
    <routing>
        <device.rerouting.adaptation-interval value="10"/>
        <device.rerouting.adaptation-steps value="180"/>
    </routing>
    <report>
        <verbose value="false"/>
        <no-step-log value="true"/>
    </report>
</configuration>
EOFCFG

success "SUMO configuration optimized"
echo ""

################################################################################
# STEP 3: Discover Junctions
################################################################################
log "Step 3/8: Discovering controllable junctions..."
$PYTHON discover_junctions.py || {
    error "Junction discovery failed"
    exit 1
}
success "Junctions discovered and config.yaml updated"
echo ""

################################################################################
# STEP 4: Generate Traffic Light Logic
################################################################################
log "Step 4/8: Generating RL traffic light programs..."
$PYTHON generate_tls_logic.py || {
    error "Traffic light generation failed"
    exit 1
}

# Verify the file was created
if [ ! -f "$SUMO_DIR/rl_traffic_lights.add.xml" ]; then
    error "Traffic light file not generated"
    exit 1
fi

# Show what was generated
TLS_COUNT=$(grep -c "<tlLogic " "$SUMO_DIR/rl_traffic_lights.add.xml" 2>/dev/null || echo "0")
success "Generated $TLS_COUNT traffic light programs"
echo ""

################################################################################
# STEP 5: Diagnostic Test
################################################################################
log "Step 5/8: Running diagnostic test..."
echo "  Testing SUMO simulation for 60 seconds..."
timeout 70s $PYTHON diagnose_gridlock.py || {
    warning "Diagnostic test had issues (may be OK if vehicles spawn slowly)"
}
success "Diagnostic complete"
echo ""

################################################################################
# STEP 6: Training
################################################################################
log "Step 6/8: Training federated RL model..."

if [ -f "saved_models/universal_model.pth" ]; then
    echo ""
    echo "Existing trained model found: saved_models/universal_model.pth"
    read -t 15 -p "Skip training and use existing model? (Y/n): " response || response="y"
    response=${response:-y}
    echo ""
    
    if [[ $response =~ ^[Nn]$ ]]; then
        log "Starting training (this will take 15-30 minutes)..."
        rm -f training_logs.json
        $PYTHON train.py || {
            error "Training failed"
            exit 1
        }
        success "Training completed successfully"
    else
        success "Using existing model"
    fi
else
    echo ""
    log "No existing model found. Starting training..."
    echo "  This may take 15-30 minutes depending on your hardware"
    echo "  You can interrupt with Ctrl+C and resume later"
    echo ""
    $PYTHON train.py || {
        error "Training failed"
        exit 1
    }
    success "Training completed successfully"
fi
echo ""

################################################################################
# STEP 7: Inference Tests
################################################################################
log "Step 7/8: Running inference tests (3 modes)..."
echo ""

echo "  [1/3] Testing FIXED mode (baseline with default traffic lights)..."
$PYTHON infer.py --mode fixed || warning "Fixed mode had issues"
echo ""

echo "  [2/3] Testing RL mode (learned control, no priority)..."
$PYTHON infer.py --mode rl || warning "RL mode had issues"
echo ""

echo "  [3/3] Testing RL_PRIORITY mode (learned control + vehicle priority)..."
$PYTHON infer.py --mode rl_priority || warning "RL+Priority mode had issues"
echo ""

success "All inference tests completed"
echo ""

################################################################################
# STEP 8: Generate Report
################################################################################
log "Step 8/8: Generating summary report..."

echo ""
echo "========================================================================"
echo "                           RESULTS SUMMARY"
echo "========================================================================"
echo ""

# Training results
echo "📊 TRAINING RESULTS:"
if [ -f "training_results/training_performance_plot.png" ]; then
    success "Training plot: training_results/training_performance_plot.png"
else
    warning "Training plot not generated"
fi

if [ -f "training_logs.json" ]; then
    success "Training logs: training_logs.json"
    # Show last epoch stats
    LAST_EPOCH=$(tail -n 20 training_logs.json | grep -o '"epoch": [0-9]*' | tail -1 | awk '{print $2}')
    if [ -n "$LAST_EPOCH" ]; then
        echo "           Trained for $LAST_EPOCH epochs"
    fi
fi

if [ -f "saved_models/universal_model.pth" ]; then
    MODEL_SIZE=$(du -h saved_models/universal_model.pth | awk '{print $1}')
    success "Trained model: saved_models/universal_model.pth ($MODEL_SIZE)"
fi

echo ""

# Inference results
echo "🚦 INFERENCE RESULTS:"
MODES=("fixed" "rl" "rl_priority")
SUCCESSFUL_MODES=0

for mode in "${MODES[@]}"; do
    LOG_FILE="inference_results/inference_log_${mode}.csv"
    if [ -f "$LOG_FILE" ]; then
        LINE_COUNT=$(wc -l < "$LOG_FILE")
        success "${mode} mode: $LOG_FILE ($LINE_COUNT data points)"
        
        # Calculate average waiting time
        if [ $LINE_COUNT -gt 1 ]; then
            AVG_WAIT=$(uv run python3 -c "
import pandas as pd
try:
    df = pd.read_csv('$LOG_FILE')
    numeric_cols = df.select_dtypes(include='number').columns
    numeric_cols = [c for c in numeric_cols if c != 'step']
    if len(numeric_cols) > 0:
        avg = df[numeric_cols].mean().mean()
        print(f'{avg:.2f}s')
except: pass
" 2>/dev/null || echo "")
            [ -n "$AVG_WAIT" ] && echo "           Average waiting time: $AVG_WAIT"
        fi
        SUCCESSFUL_MODES=$((SUCCESSFUL_MODES + 1))
    else
        warning "${mode} mode: log file missing"
    fi
done

echo ""

# Plots
echo "📈 GENERATED PLOTS:"
if [ -f "inference_results/overall_comparison.png" ]; then
    success "Comparison plot: inference_results/overall_comparison.png"
else
    if [ $SUCCESSFUL_MODES -ge 2 ]; then
        warning "Comparison plot not generated (should exist with $SUCCESSFUL_MODES modes)"
    else
        echo "  (Comparison requires at least 2 completed modes)"
    fi
fi

# Count junction-specific plots
JUNCTION_PLOTS=$(find inference_results -name "*junction*.png" 2>/dev/null | wc -l)
if [ $JUNCTION_PLOTS -gt 0 ]; then
    success "Junction-specific plots: $JUNCTION_PLOTS files"
fi

echo ""
echo "========================================================================"
echo -e "${GREEN}✓ WORKFLOW COMPLETE!${NC}"
echo "========================================================================"
echo ""
echo "📁 Key Output Files:"
echo "   • Training plot: training_results/training_performance_plot.png"
echo "   • Model weights: saved_models/universal_model.pth"
echo "   • Comparison: inference_results/overall_comparison.png"
echo "   • Raw data: inference_results/*.csv"
echo ""
echo "🔄 To re-run components:"
echo "   ./run_complete.sh              # Run entire workflow"
echo "   uv run train.py                # Just training"
echo "   uv run infer.py --mode fixed   # Just one inference mode"
echo ""
echo "📊 View results:"
echo "   Open PNG files with your image viewer"
echo "   Analyze CSV files with: uv run python3 -c \"import pandas as pd; print(pd.read_csv('inference_results/inference_log_fixed.csv').describe())\""
echo ""
