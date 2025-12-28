'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/context/AuthContext';
import confetti from 'canvas-confetti';
import { Gift, Loader2, X, Sparkles, Trophy } from 'lucide-react';

interface WheelZone {
  id: string;
  type: 'winning' | 'losing';
  label: string;
  color: string;
  couponTypeId?: string;
  message?: string;
}

interface WheelGameSettings {
  id: string;
  is_enabled: boolean;
  require_newsletter: boolean;
  require_authentication: boolean;
  popup_delay_seconds: number;
  max_plays_per_day: number;
  max_plays_per_user: number;
  winning_zones: any[];
  losing_zones: any[];
}

interface WheelGameProps {
  onClose: () => void;
}

export default function WheelGame({ onClose }: WheelGameProps) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<WheelGameSettings | null>(null);
  const [zones, setZones] = useState<WheelZone[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [canPlay, setCanPlay] = useState(false);
  const [playsToday, setPlaysToday] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random()}`);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSettings();
  }, [user]);

  useEffect(() => {
    if (settings) {
      checkPlaysToday();
    }
  }, [settings, user]);

  useEffect(() => {
    if (zones.length > 0) {
      drawWheel();
    }
  }, [zones, rotation]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('wheel_game_settings')
        .select('*')
        .eq('is_enabled', true)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings(data);
        buildZones(data);
      }
    } catch (error) {
      console.error('Error loading wheel settings:', error);
    }
  };

  const buildZones = async (settings: WheelGameSettings) => {
    const allZones: WheelZone[] = [];
    const colors = [
      '#b8933d', '#2d2d2d', '#f5f5dc', '#d4af37', '#8b7355',
      '#c9a961', '#1a1a1a', '#e8d5b7', '#a0826d', '#bfa568'
    ];

    for (let i = 0; i < settings.winning_zones.length; i++) {
      const zone = settings.winning_zones[i];
      if (zone.coupon_type_id) {
        const { data: couponType } = await supabase
          .from('coupon_types')
          .select('*')
          .eq('id', zone.coupon_type_id)
          .maybeSingle();

        if (couponType) {
          allZones.push({
            id: `win_${i}`,
            type: 'winning',
            label: couponType.description,
            color: colors[allZones.length % colors.length],
            couponTypeId: zone.coupon_type_id
          });
        }
      }
    }

    for (let i = 0; i < settings.losing_zones.length; i++) {
      const zone = settings.losing_zones[i];
      allZones.push({
        id: `lose_${i}`,
        type: 'losing',
        label: 'Perdu',
        color: colors[allZones.length % colors.length],
        message: zone.message
      });
    }

    setZones(allZones);
  };

  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas || zones.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;
    const anglePerZone = (2 * Math.PI) / zones.length;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 10;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 10, 0, 2 * Math.PI);
    ctx.fillStyle = '#000';
    ctx.fill();

    ctx.restore();

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-centerX, -centerY);

    zones.forEach((zone, index) => {
      const startAngle = index * anglePerZone - Math.PI / 2;
      const endAngle = startAngle + anglePerZone;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();

      const gradient = ctx.createRadialGradient(centerX, centerY, radius * 0.3, centerX, centerY, radius);
      gradient.addColorStop(0, zone.color);
      gradient.addColorStop(1, darkenColor(zone.color, 30));
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + anglePerZone / 2);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px Arial';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 4;

      const words = zone.label.split(' ');
      if (words.length > 2) {
        ctx.font = 'bold 13px Arial';
        words.forEach((word, i) => {
          ctx.fillText(word, radius * 0.7, -10 + i * 16);
        });
      } else if (words.length > 1) {
        words.forEach((word, i) => {
          ctx.fillText(word, radius * 0.7, -8 + i * 18);
        });
      } else {
        ctx.fillText(zone.label, radius * 0.7, 5);
      }

      ctx.restore();
    });

    ctx.restore();
  };

  const darkenColor = (color: string, percent: number) => {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255))
      .toString(16).slice(1);
  };

  const checkPlaysToday = async () => {
    if (!settings) {
      setCanPlay(false);
      return;
    }

    try {
      let canPlayNow = true;

      if (user) {
        if (settings.max_plays_per_user > 0) {
          const { count: totalPlays } = await supabase
            .from('wheel_game_plays')
            .select('*', { count: 'exact' })
            .eq('user_id', user.id);

          if (totalPlays && totalPlays >= settings.max_plays_per_user) {
            canPlayNow = false;
          }
        }

        if (canPlayNow && settings.max_plays_per_day > 0) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const { count } = await supabase
            .from('wheel_game_plays')
            .select('*', { count: 'exact' })
            .eq('user_id', user.id)
            .gte('created_at', today.toISOString());

          const todayCount = count || 0;
          setPlaysToday(todayCount);

          if (todayCount >= settings.max_plays_per_day) {
            canPlayNow = false;
          }
        } else if (settings.max_plays_per_day === 0) {
          setPlaysToday(0);
        }
      } else {
        if (settings.max_plays_per_day > 0) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const { count } = await supabase
            .from('wheel_game_plays')
            .select('*', { count: 'exact' })
            .eq('session_id', sessionId)
            .gte('created_at', today.toISOString());

          const todayCount = count || 0;
          setPlaysToday(todayCount);

          if (todayCount >= settings.max_plays_per_day) {
            canPlayNow = false;
          }
        } else if (settings.max_plays_per_day === 0) {
          setPlaysToday(0);
        }
      }

      setCanPlay(canPlayNow);
    } catch (error) {
      console.error('Error checking plays:', error);
      setCanPlay(false);
    }
  };

  const spinWheel = async () => {
    if (!settings || !canPlay || isSpinning || zones.length === 0) return;

    if (settings.require_authentication && !user) {
      alert('Vous devez être connecté pour jouer');
      return;
    }

    setIsSpinning(true);

    const winningProbabilities: number[] = [];
    const losingProbabilities: number[] = [];

    settings.winning_zones.forEach((zone: any) => {
      winningProbabilities.push(zone.probability || 0);
    });

    settings.losing_zones.forEach((zone: any) => {
      losingProbabilities.push(zone.probability || 0);
    });

    const totalWinProb = winningProbabilities.reduce((a, b) => a + b, 0);
    const totalLoseProb = losingProbabilities.reduce((a, b) => a + b, 0);
    const totalProb = totalWinProb + totalLoseProb;

    const random = Math.random() * totalProb;
    let cumulative = 0;
    let selectedZoneIndex = 0;
    let won = false;

    for (let i = 0; i < settings.winning_zones.length; i++) {
      cumulative += settings.winning_zones[i].probability || 0;
      if (random <= cumulative) {
        selectedZoneIndex = i;
        won = true;
        break;
      }
    }

    if (!won) {
      cumulative = totalWinProb;
      for (let i = 0; i < settings.losing_zones.length; i++) {
        cumulative += settings.losing_zones[i].probability || 0;
        if (random <= cumulative) {
          selectedZoneIndex = settings.winning_zones.length + i;
          break;
        }
      }
    }

    const anglePerZone = 360 / zones.length;
    const targetAngle = selectedZoneIndex * anglePerZone;
    const spins = 5;
    const finalRotation = 360 * spins + (360 - targetAngle) + anglePerZone / 2;

    let currentRotation = rotation;
    const duration = 5000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);

      currentRotation = rotation + finalRotation * easeOut;
      setRotation(currentRotation % 360);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        handleSpinComplete(selectedZoneIndex, won);
      }
    };

    animate();
  };

  const handleSpinComplete = async (zoneIndex: number, won: boolean) => {
    const selectedZone = zones[zoneIndex];
    let userCouponId = null;

    if (won && selectedZone.couponTypeId && user) {
      const couponCode = `WHEEL_${Date.now()}_${Math.random().toString(36).substring(7)}`.toUpperCase();

      const { data: couponType } = await supabase
        .from('coupon_types')
        .select('*')
        .eq('id', selectedZone.couponTypeId)
        .single();

      if (couponType) {
        const { data: newCoupon } = await supabase
          .from('user_coupons')
          .insert({
            user_id: user.id,
            coupon_type_id: selectedZone.couponTypeId,
            code: couponCode,
            source: 'wheel_game',
            valid_until: couponType.valid_until
          })
          .select()
          .single();

        if (newCoupon) {
          userCouponId = newCoupon.id;
        }
      }
    }

    await supabase.from('wheel_game_plays').insert({
      user_id: user?.id || null,
      session_id: !user ? sessionId : null,
      won,
      prize_type: won ? 'coupon' : 'none',
      coupon_type_id: won ? selectedZone.couponTypeId : null,
      user_coupon_id: userCouponId,
      zone_index: zoneIndex
    });

    setResult({
      won,
      zone: selectedZone,
      message: won ? `Félicitations ! Vous avez gagné : ${selectedZone.label}` : selectedZone.message
    });

    setShowResult(true);
    setIsSpinning(false);
    await checkPlaysToday();

    if (won) {
      confetti({
        particleCount: 200,
        spread: 160,
        origin: { y: 0.5 },
        colors: ['#FFD700', '#FFA500', '#FF6347', '#FF1493', '#9370DB']
      });

      const interval = setInterval(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 }
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 }
        });
      }, 250);

      setTimeout(() => clearInterval(interval), 3000);
    }
  };

  const remainingPlays = settings
    ? settings.max_plays_per_day === 0
      ? Infinity
      : settings.max_plays_per_day - playsToday
    : 0;

  if (showResult) {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl p-6 md:p-12 relative bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 md:top-4 md:right-4 text-gray-500 hover:text-gray-700 z-10"
          >
            <X className="w-5 h-5 md:w-6 md:h-6" />
          </button>

          <div className="text-center">
            {result?.won ? (
              <>
                <Trophy className="w-16 h-16 md:w-24 md:h-24 mx-auto mb-4 md:mb-6 text-yellow-500 animate-bounce" />
                <h2 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 bg-clip-text text-transparent mb-3 md:mb-4">
                  FÉLICITATIONS !
                </h2>
                <div className="bg-green-100 border-2 border-green-400 rounded-lg p-4 md:p-6 mb-4">
                  <p className="text-lg md:text-2xl text-green-800 font-bold mb-2">
                    {result.zone.label}
                  </p>
                  {user ? (
                    <p className="text-sm md:text-base text-green-700">
                      Votre coupon est disponible dans votre compte, section &quot;Mes Coupons&quot;
                    </p>
                  ) : (
                    <p className="text-sm md:text-base text-green-700">
                      Connectez-vous pour récupérer votre gain !
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <Sparkles className="w-16 h-16 md:w-24 md:h-24 mx-auto mb-4 md:mb-6 text-gray-500" />
                <h2 className="text-3xl md:text-5xl font-bold text-gray-700 mb-3 md:mb-4">
                  Dommage !
                </h2>
                <div className="bg-gray-100 border-2 border-gray-400 rounded-lg p-4 md:p-6 mb-4">
                  <p className="text-lg md:text-2xl text-gray-700">
                    {result.message || 'Ce n\'est pas grave, retentez votre chance !'}
                  </p>
                </div>
              </>
            )}
            <Button
              onClick={onClose}
              size="lg"
              className="text-base md:text-xl px-8 md:px-12 py-4 md:py-6 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
            >
              Fermer
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 md:p-4">
      <Card className="w-full max-w-4xl p-4 md:p-8 relative bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 md:top-4 md:right-4 text-gray-500 hover:text-gray-700 z-10"
        >
          <X className="w-5 h-5 md:w-6 md:h-6" />
        </button>

        <div className="text-center mb-4 md:mb-8">
          <div className="flex items-center justify-center mb-3 md:mb-4">
            <Sparkles className="w-8 h-8 md:w-12 md:h-12 text-yellow-500 animate-pulse" />
            <Gift className="w-10 h-10 md:w-16 md:h-16 text-pink-500 mx-2 md:mx-4" />
            <Sparkles className="w-8 h-8 md:w-12 md:h-12 text-yellow-500 animate-pulse" />
          </div>
          <h2 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-1 md:mb-2">
            Roue de la Fortune
          </h2>
          <p className="text-sm md:text-lg text-gray-700">Tournez la roue et tentez de gagner !</p>
          {settings && settings.max_plays_per_day > 0 && (
            <p className="text-xs md:text-sm text-gray-500 mt-1 md:mt-2">
              Tentatives restantes aujourd&apos;hui : {remainingPlays === Infinity ? '∞' : remainingPlays}
            </p>
          )}
        </div>

        <div className="relative flex justify-center items-center mb-6 md:mb-8">
          <div className="relative" style={{ width: '100%', maxWidth: '400px', aspectRatio: '1' }}>
            <div
              ref={wheelRef}
              className="relative w-full h-full"
            >
              <canvas
                ref={canvasRef}
                width={400}
                height={400}
                className="w-full h-full drop-shadow-2xl rounded-full"
              />

              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 z-10">
                <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[40px] border-t-red-500 drop-shadow-xl" />
              </div>

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg flex items-center justify-center border-4 border-white">
                  <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center space-y-3 md:space-y-4">
          <Button
            onClick={spinWheel}
            disabled={!canPlay || isSpinning || zones.length === 0}
            size="lg"
            className="w-full max-w-md text-base md:text-xl px-6 md:px-12 py-4 md:py-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            {isSpinning ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 md:h-6 md:w-6 animate-spin" />
                La roue tourne...
              </>
            ) : (
              <>
                <Gift className="mr-2 h-5 w-5 md:h-6 md:w-6" />
                Tourner la roue
              </>
            )}
          </Button>

          {!canPlay && settings && settings.max_plays_per_day > 0 && (
            <div className="bg-amber-100 border-2 border-amber-400 rounded-lg p-3 md:p-4">
              <p className="text-sm md:text-base text-amber-800 font-medium">
                Vous avez atteint le nombre maximum de tentatives pour aujourd&apos;hui
              </p>
              <p className="text-xs md:text-sm text-amber-700 mt-1">
                Revenez demain pour retenter votre chance !
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}