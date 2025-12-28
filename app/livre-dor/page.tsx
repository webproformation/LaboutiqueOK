"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gem, Heart, ShieldCheck, MessageCircle, ChevronDown, ChevronUp, Facebook, Crown } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import OptimizedImage from "@/components/OptimizedImage";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import dynamic from "next/dynamic";

const GeneralReviewForm = dynamic(() => import("@/components/GeneralReviewForm"), { ssr: false });

interface GuestbookEntry {
  id: string;
  customer_name: string;
  rating: number;
  message: string;
  photo_url: string | null;
  admin_response: string | null;
  votes_count: number;
  created_at: string;
  approved_at: string;
  source: 'site' | 'facebook' | 'website';
  user_id: string | null;
  profiles?: {
    ambassador_badge: boolean;
  };
}

export default function LivreDorPage() {
  const { user, profile } = useAuth();
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [votedEntries, setVotedEntries] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [showCharter, setShowCharter] = useState(false);

  useEffect(() => {
    fetchEntries();
    if (user && profile) {
      fetchUserVotes();
    }
  }, [user, profile]);

  const fetchEntries = async () => {
    try {
      const supabase = createClient();

      const { data: guestbookData, error: guestbookError } = await supabase
        .from("guestbook_entries")
        .select(`
          *,
          profiles:user_id (
            ambassador_badge
          )
        `)
        .eq("status", "approved")
        .order("approved_at", { ascending: false });

      if (guestbookError) throw guestbookError;

      const { data: customerReviewsData, error: reviewsError } = await supabase
        .from("customer_reviews")
        .select(`
          *,
          profiles:user_id (
            ambassador_badge
          )
        `)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });

      if (reviewsError) throw reviewsError;

      const transformedReviews = (customerReviewsData || []).map(review => ({
        id: review.id,
        customer_name: review.customer_name,
        rating: review.rating,
        message: review.comment,
        photo_url: null,
        admin_response: null,
        votes_count: 0,
        created_at: review.created_at,
        approved_at: review.created_at,
        source: review.source as 'site' | 'facebook' | 'website',
        user_id: review.user_id,
        profiles: review.profiles,
      }));

      const allEntries = [...(guestbookData || []), ...transformedReviews];
      allEntries.sort((a, b) => new Date(b.approved_at).getTime() - new Date(a.approved_at).getTime());

      setEntries(allEntries);
    } catch (error) {
      console.error("Error fetching guestbook entries:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserVotes = async () => {
    if (!profile) return;

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("guestbook_votes")
        .select("guestbook_entry_id")
        .eq("user_id", profile.id);

      if (error) throw error;
      if (data) {
        setVotedEntries(new Set(data.map(v => v.guestbook_entry_id)));
      }
    } catch (error) {
      console.error("Error fetching user votes:", error);
    }
  };

  const handleVote = async (entryId: string) => {
    if (!user || !profile) {
      toast.error("Vous devez être connectée pour voter ❤️");
      return;
    }

    if (votedEntries.has(entryId)) {
      toast.error("Vous avez déjà voté pour cet avis");
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.from("guestbook_votes").insert({
        guestbook_entry_id: entryId,
        user_id: profile.id,
      });

      if (error) {
        if (error.code === '23505') {
          toast.error("Vous avez déjà voté pour cet avis");
        } else {
          throw error;
        }
        return;
      }

      const newVotedEntries = new Set(votedEntries);
      newVotedEntries.add(entryId);
      setVotedEntries(newVotedEntries);

      setEntries((prev) =>
        prev.map((entry) =>
          entry.id === entryId ? { ...entry, votes_count: entry.votes_count + 1 } : entry
        )
      );

      toast.success("Merci pour votre cœur ❤️");
    } catch (error) {
      console.error("Error voting:", error);
      toast.error("Une erreur est survenue");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">Chargement des mots doux...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto mb-12 text-center space-y-6">
        <div className="flex justify-center mb-4">
          <Crown className="h-12 w-12 text-amber-500" />
        </div>
        <h1 className="text-4xl font-bold">Devenez notre Ambassadrice de la Semaine !</h1>
        <div className="prose prose-lg mx-auto text-left bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20 p-8 rounded-2xl border border-pink-200 dark:border-pink-800 space-y-4">
          <p className="text-base leading-relaxed">
            Vous aimez vos pépites ? Vous adorez partager vos looks ? Alors, préparez-vous à briller ! Chaque semaine, nous mettons l&apos;une d&apos;entre vous à l&apos;honneur sur la boutique. Plus qu&apos;un simple titre, c&apos;est notre façon de vous dire merci pour tout l&apos;amour que vous portez à nos collections.
          </p>

          <div>
            <p className="text-lg font-semibold mb-2">Comment participer ? C&apos;est tout simple :</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Faites pétiller votre look :</strong> Prenez une jolie photo de vous portant vos pépites préférées.</li>
              <li><strong>Signez le Livre d&apos;Or :</strong> Déposez votre photo et votre petit mot doux sur notre site.</li>
              <li className="text-green-600 dark:text-green-400"><em>Pssst : En plus, vous gagnez immédiatement 0,20 € dans votre cagnotte (dès la validation de l&apos;avis) !</em></li>
              <li><strong>Récoltez des cœurs :</strong> C&apos;est ici que la magie opère ! Invitez les autres visiteuses à cliquer sur le « Cœur ❤️ » sous votre avis.</li>
            </ul>
          </div>

          <div className="bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 p-4 rounded-lg border-l-4 border-pink-500">
            <p className="text-base font-semibold mb-2">💖 Comment gagner ?</p>
            <p className="text-sm">
              Chaque lundi matin, nous regardons quelle photo a fait battre le plus de cœurs sur les 7 derniers jours. La cliente qui a récolté le plus de votes devient officiellement notre Ambassadrice de la Semaine.
            </p>
          </div>

          <div className="bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 p-4 rounded-lg border-l-4 border-amber-500">
            <p className="text-base font-semibold mb-2">🎁 Votre couronne de cadeaux :</p>
            <p className="text-sm mb-2">Si vous êtes élue, voici vos privilèges de Reine :</p>
            <ul className="list-disc list-inside space-y-1 text-sm ml-4">
              <li><strong>💰 5,00 € offerts immédiatement</strong> sur votre Cagnotte de la Boutique</li>
              <li><strong>👑 Votre Badge &quot;Couronne Dorée&quot; :</strong> Il s&apos;affichera fièrement à côté de votre prénom sur tout le site pour montrer à tout le monde que vous êtes notre égérie !</li>
              <li><strong>🌟 Votre moment de gloire :</strong> Votre photo et votre avis seront affichés en grand sur la page d&apos;accueil de la boutique pendant toute la semaine.</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-pink-200 dark:border-pink-800">
            <p className="text-sm"><strong>🌸 Le petit conseil de Morgane :</strong></p>
            <p className="text-sm">
              Pour avoir un maximum de chances, partagez votre avis à vos amies et n&apos;hésitez pas à soigner votre photo (une belle lumière, un joli sourire, et le tour est joué !).
            </p>
          </div>

          <p className="text-base font-semibold text-center text-pink-600 dark:text-pink-400">
            Alors, qui sera notre prochaine Ambassadrice ? À vos pépites, prêtes... brillez !
          </p>
        </div>

        <Collapsible open={showCharter} onOpenChange={setShowCharter} className="mt-8">
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between text-base font-semibold border-2 border-amber-200 hover:bg-amber-50 dark:border-amber-800 dark:hover:bg-amber-950/20"
            >
              Charte de Modération du Livre d&apos;Or
              {showCharter ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <div className="prose prose-sm max-w-none bg-white dark:bg-gray-900 p-8 rounded-2xl border-2 border-amber-200 dark:border-amber-800 space-y-6">
              <p className="text-base leading-relaxed">
                Bienvenue dans l&apos;espace d&apos;expression de La Boutique de Morgane. Pour que ce lieu reste un espace d&apos;amour, de bienveillance et d&apos;authenticité, nous avons mis en place quelques règles simples.
              </p>

              <div>
                <h3 className="text-lg font-bold mb-3">1. Authenticité avant tout</h3>
                <p className="text-sm leading-relaxed">
                  Le Livre d&apos;Or est strictement réservé aux clientes ayant effectué un achat sur notre boutique. Chaque avis est lié à une commande réelle et porte la mention « Achat Vérifié ✅ ». Cela vous garantit que chaque témoignage et chaque photo proviennent d&apos;une expérience vécue.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-3">2. Processus de Modération</h3>
                <p className="text-sm leading-relaxed mb-2">
                  Afin d&apos;éviter les messages publicitaires indésirables (spams) ou les contenus inappropriés, chaque signature est relue par notre équipe avant publication.
                </p>
                <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                  <li><strong>Délai :</strong> Votre avis apparaîtra sous 48h à 72h après sa validation technique.</li>
                  <li><strong>Transparence :</strong> Nous ne sélectionnons pas les avis en fonction de leur note. Un avis moins positif sera publié dès lors qu&apos;il respecte les règles de politesse et de respect.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-3">3. Motifs de refus d&apos;un avis</h3>
                <p className="text-sm leading-relaxed mb-2">
                  Nous nous réservons le droit de ne pas publier (ou de supprimer) un avis si :
                </p>
                <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                  <li>Il contient des propos injurieux, diffamatoires, racistes ou haineux.</li>
                  <li>Il comporte des données personnelles (numéro de téléphone, adresse e-mail, etc.).</li>
                  <li>La photo jointe est de mauvaise qualité, n&apos;appartient pas à l&apos;auteur ou est jugée inappropriée.</li>
                  <li>Le contenu est purement publicitaire ou comporte des liens vers d&apos;autres sites.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-3">4. Récompenses et Équité</h3>
                <p className="text-sm leading-relaxed">
                  La récompense créditée sur votre cagnotte (0,20€) est offerte en remerciement du temps accordé pour partager votre expérience. Elle n&apos;est en aucun cas conditionnée par l&apos;obtention d&apos;une note positive.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-3">5. Élection de l&apos;Ambassadrice</h3>
                <p className="text-sm leading-relaxed">
                  L&apos;élection de « L&apos;Ambassadrice de la Semaine » se base sur le nombre de « Cœurs ❤️ » reçus par les autres visiteuses. En cas d&apos;égalité ou de suspicion de fraude (utilisation de robots de vote), l&apos;administrateur de la boutique se réserve le droit de procéder à l&apos;arbitrage final pour désigner la gagnante.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-3">6. Vos Droits (RGPD)</h3>
                <p className="text-sm leading-relaxed">
                  En signant le Livre d&apos;Or, vous acceptez la publication de votre prénom et de votre photo sur notre site. Vous pouvez à tout moment demander la modification ou la suppression de votre avis en nous contactant via le formulaire de contact.
                </p>
              </div>

              <p className="text-sm text-center font-semibold text-amber-700 dark:text-amber-500 mt-6">
                Merci de contribuer à faire de notre Livre d&apos;Or un lieu bienveillant et authentique ! 💛
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Aucun avis pour le moment. Soyez la première à laisser un mot doux !
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {entries.map((entry) => (
            <Card
              key={entry.id}
              className="group hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              <CardContent className="p-0">
                {entry.photo_url && (
                  <div className="relative h-64 w-full overflow-hidden">
                    <OptimizedImage
                      src={entry.photo_url}
                      alt={`Photo de ${entry.customer_name}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{entry.customer_name}</h3>
                          {entry.profiles?.ambassador_badge && (
                            <span title="Ambassadrice de la Boutique">
                              <Crown className="h-5 w-5 fill-amber-500 text-amber-500" />
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          {entry.source === 'facebook' ? (
                            <>
                              <Facebook className="h-3 w-3 text-blue-600" />
                              <span className="text-blue-600">Avis Facebook</span>
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="h-3 w-3" />
                              {entry.source === 'website' ? 'Avis Certifié' : 'Achat Vérifié'}
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: entry.rating }).map((_, i) => (
                        <Gem key={i} className="h-4 w-4 fill-amber-500 text-amber-500" />
                      ))}
                    </div>
                  </div>

                  <p className="text-sm leading-relaxed">{entry.message}</p>

                  {entry.admin_response && (
                    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 p-4 rounded-lg border-l-4 border-amber-500">
                      <div className="flex items-start gap-2">
                        <MessageCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-amber-800 dark:text-amber-400 mb-1">
                            Réponse de Morgane :
                          </p>
                          <p className="text-sm text-amber-900 dark:text-amber-300">
                            {entry.admin_response}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(entry.approved_at), "MMMM yyyy", { locale: fr })}
                    </p>
                    <Button
                      variant={votedEntries.has(entry.id) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleVote(entry.id)}
                      disabled={votedEntries.has(entry.id)}
                      className={`gap-2 ${
                        votedEntries.has(entry.id)
                          ? "bg-pink-500 hover:bg-pink-600"
                          : "hover:bg-pink-50 hover:border-pink-300"
                      }`}
                    >
                      <Heart
                        className={`h-4 w-4 ${votedEntries.has(entry.id) ? "fill-current" : ""}`}
                      />
                      {entry.votes_count}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <GeneralReviewForm />
    </div>
  );
}
