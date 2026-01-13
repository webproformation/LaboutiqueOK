'use client';

import { useAuth } from '@/context/AuthContext';
import { Shield, X } from 'lucide-react';
import { useState } from 'react';

export function AdminBanner() {
  const { profile } = useAuth();
  const [isVisible, setIsVisible] = useState(true);

  if (!profile?.is_admin || !isVisible) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-red-600 to-red-700 text-white py-2 px-4 shadow-lg relative z-50">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5" />
          <div>
            <span className="font-bold text-sm uppercase tracking-wider">
              SESSION ADMINISTRATEUR : WEBPRO
            </span>
            <span className="ml-3 text-xs opacity-90">
              ({profile.email})
            </span>
          </div>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="hover:bg-red-800 rounded-full p-1 transition-colors"
          aria-label="Masquer le bandeau"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
