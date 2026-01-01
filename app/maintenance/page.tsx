'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wrench, Clock } from 'lucide-react';

export default function MaintenancePage() {
  const [message, setMessage] = useState('Le site est actuellement en maintenance. Nous serons bientôt de retour.');
  const [maintenanceEnd, setMaintenanceEnd] = useState<string | null>(null);

  useEffect(() => {
    const loadMaintenanceInfo = async () => {
      try {
        const response = await fetch('/api/admin/maintenance');
        if (response.ok) {
          const result = await response.json();
          if (result.data) {
            setMessage(result.data.maintenance_message || message);
            if (result.data.maintenance_end) {
              setMaintenanceEnd(result.data.maintenance_end);
            }
          }
        }
      } catch (error) {
        console.error('Error loading maintenance info:', error);
      }
    };

    loadMaintenanceInfo();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="max-w-2xl w-full shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center">
              <Wrench className="w-10 h-10 text-orange-600" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-gray-800">
            Site en Maintenance
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <p className="text-lg text-gray-600 leading-relaxed whitespace-pre-line">
            {message}
          </p>

          {maintenanceEnd && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 bg-blue-50 py-3 px-4 rounded-lg">
              <Clock className="w-4 h-4" />
              <span>
                Retour prévu : {new Date(maintenanceEnd).toLocaleString('fr-FR', {
                  dateStyle: 'long',
                  timeStyle: 'short'
                })}
              </span>
            </div>
          )}

          <div className="pt-4 border-t">
            <p className="text-sm text-gray-500">
              Nous effectuons actuellement des opérations de maintenance pour améliorer votre expérience.
              Merci de votre patience.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
