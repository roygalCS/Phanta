import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-semibold text-white mb-4">Something went wrong</h1>
            <p className="text-gray-400 mb-4">{this.state.error?.message || 'An error occurred'}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#1a73e8] text-white rounded-lg hover:bg-[#1557b0]"
            >
              Reload Page
            </button>
            <details className="mt-4 text-left">
              <summary className="text-gray-500 cursor-pointer">Error Details</summary>
              <pre className="mt-2 text-xs text-gray-600 overflow-auto">
                {this.state.error?.stack}
              </pre>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

