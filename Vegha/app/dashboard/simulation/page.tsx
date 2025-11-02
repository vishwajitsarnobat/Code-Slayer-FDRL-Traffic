// Vegha/app/dashboard/simulation/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import Card from '@/components/Card';
import {
  Activity,
  Car,
  Clock,
  TrafficCone,
  MapPin,
} from 'lucide-react';



// ✅ FIX: Use HTTPS for production (wss:// will be automatic)
const sumoServerUrl = process.env.NEXT_PUBLIC_SUMO_SERVER_URL || 'https://own.vikasrajyadav.com';


interface SimulationMetrics {
  vehicleCount: number;
  avgSpeed: number;
  waiting: number;
  simTime: number;
  signals: number;
  avgWaitTime: number;
  congestionPercent: number;
}

export default function SimulationPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  
  const [metrics, setMetrics] = useState<SimulationMetrics>({
    vehicleCount: 0,
    avgSpeed: 0,
    waiting: 0,
    simTime: 0,
    signals: 0, // Start at 0
    avgWaitTime: 0.0,
    congestionPercent: 0
  });

  useEffect(() => {
    // Initialize Socket.IO connection with the correct URL
    const socketInstance = io(sumoServerUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      secure:true,
      reconnectionAttempts: 5
    });

    socketInstance.on('connect', () => {
      console.log('Connected to SUMO backend via Socket.IO');
      setIsConnected(true);
      setIsLoading(false); // Stop loading once connected
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from SUMO backend');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (err) => {
      console.error('Socket.IO connection error:', err);
      setError('Failed to connect to simulation server. Check if the backend is running.');
      setIsLoading(false);
    });

    // Listen for simulation updates
    socketInstance.on('update', (data: any) => {
      setMetrics({
        vehicleCount: Object.keys(data.vehicles || {}).length,
        avgSpeed: data.avg_speed || 0,
        waiting: data.waiting || 0,
        simTime: data.time || 0,
        signals: Object.keys(data.traffic_lights || {}).length,
        avgWaitTime: data.avg_wait_time || 0.0,
        congestionPercent: data.congestion_percent || 0
      });
    });

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-blue-500 bg-clip-text ">
              Vegha Traffic Simulation
            </h1>
            <p className="text-gray-400 mt-2 flex items-center gap-2">
              <span className={`inline-block w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
              Real-time SUMO traffic simulation with live metrics
            </p>
          </div>
          
          <button
            onClick={handleRefresh}
            className="px-6 py-3  bg-blue-900  text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
          >
             Refresh
          </button>
        </div>

        {/* SUMO Simulation Iframe Container */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl shadow-2xl overflow-hidden mb-6 h-[calc(100vh-100px)]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-400 text-lg">
                  Connecting to Simulation Server...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-red-500">
                <p className="text-2xl mb-2">⚠️ Connection Error</p>
                <p className="text-gray-400">{error}</p>
                <button
                  onClick={handleRefresh}
                  className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <iframe
              src={sumoServerUrl} // <-- ✨ USE THE DYNAMIC URL
              className="w-full h-full border-0"
              title="SUMO Traffic Simulation"
              allow="fullscreen"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            />
          )}
        </div>

        {/* Simulation Statistics Section */}
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            {/* <span className="text-3xl">📊</span> */}
            Simulation Statistics
          </h2>
        </div>

        {/* Metrics Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-6">
          
          <Card
            title="Simulation Step"
            value={metrics.simTime}
            icon={Activity}
            iconBgColor="bg-gradient-to-br from-blue-500 to-blue-600"
            subtitle="Current simulation step"
            status={{ text: isConnected ? 'Live' : 'Disconnected', color: isConnected ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400', dotColor: isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-500' }}
          />
          <Card
            title="Total Vehicles"
            value={metrics.vehicleCount}
            icon={Car}
            iconBgColor="bg-gradient-to-br from-purple-500 to-indigo-600"
            subtitle="Active vehicles in simulation"
            status={{ text: isConnected ? 'Live count' : 'Static', color: isConnected ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400', dotColor: isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-500' }}
          />
          <Card
            title="Waiting Vehicles"
            value={metrics.waiting}
            icon={TrafficCone}
            iconBgColor="bg-gradient-to-br from-orange-500 to-red-500"
            subtitle="Vehicles waiting at signals"
            status={{ text: isConnected ? 'Real-time' : 'Calculated', color: isConnected ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400', dotColor: isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-500' }}
          />
          <Card
            title="Average Speed"
            value={`${metrics.avgSpeed.toFixed(1)} km/h`}
            icon={Clock}
            iconBgColor="bg-gradient-to-br from-green-500 to-emerald-600"
            subtitle="Mean vehicle speed"
            status={{ text: isConnected ? 'Real-time' : 'Calculated', color: isConnected ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400', dotColor: isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-500' }}
          />
          <Card
            title="Total Signals"
            value={metrics.signals}
            icon={MapPin}
            iconBgColor="bg-gradient-to-br from-cyan-500 to-blue-500"
            subtitle="Traffic signals in network"
            status={{ text: 'Network total', color: 'text-gray-500 dark:text-gray-400', dotColor: 'bg-gray-500' }}
          />
        </div>

        {/* Connection Info Panel */}
        <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-800/50 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-start space-x-4">
              {/* <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                ℹ️
              </div> */}
            <div className="flex-1">
              <h3 className="font-bold text-blue-100 mb-2 text-lg">
                Connection Information
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-blue-300">Endpoint:</span>
                  <code className="bg-blue-900/50 px-3 py-1 rounded text-blue-200 text-sm font-mono">
                    {sumoServerUrl} 
                  </code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-blue-300">Status:</span>
                  <span className={`px-3 py-1 rounded text-sm font-medium ${isConnected ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                    {isConnected ? '● Connected' : '● Disconnected'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-blue-300">Protocol:</span>
                  <span className="text-blue-200 text-sm">Socket.IO • Real-time updates enabled</span>
                </div>
              </div>
              <p className="text-sm text-blue-400 mt-3">
                Make sure SUMO server is running on the backend. Metrics update in real-time via WebSocket connection.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}