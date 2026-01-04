import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CGVPage() {
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
              Conditions Générales de Vente
            </h1>
            <p className="text-xl text-[#C6A15B] font-semibold">La Boutique de Morgane</p>
            <p className="text-gray-600 mt-2">Dernière mise à jour : {currentDate}</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Article 1 - Objet et champ d'application</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none space-y-3">
              <p>
                Les présentes Conditions Générales de Vente (CGV) régissent les ventes de produits effectuées
                sur le site internet laboutiquedemorgane.com.
              </p>
              <div className="bg-gray-50 p-4 rounded mt-3">
                <p className="font-semibold mb-2">Vendeur :</p>
                <ul className="space-y-1 text-sm">
                  <li>MORGANE DEWANIN - SAS</li>
                  <li>1062 rue d'Armentières, 59850 Nieppe, France</li>
                  <li>SIRET : 907 889 802 00027</li>
                  <li>Email : <a href="mailto:contact@laboutiquedemorgane.com" className="text-[#C6A15B] hover:underline">contact@laboutiquedemorgane.com</a></li>
                </ul>
              </div>
              <p>
                <strong>Acheteur :</strong> Toute personne physique majeure ou personne morale souhaitant effectuer un achat sur le Site.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Article 2 - Produits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p>
                Les produits proposés à la vente sont ceux qui figurent sur le site dans la limite des stocks disponibles.
                Les descriptions et photographies sont aussi fidèles que possible mais ne sont pas contractuelles.
              </p>
              <p>
                Nous nous réservons le droit de modifier à tout moment l'assortiment de produits.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Article 3 - Prix</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p>
                Les prix sont indiqués en euros (€) toutes taxes comprises (TTC), hors frais de livraison.
                Les frais de livraison sont indiqués avant la validation finale de la commande.
              </p>
              <p>
                Les prix en vigueur sont ceux affichés sur le site au moment de la commande.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Article 4 - Commandes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-semibold mb-2">4.1 Processus de commande</p>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                  <li>Sélection des produits</li>
                  <li>Ajout au panier</li>
                  <li>Création/connexion au compte client</li>
                  <li>Renseignement des adresses de livraison et facturation</li>
                  <li>Choix du mode de livraison</li>
                  <li>Choix du mode de paiement et validation</li>
                </ol>
              </div>
              <div>
                <p className="font-semibold mb-2">4.2 Refus de commande</p>
                <p className="text-sm text-gray-700">
                  Nous nous réservons le droit de refuser toute commande pour des motifs légitimes, notamment
                  en cas de litige antérieur, de suspicion de fraude, ou d'informations erronées.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Article 5 - Validation de la commande</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                La commande est définitive après validation du paiement et réception d'un email de confirmation.
                Un récapitulatif de commande est envoyé par email à l'adresse indiquée.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Article 6 - Modalités de paiement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p>Le paiement est exigible immédiatement à la commande.</p>
              <p><strong>Moyens de paiement acceptés :</strong></p>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                <li>Carte bancaire (Visa, Mastercard, CB)</li>
                <li>PayPal</li>
                <li>Virement bancaire (sous conditions)</li>
              </ul>
              <p className="text-sm text-gray-600">
                Tous les paiements sont sécurisés par Stripe avec cryptage SSL et protocole 3D Secure.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Article 7 - Livraison</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-semibold mb-2">7.1 Modalités de livraison</p>
                <p className="text-sm text-gray-700">
                  Les produits sont livrés à l'adresse indiquée lors de la commande.
                  Un email avec le numéro de suivi est envoyé dès l'expédition.
                </p>
              </div>
              <div>
                <p className="font-semibold mb-2">7.2 Délais de livraison</p>
                <p className="text-sm text-gray-700">
                  Les délais indiqués sont donnés à titre indicatif et peuvent varier selon le transporteur
                  et la destination. Ils ne sont pas contractuels.
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <p className="font-semibold mb-2">7.3 Frais de livraison</p>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• <strong>France métropolitaine :</strong> 4,90€ (offerts à partir de 50€ d'achat)</li>
                  <li>• <strong>DOM-TOM :</strong> 12,90€</li>
                  <li>• <strong>Europe :</strong> 9,90€</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Article 8 - Droit de rétractation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Vous disposez d'un délai de <strong>14 jours calendaires</strong> pour exercer votre droit de rétractation
                sans avoir à justifier de motifs.
              </p>
              <div>
                <p className="font-semibold mb-2">8.1 Exercice du droit de rétractation</p>
                <p className="text-sm text-gray-700">
                  Pour exercer ce droit, vous devez nous notifier votre décision par email à{' '}
                  <a href="mailto:retour@laboutiquedemorgane.com" className="text-[#C6A15B] hover:underline">retour@laboutiquedemorgane.com</a>
                </p>
              </div>
              <div>
                <p className="font-semibold mb-2">8.2 Conditions de retour</p>
                <p className="text-sm text-gray-700">
                  Les produits doivent être retournés dans leur état d'origine, complets, non utilisés,
                  avec toutes les étiquettes attachées.
                </p>
              </div>
              <div>
                <p className="font-semibold mb-2">8.3 Remboursement</p>
                <p className="text-sm text-gray-700">
                  Le remboursement sera effectué dans un délai maximum de 14 jours suivant la réception
                  du retour.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Article 9 - Garanties légales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p><strong>Garantie légale de conformité :</strong> Article L217-4 et suivants du Code de la consommation</p>
              <p><strong>Garantie contre les vices cachés :</strong> Articles 1641 et suivants du Code civil</p>
              <p className="text-sm text-gray-600">
                En cas de défaut de conformité ou vice caché, vous pouvez demander la réparation, le remplacement
                ou le remboursement du produit.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Article 10 - Responsabilité</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700">
                Notre responsabilité est limitée aux dommages directs et ne pourra en aucun cas excéder
                le montant de la commande concernée.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle>Article 11 - Réclamations et service client</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>Pour toute réclamation :</p>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• Email : <a href="mailto:contact@laboutiquedemorgane.com" className="text-[#C6A15B] hover:underline">contact@laboutiquedemorgane.com</a></li>
                <li>• Téléphone : +33 6 41 45 66 71 / +33 6 03 48 96 62</li>
                <li>• Courrier : 1062 rue d'Armentières, 59850 Nieppe, France</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Article 12 - Données personnelles</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Le traitement de vos données personnelles est réalisé conformément au RGPD.
                Pour plus d'informations, consultez notre{' '}
                <a href="/politique-confidentialite" className="text-[#C6A15B] hover:underline font-semibold">
                  Politique de Confidentialité
                </a>.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Article 13 - Propriété intellectuelle</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700">
                Tous les éléments du site (textes, images, logos, vidéos) sont protégés par le droit d'auteur.
                Toute reproduction, même partielle, est strictement interdite sans autorisation préalable.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Article 14 - Loi applicable et litiges</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p>
                Les présentes CGV sont soumises au droit français.
              </p>
              <p>
                En cas de litige, une solution amiable sera recherchée en priorité.
                À défaut, le litige sera porté devant les tribunaux compétents.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
