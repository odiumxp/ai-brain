import { useEffect } from 'react';
import { marked } from 'marked';
import hljs from 'highlight.js';

// Configure marked
marked.setOptions({
  breaks: true,
  gfm: true,
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value;
      } catch (err) {
        console.error('Highlight error:', err);
      }
    }
    return hljs.highlightAuto(code).value;
  }
});

export default function MarkdownRenderer({ content }) {
  useEffect(() => {
    // Highlight code blocks after render
    document.querySelectorAll('pre code').forEach((block) => {
      hljs.highlightElement(block);
    });
  }, [content]);
  
  if (!content) return null;
  
  const renderMarkdown = () => {
    try {
      // Parse markdown to HTML
      const html = marked.parse(content);
      return { __html: html };
    } catch (error) {
      console.error('Markdown parse error:', error);
      // Fallback to plain text if parsing fails
      return { __html: `<pre>${content}</pre>` };
    }
  };
  
  return (
    <div 
      className="markdown-content"
      dangerouslySetInnerHTML={renderMarkdown()}
    />
  );
}
