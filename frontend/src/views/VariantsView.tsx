import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GitBranch, Loader2, AlertCircle, X } from 'lucide-react'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { useStore } from '../store/useStore'
import { getVariants } from '../api/client'
import type { VariantsResponse, VariantRow } from '../types'
import { formatNumber } from '../lib/utils'

function KPICard({
  label,
  value,
  delay,
}: {
  label: string
  value: string | number
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.3 }}
      className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
    >
      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-black text-gray-900 dark:text-white">{value}</p>
    </motion.div>
  )
}

function VariantModal({ variant, onClose }: { variant: VariantRow; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 10 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 max-w-2xl w-full shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">Variant {variant.id}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatNumber(variant.count)} cases · {variant.percentage}% · {variant.steps} steps
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {variant.flow.map((act, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-medium">
                {act}
              </span>
              {i < variant.flow.length - 1 && (
                <span className="text-gray-400 text-sm">→</span>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-400">
          Cumulative coverage up to this variant:{' '}
          <strong className="text-gray-700 dark:text-gray-200">
            {variant.cumulativePercentage}%
          </strong>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function VariantsView() {
  const session = useStore((s) => s.session)
  const [data, setData] = useState<VariantsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<VariantRow | null>(null)

  useEffect(() => {
    if (!session) return
    setLoading(true)
    setError(null)
    getVariants(session.sessionId)
      .then(setData)
      .catch((e) => {
        setError(
          (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
            'Failed to load variants',
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

  const top5Cases = data.variants.slice(0, 5).reduce((s, v) => s + v.count, 0)
  const chartData = data.variants.slice(0, 30).map((v) => ({
    id: `V${v.id}`,
    cases: v.count,
    pct: v.percentage,
    cumPct: v.cumulativePercentage,
  }))

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <GitBranch className="w-5 h-5 text-violet-500" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Variant Analysis</h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Process variants sorted by frequency with Pareto distribution
        </p>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <KPICard label="Total Variants" value={formatNumber(data.totalVariants)} delay={0} />
        <KPICard label="Total Cases" value={formatNumber(data.totalCases)} delay={0.05} />
        <KPICard label="Top 5 Coverage" value={`${data.top5Coverage.toFixed(1)}%`} delay={0.1} />
        <KPICard label="Cases in Top 5" value={formatNumber(top5Cases)} delay={0.15} />
      </div>

      {/* Pareto Chart */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
      >
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
          Top {Math.min(30, data.totalVariants)} Variants — Pareto Distribution
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis
              dataKey="id"
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={{ stroke: '#374151' }}
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={{ stroke: '#374151' }}
              label={{
                value: '% of Cases',
                angle: -90,
                position: 'insideLeft',
                fill: '#6b7280',
                fontSize: 11,
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 105]}
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={{ stroke: '#374151' }}
              label={{
                value: '% Cumulative',
                angle: 90,
                position: 'insideRight',
                fill: '#6b7280',
                fontSize: 11,
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#f9fafb',
                fontSize: 12,
              }}
              formatter={(value: number, name: string) => [
                name === 'cumPct' ? `${value.toFixed(1)}%` : `${value.toFixed(2)}%`,
                name === 'cumPct' ? 'Cumulative %' : '% of Cases',
              ]}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar yAxisId="left" dataKey="pct" fill="#6366f1" radius={[3, 3, 0, 0]} name="% of Cases" />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cumPct"
              stroke="#f43f5e"
              strokeWidth={2}
              dot={{ fill: '#f43f5e', r: 3 }}
              name="Cumulative %"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Variants Table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            All Variants ({formatNumber(data.totalVariants)})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50">
                {['#', 'Cases', 'Frequency', 'Cumulative', 'Steps', 'Flow'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.variants.map((v, i) => (
                <motion.tr
                  key={v.id}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.5) }}
                  onClick={() => setSelectedVariant(v)}
                  className="border-t border-gray-100 dark:border-gray-800 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 tabular-nums">
                    {v.id}
                  </td>
                  <td className="px-4 py-3 font-bold text-gray-900 dark:text-white tabular-nums">
                    {formatNumber(v.count)}
                  </td>
                  <td className="px-4 py-3 min-w-[140px]">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800">
                        <div
                          className="h-full rounded-full bg-indigo-500"
                          style={{ width: `${v.percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 tabular-nums w-12 text-right">
                        {v.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                    {v.cumulativePercentage.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                    {v.steps}
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <div className="flex flex-wrap gap-1">
                      {v.flow.slice(0, 4).map((act, j) => (
                        <span
                          key={j}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-medium"
                          title={act}
                        >
                          {act.length > 18 ? act.slice(0, 18) + '…' : act}
                        </span>
                      ))}
                      {v.flow.length > 4 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-medium">
                          +{v.flow.length - 4}
                        </span>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <AnimatePresence>
        {selectedVariant && (
          <VariantModal variant={selectedVariant} onClose={() => setSelectedVariant(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
