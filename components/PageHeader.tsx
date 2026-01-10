import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

export default function PageHeader({ icon: Icon, title, description }: PageHeaderProps) {
  return (
    <div className="text-center mb-12">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#b8933d]/20 to-[#d4af37]/20 rounded-full mb-6">
        <Icon className="h-10 w-10 text-[#d4af37]" />
      </div>
      <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#b8933d] to-[#d4af37] bg-clip-text text-transparent mb-4">
        {title}
      </h1>
      {description && (
        <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
          {description}
        </p>
      )}
    </div>
  );
}
