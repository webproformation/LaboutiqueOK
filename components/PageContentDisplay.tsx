interface PageContentDisplayProps {
  content: string;
  className?: string;
}

export default function PageContentDisplay({ content, className = '' }: PageContentDisplayProps) {
  if (!content) return null;

  return (
    <div className={`page-content prose prose-lg max-w-none ${className}`}>
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
}
