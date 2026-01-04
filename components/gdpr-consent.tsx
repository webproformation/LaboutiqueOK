'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface GDPRConsentProps {
  type: 'newsletter' | 'contact' | 'account';
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function GDPRConsent({ type, checked, onCheckedChange }: GDPRConsentProps) {
  const texts = {
    newsletter: "J'accepte de recevoir des communications marketing de La Boutique de Morgane et confirme avoir lu la politique de confidentialité.",
    contact: "J'accepte que mes données soient utilisées pour traiter ma demande de contact conformément à la politique de confidentialité.",
    account: "J'accepte les conditions générales d'utilisation et la politique de confidentialité de La Boutique de Morgane."
  };

  return (
    <div className="flex items-start space-x-2">
      <Checkbox
        id={`gdpr-${type}`}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="mt-1"
      />
      <Label
        htmlFor={`gdpr-${type}`}
        className="text-xs leading-relaxed cursor-pointer"
      >
        {texts[type]}{' '}
        <a
          href="/politique-confidentialite"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#D4AF37] hover:underline"
        >
          En savoir plus
        </a>
      </Label>
    </div>
  );
}
