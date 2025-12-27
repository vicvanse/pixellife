import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Rotas públicas que não requerem autenticação
  const publicRoutes = [
    '/auth/login',
    '/auth/register',
    '/auth/reset',
    '/auth/verify-email',
    '/auth/callback',
    '/privacy',
    '/terms',
    '/api',
  ]

  const pathname = request.nextUrl.pathname

  // Verificar se a rota é pública
  const isPublicRoute = publicRoutes.some(route => 
    pathname.startsWith(route)
  )

  // Se for rota pública, permitir acesso
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Para rotas protegidas, permitir acesso e deixar o ProtectedRoute
  // no cliente fazer a verificação completa (já que o Supabase usa localStorage)
  // O ProtectedRoute verifica a sessão e redireciona se necessário
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

