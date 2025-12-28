'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

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
    text: "J'accepte les",
    links: [
      { href: '/cgv', text: 'Conditions Générales de Vente' },
      { href: '/politique-confidentialite', text: 'Politique de confidentialité' },
    ],
    required: true,
  },
  contact: {
    text: "J'accepte que mes données personnelles soient utilisées conformément à la",
    links: [{ href: '/politique-confidentialite', text: 'Politique de confidentialité' }],
    required: true,
  },
};

export default function GDPRConsent({
  checked,
  onCheckedChange,
  error,
  type = 'account',
}: GDPRConsentProps) {
  const config = consentTexts[type];

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3">
        <Checkbox
          id={`gdpr-consent-${type}`}
          checked={checked}
          onCheckedChange={onCheckedChange}
          className={`mt-1 ${type === 'newsletter' ? 'h-5 w-5 border-2 border-white bg-white/10' : ''}`}
        />
        <Label
          htmlFor={`gdpr-consent-${type}`}
          className={`leading-relaxed cursor-pointer ${type === 'newsletter' ? 'text-white text-xs' : 'text-sm'}`}
        >
          {config.text}{' '}
          {config.links.map((link, index) => (
            <span key={link.href}>
              <Link
                href={link.href}
                className="text-[#C6A15B] hover:underline font-semibold"
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.text}
              </Link>
              {index < config.links.length - 1 && ' et la '}
            </span>
          ))}
          {config.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      </div>
      {error && <p className="text-sm text-red-500 ml-6">{error}</p>}
    </div>
  );
}
