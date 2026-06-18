import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Loader2, AlertCircle } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  AreaChart,
  Area,
} from 'recharts'
import { useStore } from '../store/useStore'
import { getPerformance } from '../api/client'
import type { PerformanceResponse } from '../types'
import { secondsToHuman, formatNumber } from '../lib/utils'

interface KPICardProps {
  label: string
  value: string
  delay: number
  accent?: string
}

function KPICard({ label, value, delay, accent = 'indigo' }: KPICardProps) {
  const accentMap: Record<string, string> = {
    indigo: 'border-l-indigo-500',
    violet: 'border-l-violet-500',
    emerald: 'border-l-emerald-500',
    rose: 'border-l-rose-500',
    amber: 'border-l-amber-500',
    sky: 'border-l-sky-500',
  }
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.3 }}
      className={`p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 border-l-4 ${accentMap[accent] ?? accentMap.indigo}`}
    >
      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-xl font-black text-gray-900 dark:text-white leading-tight">{value}</p>
    </motion.div>
  )
}

export default function PerformanceView() {
  const session = useStore((s) => s.session)
  const [data, setData] = useState<PerformanceResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!session) return
    setLoading(true)
    setError(null)
    getPerformance(session.sessionId)
      .then(setData)
      .catch((e) => {
        setError(
          (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
            'Failed to load performance data',
        )
      })
      .finally(() => setLoading(false))
  }, [session?.sessionId])

  if (!session) return null

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-rose-500">
        <AlertCircle className="w-6 h-6 mr-2" />
        <span>{error}</span>
      </div>
    )
  }

  if (!data) return null

  const { kpis, histogram, workload, percentiles, activityFrequency } = data
  const meanDays = kpis.meanDuration / 86400
  const medianDays = kpis.medianDuration / 86400

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-5 h-5 text-purple-500" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Performance & KPIs</h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Cycle time analysis, workload trends, and activity statistics
        </p>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard label="Mean Cycle Time" value={secondsToHuman(kpis.meanDuration)} delay={0} accent="indigo" />
        <KPICard label="Median Cycle Time" value={secondsToHuman(kpis.medianDuration)} delay={0.05} accent="violet" />
        <KPICard label="Min Cycle Time" value={secondsToHuman(kpis.minDuration)} delay={0.1} accent="emerald" />
        <KPICard label="Max Cycle Time" value={secondsToHuman(kpis.maxDuration)} delay={0.15} accent="rose" />
        <KPICard label="Total Cases" value={formatNumber(kpis.totalCases)} delay={0.2} accent="amber" />
        <KPICard label="Total Events" value={formatNumber(kpis.totalEvents)} delay={0.25} accent="sky" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Histogram */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
        >
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Cycle Time Distribution
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={histogram} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis
                dataKey="binStart"
                tick={{ fill: '#6b7280', fontSize: 10 }}
                tickFormatter={(v) => `${v.toFixed(0)}d`}
                label={{ value: 'Duration (days)', position: 'insideBottom', offset: -12, fill: '#6b7280', fontSize: 11 }}
              />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#f9fafb',
                  fontSize: 12,
                }}
                formatter={(value: number) => [formatNumber(value), 'Cases']}
                labelFormatter={(v) => `~${Number(v).toFixed(1)} days`}
              />
              <ReferenceLine
                x={meanDays}
                stroke="#f43f5e"
                strokeDasharray="4 2"
                label={{ value: `Mean: ${meanDays.toFixed(1)}d`, fill: '#f43f5e', fontSize: 10, position: 'top' }}
              />
              <ReferenceLine
                x={medianDays}
                stroke="#10b981"
                strokeDasharray="4 2"
                label={{ value: `Median: ${medianDays.toFixed(1)}d`, fill: '#10b981', fontSize: 10, position: 'insideTopRight' }}
              />
              <Bar dataKey="count" fill="#6366f1" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Workload */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
        >
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Workload Over Time
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={workload} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
              <defs>
                <linearGradient id="workloadGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis
                dataKey="date"
                tick={{ fill: '#6b7280', fontSize: 10 }}
                tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                interval="preserveStartEnd"
                label={{ value: 'Date', position: 'insideBottom', offset: -12, fill: '#6b7280', fontSize: 11 }}
              />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#f9fafb',
                  fontSize: 12,
                }}
                formatter={(v: number) => [formatNumber(v), 'Active Cases']}
                labelFormatter={(v) => new Date(v).toLocaleDateString()}
              />
              <Area
                type="monotone"
                dataKey="activeCases"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#workloadGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Percentiles */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
      >
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
          Duration Percentiles
        </h3>
        <div className="grid grid-cols-7 gap-3">
          {percentiles.map((p, i) => (
            <motion.div
              key={p.p}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.05 }}
              className="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700"
            >
              <p className="text-[10px] font-bold text-indigo-500 uppercase mb-1">P{p.p}</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {p.valueDays.toFixed(2)}d
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Activity Frequency */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
      >
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
          Activity Frequency (Top 20)
        </h3>
        <ResponsiveContainer width="100%" height={Math.max(300, activityFrequency.length * 28)}>
          <BarChart
            data={activityFrequency}
            layout="vertical"
            margin={{ top: 5, right: 40, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} horizontal={false} />
            <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey="activity"
              width={200}
              tick={{ fill: '#6b7280', fontSize: 11 }}
              tickFormatter={(v: string) => (v.length > 28 ? v.slice(0, 28) + '…' : v)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#f9fafb',
                fontSize: 12,
              }}
              formatter={(v: number) => [formatNumber(v), 'Events']}
            />
            <Bar
              dataKey="count"
              fill="#8b5cf6"
              radius={[0, 4, 4, 0]}
              label={{ position: 'right', fill: '#6b7280', fontSize: 10, formatter: (v: number) => formatNumber(v) }}
            />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  )
}
