/**
 * Rate Limiter Client-Side
 * Previne tentativas excessivas de login e outras operações
 *
 * NOTA: Esta é uma proteção client-side básica.
 * Para proteção completa, implemente rate limiting server-side
 * (Firebase App Check ou API Routes com middleware)
 */

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number; // Janela de tempo em milissegundos
  blockDurationMs: number; // Tempo de bloqueio após exceder limite
}

interface AttemptRecord {
  count: number;
  firstAttempt: number;
  blockedUntil?: number;
}

class RateLimiter {
  private attempts: Map<string, AttemptRecord> = new Map();

  /**
   * Verifica se uma ação está bloqueada por rate limiting
   */
  isBlocked(key: string, config: RateLimitConfig): boolean {
    const record = this.attempts.get(key);
    if (!record) return false;

    // Verifica se está no período de bloqueio
    if (record.blockedUntil && Date.now() < record.blockedUntil) {
      return true;
    }

    // Se passou o período de bloqueio, limpa o registro
    if (record.blockedUntil && Date.now() >= record.blockedUntil) {
      this.attempts.delete(key);
      return false;
    }

    return false;
  }

  /**
   * Registra uma tentativa e retorna se deve bloquear
   */
  attempt(key: string, config: RateLimitConfig): {
    allowed: boolean;
    remainingAttempts: number;
    blockedUntil?: number;
  } {
    const now = Date.now();
    const record = this.attempts.get(key);

    // Se está bloqueado, retorna bloqueado
    if (this.isBlocked(key, config)) {
      return {
        allowed: false,
        remainingAttempts: 0,
        blockedUntil: record?.blockedUntil,
      };
    }

    // Se não tem registro ou a janela expirou, cria novo
    if (!record || now - record.firstAttempt > config.windowMs) {
      this.attempts.set(key, {
        count: 1,
        firstAttempt: now,
      });
      return {
        allowed: true,
        remainingAttempts: config.maxAttempts - 1,
      };
    }

    // Incrementa contador
    record.count++;

    // Se excedeu o limite, bloqueia
    if (record.count > config.maxAttempts) {
      record.blockedUntil = now + config.blockDurationMs;
      this.attempts.set(key, record);
      return {
        allowed: false,
        remainingAttempts: 0,
        blockedUntil: record.blockedUntil,
      };
    }

    // Ainda dentro do limite
    this.attempts.set(key, record);
    return {
      allowed: true,
      remainingAttempts: config.maxAttempts - record.count,
    };
  }

  /**
   * Reseta o rate limit para uma chave (útil após login bem-sucedido)
   */
  reset(key: string): void {
    this.attempts.delete(key);
  }

  /**
   * Obtém informações sobre o rate limit atual
   */
  getInfo(key: string, config: RateLimitConfig): {
    attemptsUsed: number;
    remainingAttempts: number;
    isBlocked: boolean;
    blockedUntil?: number;
  } {
    const record = this.attempts.get(key);
    const blocked = this.isBlocked(key, config);

    if (!record) {
      return {
        attemptsUsed: 0,
        remainingAttempts: config.maxAttempts,
        isBlocked: false,
      };
    }

    return {
      attemptsUsed: record.count,
      remainingAttempts: Math.max(0, config.maxAttempts - record.count),
      isBlocked: blocked,
      blockedUntil: record.blockedUntil,
    };
  }
}

// Instância singleton
export const rateLimiter = new RateLimiter();

// Configurações pré-definidas
export const RATE_LIMIT_CONFIGS = {
  login: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutos
    blockDurationMs: 30 * 60 * 1000, // 30 minutos de bloqueio
  },
  passwordReset: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hora
    blockDurationMs: 60 * 60 * 1000, // 1 hora de bloqueio
  },
  booking: {
    maxAttempts: 10,
    windowMs: 60 * 60 * 1000, // 1 hora
    blockDurationMs: 10 * 60 * 1000, // 10 minutos de bloqueio
  },
} as const;

/**
 * Formata o tempo restante de bloqueio
 */
export function formatBlockedTime(blockedUntil: number): string {
  const remaining = Math.ceil((blockedUntil - Date.now()) / 1000);
  if (remaining <= 0) return '0 segundos';

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  if (minutes > 0) {
    return `${minutes} minuto${minutes > 1 ? 's' : ''} e ${seconds} segundo${seconds !== 1 ? 's' : ''}`;
  }

  return `${seconds} segundo${seconds !== 1 ? 's' : ''}`;
}
