// File: @/components/EventDetailModal.tsx

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Event } from '@/app/types/events';

interface EventDetailModalProps {
  event: Event;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * EVENT DETAIL MODAL COMPONENT
 * ✅ Beautiful popup modal for detailed event information
 * ✅ Smooth entrance/exit animations
 * ✅ Professional layout and styling
 * ✅ Dark mode support
 * ✅ Responsive design
 * ✅ Click outside to close
 */

// ========================================
// HELPER FUNCTIONS
// ========================================

function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return 'Invalid Date';
  }
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function getSeverityConfig(severity: string): {
  gradient: string;
  color: string;
  icon: string;
  bg: string;
} {
  const config: Record<
    string,
    { gradient: string; color: string; icon: string; bg: string }
  > = {
    critical: {
      gradient: 'from-red-600 to-red-700',
      color: 'text-red-700 dark:text-red-400',
      icon: '🚨',
      bg: 'bg-red-50 dark:bg-red-950/30'
    },
    high: {
      gradient: 'from-orange-600 to-orange-700',
      color: 'text-orange-700 dark:text-orange-400',
      icon: '⚠️',
      bg: 'bg-orange-50 dark:bg-orange-950/30'
    },
    medium: {
      gradient: 'from-amber-600 to-amber-700',
      color: 'text-amber-700 dark:text-amber-400',
      icon: '⚡',
      bg: 'bg-amber-50 dark:bg-amber-950/30'
    },
    low: {
      gradient: 'from-blue-600 to-blue-700',
      color: 'text-blue-700 dark:text-blue-400',
      icon: '📌',
      bg: 'bg-blue-50 dark:bg-blue-950/30'
    }
  };

  return (
    config[severity.toLowerCase()] || {
      gradient: 'from-gray-600 to-gray-700',
      color: 'text-gray-700 dark:text-gray-400',
      icon: '📋',
      bg: 'bg-gray-50 dark:bg-gray-950/30'
    }
  );
}

// ========================================
// ANIMATION VARIANTS
// ========================================

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 25 }
  },
  exit: { opacity: 0, scale: 0.95, y: 20 }
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};

// ========================================
// MODAL COMPONENT
// ========================================

export default function EventDetailModal({
  event,
  isOpen,
  onClose
}: EventDetailModalProps) {
  const severity = getSeverityConfig(event.severity);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
          className="fixed inset-0 bg-black/50 dark:bg-black/70 z-40 flex items-center justify-center p-4"
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-950 rounded-xl border border-gray-200 dark:border-slate-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            {/* Modal Header */}
            <div className={`sticky top-0 px-6 py-4 bg-gradient-to-r ${severity.gradient} text-white border-b border-gray-200 dark:border-slate-800 flex items-center justify-between z-10`}>
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-3xl flex-shrink-0">{severity.icon}</span>
                <div className="min-w-0">
                  <h2 className="text-xl font-bold truncate">{event.title}</h2>
                  <p className="text-sm text-white/80">{event.type.replace('_', ' ').toUpperCase()}</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="text-2xl text-white hover:text-white/80 transition-colors flex-shrink-0 ml-4"
              >
                ✕
              </motion.button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Status Badges */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex flex-wrap gap-2"
              >
                <span className={`px-3 py-1.5 text-sm font-semibold rounded-full border w-fit ${
                  event.status === 'active'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                    : event.status === 'scheduled'
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/50 text-blue-700 dark:text-blue-300'
                      : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                }`}>
                  {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                </span>
                <span className={`px-3 py-1.5 text-sm font-semibold rounded-full border w-fit ${severity.bg} ${severity.color}`}>
                  {event.severity.charAt(0).toUpperCase() + event.severity.slice(1)} Severity
                </span>
              </motion.div>

              {/* Description */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-wide">Description</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{event.description}</p>
              </motion.div>

              {/* Location */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={`p-4 rounded-lg ${severity.bg} border border-gray-200 dark:border-slate-700`}
              >
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-wide">📍 Location</h3>
                <p className="text-gray-900 dark:text-white font-semibold">{event.location.description}</p>
                {event.location.junction_id && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Junction: {event.location.junction_id}</p>
                )}
                {event.location.route_id && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">Route: {event.location.route_id}</p>
                )}
              </motion.div>

              {/* Time Information */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="grid grid-cols-2 gap-4"
              >
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700">
                  <p className="text-xs font-bold text-gray-600 dark:text-gray-500 uppercase mb-1">Start Time</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatDateTime(event.start_time)}</p>
                </div>
                {event.end_time && (
                  <div className="p-4 rounded-lg bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700">
                    <p className="text-xs font-bold text-gray-600 dark:text-gray-500 uppercase mb-1">End Time</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatDateTime(event.end_time)}</p>
                  </div>
                )}
              </motion.div>

              {event.estimated_duration_min && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50"
                >
                  <p className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase mb-1">Estimated Duration</p>
                  <p className="text-lg font-bold text-blue-900 dark:text-blue-100">{formatDuration(event.estimated_duration_min)}</p>
                </motion.div>
              )}

              {/* Traffic Impact */}
              {event.impact && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className={`p-4 rounded-lg ${severity.bg} border border-gray-200 dark:border-slate-700`}
                >
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 uppercase tracking-wide">⚠️ Traffic Impact</h3>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Estimated Delay</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatDuration(event.impact?.estimated_delay_min || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Routes Affected</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {event.impact?.affected_routes?.length || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Lanes Blocked</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {event.impact?.lanes_blocked || 0}
                      </p>
                    </div>
                  </div>
                  {event.impact?.complete_closure && (
                    <div className="p-3 bg-red-100 dark:bg-red-950/40 rounded border border-red-200 dark:border-red-900/50">
                      <p className="text-sm font-bold text-red-700 dark:text-red-300">⚠️ Complete Closure Active</p>
                    </div>
                  )}
                  {event.impact?.affected_routes && event.impact.affected_routes.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Affected Routes:</p>
                      <div className="flex flex-wrap gap-2">
                        {event.impact.affected_routes.map((route, i) => (
                          <span key={i} className="px-2.5 py-1 text-xs bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded border border-gray-200 dark:border-slate-700">
                            {route}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Authorities */}
              {(event.authorities || event.authorities_notified) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-wide">👮 Authorities Notified</h3>
                  <div className="flex flex-wrap gap-2">
                    {(event.authorities || event.authorities_notified || []).map((authority, i) => (
                      <span key={i} className="px-3 py-1.5 text-sm bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-900/50">
                        {authority}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Crowd Estimate */}
              {event.crowd_estimate && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50"
                >
                  <p className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase mb-2">👥 Crowd Estimate</p>
                  <p className="text-3xl font-black text-purple-700 dark:text-purple-300">
                    {event.crowd_estimate.toLocaleString()}
                  </p>
                </motion.div>
              )}

              {/* Incident Number */}
              {event.incident_number && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="p-4 rounded-lg bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700"
                >
                  <p className="text-xs font-bold text-gray-600 dark:text-gray-500 uppercase mb-1">Incident Number</p>
                  <p className="text-lg font-mono font-bold text-gray-900 dark:text-white">{event.incident_number}</p>
                </motion.div>
              )}

              {/* Footer */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="pt-4 border-t border-gray-200 dark:border-slate-700 text-xs text-gray-500 dark:text-gray-400"
              >
                <p>Created by: <span className="font-semibold text-gray-700 dark:text-gray-300">{event.created_by}</span></p>
                <p>Last modified: {formatDateTime(event.last_modified)}</p>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
