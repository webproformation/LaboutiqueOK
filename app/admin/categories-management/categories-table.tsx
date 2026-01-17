"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search,
  Edit,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Trash2,
  FolderTree,
  ShoppingBag,
  Menu
} from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { decodeHtmlEntities } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  display_order: number;
  meta_title: string | null;
  is_visible: boolean;
  show_in_main_menu: boolean;
}

interface CategoriesTableProps {
  categories: Category[];
  productCounts: { [key: string]: number };
}

interface CategoryNode extends Category {
  children: CategoryNode[];
  productCount: number;
  descendantProductCount: number;
}

export default function CategoriesTable({
  categories,
  productCounts,
}: CategoriesTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const categoryTree = useMemo(() => {
    const categoryMap = new Map<string, CategoryNode>();
    const rootCategories: CategoryNode[] = [];

    categories.forEach(cat => {
      categoryMap.set(cat.id, {
        ...cat,
        children: [],
        productCount: productCounts[cat.id] || 0,
        descendantProductCount: 0
      });
    });

    categories.forEach(cat => {
      const node = categoryMap.get(cat.id)!;
      if (cat.parent_id && categoryMap.has(cat.parent_id)) {
        const parent = categoryMap.get(cat.parent_id)!;
        parent.children.push(node);
      } else {
        rootCategories.push(node);
      }
    });

    const calculateDescendantCount = (node: CategoryNode): number => {
      let total = node.productCount;
      node.children.forEach(child => {
        total += calculateDescendantCount(child);
      });
      node.descendantProductCount = total;
      return total;
    };

    rootCategories.forEach(calculateDescendantCount);

    const sortAlphabetically = (node: CategoryNode) => {
      node.children.sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));
      node.children.forEach(sortAlphabetically);
    };

    rootCategories.sort((a, b) => a.display_order - b.display_order);
    rootCategories.forEach(sortAlphabetically);

    return rootCategories;
  }, [categories, productCounts]);

  const filteredTree = useMemo(() => {
    if (!searchTerm) return categoryTree;

    const matchesSearch = (node: CategoryNode): boolean => {
      const matches =
        node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.slug.toLowerCase().includes(searchTerm.toLowerCase());

      if (matches) return true;

      return node.children.some(matchesSearch);
    };

    const filterTree = (nodes: CategoryNode[]): CategoryNode[] => {
      return nodes
        .filter(matchesSearch)
        .map(node => ({
          ...node,
          children: filterTree(node.children)
        }));
    };

    return filterTree(categoryTree);
  }, [categoryTree, searchTerm]);

  const toggleExpand = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleDelete = async (categoryId: string, categoryName: string) => {
    setDeletingId(categoryId);
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      toast.success(`Catégorie "${categoryName}" supprimée`);
      router.refresh();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleMainMenu = async (categoryId: string, currentValue: boolean, categoryName: string) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update({ show_in_main_menu: !currentValue })
        .eq('id', categoryId);

      if (error) throw error;

      toast.success(
        !currentValue
          ? `"${categoryName}" ajoutée au menu principal`
          : `"${categoryName}" retirée du menu principal`
      );
      router.refresh();
    } catch (error) {
      console.error('Error toggling main menu:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const renderCategory = (node: CategoryNode, level: number = 0) => {
    const isExpanded = expandedCategories.has(node.id);
    const hasChildren = node.children.length > 0;
    const indent = level * 2;
    const isVisible = node.is_visible !== false;
    const isRootCategory = !node.parent_id;

    return (
      <div key={node.id}>
        <div className={`flex items-center w-full border-b hover:bg-gray-50 transition-colors ${!isVisible ? 'opacity-50' : ''}`}>
          {/* Colonne Nom de la catégorie - 30% */}
          <div className="w-[30%] py-4 px-4" style={{ paddingLeft: `${indent + 1}rem` }}>
            <div className="flex items-center gap-3">
              {hasChildren && (
                <button
                  onClick={() => toggleExpand(node.id)}
                  className="p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-[#d4af37]" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-[#d4af37]" />
                  )}
                </button>
              )}
              {!hasChildren && <div className="w-6" />}

              {node.image_url ? (
                <img
                  src={node.image_url}
                  alt={decodeHtmlEntities(node.name)}
                  className="w-10 h-10 object-cover rounded-lg shadow-sm flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FolderOpen className="h-5 w-5 text-gray-400" />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 truncate">
                  {decodeHtmlEntities(node.name)}
                </p>
                {!isVisible && (
                  <span className="text-xs text-red-600">Masqué</span>
                )}
              </div>
            </div>
          </div>

          {/* Colonne Slug - 20% */}
          <div className="w-[20%] py-4 px-4">
            <code className="text-sm text-gray-600 font-mono bg-gray-50 px-2 py-1 rounded">
              {node.slug}
            </code>
          </div>

          {/* Colonne Menu principal - 10% */}
          <div className="w-[10%] py-4 px-4 text-center">
            {isRootCategory && (
              <button
                onClick={() => toggleMainMenu(node.id, node.show_in_main_menu, node.name)}
                className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all ${
                  node.show_in_main_menu
                    ? 'bg-[#d4af37] border-[#d4af37] hover:bg-[#b8933d]'
                    : 'bg-white border-gray-300 hover:border-[#d4af37]'
                }`}
                title={node.show_in_main_menu ? 'Retirer du menu principal' : 'Ajouter au menu principal'}
              >
                {node.show_in_main_menu && (
                  <Menu className="h-4 w-4 text-white" />
                )}
              </button>
            )}
          </div>

          {/* Colonne Produits - 15% */}
          <div className="w-[15%] py-4 px-4 text-center">
            <div className="flex flex-col gap-1 items-center">
              <Badge variant="secondary" className="bg-[#d4af37]/10 text-[#d4af37] border-[#d4af37]/20">
                {node.productCount}
              </Badge>
              {hasChildren && node.descendantProductCount > node.productCount && (
                <span className="text-xs text-gray-500">
                  ({node.descendantProductCount} total)
                </span>
              )}
            </div>
          </div>

          {/* Colonne Ordre - 10% */}
          <div className="w-[10%] py-4 px-4 text-center">
            <span className="text-sm font-mono text-gray-700 bg-gray-100 px-3 py-1 rounded">
              {node.display_order}
            </span>
          </div>

          {/* Colonne Actions - 15% */}
          <div className="w-[15%] py-4 px-4 text-right">
            <div className="flex items-center justify-end gap-2">
              <Link href={`/admin/categories-management/${node.id}`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-[#d4af37]/10 hover:text-[#d4af37]"
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
                    disabled={deletingId === node.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                      <p>
                        Voulez-vous vraiment supprimer la catégorie <strong>{node.name}</strong> ?
                      </p>
                      {hasChildren && (
                        <p className="text-red-600">
                          Attention : Cette catégorie contient {node.children.length} sous-catégorie(s).
                        </p>
                      )}
                      {node.productCount > 0 && (
                        <p className="text-orange-600">
                          {node.productCount} produit(s) sont associés à cette catégorie.
                        </p>
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(node.id, node.name)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Supprimer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
        {isExpanded && node.children.map(child => renderCategory(child, level + 1))}
      </div>
    );
  };

  const totalCategories = categories.length;
  const displayedCount = filteredTree.length;

  return (
    <div className="space-y-6">
      <Card className="border-[#d4af37]/20 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Rechercher par nom ou slug..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => {
                if (expandedCategories.size === 0) {
                  const allIds = new Set(categories.map(c => c.id));
                  setExpandedCategories(allIds);
                } else {
                  setExpandedCategories(new Set());
                }
              }}
              className="border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/10"
            >
              {expandedCategories.size === 0 ? 'Tout déplier' : 'Tout replier'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {searchTerm && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <p className="text-sm text-blue-700">
            {displayedCount} résultat(s) trouvé(s) pour "{searchTerm}"
          </p>
        </div>
      )}

      <Card className="border-[#d4af37]/20 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {filteredTree.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <FolderOpen className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-700 text-lg font-semibold mb-2">Aucune catégorie trouvée</p>
              <p className="text-gray-500 text-sm">
                {searchTerm ? "Essayez de modifier votre recherche" : "Commencez par créer votre première catégorie"}
              </p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              {/* En-têtes du tableau */}
              <div className="flex items-center w-full bg-gray-50 border-b-2 border-[#d4af37]/20 font-semibold text-gray-700 text-sm">
                <div className="w-[30%] py-3 px-4">
                  <div className="flex items-center gap-2">
                    <FolderTree className="h-4 w-4 text-[#d4af37]" />
                    Catégorie
                  </div>
                </div>
                <div className="w-[20%] py-3 px-4">Slug</div>
                <div className="w-[10%] py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Menu className="h-4 w-4 text-[#d4af37]" />
                    Menu
                  </div>
                </div>
                <div className="w-[15%] py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-[#d4af37]" />
                    Produits
                  </div>
                </div>
                <div className="w-[10%] py-3 px-4 text-center">Ordre</div>
                <div className="w-[15%] py-3 px-4 text-right">Actions</div>
              </div>

              {/* Lignes du tableau */}
              <div className="w-full">
                {filteredTree.map(node => renderCategory(node))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm text-gray-500 bg-gray-50 px-4 py-3 rounded border border-gray-200">
        <div className="flex items-center gap-2">
          <FolderTree className="h-4 w-4 text-[#d4af37]" />
          <span>
            {displayedCount} catégorie(s) affichée(s) sur {totalCategories} au total
          </span>
        </div>
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchTerm("")}
            className="text-[#d4af37] hover:bg-[#d4af37]/10"
          >
            Effacer la recherche
          </Button>
        )}
      </div>
    </div>
  );
}
