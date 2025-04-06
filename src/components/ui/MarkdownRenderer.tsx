import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownRendererProps {
  content: string | null;
}

// Wrapper component to prevent data attributes from being passed to React.Fragment
const SafeWrapper: React.FC<{children: React.ReactNode}> = ({children}) => {
  return <div className="markdown-content">{children}</div>;
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  if (!content) return null;
  
  return (
    <SafeWrapper>
      <ReactMarkdown 
        components={{
          a: ({ children, ...props }) => (
            <a 
              {...props} 
              className="text-blue-600 hover:underline" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          h2: ({ children, ...props }) => (
            <h2 {...props} className="text-lg font-bold mt-6 mb-2">
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 {...props} className="text-md font-semibold mt-4 mb-2">
              {children}
            </h3>
          ),
          p: ({ children, ...props }) => (
            <p {...props} className="my-2">
              {children}
            </p>
          ),
          ul: ({ children, ...props }) => (
            <ul {...props} className="list-disc pl-5 my-2">
              {children}
            </ul>
          ),
          li: ({ children, ...props }) => (
            <li {...props} className="mb-1">
              {children}
            </li>
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </SafeWrapper>
  );
}; 