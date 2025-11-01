# sumo_server/Dockerfile

# STEP 1: Start from the stable, full-featured Ubuntu 22.04 LTS image
FROM ubuntu:22.04

# Prevent interactive popups during package installation
ENV DEBIAN_FRONTEND=noninteractive

# STEP 2: Install system dependencies, add PPAs, and install Python/SUMO
RUN apt-get update && \
    # 2a. Install the basic tools needed to add new software repositories
    apt-get install -y software-properties-common gnupg && \
    \
    # 2b. Add the repository for Python 3.12
    add-apt-repository -y ppa:deadsnakes/ppa && \
    \
    # 2c. Add the repository for SUMO
    add-apt-repository -y ppa:sumo/stable && \
    \
    # 2d. IMPORTANT: Refresh the package list to include software from the new PPAs
    apt-get update && \
    \
    # 2e. Now that the system knows where to find them, install all packages
    apt-get install -y python3.12 python3.12-venv sumo sumo-tools sumo-doc && \
    \
    # 2f. Clean up downloaded package files
    rm -rf /var/lib/apt/lists/*

# STEP 3: Create a virtual environment
ENV VIRTUAL_ENV=/opt/venv
RUN python3.12 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Set the working directory for our application
WORKDIR /app

# Set environment variables so Python can find the 'traci' library
ENV SUMO_HOME=/usr/share/sumo
ENV PYTHONPATH="${SUMO_HOME}/tools"

# Copy and install our Python application's dependencies INTO THE VIRTUAL ENVIRONMENT
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code and the SUMO map files into the image
COPY . .
COPY Berlin ./Berlin

# Expose the port our server will run on
EXPOSE 5000

# Define the command to start our production server
CMD ["gunicorn", "--worker-class", "eventlet", "-w", "1", "--bind", "0.0.0.0:5000", "server:app"]