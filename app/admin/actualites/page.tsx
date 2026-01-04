'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Edit, Trash2, Eye, Calendar, Tag as TagIcon } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface NewsPost {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'publish' | 'pending';
  published_at: string | null;
  created_at: string;
  news_post_categories: Array<{
    news_categories: {
      id: string;
      name: string;
      color: string;
    };
  }>;
}

export default function ActualitesAdminPage() {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('news_posts')
        .select(`
          id,
          title,
          slug,
          status,
          published_at,
          created_at,
          news_post_categories (
            news_categories (
              id,
              name,
              color
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedPosts = (data || []).map((post: any) => ({
        ...post,
        news_post_categories: post.news_post_categories.map((pc: any) => ({
          news_categories: Array.isArray(pc.news_categories) ? pc.news_categories[0] : pc.news_categories
        }))
      }));

      setPosts(formattedPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    try {
      const { error } = await supabase
        .from('news_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success(`Article "${title}" supprimé`);
      loadPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const filteredPosts = useMemo(() => {
    let filtered = posts;

    if (searchTerm) {
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(post => post.status === statusFilter);
    }

    return filtered;
  }, [posts, searchTerm, statusFilter]);

  const stats = {
    total: posts.length,
    published: posts.filter(p => p.status === 'publish').length,
    draft: posts.filter(p => p.status === 'draft').length,
    pending: posts.filter(p => p.status === 'pending').length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'publish':
        return <Badge className="bg-green-50 text-green-700 border-green-200">Publié</Badge>;
      case 'draft':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700">Brouillon</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">En attente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Le Carnet de Morgane</h1>
          <p className="text-gray-600 mt-2">
            Gérez vos articles et actualités
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/actualites/categories">
            <Button variant="outline">
              <TagIcon className="h-4 w-4 mr-2" />
              Catégories
            </Button>
          </Link>
          <Link href="/admin/actualites/new">
            <Button className="bg-gradient-to-r from-[#C6A15B] to-[#b8933d] hover:from-[#b8933d] hover:to-[#a88230] text-white shadow-lg">
              <Plus className="h-4 w-4 mr-2" />
              Nouvel article
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600 mb-1">Total</div>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600 mb-1">Publiés</div>
            <div className="text-3xl font-bold text-green-600">{stats.published}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-gray-500">
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600 mb-1">Brouillons</div>
            <div className="text-3xl font-bold text-gray-600">{stats.draft}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600 mb-1">En attente</div>
            <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher un article..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="publish">Publiés</SelectItem>
                <SelectItem value="draft">Brouillons</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredPosts.length === 0 ? (
            <div className="text-center py-16">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 text-lg">Aucun article trouvé</p>
              <p className="text-gray-400 text-sm mt-1">
                {searchTerm || statusFilter !== 'all'
                  ? 'Essayez de modifier vos filtres'
                  : 'Créez votre premier article'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Titre</TableHead>
                    <TableHead className="font-semibold">Catégories</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Statut</TableHead>
                    <TableHead className="text-right font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPosts.map((post) => (
                    <TableRow key={post.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="font-semibold text-gray-900">{post.title}</div>
                        <code className="text-xs text-gray-500">/actualites/{post.slug}</code>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {post.news_post_categories.slice(0, 2).map(({ news_categories }) => (
                            <Badge
                              key={news_categories.id}
                              className="text-white text-xs"
                              style={{ backgroundColor: news_categories.color }}
                            >
                              {news_categories.name}
                            </Badge>
                          ))}
                          {post.news_post_categories.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{post.news_post_categories.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          {post.published_at
                            ? format(new Date(post.published_at), 'dd/MM/yyyy', { locale: fr })
                            : format(new Date(post.created_at), 'dd/MM/yyyy', { locale: fr })}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(post.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {post.status === 'publish' && (
                            <Link href={`/actualites/${post.slug}`} target="_blank">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="hover:bg-gray-100"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                          <Link href={`/admin/actualites/edit/${post.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="hover:bg-blue-50 hover:text-blue-600"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Supprimer l'article</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Voulez-vous vraiment supprimer l'article "{post.title}" ?
                                  Cette action est irréversible.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(post.id, post.title)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
