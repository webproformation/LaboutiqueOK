"use client";

import { Facebook, Twitter, Linkedin, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ShareButtonsProps {
  url: string;
  title: string;
  description?: string;
}

// CORRECTION : export function (Nommée)
export function ShareButtons({ url, title, description }: ShareButtonsProps) {
  const fullUrl = typeof window !== "undefined" ? `${window.location.origin}${url}` : url;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullUrl);
    toast.success("Lien copié dans le presse-papier !");
  };

  const shareLinks = [
    {
      name: "Facebook",
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`,
      color: "hover:text-blue-600",
    },
    {
      name: "Twitter",
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(title)}`,
      color: "hover:text-sky-500",
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      href: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(fullUrl)}&title=${encodeURIComponent(title)}`,
      color: "hover:text-blue-700",
    },
  ];

  return (
    <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
      <span className="text-sm font-medium text-gray-500">Partager :</span>
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopyLink}
          className="h-8 w-8 rounded-full hover:bg-gray-100 text-gray-500"
          title="Copier le lien"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        {shareLinks.map((link) => (
          <a
            key={link.name}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors ${link.color}`}
            title={`Partager sur ${link.name}`}
          >
            <link.icon className="h-4 w-4" />
          </a>
        ))}
      </div>
    </div>
  );
}