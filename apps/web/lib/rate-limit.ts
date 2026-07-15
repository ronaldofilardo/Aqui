import { NextRequest, NextResponse } from 'next/server';

/**
 * Rate Limiter simples baseado em IP e rota
 * Armazena em memória (para produção, usar Redis)
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

interface RateLimitOptions {
  limit?: number;       // Número máximo de requisições (opcional se max fornecido)
  max?: number;         // Alias para limit (compatibilidade com consumidores)
  windowMs: number;     // Janela de tempo em milissegundos
  message?: string;     // Mensagem de erro customizada
}

function resolveLimit(opts: RateLimitOptions): number {
  return opts.limit ?? opts.max ?? 100;
}

const defaultOptions: RateLimitOptions = {
  limit: 100,
  windowMs: 60 * 1000, // 1 minuto
  message: 'Muitas requisições. Tente novamente mais tarde.',
};

// Configurações específicas por rota
const routeLimits: Record<string, RateLimitOptions> = {
  // Endpoints críticos com limites mais baixos
  '/api/v1/backoffice/pontos/distribuir': { limit: 10, windowMs: 60 * 1000 },
  '/api/v1/backoffice/pontos/resgates': { limit: 20, windowMs: 60 * 1000 },
  '/api/v1/backoffice/uploads': { limit: 5, windowMs: 60 * 1000 },
  '/api/v1/backoffice/uploads/preview': { limit: 10, windowMs: 60 * 1000 },
  '/api/v1/backoffice/reprocessar-comissoes': { limit: 5, windowMs: 60 * 1000 },
  
  // Endpoints de leitura podem ter limites maiores
  '/api/v1/backoffice/pontos/ranking': { limit: 30, windowMs: 60 * 1000 },
  '/api/v1/backoffice/relatorio-comissoes': { limit: 20, windowMs: 60 * 1000 },
  
  // Endpoints de autenticação
  '/api/auth/login': { limit: 5, windowMs: 60 * 1000 },
};

export function getRateLimitOptions(path: string): RateLimitOptions {
  // Encontrar a configuração mais específica para esta rota
  for (const [route, options] of Object.entries(routeLimits)) {
    if (path.startsWith(route)) {
      return options;
    }
  }
  return defaultOptions;
}

export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = defaultOptions
): { success: boolean; remaining: number; resetAt: number } {
  const limit = resolveLimit(options);
  const now = Date.now();
  const key = `${identifier}:${options.windowMs}`;
  
  const entry = rateLimitStore.get(key);
  
  if (!entry || now > entry.resetAt) {
    // Nova janela de tempo
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + options.windowMs,
    });
    return {
      success: true,
      remaining: limit - 1,
      resetAt: now + options.windowMs,
    };
  }
  
  if (entry.count >= limit) {
    // Limite excedido
    return {
      success: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }
  
  // Incrementar contador
  entry.count++;
  rateLimitStore.set(key, entry);
  
  return {
    success: true,
    remaining: limit - entry.count,
    resetAt: entry.resetAt,
  };
}

export function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

// Cleanup a cada 5 minutos
if (typeof global !== 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}

/**
 * Middleware de rate limiting para Next.js
 * 
 * Uso em route handlers:
 * ```typescript
 * import { withRateLimit } from '@/lib/rate-limit';
 * 
 * export async function GET(req: NextRequest) {
 *   const rateLimitResult = withRateLimit(req);
 *   if (!rateLimitResult.success) {
 *     return rateLimitResult.response;
 *   }
 *   
 *   // ... lógica do endpoint
 * }
 * ```
 */
export function withRateLimit(
  req: NextRequest,
  customOptions?: RateLimitOptions
): { success: boolean; response?: NextResponse } {
  // Obter identificador (IP ou user ID)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const userId = req.headers.get('x-user-id');
  const identifier = userId || ip;
  
  // Obter opções de rate limiting
  const path = req.nextUrl.pathname;
  const options = customOptions || getRateLimitOptions(path);
  
  // Verificar rate limit
  const result = checkRateLimit(identifier, options);
  const limit = resolveLimit(options);
  
  if (!result.success) {
    const response = NextResponse.json(
      {
        error: options.message || 'Muitas requisições',
        retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': result.resetAt.toString(),
          'Retry-After': Math.ceil((result.resetAt - Date.now()) / 1000).toString(),
        },
      }
    );
    
    return { success: false, response };
  }
  
  // Adicionar headers de rate limiting
  const response = NextResponse.json({});
  response.headers.set('X-RateLimit-Limit', limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', result.resetAt.toString());
  
  return { success: true };
}

/**
 * Hook utilitário para usar em handlers
 */
export async function rateLimit(
  req: NextRequest,
  customOptions?: RateLimitOptions
): Promise<NextResponse | null> {
  const result = withRateLimit(req, customOptions);
  return result.response || null;
}

export function getClientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
}

export function tooManyRequests(windowMs: number): NextResponse {
  return NextResponse.json(
    {
      error: 'Muitas requisições. Tente novamente mais tarde.',
      retryAfter: Math.ceil(windowMs / 1000),
    },
    {
      status: 429,
      headers: {
        'Retry-After': Math.ceil(windowMs / 1000).toString(),
      },
    }
  );
}