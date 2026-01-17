"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  ShoppingCart,
  Tag,
  Star,
  Home,
  Sparkles,
  Gift,
  Users,
  Crown,
  FileText,
  Image as ImageIcon,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  ArrowLeft,
  Truck,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NavSection {
  title: string;
  icon: React.ElementType;
  items: { href: string; label: string }[];
}

const navSections: NavSection[] = [
  {
    title: "Tableau de bord",
    icon: LayoutDashboard,
    items: [{ href: "/admin", label: "Vue d'ensemble" }],
  },
  {
    title: "Boutique",
    icon: ShoppingBag,
    items: [
      { href: "/admin/products", label: "Produits" },
      { href: "/admin/product-attributes", label: "Attributs" },
      { href: "/admin/categories-management", label: "Catégories" },
      { href: "/admin/orders", label: "Commandes" },
      { href: "/admin/invoices", label: "Factures" },
      { href: "/admin/coupons", label: "Coupons" },
      { href: "/admin/gift-cards", label: "Cartes Cadeaux" },
      { href: "/admin/reviews", label: "Avis clients" },
      { href: "/admin/looks-management", label: "Les Looks" },
      { href: "/admin/payment-methods", label: "Méthodes de paiement" },
    ],
  },
  {
    title: "Livraisons",
    icon: Truck,
    items: [
      { href: "/admin/shipping-methods", label: "Méthodes de livraison" },
      { href: "/admin/expeditions", label: "Expéditions" },
      { href: "/admin/open-packages", label: "Colis Ouverts" },
      { href: "/admin/returns-management", label: "Retours" },
    ],
  },
  {
    title: "Accueil",
    icon: Home,
    items: [
      { href: "/admin/slides", label: "Slides" },
      { href: "/admin/home-categories", label: "Catégories Accueil" },
      { href: "/admin/featured-products", label: "Produits Vedettes" },
    ],
  },
  {
    title: "Actualités",
    icon: FileText,
    items: [
      { href: "/admin/actualites", label: "Articles" },
      { href: "/admin/actualites/new", label: "Nouvel article" },
      { href: "/admin/actualites/categories", label: "Catégories" },
    ],
  },
  {
    title: "Les Lives",
    icon: Video,
    items: [
      { href: "/admin/lives", label: "Tous les lives" },
      { href: "/admin/lives/new", label: "Nouveau live" },
      { href: "/admin/lives/obs-settings", label: "Paramètres OBS" },
    ],
  },
  {
    title: "Fidélité & Jeux",
    icon: Gift,
    items: [
      { href: "/admin/loyalty", label: "Gestion des points" },
      { href: "/admin/wheel", label: "Roue de la fortune" },
      { href: "/admin/card-flip", label: "Jeux de cartes" },
    ],
  },
  {
    title: "Site",
    icon: Users,
    items: [
      { href: "/admin/site-pages", label: "Gestion des Pages SEO" },
      { href: "/admin/clients", label: "Clients" },
      { href: "/admin/guestbook", label: "Livre d'Or" },
      { href: "/admin/ambassador", label: "Ambassadrice" },

      { href: "/admin/media", label: "Médiathèque" },
      { href: "/admin/sauvegarde", label: "Sauvegardes" },
    ],
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>([
    "Tableau de bord",
    "Boutique",
  ]);
  const pathname = usePathname();

  const toggleSection = (title: string) => {
    setExpandedSections((prev) => {
      if (prev.includes(title)) {
        return prev.filter((t) => t !== title);
      } else {
        return [title];
      }
    });
  };

  const handleNavClick = (sectionTitle: string) => {
    setExpandedSections([sectionTitle]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-blue-900 text-white flex items-center justify-between px-3 z-50 shadow-lg">
        <h1 className="text-base font-bold truncate flex-1">Admin - LBDM</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-white hover:bg-blue-800 h-11 w-11 flex-shrink-0"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-72 bg-blue-900 text-white transition-transform duration-300 z-[9999] overflow-y-auto shadow-2xl",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0 lg:w-64"
        )}
      >
        <div className="p-6 border-b border-blue-800">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-blue-200 hover:text-white transition-colors"
              title="Retour à l'accueil"
            >
              <ArrowLeft size={20} />
              <span className="text-sm">Accueil du site</span>
            </Link>
          </div>
          <h1 className="text-xl font-bold">La Boutique de Morgane</h1>
          <p className="text-sm text-blue-200 mt-1">Administration</p>
        </div>

        <nav className="p-4 space-y-2">
          {navSections.map((section) => {
            const isExpanded = expandedSections.includes(section.title);
            const Icon = section.icon;

            return (
              <div key={section.title}>
                <button
                  onClick={() => toggleSection(section.title)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-blue-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Icon size={20} />
                    <span className="font-medium">{section.title}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>

                {isExpanded && (
                  <div className="ml-4 mt-1 space-y-1">
                    {section.items.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => {
                            handleNavClick(section.title);
                            setSidebarOpen(false);
                          }}
                          className={cn(
                            "block px-3 py-2 rounded-lg text-sm transition-colors",
                            isActive
                              ? "bg-blue-700 text-white font-medium"
                              : "text-blue-100 hover:bg-blue-800"
                          )}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-[9998] lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen pt-14 lg:pt-0">
        <div className="p-3 md:p-6 max-w-[1800px] mx-auto w-full">{children}</div>
      </main>
    </div>
  );
}
