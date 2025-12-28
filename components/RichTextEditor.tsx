"use client";

import { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link2,
  Sparkles
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  id?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Entrez le contenu...',
  rows = 6,
  id
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const insertLink = () => {
    const url = prompt('Entrez l\'URL du lien:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const toolbarButtonClass = "h-9 w-9 hover:bg-[#b8933d]/10 hover:text-[#b8933d] transition-colors";

  return (
    <div className="space-y-3">
      <div className="border-2 border-[#b8933d]/20 rounded-lg p-3 bg-gradient-to-r from-[#b8933d]/5 to-amber-50/50 shadow-sm">
        <div className="flex flex-wrap gap-1">
          <div className="flex gap-1 items-center">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onMouseDown={(e) => {
                e.preventDefault();
                execCommand('bold');
              }}
              className={toolbarButtonClass}
              title="Gras"
            >
              <Bold className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onMouseDown={(e) => {
                e.preventDefault();
                execCommand('italic');
              }}
              className={toolbarButtonClass}
              title="Italique"
            >
              <Italic className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onMouseDown={(e) => {
                e.preventDefault();
                execCommand('underline');
              }}
              className={toolbarButtonClass}
              title="Souligné"
            >
              <Underline className="w-4 h-4" />
            </Button>
          </div>

          <div className="w-px h-8 bg-[#b8933d]/30 mx-1" />

          <div className="flex gap-1 items-center">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onMouseDown={(e) => {
                e.preventDefault();
                execCommand('formatBlock', 'h2');
              }}
              className={toolbarButtonClass}
              title="Titre H2"
            >
              <Heading2 className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onMouseDown={(e) => {
                e.preventDefault();
                execCommand('formatBlock', 'h3');
              }}
              className={toolbarButtonClass}
              title="Titre H3"
            >
              <Heading3 className="w-4 h-4" />
            </Button>
          </div>

          <div className="w-px h-8 bg-[#b8933d]/30 mx-1" />

          <div className="flex gap-1 items-center">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onMouseDown={(e) => {
                e.preventDefault();
                execCommand('insertUnorderedList');
              }}
              className={toolbarButtonClass}
              title="Liste à puces"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onMouseDown={(e) => {
                e.preventDefault();
                execCommand('insertOrderedList');
              }}
              className={toolbarButtonClass}
              title="Liste numérotée"
            >
              <ListOrdered className="w-4 h-4" />
            </Button>
          </div>

          <div className="w-px h-8 bg-[#b8933d]/30 mx-1" />

          <div className="flex gap-1 items-center">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onMouseDown={(e) => {
                e.preventDefault();
                execCommand('justifyLeft');
              }}
              className={toolbarButtonClass}
              title="Aligner à gauche"
            >
              <AlignLeft className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onMouseDown={(e) => {
                e.preventDefault();
                execCommand('justifyCenter');
              }}
              className={toolbarButtonClass}
              title="Centrer"
            >
              <AlignCenter className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onMouseDown={(e) => {
                e.preventDefault();
                execCommand('justifyRight');
              }}
              className={toolbarButtonClass}
              title="Aligner à droite"
            >
              <AlignRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="w-px h-8 bg-[#b8933d]/30 mx-1" />

          <Button
            type="button"
            size="sm"
            variant="ghost"
            onMouseDown={(e) => {
              e.preventDefault();
              insertLink();
            }}
            className={toolbarButtonClass}
            title="Insérer un lien"
          >
            <Link2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="prose prose-sm max-w-none p-6 border-2 rounded-lg min-h-[150px] bg-white focus:outline-none focus:ring-2 focus:ring-[#b8933d] focus:border-transparent"
        data-placeholder={placeholder}
        style={{
          minHeight: `${rows * 28}px`,
        }}
      />

      <div className="flex items-start gap-2 p-3 bg-gradient-to-r from-[#b8933d]/10 to-amber-50 border border-[#b8933d]/20 rounded-lg">
        <Sparkles className="w-4 h-4 text-[#b8933d] mt-0.5 flex-shrink-0" />
        <p className="text-xs text-gray-700">
          <strong>Astuce :</strong> Tapez votre texte directement. Sélectionnez du texte et utilisez les boutons pour le formater (gras, italique, titres, listes, etc.).
        </p>
      </div>

      <style jsx>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          font-style: italic;
        }
        [contenteditable] {
          outline: none;
        }
      `}</style>
    </div>
  );
}
