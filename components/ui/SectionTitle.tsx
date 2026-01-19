import { LucideIcon } from 'lucide-react';

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
}

export function SectionTitle({ title, subtitle, icon: Icon }: SectionTitleProps) {
  return (
    <div className="text-center mb-12">
      <div className="flex items-center justify-center gap-4 mb-3">
        {/* Icône de gauche */}
        <Icon className="w-8 h-8 text-[#D4AF37] fill-[#D4AF37]" /> 
        
        {/* Le Titre */}
        <h2 className="text-4xl md:text-5xl font-bold text-[#D4AF37] font-display transform -rotate-1">
          {title}
        </h2>

        {/* Icône de droite */}
        <Icon className="w-8 h-8 text-[#D4AF37] fill-[#D4AF37]" />
      </div>
      
      {/* Le sous-titre (optionnel) */}
      {subtitle && (
        <p className="text-gray-600 text-lg font-medium">
          {subtitle}
        </p>
      )}
    </div>
  );
}