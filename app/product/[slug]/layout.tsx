import { Metadata } from 'next';
import { createServerClient } from '@/lib/supabase-server';

interface ProductLayoutProps {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const supabase = await createServerClient();

  try {
    const { data: product } = await supabase
      .from('products')
      .select('id, name, short_description, image_url')
      .eq('slug', slug)
      .maybeSingle();

    if (!product) {
      return {
        title: 'Produit introuvable',
        description: 'Ce produit n\'existe pas ou a été supprimé.',
      };
    }

    const { data: seoData } = await supabase
      .from('seo_metadata')
      .select('seo_title, meta_description, og_image, og_title, og_description')
      .eq('entity_type', 'product')
      .eq('entity_identifier', product.id)
      .maybeSingle();

    const stripHtml = (html: string | null | undefined) => {
      if (!html) return '';
      return html.replace(/<[^>]*>/g, '').trim();
    };

    const title = seoData?.seo_title || product.name || 'Produit';
    const description = seoData?.meta_description || stripHtml(product.short_description) || 'Découvrez ce produit sur notre boutique';
    const ogImage = seoData?.og_image || product.image_url || '/logo-bdc.png';
    const ogTitle = seoData?.og_title || title;
    const ogDescription = seoData?.og_description || description;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://laboutiquedeclaire.fr';
    const productUrl = `${siteUrl}/product/${slug}`;

    return {
      title,
      description,
      openGraph: {
        title: ogTitle,
        description: ogDescription,
        url: productUrl,
        siteName: 'La Boutique de Claire',
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
        locale: 'fr_FR',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: ogTitle,
        description: ogDescription,
        images: [ogImage],
      },
      alternates: {
        canonical: productUrl,
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'La Boutique de Claire',
      description: 'Découvrez nos produits',
    };
  }
}

export default function ProductLayout({ children }: ProductLayoutProps) {
  return <>{children}</>;
}
