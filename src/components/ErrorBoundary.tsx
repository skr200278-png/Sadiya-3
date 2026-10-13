import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public handleReload = () => {
    window.location.reload();
  };

  public handleGoHome = () => {
    window.location.hash = '#/';
    this.setState({ hasError: false, error: null });
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-6 text-center space-y-4">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <AlertTriangle size={28} />
            </div>
            
            <div className="space-y-1">
              <h2 className="text-lg font-black text-slate-900">
                সাময়িক ত্রুটি ঘটেছে
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                অ্যাপটি লোড করার সময় একটি ত্রুটি ধরা পড়েছে। অনুগ্রহ করে পেজটি রিফ্রেশ করুন অথবা হোম পেজে ফিরে যান।
              </p>
            </div>

            {this.state.error?.message && (
              <div className="bg-slate-100 p-2.5 rounded-lg text-left text-[11px] font-mono text-slate-700 overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-sm cursor-pointer transition-all"
              >
                <RotateCcw size={14} />
                রিফ্রেশ করুন
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 px-4 rounded-xl text-xs border border-slate-300 cursor-pointer transition-all"
              >
                <Home size={14} />
                হোমে ফিরে যান
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
