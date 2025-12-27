/**
 * Error Boundary básico para capturar erros React
 */
"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary capturou um erro:", error);
    console.error("Detalhes do erro:", errorInfo);
    console.error("Stack trace:", error.stack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorMessage = this.state.error?.message || "Erro desconhecido";
      const errorStack = this.state.error?.stack;

      return (
        <div className="min-h-screen flex items-center justify-center p-6 font-mono">
          <div className="bg-white border-4 border-black p-6 max-w-md w-full shadow-[8px_8px_0_0_#000]">
            <h2 className="text-2xl font-bold mb-4 text-red-600">Ops! Algo deu errado</h2>
            <p className="mb-4 text-gray-700">
              Ocorreu um erro inesperado. Por favor, recarregue a página.
            </p>
            {typeof window !== "undefined" && (
              <details className="mb-4 text-xs text-gray-600">
                <summary className="cursor-pointer font-bold mb-2">Detalhes do erro</summary>
                <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-40 text-xs">
                  {errorMessage}
                  {errorStack && `\n\n${errorStack}`}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-400 border-4 border-black px-4 py-2 font-bold hover:bg-blue-500 shadow-[4px_4px_0_0_#000]"
              aria-label="Recarregar página"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}







