"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';

interface LiveCountdownBannerProps {
  targetDate?: Date;
}

export default function LiveCountdownBanner({ targetDate }: LiveCountdownBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const target = targetDate || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000);
      const difference = target.getTime() - new Date().getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!isVisible) return null;

  return (
    <div className="relative bg-gradient-to-r from-[#b8933d] to-[#d4af37] text-white">
      <div className="container mx-auto px-4 py-3 md:py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4 flex-1">
            <h3 className="text-sm md:text-lg font-semibold whitespace-nowrap">
              Prochain live dans
            </h3>

            <div className="flex items-center gap-2 md:gap-3">
              <div className="flex flex-col items-center">
                <div className="text-xl md:text-3xl font-bold leading-none">
                  {String(timeLeft.days).padStart(2, '0')}
                </div>
                <div className="text-[10px] md:text-xs opacity-90">Jours</div>
              </div>
              <div className="text-xl md:text-3xl font-bold">|</div>
              <div className="flex flex-col items-center">
                <div className="text-xl md:text-3xl font-bold leading-none">
                  {String(timeLeft.hours).padStart(2, '0')}
                </div>
                <div className="text-[10px] md:text-xs opacity-90">Heures</div>
              </div>
              <div className="text-xl md:text-3xl font-bold">|</div>
              <div className="flex flex-col items-center">
                <div className="text-xl md:text-3xl font-bold leading-none">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </div>
                <div className="text-[10px] md:text-xs opacity-90">Minutes</div>
              </div>
              <div className="text-xl md:text-3xl font-bold">|</div>
              <div className="flex flex-col items-center">
                <div className="text-xl md:text-3xl font-bold leading-none">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </div>
                <div className="text-[10px] md:text-xs opacity-90">Secondes</div>
              </div>
            </div>

            <Link
              href="/live"
              className="hidden md:block bg-black hover:bg-gray-900 text-white px-6 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap"
            >
              Voir les lives précédents
            </Link>
          </div>

          <button
            onClick={() => setIsVisible(false)}
            className="flex-shrink-0 hover:bg-white/20 p-1 rounded transition-colors"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <Link
          href="/live"
          className="md:hidden block text-center bg-black hover:bg-gray-900 text-white px-4 py-2 rounded-full text-xs font-medium transition-colors mt-3"
        >
          Voir les lives précédents
        </Link>
      </div>
    </div>
  );
}
