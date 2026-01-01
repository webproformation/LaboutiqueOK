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

  if (request.nextUrl.pathname === '/maintenance') {
    return response;
  }

  if (request.nextUrl.pathname.startsWith('/api/admin/maintenance')) {
    return response;
  }

  try {
    const maintenanceResponse = await fetch(`${request.nextUrl.origin}/api/admin/maintenance`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

    if (maintenanceResponse.ok) {
      const { data } = await maintenanceResponse.json();

      if (data?.is_maintenance_mode) {
        let isAdmin = false;

        if (user) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();

          isAdmin = profile?.role === 'admin';
        }

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
