'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Facebook, Plus, Trash2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface FacebookReview {
  customer_name: string;
  rating: number;
  message: string;
  facebook_review_date: string;
}

export default function FacebookReviewsPage() {
  const [reviews, setReviews] = useState<FacebookReview[]>([{
    customer_name: '',
    rating: 5,
    message: '',
    facebook_review_date: new Date().toISOString().split('T')[0]
  }]);
  const [importing, setImporting] = useState(false);

  const addReview = () => {
    setReviews([...reviews, {
      customer_name: '',
      rating: 5,
      message: '',
      facebook_review_date: new Date().toISOString().split('T')[0]
    }]);
  };

  const removeReview = (index: number) => {
    setReviews(reviews.filter((_, i) => i !== index));
  };

  const updateReview = (index: number, field: keyof FacebookReview, value: any) => {
    const newReviews = [...reviews];
    newReviews[index] = { ...newReviews[index], [field]: value };
    setReviews(newReviews);
  };

  const handleImport = async () => {
    try {
      setImporting(true);

      // Valider que tous les champs sont remplis
      const invalidReviews = reviews.filter(r =>
        !r.customer_name.trim() ||
        !r.message.trim() ||
        r.rating < 1 ||
        r.rating > 5
      );

      if (invalidReviews.length > 0) {
        toast.error('Veuillez remplir tous les champs correctement');
        return;
      }

      // Insérer les avis dans la base de données
      const reviewsToInsert = reviews.map(review => ({
        customer_name: review.customer_name.trim(),
        rating: review.rating,
        message: review.message.trim(),
        source: 'facebook',
        status: 'approved',
        facebook_review_date: new Date(review.facebook_review_date).toISOString(),
        approved_at: new Date().toISOString(),
        order_number: 'Facebook',
        likes_count: 0,
        reward_amount: 0,
        reward_applied: false,
        rgpd_consent: true,
        created_at: new Date(review.facebook_review_date).toISOString()
      }));

      const { error } = await supabase
        .from('guestbook_entries')
        .insert(reviewsToInsert);

      if (error) throw error;

      toast.success(`${reviews.length} avis Facebook importés avec succès !`);

      // Réinitialiser le formulaire
      setReviews([{
        customer_name: '',
        rating: 5,
        message: '',
        facebook_review_date: new Date().toISOString().split('T')[0]
      }]);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'import des avis');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Importer des Avis Facebook</h1>
        <p className="text-gray-600">
          Ajoutez des avis depuis votre page Facebook pour les afficher dans le livre d'or
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Facebook className="w-5 h-5 text-blue-600" />
            Avis Facebook
          </CardTitle>
          <CardDescription>
            Ces avis seront marqués comme provenant de Facebook et approuvés automatiquement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {reviews.map((review, index) => (
            <div key={index} className="border rounded-lg p-6 space-y-4 relative">
              {reviews.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => removeReview(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`name-${index}`}>Nom du client *</Label>
                  <Input
                    id={`name-${index}`}
                    value={review.customer_name}
                    onChange={(e) => updateReview(index, 'customer_name', e.target.value)}
                    placeholder="Ex: Marie Dupont"
                  />
                </div>

                <div>
                  <Label htmlFor={`rating-${index}`}>Note (sur 5) *</Label>
                  <Input
                    id={`rating-${index}`}
                    type="number"
                    min="1"
                    max="5"
                    value={review.rating}
                    onChange={(e) => updateReview(index, 'rating', parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor={`date-${index}`}>Date de l'avis Facebook *</Label>
                  <Input
                    id={`date-${index}`}
                    type="date"
                    value={review.facebook_review_date}
                    onChange={(e) => updateReview(index, 'facebook_review_date', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor={`message-${index}`}>Texte de l'avis *</Label>
                <Textarea
                  id={`message-${index}`}
                  value={review.message}
                  onChange={(e) => updateReview(index, 'message', e.target.value)}
                  placeholder="Le commentaire du client..."
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {review.message.length}/500 caractères
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Facebook className="w-4 h-4 text-blue-600" />
                <span>Cet avis sera marqué comme provenant de Facebook</span>
              </div>
            </div>
          ))}

          <div className="flex gap-3">
            <Button
              onClick={addReview}
              variant="outline"
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Ajouter un autre avis
            </Button>

            <Button
              onClick={handleImport}
              disabled={importing}
              className="gap-2"
              style={{ backgroundColor: '#C6A15B' }}
            >
              <CheckCircle className="w-4 h-4" />
              {importing ? 'Import en cours...' : `Importer ${reviews.length} avis`}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Facebook className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-blue-900">
                Comment récupérer vos avis Facebook ?
              </p>
              <ol className="list-decimal list-inside space-y-1 text-blue-800">
                <li>Allez sur votre page Facebook : <a href="https://www.facebook.com/profile.php?id=100057420760713&sk=reviews" target="_blank" rel="noopener noreferrer" className="underline">Voir les avis</a></li>
                <li>Copiez le nom du client, la note (nombre d'étoiles) et le texte de l'avis</li>
                <li>Collez les informations dans les champs ci-dessus</li>
                <li>Répétez pour chaque avis que vous souhaitez importer</li>
                <li>Cliquez sur "Importer" pour les ajouter au livre d'or</li>
              </ol>
              <p className="text-xs text-blue-700 mt-3">
                Note : Ces avis seront automatiquement approuvés et visibles sur le site. Ils seront clairement identifiés comme provenant de Facebook.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
