import React, { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Error en la interfaz:', error, info)
  }

  handleReset = () => {
    this.setState({ error: null })
    window.location.reload()
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-[#F5F3EF] dark:bg-[#0D0D0F] flex items-center justify-center p-6">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#333337] border border-red-200/80 dark:border-red-800/50 shadow-xl dark:shadow-black/50 p-8 text-center">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-base font-bold text-ink mb-1">Ocurrió un error en la interfaz</h2>
            <p className="text-xs text-ink-muted/80 leading-relaxed mb-4 break-words">
              {String(this.state.error?.message || this.state.error)}
            </p>
            <button onClick={this.handleReset} className="btn-primary shadow-lg shadow-brand-900/20">
              Recargar página
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
