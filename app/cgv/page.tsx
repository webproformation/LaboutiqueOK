import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function CGVPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link href="/">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à l&apos;accueil
        </Button>
      </Link>

      <h1 className="text-4xl font-bold text-gray-900 mb-8">Conditions Générales de Vente</h1>
      <p className="text-xl text-gray-600 mb-8">La Boutique de Morgane</p>

      <div className="prose prose-gray max-w-none space-y-8">
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Article 1 – Objet et champ d&apos;application</h2>
          <p className="text-gray-600 mb-3">
            Les présentes Conditions Générales de Vente (ci-après les « CGV ») régissent, sans restriction ni réserve,
            l&apos;ensemble des ventes conclues entre :
          </p>
          <div className="bg-gray-50 p-6 rounded-lg mb-4">
            <p className="text-gray-700 font-semibold">MORGANE DEWANIN,</p>
            <p className="text-gray-700">Société par actions simplifiée (SAS)</p>
            <p className="text-gray-700">Siège social : 1062 rue d&apos;Armentières, 59850 Nieppe</p>
            <p className="text-gray-700">SIRET : 907 889 802 00027</p>
            <p className="text-gray-700 italic mt-2">(ci-après « le Vendeur »),</p>
          </div>
          <p className="text-gray-600">
            et toute personne physique majeure ou personne morale effectuant un achat via le site internet
            La Boutique de Morgane (ci-après « l&apos;Acheteur »).
          </p>
          <p className="text-gray-600 mt-3">
            Les CGV sont accessibles à tout moment sur le site internet et prévalent sur tout autre document.
            Toute commande implique l&apos;acceptation pleine et entière des présentes CGV par l&apos;Acheteur.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Article 2 – Produits</h2>
          <p className="text-gray-600 mb-3">
            Les produits proposés à la vente sont ceux figurant sur le site au jour de la consultation par l&apos;Acheteur,
            dans la limite des stocks disponibles.
          </p>
          <p className="text-gray-600 mb-3">
            Chaque produit est présenté avec une description détaillée. Les photographies, illustrations et descriptions
            sont les plus fidèles possibles mais n&apos;ont pas de valeur contractuelle.
          </p>
          <p className="text-gray-600">
            Le Vendeur se réserve le droit de modifier à tout moment l&apos;assortiment de produits.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Article 3 – Prix</h2>
          <p className="text-gray-600 mb-3">
            Les prix sont indiqués en euros (€), toutes taxes comprises (TTC), hors frais de livraison.
          </p>
          <p className="text-gray-600 mb-3">
            Le Vendeur se réserve le droit de modifier ses prix à tout moment. Toutefois, le prix appliqué sera
            celui en vigueur au moment de la validation de la commande par l&apos;Acheteur.
          </p>
          <p className="text-gray-600">
            Les frais de livraison sont précisés avant la validation finale de la commande et sont à la charge
            de l&apos;Acheteur, sauf mention contraire.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Article 4 – Commandes</h2>
          <h3 className="text-xl font-semibold text-gray-800 mb-3">4.1 Processus de commande</h3>
          <p className="text-gray-600 mb-3">Pour passer commande, l&apos;Acheteur doit :</p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
            <li>Créer un compte client ou commander en tant qu&apos;invité</li>
            <li>Sélectionner les produits souhaités</li>
            <li>Vérifier et valider son panier</li>
            <li>Renseigner ses coordonnées et l&apos;adresse de livraison</li>
            <li>Choisir un mode de paiement</li>
            <li>Confirmer définitivement la commande</li>
          </ul>
          <p className="text-gray-600 mb-4">
            Toute commande vaut acceptation des prix, des descriptions des produits et des présentes CGV.
          </p>
          <h3 className="text-xl font-semibold text-gray-800 mb-3">4.2 Refus de commande</h3>
          <p className="text-gray-600">
            Le Vendeur se réserve le droit de refuser ou d&apos;annuler toute commande en cas de litige existant
            avec l&apos;Acheteur, de non-paiement d&apos;une commande antérieure ou de suspicion de fraude.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Article 5 – Validation de la commande</h2>
          <p className="text-gray-600 mb-3">La vente est réputée conclue uniquement après :</p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
            <li>la validation de la commande par l&apos;Acheteur,</li>
            <li>l&apos;encaissement effectif de la totalité du prix,</li>
            <li>l&apos;envoi d&apos;un email de confirmation de commande par le Vendeur.</li>
          </ul>
          <p className="text-gray-600">
            Cet email constitue la preuve de la transaction.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Article 6 – Modalités de paiement</h2>
          <p className="text-gray-600 mb-3">
            Le paiement est exigible immédiatement à la commande.
          </p>
          <p className="text-gray-600 mb-3">Les moyens de paiement acceptés sont :</p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
            <li>Carte bancaire (Visa, Mastercard, American Express)</li>
            <li>PayPal</li>
            <li>Virement bancaire</li>
          </ul>
          <p className="text-gray-600 mb-3">
            Les paiements par carte bancaire sont sécurisés via le prestataire Stripe, utilisant des protocoles
            de cryptage conformes aux normes en vigueur.
          </p>
          <p className="text-gray-600">
            En cas de paiement par virement bancaire, la commande ne sera traitée qu&apos;après réception effective des fonds.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Article 7 – Livraison</h2>
          <h3 className="text-xl font-semibold text-gray-800 mb-3">7.1 Modalités</h3>
          <p className="text-gray-600 mb-4">
            Les produits sont livrés à l&apos;adresse indiquée par l&apos;Acheteur lors de la commande.
            Il appartient à l&apos;Acheteur de vérifier l&apos;exactitude des informations fournies.
          </p>

          <h3 className="text-xl font-semibold text-gray-800 mb-3">7.2 Délais</h3>
          <p className="text-gray-600 mb-3">
            Les délais de livraison sont indiqués sur les fiches produits et lors du processus de commande.
            Ils sont donnés à titre indicatif et peuvent varier en fonction de la disponibilité des produits
            ou de circonstances exceptionnelles.
          </p>
          <p className="text-gray-600 mb-4">
            Le Vendeur ne pourra être tenu responsable des retards imputables aux transporteurs.
          </p>

          <h3 className="text-xl font-semibold text-gray-800 mb-3">7.3 Frais de livraison</h3>
          <div className="bg-gray-50 p-6 rounded-lg">
            <ul className="space-y-2 text-gray-700">
              <li><strong>France métropolitaine :</strong> 4,90 € (offerts à partir de 50 € d&apos;achat)</li>
              <li><strong>DOM-TOM :</strong> 12,90 €</li>
              <li><strong>Europe :</strong> 9,90 €</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Article 8 – Droit de rétractation</h2>
          <p className="text-gray-600 mb-4">
            Conformément aux articles L221-18 et suivants du Code de la consommation, l&apos;Acheteur dispose d&apos;un
            délai de 14 jours calendaires à compter de la réception du produit pour exercer son droit de rétractation,
            sans justification ni pénalité.
          </p>

          <h3 className="text-xl font-semibold text-gray-800 mb-3">8.1 Exercice du droit</h3>
          <p className="text-gray-600 mb-4">
            La rétractation doit être notifiée par email à : <a href="mailto:retour@exemple.fr" className="text-blue-600 hover:underline">retour@exemple.fr</a>
          </p>

          <h3 className="text-xl font-semibold text-gray-800 mb-3">8.2 Retour des produits</h3>
          <p className="text-gray-600 mb-3">Les produits doivent être retournés :</p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
            <li>dans leur état d&apos;origine,</li>
            <li>complets,</li>
            <li>non utilisés,</li>
            <li>dans leur emballage d&apos;origine.</li>
          </ul>
          <p className="text-gray-600 mb-4">
            Les frais de retour restent à la charge de l&apos;Acheteur, sauf erreur imputable au Vendeur.
          </p>

          <h3 className="text-xl font-semibold text-gray-800 mb-3">8.3 Remboursement</h3>
          <p className="text-gray-600">
            Le remboursement sera effectué dans un délai maximum de 14 jours à compter de la réception des produits
            retournés, via le même moyen de paiement que celui utilisé lors de la commande.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Article 9 – Garanties légales</h2>
          <p className="text-gray-600 mb-3">Tous les produits bénéficient :</p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
            <li>de la garantie légale de conformité (articles L217-3 et suivants du Code de la consommation),</li>
            <li>de la garantie contre les vices cachés (articles 1641 et suivants du Code civil).</li>
          </ul>
          <p className="text-gray-600">
            En cas de défaut de conformité ou de vice caché, l&apos;Acheteur peut demander la réparation,
            le remplacement ou le remboursement du produit.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Article 10 – Responsabilité</h2>
          <p className="text-gray-600 mb-3">
            Le Vendeur ne saurait être tenu responsable des dommages indirects résultant de l&apos;utilisation
            des produits vendus.
          </p>
          <p className="text-gray-600">
            La responsabilité du Vendeur est limitée au montant de la commande concernée, sauf disposition
            légale contraire.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Article 11 – Réclamations et service client</h2>
          <p className="text-gray-600 mb-4">
            Pour toute question, information ou réclamation, l&apos;Acheteur peut contacter le service client :
          </p>
          <div className="bg-gray-50 p-6 rounded-lg">
            <p className="text-gray-700 mb-2">
              <strong>Email :</strong> <a href="mailto:contact@laboutiquedemorgane.com" className="text-blue-600 hover:underline">contact@laboutiquedemorgane.com</a>
            </p>
            <p className="text-gray-700 mb-2"><strong>Téléphone :</strong></p>
            <p className="text-gray-700 ml-4 mb-1">
              <a href="tel:+33641456671" className="text-blue-600 hover:underline">Morgane : +33 6 41 45 66 71</a>
            </p>
            <p className="text-gray-700 ml-4 mb-2">
              <a href="tel:+33603489662" className="text-blue-600 hover:underline">André : +33 6 03 48 96 62</a>
            </p>
            <p className="text-gray-700">
              <strong>Courrier :</strong> 1062 rue d&apos;Armentières, 59850 Nieppe
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Article 12 – Données personnelles</h2>
          <p className="text-gray-600 mb-3">
            Les données personnelles collectées sont nécessaires au traitement des commandes et à la gestion
            de la relation client.
          </p>
          <p className="text-gray-600">
            Elles sont traitées conformément à la réglementation en vigueur (RGPD). L&apos;Acheteur dispose d&apos;un
            droit d&apos;accès, de rectification et de suppression de ses données, conformément à la{' '}
            <Link href="/politique-confidentialite" className="text-blue-600 hover:underline">
              politique de confidentialité
            </Link>{' '}
            du site.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Article 13 – Propriété intellectuelle</h2>
          <p className="text-gray-600 mb-3">
            Tous les éléments du site La Boutique de Morgane (textes, images, logos, graphismes) sont protégés
            par le droit de la propriété intellectuelle et restent la propriété exclusive du Vendeur.
          </p>
          <p className="text-gray-600">
            Toute reproduction, exploitation ou utilisation sans autorisation est strictement interdite.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Article 14 – Loi applicable et litiges</h2>
          <p className="text-gray-600 mb-3">
            Les présentes CGV sont soumises à la loi française.
          </p>
          <p className="text-gray-600">
            En cas de litige, une solution amiable sera recherchée en priorité. À défaut, les tribunaux
            français compétents seront seuls compétents.
          </p>
        </section>

        <section className="border-t pt-6 mt-8">
          <p className="text-sm text-gray-500">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
          </p>
        </section>
      </div>
    </div>
  );
}
