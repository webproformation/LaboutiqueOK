'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Check, X, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface Review {
  id: string;
  customer_name: string;
  customer_email: string;
  rating: number;
  comment: string;
  photo_url: string | null;
  status: string;
  is_featured: boolean;
  created_at: string;
  order_id: string | null;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    let isMounted = true;

    async function loadReviews() {
      try {
        let query = supabase
          .from('customer_reviews')
          .select('*')
          .order('created_at', { ascending: false });

        if (filterStatus !== 'all') {
          query = query.eq('status', filterStatus);
        }

        const { data, error } = await query;

        if (error) throw error;

        if (isMounted) {
          setReviews(data || []);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error loading reviews:', error);
          toast.error('Erreur lors du chargement des avis');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadReviews();

    return () => {
      isMounted = false;
    };
  }, [filterStatus]);

  const updateReviewStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('customer_reviews')
        .update({
          status,
          approved_at: status === 'approved' ? new Date().toISOString() : null
        })
        .eq('id', id);

      if (error) throw error;

      setReviews(reviews.map(r => r.id === id ? { ...r, status } : r));
      toast.success(`Avis ${status === 'approved' ? 'approuvé' : 'rejeté'}`);
    } catch (error) {
      console.error('Error updating review:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const toggleFeatured = async (id: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('customer_reviews')
        .update({ is_featured: !currentValue })
        .eq('id', id);

      if (error) throw error;

      setReviews(reviews.map(r => r.id === id ? { ...r, is_featured: !currentValue } : r));
      toast.success(!currentValue ? 'Avis mis en avant' : 'Avis retiré de la mise en avant');
    } catch (error) {
      console.error('Error toggling featured:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-600">Approuvé</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-600">En attente</Badge>;
      case 'rejected':
        return <Badge className="bg-red-600">Rejeté</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Avis clients</h1>
        <p className="text-gray-600 mt-2">
          Gérez les avis et commentaires de vos clients
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          variant={filterStatus === 'all' ? 'default' : 'outline'}
          onClick={() => setFilterStatus('all')}
        >
          Tous
        </Button>
        <Button
          variant={filterStatus === 'pending' ? 'default' : 'outline'}
          onClick={() => setFilterStatus('pending')}
        >
          En attente
        </Button>
        <Button
          variant={filterStatus === 'approved' ? 'default' : 'outline'}
          onClick={() => setFilterStatus('approved')}
        >
          Approuvés
        </Button>
        <Button
          variant={filterStatus === 'rejected' ? 'default' : 'outline'}
          onClick={() => setFilterStatus('rejected')}
        >
          Rejetés
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              Chargement des avis...
            </div>
          </CardContent>
        </Card>
      ) : reviews.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <Star className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Aucun avis trouvé</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  {review.photo_url && (
                    <div className="flex-shrink-0">
                      <img
                        src={review.photo_url}
                        alt={review.customer_name}
                        className="w-20 h-20 rounded-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">{review.customer_name}</h3>
                        <p className="text-sm text-gray-500">{review.customer_email}</p>
                      </div>
                      <div className="flex gap-2">
                        {getStatusBadge(review.status)}
                        {review.is_featured && (
                          <Badge className="bg-[#C6A15B]">Mis en avant</Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 mb-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < review.rating
                              ? 'fill-[#D4AF37] text-[#D4AF37]'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>

                    <p className="text-gray-700 mb-4">{review.comment}</p>

                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                      <span>
                        {new Date(review.created_at).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      {review.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => updateReviewStatus(review.id, 'approved')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Approuver
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateReviewStatus(review.id, 'rejected')}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Rejeter
                          </Button>
                        </>
                      )}
                      {review.status === 'approved' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleFeatured(review.id, review.is_featured)}
                        >
                          {review.is_featured ? (
                            <>
                              <EyeOff className="w-4 h-4 mr-1" />
                              Retirer de la mise en avant
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4 mr-1" />
                              Mettre en avant
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
