import { motion } from 'framer-motion'
import { Network, GitBranch, BarChart3, Filter } from 'lucide-react'

const features = [
  {
    icon: Network,
    title: 'Process Discovery',
    desc: 'Interactive DFG with React Flow — pan, zoom, filter by activity % and path %.',
    color: 'from-indigo-500 to-violet-600',
  },
  {
    icon: GitBranch,
    title: 'Variant Analysis',
    desc: 'Happy path and exception paths with Pareto chart and cumulative coverage stats.',
    color: 'from-violet-500 to-purple-600',
  },
  {
    icon: BarChart3,
    title: 'Performance & KPIs',
    desc: 'Cycle time histogram, workload chart, percentiles, and activity frequency.',
    color: 'from-purple-500 to-pink-600',
  },
  {
    icon: Filter,
    title: 'Advanced Filters',
    desc: 'Filter by date range, case duration, start/end activity, and required activities.',
    color: 'from-pink-500 to-rose-600',
  },
]

export default function WelcomeView() {
  return (
    <div className="max-w-4xl mx-auto py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-12"
      >
        <h1 className="text-5xl font-black mb-4 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 bg-clip-text text-transparent">
          Process Mining Studio
        </h1>
        <p className="text-xl text-gray-500 dark:text-gray-400">
          Interactive process analysis · Powered by PM4Py + React Flow
        </p>
      </motion.div>

      <div className="grid grid-cols-2 gap-4 mb-12">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            className="p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:shadow-lg dark:hover:shadow-gray-900 transition-all"
          >
            <div
              className={`inline-flex p-2.5 rounded-xl bg-gradient-to-br ${f.color} mb-3 shadow-lg`}
            >
              <f.icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">{f.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{f.desc}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="p-6 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 mb-6"
      >
        <h3 className="font-semibold text-indigo-700 dark:text-indigo-300 mb-2">
          How to get started
        </h3>
        <ol className="text-sm text-indigo-600 dark:text-indigo-400 space-y-1 list-decimal list-inside">
          <li>
            Upload a <strong>CSV</strong> or <strong>XES</strong> event log in the sidebar — or
            click <strong>Load Demo</strong>
          </li>
          <li>Map your columns (Case ID · Activity · Timestamp)</li>
          <li>Explore your process with the navigation in the sidebar</li>
        </ol>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="p-4 rounded-2xl bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
      >
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
          Sample event log sources
        </h3>
        <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <li>
            <a
              href="https://pm4py.fit.fraunhofer.de/datasets"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              PM4Py Datasets
            </a>
          </li>
          <li>
            <a
              href="https://data.4tu.nl/search?q=event+log"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              4TU Research Data – Event Logs
            </a>
          </li>
          <li>
            <a
              href="https://www.tf-pm.org/resources/logs"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              BPI Challenge logs (IEEE TF on PM)
            </a>
          </li>
        </ul>
      </motion.div>
    </div>
  )
}
