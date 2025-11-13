import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { HashRouter as Router } from 'react-router-dom'
import { DraftProvider } from './components/DraftManager.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <DraftProvider>
        <App />
      </DraftProvider>
    </Router>
  </React.StrictMode>,
)