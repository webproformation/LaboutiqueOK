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
  GripVertical
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

    return (
      <div key={node.id}>
        <TableRow className="hover:bg-gray-50 transition-colors">
          <TableCell style={{ width: '40%', paddingLeft: `${indent + 1}rem` }}>
            <div className="flex items-center gap-2">
              {level > 0 && (
                <div className="w-4 h-4 border-l-2 border-b-2 border-gray-300 rounded-bl-lg -ml-2" />
              )}
              {hasChildren && (
                <button
                  onClick={() => toggleExpand(node.id)}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-gray-600" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-600" />
                  )}
                </button>
              )}
              {!hasChildren && <div className="w-6" />}
              {node.image_url ? (
                <img
                  src={node.image_url}
                  alt={decodeHtmlEntities(node.name)}
                  className="w-10 h-10 object-cover rounded-lg shadow-sm"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center shadow-sm">
                  <FolderOpen className="h-5 w-5 text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 flex items-center gap-2">
                  {decodeHtmlEntities(node.name)}
                  {level > 0 && (
                    <Badge variant="outline" className="text-xs">
                      Sous-catégorie
                    </Badge>
                  )}
                </div>
                {node.description && (
                  <div className="text-xs text-gray-500 truncate max-w-md mt-0.5">
                    {decodeHtmlEntities(node.description)}
                  </div>
                )}
              </div>
            </div>
          </TableCell>
          <TableCell style={{ width: '20%' }}>
            <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono break-all">
              {node.slug}
            </code>
          </TableCell>
          <TableCell style={{ width: '15%' }}>
            <div className="flex flex-col gap-1">
              <Badge variant="secondary" className="w-fit">
                {node.productCount} direct{node.productCount > 1 ? 's' : ''}
              </Badge>
              {hasChildren && node.descendantProductCount > node.productCount && (
                <Badge variant="outline" className="w-fit text-xs">
                  {node.descendantProductCount} total
                </Badge>
              )}
            </div>
          </TableCell>
          <TableCell style={{ width: '10%' }}>
            <div className="flex items-center gap-1 text-gray-500">
              <GripVertical className="h-4 w-4" />
              <span className="text-sm font-mono">{node.display_order}</span>
            </div>
          </TableCell>
          <TableCell className="text-right" style={{ width: '15%' }}>
            <div className="flex items-center justify-end gap-2">
              <Link href={`/admin/categories-management/${node.id}`}>
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
                    disabled={deletingId === node.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                    <AlertDialogDescription>
                      Voulez-vous vraiment supprimer la catégorie "{node.name}" ?
                      {hasChildren && (
                        <span className="block mt-2 text-red-600 font-medium">
                          Attention : Cette catégorie contient {node.children.length} sous-catégorie(s).
                        </span>
                      )}
                      {node.productCount > 0 && (
                        <span className="block mt-2 text-orange-600 font-medium">
                          {node.productCount} produit(s) sont associés à cette catégorie.
                        </span>
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
          </TableCell>
        </TableRow>
        {isExpanded && node.children.map(child => renderCategory(child, level + 1))}
      </div>
    );
  };

  const totalCategories = categories.length;
  const displayedCount = filteredTree.length;

  return (
    <div className="space-y-4">
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher une catégorie..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (expandedCategories.size === 0) {
                  const allIds = new Set(categories.map(c => c.id));
                  setExpandedCategories(allIds);
                } else {
                  setExpandedCategories(new Set());
                }
              }}
            >
              {expandedCategories.size === 0 ? 'Tout déplier' : 'Tout replier'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm text-gray-600">
        <div>
          {displayedCount} catégorie(s) principale(s) • {totalCategories} total
        </div>
      </div>

      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-0">
          {filteredTree.length === 0 ? (
            <div className="text-center py-16">
              <FolderOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 text-lg">Aucune catégorie trouvée</p>
              <p className="text-gray-400 text-sm mt-1">
                Essayez de modifier votre recherche
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="w-full">
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold" style={{ width: '40%' }}>Catégorie</TableHead>
                    <TableHead className="font-semibold" style={{ width: '20%' }}>Slug</TableHead>
                    <TableHead className="font-semibold" style={{ width: '15%' }}>Produits</TableHead>
                    <TableHead className="font-semibold" style={{ width: '10%' }}>Ordre</TableHead>
                    <TableHead className="text-right font-semibold" style={{ width: '15%' }}>Actions</TableHead>
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
    </div>
  );
}
