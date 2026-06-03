'use client'

import { Component, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  section?: string
}

interface State {
  hasError: boolean
  error?: Error
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="glass rounded-2xl p-6 border border-red-500/20 text-center">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-red-400 mb-1">
            {this.props.section || 'Section'} Error
          </h3>
          <p className="text-xs text-muted-foreground">
            {this.state.error?.message || 'Something went wrong'}
          </p>
        </div>
      )
    }
    return this.props.children
  }
}
