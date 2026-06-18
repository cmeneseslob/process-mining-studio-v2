import axios from 'axios'
import type {
  DFGResponse,
  FilterRequest,
  PerformanceResponse,
  SessionInfo,
  VariantsResponse,
} from '../types'

const api = axios.create({ baseURL: '/api' })

export const uploadDemo = (): Promise<SessionInfo> =>
  api.post('/sessions/demo').then((r) => r.data)

export const uploadFile = (
  file: File,
  caseIdCol: string,
  activityCol: string,
  timestampCol: string,
  resourceCol?: string,
  costCol?: string,
): Promise<SessionInfo> => {
  const form = new FormData()
  form.append('file', file)
  form.append('case_id_col', caseIdCol)
  form.append('activity_col', activityCol)
  form.append('timestamp_col', timestampCol)
  if (resourceCol) form.append('resource_col', resourceCol)
  if (costCol) form.append('cost_col', costCol)
  return api.post('/sessions/upload', form).then((r) => r.data)
}

export const getSessionInfo = (sessionId: string): Promise<SessionInfo> =>
  api.get(`/sessions/${sessionId}`).then((r) => r.data)

export const getDFG = (
  sessionId: string,
  mode: 'frequency' | 'performance',
  activitiesPct: number,
  pathsPct: number,
): Promise<DFGResponse> =>
  api
    .get(`/analysis/${sessionId}/dfg`, {
      params: { mode, activities_pct: activitiesPct, paths_pct: pathsPct },
    })
    .then((r) => r.data)

export const getVariants = (sessionId: string): Promise<VariantsResponse> =>
  api.get(`/analysis/${sessionId}/variants`).then((r) => r.data)

export const getPerformance = (sessionId: string): Promise<PerformanceResponse> =>
  api.get(`/analysis/${sessionId}/performance`).then((r) => r.data)

export const applyFilters = (sessionId: string, filters: FilterRequest): Promise<SessionInfo> =>
  api.post(`/analysis/${sessionId}/filters`, filters).then((r) => r.data)

export const resetFilters = (sessionId: string): Promise<SessionInfo> =>
  api.delete(`/analysis/${sessionId}/filters`).then((r) => r.data)

export const previewCSV = async (file: File): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const firstLine = text.split('\n')[0]
      const sep = firstLine.includes(';') ? ';' : ','
      resolve(firstLine.split(sep).map((c) => c.trim().replace(/^"|"$/g, '')))
    }
    reader.onerror = reject
    reader.readAsText(file.slice(0, 4096))
  })
}
