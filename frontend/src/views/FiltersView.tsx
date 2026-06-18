import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Filter, RotateCcw, Loader2, Info, Check, Search } from 'lucide-react'
import * as RadixSlider from '@radix-ui/react-slider'
import { useStore } from '../store/useStore'
import { applyFilters, resetFilters, getPerformance } from '../api/client'
import type { FilterRequest } from '../types'
import { formatNumber } from '../lib/utils'
import { cn } from '../lib/utils'

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">
      {children}
    </h3>
  )
}

export default function FiltersView() {
  const { session, updateSession } = useStore()

  // Date filter
  const [useDateFilter, setUseDateFilter] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Duration filter
  const [useDurationFilter, setUseDurationFilter] = useState(false)
  const [durationRange, setDurationRange] = useState<[number, number]>([0, 365])
  const [maxDuration, setMaxDuration] = useState(365)

  // Start/End activity
  const [useStartAct, setUseStartAct] = useState(false)
  const [startActivity, setStartActivity] = useState('')
  const [useEndAct, setUseEndAct] = useState(false)
  const [endActivity, setEndActivity] = useState('')

  // Required activities
  const [useRequiredActs, setUseRequiredActs] = useState(false)
  const [requiredActs, setRequiredActs] = useState<string[]>([])
  const [actSearch, setActSearch] = useState('')

  const [applying, setApplying] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!session) return
    // load max duration from performance endpoint
    getPerformance(session.sessionId)
      .then((d) => {
        const maxDays = d.kpis.maxDuration / 86400
        setMaxDuration(Math.ceil(maxDays))
        setDurationRange([0, Math.ceil(maxDays)])
      })
      .catch(() => {})
  }, [session?.sessionId])

  if (!session) return null

  const activities = session.activities ?? []
  const filteredActivities = activities.filter((a) =>
    a.toLowerCase().includes(actSearch.toLowerCase()),
  )

  const handleApply = async () => {
    setApplying(true)
    setStatusMsg(null)
    const req: FilterRequest = {}

    if (useDateFilter && dateFrom) req.dateFrom = dateFrom
    if (useDateFilter && dateTo) req.dateTo = dateTo
    if (useDurationFilter) {
      req.minDurationDays = durationRange[0]
      req.maxDurationDays = durationRange[1]
    }
    if (useStartAct && startActivity) req.startActivity = startActivity
    if (useEndAct && endActivity) req.endActivity = endActivity
    if (useRequiredActs && requiredActs.length > 0) req.requiredActivities = requiredActs

    try {
      const updated = await applyFilters(session.sessionId, req)
      updateSession(updated)
      const pct = updated.totalCases > 0
        ? ((updated.filteredCases / updated.totalCases) * 100).toFixed(1)
        : '0'
      setStatusMsg(
        `Filters applied: ${formatNumber(session.totalCases)} → ${formatNumber(updated.filteredCases)} cases (${pct}% retained)`,
      )
    } catch {
      setStatusMsg('Failed to apply filters')
    } finally {
      setApplying(false)
    }
  }

  const handleReset = async () => {
    setResetting(true)
    setStatusMsg(null)
    try {
      const updated = await resetFilters(session.sessionId)
      updateSession(updated)
      setUseDateFilter(false)
      setUseDurationFilter(false)
      setUseStartAct(false)
      setUseEndAct(false)
      setUseRequiredActs(false)
      setRequiredActs([])
      setStatusMsg('All filters removed. Using full log.')
    } catch {
      setStatusMsg('Failed to reset filters')
    } finally {
      setResetting(false)
    }
  }

  const toggleRequiredAct = (act: string) => {
    setRequiredActs((prev) =>
      prev.includes(act) ? prev.filter((a) => a !== act) : [...prev, act],
    )
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <Filter className="w-5 h-5 text-pink-500" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Advanced Filters</h2>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
          <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Filters applied here propagate to all views — Discovery, Variants, and Performance.
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-4">
        {/* LEFT COLUMN */}
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          {/* Date range */}
          <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <SectionHeader>Time Range</SectionHeader>
              <button
                onClick={() => setUseDateFilter((v) => !v)}
                className={cn(
                  'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                  useDateFilter ? 'bg-indigo-500' : 'bg-gray-200 dark:bg-gray-700',
                )}
              >
                <span
                  className={cn(
                    'inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform',
                    useDateFilter ? 'translate-x-4' : 'translate-x-1',
                  )}
                />
              </button>
            </div>
            <div className={cn('space-y-3 transition-opacity', !useDateFilter && 'opacity-40 pointer-events-none')}>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="mt-1 w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="mt-1 w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Duration */}
          <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <SectionHeader>Case Duration</SectionHeader>
              <button
                onClick={() => setUseDurationFilter((v) => !v)}
                className={cn(
                  'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                  useDurationFilter ? 'bg-indigo-500' : 'bg-gray-200 dark:bg-gray-700',
                )}
              >
                <span
                  className={cn(
                    'inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform',
                    useDurationFilter ? 'translate-x-4' : 'translate-x-1',
                  )}
                />
              </button>
            </div>
            <div className={cn('space-y-3 transition-opacity', !useDurationFilter && 'opacity-40 pointer-events-none')}>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{durationRange[0].toFixed(0)} days</span>
                <span>{durationRange[1].toFixed(0)} days</span>
              </div>
              <RadixSlider.Root
                min={0}
                max={maxDuration}
                step={0.5}
                value={durationRange}
                onValueChange={(v) => setDurationRange(v as [number, number])}
                className="relative flex items-center select-none touch-none w-full h-5"
              >
                <RadixSlider.Track className="bg-gray-200 dark:bg-gray-700 relative grow rounded-full h-1.5">
                  <RadixSlider.Range className="absolute bg-indigo-500 rounded-full h-full" />
                </RadixSlider.Track>
                <RadixSlider.Thumb className="block w-4 h-4 bg-white dark:bg-indigo-400 border-2 border-indigo-500 rounded-full shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer" />
                <RadixSlider.Thumb className="block w-4 h-4 bg-white dark:bg-indigo-400 border-2 border-indigo-500 rounded-full shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer" />
              </RadixSlider.Root>
            </div>
          </div>
        </motion.div>

        {/* RIGHT COLUMN */}
        <motion.div
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-4"
        >
          {/* Start / End Activity */}
          <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-4">
            {/* Start */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <SectionHeader>Start Activity</SectionHeader>
                <button
                  onClick={() => setUseStartAct((v) => !v)}
                  className={cn(
                    'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                    useStartAct ? 'bg-indigo-500' : 'bg-gray-200 dark:bg-gray-700',
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform',
                      useStartAct ? 'translate-x-4' : 'translate-x-1',
                    )}
                  />
                </button>
              </div>
              <select
                disabled={!useStartAct}
                value={startActivity}
                onChange={(e) => setStartActivity(e.target.value)}
                className={cn(
                  'w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500',
                  !useStartAct && 'opacity-40',
                )}
              >
                <option value="">Select activity…</option>
                {activities.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            {/* End */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <SectionHeader>End Activity</SectionHeader>
                <button
                  onClick={() => setUseEndAct((v) => !v)}
                  className={cn(
                    'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                    useEndAct ? 'bg-indigo-500' : 'bg-gray-200 dark:bg-gray-700',
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform',
                      useEndAct ? 'translate-x-4' : 'translate-x-1',
                    )}
                  />
                </button>
              </div>
              <select
                disabled={!useEndAct}
                value={endActivity}
                onChange={(e) => setEndActivity(e.target.value)}
                className={cn(
                  'w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500',
                  !useEndAct && 'opacity-40',
                )}
              >
                <option value="">Select activity…</option>
                {activities.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Required Activities */}
          <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <SectionHeader>Required Activities</SectionHeader>
              <button
                onClick={() => setUseRequiredActs((v) => !v)}
                className={cn(
                  'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                  useRequiredActs ? 'bg-indigo-500' : 'bg-gray-200 dark:bg-gray-700',
                )}
              >
                <span
                  className={cn(
                    'inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform',
                    useRequiredActs ? 'translate-x-4' : 'translate-x-1',
                  )}
                />
              </button>
            </div>
            <div className={cn('space-y-2 transition-opacity', !useRequiredActs && 'opacity-40 pointer-events-none')}>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search activities…"
                  value={actSearch}
                  onChange={(e) => setActSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                {filteredActivities.map((act) => {
                  const checked = requiredActs.includes(act)
                  return (
                    <button
                      key={act}
                      onClick={() => toggleRequiredAct(act)}
                      className={cn(
                        'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors',
                        checked
                          ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300',
                      )}
                    >
                      <span
                        className={cn(
                          'flex items-center justify-center w-3.5 h-3.5 rounded border transition-colors shrink-0',
                          checked
                            ? 'bg-indigo-500 border-indigo-500'
                            : 'border-gray-300 dark:border-gray-600',
                        )}
                      >
                        {checked && <Check className="w-2.5 h-2.5 text-white" />}
                      </span>
                      <span className="truncate">{act}</span>
                    </button>
                  )
                })}
              </div>
              {requiredActs.length > 0 && (
                <p className="text-[10px] text-indigo-500">
                  {requiredActs.length} selected
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="flex items-center gap-3"
      >
        <button
          disabled={applying}
          onClick={handleApply}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors shadow-lg shadow-indigo-900/20"
        >
          {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Filter className="w-4 h-4" />}
          Apply Filters
        </button>
        <button
          disabled={resetting}
          onClick={handleReset}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm font-medium transition-colors disabled:opacity-50"
        >
          {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
          Reset All
        </button>
        {statusMsg && (
          <motion.p
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-sm text-gray-500 dark:text-gray-400"
          >
            {statusMsg}
          </motion.p>
        )}
      </motion.div>

      {/* Status card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
      >
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
          Filter Status
        </h3>
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
            <p className="text-xs text-gray-500 mb-1">Original Cases</p>
            <p className="text-xl font-black text-gray-900 dark:text-white">
              {formatNumber(session.totalCases)}
            </p>
          </div>
          <div className="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
            <p className="text-xs text-gray-500 mb-1">Filtered Cases</p>
            <p
              className={cn(
                'text-xl font-black',
                session.isFiltered
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-gray-900 dark:text-white',
              )}
            >
              {formatNumber(session.filteredCases)}
              {session.isFiltered && (
                <span className="text-sm ml-1">
                  ({session.filteredCases > session.totalCases ? '+' : ''}
                  {session.filteredCases - session.totalCases})
                </span>
              )}
            </p>
          </div>
          <div className="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
            <p className="text-xs text-gray-500 mb-1">Filtered Events</p>
            <p className="text-xl font-black text-gray-900 dark:text-white">
              {formatNumber(session.filteredEvents)}
            </p>
          </div>
          <div className="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
            <p className="text-xs text-gray-500 mb-1">% Retained</p>
            <p
              className={cn(
                'text-xl font-black',
                session.isFiltered ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400',
              )}
            >
              {session.totalCases > 0
                ? ((session.filteredCases / session.totalCases) * 100).toFixed(1)
                : '—'}
              %
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
