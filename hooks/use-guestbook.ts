import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function useGuestbook() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('guestbook')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching guestbook:', error);
      toast.error('Erreur chargement livre d\'or');
    } finally {
      setLoading(false);
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      const { error } = await supabase.from('guestbook').delete().eq('id', id);
      if (error) throw error;
      setEntries(prev => prev.filter(e => e.id !== id));
      toast.success('Message supprimé');
    } catch (error) {
      toast.error('Erreur suppression');
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('guestbook')
        .update({ is_published: !currentStatus })
        .eq('id', id);
      
      if (error) throw error;
      setEntries(prev => prev.map(e => e.id === id ? { ...e, is_published: !currentStatus } : e));
      toast.success('Statut mis à jour');
    } catch (error) {
      toast.error('Erreur mise à jour');
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  return { entries, loading, deleteEntry, toggleStatus, refresh: fetchEntries };
}