import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Image, Plus } from "lucide-react";

export const revalidate = 0;

export default function SlidesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Slides de la page d'accueil
          </h1>
          <p className="text-gray-600 mt-2">
            Gérez les diaporamas de votre page d'accueil
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un slide
        </Button>
      </div>

      <Card>
        <CardContent className="py-12">
          <div className="text-center text-gray-500">
            <Image className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Fonctionnalité à venir</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
