'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  display_order: number | null;
  children?: Category[];
}

interface HierarchicalCategorySelectorProps {
  selectedCategories: string[];
  onCategoriesChange: (categoryIds: string[]) => void;
}

export default function HierarchicalCategorySelector({
  selectedCategories,
  onCategoriesChange,
}: HierarchicalCategorySelectorProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;

      if (data) {
        const hierarchical = buildHierarchy(data);
        setCategories(hierarchical);

        // Auto-expand nodes with selected children
        const toExpand = new Set<string>();
        data.forEach(cat => {
          if (selectedCategories.includes(cat.id) && cat.parent_id) {
            toExpand.add(cat.parent_id);
          }
        });
        setExpandedNodes(toExpand);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Erreur lors du chargement des catégories');
    } finally {
      setLoading(false);
    }
  };

  const buildHierarchy = (flatCategories: Category[]): Category[] => {
    const map = new Map<string, Category>();
    const roots: Category[] = [];

    flatCategories.forEach(cat => {
      map.set(cat.id, { ...cat, children: [] });
    });

    flatCategories.forEach(cat => {
      const category = map.get(cat.id)!;
      if (cat.parent_id && map.has(cat.parent_id)) {
        map.get(cat.parent_id)!.children!.push(category);
      } else {
        roots.push(category);
      }
    });

    return roots;
  };

  const handleToggle = (categoryId: string) => {
    const newSelected = selectedCategories.includes(categoryId)
      ? selectedCategories.filter(id => id !== categoryId)
      : [...selectedCategories, categoryId];

    onCategoriesChange(newSelected);
  };

  const toggleExpand = (categoryId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedNodes(newExpanded);
  };

  const renderCategory = (category: Category, level: number = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedNodes.has(category.id);
    const isSelected = selectedCategories.includes(category.id);

    return (
      <div key={category.id} className="select-none">
        <div
          className={`
            flex items-center gap-2 py-2 px-2 rounded
            hover:bg-gray-50 transition-colors
            ${isSelected ? 'bg-amber-50' : ''}
          `}
          style={{ paddingLeft: `${level * 24 + 8}px` }}
        >
          {hasChildren ? (
            <button
              type="button"
              onClick={() => toggleExpand(category.id)}
              className="p-0.5 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-600" />
              )}
            </button>
          ) : (
            <div className="w-5" />
          )}

          <Checkbox
            id={`cat-${category.id}`}
            checked={isSelected}
            onCheckedChange={() => handleToggle(category.id)}
          />

          <Label
            htmlFor={`cat-${category.id}`}
            className={`
              cursor-pointer flex-1 text-sm
              ${level === 0 ? 'font-semibold text-gray-900' : ''}
              ${level === 1 ? 'font-medium text-gray-700' : ''}
              ${level >= 2 ? 'text-gray-600' : ''}
            `}
          >
            {category.name}
            {isSelected && (
              <span className="ml-2 text-xs text-[#d4af37]">✓</span>
            )}
          </Label>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {category.children!.map(child => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="bg-white">
        <CardContent className="py-8">
          <p className="text-center text-gray-500">Chargement des catégories...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="text-[#d4af37]">Catégories</CardTitle>
        <CardDescription>
          Sélectionnez les catégories auxquelles appartient ce produit. Structure hiérarchique affichée.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border border-gray-200 rounded-lg p-2 max-h-96 overflow-y-auto">
          {categories.length > 0 ? (
            categories.map(cat => renderCategory(cat, 0))
          ) : (
            <p className="text-center text-gray-500 py-4">
              Aucune catégorie disponible
            </p>
          )}
        </div>

        {selectedCategories.length > 0 && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-900 font-medium">
              {selectedCategories.length} catégorie(s) sélectionnée(s)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
