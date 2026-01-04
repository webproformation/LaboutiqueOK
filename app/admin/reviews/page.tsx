import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";

export const revalidate = 0;

export default function ReviewsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Avis clients</h1>
        <p className="text-gray-600 mt-2">
          Gérez les avis et commentaires de vos clients
        </p>
      </div>

      <Card>
        <CardContent className="py-12">
          <div className="text-center text-gray-500">
            <Star className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Fonctionnalité à venir</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
