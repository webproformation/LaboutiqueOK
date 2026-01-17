'use client';

import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Eye,
  Edit as EditIcon,
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
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [isUserEditing, setIsUserEditing] = useState(false);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (!editorRef.current) return;

    const currentContent = editorRef.current.innerHTML;
    const newValue = value || '';

    const normalizeHtml = (html: string) => {
      return html.trim().replace(/\s+/g, ' ');
    };

    const isDifferent = normalizeHtml(currentContent) !== normalizeHtml(newValue);

    if (isInitialMount.current || (!isUserEditing && isDifferent)) {
      editorRef.current.innerHTML = newValue;
      isInitialMount.current = false;
    }
  }, [value, isUserEditing]);

  const executeCommand = (command: string, value: string | undefined = undefined) => {
    setIsUserEditing(true);
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateContent();
  };

  const updateContent = () => {
    if (editorRef.current) {
      setIsUserEditing(true);
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleEditorFocus = () => {
    setIsFocused(true);
    setIsUserEditing(true);
  };

  const handleEditorBlur = () => {
    setIsFocused(false);
    setTimeout(() => setIsUserEditing(false), 100);
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
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'edit' | 'preview')} className="w-full">
        <div className="bg-gray-50 border-b border-[#d4af37]/30 p-2 flex flex-col md:flex-row md:items-center gap-2">
          <div className="flex flex-wrap gap-1 flex-1 overflow-x-auto">
            {toolbarButtons.map((button, index) => {
              if ('separator' in button && button.separator) {
                return (
                  <Separator
                    key={`separator-${index}`}
                    orientation="vertical"
                    className="mx-1 h-6 bg-[#d4af37]/30 hidden md:block"
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
                  className="h-8 w-8 p-0 hover:bg-[#d4af37]/20 hover:text-[#d4af37] text-gray-600 flex-shrink-0"
                >
                  <Icon className="h-4 w-4" />
                </Button>
              );
            })}
          </div>

          <TabsList className="bg-[#d4af37]/10 w-full md:w-auto">
            <TabsTrigger value="edit" className="data-[state=active]:bg-[#d4af37] data-[state=active]:text-white flex-1 md:flex-initial">
              <EditIcon className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Édition</span>
            </TabsTrigger>
            <TabsTrigger value="preview" className="data-[state=active]:bg-[#d4af37] data-[state=active]:text-white flex-1 md:flex-initial">
              <Eye className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Prévisualisation</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="edit" className="m-0">
          <div
            ref={editorRef}
            contentEditable
            onInput={updateContent}
            onFocus={handleEditorFocus}
            onBlur={handleEditorBlur}
            className="min-h-[400px] p-8 focus:outline-none"
            style={{
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
            }}
            data-placeholder={placeholder}
          />
        </TabsContent>

        <TabsContent value="preview" className="m-0">
          <div className="min-h-[400px] p-8 bg-gradient-to-b from-white to-[#F2F2E8]">
            <div className="max-w-4xl mx-auto">
              <div
                className="page-content prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: value }}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <style jsx global>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
          position: absolute;
          font-style: italic;
        }

        [contenteditable] h1 {
          font-size: 2.5rem;
          font-weight: 800;
          line-height: 1.2;
          margin: 1.5rem 0 1rem 0;
          color: #d4af37;
          font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
          text-align: center;
        }

        [contenteditable] h2 {
          font-size: 2rem;
          font-weight: 700;
          line-height: 1.3;
          margin: 1.25rem 0 0.875rem 0;
          color: #d4af37;
          font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
        }

        [contenteditable] h3 {
          font-size: 1.5rem;
          font-weight: 600;
          line-height: 1.4;
          margin: 1rem 0 0.75rem 0;
          color: #d4af37;
          font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
        }

        [contenteditable] p {
          font-size: 1.125rem;
          line-height: 1.75;
          margin: 1.25rem 0;
          color: #374151;
        }

        [contenteditable] ul,
        [contenteditable] ol {
          margin: 1.25rem 0;
          padding-left: 2rem;
          font-size: 1.125rem;
          line-height: 1.75;
          color: #374151;
        }

        [contenteditable] ul {
          list-style-type: disc;
        }

        [contenteditable] ol {
          list-style-type: decimal;
        }

        [contenteditable] li {
          margin: 0.5rem 0;
        }

        [contenteditable] blockquote {
          border-left: 4px solid #d4af37;
          padding-left: 1.5rem;
          margin: 1.5rem 0;
          color: #6b7280;
          font-style: italic;
          font-size: 1.125rem;
          line-height: 1.75;
        }

        [contenteditable] pre {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 1.25rem;
          overflow-x: auto;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.875rem;
          color: #1f2937;
          margin: 1.5rem 0;
        }

        [contenteditable] a {
          color: #d4af37;
          text-decoration: underline;
          font-weight: 500;
          transition: color 0.2s;
        }

        [contenteditable] a:hover {
          color: #b8933d;
        }

        [contenteditable] img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1.5rem 0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        [contenteditable] strong,
        [contenteditable] b {
          font-weight: 700;
          color: #111827;
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
