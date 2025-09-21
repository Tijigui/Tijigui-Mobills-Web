import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  showDetails?: boolean;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Update state with error details
    this.setState({
      error,
      errorInfo,
    });

    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Show toast notification
    toast.error('Ocorreu um erro inesperado', {
      description: 'Por favor, tente recarregar a página ou entre em contato com o suporte.',
      duration: 5000,
    });

    // Log to external service (if available)
    this.logErrorToService(error, errorInfo);
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // Here you could integrate with error tracking services like Sentry
    try {
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      };
      
      // Store error in localStorage as fallback
      const existingErrors = JSON.parse(
        localStorage.getItem('app-errors') || '[]'
      );
      existingErrors.push(errorData);
      
      // Keep only last 10 errors to avoid localStorage bloat
      if (existingErrors.length > 10) {
        existingErrors.splice(0, existingErrors.length - 10);
      }
      
      localStorage.setItem('app-errors', JSON.stringify(existingErrors));
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  };

  private handleRefresh = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleReportError = () => {
    const { error, errorInfo } = this.state;
    const errorReport = {
      error: error?.message || 'Unknown error',
      stack: error?.stack || '',
      componentStack: errorInfo?.componentStack || '',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Create a mailto link with error details
    const subject = encodeURIComponent('Relatório de Erro - FinanceApp');
    const body = encodeURIComponent(
      `Olá,\n\nEncontrei um erro na aplicação:\n\n${JSON.stringify(errorReport, null, 2)}`
    );
    
    window.open(`mailto:support@financeapp.com?subject=${subject}&body=${body}`);
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertTriangle className="h-16 w-16 text-destructive" />
              </div>
              <CardTitle className="text-2xl">
                Oops! Algo deu errado
              </CardTitle>
              <CardDescription>
                Ocorreu um erro inesperado na aplicação. Não se preocupe, seus dados estão seguros.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button onClick={this.handleRetry} variant="default">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Tentar Novamente
                </Button>
                <Button onClick={this.handleRefresh} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Recarregar Página
                </Button>
                <Button onClick={this.handleGoHome} variant="outline">
                  <Home className="h-4 w-4 mr-2" />
                  Ir para Início
                </Button>
              </div>

              {this.props.showDetails && this.state.error && (
                <Alert variant="destructive">
                  <Bug className="h-4 w-4" />
                  <AlertTitle>Detalhes do Erro</AlertTitle>
                  <AlertDescription>
                    <details className="mt-2">
                      <summary className="cursor-pointer font-medium">
                        Clique para ver detalhes técnicos
                      </summary>
                      <div className="mt-2 p-2 bg-muted rounded text-sm">
                        <p><strong>Mensagem:</strong> {this.state.error.message}</p>
                        {this.state.error.stack && (
                          <div className="mt-2">
                            <strong>Stack Trace:</strong>
                            <pre className="whitespace-pre-wrap text-xs mt-1">
                              {this.state.error.stack}
                            </pre>
                          </div>
                        )}
                      </div>
                    </details>
                  </AlertDescription>
                </Alert>
              )}

              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Se o problema persistir, por favor reporte o erro.
                </p>
                <Button onClick={this.handleReportError} variant="ghost" size="sm">
                  <Bug className="h-4 w-4 mr-2" />
                  Reportar Erro
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export const useErrorHandler = () => {
  const handleError = (error: Error, errorInfo?: ErrorInfo) => {
    console.error('Error caught by useErrorHandler:', error, errorInfo);
    
    toast.error('Ocorreu um erro', {
      description: error.message,
      duration: 5000,
    });
  };

  return handleError;
};

// HOC for wrapping components with error boundary
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

export default ErrorBoundary;