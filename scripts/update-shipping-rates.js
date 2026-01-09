require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const updates = [
  {
    code: 'mondial_relay',
    cost: 5.90,
    is_relay: true,
  },
  {
    code: 'gls_relay',
    cost: 5.90,
    is_relay: true,
  },
  {
    code: 'gls_home',
    cost: 7.90,
    is_relay: false,
  },
  {
    code: 'colissimo_home',
    cost: 8.90,
    is_relay: false,
  },
  {
    code: 'chronopost_relay',
    cost: 3.90,
    is_relay: true,
  },
];

async function updateShippingRates() {
  console.log('🚀 Mise à jour des tarifs de livraison...\n');

  try {
    const { data: existingMethods, error: fetchError } = await supabase
      .from('shipping_methods')
      .select('*');

    if (fetchError) {
      throw fetchError;
    }

    console.log(`📦 ${existingMethods.length} méthodes de livraison trouvées dans la base\n`);

    for (const update of updates) {
      const method = existingMethods.find(m => m.code === update.code);

      if (method) {
        const { error: updateError } = await supabase
          .from('shipping_methods')
          .update({
            cost: update.cost,
            is_relay: update.is_relay,
          })
          .eq('code', update.code);

        if (updateError) {
          console.error(`❌ Erreur mise à jour ${update.code}:`, updateError.message);
        } else {
          console.log(`✅ ${method.name} mis à jour:`);
          console.log(`   - Prix: ${method.cost}€ → ${update.cost}€`);
          console.log(`   - Point Relais: ${method.is_relay ? 'Oui' : 'Non'} → ${update.is_relay ? 'Oui' : 'Non'}`);
          console.log('');
        }
      } else {
        console.log(`⚠️  Méthode ${update.code} non trouvée dans la base`);
        console.log('');
      }
    }

    console.log('✅ Mise à jour terminée avec succès !');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

updateShippingRates();
