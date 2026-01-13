'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function NewNewsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/actualites/edit/new');
  }, [router]);

  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-gray-600">Redirection...</div>
    </div>
  );
}
