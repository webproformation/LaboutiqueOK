import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCouponUsage() {
  console.log('\n🎯 VÉRIFICATION coupon_usage\n');

  const { data: tables, error: tablesError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .like('table_name', '%coupon%');

  if (tablesError) {
    console.error('Erreur:', tablesError);
    return;
  }

  console.log('Tables coupon trouvées:', tables?.map(t => t.table_name).join(', '));

  const { data: columns, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'coupon_usage'
      ORDER BY ordinal_position;
    `
  });

  if (error) {
    console.error('\n❌ Impossible de lire avec RPC, essai direct...\n');

    const { data: sample, error: sampleError } = await supabase
      .from('coupon_usage')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.error('Erreur:', sampleError);
    } else if (sample && sample.length > 0) {
      console.log('Colonnes trouvées:', Object.keys(sample[0]).join(', '));
    } else {
      console.log('Table vide ou inexistante');
    }
  } else {
    console.log('\nColonnes:', columns);
  }
}

checkCouponUsage();
