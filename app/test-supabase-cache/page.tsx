"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface TestResult {
  name: string;
  success: boolean;
  message: string;
  data?: any;
}

export default function TestSupabaseCachePage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const runTests = async () => {
    setIsLoading(true);
    setResults([]);
    const supabase = createClient();
    const testResults: TestResult[] = [];

    // Test 1: page_visits
    try {
      const { data, error } = await supabase
        .from("page_visits")
        .select("id")
        .limit(1);
      testResults.push({
        name: "page_visits",
        success: !error,
        message: error ? error.message : "OK",
        data: data,
      });
    } catch (e: any) {
      testResults.push({
        name: "page_visits",
        success: false,
        message: e.message,
      });
    }

    // Test 2: weekly_ambassadors
    try {
      const { data, error } = await supabase
        .from("weekly_ambassadors")
        .select("id, week_start_date, week_end_date, total_votes")
        .eq("is_active", true)
        .limit(1);
      testResults.push({
        name: "weekly_ambassadors",
        success: !error,
        message: error ? error.message : "OK",
        data: data,
      });
    } catch (e: any) {
      testResults.push({
        name: "weekly_ambassadors",
        success: false,
        message: e.message,
      });
    }

    // Test 3: upsert_user_session
    try {
      const testSessionId = crypto.randomUUID();
      const { data, error } = await supabase.rpc("upsert_user_session", {
        p_session_id: testSessionId,
        p_user_id: null,
      });
      testResults.push({
        name: "upsert_user_session",
        success: !error,
        message: error ? error.message : "OK",
        data: data,
      });
    } catch (e: any) {
      testResults.push({
        name: "upsert_user_session",
        success: false,
        message: e.message,
      });
    }

    // Test 4: customer_reviews
    try {
      const { data, error } = await supabase
        .from("customer_reviews")
        .select("id, customer_name, rating")
        .eq("is_approved", true)
        .limit(1);
      testResults.push({
        name: "customer_reviews",
        success: !error,
        message: error ? error.message : "OK",
        data: data,
      });
    } catch (e: any) {
      testResults.push({
        name: "customer_reviews",
        success: false,
        message: e.message,
      });
    }

    // Test 5: live_streams
    try {
      const { data, error } = await supabase
        .from("live_streams")
        .select("id, title")
        .limit(1);
      testResults.push({
        name: "live_streams",
        success: !error,
        message: error ? error.message : "OK",
        data: data,
      });
    } catch (e: any) {
      testResults.push({
        name: "live_streams",
        success: false,
        message: e.message,
      });
    }

    // Test 6: wishlist_items
    try {
      const { data, error } = await supabase
        .from("wishlist_items")
        .select("*")
        .limit(1);
      testResults.push({
        name: "wishlist_items",
        success: !error,
        message: error ? error.message : "OK",
        data: data,
      });
    } catch (e: any) {
      testResults.push({
        name: "wishlist_items",
        success: false,
        message: e.message,
      });
    }

    // Test 7: home_categories
    try {
      const { data, error } = await supabase
        .from("home_categories")
        .select("*")
        .eq("is_active", true)
        .limit(1);
      testResults.push({
        name: "home_categories",
        success: !error,
        message: error ? error.message : "OK",
        data: data,
      });
    } catch (e: any) {
      testResults.push({
        name: "home_categories",
        success: false,
        message: e.message,
      });
    }

    // Test 8: featured_products
    try {
      const { data, error } = await supabase
        .from("featured_products")
        .select("product_id")
        .eq("is_active", true)
        .limit(1);
      testResults.push({
        name: "featured_products",
        success: !error,
        message: error ? error.message : "OK",
        data: data,
      });
    } catch (e: any) {
      testResults.push({
        name: "featured_products",
        success: false,
        message: e.message,
      });
    }

    // Test 9: guestbook_settings
    try {
      const { data, error } = await supabase
        .from("guestbook_settings")
        .select("*")
        .single();
      testResults.push({
        name: "guestbook_settings",
        success: !error,
        message: error ? error.message : "OK",
        data: data,
      });
    } catch (e: any) {
      testResults.push({
        name: "guestbook_settings",
        success: false,
        message: e.message,
      });
    }

    setResults(testResults);
    setIsLoading(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>Test Cache Supabase PostgREST</CardTitle>
          <p className="text-sm text-muted-foreground">
            Teste si toutes les tables et fonctions sont accessibles via l&apos;API REST
          </p>
        </CardHeader>
        <CardContent>
          <Button onClick={runTests} disabled={isLoading} className="mb-6">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Test en cours...
              </>
            ) : (
              "Relancer les tests"
            )}
          </Button>

          <div className="space-y-4">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  result.success
                    ? "bg-green-50 border-green-200 dark:bg-green-950/20"
                    : "bg-red-50 border-red-200 dark:bg-red-950/20"
                }`}
              >
                <div className="flex items-start gap-3">
                  {result.success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold">{result.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {result.message}
                    </p>
                    {result.data && (
                      <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {results.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <h3 className="font-semibold mb-2">Résumé</h3>
              <p className="text-sm">
                {results.filter((r) => r.success).length} / {results.length}{" "}
                tests réussis
              </p>
              {results.some((r) => !r.success) && (
                <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
                  Si des tests échouent, attends 5-10 minutes que PostgREST
                  recharge son cache, puis redémarre ton projet Supabase.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
