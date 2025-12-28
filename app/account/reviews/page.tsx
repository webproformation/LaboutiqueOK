'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, MessageSquare, Heart, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

interface Review {
  id: string;
  customer_name: string;
  rating: number;
  comment: string;
  source: 'website' | 'facebook' | 'product' | 'order';
  source_id: string | null;
  is_approved: boolean;
  is_featured: boolean;
  created_at: string;
}

export default function MyReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadReviews();
    }
  }, [user]);

  const loadReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_reviews')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error loading reviews:', error);
      toast.error('Erreur lors du chargement des avis');
    } finally {
      setLoading(false);
    }
  };

  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case 'facebook':
        return 'bg-blue-100 text-blue-800';
      case 'product':
        return 'bg-purple-100 text-purple-800';
      case 'order':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'facebook':
        return 'Facebook';
      case 'product':
        return 'Produit';
      case 'order':
        return 'Commande';
      default:
        return 'Site web';
    }
  };

  const approvedCount = reviews.filter(r => r.is_approved).length;
  const pendingCount = reviews.filter(r => !r.is_approved).length;
  const featuredCount = reviews.filter(r => r.is_featured).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-[#b8933d]" />
            Mes avis
          </h1>
          <p className="text-gray-600 mt-1">
            Consultez tous vos avis et témoignages
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <p className="text-3xl font-bold text-green-600">{approvedCount}</p>
              </div>
              <p className="text-sm text-gray-600">Avis publiés</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="h-6 w-6 text-orange-600" />
                <p className="text-3xl font-bold text-orange-600">{pendingCount}</p>
              </div>
              <p className="text-sm text-gray-600">En attente</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Heart className="h-6 w-6 text-[#b8933d]" />
                <p className="text-3xl font-bold text-[#b8933d]">{featuredCount}</p>
              </div>
              <p className="text-sm text-gray-600">Coups de coeur</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-600">Chargement...</p>
          </CardContent>
        </Card>
      ) : reviews.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">Aucun avis pour le moment</h3>
            <p className="text-gray-600 mb-6">
              Vous n'avez pas encore laissé d'avis. Partagez votre expérience avec nous !
            </p>
            <Button
              onClick={() => window.location.href = '/livre-dor'}
              className="bg-gradient-to-r from-[#C6A15B] to-[#b8933d]"
            >
              Laisser un avis
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card
              key={review.id}
              className={!review.is_approved ? 'border-orange-300 bg-orange-50/30' : 'border-green-300 bg-green-50/30'}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={getSourceBadgeColor(review.source)}>
                      {getSourceLabel(review.source)}
                    </Badge>
                    {review.is_approved ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Publié
                      </Badge>
                    ) : (
                      <Badge className="bg-orange-100 text-orange-800">
                        <Clock className="w-3 h-3 mr-1" />
                        En attente de validation
                      </Badge>
                    )}
                    {review.is_featured && (
                      <Badge className="bg-[#b8933d] text-white">
                        <Heart className="w-3 h-3 mr-1 fill-current" />
                        Coup de coeur
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(review.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-1 mb-3">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                <p className="text-gray-700 italic leading-relaxed bg-white p-4 rounded-lg border border-gray-200">
                  "{review.comment}"
                </p>

                {!review.is_approved && (
                  <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-sm text-orange-800">
                      <strong>Note :</strong> Votre avis est en cours de modération. Il sera publié après validation par notre équipe.
                    </p>
                  </div>
                )}

                {review.is_featured && (
                  <div className="mt-4 p-3 bg-gradient-to-r from-[#C6A15B]/10 to-[#b8933d]/10 border border-[#b8933d]/30 rounded-lg">
                    <p className="text-sm text-[#b8933d] font-medium">
                      Merci pour votre avis ! Il a été sélectionné comme coup de coeur et apparaît sur notre page d'accueil.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="bg-gradient-to-br from-gray-50 to-white border-2 border-dashed border-gray-300">
        <CardContent className="text-center py-8">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 text-[#b8933d]" />
          <h3 className="text-xl font-semibold mb-2">Envie de partager votre expérience ?</h3>
          <p className="text-gray-600 mb-4">
            Votre avis compte pour nous et aide d'autres clientes à découvrir nos produits.
          </p>
          <Button
            onClick={() => window.location.href = '/livre-dor'}
            className="bg-gradient-to-r from-[#C6A15B] to-[#b8933d]"
          >
            Laisser un nouvel avis
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
