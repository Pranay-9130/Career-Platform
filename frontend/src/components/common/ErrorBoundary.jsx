import React from 'react';
import { AlertCircle, RotateCcw, Home, ArrowLeft } from 'lucide-react';
import Button from './Button';

/**
 * Standard Error Boundary to prevent React component tree crashes from leaving blank screens.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[70vh] flex items-center justify-center bg-slate-50/60 py-16 px-4">
          <div className="max-w-md w-full bg-white border border-brand-border rounded-3xl p-8 text-center shadow-lg space-y-5 animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/60 mx-auto flex items-center justify-center shadow-xs">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="font-display font-bold text-xl text-brand-text">
                Something went wrong
              </h2>
              <p className="text-sm text-brand-muted leading-relaxed">
                We encountered an unexpected issue while rendering this experience. Our engineering logs have recorded the occurrence.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                variant="primary"
                onClick={this.handleReset}
                leftIcon={RotateCcw}
                className="w-full sm:w-auto justify-center"
              >
                Try Again
              </Button>
              <a href="/" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  leftIcon={Home}
                  className="w-full justify-center"
                >
                  Return Home
                </Button>
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
