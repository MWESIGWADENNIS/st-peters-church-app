import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Something went wrong</h1>
          <p className="text-gray-500 max-w-xs mb-8">
            We encountered an unexpected error. This might be due to a connection issue or a temporary glitch.
          </p>
          
          <div className="flex flex-col w-full max-w-xs gap-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-lg flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" /> Try Refreshing
            </button>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.href = '/';
              }}
              className="w-full py-4 bg-gray-50 text-gray-600 font-bold rounded-2xl flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" /> Go to Home
            </button>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <div className="mt-12 p-4 bg-gray-50 rounded-xl text-left overflow-auto max-w-full">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Error Details</p>
              <pre className="text-xs text-red-500 font-mono">
                {this.state.error?.toString()}
              </pre>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
