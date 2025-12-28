"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PackageX, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export default function ReturnsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Les Retours</h1>
        <p className="mt-2 text-gray-600">
          Un article ne vous va pas ? Nous faisons les retours sous 7 jours
        </p>
      </div>

      <Card className="bg-gradient-to-r from-[#F2F2E8] to-white border-[#D4AF37] border-2">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-16 h-16 rounded-full bg-[#D4AF37] flex items-center justify-center">
              <PackageX className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Retours gratuits sous 7 jours
              </h2>
              <p className="text-gray-700">
                Vous n'êtes pas satisfaite de votre commande ? Pas de problème !
                Vous avez 7 jours pour nous retourner vos articles gratuitement.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <div className="w-12 h-12 rounded-full bg-[#F2F2E8] flex items-center justify-center mb-4">
              <Clock className="h-6 w-6 text-[#D4AF37]" />
            </div>
            <CardTitle className="text-lg">1. Demandez un retour</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Contactez notre service client dans les 7 jours suivant la réception de votre colis.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="w-12 h-12 rounded-full bg-[#F2F2E8] flex items-center justify-center mb-4">
              <PackageX className="h-6 w-6 text-[#D4AF37]" />
            </div>
            <CardTitle className="text-lg">2. Renvoyez l'article</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Emballez soigneusement l'article dans son emballage d'origine avec toutes les étiquettes.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="w-12 h-12 rounded-full bg-[#F2F2E8] flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-[#D4AF37]" />
            </div>
            <CardTitle className="text-lg">3. Recevez votre remboursement</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Une fois l'article reçu et contrôlé, vous serez remboursée sous 5 à 7 jours ouvrés.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Conditions de retour</CardTitle>
          <CardDescription>
            Pour que votre retour soit accepté, merci de respecter les conditions suivantes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">
                L'article doit être retourné dans son état d'origine avec toutes les étiquettes
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">
                L'article ne doit pas avoir été porté (sauf pour essayage)
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">
                Le délai de 7 jours après réception doit être respecté
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">
                Les articles en promotion ou soldés peuvent être retournés dans les mêmes conditions
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Articles non retournables</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">
                Les sous-vêtements et articles d'hygiène (pour des raisons sanitaires)
              </span>
            </li>
            <li className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">
                Les produits personnalisés ou sur mesure
              </span>
            </li>
            <li className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">
                Les articles endommagés par le client
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card className="bg-[#F2F2E8]">
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Besoin d'aide pour un retour ?
            </h3>
            <p className="text-gray-700 mb-4">
              Notre service client est à votre disposition pour vous accompagner
            </p>
            <a
              href="/contact"
              className="inline-block px-6 py-3 bg-[#D4AF37] hover:bg-[#b8933d] text-white rounded-lg font-medium transition-colors"
            >
              Contacter le service client
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
