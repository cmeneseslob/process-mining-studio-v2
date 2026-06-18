import { Handle, Position } from '@xyflow/react'
import { secondsToHuman, formatNumber } from '../../lib/utils'
import { cn } from '../../lib/utils'

interface ActivityNodeData {
  label: string
  value: number
  isStart: boolean
  isEnd: boolean
  mode: string
  maxValue: number
}

export default function ActivityNode({ data }: { data: ActivityNodeData }) {
  const intensity = data.maxValue > 0 ? Math.min(data.value / data.maxValue, 1) : 0

  return (
    <div
      className={cn(
        'relative px-3 py-2 rounded-xl border-2 min-w-[140px] max-w-[180px]',
        'bg-gradient-to-br from-indigo-600 to-violet-700',
        'shadow-lg shadow-indigo-900/30',
        'text-white text-center cursor-default transition-all hover:scale-105 hover:shadow-xl hover:shadow-indigo-900/40',
      )}
      style={{
        opacity: 0.45 + intensity * 0.55,
        borderColor: `rgba(165,180,252,${0.3 + intensity * 0.7})`,
      }}
    >
      {data.isStart && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 text-[9px] font-bold rounded bg-emerald-500 text-white uppercase tracking-wide whitespace-nowrap">
          start
        </span>
      )}
      {data.isEnd && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 text-[9px] font-bold rounded bg-rose-500 text-white uppercase tracking-wide whitespace-nowrap">
          end
        </span>
      )}
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-white/50 !border-white/30 !w-2 !h-2"
      />
      <p
        className="text-xs font-semibold leading-tight text-white/90 mb-1 mt-0.5"
        title={data.label}
      >
        {data.label.length > 22 ? data.label.slice(0, 22) + '…' : data.label}
      </p>
      <p className="text-[11px] font-bold text-white/70">
        {data.mode === 'frequency' ? formatNumber(data.value) : secondsToHuman(data.value)}
      </p>
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-white/50 !border-white/30 !w-2 !h-2"
      />
    </div>
  )
}
