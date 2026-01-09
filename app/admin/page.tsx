import { createClient } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ShoppingBag,
  Package,
  Users,
  TrendingUp,
  Clock,
  Plus,
  Eye,
  FolderTree,
  FileText,
  UserCircle,
} from "lucide-react";

export const revalidate = 0;

async function getDashboardStats() {
  const supabase = createClient();

  const [productsResult, categoriesResult, ordersResult] = await Promise.all([
    supabase.from("products").select("*", { count: "exact" }),
    supabase.from("categories").select("*", { count: "exact" }),
    supabase.from("orders").select("*", { count: "exact" }),
  ]);

  const recentOrders = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  return {
    productsCount: productsResult.count || 0,
    categoriesCount: categoriesResult.count || 0,
    ordersCount: ordersResult.count || 0,
    recentOrders: recentOrders.data || [],
  };
}

export default async function AdminDashboard() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-600 mt-2">
          Vue d'ensemble de votre boutique en ligne
        </p>
      </div>

      {/* Quick Actions */}
      <Card className="border-[#d4af37]/20">
        <CardHeader>
          <CardTitle className="text-xl text-gray-900">Actions rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Link href="/admin/products">
              <Button
                variant="outline"
                className="w-full h-24 flex flex-col items-center justify-center gap-2 hover:bg-[#d4af37]/10 hover:border-[#d4af37]"
              >
                <Plus className="h-6 w-6 text-[#d4af37]" />
                <span className="text-sm font-medium">Créer un produit</span>
              </Button>
            </Link>

            <Link href="/admin/products">
              <Button
                variant="outline"
                className="w-full h-24 flex flex-col items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-500"
              >
                <Eye className="h-6 w-6 text-blue-600" />
                <span className="text-sm font-medium">Voir les produits</span>
              </Button>
            </Link>

            <Link href="/admin/categories-management/new">
              <Button
                variant="outline"
                className="w-full h-24 flex flex-col items-center justify-center gap-2 hover:bg-green-50 hover:border-green-500"
              >
                <Plus className="h-6 w-6 text-green-600" />
                <span className="text-sm font-medium">Créer une catégorie</span>
              </Button>
            </Link>

            <Link href="/admin/categories-management">
              <Button
                variant="outline"
                className="w-full h-24 flex flex-col items-center justify-center gap-2 hover:bg-green-50 hover:border-green-500"
              >
                <FolderTree className="h-6 w-6 text-green-600" />
                <span className="text-sm font-medium">Voir les catégories</span>
              </Button>
            </Link>

            <Link href="/admin/orders">
              <Button
                variant="outline"
                className="w-full h-24 flex flex-col items-center justify-center gap-2 hover:bg-orange-50 hover:border-orange-500"
              >
                <FileText className="h-6 w-6 text-orange-600" />
                <span className="text-sm font-medium">Voir les factures</span>
              </Button>
            </Link>

            <Link href="/admin/clients">
              <Button
                variant="outline"
                className="w-full h-24 flex flex-col items-center justify-center gap-2 hover:bg-purple-50 hover:border-purple-500"
              >
                <UserCircle className="h-6 w-6 text-purple-600" />
                <span className="text-sm font-medium">Clients</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Produits
            </CardTitle>
            <Package className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {stats.productsCount}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Total des produits en catalogue
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Catégories
            </CardTitle>
            <ShoppingBag className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {stats.categoriesCount}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Catégories actives
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Commandes
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {stats.ordersCount}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Commandes totales
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Clients
            </CardTitle>
            <Users className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">0</div>
            <p className="text-xs text-gray-500 mt-2">
              Clients enregistrés
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Commandes récentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ShoppingBag className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Aucune commande pour le moment</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.recentOrders.map((order: any) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      Commande #{order.order_number}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      {(Number(order.total) || 0).toFixed(2)} €
                    </p>
                    <span
                      className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                        order.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : order.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
