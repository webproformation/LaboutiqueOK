"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  GripVertical,
  FolderTree,
  ShoppingBag
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

  const renderCategory = (node: CategoryNode, level: number = 0) => {
    const isExpanded = expandedCategories.has(node.id);
    const hasChildren = node.children.length > 0;
    const indent = level * 2.5;
    const isVisible = node.is_visible !== false;

    return (
      <div key={node.id}>
        <TableRow className={`hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent transition-all duration-200 ${!isVisible ? 'opacity-60' : ''}`}>
          <TableCell className="w-[40%]" style={{ paddingLeft: `${indent + 1}rem` }}>
            <div className="flex items-center gap-3">
              {level > 0 && (
                <div className="w-4 h-4 border-l-2 border-b-2 border-[#d4af37]/30 rounded-bl-lg -ml-2" />
              )}
              {hasChildren && (
                <button
                  onClick={() => toggleExpand(node.id)}
                  className="p-1.5 hover:bg-[#d4af37]/10 rounded-lg transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-[#d4af37]" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-[#d4af37]" />
                  )}
                </button>
              )}
              {!hasChildren && <div className="w-7" />}
              {node.image_url ? (
                <div className="relative group">
                  <img
                    src={node.image_url}
                    alt={decodeHtmlEntities(node.name)}
                    className="w-12 h-12 object-cover rounded-xl shadow-md ring-2 ring-[#d4af37]/20 group-hover:ring-[#d4af37]/40 transition-all"
                  />
                  {!isVisible && (
                    <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
                      <span className="text-white text-xs font-bold">Masqué</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center shadow-md">
                  <FolderOpen className="h-6 w-6 text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900 text-base">
                    {decodeHtmlEntities(node.name)}
                  </span>
                  {level > 0 && (
                    <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 bg-blue-50">
                      Sous-catégorie
                    </Badge>
                  )}
                  {!isVisible && (
                    <Badge variant="outline" className="text-xs border-red-300 text-red-700 bg-red-50">
                      Masqué
                    </Badge>
                  )}
                  {node.meta_title && (
                    <Badge variant="outline" className="text-xs border-green-300 text-green-700 bg-green-50">
                      SEO
                    </Badge>
                  )}
                </div>
                {node.description && (
                  <div className="text-xs text-gray-500 truncate max-w-md mt-1 leading-relaxed">
                    {decodeHtmlEntities(node.description)}
                  </div>
                )}
              </div>
            </div>
          </TableCell>
          <TableCell className="w-[20%]">
            <div className="flex flex-col gap-1">
              <code className="text-xs bg-gray-100 px-2.5 py-1.5 rounded-lg font-mono break-all border border-gray-200">
                {node.slug}
              </code>
            </div>
          </TableCell>
          <TableCell className="w-[15%]">
            <div className="flex flex-col gap-1.5">
              <Badge variant="secondary" className="w-fit bg-[#d4af37]/10 text-[#d4af37] border-[#d4af37]/20 font-semibold">
                {node.productCount} {node.productCount > 1 ? 'produits' : 'produit'}
              </Badge>
              {hasChildren && node.descendantProductCount > node.productCount && (
                <Badge variant="outline" className="w-fit text-xs text-gray-600">
                  {node.descendantProductCount} au total
                </Badge>
              )}
            </div>
          </TableCell>
          <TableCell className="w-[10%]">
            <div className="flex items-center gap-2 text-gray-600">
              <GripVertical className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded-md">{node.display_order}</span>
            </div>
          </TableCell>
          <TableCell className="text-right w-[15%]">
            <div className="flex items-center justify-end gap-2">
              <Link href={`/admin/categories-management/${node.id}`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-gradient-to-r hover:from-[#b8933d]/10 hover:to-[#d4af37]/10 hover:text-[#d4af37] transition-all shadow-sm"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  <span className="text-xs">Modifier</span>
                </Button>
              </Link>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:bg-red-50 hover:text-red-600 transition-all shadow-sm"
                    disabled={deletingId === node.id}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    <span className="text-xs">Supprimer</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-md">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl">Confirmer la suppression</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-3">
                      <p className="text-base">
                        Voulez-vous vraiment supprimer la catégorie <span className="font-semibold text-gray-900">"{node.name}"</span> ?
                      </p>
                      {hasChildren && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
                          <p className="text-red-700 font-medium text-sm">
                            Attention : Cette catégorie contient {node.children.length} sous-catégorie(s).
                          </p>
                        </div>
                      )}
                      {node.productCount > 0 && (
                        <div className="bg-orange-50 border-l-4 border-orange-500 p-3 rounded">
                          <p className="text-orange-700 font-medium text-sm">
                            {node.productCount} produit(s) sont associés à cette catégorie.
                          </p>
                        </div>
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(node.id, node.name)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Supprimer définitivement
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </TableCell>
        </TableRow>
        {isExpanded && node.children.map(child => renderCategory(child, level + 1))}
      </div>
    );
  };

  const totalCategories = categories.length;
  const displayedCount = filteredTree.length;

  return (
    <div className="space-y-5">
      <Card className="border-[#d4af37]/20 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#d4af37] h-5 w-5" />
              <Input
                placeholder="Rechercher par nom, slug ou description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 py-6 text-base border-[#d4af37]/20 focus:border-[#d4af37] focus:ring-[#d4af37]/20"
              />
            </div>
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                if (expandedCategories.size === 0) {
                  const allIds = new Set(categories.map(c => c.id));
                  setExpandedCategories(allIds);
                } else {
                  setExpandedCategories(new Set());
                }
              }}
              className="border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/10 hover:border-[#d4af37] transition-all"
            >
              {expandedCategories.size === 0 ? 'Tout déplier' : 'Tout replier'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {searchTerm && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
          <p className="text-sm text-blue-700">
            <span className="font-semibold">{displayedCount}</span> résultat(s) trouvé(s) pour "<span className="font-semibold">{searchTerm}</span>"
          </p>
        </div>
      )}

      <Card className="border-[#d4af37]/20 shadow-lg overflow-hidden">
        <CardContent className="p-0">
          {filteredTree.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                <FolderOpen className="h-10 w-10 text-gray-400" />
              </div>
              <p className="text-gray-700 text-xl font-semibold mb-2">Aucune catégorie trouvée</p>
              <p className="text-gray-500 text-sm">
                {searchTerm ? "Essayez de modifier votre recherche" : "Commencez par créer votre première catégorie"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="w-full table-fixed">
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-[#d4af37]/20">
                    <TableHead className="font-bold text-gray-700 text-sm w-[40%]">
                      <div className="flex items-center gap-2">
                        <FolderTree className="h-4 w-4 text-[#d4af37]" />
                        Catégorie
                      </div>
                    </TableHead>
                    <TableHead className="font-bold text-gray-700 text-sm w-[20%]">Slug</TableHead>
                    <TableHead className="font-bold text-gray-700 text-sm w-[15%]">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4 text-[#d4af37]" />
                        Produits
                      </div>
                    </TableHead>
                    <TableHead className="font-bold text-gray-700 text-sm w-[10%]">Ordre</TableHead>
                    <TableHead className="text-right font-bold text-gray-700 text-sm w-[15%]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTree.map(node => renderCategory(node))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm text-gray-500 bg-gray-50 px-4 py-3 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2">
          <FolderTree className="h-4 w-4 text-[#d4af37]" />
          <span>
            <span className="font-semibold text-gray-700">{displayedCount}</span> catégorie(s) principale(s) affichée(s) sur <span className="font-semibold text-gray-700">{totalCategories}</span> au total
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
