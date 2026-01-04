import { Card, CardContent } from "@/components/ui/card";
import { Gift } from "lucide-react";

export const revalidate = 0;

export default function WheelPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Roue de la fortune
        </h1>
        <p className="text-gray-600 mt-2">
          Configurez votre jeu de la roue de la fortune
        </p>
      </div>

      <Card>
        <CardContent className="py-12">
          <div className="text-center text-gray-500">
            <Gift className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Fonctionnalité à venir</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
