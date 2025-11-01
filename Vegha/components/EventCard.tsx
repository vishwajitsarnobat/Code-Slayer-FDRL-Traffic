// File: @/components/EventCard.tsx

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { Event } from '@/app/types/events';
import EventDetailModal from './EventDetailModal';

interface EventCardProps {
  event: Event;
  className?: string;
  index?: number;
}

/**
 * IMPLEMENTED FEATURES:
 * ✅ Fixed status badge width consistency
 * ✅ Better layout balance - location in middle
 * ✅ Fixed impact section vertical spacing
 * ✅ Click arrow to open detail modal
 * ✅ Clean horizontal card layout
 * ✅ Stylish, modern design
 * ✅ Dark mode support
 * ✅ Responsive on all devices
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

function getStatusDot(status: string): string {
  const dots: Record<string, string> = {
    active: 'bg-emerald-500',
    scheduled: 'bg-blue-500',
    resolved: 'bg-gray-400'
  };
  return dots[status.toLowerCase()] || 'bg-gray-400';
}

// ========================================
// ANIMATION VARIANTS
// ========================================

const cardVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: (i || 0) * 0.05,
      duration: 0.4,
      ease: 'easeOut'
    }
  })
};

const hoverVariants = {
  rest: { y: 0, boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)' },
  hover: {
    y: -3,
    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.1)',
    transition: { type: 'spring', stiffness: 300, damping: 25 }
  }
};

const badgeVariants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { duration: 0.3 } },
  hover: { scale: 1.05 }
};

// ========================================
// MAIN CARD COMPONENT
// ========================================

export default function EventCard({
  event,
  className = '',
  index = 0
}: EventCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const severity = getSeverityConfig(event.severity);
  const statusDot = getStatusDot(event.status);

  return (
    <>
    <motion.div
  custom={index}
  onClick={() => setIsModalOpen(true)}
  variants={cardVariants}
  initial="hidden"
  animate="visible"
  whileHover="hover"
  variants={hoverVariants}
  className={`
    relative flex items-stretch
    bg-white dark:bg-slate-950
    border border-gray-200 dark:border-slate-800
    rounded-xl overflow-hidden
    group
    h-32 cursor-pointer 
    ${className}
  `}
>
  {/* Left Gradient Bar */}
  <motion.div
    initial={{ scaleY: 0 }}
    animate={{ scaleY: 1 }}
    transition={{ delay: 0.08, duration: 0.4 }}
    className={`h-full w-1 bg-gradient-to-b ${severity.gradient} origin-top flex-shrink-0`}
  />

  {/* Severity Section - Left */}
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.1, duration: 0.35 }}
    className={`flex-shrink-0 h-full flex flex-col items-center justify-center gap-2 w-24 ${severity.bg} border-r border-gray-100 dark:border-slate-800`}
  >
    <motion.span
      initial={{ scale: 0, rotate: -20 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 15,
        delay: 0.12
      }}
      whileHover={{ scale: 1.15, rotate: 8 }}
      className="text-3xl"
    >
      {severity.icon}
    </motion.span>

    <motion.span
      whileHover={{ scale: 1.08 }}
      className={`px-2.5 py-1 text-xs font-bold rounded-full border w-fit ${severity.color} ${severity.bg} border-current`}
    >
      {event.severity.charAt(0).toUpperCase() + event.severity.slice(1)}
    </motion.span>
  </motion.div>

  {/* Main Content - Center */}
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.12, duration: 0.35 }}
    className="flex-1 h-full px-5 py-4 flex flex-col justify-center min-w-0"
  >
    <h3 className="text-base font-bold text-gray-900 dark:text-white line-clamp-1 mb-2">
      {event.title}
    </h3>

    <div className="flex items-center gap-2 flex-wrap">
      <motion.span
        variants={badgeVariants}
        whileHover="hover"
        className={`px-2.5 py-1 text-xs font-semibold rounded-full border whitespace-nowrap w-fit ${
          event.status === 'active'
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300'
            : event.status === 'scheduled'
              ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/50 text-blue-700 dark:text-blue-300'
              : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
        }`}
      >
        {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
      </motion.span>

      <motion.span
        variants={badgeVariants}
        whileHover="hover"
        className="px-2.5 py-1 text-xs font-semibold rounded-full border bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900/50 text-purple-700 dark:text-purple-300 whitespace-nowrap w-fit"
      >
        {event.type.replace('_', ' ').substring(0, 12)}
      </motion.span>

      <span className="text-xs text-gray-500 dark:text-gray-500 whitespace-nowrap">
        {formatDateTime(event.start_time).split(',')[0]}
      </span>
    </div>
  </motion.div>

  {/* Location Info */}
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.14, duration: 0.35 }}
    className="hidden lg:flex flex-col gap-2 flex-shrink-0 h-full px-4 py-4 justify-center border-l border-gray-100 dark:border-slate-800 w-56"
  >
    <p className="text-xs font-semibold text-gray-600 dark:text-gray-500 uppercase tracking-wide">
      📍 Location
    </p>
    <p className="text-base font-bold text-gray-900 dark:text-white line-clamp-1">
      {event.location.description}
    </p>
    {event.location.junction_id && (
      <p className="text-xs text-gray-500 dark:text-gray-500">
        J: {event.location.junction_id}
      </p>
    )}
  </motion.div>

  {/* Impact Info */}
  {event.impact && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.16, duration: 0.35 }}
      className="hidden xl:flex flex-col gap-2 flex-shrink-0 h-full px-4 py-4 justify-center border-l border-gray-100 dark:border-slate-800 w-64"
    >
      <div className="flex items-center gap-2">
        <p className="text-xs font-semibold text-gray-600 dark:text-gray-500 uppercase tracking-wide">
          ⚠️
        </p>
        <p className="text-xs font-semibold text-gray-600 dark:text-gray-500 uppercase tracking-wide">
          Impact
        </p>
      </div>
      <div className="flex gap-4">
        <div className="text-center flex-1 flex flex-col gap-1">
          <p className="text-xs text-gray-500 dark:text-gray-500">Delay</p>
          <p className="text-base font-bold text-gray-900 dark:text-white">
            {formatDuration(event.impact?.estimated_delay_min || 0)}
          </p>
        </div>
        <div className="text-center flex-1 flex flex-col gap-1">
          <p className="text-xs text-gray-500 dark:text-gray-500">Routes</p>
          <p className="text-base font-bold text-gray-900 dark:text-white">
            {event.impact?.affected_routes?.length || 0}
          </p>
        </div>
        {/* {event.impact?.complete_closure && (
          <div className="text-center flex-1 flex flex-col gap-1">
            <p className="text-xs text-red-600 dark:text-red-400">Status</p>
            <p className="text-base font-bold text-red-600 dark:text-red-400">
              Active
            </p>
          </div>
        )} */}
      </div>
    </motion.div>
  )}

  {/* Crowd Estimate - Desktop Only */}
  {/* {event.crowd_estimate && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.18, duration: 0.35 }}
      className="hidden 2xl:flex flex-col items-center justify-center gap-1 flex-shrink-0 h-full px-4 py-4 border-l border-gray-100 dark:border-slate-800 bg-purple-50 dark:bg-purple-950/30 w-36"
    >
      <div className="flex items-center gap-2">
        <p className="text-xs font-semibold text-gray-600 dark:text-gray-500 uppercase tracking-wide">
          👥
        </p>
        <p className="text-xs font-semibold text-gray-600 dark:text-gray-500 uppercase tracking-wide">
          Crowd
        </p>
      </div>
      <p className="text-base font-black text-purple-700 dark:text-purple-300">
        {(event.crowd_estimate / 1000).toFixed(1)}k
      </p>
    </motion.div>
  )} */}

  {/* Action Arrow */}
  <motion.button
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.2, duration: 0.35 }}
    onClick={() => setIsModalOpen(true)}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    className="hidden sm:flex flex-shrink-0 h-full items-center justify-center w-16 border-l border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 group-hover:bg-gray-100 dark:group-hover:bg-slate-800 transition-colors cursor-pointer"
  >
    <motion.div
      animate={{ x: [0, 4, 0] }}
      transition={{ duration: 2, repeat: Infinity }}
      className="text-gray-600 dark:text-gray-400 text-lg font-semibold"
    >
      →
    </motion.div>
  </motion.button>

  {/* Shimmer Overlay */}
  <motion.div
    initial={{ opacity: 0 }}
    whileHover={{ opacity: 1 }}
    transition={{ duration: 0.4 }}
    className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0"
  />
    </motion.div>



      {/* Detail Modal */}
      <EventDetailModal event={event} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
