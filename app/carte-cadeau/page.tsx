import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Gift, Heart, Sparkles, Check } from 'lucide-react';
import Link from 'next/link';

export default function CartesCadeauxPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#C6A15B]/10 rounded-full mb-6">
            <Gift className="h-10 w-10 text-[#C6A15B]" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Cartes Cadeaux</h1>
          <p className="text-xl text-gray-600">
            Offrez le plaisir de choisir avec nos cartes cadeaux
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 mb-12">
          <Card className="border-[#C6A15B]/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Heart className="h-6 w-6 text-[#C6A15B]" />
                <CardTitle>Le cadeau parfait</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Vous ne savez pas quoi offrir ? La carte cadeau La Boutique de Morgane est la solution idéale.
                Vos proches pourront choisir parmi notre large sélection de produits mode, beauté et maison.
              </p>
            </CardContent>
          </Card>

          <Card className="border-[#C6A15B]/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Sparkles className="h-6 w-6 text-[#C6A15B]" />
                <CardTitle>Simple et pratique</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Commandez votre carte cadeau du montant de votre choix. Elle est valable sur l'ensemble de notre
                boutique et peut être utilisée en plusieurs fois.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Comment ça marche ?</CardTitle>
            <CardDescription>
              Offrir une carte cadeau n'a jamais été aussi simple
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-[#C6A15B] text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold mb-1">Contactez-nous</h3>
                <p className="text-gray-600">
                  Par téléphone, email ou message sur les réseaux sociaux pour commander votre carte cadeau
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-[#C6A15B] text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold mb-1">Choisissez le montant</h3>
                <p className="text-gray-600">
                  Sélectionnez le montant de votre choix selon votre budget
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-[#C6A15B] text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold mb-1">Recevez votre carte</h3>
                <p className="text-gray-600">
                  Votre carte cadeau vous est envoyée par courrier ou email selon votre préférence
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-[#C6A15B] text-white rounded-full flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h3 className="font-semibold mb-1">Offrez et faites plaisir</h3>
                <p className="text-gray-600">
                  Votre proche pourra utiliser sa carte sur toute la boutique
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#C6A15B]/5 border-[#C6A15B]/20 mb-12">
          <CardHeader>
            <CardTitle>Les avantages de nos cartes cadeaux</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#C6A15B] flex-shrink-0 mt-0.5" />
                <p>Valable sur l'ensemble de notre catalogue</p>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#C6A15B] flex-shrink-0 mt-0.5" />
                <p>Utilisable en plusieurs fois</p>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#C6A15B] flex-shrink-0 mt-0.5" />
                <p>Durée de validité d'un an</p>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#C6A15B] flex-shrink-0 mt-0.5" />
                <p>Montant au choix</p>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#C6A15B] flex-shrink-0 mt-0.5" />
                <p>Livraison rapide</p>
              </li>
            </ul>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-gray-600 mb-6">
            Des questions sur nos cartes cadeaux ? N'hésitez pas à nous contacter
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button asChild size="lg">
              <Link href="/contact">Nous contacter</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="tel:+33641456671">
                Appeler Morgane
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
