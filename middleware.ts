import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Routes exemptées du mode maintenance (accessibles même en maintenance)
  const exemptedPaths = [
    '/maintenance',
    '/admin',
    '/api/admin',
    '/api/auth',
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/clear-auth',
    '/force-logout',
    '/debug-auth'
  ];

  const isExemptedPath = exemptedPaths.some(path =>
    request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(path + '/')
  );

  // Si la route est exemptée, laisser passer sans vérifier le mode maintenance
  if (isExemptedPath) {
    return response;
  }

  // Vérifier le mode maintenance uniquement pour les routes non-exemptées
  try {
    const maintenanceResponse = await fetch(`${request.nextUrl.origin}/api/admin/maintenance?t=${Date.now()}`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
      cache: 'no-store',
    });

    if (maintenanceResponse.ok) {
      const { data } = await maintenanceResponse.json();

      // Si le mode maintenance est actif
      if (data?.is_maintenance_mode === true) {
        // Vérifier si l'utilisateur est admin
        let isAdmin = false;

        if (user) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();

          isAdmin = profile?.role === 'admin';
        }

        // Rediriger vers /maintenance uniquement si l'utilisateur n'est PAS admin
        if (!isAdmin) {
          return NextResponse.redirect(new URL('/maintenance', request.url));
        }
      }
    }
  } catch (error) {
    console.error('Maintenance check error:', error);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
