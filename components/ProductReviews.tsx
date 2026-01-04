'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Star, MessageSquare, ThumbsUp } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

interface Review {
  id: string;
  user_id: string | null;
  customer_name: string;
  customer_email: string | null;
  rating: number;
  comment: string;
  source: 'website' | 'facebook' | 'product' | 'order';
  source_id: string | null;
  is_approved: boolean;
  is_featured: boolean;
  created_at: string;
}

interface ProductReviewsProps {
  productId: string;
  productName: string;
}

export default function ProductReviews({ productId, productName }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    rating: 5,
    comment: '',
  });

  useEffect(() => {
    loadReviews();
  }, [productId]);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        customer_name: user.email?.split('@')[0] || '',
        customer_email: user.email || '',
      }));
    }
  }, [user]);

  const loadReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_reviews')
        .select('*')
        .eq('source', 'product')
        .eq('source_id', productId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customer_name.trim() || !formData.comment.trim()) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSubmitting(true);
    try {
      const reviewData = {
        user_id: user?.id || null,
        customer_name: formData.customer_name,
        customer_email: formData.customer_email || null,
        rating: formData.rating,
        comment: formData.comment,
        source: 'product' as const,
        source_id: productId,
        is_approved: false,
      };

      const { error } = await supabase
        .from('customer_reviews')
        .insert([reviewData]);

      if (error) throw error;

      toast.success('Merci pour votre avis ! Il sera publié après validation.');

      setFormData({
        customer_name: user?.email?.split('@')[0] || '',
        customer_email: user?.email || '',
        rating: 5,
        comment: '',
      });
      setShowForm(false);
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast.error('Erreur lors de l\'envoi de votre avis');
    } finally {
      setSubmitting(false);
    }
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-[#b8933d]" />
            Avis clients
          </h2>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.round(averageRating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {averageRating.toFixed(1)} / 5 ({reviews.length} avis)
              </span>
            </div>
          )}
        </div>
        {!showForm && (
          <Button
            onClick={() => setShowForm(true)}
            className="bg-[#b8933d] hover:bg-[#a07c2f] text-white"
          >
            <Star className="w-4 h-4 mr-2" />
            Laisser un avis
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="border-2 border-[#b8933d]/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Votre avis sur {productName}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowForm(false)}
              >
                Annuler
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer_name">Votre nom *</Label>
                  <Input
                    id="customer_name"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    placeholder="Prénom N."
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="customer_email">Votre email (optionnel)</Label>
                  <Input
                    id="customer_email"
                    type="email"
                    value={formData.customer_email}
                    onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                    placeholder="email@exemple.com"
                  />
                </div>
              </div>

              <div>
                <Label>Votre note *</Label>
                <div className="flex gap-2 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: star })}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= formData.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="comment">Votre avis *</Label>
                <Textarea
                  id="comment"
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  placeholder="Partagez votre expérience avec ce produit..."
                  rows={4}
                  required
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900">
                Votre avis sera publié après validation par notre équipe.
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#b8933d] hover:bg-[#a07c2f] text-white"
              >
                {submitting ? 'Envoi en cours...' : 'Publier mon avis'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-16 w-full mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-600 font-medium">Aucun avis pour le moment</p>
            <p className="text-sm text-gray-500 mt-1">Soyez le premier à donner votre avis sur ce produit !</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C6A15B] to-[#b8933d] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {review.customer_name.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-bold text-gray-900">{review.customer_name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            {[...Array(review.rating)].map((_, i) => (
                              <Star
                                key={i}
                                className="w-4 h-4 fill-yellow-400 text-yellow-400"
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(review.created_at).toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                      {review.is_featured && (
                        <div className="bg-[#b8933d] text-white px-3 py-1 rounded-full text-xs font-semibold">
                          Coup de cœur
                        </div>
                      )}
                    </div>

                    <p className="text-gray-700 leading-relaxed">{review.comment}</p>
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
