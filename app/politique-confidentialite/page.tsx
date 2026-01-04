import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PolitiqueConfidentialitePage() {
  const currentDate = new Date().toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#F2F2E8]">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Politique de Confidentialité
            </h1>
            <p className="text-gray-600">Dernière mise à jour : {currentDate}</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Introduction</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none space-y-4">
              <p>
                La présente Politique de Confidentialité décrit la manière dont vos données personnelles sont collectées,
                utilisées et partagées lorsque vous visitez ou effectuez un achat sur laboutiquedemorgane.com (le « Site »).
              </p>
              <p className="font-semibold">
                Responsable du traitement : MORGANE DEWANIN<br/>
                Adresse : 1062 rue d'Armentières, 59850 Nieppe, France<br/>
                Email : <a href="mailto:contact@laboutiquedemorgane.com" className="text-[#C6A15B] hover:underline">contact@laboutiquedemorgane.com</a>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>1. Données personnelles collectées</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p>Nous collectons les types de données personnelles suivantes :</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li><strong>Informations d'identification :</strong> nom, prénom, adresse email, numéro de téléphone</li>
                <li><strong>Informations de livraison :</strong> adresse postale, ville, code postal, pays</li>
                <li><strong>Informations de commande :</strong> produits commandés, montant, mode de paiement</li>
                <li><strong>Données de navigation :</strong> adresse IP, type de navigateur, pages visitées, durée de visite</li>
                <li><strong>Cookies :</strong> préférences de navigation, panier d'achat</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Finalités de la collecte</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p>Vos données personnelles sont collectées pour les finalités suivantes :</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Gérer votre compte client et vos commandes</li>
                <li>Traiter et livrer vos commandes</li>
                <li>Vous contacter concernant vos commandes</li>
                <li>Vous envoyer notre newsletter (avec votre consentement)</li>
                <li>Améliorer notre site et nos services</li>
                <li>Réaliser des statistiques et analyses</li>
                <li>Prévenir les fraudes et assurer la sécurité du site</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Base légale du traitement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p>Le traitement de vos données repose sur :</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li><strong>L'exécution d'un contrat :</strong> pour traiter vos commandes</li>
                <li><strong>Votre consentement :</strong> pour la newsletter et les cookies non essentiels</li>
                <li><strong>L'intérêt légitime :</strong> pour améliorer nos services et prévenir les fraudes</li>
                <li><strong>Une obligation légale :</strong> pour la facturation et la comptabilité</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. Durée de conservation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2 text-gray-700">
                <li><strong>Données de compte :</strong> Durée de vie du compte + 3 ans après la dernière activité</li>
                <li><strong>Données de commande :</strong> 10 ans (obligation légale comptable et fiscale)</li>
                <li><strong>Newsletter :</strong> Jusqu'à désinscription + 3 ans</li>
                <li><strong>Cookies :</strong> Maximum 13 mois</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Vos droits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Conformément au RGPD, vous disposez des droits suivants :</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li><strong>Droit d'accès :</strong> obtenir la confirmation et une copie de vos données</li>
                <li><strong>Droit de rectification :</strong> corriger vos données inexactes</li>
                <li><strong>Droit à l'effacement :</strong> supprimer vos données</li>
                <li><strong>Droit à la limitation :</strong> limiter le traitement de vos données</li>
                <li><strong>Droit d'opposition :</strong> vous opposer au traitement</li>
                <li><strong>Droit à la portabilité :</strong> récupérer vos données dans un format structuré</li>
                <li><strong>Droit de retirer votre consentement :</strong> à tout moment</li>
              </ul>
              <div className="bg-blue-50 p-4 rounded-lg mt-4">
                <p className="font-semibold mb-2">Pour exercer vos droits :</p>
                <p>Email : <a href="mailto:contact@laboutiquedemorgane.com" className="text-[#C6A15B] hover:underline">contact@laboutiquedemorgane.com</a></p>
                <p>Téléphone : +33 6 41 45 66 71 / +33 6 03 48 96 62</p>
                <p>Courrier : 1062 rue d'Armentières, 59850 Nieppe, France</p>
              </div>
              <p className="text-sm text-gray-600 mt-4">
                <strong>Droit de réclamation :</strong> Vous pouvez introduire une réclamation auprès de la CNIL
                (Commission Nationale de l'Informatique et des Libertés) si vous estimez que vos droits ne sont pas respectés.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle>6. Sécurité des données</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p>
                Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger
                vos données personnelles contre la perte, l'utilisation abusive, l'accès non autorisé ou la divulgation.
              </p>
              <div className="bg-white p-4 rounded mt-3">
                <p className="font-semibold mb-2">Hébergement sécurisé :</p>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• O2SWITCH (France) - Certification ISO 27001</li>
                  <li>• Vercel Inc. - Conformité RGPD</li>
                  <li>• DPO Vercel : <a href="mailto:privacy@vercel.com" className="text-[#C6A15B] hover:underline">privacy@vercel.com</a></li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Cookies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p>
                Nous utilisons des cookies pour améliorer votre expérience sur notre site. Les cookies sont de petits
                fichiers texte stockés sur votre appareil.
              </p>
              <p>
                Vous pouvez gérer vos préférences de cookies dans les paramètres de votre navigateur.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle>8. Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>Pour toute question concernant cette politique de confidentialité :</p>
              <p><strong>Email :</strong> <a href="mailto:contact@laboutiquedemorgane.com" className="text-[#C6A15B] hover:underline">contact@laboutiquedemorgane.com</a></p>
              <p><strong>Téléphone Morgane :</strong> <a href="tel:+33641456671" className="text-[#C6A15B] hover:underline">+33 6 41 45 66 71</a></p>
              <p><strong>Téléphone André :</strong> <a href="tel:+33603489662" className="text-[#C6A15B] hover:underline">+33 6 03 48 96 62</a></p>
              <p><strong>Courrier :</strong> 1062 rue d'Armentières, 59850 Nieppe, France</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
