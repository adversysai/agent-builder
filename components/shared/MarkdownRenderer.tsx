import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
        // Custom table styling
        table: ({ node, ...props }: any) => (
          <div className="overflow-x-auto my-4">
            <table className="min-w-full border-collapse border border-border-faint" {...props} />
          </div>
        ),
        thead: ({ node, ...props }: any) => (
          <thead className="bg-background-base" {...props} />
        ),
        th: ({ node, ...props }: any) => (
          <th className="border border-border-faint px-12 py-8 text-left text-body-small font-medium text-accent-black" {...props} />
        ),
        td: ({ node, ...props }: any) => (
          <td className="border border-border-faint px-12 py-8 text-body-small text-accent-black" {...props} />
        ),
        // Code block with syntax highlighting
        code: ({ node, className, children, ...props }: any) => {
          const match = /language-(\w+)/.exec(className || '');
          const inline = !match;
          return !inline && match ? (
            <SyntaxHighlighter
              style={oneDark}
              language={match[1]}
              PreTag="div"
              className="rounded-8 my-4"
              {...props}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code className="bg-background-base px-4 py-2 rounded-4 text-xs font-mono" {...props}>
              {children}
            </code>
          );
        },
        // Custom paragraph styling
        p: ({ node, ...props }: any) => (
          <p className="my-2 leading-relaxed" {...props} />
        ),
        // Custom list styling
        ul: ({ node, ...props }: any) => (
          <ul className="list-disc list-inside my-2 space-y-1" {...props} />
        ),
        ol: ({ node, ...props }: any) => (
          <ol className="list-decimal list-inside my-2 space-y-1" {...props} />
        ),
        // Custom heading styling
        h1: ({ node, ...props }: any) => (
          <h1 className="text-title-h1 text-accent-black font-bold my-4" {...props} />
        ),
        h2: ({ node, ...props }: any) => (
          <h2 className="text-title-h2 text-accent-black font-semibold my-3" {...props} />
        ),
        h3: ({ node, ...props }: any) => (
          <h3 className="text-title-h3 text-accent-black font-semibold my-2" {...props} />
        ),
        // Custom blockquote styling
        blockquote: ({ node, ...props }: any) => (
          <blockquote className="border-l-4 border-heat-100 pl-4 my-4 italic text-black-alpha-64" {...props} />
        ),
        // Custom strong/bold styling
        strong: ({ node, ...props }: any) => (
          <strong className="font-semibold text-accent-black" {...props} />
        ),
        // Custom emphasis/italic styling
        em: ({ node, ...props }: any) => (
          <em className="italic text-black-alpha-80" {...props} />
        ),
      }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
