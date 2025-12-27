/**
 * Utilitário para retry de operações assíncronas com exponential backoff
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Executa uma função com retry automático em caso de falha
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    onRetry,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        const delay = Math.min(
          initialDelay * Math.pow(2, attempt),
          maxDelay
        );
        
        if (onRetry) {
          onRetry(attempt + 1, lastError);
        }
        
        console.log(`🔄 Tentativa ${attempt + 1}/${maxRetries} falhou. Tentando novamente em ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error("Falha após múltiplas tentativas");
}
















