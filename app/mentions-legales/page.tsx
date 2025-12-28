import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function MentionsLegalesPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link href="/">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à l&apos;accueil
        </Button>
      </Link>

      <h1 className="text-4xl font-bold text-gray-900 mb-8">Mentions légales</h1>

      <div className="prose prose-gray max-w-none space-y-6">
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Informations légales</h2>
          <p className="text-gray-600">
            Conformément aux dispositions de la loi n° 2004-575 du 21 juin 2004 pour la confiance en l&apos;économie numérique,
            il est précisé aux utilisateurs du site l&apos;identité des différents intervenants dans le cadre de sa réalisation et de son suivi.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Éditeur du site</h2>
          <div className="bg-gray-50 p-6 rounded-lg">
            <p className="text-gray-700"><strong>Raison sociale :</strong> MORGANE DEWANIN</p>
            <p className="text-gray-700"><strong>Forme juridique :</strong> Société par actions simplifiée</p>
            <p className="text-gray-700"><strong>Adresse :</strong> 1062 rue d&apos;Armentières, 59850 Nieppe</p>
            <p className="text-gray-700"><strong>Téléphone :</strong></p>
            <p className="text-gray-700 ml-4"><strong>Morgane</strong> : +33 6 41 45 66 71</p>
            <p className="text-gray-700 ml-4"><strong>André</strong> : +33 6 03 48 96 62</p>
            <p className="text-gray-700"><strong>Email :</strong> contact@laboutiquedemorgane.com</p>
            <p className="text-gray-700"><strong>SIREN :</strong> 907 889 802</p>
            <p className="text-gray-700"><strong>SIRET :</strong> 907 889 802 00027</p>
            <p className="text-gray-700"><strong>Numéro de TVA :</strong> FR16907889802</p>
            <p className="text-gray-700"><strong>Date de création :</strong> 06 décembre 2021</p>
            <p className="text-gray-700"><strong>Activité (NAF/APE) :</strong> Commerce de gros (commerce interentreprises) de textiles - 4641Z</p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Directeur de publication</h2>
          <p className="text-gray-600">Le directeur de la publication du site est Morgane DEWANIN.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Hébergeur</h2>
          <div className="bg-gray-50 p-6 rounded-lg space-y-4">
            <div>
              <p className="text-gray-700 font-semibold mb-2">Hébergement Web :</p>
              <p className="text-gray-700"><strong>Nom :</strong> O2SWITCH</p>
              <p className="text-gray-700"><strong>Adresse :</strong> Chemin des Pardiaux, 63000 Clermont-Ferrand</p>
              <p className="text-gray-700"><strong>Téléphone :</strong> 04 44 44 60 40</p>
              <p className="text-gray-700"><strong>Horaires :</strong> 24h/24</p>
            </div>
            <div>
              <p className="text-gray-700 font-semibold mb-2">Infrastructure & Déploiement :</p>
              <p className="text-gray-700"><strong>Nom :</strong> Vercel Inc.</p>
              <p className="text-gray-700"><strong>Adresse :</strong> c/o EDPO, Avenue Huart Hamoir 71, 1030 Brussels, Belgium</p>
              <p className="text-gray-700"><strong>Email :</strong> privacy@vercel.com</p>
              <p className="text-gray-700"><strong>Site Web :</strong>{' '}
                <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  https://vercel.com
                </a>
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Conception et réalisation</h2>
          <p className="text-gray-600">
            Site créé par{' '}
            <a
              href="https://webproformation.fr/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline font-medium"
            >
              webproformation
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Propriété intellectuelle</h2>
          <p className="text-gray-600">
            L&apos;ensemble de ce site relève de la législation française et internationale sur le droit d&apos;auteur et la propriété intellectuelle.
            Tous les droits de reproduction sont réservés, y compris pour les documents téléchargeables et les représentations iconographiques et photographiques.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Protection des données personnelles</h2>
          <p className="text-gray-600">
            Conformément à la loi « Informatique et Libertés » du 6 janvier 1978 modifiée et au Règlement Général sur la Protection des Données (RGPD),
            vous disposez d&apos;un droit d&apos;accès, de rectification et de suppression des données vous concernant.
            Pour exercer ce droit, veuillez nous contacter à l&apos;adresse : contact@laboutiquedemorgane.com
          </p>
          <p className="text-gray-600 mt-4">
            Pour en savoir plus sur la gestion de vos données personnelles, consultez notre{' '}
            <Link href="/politique-confidentialite" className="text-blue-600 hover:underline font-medium">
              Politique de confidentialité
            </Link>.
          </p>
        </section>
      </div>
    </div>
  );
}
