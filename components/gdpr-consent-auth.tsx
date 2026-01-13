'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface GDPRConsentProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  error?: string;
  type?: 'account' | 'newsletter' | 'order' | 'contact';
}

const consentTexts = {
  account: {
    text: "J'accepte les",
    links: [
      { href: '/cgv', text: 'Conditions Générales de Vente' },
      { href: '/politique-confidentialite', text: 'Politique de confidentialité' },
    ],
    required: true,
  },
  newsletter: {
    text: "J'accepte de recevoir des communications marketing et j'ai lu la",
    links: [{ href: '/politique-confidentialite', text: 'Politique de confidentialité' }],
    required: true,
  },
  order: {
    text: "J'ai lu et j'accepte les",
    links: [{ href: '/cgv', text: 'Conditions Générales de Vente' }],
    required: true,
  },
  contact: {
    text: "J'accepte que mes données soient utilisées conformément à la",
    links: [{ href: '/politique-confidentialite', text: 'Politique de confidentialité' }],
    required: true,
  },
};

export function GDPRConsent({ checked, onCheckedChange, error, type = 'account' }: GDPRConsentProps) {
  const config = consentTexts[type];

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3">
        <Checkbox
          id={`gdpr-${type}`}
          checked={checked}
          onCheckedChange={onCheckedChange}
          className="mt-1"
        />
        <Label
          htmlFor={`gdpr-${type}`}
          className="text-sm leading-relaxed cursor-pointer"
        >
          {config.text}{' '}
          {config.links.map((link, index) => (
            <span key={link.href}>
              {index > 0 && ' et la '}
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#C6A15B] hover:underline font-medium"
              >
                {link.text}
              </a>
            </span>
          ))}
          {config.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      </div>
      {error && (
        <p className="text-sm text-red-500 ml-7">{error}</p>
      )}
    </div>
  );
}
