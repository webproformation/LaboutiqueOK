import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, Calendar, Bell } from 'lucide-react';
import Link from 'next/link';

export default function LivePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#C6A15B]/10 rounded-full mb-6">
            <Video className="h-10 w-10 text-[#C6A15B]" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Lives Shopping</h1>
          <p className="text-xl text-gray-600">
            Rejoignez Morgane en direct pour découvrir nos nouveautés et profiter d'offres exclusives
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 mb-12">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Calendar className="h-6 w-6 text-[#C6A15B]" />
                <CardTitle>Horaires des lives</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-semibold">Facebook Live</p>
                <p className="text-gray-600">Plusieurs fois par semaine</p>
              </div>
              <div>
                <p className="font-semibold">TikTok Live</p>
                <p className="text-gray-600">Sessions spéciales</p>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                Les horaires sont annoncés sur nos réseaux sociaux. Suivez-nous pour ne rien manquer !
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Bell className="h-6 w-6 text-[#C6A15B]" />
                <CardTitle>Notifications</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Activez les notifications sur nos réseaux sociaux pour être alerté au démarrage de chaque live.
              </p>
              <div className="space-y-2">
                <Button asChild className="w-full" variant="outline">
                  <a
                    href="https://www.facebook.com/p/La-boutique-de-Morgane-100057420760713/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Suivre sur Facebook
                  </a>
                </Button>
                <Button asChild className="w-full" variant="outline">
                  <a
                    href="https://www.tiktok.com/@laboutiquedemorgane"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Suivre sur TikTok
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-[#C6A15B]/5 border-[#C6A15B]/20">
          <CardHeader>
            <CardTitle>Pourquoi participer à nos lives ?</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-[#C6A15B] rounded-full mt-2"></div>
                <p>Découvrez nos nouveautés en avant-première</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-[#C6A15B] rounded-full mt-2"></div>
                <p>Profitez d'offres exclusives réservées aux participants</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-[#C6A15B] rounded-full mt-2"></div>
                <p>Posez vos questions à Morgane en direct</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-[#C6A15B] rounded-full mt-2"></div>
                <p>Bénéficiez de conseils personnalisés</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-[#C6A15B] rounded-full mt-2"></div>
                <p>Profitez d'une ambiance conviviale et chaleureuse</p>
              </li>
            </ul>
          </CardContent>
        </Card>

        <div className="text-center mt-12">
          <Button asChild size="lg">
            <Link href="/contact">Nous contacter</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
