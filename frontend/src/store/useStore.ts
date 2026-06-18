import { create } from 'zustand'
import type { SessionInfo } from '../types'

export type View = 'welcome' | 'discovery' | 'variants' | 'performance' | 'filters'

interface AppState {
  session: SessionInfo | null
  activeView: View
  darkMode: boolean
  sidebarOpen: boolean
  setSession: (s: SessionInfo | null) => void
  updateSession: (s: SessionInfo) => void
  setActiveView: (v: View) => void
  toggleDarkMode: () => void
  toggleSidebar: () => void
}

export const useStore = create<AppState>((set) => ({
  session: null,
  activeView: 'welcome',
  darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
  sidebarOpen: true,
  setSession: (s) => set({ session: s, activeView: s ? 'discovery' : 'welcome' }),
  updateSession: (s) => set({ session: s }),
  setActiveView: (v) => set({ activeView: v }),
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}))
