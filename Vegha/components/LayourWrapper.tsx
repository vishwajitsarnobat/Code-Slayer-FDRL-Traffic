'use client'

import { usePathname } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isDashboard = pathname?.startsWith('/dashboard') || false
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {isDashboard && <Navbar />}
      {isDashboard && <Sidebar />}
      
      {/* Main content */}
      <div className={isDashboard ? "md:pl-64 pt-16" : ""}>
        <main className={isDashboard ? "py-6" : ""}>
          <div className={isDashboard ? "mx-auto max-w-screen px-4 sm:px-6 lg:px-8" : ""}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}