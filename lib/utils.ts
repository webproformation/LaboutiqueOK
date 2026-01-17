import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function decodeHtmlEntities(text: string | null | undefined): string {
  if (!text) return '';

  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#039;': "'",
    '&#x27;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
  };

  return text.replace(/&[a-z0-9#]+;/gi, (match) => entities[match] || match);
}

/**
 * Formate les attributs de variation de manière robuste
 * Gère les formats : string JSON, Array, Object
 */
export function formatAttributes(variationData: any): string {
  if (!variationData) return '';

  let parsedData = variationData;

  // Si c'est une string JSON, la parser
  if (typeof variationData === 'string') {
    try {
      parsedData = JSON.parse(variationData);
    } catch (e) {
      return '';
    }
  }

  // Si c'est un tableau [{name: 'Couleur', value: 'Bleu'}]
  if (Array.isArray(parsedData)) {
    return parsedData
      .map((item: any) => {
        if (typeof item === 'object' && item !== null) {
          const name = item.name || item.key || '';
          const value = item.value || item.option || item.val || '';
          return name && value ? `${name}: ${value}` : '';
        }
        return String(item || '');
      })
      .filter(Boolean)
      .join(', ');
  }

  // Si c'est un objet {"Couleur": "Bleu"} ou {couleur: {name: "Bleu"}}
  if (typeof parsedData === 'object' && parsedData !== null) {
    const attributes = Object.entries(parsedData)
      .filter(([key]) => {
        // Exclure les champs techniques
        const excludedKeys = ['id', 'variation_id', 'sku', 'image_url', 'product_id', 'created_at', 'updated_at'];
        return !excludedKeys.includes(key) && !key.startsWith('_');
      })
      .map(([key, value]) => {
        // Extraire la valeur lisible
        let displayValue = '';
        if (typeof value === 'object' && value !== null) {
          displayValue = (value as any)?.name || (value as any)?.value || (value as any)?.option || JSON.stringify(value);
        } else {
          displayValue = String(value || '');
        }

        // Nettoyer le nom de la clé
        const cleanKey = key
          .replace(/_/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        return displayValue ? `${cleanKey}: ${displayValue}` : '';
      })
      .filter(Boolean);

    return attributes.join(', ');
  }

  return '';
}
