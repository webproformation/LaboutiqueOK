import { createClient } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Gift, TrendingUp, Users } from "lucide-react";

export const revalidate = 0;

async function getLoyaltyStats() {
  const supabase = createClient();

  const [profilesResult, transactionsResult] = await Promise.all([
    supabase.from("profiles").select("*"),
    supabase.from("loyalty_transactions").select("*").order("created_at", { ascending: false }).limit(20),
  ]);

  const profiles = profilesResult.data || [];
  const transactions = transactionsResult.data || [];

  const totalPoints = profiles.reduce(
    (sum, profile) => sum + (profile.wallet_balance || 0),
    0
  );

  return {
    profiles,
    transactions,
    totalPoints,
    totalUsers: profiles.length,
  };
}

export default async function LoyaltyPage() {
  const stats = await getLoyaltyStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Programme de fidélité
        </h1>
        <p className="text-gray-600 mt-2">
          Gérez les points de fidélité de vos clients
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Points
            </CardTitle>
            <Gift className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {stats.totalPoints}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Points en circulation
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Clients
            </CardTitle>
            <Users className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {stats.totalUsers}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Clients enregistrés
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Transactions
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {stats.transactions.length}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Dernières transactions
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dernières transactions de points</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.transactions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Gift className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Aucune transaction pour le moment</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.transactions.map((transaction: any) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {new Date(transaction.created_at).toLocaleDateString(
                          "fr-FR",
                          {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            transaction.type === "earn"
                              ? "default"
                              : "destructive"
                          }
                        >
                          {transaction.type === "earn" ? "Gain" : "Dépense"}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={`font-bold ${
                          transaction.type === "earn"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {transaction.type === "earn" ? "+" : "-"}
                        {Math.abs(transaction.points)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {transaction.description || "Aucune description"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
