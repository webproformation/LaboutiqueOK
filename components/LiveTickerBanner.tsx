'use client';

interface LiveTickerBannerProps {
  text: string;
}

export function LiveTickerBanner({ text }: LiveTickerBannerProps) {
  return (
    <div className="bg-gradient-to-r from-[#D4AF37] to-[#b8933d] py-3 overflow-hidden border-y-2 border-[#FFD700]">
      <div className="animate-ticker whitespace-nowrap">
        <span className="inline-block px-8 text-white font-semibold text-lg">
          ✨ {text} ✨
        </span>
        <span className="inline-block px-8 text-white font-semibold text-lg">
          ✨ {text} ✨
        </span>
        <span className="inline-block px-8 text-white font-semibold text-lg">
          ✨ {text} ✨
        </span>
        <span className="inline-block px-8 text-white font-semibold text-lg">
          ✨ {text} ✨
        </span>
      </div>
    </div>
  );
}
