import React from 'react';
import type { Event } from '@/app/types/events';

interface EventCardProps {
  event: Event;
  className?: string;
}

// Helpers unchanged...
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

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

function getEventTypeIcon(type: string): string {
  switch (type.toLowerCase()) {
    case 'construction': return '🚧'
    case 'accident': return '🚨'
    case 'religious_event': return '🕉️'
    case 'weather': return '🌧️'
    case 'protest': return '📢'
    case 'maintenance': return '🔧'
    default: return '📋'
  }
}

function getSeverityColor(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'critical': return 'bg-red-400'
    case 'high': return 'bg-orange-400'
    case 'medium': return 'bg-yellow-800'
    case 'low': return 'bg-blue-400'
    default: return 'bg-gray-400'
  }
}

export default function EventCard({ event, className = '' }: EventCardProps) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden h-full flex flex-col ${className}`}>
      {/* Header (stays at top) */}
      <div className={`px-6 py-4 ${getSeverityColor(event.severity)} text-white`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-2xl">{getEventTypeIcon(event.type)}</span>
              <div>
                <h3 className="text-lg font-bold line-clamp-2">{event.title}</h3>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="px-2 py-1 text-xs font-medium bg-white/20 rounded-full">{event.severity.toUpperCase()}</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    event.status === 'active' ? 'bg-green-500/80' :
                    event.status === 'scheduled' ? 'bg-blue-500/80' :
                    'bg-gray-500/20'
                  }`}>
                    {event.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content (grows to fill) */}
      <div className="p-6 flex-1">
        <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">{event.description}</p>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-1">
              <span className="text-gray-400">📍</span>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Location</span>
            </div>
            <p className="text-sm text-gray-900 dark:text-white font-medium">
              {event.location.description}
            </p>
            {event.location.junction_id && (
              <p className="text-xs text-gray-500 dark:text-gray-400">Junction: {event.location.junction_id}</p>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-1">
              <span className="text-gray-400">🕐</span>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Start Time</span>
            </div>
            <p className="text-sm text-gray-900 dark:text-white font-medium">
              {formatDateTime(event.start_time)}
            </p>
            {event.estimated_duration_min && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Duration: {formatDuration(event.estimated_duration_min)}
              </p>
            )}
          </div>
        </div>

        {event.impact && (
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-orange-500">⚠️</span>
              <span className="text-sm font-semibold text-orange-800 dark:text-orange-200">Traffic Impact</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Delay:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatDuration(event.impact.estimated_delay_min || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Routes Affected:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {event.impact.affected_routes?.length || 0}
                </span>
              </div>
              {event.impact.lanes_blocked && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Lanes Blocked:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {event.impact.lanes_blocked}
                  </span>
                </div>
              )}
              {event.impact.complete_closure && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Complete Closure:</span>
                  <span className="font-medium text-red-600 dark:text-red-400">Yes</span>
                </div>
              )}
            </div>
          </div>
        )}

        {(event.authorities || event.authorities_notified) && (
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-blue-500">👮</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Authorities</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {(event.authorities || event.authorities_notified || []).slice(0, 3).map((authority, index) => (
                <span key={index} className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-700">
                  {authority}
                </span>
              ))}
              {(event.authorities || event.authorities_notified || []).length > 3 && (
                <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded border border-gray-200 dark:border-gray-600">
                  +{(event.authorities || event.authorities_notified || []).length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {(event.crowd_estimate || event.incident_number) && (
          <div className="grid grid-cols-2 gap-4">
            {event.crowd_estimate && (
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {event.crowd_estimate.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Crowd Estimate</div>
              </div>
            )}
            {/* {event.incident_number && (
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="text-lg font-bold text-gray-900 dark:text-white font-mono">
                  {event.incident_number}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Incident #</div>
              </div>
            )} */}
          </div>
        )}
      </div>

      {/* Footer (always at bottom) */}
      <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-600">
        <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
          <span>By: {event.created_by}</span>
          <span>Updated: {formatDateTime(event.last_modified)}</span>
        </div>
      </div>
    </div>
  )
}
