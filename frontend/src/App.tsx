import { useEffect } from 'react'
import { useStore } from './store/useStore'
import AppLayout from './components/layout/AppLayout'

export default function App() {
  const darkMode = useStore((s) => s.darkMode)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  return <AppLayout />
}
