'use client';

import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react';

interface RichTextEditorProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({
  id,
  value,
  onChange,
  placeholder = 'Commencez à écrire...'
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const executeCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateContent();
  };

  const updateContent = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const insertLink = () => {
    const url = prompt('Entrez l\'URL du lien:');
    if (url) {
      executeCommand('createLink', url);
    }
  };

  const insertImage = () => {
    const url = prompt('Entrez l\'URL de l\'image:');
    if (url) {
      executeCommand('insertImage', url);
    }
  };

  const formatBlock = (tag: string) => {
    executeCommand('formatBlock', tag);
  };

  const toolbarButtons = [
    {
      icon: Bold,
      command: () => executeCommand('bold'),
      title: 'Gras (Ctrl+B)',
    },
    {
      icon: Italic,
      command: () => executeCommand('italic'),
      title: 'Italique (Ctrl+I)',
    },
    {
      icon: Underline,
      command: () => executeCommand('underline'),
      title: 'Souligné (Ctrl+U)',
    },
    {
      separator: true,
    },
    {
      icon: Heading1,
      command: () => formatBlock('h1'),
      title: 'Titre 1',
    },
    {
      icon: Heading2,
      command: () => formatBlock('h2'),
      title: 'Titre 2',
    },
    {
      icon: Heading3,
      command: () => formatBlock('h3'),
      title: 'Titre 3',
    },
    {
      separator: true,
    },
    {
      icon: AlignLeft,
      command: () => executeCommand('justifyLeft'),
      title: 'Aligner à gauche',
    },
    {
      icon: AlignCenter,
      command: () => executeCommand('justifyCenter'),
      title: 'Centrer',
    },
    {
      icon: AlignRight,
      command: () => executeCommand('justifyRight'),
      title: 'Aligner à droite',
    },
    {
      separator: true,
    },
    {
      icon: List,
      command: () => executeCommand('insertUnorderedList'),
      title: 'Liste à puces',
    },
    {
      icon: ListOrdered,
      command: () => executeCommand('insertOrderedList'),
      title: 'Liste numérotée',
    },
    {
      separator: true,
    },
    {
      icon: Quote,
      command: () => formatBlock('blockquote'),
      title: 'Citation',
    },
    {
      icon: Code,
      command: () => formatBlock('pre'),
      title: 'Code',
    },
    {
      separator: true,
    },
    {
      icon: LinkIcon,
      command: insertLink,
      title: 'Insérer un lien',
    },
    {
      icon: ImageIcon,
      command: insertImage,
      title: 'Insérer une image',
    },
  ];

  return (
    <div className={`border rounded-lg overflow-hidden bg-white transition-colors ${
      isFocused ? 'border-[#d4af37] ring-1 ring-[#d4af37]' : 'border-[#d4af37]/30'
    }`}>
      <div className="bg-gray-50 border-b border-[#d4af37]/30 p-2 flex flex-wrap gap-1">
        {toolbarButtons.map((button, index) => {
          if ('separator' in button && button.separator) {
            return (
              <Separator
                key={`separator-${index}`}
                orientation="vertical"
                className="mx-1 h-6 bg-[#d4af37]/30"
              />
            );
          }

          const Icon = button.icon!;
          return (
            <Button
              key={index}
              type="button"
              variant="ghost"
              size="sm"
              onClick={button.command}
              title={button.title}
              className="h-8 w-8 p-0 hover:bg-[#d4af37]/20 hover:text-[#d4af37] text-gray-600"
            >
              <Icon className="h-4 w-4" />
            </Button>
          );
        })}
      </div>

      <div
        ref={editorRef}
        contentEditable
        onInput={updateContent}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="min-h-[300px] p-4 prose max-w-none focus:outline-none text-gray-900"
        style={{
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
        }}
        data-placeholder={placeholder}
      />

      <style jsx global>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #6b7280;
          pointer-events: none;
          position: absolute;
        }

        [contenteditable] h1 {
          font-size: 2em;
          font-weight: bold;
          margin: 0.67em 0;
          color: #d4af37;
        }

        [contenteditable] h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 0.75em 0;
          color: #d4af37;
        }

        [contenteditable] h3 {
          font-size: 1.17em;
          font-weight: bold;
          margin: 0.83em 0;
          color: #d4af37;
        }

        [contenteditable] p {
          margin: 1em 0;
          color: #1f2937;
        }

        [contenteditable] ul,
        [contenteditable] ol {
          margin: 1em 0;
          padding-left: 2em;
        }

        [contenteditable] ul {
          list-style-type: disc;
        }

        [contenteditable] ol {
          list-style-type: decimal;
        }

        [contenteditable] blockquote {
          border-left: 4px solid #d4af37;
          padding-left: 1em;
          margin: 1em 0;
          color: #6b7280;
          font-style: italic;
        }

        [contenteditable] pre {
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          padding: 1em;
          overflow-x: auto;
          font-family: monospace;
          color: #1f2937;
        }

        [contenteditable] a {
          color: #d4af37;
          text-decoration: underline;
        }

        [contenteditable] img {
          max-width: 100%;
          height: auto;
          border-radius: 0.375rem;
          margin: 1em 0;
        }

        [contenteditable] strong,
        [contenteditable] b {
          font-weight: bold;
        }

        [contenteditable] em,
        [contenteditable] i {
          font-style: italic;
        }

        [contenteditable] u {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
