'use client';

import { Suspense, useEffect, useState } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { 
  Car,
  Bus,
  Ambulance,
  Clock,
  Users,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Timer,
  BarChart3,
  Activity,
  Zap,
  RefreshCw,
  PieChart
} from 'lucide-react';

// Types
interface TrafficVehicleData {
  vehicle_type: string;
  no_of_vehicles: number;
  avg_waiting_time: number;
}

interface TrafficData {
  traffic_data: TrafficVehicleData[];
}

// Fetch real data from RL results
async function getTrafficData(): Promise<TrafficData> {
  try {
    const response = await fetch('/api/traffic-data');
    if (!response.ok) {
      throw new Error('Failed to fetch traffic data');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching traffic data:', error);
    // Fallback to empty data if fetch fails
    return {
      traffic_data: []
    };
  }
}

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.9
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
};

const pulseVariants = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.2, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

const shimmerVariants = {
  initial: { x: "-100%" },
  animate: {
    x: "100%",
    transition: {
      repeat: Infinity,
      duration: 2,
      ease: "easeInOut"
    }
  }
};

// Helper functions
function getVehicleIcon(type: string) {
  switch (type.toLowerCase()) {
    case 'private':
      return <Car className="w-6 h-6" />;
    case 'public':
      return <Bus className="w-6 h-6" />;
    case 'emergency':
      return <Ambulance className="w-6 h-6" />;
    default:
      return <Car className="w-6 h-6" />;
  }
}

function getVehicleColor(type: string) {
  switch (type.toLowerCase()) {
    case 'private':
      return {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-800',
        text: 'text-blue-700 dark:text-blue-300',
        icon: 'text-blue-600 dark:text-blue-400',
        gradient: 'from-blue-500 to-blue-600',
        bar: 'bg-blue-500',
        chartColor: '#3B82F6',
        lightColor: '#DBEAFE'
      };
    case 'public':
      return {
        bg: 'bg-green-50 dark:bg-green-900/20',
        border: 'border-green-200 dark:border-green-800',
        text: 'text-green-700 dark:text-green-300',
        icon: 'text-green-600 dark:text-green-400',
        gradient: 'from-green-500 to-green-600',
        bar: 'bg-green-500',
        chartColor: '#10B981',
        lightColor: '#DCFCE7'
      };
    case 'emergency':
      return {
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-800',
        text: 'text-red-700 dark:text-red-300',
        icon: 'text-red-600 dark:text-red-400',
        gradient: 'from-red-500 to-red-600',
        bar: 'bg-red-500',
        chartColor: '#EF4444',
        lightColor: '#FEE2E2'
      };
    default:
      return {
        bg: 'bg-gray-50 dark:bg-gray-900/20',
        border: 'border-gray-200 dark:border-gray-800',
        text: 'text-gray-700 dark:text-gray-300',
        icon: 'text-gray-600 dark:text-gray-400',
        gradient: 'from-gray-500 to-gray-600',
        bar: 'bg-gray-500',
        chartColor: '#6B7280',
        lightColor: '#F3F4F6'
      };
  }
}

function getWaitTimeStatus(waitTime: number) {
  if (waitTime <= 20) {
    return { icon: CheckCircle, color: 'text-green-500', label: 'Excellent', bg: 'bg-green-100 dark:bg-green-900/30' };
  } else if (waitTime <= 35) {
    return { icon: Timer, color: 'text-yellow-500', label: 'Moderate', bg: 'bg-yellow-100 dark:bg-yellow-900/30' };
  } else {
    return { icon: AlertCircle, color: 'text-red-500', label: 'High', bg: 'bg-red-100 dark:bg-red-900/30' };
  }
}

// Animated Donut Chart Component
function AnimatedDonutChart({ 
  data, 
  title, 
  metric,
  delay = 0 
}: { 
  data: TrafficVehicleData[];
  title: string;
  metric: 'no_of_vehicles' | 'avg_waiting_time';
  delay?: number;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  const total = data.reduce((sum, item) => sum + item[metric], 0);
  const chartData = data.map((item, index) => ({
    ...item,
    percentage: (item[metric] / total) * 100,
    index
  }));

  // Calculate angles for donut segments
  let currentAngle = -90;
  const segments = chartData.map(item => {
    const segmentAngle = (item.percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + segmentAngle;
    currentAngle = endAngle;

    return {
      ...item,
      startAngle,
      endAngle,
      segmentAngle
    };
  });

  const radius = 60;
  const innerRadius = 40;

  const polarToCartesian = (angle: number, r: number) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: Math.cos(rad) * r,
      y: Math.sin(rad) * r
    };
  };

  const createPath = (startAngle: number, endAngle: number) => {
    const start = polarToCartesian(startAngle, radius);
    const end = polarToCartesian(endAngle, radius);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    const innerStart = polarToCartesian(startAngle, innerRadius);
    const innerEnd = polarToCartesian(endAngle, innerRadius);

    return [
      `M ${start.x} ${start.y}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`,
      `L ${innerEnd.x} ${innerEnd.y}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
      'Z'
    ].join(' ');
  };

  return (
    <motion.div
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 shadow-sm"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
    >
      <motion.h3
        className="text-lg font-semibold text-gray-900 dark:text-white mb-8 flex items-center"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: delay + 0.2 }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        >
          <PieChart className="w-5 h-5 mr-2" />
        </motion.div>
        {title}
      </motion.h3>

      <div className="flex flex-col lg:flex-row items-center justify-center gap-12 text-white">
        {/* Donut Chart */}
        <motion.svg
          width="280"
          height="280"
          viewBox="-100 -100 200 200"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: delay + 0.3, duration: 0.6 }}
        >
          {/* Background circle */}
          <motion.circle
            cx="0"
            cy="0"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-gray-200 dark:text-"
          />

          {/* Segments */}
          {segments.map((segment, index) => {
            const colors = getVehicleColor(segment.vehicle_type);
            const isHovered = hoveredIndex === index;

            return (
              <motion.g
                key={`segment-${index}`}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer"
              >
                <motion.path
                  d={createPath(segment.startAngle, segment.endAngle)}
                  fill={colors.chartColor}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isHovered ? 1 : 0.8 }}
                  whileHover={{ filter: "brightness(1.2)" }}
                  transition={{ duration: 0.2 }}
                  style={{ filter: isHovered ? "brightness(1.3)" : "brightness(1)" }}
                />

                {/* Percentage label on hover */}
                {isHovered && (
                  <motion.g
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <text
                      x={polarToCartesian(segment.startAngle + segment.segmentAngle / 2, (radius + innerRadius) / 2).x}
                      y={polarToCartesian(segment.startAngle + segment.segmentAngle / 2, (radius + innerRadius) / 2).y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-white dark:text-gray-900 font-bold text-lg"
                      style={{ pointerEvents: 'none' }}
                    >
                      {segment.percentage.toFixed(1)}%
                    </text>
                  </motion.g>
                )}
              </motion.g>
            );
          })}

          {/* Center text */}
          <motion.text
            x="0"
            y="0"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            className="font-bold text-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.5 }}
          >
            {total.toFixed(metric === 'avg_waiting_time' ? 1 : 0)}
          </motion.text>
          <motion.text
            x="0"
            y="20"
            textAnchor="middle"
            fill="white"
            className="text-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.6 }}
          >
            {metric === 'avg_waiting_time' ? 'seconds' : 'vehicles'}
          </motion.text>
        </motion.svg>

        {/* Legend */}
        <motion.div
          className="space-y-3 flex-1"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: delay + 0.4 }}
        >
          {chartData.map((item, index) => {
            const colors = getVehicleColor(item.vehicle_type);
            const isHovered = hoveredIndex === index;

            return (
              <motion.div
                key={`legend-${index}`}
                className={`p-3 rounded-lg cursor-pointer transition-all ${colors.bg} ${colors.border} border`}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                whileHover={{ scale: 1.05, x: 5 }}
                animate={{ scale: isHovered ? 1.05 : 1 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: colors.chartColor }}
                    />
                    <span className={`font-medium ${colors.text} capitalize`}>
                      {item.vehicle_type}
                    </span>
                  </div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isHovered ? 1 : 0.6 }}
                    className={`font-bold ${colors.text}`}
                  >
                    <motion.span
                      key={item.percentage}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {item.percentage.toFixed(1)}%
                    </motion.span>
                  </motion.div>
                </div>
                <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                  {metric === 'avg_waiting_time' 
                    ? `${item.avg_waiting_time.toFixed(1)}s avg wait`
                    : `${item.no_of_vehicles} vehicles`
                  }
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </motion.div>
  );
}

// Animated Progress Bar Component
function AnimatedProgressBar({ 
  percentage, 
  color, 
  delay = 0 
}: { 
  percentage: number; 
  color: string; 
  delay?: number;
}) {
  return (
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
      <motion.div
        className={`${color} h-2 rounded-full`}
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{
          duration: 1.5,
          delay: delay,
          ease: "easeOut"
        }}
      />
    </div>
  );
}

// Vehicle Type Card Component with Crazy Animations
function VehicleTypeCard({ data, index }: { data: TrafficVehicleData; index: number }) {
  const colors = getVehicleColor(data.vehicle_type);
  const waitStatus = getWaitTimeStatus(data.avg_waiting_time);
  const StatusIcon = waitStatus.icon;

  return (
    <motion.div
      variants={itemVariants}
      className={`relative overflow-hidden rounded-xl border ${colors.border} ${colors.bg} p-6 shadow-sm cursor-pointer`}
    >
      {/* Animated Shimmer Effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        variants={shimmerVariants}
        initial="initial"
        animate="animate"
      />

      {/* Gradient Blob Animation */}
      <motion.div
        className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colors.gradient} opacity-5 rounded-full -mr-16 -mt-16`}
        animate={{
          scale: [1, 1.5, 1],
          rotate: [0, 180, 360]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      
      <div className="relative">
        {/* Icon and Title with Scale Animation */}
        <div className="flex items-center justify-between mb-4">
          <motion.div
            className={`p-3 rounded-lg ${colors.bg} ${colors.border} border`}
            whileHover={{ 
              rotate: [0, -10, 10, -10, 0],
              scale: 1.1
            }}
            transition={{ duration: 0.5 }}
          >
            <motion.div 
              className={colors.icon}
              animate={{
                y: [0, -5, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {getVehicleIcon(data.vehicle_type)}
            </motion.div>
          </motion.div>
          
          <motion.div
            className={`px-3 py-1 rounded-full ${waitStatus.bg} flex items-center space-x-1`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.2 + 0.5 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <StatusIcon className={`w-4 h-4 ${waitStatus.color}`} />
            </motion.div>
            <span className={`text-xs font-medium ${waitStatus.color}`}>
              {waitStatus.label}
            </span>
          </motion.div>
        </div>

        {/* Vehicle Type with Typewriter Effect */}
        <motion.h3
          className={`text-lg font-semibold ${colors.text} mb-4 capitalize`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.2 + 0.3 }}
        >
          {data.vehicle_type} Vehicles
        </motion.h3>

        {/* Statistics with Stagger */}
        <motion.div 
          className="space-y-4"
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.2,
                delayChildren: index * 0.3
              }
            }
          }}
        >
          {/* Vehicle Count */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Users className={`w-4 h-4 ${colors.icon}`} />
                </motion.div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Active Vehicles
                </span>
              </div>
              <motion.span
                className={`text-2xl font-bold ${colors.text}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  delay: index * 0.3 + 0.5
                }}
              >
                {data.no_of_vehicles}
              </motion.span>
            </div>
            <AnimatedProgressBar
              percentage={Math.min((data.no_of_vehicles / 150) * 100, 100)}
              color={colors.bar}
              delay={index * 0.3 + 0.6}
            />
          </motion.div>

          {/* Waiting Time */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <Clock className={`w-4 h-4 ${colors.icon}`} />
                </motion.div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Avg Wait Time
                </span>
              </div>
              <motion.span
                className={`text-xl font-bold ${colors.text}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.3 + 0.7 }}
              >
                {data.avg_waiting_time.toFixed(1)}s
              </motion.span>
            </div>
            <AnimatedProgressBar
              percentage={Math.min((data.avg_waiting_time / 60) * 100, 100)}
              color={colors.bar}
              delay={index * 0.3 + 0.8}
            />
          </motion.div>
        </motion.div>

        {/* Performance Indicator with Slide Animation */}
        <motion.div
          className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.3 + 1 }}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-400">Traffic Flow</span>
            <motion.div
              className="flex items-center space-x-1"
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {data.avg_waiting_time < 30 ? (
                <>
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-green-600 dark:text-green-400 font-medium">Smooth</span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-4 h-4 text-orange-500" />
                  <span className="text-orange-600 dark:text-orange-400 font-medium">Congested</span>
                </>
              )}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// Summary Stats Component with Crazy Animations
function SummaryStats({ data }: { data: TrafficData }) {
  const totalVehicles = data.traffic_data.reduce((sum, item) => sum + item.no_of_vehicles, 0);
  const avgWaitTime = data.traffic_data.reduce((sum, item) => sum + item.avg_waiting_time, 0) / data.traffic_data.length;
  const emergencyData = data.traffic_data.find(item => item.vehicle_type === 'emergency');

  const stats = [
    {
      icon: Activity,
      label: 'Total Vehicles',
      value: totalVehicles,
      gradient: 'from-blue-500 to-blue-600',
      delay: 0
    },
    {
      icon: Clock,
      label: 'Avg Wait Time',
      value: `${avgWaitTime.toFixed(1)}s`,
      gradient: 'from-purple-500 to-purple-600',
      delay: 0.1
    },
    {
      icon: Ambulance,
      label: 'Emergency',
      value: emergencyData?.no_of_vehicles || 0,
      gradient: 'from-red-500 to-red-600',
      delay: 0.2
    },
    {
      icon: BarChart3,
      label: 'Vehicle Types',
      value: data.traffic_data.length,
      gradient: 'from-green-500 to-green-600',
      delay: 0.3
    }
  ];

  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            variants={itemVariants}
            className={`bg-gradient-to-br ${stat.gradient} rounded-xl p-6 text-white shadow-lg cursor-pointer relative overflow-hidden`}
            whileHover={{
              scale: 1.05,
              rotate: [0, 1, -1, 0],
              transition: { duration: 0.3 }
            }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Animated Background Pattern */}
            <motion.div
              className="absolute inset-0 opacity-10"
              animate={{
                backgroundPosition: ["0% 0%", "100% 100%"],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              }}
              style={{
                backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
                backgroundSize: "20px 20px"
              }}
            />

            <div className="flex items-center justify-between relative">
              <div>
                <motion.p
                  className="text-white/80 text-sm font-medium mb-1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: stat.delay + 0.2 }}
                >
                  {stat.label}
                </motion.p>
                <motion.p
                  className="text-3xl font-bold"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    delay: stat.delay + 0.3
                  }}
                >
                  {stat.value}
                </motion.p>
              </div>
              <motion.div
                className="bg-white/20 p-3 rounded-lg"
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  rotate: { duration: 10, repeat: Infinity, ease: "linear" },
                  scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                }}
              >
                <Icon className="w-6 h-6" />
              </motion.div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

// Main content component
function TrafficContent() {
  const [data, setData] = useState<TrafficData | null>(null);

  useEffect(() => {
    getTrafficData().then(setData);
  }, []);

  if (!data) return <TrafficSkeleton />;

  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Summary Statistics */}
      <SummaryStats data={data} />

      {/* Vehicle Type Cards */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
        variants={containerVariants}
      >
        {data.traffic_data.map((vehicleData, index) => (
          <VehicleTypeCard key={vehicleData.vehicle_type} data={vehicleData} index={index} />
        ))}
      </motion.div>

      {/* Donut Charts */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <AnimatedDonutChart
          data={data.traffic_data}
          title="Traffic Consumption"
          metric="no_of_vehicles"
          delay={1.4}
        />
        <AnimatedDonutChart
          data={data.traffic_data}
          title="Waiting Time Distribution"
          metric="avg_waiting_time"
          delay={1.6}
        />
      </motion.div>

      {/* Additional Insights */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2, duration: 0.6 }}
      >
        {/* Traffic Status */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
          whileHover={{ scale: 1.02 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Traffic Status
          </h3>
          <div className="space-y-3">
            {data.traffic_data.map((item, index) => {
              const status = getWaitTimeStatus(item.avg_waiting_time);
              const StatusIcon = status.icon;
              const colors = getVehicleColor(item.vehicle_type);

              return (
                <motion.div
                  key={`status-${item.vehicle_type}`}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 2.1 + index * 0.1 }}
                  whileHover={{ x: 5 }}
                >
                  <div className="flex items-center space-x-3">
                    <motion.div
                      className={colors.icon}
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {getVehicleIcon(item.vehicle_type)}
                    </motion.div>
                    <span className="font-medium text-gray-900 dark:text-white capitalize">
                      {item.vehicle_type}
                    </span>
                  </div>
                  <motion.div
                    className="flex items-center space-x-2"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <StatusIcon className={`w-5 h-5 ${status.color}`} />
                    <span className={`text-sm font-medium ${status.color}`}>
                      {status.label}
                    </span>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Key Metrics */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
          whileHover={{ scale: 1.02 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Key Metrics
          </h3>
          <div className="space-y-4">
            <motion.div
              className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 2.2 }}
              whileHover={{ scale: 1.05 }}
            >
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Most Active
              </span>
              <motion.span
                className="font-bold text-blue-600 dark:text-blue-400 capitalize"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {data.traffic_data.reduce((prev, current) => 
                  prev.no_of_vehicles > current.no_of_vehicles ? prev : current
                ).vehicle_type}
              </motion.span>
            </motion.div>
            
            <motion.div
              className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 2.3 }}
              whileHover={{ scale: 1.05 }}
            >
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Fastest Flow
              </span>
              <motion.span
                className="font-bold text-green-600 dark:text-green-400 capitalize"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {data.traffic_data.reduce((prev, current) => 
                  prev.avg_waiting_time < current.avg_waiting_time ? prev : current
                ).vehicle_type}
              </motion.span>
            </motion.div>
            
            <motion.div
              className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 2.4 }}
              whileHover={{ scale: 1.05 }}
            >
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Traffic Efficiency
              </span>
              <motion.span
                className="font-bold text-purple-600 dark:text-purple-400"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {((1 - (data.traffic_data.reduce((sum, item) => sum + item.avg_waiting_time, 0) / data.traffic_data.length) / 60) * 100).toFixed(0)}%
              </motion.span>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// Loading skeleton with animations
function TrafficSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <motion.div
              className="animate-pulse space-y-4"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <div className="h-12 bg-gray-300 dark:bg-gray-600 rounded w-12"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
              <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Main page component
export default function EmergencyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-screen mx-auto">
        {/* Header with Animations */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <motion.h1
                className="text-3xl font-bold text-gray-900 dark:text-white mb-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                Traffic Management Dashboard
              </motion.h1>
              <motion.p
                className="text-gray-600 dark:text-gray-400"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                Real-time traffic monitoring and vehicle analytics
              </motion.p>
            </div>
            <motion.div
              className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.05 }}
            >
              <motion.div
                className="w-2 h-2 bg-green-500 rounded-full"
                variants={pulseVariants}
                initial="initial"
                animate="animate"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Live</span>
            </motion.div>
          </div>
        </motion.div>

        {/* Content */}
        <Suspense fallback={<TrafficSkeleton />}>
          <TrafficContent />
        </Suspense>
      </div>
    </div>
  );
}
