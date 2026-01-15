'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Diamond } from 'lucide-react';
import { Fireworks } from './Fireworks';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface HiddenDiamond {
  diamond_id: string;
  location: string;
  page_url: string;
  element_selector: string;
  reward_amount: number;
}

interface HiddenDiamondDetectorProps {
  currentPage: string;
  currentLocation: string;
}

export function HiddenDiamondDetector({ currentPage, currentLocation }: HiddenDiamondDetectorProps) {
  const { user } = useAuth();
  const [diamonds, setDiamonds] = useState<HiddenDiamond[]>([]);
  const [showReward, setShowReward] = useState(false);
  const [rewardAmount, setRewardAmount] = useState(0);
  const [rewardMessage, setRewardMessage] = useState('');

  useEffect(() => {
    if (user) {
      loadVisibleDiamonds();
    }
  }, [user, currentPage]);

  const loadVisibleDiamonds = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .rpc('get_visible_diamonds_for_user', {
          p_user_id: user.id
        });

      if (error) throw error;

      const pageDiamonds = (data || []).filter(
        (d: HiddenDiamond) =>
          d.page_url === currentPage || d.location === currentLocation
      );

      setDiamonds(pageDiamonds);
    } catch (error) {
      console.error('Error loading diamonds:', error);
    }
  };

  const handleDiamondClick = async (diamondId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('add_loyalty_gain', {
        p_user_id: user.id,
        p_type: 'diamond_found',
        p_base_amount: 0.10,
        p_description: 'Diamant caché découvert'
      });

      if (error) throw error;

      if (data) {
        const result = typeof data === 'string' ? JSON.parse(data) : data;
        const finalAmount = (0.10 * result.multiplier).toFixed(2);
        const multiplierText = result.multiplier > 1 ? ` (Gains x${result.multiplier} !)` : '';

        setRewardAmount(parseFloat(finalAmount));
        setRewardMessage(`Vous avez trouvé un diamant caché !${multiplierText}`);
        setShowReward(true);

        setDiamonds(prev => prev.filter(d => d.diamond_id !== diamondId));

        window.dispatchEvent(new Event('loyaltyUpdated'));
      }
    } catch (error) {
      console.error('Error discovering diamond:', error);
    }
  };

  if (!user || diamonds.length === 0) return null;

  return (
    <>
      {diamonds.map((diamond) => (
        <DiamondButton
          key={diamond.diamond_id}
          diamond={diamond}
          onClick={() => handleDiamondClick(diamond.diamond_id)}
        />
      ))}

      <Dialog open={showReward} onOpenChange={setShowReward}>
        <DialogContent className="sm:max-w-md">
          {showReward && <Fireworks active={showReward} />}
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#C6A15B] to-[#D4AF37] flex items-center justify-center animate-bounce">
                <Diamond className="h-10 w-10 text-white fill-white" />
              </div>
            </div>
            <DialogTitle className="text-center text-2xl">
              Félicitations !
            </DialogTitle>
            <DialogDescription className="text-center text-lg pt-4">
              {rewardMessage}
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-4">
            <div className="text-4xl font-bold text-[#C6A15B]">
              +{rewardAmount.toFixed(2)}€
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Ajouté à votre cagnotte de fidélité
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface DiamondButtonProps {
  diamond: HiddenDiamond;
  onClick: () => void;
}

function DiamondButton({ diamond, onClick }: DiamondButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed z-50 animate-pulse hover:scale-125 transition-transform duration-300"
      style={{
        top: '50%',
        right: '20px',
        transform: 'translateY(-50%)',
      }}
      title="Diamant caché ! Cliquez pour gagner 0,10€"
    >
      <div className="relative">
        <Diamond className="h-8 w-8 text-[#D4AF37] fill-[#D4AF37] drop-shadow-[0_0_10px_rgba(212,175,55,0.8)]" />
        <div className="absolute inset-0 animate-ping">
          <Diamond className="h-8 w-8 text-[#D4AF37] fill-[#D4AF37] opacity-75" />
        </div>
      </div>
    </button>
  );
}
