import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/tokens.css'
import './styles/globals.css'
import { applyInitialTheme } from './hooks/useTheme'

// Set the data-theme attribute before React mounts so first paint
// already matches the user's theme — eliminates the dark→light flash.
applyInitialTheme()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
