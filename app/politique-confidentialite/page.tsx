import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function PolitiqueConfidentialitePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link href="/">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à l&apos;accueil
        </Button>
      </Link>

      <h1 className="text-4xl font-bold text-gray-900 mb-8">Politique de confidentialité</h1>

      <div className="prose prose-gray max-w-none space-y-6">
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Introduction</h2>
          <p className="text-gray-600">
            La présente politique de confidentialité définit et vous informe de la manière dont La Boutique de Morgane utilise et protège
            les informations que vous nous transmettez, le cas échéant, lorsque vous utilisez le présent site.
          </p>
          <p className="text-gray-600 mt-3">
            <strong>Responsable du traitement :</strong> MORGANE DEWANIN, 1062 rue d&apos;Armentières, 59850 Nieppe
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Données personnelles collectées</h2>
          <p className="text-gray-600 mb-3">
            Les données personnelles que nous collectons incluent :
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>Nom et prénom</li>
            <li>Adresse email</li>
            <li>Adresse postale</li>
            <li>Numéro de téléphone</li>
            <li>Informations de commande et de paiement</li>
            <li>Données de navigation (cookies)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Finalités de la collecte</h2>
          <p className="text-gray-600 mb-3">
            Vos données personnelles sont collectées pour les finalités suivantes :
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>Gestion de votre compte client</li>
            <li>Traitement de vos commandes</li>
            <li>Envoi de notre newsletter (avec votre consentement)</li>
            <li>Amélioration de nos services</li>
            <li>Statistiques et analyses</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Base légale du traitement</h2>
          <p className="text-gray-600">
            Le traitement de vos données personnelles repose sur les bases légales suivantes :
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 mt-3">
            <li>L&apos;exécution d&apos;un contrat (traitement de commandes)</li>
            <li>Votre consentement (newsletter, cookies)</li>
            <li>Notre intérêt légitime (amélioration des services)</li>
            <li>Une obligation légale (conservation des données de facturation)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Durée de conservation</h2>
          <p className="text-gray-600">
            Vos données personnelles sont conservées pendant la durée nécessaire aux finalités pour lesquelles elles ont été collectées :
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 mt-3">
            <li>Données de compte : durée de vie du compte + 3 ans après suppression</li>
            <li>Données de commande : 10 ans (obligation légale)</li>
            <li>Newsletter : jusqu&apos;à désabonnement + 3 ans</li>
            <li>Cookies : maximum 13 mois</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Vos droits</h2>
          <p className="text-gray-600 mb-3">
            Conformément au RGPD, vous disposez des droits suivants :
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>Droit d&apos;accès à vos données</li>
            <li>Droit de rectification</li>
            <li>Droit à l&apos;effacement</li>
            <li>Droit à la limitation du traitement</li>
            <li>Droit à la portabilité des données</li>
            <li>Droit d&apos;opposition</li>
            <li>Droit de retirer votre consentement</li>
          </ul>
          <p className="text-gray-600 mt-4">
            Pour exercer ces droits, contactez-nous à : <a href="mailto:contact@laboutiquedemorgane.com" className="text-blue-600 hover:underline">contact@laboutiquedemorgane.com</a>
          </p>
          <p className="text-gray-600 mt-2">
            Vous avez également le droit d&apos;introduire une réclamation auprès de la CNIL (Commission Nationale de l&apos;Informatique et des Libertés).
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Sécurité des données</h2>
          <p className="text-gray-600">
            Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données personnelles
            contre la perte, l&apos;utilisation abusive, l&apos;accès non autorisé, la divulgation, l&apos;altération ou la destruction.
          </p>
          <div className="bg-gray-50 p-6 rounded-lg mt-4 space-y-3">
            <div>
              <p className="text-gray-700 font-semibold mb-2">Hébergement des données :</p>
              <p className="text-gray-700"><strong>Hébergeur Web :</strong> O2SWITCH, Chemin des Pardiaux, 63000 Clermont-Ferrand</p>
              <p className="text-gray-700"><strong>Infrastructure & Déploiement :</strong> Vercel Inc., c/o EDPO, Avenue Huart Hamoir 71, 1030 Brussels, Belgium</p>
              <p className="text-gray-700"><strong>DPO Vercel :</strong> privacy@vercel.com</p>
            </div>
            <p className="text-gray-600 text-sm">
              Nos hébergeurs sont conformes au RGPD et garantissent un niveau de sécurité adéquat pour la protection de vos données.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cookies</h2>
          <p className="text-gray-600">
            Notre site utilise des cookies pour améliorer votre expérience de navigation, analyser l&apos;utilisation du site
            et vous proposer des contenus personnalisés. Vous pouvez gérer vos préférences de cookies dans les paramètres de votre navigateur.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact</h2>
          <p className="text-gray-600">
            Pour toute question concernant cette politique de confidentialité ou le traitement de vos données personnelles,
            vous pouvez nous contacter :
          </p>
          <div className="bg-gray-50 p-6 rounded-lg mt-4">
            <p className="text-gray-700"><strong>Email :</strong> <a href="mailto:contact@laboutiquedemorgane.com" className="text-blue-600 hover:underline">contact@laboutiquedemorgane.com</a></p>
            <p className="text-gray-700"><strong>Téléphone :</strong></p>
            <p className="text-gray-700 ml-4"><a href="tel:+33641456671" className="text-blue-600 hover:underline"><strong>Morgane</strong> : +33 6 41 45 66 71</a></p>
            <p className="text-gray-700 ml-4"><a href="tel:+33603489662" className="text-blue-600 hover:underline"><strong>André</strong> : +33 6 03 48 96 62</a></p>
            <p className="text-gray-700"><strong>Courrier :</strong> 1062 rue d&apos;Armentières, 59850 Nieppe</p>
          </div>
        </section>

        <section>
          <p className="text-sm text-gray-500 mt-8">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
          </p>
        </section>
      </div>
    </div>
  );
}
