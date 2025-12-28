'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, CheckCircle, XCircle, Trash2, Heart, MessageSquare, BookHeart } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

export default function ReviewsAdminPage() {
  const searchParams = useSearchParams();
  const isGuestbookMode = searchParams.get('filter') === 'guestbook';

  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>(isGuestbookMode ? 'pending' : 'all');
  const [filterSource, setFilterSource] = useState<string>(isGuestbookMode ? 'website' : 'all');

  useEffect(() => {
    loadReviews();
  }, []);

  useEffect(() => {
    if (isGuestbookMode) {
      setFilterStatus('pending');
      setFilterSource('website');
    }
  }, [isGuestbookMode]);

  useEffect(() => {
    let filtered = reviews;

    if (filterStatus === 'approved') {
      filtered = filtered.filter(r => r.is_approved);
    } else if (filterStatus === 'pending') {
      filtered = filtered.filter(r => !r.is_approved);
    }

    if (filterSource !== 'all') {
      filtered = filtered.filter(r => r.source === filterSource);
    }

    setFilteredReviews(filtered);
  }, [filterStatus, filterSource, reviews]);

  const loadReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
      setFilteredReviews(data || []);
    } catch (error) {
      console.error('Error loading reviews:', error);
      toast.error('Erreur lors du chargement des avis');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reviewId: string) => {
    try {
      const { error } = await supabase
        .from('customer_reviews')
        .update({ is_approved: true })
        .eq('id', reviewId);

      if (error) throw error;

      setReviews(reviews.map(r =>
        r.id === reviewId ? { ...r, is_approved: true } : r
      ));
      toast.success('Avis approuvé');
    } catch (error) {
      console.error('Error approving review:', error);
      toast.error('Erreur lors de l\'approbation');
    }
  };

  const handleReject = async (reviewId: string) => {
    try {
      const { error } = await supabase
        .from('customer_reviews')
        .update({ is_approved: false })
        .eq('id', reviewId);

      if (error) throw error;

      setReviews(reviews.map(r =>
        r.id === reviewId ? { ...r, is_approved: false } : r
      ));
      toast.success('Avis rejeté');
    } catch (error) {
      console.error('Error rejecting review:', error);
      toast.error('Erreur lors du rejet');
    }
  };

  const handleToggleFeatured = async (reviewId: string, isFeatured: boolean) => {
    try {
      const { error } = await supabase
        .from('customer_reviews')
        .update({ is_featured: !isFeatured })
        .eq('id', reviewId);

      if (error) throw error;

      setReviews(reviews.map(r =>
        r.id === reviewId ? { ...r, is_featured: !isFeatured } : r
      ));
      toast.success(isFeatured ? 'Retiré des favoris' : 'Ajouté aux favoris');
    } catch (error) {
      console.error('Error toggling featured:', error);
      toast.error('Erreur lors de la modification');
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet avis ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('customer_reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;

      setReviews(reviews.filter(r => r.id !== reviewId));
      toast.success('Avis supprimé');
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error('Erreur lors de la suppression');
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

  const pendingCount = reviews.filter(r => !r.is_approved).length;
  const approvedCount = reviews.filter(r => r.is_approved).length;
  const featuredCount = reviews.filter(r => r.is_featured).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            {isGuestbookMode ? (
              <>
                <BookHeart className="h-8 w-8 text-[#b8933d]" />
                Livre d'Or - Messages en attente
              </>
            ) : (
              <>
                <MessageSquare className="h-8 w-8 text-[#b8933d]" />
                Gestion des avis clients
              </>
            )}
          </h1>
          <p className="text-gray-600 mt-1">
            {isGuestbookMode
              ? 'Valider les messages du livre d\'or laissés par les clients'
              : 'Modérer et gérer tous les avis clients'}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{reviews.length}</p>
              <p className="text-sm text-gray-600">Total des avis</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">{pendingCount}</p>
              <p className="text-sm text-gray-600">En attente</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{approvedCount}</p>
              <p className="text-sm text-gray-600">Approuvés</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-[#b8933d]">{featuredCount}</p>
              <p className="text-sm text-gray-600">Mis en avant</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
          <CardDescription>Filtrer les avis par statut et source</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Statut</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="approved">Approuvés</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Source</label>
              <Select value={filterSource} onValueChange={setFilterSource}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les sources</SelectItem>
                  <SelectItem value="website">Site web</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="product">Produits</SelectItem>
                  <SelectItem value="order">Commandes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Chargement...</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-600">Aucun avis trouvé</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <Card key={review.id} className={!review.is_approved ? 'border-orange-300 bg-orange-50/30' : ''}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C6A15B] to-[#b8933d] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {review.customer_name.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-900">{review.customer_name}</h3>
                          <Badge className={getSourceBadgeColor(review.source)}>
                            {getSourceLabel(review.source)}
                          </Badge>
                          {review.is_featured && (
                            <Badge className="bg-[#b8933d] text-white">
                              <Heart className="w-3 h-3 mr-1 fill-current" />
                              Coup de cœur
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            {[...Array(review.rating)].map((_, i) => (
                              <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(review.created_at).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!review.is_approved && (
                          <Badge className="bg-orange-100 text-orange-800">En attente</Badge>
                        )}
                        {review.is_approved && (
                          <Badge className="bg-green-100 text-green-800">Approuvé</Badge>
                        )}
                      </div>
                    </div>

                    <p className="text-gray-700 mb-4 italic">"{review.comment}"</p>

                    {review.customer_email && (
                      <p className="text-sm text-gray-500 mb-4">Email: {review.customer_email}</p>
                    )}

                    <div className="flex items-center gap-2">
                      {!review.is_approved ? (
                        <Button
                          size="sm"
                          onClick={() => handleApprove(review.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approuver
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(review.id)}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Rejeter
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleFeatured(review.id, review.is_featured)}
                      >
                        <Heart className={`h-4 w-4 mr-2 ${review.is_featured ? 'fill-current text-red-500' : ''}`} />
                        {review.is_featured ? 'Retirer des favoris' : 'Mettre en avant'}
                      </Button>

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(review.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </Button>
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
