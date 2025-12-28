"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Heart, Calendar, Award, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { format, subDays, startOfWeek, endOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import OptimizedImage from "@/components/OptimizedImage";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface GuestbookEntry {
  id: string;
  customer_name: string;
  message: string;
  photo_url: string | null;
  votes_count: number;
  approved_at: string;
  user_id: string;
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
  } | {
    first_name: string;
    last_name: string;
    email: string;
  }[];
}

interface WeeklyVotes {
  guestbook_entry_id: string;
  vote_count: number;
}

interface Ambassador {
  id: string;
  week_start_date: string;
  week_end_date: string;
  total_votes: number;
  reward_amount: number;
  is_active: boolean;
  guestbook_entries: {
    customer_name: string;
    message: string;
    photo_url: string | null;
  };
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export default function AmbassadriceAdminPage() {
  const [topEntries, setTopEntries] = useState<(GuestbookEntry & { weekly_votes: number })[]>([]);
  const [currentAmbassador, setCurrentAmbassador] = useState<Ambassador | null>(null);
  const [pastAmbassadors, setPastAmbassadors] = useState<Ambassador[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const [isElecting, setIsElecting] = useState(false);

  const weekStartDate = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekEndDate = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    await Promise.all([
      fetchTopEntriesThisWeek(),
      fetchCurrentAmbassador(),
      fetchPastAmbassadors(),
    ]);
    setIsLoading(false);
  };

  const fetchTopEntriesThisWeek = async () => {
    try {
      const supabase = createClient();
      const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');

      const { data: votes, error: votesError } = await supabase
        .from("guestbook_votes")
        .select("guestbook_entry_id")
        .gte("created_at", sevenDaysAgo);

      if (votesError) throw votesError;

      const voteCountMap = new Map<string, number>();
      votes?.forEach((vote) => {
        const count = voteCountMap.get(vote.guestbook_entry_id) || 0;
        voteCountMap.set(vote.guestbook_entry_id, count + 1);
      });

      const entryIds = Array.from(voteCountMap.keys());

      if (entryIds.length === 0) {
        setTopEntries([]);
        return;
      }

      const { data: entries, error: entriesError } = await supabase
        .from("guestbook_entries")
        .select(`
          id,
          customer_name,
          message,
          photo_url,
          votes_count,
          approved_at,
          user_id,
          profiles:user_id (
            first_name,
            last_name,
            email
          )
        `)
        .in("id", entryIds)
        .eq("status", "approved")
        .order("votes_count", { ascending: false });

      if (entriesError) throw entriesError;

      const entriesWithWeeklyVotes = (entries || []).map((entry) => ({
        ...entry,
        weekly_votes: voteCountMap.get(entry.id) || 0,
      }));

      entriesWithWeeklyVotes.sort((a, b) => b.weekly_votes - a.weekly_votes);

      setTopEntries(entriesWithWeeklyVotes.slice(0, 10));
    } catch (error) {
      console.error("Error fetching top entries:", error);
      toast.error("Erreur lors du chargement des avis");
    }
  };

  const fetchCurrentAmbassador = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("weekly_ambassadors")
        .select(`
          *,
          guestbook_entries (
            customer_name,
            message,
            photo_url
          ),
          profiles (
            first_name,
            last_name,
            email
          )
        `)
        .eq("is_active", true)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      setCurrentAmbassador(data);
    } catch (error) {
      console.error("Error fetching current ambassador:", error);
    }
  };

  const fetchPastAmbassadors = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("weekly_ambassadors")
        .select(`
          *,
          guestbook_entries (
            customer_name,
            message,
            photo_url
          ),
          profiles (
            first_name,
            last_name,
            email
          )
        `)
        .eq("is_active", false)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setPastAmbassadors(data || []);
    } catch (error) {
      console.error("Error fetching past ambassadors:", error);
    }
  };

  const handleElectAmbassador = async () => {
    if (!selectedEntry) return;

    setIsElecting(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("elect_weekly_ambassador", {
        p_guestbook_entry_id: selectedEntry,
        p_week_start_date: weekStartDate,
        p_week_end_date: weekEndDate,
      });

      if (error) throw error;

      if (data.success) {
        toast.success(`Ambassadrice élue avec succès ! ${data.total_votes} votes reçus, ${data.reward_amount}€ crédités.`);
        await fetchData();
        setSelectedEntry(null);
      } else {
        toast.error(data.error || "Erreur lors de l'élection");
      }
    } catch (error) {
      console.error("Error electing ambassador:", error);
      toast.error("Erreur lors de l'élection");
    } finally {
      setIsElecting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center gap-3">
        <Crown className="h-8 w-8 text-amber-500" />
        <h1 className="text-3xl font-bold">Gestion Ambassadrice de la Semaine</h1>
      </div>

      {currentAmbassador && (
        <Card className="border-2 border-amber-500 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-6 w-6 text-amber-600" />
              Ambassadrice Actuelle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {currentAmbassador.guestbook_entries.photo_url && (
                <div className="relative h-64 rounded-lg overflow-hidden">
                  <OptimizedImage
                    src={currentAmbassador.guestbook_entries.photo_url}
                    alt={currentAmbassador.guestbook_entries.customer_name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="text-lg font-semibold">
                    {currentAmbassador.guestbook_entries.customer_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {currentAmbassador.profiles.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Période</p>
                  <p className="font-medium">
                    Du {format(new Date(currentAmbassador.week_start_date), "dd MMMM", { locale: fr })} au{" "}
                    {format(new Date(currentAmbassador.week_end_date), "dd MMMM yyyy", { locale: fr })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Votes reçus</p>
                  <p className="text-2xl font-bold text-pink-600">{currentAmbassador.total_votes} ❤️</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Récompense</p>
                  <p className="text-xl font-bold text-green-600">{currentAmbassador.reward_amount.toFixed(2)} €</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Top 10 des Avis - 7 derniers jours
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Période : {format(subDays(new Date(), 7), "dd MMMM", { locale: fr })} - {format(new Date(), "dd MMMM yyyy", { locale: fr })}
          </p>
        </CardHeader>
        <CardContent>
          {topEntries.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucun vote enregistré sur les 7 derniers jours
            </p>
          ) : (
            <div className="space-y-4">
              {topEntries.map((entry, index) => (
                <Card
                  key={entry.id}
                  className={`cursor-pointer transition-all ${
                    selectedEntry === entry.id
                      ? "border-2 border-pink-500 bg-pink-50 dark:bg-pink-950/20"
                      : "hover:border-pink-300"
                  }`}
                  onClick={() => setSelectedEntry(entry.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <Badge variant="secondary" className="text-lg">
                          #{index + 1}
                        </Badge>
                      </div>
                      {entry.photo_url && (
                        <div className="relative h-24 w-24 rounded-md overflow-hidden flex-shrink-0">
                          <OptimizedImage
                            src={entry.photo_url}
                            alt={entry.customer_name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg">{entry.customer_name}</h3>
                        <p className="text-sm text-muted-foreground truncate">{entry.message}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-1">
                            <Heart className="h-4 w-4 text-pink-500" />
                            <span className="font-semibold text-pink-600">
                              {entry.weekly_votes} votes cette semaine
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Total: {entry.votes_count} votes
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {selectedEntry && (
            <div className="mt-6 flex justify-center">
              <Button
                size="lg"
                onClick={() => setSelectedEntry(selectedEntry)}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
              >
                <Crown className="mr-2 h-5 w-5" />
                Élire comme Ambassadrice de la Semaine
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {pastAmbassadors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-6 w-6" />
              Ambassadrices Précédentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pastAmbassadors.map((ambassador) => (
                <Card key={ambassador.id}>
                  <CardContent className="p-4">
                    {ambassador.guestbook_entries.photo_url && (
                      <div className="relative h-48 rounded-md overflow-hidden mb-3">
                        <OptimizedImage
                          src={ambassador.guestbook_entries.photo_url}
                          alt={ambassador.guestbook_entries.customer_name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <h3 className="font-semibold">{ambassador.guestbook_entries.customer_name}</h3>
                    <p className="text-xs text-muted-foreground mb-2">
                      {format(new Date(ambassador.week_start_date), "dd MMM", { locale: fr })} -{" "}
                      {format(new Date(ambassador.week_end_date), "dd MMM yyyy", { locale: fr })}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{ambassador.total_votes} ❤️</span>
                      <span className="text-sm font-medium text-green-600">{ambassador.reward_amount}€</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer l&apos;élection</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir élire cette cliente comme Ambassadrice de la Semaine ?
              <br />
              <br />
              Cela va :
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Désactiver l&apos;ambassadrice actuelle (si elle existe)</li>
                <li>Attribuer le badge Couronne Dorée à la nouvelle ambassadrice</li>
                <li>Créditer 5,00 € sur sa cagnotte (sans multiplicateur)</li>
                <li>Afficher son avis sur la page d&apos;accueil</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isElecting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleElectAmbassador}
              disabled={isElecting}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
            >
              {isElecting ? "Élection en cours..." : "Confirmer l'élection"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
