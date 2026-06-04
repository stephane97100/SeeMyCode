import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state: { hasError: boolean; error: Error | null } = { hasError: false, error: null };
  props: { children: React.ReactNode };

  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 p-8 flex flex-col items-center justify-center font-sans">
          <div className="max-w-xl w-full bg-slate-950 p-6 rounded-2xl border border-red-500/20 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <span className="text-2xl font-bold">⚠️</span>
              <h2 className="text-lg font-bold">Erreur critique détectée au chargement</h2>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Une exception a provoqué l'arrêt de l'application. Veuillez copier-coller cette erreur à l'assistant pour qu'elle soit corrigée immédiatement :
            </p>
            <pre className="p-4 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-rose-400 overflow-x-auto whitespace-pre-wrap max-h-48">
              {this.state.error?.stack || this.state.error?.message || "Erreur inconnue"}
            </pre>
            <button
              onClick={() => {
                window.location.href = "/";
              }}
              className="mt-2 w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors"
            >
              Réinitialiser SeeMyCode (Retour à l'accueil)
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

