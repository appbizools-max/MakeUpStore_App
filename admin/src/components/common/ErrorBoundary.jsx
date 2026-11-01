import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export class AdminErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[AdminErrorBoundary] Operational error intercepted:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleResetState = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="bg-white max-w-lg w-full p-8 rounded-2xl shadow-xl border border-rose-100 text-center">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-200">
              <AlertCircle size={32} />
            </div>

            <h2 className="text-xl font-bold text-slate-800 mb-2">
              Panel Component Interrupted
            </h2>

            <p className="text-sm text-slate-500 leading-relaxed mb-6">
              An unexpected client error occurred while rendering this view. Your database connections and administrative privileges are protected.
            </p>

            {this.state.error && (
              <div className="text-left bg-slate-900 text-rose-300 p-3 rounded-lg text-xs font-mono mb-6 overflow-x-auto max-h-36">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={this.handleResetState}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-all flex items-center gap-2"
              >
                <RefreshCw size={16} /> Reset View
              </button>

              <button
                onClick={this.handleReload}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-sm transition-all shadow-sm flex items-center gap-2"
              >
                Reload Panel
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

