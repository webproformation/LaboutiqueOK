'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function TestRPCFunctionsPage() {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const testGetUserRole = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_user_role', {
        p_user_id: '00000000-0000-0000-0000-000000000000'
      });

      setResults((prev: any) => ({
        ...prev,
        get_user_role: { data, error: error?.message }
      }));
    } catch (err: any) {
      setResults((prev: any) => ({
        ...prev,
        get_user_role: { error: err.message }
      }));
    }
    setLoading(false);
  };

  const testGetLoyaltyTier = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_loyalty_tier', {
        p_user_id: '00000000-0000-0000-0000-000000000000'
      });

      setResults((prev: any) => ({
        ...prev,
        get_loyalty_tier: { data, error: error?.message }
      }));
    } catch (err: any) {
      setResults((prev: any) => ({
        ...prev,
        get_loyalty_tier: { error: err.message }
      }));
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Test RPC Functions</h1>

      <div className="space-y-4">
        <div>
          <button
            onClick={testGetUserRole}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            Test get_user_role
          </button>
          {results.get_user_role && (
            <pre className="mt-2 p-4 bg-gray-100 rounded">
              {JSON.stringify(results.get_user_role, null, 2)}
            </pre>
          )}
        </div>

        <div>
          <button
            onClick={testGetLoyaltyTier}
            disabled={loading}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
          >
            Test get_loyalty_tier
          </button>
          {results.get_loyalty_tier && (
            <pre className="mt-2 p-4 bg-gray-100 rounded">
              {JSON.stringify(results.get_loyalty_tier, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
