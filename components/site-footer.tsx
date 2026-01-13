'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapPin, Phone, Mail, Send, Facebook, Instagram, ArrowUp, Cookie } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GDPRConsent } from '@/components/gdpr-consent';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const reassuranceBlocks = [
  {
    image: 'https://wp.laboutiquedemorgane.com/wp-content/uploads/2025/12/La-boutique-de-Morgane-Le-droit-a-lerreur.png',
    href: '/le-droit-a-lerreur',
    title: 'Le Droit à l\'Erreur',
    description: 'Ça arrive ! Transformez votre retour en crédit boutique pour craquer sur votre prochain coup de cœur sans attendre.'
  },
  {
    image: 'https://wp.laboutiquedemorgane.com/wp-content/uploads/2025/12/La-boutique-de-Morgane-Vite-chez-vous.png',
    href: '/vite-chez-vous',
    title: 'Vite chez vous',
    description: 'Vos pépites emballées avec soin et une expédition rapide. Livraison à prix mini (dès 3,90 €) pour un max de plaisir.'
  },
  {
    image: 'https://wp.laboutiquedemorgane.com/wp-content/uploads/2025/12/La-boutique-de-Morgane-Transaction-protegees.png',
    href: '/transactions-protegees',
    title: 'Transactions Protégées',
    description: 'Règlement 100 % sécurisé et facilités de paiement (3x, 4x). La tranquillité d\'esprit avant tout.'
  },
  {
    image: 'https://wp.laboutiquedemorgane.com/wp-content/uploads/2025/12/La-boutique-de-Morgane-Allo-Morgane.png',
    href: '/allo-morgane',
    title: 'Allô Morgane ?',
    description: 'Plus qu\'un site, un accompagnement. Morgane vous guide personnellement dans vos choix mode et beauté.'
  }
];

const categories = [
  { name: 'Nouveautés', href: '/category/nouveautes' },
  { name: 'Mode', href: '/category/mode' },
  { name: 'Les looks de Morgane', href: '/category/les-looks-de-morgane' },
  { name: 'Maison', href: '/category/maison' },
  { name: 'Beauté et Senteurs', href: '/category/beaute-et-senteurs' },
  { name: 'Bonnes affaires', href: '/category/bonnes-affaires' },
];

const informations = [
  { name: 'Qui sommes-nous', href: '/qui-sommes-nous' },
  { name: 'Contact', href: '/contact' },
  { name: 'Le droit à l\'erreur', href: '/le-droit-a-lerreur' },
  { name: 'Vite chez vous', href: '/vite-chez-vous' },
  { name: 'Transactions protégées', href: '/transactions-protegees' },
  { name: 'Allô Morgane', href: '/allo-morgane' },
  { name: 'Le carnet de Morgane', href: '/actualites' },
  { name: 'Le livre d\'or', href: '/livre-dor' },
  { name: 'Lives', href: '/live' },
];

export function SiteFooter() {
  const [email, setEmail] = useState('');
  const [gdprConsent, setGdprConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !gdprConsent) {
      toast.error('Veuillez remplir tous les champs et accepter la politique de confidentialité');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('newsletter_subscriptions')
        .insert([{ email }]);

      if (error) {
        if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
          toast.success('Vous faites déjà partie de nos abonnés ! Merci de votre fidélité.');
        } else {
          console.error('Newsletter subscription error:', error);
          toast.error('Une erreur est survenue lors de l\'inscription');
        }
      } else {
        toast.success('Merci pour votre inscription !');
      }

      setEmail('');
      setGdprConsent(false);
    } catch (error) {
      console.error('Newsletter subscription exception:', error);
      toast.error('Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer>
      <section className="bg-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {reassuranceBlocks.map((block) => (
              <Link
                key={block.href}
                href={block.href}
                className="group block"
              >
                <div className="bg-white rounded-lg overflow-hidden transition-transform duration-300 hover:scale-105">
                  <div className="h-32 overflow-hidden flex items-center justify-center">
                    <img
                      src={block.image}
                      alt={block.title}
                      className="h-24 w-auto object-contain transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                  <div className="p-6 text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {block.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {block.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 text-center md:text-left">
            <div>
              <h3 className="text-white font-bold text-xl md:text-lg mb-4">Contact</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-2 justify-center md:justify-start">
                  <MapPin className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div className="text-base md:text-sm">
                    1062 rue d'Armentières<br />
                    59850 Nieppe
                  </div>
                </div>

                <div className="flex items-start gap-2 justify-center md:justify-start">
                  <Phone className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div className="text-base md:text-sm space-y-1">
                    <div>
                      <strong>Morgane</strong>:{' '}
                      <a href="tel:+33641456671" className="hover:text-white transition-colors">
                        +33 6 41 45 66 71
                      </a>
                    </div>
                    <div>
                      <strong>André</strong>:{' '}
                      <a href="tel:+33603489662" className="hover:text-white transition-colors">
                        +33 6 03 48 96 62
                      </a>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2 justify-center md:justify-start">
                  <Mail className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <a
                    href="mailto:contact@laboutiquedemorgane.com"
                    className="text-base md:text-sm hover:text-white transition-colors break-all"
                  >
                    contact@laboutiquedemorgane.com
                  </a>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-white font-bold text-xl md:text-lg mb-4">Catégories</h3>
              <ul className="space-y-2">
                {categories.map((category) => (
                  <li key={category.href}>
                    <Link
                      href={category.href}
                      className="text-base md:text-sm hover:text-white transition-colors"
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-white font-bold text-xl md:text-lg mb-4">Informations</h3>
              <ul className="space-y-2">
                {informations.map((info) => (
                  <li key={info.href}>
                    <Link
                      href={info.href}
                      className="text-base md:text-sm hover:text-white transition-colors"
                    >
                      {info.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-white font-bold text-xl md:text-lg mb-4">Horaires</h3>
              <div className="space-y-4 text-base md:text-sm">
                <div className="flex items-start gap-2 justify-center md:justify-start">
                  <MapPin className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-white">En boutique sur rendez-vous</div>
                    <div>Le mercredi de 9h à 19h</div>
                  </div>
                </div>

                <div className="flex items-start gap-2 justify-center md:justify-start">
                  <Phone className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-white">Par téléphone</div>
                    <div>Du lundi au vendredi de 9h à 18h</div>
                  </div>
                </div>

                <div className="flex items-start gap-2 justify-center md:justify-start">
                  <Mail className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-white">En dehors de ces horaires</div>
                    <div>
                      Laissez-nous un SMS ou un e-mail,<br />
                      réponse garantie le plus rapidement possible
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-white font-bold text-xl md:text-lg mb-4">Newsletter</h3>
              <form onSubmit={handleNewsletterSubmit} className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Votre email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                    required
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={isSubmitting}
                    className="bg-[#D4AF37] hover:bg-[#b8933d] text-black"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <GDPRConsent
                  type="newsletter"
                  checked={gdprConsent}
                  onCheckedChange={setGdprConsent}
                />
              </form>

              <div className="mt-6">
                <h4 className="text-white font-semibold mb-3">Suivez-nous</h4>
                <div className="flex gap-3 justify-center md:justify-start">
                  <a
                    href="https://www.facebook.com/p/La-boutique-de-Morgane-100057420760713/?locale=fr_FR"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gray-800 hover:bg-gray-700 p-3 rounded-full transition-colors"
                  >
                    <Facebook className="h-5 w-5" />
                  </a>
                  <a
                    href="https://www.instagram.com/la.boutique.de.morgane/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gray-800 hover:bg-gray-700 p-3 rounded-full transition-colors"
                  >
                    <Instagram className="h-5 w-5" />
                  </a>
                  <a
                    href="https://www.tiktok.com/@laboutiquedemorgane"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gray-800 hover:bg-gray-700 p-3 rounded-full transition-colors"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                  </a>
                </div>
              </div>

              <div className="mt-6 flex gap-2 justify-center md:justify-start md:hidden">
                <Button
                  onClick={scrollToTop}
                  className="bg-[#C6A15B] hover:bg-[#b8933d] text-white"
                >
                  <ArrowUp className="h-4 w-4 mr-2" />
                  Retour en haut
                </Button>
                <Button
                  variant="outline"
                  className="bg-[#C6A15B] hover:bg-[#b8933d] text-white border-none"
                >
                  <Cookie className="h-4 w-4 mr-2" />
                  Cookies
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-900 border-t border-gray-800 py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-300 text-center md:text-left">
            <div>
              © {new Date().getFullYear()} La Boutique de Morgane. Tous droits réservés.
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link href="/mentions-legales" className="hover:text-white transition-colors">
                Mentions légales
              </Link>
              <span>|</span>
              <Link href="/politique-confidentialite" className="hover:text-white transition-colors">
                Politique de confidentialité
              </Link>
              <span>|</span>
              <Link href="/cgv" className="hover:text-white transition-colors">
                CGV
              </Link>
              <span>|</span>
              <a
                href="https://webproformation.fr/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#C6A15B] hover:underline font-medium"
              >
                Site créé par webproformation
              </a>
            </div>
          </div>
        </div>
      </section>
    </footer>
  );
}
