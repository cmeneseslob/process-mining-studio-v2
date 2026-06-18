export interface SessionInfo {
  sessionId: string
  logName: string
  totalCases: number
  totalEvents: number
  filteredCases: number
  filteredEvents: number
  isFiltered: boolean
  activities: string[]
}

export interface DFGNode {
  id: string
  label: string
  value: number
  isStart: boolean
  isEnd: boolean
}

export interface DFGEdge {
  id: string
  source: string
  target: string
  value: number
}

export interface DFGResponse {
  nodes: DFGNode[]
  edges: DFGEdge[]
  mode: string
  totalCases: number
  visibleActivities: number
  visibleArcs: number
}

export interface VariantRow {
  id: number
  flow: string[]
  flowStr: string
  count: number
  percentage: number
  cumulativePercentage: number
  steps: number
}

export interface VariantsResponse {
  variants: VariantRow[]
  totalCases: number
  totalVariants: number
  top5Coverage: number
}

export interface PerformanceKPIs {
  meanDuration: number
  medianDuration: number
  minDuration: number
  maxDuration: number
  totalCases: number
  totalEvents: number
}

export interface PerformanceResponse {
  kpis: PerformanceKPIs
  histogram: Array<{ binLabel: string; count: number; binStart: number; binEnd: number }>
  workload: Array<{ date: string; activeCases: number }>
  percentiles: Array<{ p: number; valueDays: number }>
  activityFrequency: Array<{ activity: string; count: number }>
}

export interface FilterRequest {
  dateFrom?: string
  dateTo?: string
  minDurationDays?: number
  maxDurationDays?: number
  startActivity?: string
  endActivity?: string
  requiredActivities?: string[]
}
