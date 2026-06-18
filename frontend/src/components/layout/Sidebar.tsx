import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Cpu,
  Upload,
  GitBranch,
  TrendingUp,
  Filter,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  Loader2,
  Network,
  X,
} from 'lucide-react'
import { useStore } from '../../store/useStore'
import { uploadDemo, uploadFile, previewCSV } from '../../api/client'
import { cn } from '../../lib/utils'
import type { View } from '../../store/useStore'

const NAV_ITEMS: { view: View; icon: typeof Network; label: string }[] = [
  { view: 'discovery', icon: Network, label: 'Discovery' },
  { view: 'variants', icon: GitBranch, label: 'Variants' },
  { view: 'performance', icon: TrendingUp, label: 'Performance' },
  { view: 'filters', icon: Filter, label: 'Filters' },
]

export default function Sidebar() {
  const { session, activeView, sidebarOpen, darkMode, setSession, setActiveView, toggleDarkMode, toggleSidebar } =
    useStore()

  const [dragging, setDragging] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [columns, setColumns] = useState<string[]>([])
  const [caseCol, setCaseCol] = useState('')
  const [actCol, setActCol] = useState('')
  const [tsCol, setTsCol] = useState('')
  const [resCol, setResCol] = useState('')
  const [costColState, setCostColState] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const guessCol = (cols: string[], hints: string[]): string => {
    const lower = cols.map((c) => c.toLowerCase())
    for (const hint of hints) {
      const idx = lower.findIndex((c) => c.includes(hint))
      if (idx >= 0) return cols[idx]
    }
    return cols[0] ?? ''
  }

  const handleFile = useCallback(async (file: File) => {
    setError(null)
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext === 'csv') {
      const cols = await previewCSV(file)
      setColumns(cols)
      setCaseCol(guessCol(cols, ['case', 'caseid', 'case_id', 'traceid']))
      setActCol(guessCol(cols, ['activity', 'actividad', 'task', 'event', 'action']))
      setTsCol(guessCol(cols, ['timestamp', 'time', 'date', 'fecha', 'start']))
      setResCol('')
      setCostColState('')
      setPendingFile(file)
    } else if (ext === 'xes') {
      setPendingFile(file)
      setColumns([])
      await processUpload(file, '', '', '', '', '')
    } else {
      setError('Unsupported format. Use CSV or XES.')
    }
  }, [])

  const processUpload = async (
    file: File,
    caseId: string,
    act: string,
    ts: string,
    res: string,
    cost: string,
  ) => {
    setLoading(true)
    setError(null)
    try {
      const info = await uploadFile(file, caseId, act, ts, res || undefined, cost || undefined)
      setSession(info)
      setPendingFile(null)
      setColumns([])
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile],
  )

  const handleDemo = async () => {
    setLoading(true)
    setError(null)
    try {
      const info = await uploadDemo()
      setSession(info)
      setPendingFile(null)
      setColumns([])
    } catch {
      setError('Failed to load demo')
    } finally {
      setLoading(false)
    }
  }

  const collapsed = !sidebarOpen

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 280 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="relative flex flex-col h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shrink-0 overflow-hidden"
    >
      {/* Toggle button */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-6 z-20 flex items-center justify-center w-6 h-6 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3 text-gray-500" />
        ) : (
          <ChevronLeft className="w-3 h-3 text-gray-500" />
        )}
      </button>

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 shrink-0">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shrink-0">
          <Cpu className="w-4 h-4 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="min-w-0"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-gray-900 dark:text-white truncate">
                  Process Mining
                </span>
                <span className="px-1 py-0.5 text-[10px] font-bold rounded bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
                  v2
                </span>
              </div>
              <p className="text-[10px] text-gray-400 truncate">Powered by PM4Py</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1 overflow-y-auto px-3 space-y-4 pb-4">
        {/* Upload section */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-1">
                Data Source
              </p>

              {/* Drop zone */}
              {!pendingFile && (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed cursor-pointer transition-all text-center',
                    dragging
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
                      : 'border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-gray-50 dark:hover:bg-gray-800/50',
                  )}
                >
                  <Upload className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                      Drop CSV or XES
                    </p>
                    <p className="text-[10px] text-gray-400">or click to browse</p>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xes"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFile(file)
                  e.target.value = ''
                }}
              />

              {/* CSV column mapping */}
              {pendingFile && columns.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">
                      {pendingFile.name}
                    </p>
                    <button
                      onClick={() => { setPendingFile(null); setColumns([]) }}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {[
                    { label: 'Case ID *', value: caseCol, setter: setCaseCol },
                    { label: 'Activity *', value: actCol, setter: setActCol },
                    { label: 'Timestamp *', value: tsCol, setter: setTsCol },
                  ].map(({ label, value, setter }) => (
                    <div key={label}>
                      <label className="text-[10px] text-gray-500 dark:text-gray-400">{label}</label>
                      <select
                        value={value}
                        onChange={(e) => setter(e.target.value)}
                        className="w-full mt-0.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        {columns.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                  {[
                    { label: 'Resource (opt)', value: resCol, setter: setResCol },
                    { label: 'Cost (opt)', value: costColState, setter: setCostColState },
                  ].map(({ label, value, setter }) => (
                    <div key={label}>
                      <label className="text-[10px] text-gray-500 dark:text-gray-400">{label}</label>
                      <select
                        value={value}
                        onChange={(e) => setter(e.target.value)}
                        className="w-full mt-0.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="">(none)</option>
                        {columns.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                  <button
                    disabled={loading || !caseCol || !actCol || !tsCol}
                    onClick={() => processUpload(pendingFile, caseCol, actCol, tsCol, resCol, costColState)}
                    className="w-full flex items-center justify-center gap-2 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors"
                  >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    Process Log
                  </button>
                </motion.div>
              )}

              {/* Demo button */}
              {!pendingFile && (
                <button
                  disabled={loading}
                  onClick={handleDemo}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FlaskConical className="w-4 h-4" />
                  )}
                  Load Demo Log
                </button>
              )}

              {error && (
                <p className="text-xs text-rose-500 dark:text-rose-400 px-1">{error}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed upload icon */}
        {collapsed && (
          <div className="flex flex-col items-center gap-2 pt-1">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
              title="Upload log"
            >
              <Upload className="w-5 h-5" />
            </button>
            <button
              disabled={loading}
              onClick={handleDemo}
              className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400 disabled:opacity-50"
              title="Load demo"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FlaskConical className="w-5 h-5" />}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xes"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFile(file)
                e.target.value = ''
              }}
            />
          </div>
        )}

        {/* Navigation */}
        {session && (
          <>
            {!collapsed && (
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-1 pt-2">
                Analysis
              </p>
            )}
            <nav className="space-y-1">
              {NAV_ITEMS.map(({ view, icon: Icon, label }) => {
                const active = activeView === view
                return (
                  <button
                    key={view}
                    onClick={() => setActiveView(view)}
                    className={cn(
                      'w-full flex items-center gap-3 px-2.5 py-2 rounded-xl transition-all text-sm font-medium',
                      active
                        ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200',
                      collapsed && 'justify-center px-0',
                    )}
                    title={collapsed ? label : undefined}
                  >
                    <Icon className="w-4.5 h-4.5 shrink-0" style={{ width: 18, height: 18 }} />
                    {!collapsed && label}
                    {!collapsed && active && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    )}
                  </button>
                )
              })}
            </nav>
          </>
        )}
      </div>

      {/* Bottom bar */}
      <div className={cn('shrink-0 border-t border-gray-200 dark:border-gray-800 p-3', collapsed && 'flex justify-center')}>
        <button
          onClick={toggleDarkMode}
          className={cn(
            'flex items-center gap-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400',
            collapsed ? 'p-2' : 'w-full px-2.5 py-2 text-sm',
          )}
          title="Toggle dark mode"
        >
          {darkMode ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
          {!collapsed && <span>{darkMode ? 'Light mode' : 'Dark mode'}</span>}
        </button>
      </div>
    </motion.aside>
  )
}
