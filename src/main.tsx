import React from 'react'
import ReactDOM from 'react-dom/client'
import { AppProvider } from '@/store/AppProvider'
import { ToastProvider } from '@/shared/components/ToastProvider'
import App from '@/App'
import '@/index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProvider>
      <ToastProvider />
      <App />
    </AppProvider>
  </React.StrictMode>
)
