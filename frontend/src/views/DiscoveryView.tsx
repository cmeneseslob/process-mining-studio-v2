import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Network, Loader2, AlertCircle, Activity, GitCommitHorizontal, Users } from 'lucide-react'
import * as RadixSlider from '@radix-ui/react-slider'
import { useStore } from '../store/useStore'
import { getDFG } from '../api/client'
import DFGGraph from '../components/graph/DFGGraph'
import type { DFGResponse } from '../types'
import { formatNumber } from '../lib/utils'
import { cn } from '../lib/utils'

function Slider({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}</span>
        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{value}%</span>
      </div>
      <RadixSlider.Root
        min={10}
        max={100}
        step={5}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        className="relative flex items-center select-none touch-none w-full h-5"
      >
        <RadixSlider.Track className="bg-gray-200 dark:bg-gray-700 relative grow rounded-full h-1.5">
          <RadixSlider.Range className="absolute bg-indigo-500 rounded-full h-full" />
        </RadixSlider.Track>
        <RadixSlider.Thumb className="block w-4 h-4 bg-white dark:bg-indigo-400 border-2 border-indigo-500 rounded-full shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition-shadow cursor-pointer" />
      </RadixSlider.Root>
    </div>
  )
}

export default function DiscoveryView() {
  const session = useStore((s) => s.session)
  const [mode, setMode] = useState<'frequency' | 'performance'>('frequency')
  const [activitiesPct, setActivitiesPct] = useState(80)
  const [pathsPct, setPathsPct] = useState(80)
  const [data, setData] = useState<DFGResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDFG = useCallback(async () => {
    if (!session) return
    setLoading(true)
    setError(null)
    try {
      const result = await getDFG(session.sessionId, mode, activitiesPct, pathsPct)
      setData(result)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg || 'Failed to load process map')
    } finally {
      setLoading(false)
    }
  }, [session?.sessionId, mode, activitiesPct, pathsPct])

  useEffect(() => {
    const timer = setTimeout(fetchDFG, 400)
    return () => clearTimeout(timer)
  }, [fetchDFG])

  if (!session) return null

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <Network className="w-5 h-5 text-indigo-500" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Process Discovery</h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Directly-Follows Graph — interactive, pannable, zoomable
        </p>
      </motion.div>

      <div className="flex gap-4">
        {/* Controls panel */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="w-64 shrink-0 space-y-4"
        >
          <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-4">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
              Graph Metric
            </h3>
            <div className="space-y-2">
              {(['frequency', 'performance'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all border',
                    mode === m
                      ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800',
                  )}
                >
                  <span
                    className={cn(
                      'w-2 h-2 rounded-full',
                      mode === m ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600',
                    )}
                  />
                  {m === 'frequency' ? 'Frequency' : 'Performance'}
                </button>
              ))}
            </div>

            <div className="h-px bg-gray-100 dark:bg-gray-800" />

            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
              Filters
            </h3>
            <Slider label="Activities (%)" value={activitiesPct} onChange={setActivitiesPct} />
            <Slider label="Paths (%)" value={pathsPct} onChange={setPathsPct} />

            <p className="text-[10px] text-gray-400 dark:text-gray-500">
              Adjust sliders to simplify or expand the map (Disco-style)
            </p>
          </div>

          {/* Stats */}
          {data && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-3"
            >
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                Visible
              </h3>
              {[
                { icon: Activity, label: 'Activities', value: data.visibleActivities },
                { icon: GitCommitHorizontal, label: 'Arcs', value: data.visibleArcs },
                { icon: Users, label: 'Cases', value: data.totalCases },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {formatNumber(value)}
                  </span>
                </div>
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* Graph area */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="flex-1 min-w-0"
        >
          {loading && (
            <div className="w-full h-[560px] rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-900 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                <p className="text-sm">Building process map…</p>
              </div>
            </div>
          )}
          {!loading && error && (
            <div className="w-full h-[560px] rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-rose-500">
                <AlertCircle className="w-8 h-8" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            </div>
          )}
          {!loading && !error && data && <DFGGraph data={data} />}
        </motion.div>
      </div>
    </div>
  )
}
