"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/context/AuthContext';
import GDPRConsent from '@/components/GDPRConsent';

export default function ContactPage() {
  const { user, profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gdprConsent, setGdprConsent] = useState(false);
  const [gdprError, setGdprError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (!formData.email.includes('@')) {
      toast.error('Veuillez entrer une adresse email valide');
      return;
    }

    if (!gdprConsent) {
      setGdprError('Vous devez accepter la politique de confidentialité');
      toast.error('Veuillez accepter la politique de confidentialité');
      return;
    }

    setGdprError('');
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('contact_messages')
        .insert({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          subject: formData.subject,
          message: formData.message,
          user_id: user?.id || null,
        });

      if (error) throw error;

      toast.success('Votre message a été envoyé avec succès !');
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      });
      setGdprConsent(false);
    } catch (error) {
      console.error('Error submitting contact form:', error);
      toast.error('Une erreur est survenue lors de l\'envoi du message');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Contactez-nous</h1>
          <p className="text-gray-600">
            Une question, une suggestion ou besoin d&apos;aide ? N&apos;hésitez pas à nous contacter !
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Formulaire de contact</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">
                        Nom complet <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Votre nom et prénom"
                        required
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">
                        Email <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="votre.email@example.com"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+33 6 XX XX XX XX"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">
                      Sujet <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="subject"
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="Objet de votre message"
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">
                      Message <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Votre message..."
                      rows={6}
                      required
                      disabled={isSubmitting}
                      className="resize-none"
                    />
                  </div>

                  <div>
                    <GDPRConsent
                      type="contact"
                      checked={gdprConsent}
                      onCheckedChange={setGdprConsent}
                      error={gdprError}
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
                    <p className="font-semibold mb-2">Protection de vos données</p>
                    <p>
                      Conformément au RGPD, vos données personnelles sont collectées uniquement pour répondre à votre demande.
                      Elles ne seront ni vendues, ni partagées avec des tiers. Vous disposez d&apos;un droit d&apos;accès, de rectification
                      et de suppression de vos données. Pour plus d&apos;informations, consultez notre{' '}
                      <a href="/politique-confidentialite" className="underline hover:text-blue-700">
                        politique de confidentialité
                      </a>.
                    </p>
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>Envoi en cours...</>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Envoyer le message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Nos coordonnées</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-[#C6A15B] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">Adresse</p>
                    <p className="text-gray-600 text-sm">1062 rue d&apos;Armentières</p>
                    <p className="text-gray-600 text-sm">59850 Nieppe</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-[#C6A15B] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">Téléphone</p>
                    <div className="space-y-1">
                      <a
                        href="tel:+33641456671"
                        className="text-gray-600 text-sm hover:text-[#C6A15B] transition-colors block"
                      >
                        <strong>Morgane</strong> : +33 6 41 45 66 71
                      </a>
                      <a
                        href="tel:+33603489662"
                        className="text-gray-600 text-sm hover:text-[#C6A15B] transition-colors block"
                      >
                        <strong>André</strong> : +33 6 03 48 96 62
                      </a>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-[#C6A15B] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">Email</p>
                    <a
                      href="mailto:contact@laboutiquedemorgane.com"
                      className="text-gray-600 text-sm hover:text-[#C6A15B] transition-colors break-all"
                    >
                      contact@laboutiquedemorgane.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-[#C6A15B] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">Horaires</p>
                    <p className="text-gray-600 text-sm font-medium mt-1">En boutique sur rendez-vous</p>
                    <p className="text-gray-600 text-sm">Le mercredi de 9h à 19h</p>
                    <p className="text-gray-600 text-sm font-medium mt-2">Par téléphone</p>
                    <p className="text-gray-600 text-sm">Du lundi au vendredi de 9h à 18h</p>
                    <p className="text-gray-600 text-sm font-medium mt-2">En dehors de ces horaires</p>
                    <p className="text-gray-600 text-sm">Laissez-nous un SMS ou un e-mail,</p>
                    <p className="text-gray-600 text-sm">réponse garantie le plus rapidement possible</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-[#C6A15B] to-[#b8933d] text-white">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg mb-2">Besoin d&apos;aide ?</h3>
                <p className="text-sm text-white/90 mb-4">
                  Notre équipe est à votre disposition pour répondre à toutes vos questions et vous accompagner dans vos achats.
                </p>
                <p className="text-sm text-white/90">
                  Nous nous engageons à vous répondre dans les plus brefs délais, généralement sous 24h ouvrées.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
