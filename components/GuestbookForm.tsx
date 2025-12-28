"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Gem, Upload, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface GuestbookFormProps {
  orderId: string;
  orderNumber: string;
  onSuccess?: () => void;
}

export function GuestbookForm({ orderId, orderNumber, onSuccess }: GuestbookFormProps) {
  const { user, profile } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [rgpdConsent, setRgpdConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("La photo doit faire moins de 5 Mo");
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("Veuillez sélectionner une image valide");
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Vous devez être connectée pour signer le livre d'or");
      return;
    }

    if (rating === 0) {
      toast.error("Veuillez sélectionner une notation");
      return;
    }

    if (message.trim().length < 10) {
      toast.error("Votre message doit contenir au moins 10 caractères");
      return;
    }

    if (!rgpdConsent) {
      toast.error("Vous devez accepter que votre message soit publié");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();

      let photoUrl = null;

      if (photoFile) {
        const formData = new FormData();
        formData.append("file", photoFile);
        formData.append("title", `Livre d'or - ${profile?.first_name || "Cliente"} - ${orderNumber}`);
        formData.append("alt_text", `Photo de ${profile?.first_name || "Cliente"} pour le livre d'or`);

        const uploadResponse = await fetch("/api/wordpress/upload-media", {
          method: "POST",
          body: formData,
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          photoUrl = uploadData.source_url;
        } else {
          throw new Error("Erreur lors de l'upload de la photo");
        }
      }

      const customerName = profile?.first_name && profile?.last_name
        ? `${profile.first_name} ${profile.last_name}`
        : profile?.first_name || "Cliente";

      const { error } = await supabase.from("guestbook_entries").insert({
        user_id: user.id,
        order_id: orderId,
        order_number: orderNumber,
        customer_name: customerName,
        rating,
        message: message.trim(),
        photo_url: photoUrl,
        rgpd_consent: rgpdConsent,
        reward_amount: 0.20,
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("Vous avez déjà signé le livre d'or pour cette commande");
        } else {
          throw error;
        }
      } else {
        toast.success(
          "Merci pour votre mot doux ! Il sera publié après vérification (48-72h). Votre récompense sera créditée dès validation.",
          { duration: 6000 }
        );
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      console.error("Error submitting guestbook entry:", error);
      toast.error("Une erreur est survenue lors de l'envoi de votre message");
    } finally {
      setIsSubmitting(false);
    }
  };

  const customerName = profile?.first_name && profile?.last_name
    ? `${profile.first_name} ${profile.last_name}`
    : profile?.first_name || "Cliente";

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gem className="h-6 w-6 text-amber-500" />
          Signer le Livre d&apos;Or
        </CardTitle>
        <CardDescription>
          Partagez votre expérience et gagnez 0,20 € dans votre cagnotte !
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label className="text-sm font-medium">Votre nom</Label>
            <p className="text-base font-semibold mt-1">{customerName}</p>
            <p className="text-xs text-muted-foreground">Commande n°{orderNumber}</p>
          </div>

          <div>
            <Label className="text-sm font-medium mb-3 block">
              Notation en Pépites d&apos;Or (de 1 à 5)
            </Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  onMouseEnter={() => setHoverRating(value)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-all duration-200 transform hover:scale-110"
                >
                  <Gem
                    className={`h-10 w-10 transition-colors ${
                      value <= (hoverRating || rating)
                        ? "fill-amber-500 text-amber-500"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                {rating === 5 && "Extraordinaire ! 💎"}
                {rating === 4 && "Excellent ! ✨"}
                {rating === 3 && "Très bien ! 🌟"}
                {rating === 2 && "Bien 👍"}
                {rating === 1 && "Correct"}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="message" className="text-sm font-medium">
              Votre message (max 500 caractères)
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={500}
              rows={5}
              placeholder="Partagez votre expérience avec nous..."
              className="mt-2 resize-none"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              {message.length}/500 caractères
            </p>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">
              Ajoutez une photo (optionnel)
            </Label>
            {!photoPreview ? (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Cliquez pour ajouter une photo
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG (max. 5 Mo)</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handlePhotoChange}
                />
              </label>
            ) : (
              <div className="relative">
                <img
                  src={photoPreview}
                  alt="Aperçu"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-start space-x-3 p-4 bg-accent/30 rounded-lg">
            <Checkbox
              id="rgpd"
              checked={rgpdConsent}
              onCheckedChange={(checked) => setRgpdConsent(checked === true)}
              required
            />
            <Label
              htmlFor="rgpd"
              className="text-sm leading-relaxed cursor-pointer"
            >
              J&apos;accepte que mon message et ma photo soient publiés sur le Livre d&apos;Or de
              la boutique. Je peux demander la modification ou la suppression de mon avis à
              tout moment via le formulaire de contact.
            </Label>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>À savoir :</strong> Pour garantir l&apos;authenticité du Livre d&apos;Or, votre message
              sera publié après une vérification anti-spam (48-72h). Votre récompense de 0,20 € sera créditée automatiquement après validation par notre équipe.
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || rating === 0 || message.trim().length < 10 || !rgpdConsent}
          >
            {isSubmitting ? "Envoi en cours..." : "Envoyer mon mot doux"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
