"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Globe,
  FileText,
  Home,
} from "lucide-react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PageSEO {
  id: string;
  slug: string;
  title: string;
  page_type: string;
  is_published: boolean;
  meta_title: string | null;
  meta_description: string | null;
  updated_at: string;
}

export default function SitePagesAdminPage() {
  const router = useRouter();
  const [pages, setPages] = useState<PageSEO[]>([]);
  const [filteredPages, setFilteredPages] = useState<PageSEO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletePageId, setDeletePageId] = useState<string | null>(null);

  useEffect(() => {
    loadPages();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = pages.filter(
        (page) =>
          page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          page.slug.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredPages(filtered);
    } else {
      setFilteredPages(pages);
    }
  }, [searchQuery, pages]);

  const loadPages = async () => {
    try {
      const { data, error } = await supabase
        .from("pages_seo")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setPages(data || []);
    } catch (error) {
      console.error("Error loading pages:", error);
      toast.error("Erreur lors du chargement des pages");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePublish = async (page: PageSEO) => {
    try {
      const { error } = await supabase
        .from("pages_seo")
        .update({ is_published: !page.is_published })
        .eq("id", page.id);

      if (error) throw error;

      toast.success(
        page.is_published
          ? "Page dépubliée avec succès"
          : "Page publiée avec succès"
      );
      loadPages();
    } catch (error) {
      console.error("Error toggling publish status:", error);
      toast.error("Erreur lors de la modification du statut");
    }
  };

  const handleDelete = async () => {
    if (!deletePageId) return;

    try {
      const { error } = await supabase
        .from("pages_seo")
        .delete()
        .eq("id", deletePageId);

      if (error) throw error;

      toast.success("Page supprimée avec succès");
      setDeletePageId(null);
      loadPages();
    } catch (error) {
      console.error("Error deleting page:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const getPageTypeIcon = (type: string) => {
    switch (type) {
      case "home":
        return <Home className="h-4 w-4" />;
      case "static":
        return <FileText className="h-4 w-4" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  const getPageTypeBadge = (type: string) => {
    const variants: Record<string, { label: string; variant: any }> = {
      home: { label: "Accueil", variant: "default" },
      static: { label: "Page statique", variant: "secondary" },
      custom: { label: "Personnalisée", variant: "outline" },
    };

    const info = variants[type] || variants.custom;
    return <Badge variant={info.variant}>{info.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#d4af37]">Gestion des Pages</h1>
          <p className="text-gray-600 mt-1">
            Gérez le contenu et le référencement SEO de toutes les pages du site
          </p>
        </div>
        <Link href="/admin/site-pages/new">
          <Button className="bg-gradient-to-r from-[#b8933d] to-[#d4af37] hover:from-[#9a7a2f] hover:to-[#b8933d] text-white">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle page
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-[#d4af37]">Pages du site</CardTitle>
          <CardDescription>
            Liste de toutes les pages avec leur contenu et métadonnées SEO
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par titre ou slug..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-gray-500">
              Chargement des pages...
            </div>
          ) : filteredPages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery
                ? "Aucune page trouvée"
                : "Aucune page créée. Commencez par créer votre première page."}
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titre</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Dernière mise à jour</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPages.map((page) => (
                    <TableRow key={page.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {getPageTypeIcon(page.page_type)}
                          {page.title}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          /{page.slug}
                        </code>
                      </TableCell>
                      <TableCell>{getPageTypeBadge(page.page_type)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={page.is_published ? "default" : "secondary"}
                          className={
                            page.is_published
                              ? "bg-green-500 hover:bg-green-600"
                              : ""
                          }
                        >
                          {page.is_published ? (
                            <>
                              <Eye className="h-3 w-3 mr-1" />
                              Publié
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3 w-3 mr-1" />
                              Brouillon
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(page.updated_at).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/admin/site-pages/${page.id}`)
                              }
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleTogglePublish(page)}
                            >
                              {page.is_published ? (
                                <>
                                  <EyeOff className="h-4 w-4 mr-2" />
                                  Dépublier
                                </>
                              ) : (
                                <>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Publier
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeletePageId(page.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deletePageId} onOpenChange={() => setDeletePageId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette page ? Cette action est
              irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
