import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { email, password, firstName, lastName } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      );
    }

    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUser?.users?.find(u => u.email === email);

    let userId: string;

    if (userExists) {
      userId = userExists.id;
      console.log(`User ${email} already exists with ID: ${userId}`);
    } else {
      const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: firstName || '',
          last_name: lastName || ''
        }
      });

      if (createError) {
        return NextResponse.json(
          { error: createError.message },
          { status: 500 }
        );
      }

      userId = createData.user.id;
      console.log(`User ${email} created with ID: ${userId}`);

      const { error: profileError } = await supabaseAdmin.rpc('create_user_profile_manually', {
        p_user_id: userId,
        p_email: email,
        p_first_name: firstName || '',
        p_last_name: lastName || '',
        p_birth_date: null,
        p_wordpress_user_id: null
      });

      if (profileError) {
        console.error('Profile creation error:', profileError);
      }
    }

    const { data: existingRole } = await supabaseAdmin
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existingRole) {
      console.log(`Role already exists for user ${userId}: ${existingRole.role}`);

      if (existingRole.role !== 'admin') {
        const { error: updateRoleError } = await supabaseAdmin
          .from('user_roles')
          .update({ role: 'admin' })
          .eq('user_id', userId);

        if (updateRoleError) {
          console.error('Role update error:', updateRoleError);
          return NextResponse.json(
            { error: `Erreur mise à jour rôle: ${updateRoleError.message}` },
            { status: 500 }
          );
        }
        console.log(`Role updated to admin for user ${userId}`);
      }
    } else {
      const { error: adminRoleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'admin'
        });

      if (adminRoleError) {
        console.error('Admin role insert error:', adminRoleError);
        return NextResponse.json(
          { error: `Erreur création rôle: ${adminRoleError.message}` },
          { status: 500 }
        );
      }
      console.log(`Admin role created for user ${userId}`);
    }

    return NextResponse.json({
      success: true,
      message: userExists ? 'Rôle admin mis à jour avec succès' : 'Utilisateur admin créé avec succès',
      user: {
        id: userId,
        email: email
      }
    });

  } catch (error: any) {
    console.error('Create admin error:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur inconnue' },
      { status: 500 }
    );
  }
}
