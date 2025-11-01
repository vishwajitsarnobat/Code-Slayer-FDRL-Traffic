export const dynamic = "force-dynamic"; // App Router


import { getEvents } from '@/lib/api'
import type { Event, EventsResponse, EventSeverity, EventStatus } from '@/app/types/events'

// Helper function to format dates
function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  } catch {
    return 'Invalid Date'
  }
}

// Helper function to format duration
function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (hours > 0) {
    return `${hours}h ${mins}m`
  }
  return `${mins}m`
}

// Helper function to get severity color classes
function getSeverityColor(severity: EventSeverity): string {
  switch (severity) {
    case 'critical':
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-200 dark:border-red-800'
    case 'high':
      return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-200 dark:border-orange-800'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-200 dark:border-yellow-800'
    case 'low':
      return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-800'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-200 dark:border-gray-700'
  }
}

// Helper function to get status color classes
function getStatusColor(status: EventStatus): string {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-200 dark:border-green-800'
    case 'scheduled':
      return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-800'
    case 'completed':
      return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-200 dark:border-gray-700'
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-200 dark:border-red-800'
    case 'inactive':
      return 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-700'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-200 dark:border-gray-700'
  }
}

// Helper function to get event type color
function getEventTypeColor(type: string): string {
  switch (type.toLowerCase()) {
    case 'construction':
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800'
    case 'accident':
      return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
    case 'religious_event':
      return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800'
    case 'weather':
      return 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/20 dark:text-sky-300 dark:border-sky-800'
    case 'protest':
      return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800'
    case 'maintenance':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800'
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-700'
  }
}

// Event card component
function EventCard({ event }: { event: Event }) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {event.title}
          </h3>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className={`px-2 py-1 text-xs font-medium rounded-md border ${getSeverityColor(event.severity)}`}>
              {event.severity.toUpperCase()}
            </span>
            <span className={`px-2 py-1 text-xs font-medium rounded-md border ${getStatusColor(event.status)}`}>
              {event.status.toUpperCase()}
            </span>
            <span className={`px-2 py-1 text-xs font-medium rounded-md border ${getEventTypeColor(event.type)}`}>
              {event.type.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-600 dark:text-gray-300 mb-4">
        {event.description}
      </p>

      {/* Location */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Location</h4>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {event.location.description}
          {event.location.junction_id && (
            <span className="ml-2 text-xs text-gray-500">Junction: {event.location.junction_id}</span>
          )}
          {event.location.route_id && (
            <span className="ml-2 text-xs text-gray-500">Route: {event.location.route_id}</span>
          )}
        </p>
      </div>

      {/* Time Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Start Time</h4>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {formatDateTime(event.start_time)}
          </p>
        </div>
        {event.end_time && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">End Time</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {formatDateTime(event.end_time)}
            </p>
          </div>
        )}
        {event.estimated_duration_min && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Duration</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {formatDuration(event.estimated_duration_min)}
            </p>
          </div>
        )}
      </div>

      {/* Impact Details */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Traffic Impact</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Delay:</span>
            <span className="text-gray-900 dark:text-white">
              {formatDuration(event.impact?.estimated_delay_min || 0)}
            </span>
          </div>
          {event.impact?.lanes_blocked && (
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Lanes Blocked:</span>
              <span className="text-gray-900 dark:text-white">{event.impact.lanes_blocked}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Routes Affected:</span>
            <span className="text-gray-900 dark:text-white">
              {event.impact?.affected_routes?.length || 0}
            </span>
          </div>
          {event.impact?.complete_closure && (
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Complete Closure:</span>
              <span className="text-red-600 dark:text-red-400 font-medium">Yes</span>
            </div>
          )}
        </div>
        
        {/* Affected Routes */}
        {(event.impact.affected_routes && event.impact.affected_routes.length > 0) && (
          <div className="mt-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Affected Routes: </span>
            <div className="flex flex-wrap gap-1 mt-1">
              {event.impact.affected_routes.map((route, index) => (
                <span key={index} className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                  {route}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Authorities */}
      {(event.authorities || event.authorities_notified) && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Authorities</h4>
          <div className="flex flex-wrap gap-1">
            {(event.authorities || event.authorities_notified || []).map((authority, index) => (
              <span key={index} className="px-2 py-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-800">
                {authority}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Additional Info */}
      {(event.crowd_estimate || event.incident_number) && (
        <div className="mb-4 pt-2 border-t border-gray-200 dark:border-gray-600">
          {event.crowd_estimate && (
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500 dark:text-gray-400">Crowd Estimate:</span>
              <span className="text-gray-900 dark:text-white font-medium">
                {event.crowd_estimate.toLocaleString()}
              </span>
            </div>
          )}
          {event.incident_number && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Incident #:</span>
              <span className="text-gray-900 dark:text-white font-mono text-xs">
                {event.incident_number}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="pt-3 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex justify-between items-center">
          <span>Created by: {event.created_by}</span>
          <span>Updated: {formatDateTime(event.last_modified)}</span>
        </div>
      </div>
    </div>
  )
}

export default async function EventsPage() {
  try {
    // Fetch events data server-side
    const eventsData: EventsResponse = await getEvents()
    const { events, total_count, active_count, timestamp } = eventsData

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Traffic Events Dashboard
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Real-time traffic events and incidents management
                </p>
              </div>
              <div className="flex space-x-6 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{total_count}</div>
                  <div className="text-gray-500 dark:text-gray-400">Total Events</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{active_count}</div>
                  <div className="text-gray-500 dark:text-gray-400">Active Events</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {events.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 dark:text-gray-500 text-4xl mb-4">📅</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No events found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                There are currently no traffic events to display.
              </p>
            </div>
          ) : (
            <>
              {/* Last Updated */}
              <div className="mb-6">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Last updated: {formatDateTime(timestamp)}
                </p>
              </div>

              {/* Events Grid */}
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {events.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading events data:', error)
    
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Failed to load events data
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Please check your events.json file and try again.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }
}