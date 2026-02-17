import { Toaster } from 'react-hot-toast'
import { useRoutes } from 'react-router-dom'
import { routes } from './routes'
import './theme/Toast.css'

const toastOptions = {
  duration: 4000,
  style: {
    background: '#141416',
    color: '#fff',
    border: '1px solid rgba(0,255,136,0.2)',
    borderRadius: '10px',
    padding: '0.75rem 1rem',
    fontSize: '0.875rem',
    maxWidth: '360px',
  },
  success: {
    iconTheme: {
      primary: '#00FF88',
      secondary: '#141416',
    },
  },
  error: {
    iconTheme: {
      primary: '#FF3366',
      secondary: '#141416',
    },
  },
  loading: {
    iconTheme: {
      primary: '#00D4FF',
      secondary: '#141416',
    },
  },
}

function App() {
  return (
    <>
      {useRoutes(routes)}
      <Toaster
        position="top-right"
        containerClassName="toast-container"
        toastOptions={toastOptions}
      />
    </>
  )
}

export default App
