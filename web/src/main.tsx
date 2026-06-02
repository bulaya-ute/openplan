import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { applyTheme } from './store/theme'

const stored = (localStorage.getItem('openplan_theme') as 'system' | 'light' | 'dark') ?? 'system';
applyTheme(stored);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
