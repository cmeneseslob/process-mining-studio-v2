import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../../store/useStore'
import Sidebar from './Sidebar'
import WelcomeView from '../../views/WelcomeView'
import DiscoveryView from '../../views/DiscoveryView'
import VariantsView from '../../views/VariantsView'
import PerformanceView from '../../views/PerformanceView'
import FiltersView from '../../views/FiltersView'
import type { View } from '../../store/useStore'
import type { ComponentType } from 'react'

const views: Record<View, ComponentType> = {
  welcome: WelcomeView,
  discovery: DiscoveryView,
  variants: VariantsView,
  performance: PerformanceView,
  filters: FiltersView,
}

export default function AppLayout() {
  const { activeView, session } = useStore()
  const ActiveView = views[activeView]

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto min-w-0">
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-sm font-semibold text-gray-500 dark:text-gray-400 truncate">
              {session ? session.logName : 'No log loaded'}
            </h1>
            {session?.isFiltered && (
              <span className="shrink-0 px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                Filtered: {session.filteredCases.toLocaleString()} /{' '}
                {session.totalCases.toLocaleString()} cases
              </span>
            )}
            {session && !session.isFiltered && (
              <span className="shrink-0 px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                {session.totalCases.toLocaleString()} cases ·{' '}
                {session.totalEvents.toLocaleString()} events
              </span>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="p-6"
          >
            <ActiveView />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
