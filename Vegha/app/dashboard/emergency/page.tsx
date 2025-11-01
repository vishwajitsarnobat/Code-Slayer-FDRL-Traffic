export const dynamic = "force-dynamic";


import { Suspense } from 'react'
import { 
  Truck, 
  MapPin, 
  Clock, 
  AlertTriangle,
  Shield,
  Route,
  RefreshCw,
  Car,
  Activity
} from 'lucide-react'
import { 
  getEmergencyVehicles, 
  getEmergencyPriorityColor, 
  getEmergencyStatusBadge,
  formatWaitTime,
  type EmergencyData,
  type EmergencyVehicle,
  type VIPMovementAlert
} from '@/lib/api'

// Helper function to format timestamp
function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp)
    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  } catch {
    return timestamp
  }
}

// Helper function to get vehicle type icon
function getVehicleIcon(type: string) {
  switch (type.toLowerCase()) {
    case 'ambulance':
      return <Activity className="w-5 h-5" />
    case 'fire_truck':
      return <AlertTriangle className="w-5 h-5" />
    case 'police':
      return <Shield className="w-5 h-5" />
    default:
      return <Car className="w-5 h-5" />
  }
}

// Helper function to get vehicle type color
function getVehicleTypeColor(type: string): string {
  switch (type.toLowerCase()) {
    case 'ambulance':
      return 'text-green-600 dark:text-green-400'
    case 'fire_truck':
      return 'text-red-600 dark:text-red-400'
    case 'police':
      return 'text-blue-600 dark:text-blue-400'
    default:
      return 'text-gray-600 dark:text-gray-400'
  }
}

// Helper function to get security level color
function getSecurityLevelColor(level: string): string {
  switch (level.toLowerCase()) {
    case 'high':
      return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
    case 'medium':
      return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
    case 'low':
      return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
    default:
      return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20'
  }
}

// Loading skeleton component
function EmergencySkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="animate-pulse">
        <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-64 mb-2"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-96 mb-4"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-48"></div>
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24 mb-2"></div>
              <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-12"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Emergency vehicles skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-48 mb-4"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
          ))}
        </div>
      </div>

      {/* VIP alerts skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-48 mb-4"></div>
          <div className="h-24 bg-gray-300 dark:bg-gray-600 rounded"></div>
        </div>
      </div>
    </div>
  )
}

// Emergency Vehicle Card Component
function EmergencyVehicleCard({ vehicle }: { vehicle: EmergencyVehicle }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${getVehicleTypeColor(vehicle.type)} bg-gray-50 dark:bg-gray-700`}>
            {getVehicleIcon(vehicle.type)}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white capitalize">
              {vehicle.type.replace('_', ' ')}
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {vehicle.registration}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-1">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEmergencyStatusBadge(vehicle.status)}`}>
            {vehicle.status.replace('_', ' ').toUpperCase()}
          </span>
          <span className={`text-sm font-medium ${getEmergencyPriorityColor(vehicle.priority)}`}>
            {vehicle.priority.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600 dark:text-gray-300">
            <strong>Destination:</strong> {vehicle.destination}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600 dark:text-gray-300">
            <strong>ETA:</strong> {vehicle.eta_min} minutes
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <Route className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600 dark:text-gray-300">
            <strong>Route:</strong> {vehicle.route.join(' → ')}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600 dark:text-gray-300">
            <strong>Location:</strong> {vehicle.location.lat.toFixed(4)}, {vehicle.location.lng.toFixed(4)}
          </span>
        </div>
      </div>
    </div>
  )
}

// VIP Movement Alert Card Component
function VIPAlertCard({ alert }: { alert: VIPMovementAlert }) {
  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg border border-purple-200 dark:border-purple-800 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h4 className="font-semibold text-purple-900 dark:text-purple-100">
              VIP Movement Alert
            </h4>
            <p className="text-sm text-purple-700 dark:text-purple-300">
              ID: {alert.movement_id}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSecurityLevelColor(alert.security_level)}`}>
            {alert.security_level.toUpperCase()}
          </span>
          {alert.diversions_active && (
            <span className="px-2 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200 rounded-full text-xs font-medium">
              DIVERSIONS ACTIVE
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="space-y-2">
          <div>
            <strong className="text-purple-800 dark:text-purple-200">Route:</strong>
            <span className="ml-2 text-purple-700 dark:text-purple-300">{alert.route}</span>
          </div>
          <div>
            <strong className="text-purple-800 dark:text-purple-200">Start Time:</strong>
            <span className="ml-2 text-purple-700 dark:text-purple-300">{formatTimestamp(alert.start_time)}</span>
          </div>
          <div>
            <strong className="text-purple-800 dark:text-purple-200">Duration:</strong>
            <span className="ml-2 text-purple-700 dark:text-purple-300">{alert.estimated_duration_min} minutes</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div>
            <strong className="text-purple-800 dark:text-purple-200">Traffic Clearance:</strong>
            <span className="ml-2 text-purple-700 dark:text-purple-300">{alert.traffic_clearance}</span>
          </div>
          <div>
            <strong className="text-purple-800 dark:text-purple-200">Affected Routes:</strong>
            <div className="ml-2 text-purple-700 dark:text-purple-300">
              {alert.affected_routes.map((route, index) => (
                <span key={index} className="inline-block bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded text-xs mr-1 mb-1">
                  {route}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Main content component
async function EmergencyContent() {
  try {
    const data = await getEmergencyVehicles()

    return (
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Vehicles</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.total_count}</p>
              </div>
              <Truck className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Priority Overrides</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.priority_overrides_active}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">VIP Movements</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.vip_movement_alerts.length}</p>
              </div>
              <Shield className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Emergency Vehicles Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Active Emergency Vehicles
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {data.active_emergency_vehicles.length} vehicles
            </span>
          </div>
          
          {data.active_emergency_vehicles.length === 0 ? (
            <div className="text-center py-8">
              <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No active emergency vehicles</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {data.active_emergency_vehicles.map((vehicle) => (
                <EmergencyVehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
            </div>
          )}
        </div>

        {/* VIP Movement Alerts Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              VIP Movement Alerts
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {data.vip_movement_alerts.length} active alerts
            </span>
          </div>
          
          {data.vip_movement_alerts.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No active VIP movement alerts</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.vip_movement_alerts.map((alert) => (
                <VIPAlertCard key={alert.movement_id} alert={alert} />
              ))}
            </div>
          )}
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading emergency data:', error)
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
            Error Loading Emergency Data
          </h3>
        </div>
        <p className="text-red-700 dark:text-red-300">
          {error instanceof Error ? error.message : 'Failed to load emergency data. Please check your emergency.json file.'}
        </p>
      </div>
    )
  }
}

// Main page component
export default async function EmergencyPage() {
  const data = await getEmergencyVehicles().catch(() => null)
  
  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Emergency Vehicles</h1>
            <p className="text-gray-600 dark:text-gray-400">Monitor active emergency vehicles and VIP movements</p>
          </div>
          {data && (
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <RefreshCw className="w-4 h-4 mr-2" />
              Last updated: {formatTimestamp(data.timestamp)}
            </div>
          )}
        </div>
      </div>
      
      <Suspense fallback={<EmergencySkeleton />}>
        <EmergencyContent />
      </Suspense>
    </div>
  )
}