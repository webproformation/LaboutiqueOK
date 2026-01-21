import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

export function useAutoSave<T>(key: string, data: T, onLoad: (data: T) => void) {
  const loadedRef = useRef(false);

  // 1. Au chargement de la page : On regarde s'il y a un brouillon sauvé
  useEffect(() => {
    if (loadedRef.current) return;
    
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        // On vérifie que ce n'est pas vide
        if (parsed && Object.keys(parsed).length > 0) {
          onLoad(parsed);
          toast.success("Brouillon restauré !", {
            description: "Nous avons récupéré votre travail non sauvegardé.",
            duration: 5000,
          });
        }
      }
    } catch (e) {
      console.error("Erreur lecture auto-save", e);
    }
    loadedRef.current = true;
  }, [key]); // Ne dépend que de la clé

  // 2. À chaque modification : On sauvegarde (avec un délai de 1s pour pas spammer)
  useEffect(() => {
    if (!loadedRef.current) return; // Pas de sauvegarde pendant le chargement initial

    const timer = setTimeout(() => {
      localStorage.setItem(key, JSON.stringify(data));
      // Optionnel : petit indicateur visuel dans la console
      console.log("Auto-save effectué"); 
    }, 1000);

    return () => clearTimeout(timer);
  }, [data, key]);

  // 3. Fonction pour nettoyer après une VRAIE sauvegarde réussie
  const clearSavedData = () => {
    localStorage.removeItem(key);
  };

  return { clearSavedData };
}