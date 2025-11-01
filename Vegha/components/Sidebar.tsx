'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Map,
  Calendar,
  Truck,
  TrendingUp,
  Menu,
  X,
  PlayCircle
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Map', href: '/dashboard/map', icon: Map },
  { name: 'Simulation', href: '/dashboard/simulation', icon: PlayCircle },
  { name: 'Events', href: '/dashboard/events', icon: Calendar },
  { name: 'Emergency Vehicles', href: '/dashboard/emergency', icon: Truck },
  { name: 'Predictions', href: '/dashboard/predictions', icon: TrendingUp },
]

export default function Sidebar() {
  // Mobile drawer state (overlay)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  // Desktop collapse state (icon-rail)
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* Mobile menu button */}
      <div className="md:hidden">
        <button
          type="button"
          className="fixed top-4 left-4 z-50 inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>

      {/* Mobile sidebar (overlay) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 flex w-full max-w-xs flex-col bg-white dark:bg-gray-900">
            <div className="flex h-16 flex-shrink-0 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Menu</h2>
              <button
                type="button"
                className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-800"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 px-2 py-4">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center rounded-md px-2 py-2 text-sm font-medium ${
                      isActive
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Desktop sidebar (collapsible) */}
      <div
        className={`hidden md:fixed md:inset-y-0 md:flex md:flex-col md:pt-0
        ${collapsed ? 'md:w-16' : 'md:w-64'}`}
      >
        <div className="flex flex-col flex-grow overflow-y-auto bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
          {/* Desktop header with hamburger toggle */}
          <div className="flex h-14 items-center justify-between px-3 border-b border-gray-200 dark:border-gray-700">
            {/* When collapsed, center the button */}
            <div className={`flex items-center ${collapsed ? 'w-full justify-center' : ''}`}>
              <button
                type="button"
                onClick={() => setCollapsed((v) => !v)}
                className="inline-flex items-center justify-center rounded-md p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                title={collapsed ? 'Expand' : 'Collapse'}
              >
                <Menu className="h-5 w-5" />
              </button>
              {!collapsed && (
                <span className="ml-2 text-sm font-semibold text-gray-900 dark:text-white">
                  Navigation
                </span>
              )}
            </div>
          </div>

          {/* Nav items */}
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex ${collapsed ? 'justify-center' : 'items-center'} rounded-md ${collapsed ? 'px-0' : 'px-2'} py-2 text-sm font-medium
                    ${
                      isActive
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                    }`}
                >
                  <item.icon className={`h-5 w-5 flex-shrink-0 ${collapsed ? '' : 'mr-3'}`} />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </>
  )
}
