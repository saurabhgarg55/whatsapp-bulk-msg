import React, { Component, ErrorInfo, ReactNode } from 'react';

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
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Troika WhatsApp Sender - Uncaught component error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetStorage = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // Ignore
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8 text-center space-y-4">
            <div className="w-12 h-12 bg-[#0B1F3A] rounded-xl flex items-center justify-center mx-auto text-[#C9A24B] font-serif font-bold text-xl">
              T
            </div>
            <h1 className="text-xl font-bold text-[#0B1F3A]">Troika WhatsApp Sender</h1>
            <p className="text-sm text-slate-600">
              An unexpected error occurred while rendering the page.
            </p>
            {this.state.error?.message && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 text-left font-mono break-all">
                {this.state.error.message}
              </div>
            )}
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-2.5 px-4 bg-[#0B1F3A] hover:bg-[#162E52] text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Reload Page
              </button>
              <button
                type="button"
                onClick={this.handleResetStorage}
                className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors"
              >
                Clear Cache & Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
