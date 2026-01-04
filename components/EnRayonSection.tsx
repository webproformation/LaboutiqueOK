import Link from 'next/link';

export default function EnRayonSection() {
  const categories = [
    { name: 'HOMME', href: '/en-rayon/homme' },
    { name: 'FEMME', href: '/en-rayon/femme' },
    { name: 'ENFANT', href: '/en-rayon/enfant' },
  ];

  return (
    <section className="bg-gradient-to-b from-gray-50 to-white py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
              La boutique de
            </h2>
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
              MORGANE
            </h2>
            <h3 className="text-3xl md:text-4xl font-bold text-[#b8933d]">
              En rayon
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-300">
            {categories.map((category) => (
              <Link
                key={category.name}
                href={category.href}
                className="group flex items-center justify-center py-12 md:py-16 hover:bg-gray-50 transition-colors"
              >
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 group-hover:text-[#b8933d] transition-colors">
                  {category.name}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
