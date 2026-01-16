import { NextRequest, NextResponse } from 'next/server';
import { sendPackageClosingWarningEmail } from '@/lib/email-sender';
import { createClient } from '@/lib/supabase';

const CRON_SECRET = process.env.CRON_SECRET || 'your-secret-key-here';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const providedSecret = authHeader?.replace('Bearer ', '');

    if (providedSecret !== CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createClient();

    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const dayAfterTomorrow = new Date(Date.now() + 25 * 60 * 60 * 1000);

    const { data: packages, error: packagesError } = await supabase
      .from('open_packages')
      .select(`
        *,
        profiles(email, first_name)
      `)
      .eq('status', 'active')
      .gte('closes_at', tomorrow.toISOString())
      .lt('closes_at', dayAfterTomorrow.toISOString())
      .is('warning_email_sent', false);

    if (packagesError) {
      console.error('Error fetching packages:', packagesError);
      return NextResponse.json(
        { error: 'Failed to fetch packages' },
        { status: 500 }
      );
    }

    const emailsSent = [];
    const errors = [];

    for (const pkg of packages || []) {
      const profile = pkg.profiles as any;
      const email = profile?.email;
      const firstName = profile?.first_name || 'Client';

      if (!email) continue;

      const result = await sendPackageClosingWarningEmail(email, firstName);

      if (result.success) {
        await supabase
          .from('open_packages')
          .update({ warning_email_sent: true })
          .eq('id', pkg.id);

        emailsSent.push({ packageId: pkg.id, email });
      } else {
        errors.push({ packageId: pkg.id, error: result.error });
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return NextResponse.json({
      success: true,
      emailsSent: emailsSent.length,
      errors: errors.length,
      details: { emailsSent, errors }
    });
  } catch (error: any) {
    console.error('Error in package warning cron:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
