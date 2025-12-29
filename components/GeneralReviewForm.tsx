'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Star, MessageSquare, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

export default function GeneralReviewForm() {
  const [hasOrders, setHasOrders] = useState(false);
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
    checkOrdersAndLoadUserData();
  }, [user]);

  const checkOrdersAndLoadUserData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', user.id)
        .in('status', ['processing', 'completed'])
        .limit(1);

      if (error) throw error;

      setHasOrders((orders?.length || 0) > 0);

      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('first_name, last_name')
          .eq('id', user.id)
          .maybeSingle();

        setFormData(prev => ({
          ...prev,
          customer_name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : user.email?.split('@')[0] || '',
          customer_email: user.email || '',
        }));
      }
    } catch (error) {
      console.error('Error checking orders:', error);
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
        source: 'website' as const,
        source_id: null,
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

  if (loading || !hasOrders) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        {!showForm ? (
          <Card className="border-2 border-[#b8933d]/30 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20">
            <CardContent className="p-8 text-center space-y-4">
              <div className="flex justify-center">
                <MessageSquare className="w-12 h-12 text-[#b8933d]" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Votre avis compte pour nous !
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Vous venez de rejoindre notre communauté de clientes satisfaites. Votre expérience nous intéresse ! Partagez votre ressenti sur notre boutique, nos produits ou notre service client. Votre témoignage aide d'autres fashionistas à faire le bon choix et nous permet de nous améliorer chaque jour.
              </p>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border-2 border-[#b8933d]/20">
                <p className="text-sm font-semibold text-[#b8933d] flex items-center justify-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Votre avis sera marqué "Achat Vérifié"
                </p>
              </div>
              <Button
                onClick={() => setShowForm(true)}
                size="lg"
                className="bg-[#b8933d] hover:bg-[#a07c2f] text-white text-lg px-8 py-6"
              >
                <Star className="w-5 h-5 mr-2" />
                Laisser mon avis
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-2 border-[#b8933d]/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <MessageSquare className="w-6 h-6 text-[#b8933d]" />
                  Partagez votre expérience
                </h3>
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
                    placeholder="Partagez votre expérience avec La Boutique de Morgane..."
                    rows={6}
                    required
                  />
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm text-blue-900 dark:text-blue-200">
                  <p className="font-semibold mb-1">Votre avis sera publié après validation par notre équipe.</p>
                  <p className="text-xs">Nous vérifions chaque avis pour garantir leur authenticité et leur pertinence.</p>
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#b8933d] hover:bg-[#a07c2f] text-white text-lg py-6"
                >
                  {submitting ? 'Envoi en cours...' : 'Publier mon avis'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
