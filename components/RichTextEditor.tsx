'use client';

import { Textarea } from '@/components/ui/textarea';

interface RichTextEditorProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}

export default function RichTextEditor({
  id,
  value,
  onChange,
  rows = 8,
  placeholder
}: RichTextEditorProps) {
  return (
    <Textarea
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className="font-mono text-sm"
    />
  );
}
