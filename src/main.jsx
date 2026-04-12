import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh', background: '#0a0a0a', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'monospace', padding: 40
        }}>
          <div style={{ maxWidth: 700 }}>
            <div style={{ color: '#FF2D55', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
              ⚠ GoGlobal crashed — here's the error:
            </div>
            <pre style={{
              background: '#1a1a1a', padding: 24, borderRadius: 12, overflow: 'auto',
              fontSize: 13, lineHeight: 1.6, color: '#FF9F0A',
              border: '1px solid rgba(255,45,85,0.3)', whiteSpace: 'pre-wrap', wordBreak: 'break-word'
            }}>
              {this.state.error.message}
              {'\n\n'}
              {this.state.error.stack}
            </pre>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)
