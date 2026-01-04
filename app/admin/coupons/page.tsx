import { createClient } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tag, Plus } from "lucide-react";
import Link from "next/link";

export const revalidate = 0;

async function getCoupons() {
  const supabase = createClient();

  const { data: coupons, error } = await supabase
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching coupons:", error);
    return [];
  }

  return coupons || [];
}

export default async function CouponsPage() {
  const coupons = await getCoupons();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Coupons de réduction</h1>
          <p className="text-gray-600 mt-2">
            Gérez vos codes promotionnels ({coupons.length} coupons)
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Créer un coupon
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des coupons</CardTitle>
        </CardHeader>
        <CardContent>
          {coupons.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Tag className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Aucun coupon créé pour le moment</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Réduction</TableHead>
                    <TableHead>Utilisation</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Validité</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.map((coupon: any) => (
                    <TableRow key={coupon.id}>
                      <TableCell className="font-mono font-bold">
                        {coupon.code}
                      </TableCell>
                      <TableCell>
                        {coupon.discount_type === "percentage"
                          ? "Pourcentage"
                          : "Montant fixe"}
                      </TableCell>
                      <TableCell>
                        {coupon.discount_type === "percentage"
                          ? `${coupon.discount_value}%`
                          : `${coupon.discount_value} €`}
                      </TableCell>
                      <TableCell>
                        {coupon.uses_count} / {coupon.max_uses || "∞"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={coupon.is_active ? "default" : "secondary"}
                        >
                          {coupon.is_active ? "Actif" : "Inactif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {coupon.valid_from && coupon.valid_until
                          ? `${new Date(
                              coupon.valid_from
                            ).toLocaleDateString()} - ${new Date(
                              coupon.valid_until
                            ).toLocaleDateString()}`
                          : "Illimitée"}
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
