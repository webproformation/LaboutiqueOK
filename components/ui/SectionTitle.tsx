import { LucideIcon } from 'lucide-react';

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  className?: string;
}

export function SectionTitle({ title, subtitle, icon: Icon, className = '' }: SectionTitleProps) {
  return (
    <div className={`flex flex-col items-center justify-center mb-10 text-center ${className}`}>
      <div className="flex items-center gap-4">
        {/* Icone de gauche - Affinée avec strokeWidth={1.5} */}
        {Icon && (
          <Icon 
            className="w-6 h-6 md:w-8 md:h-8 text-[#D4AF37]" 
            strokeWidth={1.5} 
          />
        )}
        
        <h2 className="text-3xl md:text-4xl font-bold text-[#D4AF37] font-display uppercase tracking-wider">
          {title}
        </h2>

        {/* Icone de droite - Affinée avec strokeWidth={1.5} */}
        {Icon && (
          <Icon 
            className="w-6 h-6 md:w-8 md:h-8 text-[#D4AF37]" 
            strokeWidth={1.5} 
          />
        )}
      </div>
      
      {subtitle && (
        <div className="mt-3 flex flex-col items-center">
          <div className="w-12 h-0.5 bg-[#D4AF37]/30 mb-3 rounded-full" />
          <p className="text-gray-500 max-w-2xl mx-auto italic">
            {subtitle}
          </p>
        </div>
      )}
    </div>
  );
}