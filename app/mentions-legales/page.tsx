import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#F2F2E8]">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Mentions Légales
            </h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Informations légales</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                Conformément aux dispositions de la loi n° 2004-575 du 21 juin 2004 pour la confiance
                dans l'économie numérique, il est précisé aux utilisateurs du site laboutiquedemorgane.com
                l'identité des différents intervenants dans le cadre de sa réalisation et de son suivi.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle>Éditeur du site</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><strong>Raison sociale :</strong> MORGANE DEWANIN</p>
              <p><strong>Forme juridique :</strong> SAS (Société par Actions Simplifiée)</p>
              <p><strong>Adresse :</strong> 1062 rue d'Armentières, 59850 Nieppe, France</p>
              <p><strong>Téléphone Morgane :</strong> <a href="tel:+33641456671" className="text-[#C6A15B] hover:underline">+33 6 41 45 66 71</a></p>
              <p><strong>Téléphone André :</strong> <a href="tel:+33603489662" className="text-[#C6A15B] hover:underline">+33 6 03 48 96 62</a></p>
              <p><strong>Email :</strong> <a href="mailto:contact@laboutiquedemorgane.com" className="text-[#C6A15B] hover:underline">contact@laboutiquedemorgane.com</a></p>
              <p><strong>SIREN :</strong> 907 889 802</p>
              <p><strong>SIRET :</strong> 907 889 802 00027</p>
              <p><strong>N° TVA intracommunautaire :</strong> FR16907889802</p>
              <p><strong>Date de création :</strong> 06 décembre 2021</p>
              <p><strong>Code APE :</strong> 4641Z - Commerce de gros (commerce interentreprises) de textiles</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Directeur de publication</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Morgane DEWANIN</p>
              <p>Email : <a href="mailto:contact@laboutiquedemorgane.com" className="text-[#C6A15B] hover:underline">contact@laboutiquedemorgane.com</a></p>
            </CardContent>
          </Card>

          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle>Hébergeur</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-semibold mb-2">Hébergement Web</p>
                <p>O2SWITCH</p>
                <p>Chemin des Pardiaux, 63000 Clermont-Ferrand, France</p>
                <p>Téléphone : 04 44 44 60 40</p>
                <p>Site web : <a href="https://www.o2switch.fr" target="_blank" rel="noopener noreferrer" className="text-[#C6A15B] hover:underline">www.o2switch.fr</a></p>
              </div>
              <div>
                <p className="font-semibold mb-2">Infrastructure & Déploiement</p>
                <p>Vercel Inc.</p>
                <p>c/o EDPO, Avenue Huart Hamoir 71, 1030 Brussels, Belgium</p>
                <p>Email : <a href="mailto:privacy@vercel.com" className="text-[#C6A15B] hover:underline">privacy@vercel.com</a></p>
                <p>Site web : <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-[#C6A15B] hover:underline">vercel.com</a></p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Conception et réalisation</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Site web créé par <a href="https://webproformation.fr" target="_blank" rel="noopener noreferrer" className="text-[#C6A15B] hover:underline font-semibold">webproformation.fr</a>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Propriété intellectuelle</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                L'ensemble de ce site relève de la législation française et internationale sur le droit d'auteur
                et la propriété intellectuelle. Tous les droits de reproduction sont réservés, y compris pour
                les documents téléchargeables et les représentations iconographiques et photographiques.
              </p>
              <p>
                La reproduction de tout ou partie de ce site sur un support électronique ou autre quel qu'il soit
                est formellement interdite sauf autorisation expresse du directeur de la publication.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Protection des données personnelles</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez d'un droit
                d'accès, de rectification et de suppression des données vous concernant.
              </p>
              <p className="mt-2">
                Pour plus d'informations, consultez notre{' '}
                <a href="/politique-confidentialite" className="text-[#C6A15B] hover:underline font-semibold">
                  Politique de Confidentialité
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
