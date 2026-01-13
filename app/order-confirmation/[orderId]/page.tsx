"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, Package, ArrowRight, FileText, CreditCard, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Order {
  id: string;
  order_number: string;
  payment_method_id: string;
  payment_method?: any;
  total_amount: number;
  created_at: string;
  shipping_address: any;
  status: string;
}

export default function OrderConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOrder();
  }, [params.orderId]);

  const loadOrder = async () => {
    setLoading(true);
    setError(null);

    try {
      const orderId = params.orderId as string;

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          payment_method:payment_methods(*)
        `)
        .eq('id', orderId)
        .maybeSingle();

      if (orderError) throw orderError;

      if (!orderData) {
        setError('Commande introuvable');
        return;
      }

      setOrder(orderData);
    } catch (err: any) {
      console.error('Error loading order:', err);
      setError(err.message || 'Erreur lors du chargement de la commande');
    } finally {
      setLoading(false);
    }
  };

  const getMessageByPaymentMethod = () => {
    if (!order || !order.payment_method) return null;

    const paymentCode = order.payment_method.code?.toLowerCase() || '';

    if (paymentCode.includes('virement') || paymentCode.includes('transfer')) {
      return {
        title: 'Commande en attente de confirmation',
        message: 'Merci pour votre commande ! Votre commande sera traitée dès la confirmation de réception du virement sur notre compte. Vous recevrez un email de confirmation sous peu.',
        icon: <FileText className="h-12 w-12 text-blue-600" />,
        color: 'blue',
        showBankDetails: true,
      };
    }

    return {
      title: 'Confirmation de commande',
      message: 'Votre commande a bien été enregistrée et sera traitée dans les meilleurs délais. Merci de votre confiance.',
      icon: <CheckCircle2 className="h-12 w-12 text-green-600" />,
      color: 'green',
      showBankDetails: false,
    };
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="h-12 w-12 animate-spin text-[#D4AF37] mb-4" />
          <p className="text-gray-600">Chargement de votre commande...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <Alert variant="destructive">
            <AlertDescription>
              {error || 'Commande introuvable'}
            </AlertDescription>
          </Alert>
          <div className="mt-6 text-center">
            <Link href="/">
              <Button>Retour à l'accueil</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const messageConfig = getMessageByPaymentMethod();

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-3xl mx-auto space-y-6">
        <Card className="border-2 border-[#D4AF37]">
          <CardHeader className="text-center bg-gradient-to-br from-[#D4AF37]/10 to-white">
            <div className="flex justify-center mb-4">
              {messageConfig?.icon}
            </div>
            <CardTitle className="text-3xl mb-2">
              {messageConfig?.title || 'Commande confirmée'}
            </CardTitle>
            <p className="text-lg text-gray-600">
              Commande <span className="font-bold text-[#D4AF37]">#{order.order_number}</span>
            </p>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <Alert className={`${messageConfig?.color === 'blue' ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'}`}>
              <AlertDescription className={`${messageConfig?.color === 'blue' ? 'text-blue-800' : 'text-green-800'}`}>
                {messageConfig?.message}
              </AlertDescription>
            </Alert>

            {messageConfig?.showBankDetails && (
              <Card className="bg-blue-50 border-2 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
                    <CreditCard className="h-5 w-5" />
                    Coordonnées bancaires
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-blue-900">
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-semibold">Titulaire :</span>
                    <span>MORGANE DEWANIN</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-semibold">IBAN :</span>
                    <span className="font-mono">FR76 1234 5678 9012 3456 7890 123</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-semibold">BIC :</span>
                    <span className="font-mono">ABCDEFGH123</span>
                  </div>
                  <Separator className="my-3" />
                  <Alert className="bg-blue-100 border-blue-300">
                    <AlertDescription className="text-xs text-blue-900">
                      Merci de bien indiquer le numéro de commande <strong>#{order.order_number}</strong> dans le libellé de votre virement
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}

            <Separator />

            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Récapitulatif</h3>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Date de commande :</span>
                  <span className="font-medium">
                    {new Date(order.created_at).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mode de paiement :</span>
                  <span className="font-medium">{order.payment_method?.name || 'Non spécifié'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Statut :</span>
                  <span className="font-medium capitalize">
                    {order.status === 'pending' ? 'En attente' : order.status}
                  </span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total TTC :</span>
                <span className="text-2xl font-bold text-[#D4AF37]">
                  {Number(order.total_amount).toFixed(2)} €
                </span>
              </div>
            </div>

            <Separator />

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/account/orders" className="flex-1">
                <Button className="w-full bg-gradient-to-r from-[#b8933d] to-[#d4af37] hover:from-[#9a7a2f] hover:to-[#b8933d]">
                  <Package className="h-4 w-4 mr-2" />
                  Voir le détail de ma commande
                </Button>
              </Link>
              <Link href="/" className="flex-1">
                <Button variant="outline" className="w-full border-[#D4AF37] hover:bg-[#D4AF37]/10">
                  Continuer mes achats
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>

            <Alert>
              <AlertDescription className="text-xs text-gray-600 text-center">
                Un email de confirmation vous a été envoyé à l'adresse associée à votre compte
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
