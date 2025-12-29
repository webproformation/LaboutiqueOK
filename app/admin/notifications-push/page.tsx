"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Send, AlertCircle, CheckCircle, Clock, Sparkles, ShoppingBag, Gem } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface NotificationSettings {
  max_notifications_per_day: number;
  auto_notify_new_live: boolean;
  auto_notify_hidden_diamond: boolean;
}

interface NotificationHistory {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  url: string | null;
  recipients_count: number;
  success: boolean;
  sent_at: string;
}

interface DailyLimit {
  limit: number;
  sent_today: number;
  can_send: boolean;
  remaining: number;
}

export default function NotificationsPushAdminPage() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [dailyLimit, setDailyLimit] = useState<DailyLimit | null>(null);
  const [history, setHistory] = useState<NotificationHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const [notificationType, setNotificationType] = useState<string>("custom");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [url, setUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    await Promise.all([
      fetchSettings(),
      fetchDailyLimit(),
      fetchHistory(),
    ]);
    setIsLoading(false);
  };

  const fetchSettings = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("push_notification_settings")
        .select("*")
        .limit(1)
        .single();

      if (error) throw error;
      setSettings(data);
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const fetchDailyLimit = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("check_daily_notification_limit");

      if (error) throw error;
      setDailyLimit(data);
    } catch (error) {
      console.error("Error fetching daily limit:", error);
    }
  };

  const fetchHistory = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("push_notifications")
        .select("*")
        .order("sent_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  const sendNotification = async () => {
    if (!title || !message) {
      toast.error("Le titre et le message sont obligatoires");
      return;
    }

    if (!dailyLimit?.can_send) {
      toast.error("Limite quotidienne atteinte");
      return;
    }

    setIsSending(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-push-notification`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            message,
            url: url || null,
            imageUrl: imageUrl || null,
            notificationType,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de l'envoi");
      }

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("id", user?.id)
        .single();

      await supabase.from("push_notifications").insert({
        notification_type: notificationType,
        title,
        message,
        url: url || null,
        image_url: imageUrl || null,
        sent_by: profile?.id,
        onesignal_id: result.onesignalId,
        recipients_count: result.recipients,
        success: true,
      });

      toast.success(`Notification envoyée à ${result.recipients} utilisateurs !`);

      setTitle("");
      setMessage("");
      setUrl("");
      setImageUrl("");
      setNotificationType("custom");

      await fetchData();
    } catch (error: any) {
      console.error("Error sending notification:", error);
      toast.error(error.message || "Erreur lors de l'envoi");
    } finally {
      setIsSending(false);
    }
  };

  const fillTemplate = (type: string) => {
    switch (type) {
      case "live":
        setTitle("🎥 Le Live commence dans 5 minutes !");
        setMessage("Rejoignez-nous pour découvrir nos nouvelles pépites en exclusivité");
        setUrl("/live");
        setImageUrl("");
        break;
      case "new_products":
        setTitle("✨ Nouvelles Pépites disponibles !");
        setMessage("Découvrez nos dernières nouveautés avant qu'il ne soit trop tard");
        setUrl("/");
        setImageUrl("");
        break;
      case "hidden_diamond":
        setTitle("💎 Diamant Caché découvert !");
        setMessage("Un diamant vient d'apparaître sur le site ! Soyez rapide pour le trouver et gagner 0,10€");
        setUrl("/");
        setImageUrl("");
        break;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "live":
        return <Sparkles className="h-4 w-4" />;
      case "new_products":
        return <ShoppingBag className="h-4 w-4" />;
      case "hidden_diamond":
        return <Gem className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "live":
        return "bg-purple-500";
      case "new_products":
        return "bg-blue-500";
      case "hidden_diamond":
        return "bg-amber-500";
      default:
        return "bg-gray-500";
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
        <Bell className="h-8 w-8 text-blue-500" />
        <div>
          <h1 className="text-3xl font-bold">Notifications Web Push</h1>
          <p className="text-muted-foreground">
            Gérez les notifications push envoyées à vos clientes
          </p>
        </div>
      </div>

      {dailyLimit && (
        <Alert className={dailyLimit.can_send ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200"}>
          <Clock className={`h-4 w-4 ${dailyLimit.can_send ? "text-green-600" : "text-orange-600"}`} />
          <AlertDescription>
            {dailyLimit.can_send ? (
              <>
                Vous pouvez encore envoyer <strong>{dailyLimit.remaining}</strong> notification(s) aujourd&apos;hui
                (Limite : {dailyLimit.limit}/jour)
              </>
            ) : (
              <>
                Limite quotidienne atteinte ({dailyLimit.sent_today}/{dailyLimit.limit}).
                Revenez demain pour envoyer de nouvelles notifications.
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Envoyer une Notification</CardTitle>
          <CardDescription>
            Rédigez et envoyez une notification push à toutes vos clientes abonnées
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="type">Type de Notification</Label>
            <Select
              value={notificationType}
              onValueChange={(value) => {
                setNotificationType(value);
                if (value !== "custom") {
                  fillTemplate(value);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Personnalisé</SelectItem>
                <SelectItem value="live">🎥 Lancement Live</SelectItem>
                <SelectItem value="new_products">✨ Nouvelles Pépites</SelectItem>
                <SelectItem value="hidden_diamond">💎 Diamant Caché</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: 🎥 Le Live commence dans 5 minutes !"
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground">
              {title.length}/50 caractères
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ex: Rejoignez-nous pour découvrir nos nouvelles pépites..."
              maxLength={150}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              {message.length}/150 caractères
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">URL de redirection (optionnel)</Label>
            <Input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="/live"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">URL de l&apos;image (optionnel)</Label>
            <Input
              id="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <Button
            onClick={sendNotification}
            disabled={isSending || !dailyLimit?.can_send || !title || !message}
            size="lg"
            className="w-full"
          >
            <Send className="mr-2 h-5 w-5" />
            {isSending ? "Envoi en cours..." : "Envoyer la Notification"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historique des Notifications</CardTitle>
          <CardDescription>
            Les 20 dernières notifications envoyées
          </CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucune notification envoyée pour le moment
            </p>
          ) : (
            <div className="space-y-3">
              {history.map((notif) => (
                <Card key={notif.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getTypeBadgeColor(notif.notification_type)}>
                            {getTypeIcon(notif.notification_type)}
                            <span className="ml-1 capitalize">{notif.notification_type}</span>
                          </Badge>
                          {notif.success ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <h3 className="font-semibold">{notif.title}</h3>
                        <p className="text-sm text-muted-foreground">{notif.message}</p>
                        {notif.url && (
                          <p className="text-xs text-blue-600 mt-1">→ {notif.url}</p>
                        )}
                      </div>
                      <div className="text-right text-sm">
                        <p className="text-muted-foreground">
                          {format(new Date(notif.sent_at), "dd MMM yyyy", { locale: fr })}
                        </p>
                        <p className="text-muted-foreground">
                          {format(new Date(notif.sent_at), "HH:mm")}
                        </p>
                        <p className="font-semibold mt-1">
                          {notif.recipients_count} destinataires
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
