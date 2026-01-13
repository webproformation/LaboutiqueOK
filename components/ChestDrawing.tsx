'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Gift, Trophy, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface ChestDrawingProps {
  liveStreamId: string;
  isUnlocked: boolean;
  isAdmin: boolean;
}

export function ChestDrawing({ liveStreamId, isUnlocked, isAdmin }: ChestDrawingProps) {
  const { profile } = useAuth();
  const [isDrawing, setIsDrawing] = useState(false);
  const [winner, setWinner] = useState<any>(null);
  const [showWinner, setShowWinner] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);

  useEffect(() => {
    if (isUnlocked) {
      loadParticipants();
    }
  }, [isUnlocked]);

  async function loadParticipants() {
    const { data } = await supabase
      .from('live_viewers')
      .select(`
        user_id,
        profiles (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('live_stream_id', liveStreamId)
      .eq('is_active', true);

    if (data) {
      setParticipants(data.filter(p => p.profiles));
    }
  }

  async function startDrawing() {
    if (participants.length === 0) {
      toast.error('Aucun participant actif');
      return;
    }

    setIsDrawing(true);

    const animationDuration = 3000;
    const intervalDuration = 100;
    const iterations = animationDuration / intervalDuration;
    let count = 0;

    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * participants.length);
      setWinner(participants[randomIndex]);
      count++;

      if (count >= iterations) {
        clearInterval(interval);
        finalizeWinner(participants[randomIndex]);
      }
    }, intervalDuration);
  }

  async function finalizeWinner(selectedWinner: any) {
    setIsDrawing(false);
    setShowWinner(true);

    const { error } = await supabase
      .from('live_streams')
      .update({
        winner_user_id: selectedWinner.user_id,
        winner_announced_at: new Date().toISOString()
      })
      .eq('id', liveStreamId);

    if (error) {
      console.error('Error saving winner:', error);
      toast.error('Erreur lors de l\'enregistrement du gagnant');
    } else {
      toast.success('Gagnant annoncé !');
    }
  }

  if (!isUnlocked) {
    return (
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-8 text-center">
        <div className="mb-4">
          <Gift className="w-16 h-16 mx-auto text-gray-600" />
        </div>
        <h3 className="text-white font-bold text-xl mb-2">
          Coffre de Morgane
        </h3>
        <p className="text-gray-400">
          Le coffre est verrouillé... Pour le moment ! 🔒
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gradient-to-br from-[#D4AF37] to-[#b8933d] rounded-xl p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

        <div className="relative z-10">
          <div className="mb-4 animate-bounce">
            <Gift className="w-20 h-20 mx-auto text-white drop-shadow-lg" />
          </div>

          <h3 className="text-white font-bold text-2xl mb-2 drop-shadow-lg">
            ✨ Coffre Déverrouillé ! ✨
          </h3>

          <p className="text-white/90 mb-6">
            {participants.length} Copinettes participent au tirage
          </p>

          {isAdmin && (
            <Button
              onClick={startDrawing}
              disabled={isDrawing || participants.length === 0}
              size="lg"
              className="bg-white text-[#D4AF37] hover:bg-gray-100 font-bold shadow-xl transform hover:scale-105 transition-transform"
            >
              {isDrawing ? (
                <>
                  <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                  Tirage en cours...
                </>
              ) : (
                <>
                  <Trophy className="w-5 h-5 mr-2" />
                  Lancer le Tirage au Sort
                </>
              )}
            </Button>
          )}

          {!isAdmin && (
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <p className="text-white font-semibold">
                {profile?.first_name}, tu participes automatiquement ! 🍀
              </p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={showWinner} onOpenChange={setShowWinner}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">
              🎉 Et la gagnante est...
            </DialogTitle>
          </DialogHeader>

          <div className="py-8 text-center">
            <div className="mb-6">
              <Trophy className="w-20 h-20 mx-auto text-[#D4AF37] animate-bounce" />
            </div>

            <h2 className="text-4xl font-bold text-[#D4AF37] mb-4">
              {winner?.profiles?.first_name} {winner?.profiles?.last_name}
            </h2>

            <p className="text-gray-600 mb-6">
              Félicitations ! 🎊
            </p>

            <div className="bg-gradient-to-r from-[#D4AF37]/10 to-[#b8933d]/10 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                Morgane va te contacter pour te remettre ton cadeau ! 💝
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {isDrawing && winner && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center">
            <Sparkles className="w-16 h-16 text-[#D4AF37] mx-auto mb-6 animate-spin" />
            <h2 className="text-6xl font-bold text-white animate-pulse">
              {winner.profiles?.first_name} {winner.profiles?.last_name}
            </h2>
          </div>
        </div>
      )}
    </>
  );
}
