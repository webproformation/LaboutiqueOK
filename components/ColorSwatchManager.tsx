"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProductMediaSelector } from "@/components/product-media-selector";
import { extractDominantColor } from "@/lib/color-extractor";
import { Wand2, Image as ImageIcon, Palette, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ColorSwatchManagerProps {
  termId: string;
  termName: string;
  currentColorCode: string | null;
  currentColorFamily: string | null;
  currentSwatchType: string | null;
  currentSwatchImage: string | null;
  onUpdate: () => void;
}

const COLOR_FAMILIES = [
  "Blanc",
  "Noir",
  "Gris",
  "Beige",
  "Marron",
  "Rouge",
  "Rose",
  "Orange",
  "Jaune",
  "Vert",
  "Bleu",
  "Violet",
  "Multicolore",
  "Métallisé",
  "Autre"
];

export function ColorSwatchManager({
  termId,
  termName,
  currentColorCode,
  currentColorFamily,
  currentSwatchType,
  currentSwatchImage,
  onUpdate,
}: ColorSwatchManagerProps) {
  const [colorCode, setColorCode] = useState(currentColorCode || "#000000");
  const [colorFamily, setColorFamily] = useState(currentColorFamily || "Autre");
  const [swatchType, setSwatchType] = useState(currentSwatchType || "color");
  const [swatchImage, setSwatchImage] = useState(currentSwatchImage || "");
  const [isExtracting, setIsExtracting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    setColorCode(currentColorCode || "#000000");
    setColorFamily(currentColorFamily || "Autre");
    setSwatchType(currentSwatchType || "color");
    setSwatchImage(currentSwatchImage || "");
  }, [currentColorCode, currentColorFamily, currentSwatchType, currentSwatchImage]);

  const handleExtractColor = async () => {
    if (!swatchImage) {
      toast.error("Veuillez d'abord sélectionner une image");
      return;
    }

    setIsExtracting(true);
    try {
      const dominantColor = await extractDominantColor(swatchImage);
      setColorCode(dominantColor);
      toast.success("Couleur dominante extraite avec succès");
    } catch (error) {
      console.error("Error extracting color:", error);
      toast.error("Erreur lors de l'extraction de la couleur");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSave = async () => {
    try {
      const { error: updateError } = await supabase
        .from("product_attribute_terms")
        .update({
          color_code: colorCode,
          color_family: colorFamily,
          swatch_type: swatchType,
          swatch_image: swatchType === "image" ? swatchImage : null,
        })
        .eq("id", termId);

      if (updateError) throw updateError;

      const { data: mapping } = await supabase
        .from("color_family_mappings")
        .select("id")
        .eq("color_term_id", termId)
        .maybeSingle();

      if (mapping) {
        await supabase
          .from("color_family_mappings")
          .update({
            suggested_family: colorFamily,
            confirmed: true,
          })
          .eq("color_term_id", termId);
      } else {
        await supabase
          .from("color_family_mappings")
          .insert({
            color_term_id: termId,
            suggested_family: colorFamily,
            confirmed: true,
          });
      }

      toast.success("Swatch mis à jour avec succès");
      onUpdate();
    } catch (error: any) {
      console.error("Error saving swatch:", error);
      toast.error(error.message || "Erreur lors de la sauvegarde");
    }
  };

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
          <Palette className="h-5 w-5 text-[#C6A15B]" />
          Configuration avancée : {termName}
        </h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? "Masquer" : "Afficher"}
        </Button>
      </div>

      {showAdvanced && (
        <div className="space-y-4 pt-4 border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <Label>Famille de couleur *</Label>
                <p className="text-xs text-gray-500 mb-2">
                  Utilisée pour regrouper les couleurs dans les filtres
                </p>
                <Select value={colorFamily} onValueChange={setColorFamily}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COLOR_FAMILIES.map((family) => (
                      <SelectItem key={family} value={family}>
                        {family}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Type de pastille</Label>
                <Select value={swatchType} onValueChange={setSwatchType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="color">Couleur unie</SelectItem>
                    <SelectItem value="image">Image texture</SelectItem>
                    <SelectItem value="texture">Texture/Motif</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Code couleur</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={colorCode}
                    onChange={(e) => setColorCode(e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    value={colorCode}
                    onChange={(e) => setColorCode(e.target.value)}
                    placeholder="#000000"
                    className="flex-1 font-mono"
                  />
                </div>
              </div>
            </div>

            {swatchType === "image" && (
              <div className="space-y-3">
                <div>
                  <Label>Image de la pastille</Label>
                  <p className="text-xs text-gray-500 mb-2">
                    Cette image sera utilisée comme pastille visuelle
                  </p>
                  <ProductMediaSelector
                    currentImageUrl={swatchImage}
                    onSelect={(url) => setSwatchImage(url)}
                  />
                </div>

                {swatchImage && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleExtractColor}
                    disabled={isExtracting}
                    className="w-full"
                  >
                    {isExtracting ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full mr-2" />
                        Extraction en cours...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4 mr-2" />
                        Extraire la couleur dominante
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <Label className="mb-3 block">Aperçu de la pastille</Label>
            <div className="flex items-center gap-4">
              {swatchType === "image" && swatchImage ? (
                <div className="relative">
                  <img
                    src={swatchImage}
                    alt={termName}
                    className="w-16 h-16 rounded-full border-2 border-gray-300 object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-white drop-shadow-lg" />
                  </div>
                </div>
              ) : (
                <div
                  className="w-16 h-16 rounded-full border-2 border-gray-300"
                  style={{ backgroundColor: colorCode }}
                />
              )}
              <div className="flex-1">
                <p className="font-medium text-gray-900">{termName}</p>
                <p className="text-sm text-gray-500">Famille : {colorFamily}</p>
                <p className="text-xs text-gray-400 font-mono">{colorCode}</p>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">À quoi sert la famille de couleur ?</p>
              <p>
                Dans le filtre latéral, les clientes verront "Vert" au lieu de voir séparément
                "Vert Canard", "Vert Sapin", "Vert Olive", etc. Cela simplifie la navigation.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              onClick={handleSave}
              className="bg-gradient-to-r from-[#C6A15B] to-[#b8933d] hover:from-[#b8933d] hover:to-[#a88230]"
            >
              <Check className="h-4 w-4 mr-2" />
              Enregistrer les modifications
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
