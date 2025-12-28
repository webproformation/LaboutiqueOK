"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Gem,
  Heart,
  Check,
  X,
  MessageCircle,
  Image as ImageIcon,
  Calendar,
  Facebook,
  ShieldCheck,
} from "lucide-react";
import OptimizedImage from "@/components/OptimizedImage";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface GuestbookEntry {
  id: string;
  user_id: string | null;
  order_id: string | null;
  order_number: string;
  customer_name: string;
  rating: number;
  message: string;
  photo_url: string | null;
  status: string;
  admin_response: string | null;
  likes_count: number;
  reward_amount: number;
  reward_applied: boolean;
  rgpd_consent: boolean;
  created_at: string;
  approved_at: string | null;
  source: 'site' | 'facebook';
}

export default function AdminGuestbookPage() {
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<GuestbookEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<GuestbookEntry | null>(null);
  const [adminResponse, setAdminResponse] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  const [sourceFilter, setSourceFilter] = useState<'all' | 'site' | 'facebook'>('all');

  useEffect(() => {
    fetchEntries();
  }, []);

  useEffect(() => {
    filterEntries();
  }, [entries, activeTab, sourceFilter]);

  const fetchEntries = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("guestbook_entries")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error("Error fetching entries:", error);
      toast.error("Erreur lors du chargement des avis");
    } finally {
      setIsLoading(false);
    }
  };

  const filterEntries = () => {
    let filtered = entries;
    if (activeTab !== "all") {
      filtered = filtered.filter((entry) => entry.status === activeTab);
    }
    if (sourceFilter !== "all") {
      filtered = filtered.filter((entry) => entry.source === sourceFilter);
    }
    setFilteredEntries(filtered);
  };

  const handleApprove = async (entry: GuestbookEntry) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("guestbook_entries")
        .update({
          status: "approved",
          approved_at: new Date().toISOString(),
        })
        .eq("id", entry.id);

      if (error) throw error;

      // Ne créditer des points de fidélité que pour les avis du site (avec user_id)
      if (entry.source === 'site' && entry.user_id && !entry.reward_applied) {
        const { error: loyaltyError } = await supabase.from("loyalty_transactions").insert({
          user_id: entry.user_id,
          amount: entry.reward_amount,
          type: "review_reward",
          description: `Récompense pour l'avis sur la commande ${entry.order_number}`,
          reference_id: entry.id,
        });

        if (!loyaltyError) {
          await supabase
            .from("guestbook_entries")
            .update({ reward_applied: true })
            .eq("id", entry.id);
        }
      }

      const message = entry.source === 'facebook'
        ? "Avis Facebook approuvé !"
        : "Avis approuvé et récompense créditée !";
      toast.success(message);
      fetchEntries();
    } catch (error) {
      console.error("Error approving entry:", error);
      toast.error("Erreur lors de l'approbation");
    }
  };

  const handleReject = async (entryId: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("guestbook_entries")
        .update({ status: "rejected" })
        .eq("id", entryId);

      if (error) throw error;

      toast.success("Avis refusé");
      fetchEntries();
    } catch (error) {
      console.error("Error rejecting entry:", error);
      toast.error("Erreur lors du refus");
    }
  };

  const handleAddResponse = (entry: GuestbookEntry) => {
    setSelectedEntry(entry);
    setAdminResponse(entry.admin_response || "");
    setIsDialogOpen(true);
  };

  const saveResponse = async () => {
    if (!selectedEntry) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("guestbook_entries")
        .update({ admin_response: adminResponse.trim() || null })
        .eq("id", selectedEntry.id);

      if (error) throw error;

      toast.success("Réponse enregistrée !");
      setIsDialogOpen(false);
      setSelectedEntry(null);
      setAdminResponse("");
      fetchEntries();
    } catch (error) {
      console.error("Error saving response:", error);
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">En attente</Badge>;
      case "approved":
        return <Badge className="bg-green-500">Approuvé</Badge>;
      case "rejected":
        return <Badge variant="destructive">Refusé</Badge>;
      default:
        return null;
    }
  };

  const pendingCount = entries.filter((e) => e.status === "pending").length;
  const approvedCount = entries.filter((e) => e.status === "approved").length;
  const rejectedCount = entries.filter((e) => e.status === "rejected").length;
  const facebookCount = entries.filter((e) => e.source === "facebook").length;
  const siteCount = entries.filter((e) => e.source === "site").length;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Gem className="h-8 w-8 text-amber-500" />
          Modération du Livre d&apos;Or
        </h1>
        <p className="text-muted-foreground">
          Gérez les avis laissés par vos clientes
        </p>
      </div>

      <div className="mb-6 flex items-center gap-3">
        <span className="text-sm font-medium">Source des avis :</span>
        <div className="flex gap-2">
          <Button
            variant={sourceFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSourceFilter('all')}
          >
            Tous ({entries.length})
          </Button>
          <Button
            variant={sourceFilter === 'site' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSourceFilter('site')}
            className="gap-2"
          >
            <ShieldCheck className="h-4 w-4" />
            Avis Site ({siteCount})
          </Button>
          <Button
            variant={sourceFilter === 'facebook' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSourceFilter('facebook')}
            className="gap-2"
            style={sourceFilter === 'facebook' ? { backgroundColor: '#1877f2' } : {}}
          >
            <Facebook className="h-4 w-4" />
            Avis Facebook ({facebookCount})
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="pending" className="relative">
            En attente
            {pendingCount > 0 && (
              <Badge className="ml-2 bg-red-500 text-white">{pendingCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approuvés
            <Badge className="ml-2" variant="outline">{approvedCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Refusés
            <Badge className="ml-2" variant="outline">{rejectedCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="all">
            Tous
            <Badge className="ml-2" variant="outline">{entries.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredEntries.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Aucun avis dans cette catégorie
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredEntries.map((entry) => (
                <Card key={entry.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          {entry.customer_name}
                          {getStatusBadge(entry.status)}
                          {entry.source === 'facebook' ? (
                            <Badge className="bg-blue-600 hover:bg-blue-700 gap-1">
                              <Facebook className="h-3 w-3" />
                              Facebook
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1">
                              <ShieldCheck className="h-3 w-3" />
                              Achat Vérifié
                            </Badge>
                          )}
                        </CardTitle>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(entry.created_at).toLocaleDateString("fr-FR")}
                          </span>
                          <span>Commande #{entry.order_number}</span>
                          {entry.source === 'site' && (
                            <span className="flex items-center gap-1">
                              Récompense: {entry.reward_amount} €
                              {entry.reward_applied && " (créditée)"}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {Array.from({ length: entry.rating }).map((_, i) => (
                          <Gem key={i} className="h-5 w-5 fill-amber-500 text-amber-500" />
                        ))}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-4">
                      {entry.photo_url && (
                        <div className="relative w-48 h-48 flex-shrink-0 rounded-lg overflow-hidden border">
                          <OptimizedImage
                            src={entry.photo_url}
                            alt={`Photo de ${entry.customer_name}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 space-y-3">
                        <div>
                          <p className="text-sm font-medium mb-1">Message :</p>
                          <p className="text-sm leading-relaxed">{entry.message}</p>
                        </div>

                        {entry.admin_response && (
                          <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg border-l-4 border-amber-500">
                            <p className="text-xs font-semibold mb-1 text-amber-800 dark:text-amber-400">
                              Votre réponse :
                            </p>
                            <p className="text-sm">{entry.admin_response}</p>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Heart className="h-4 w-4" />
                          {entry.likes_count} j&apos;aime
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4 border-t">
                      {entry.status === "pending" && (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleApprove(entry)}
                            className="gap-2"
                          >
                            <Check className="h-4 w-4" />
                            Approuver
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleReject(entry.id)}
                            className="gap-2"
                          >
                            <X className="h-4 w-4" />
                            Refuser
                          </Button>
                        </>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddResponse(entry)}
                        className="gap-2"
                      >
                        <MessageCircle className="h-4 w-4" />
                        {entry.admin_response ? "Modifier" : "Ajouter"} une réponse
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Réponse de Morgane</DialogTitle>
            <DialogDescription>
              Ajoutez une réponse personnelle à cet avis
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="admin-response">Votre message</Label>
              <Textarea
                id="admin-response"
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
                placeholder="Merci pour votre adorable message ! 💗"
                rows={4}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={saveResponse}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
