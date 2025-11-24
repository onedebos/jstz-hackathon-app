import React from 'react';
import type { RichTextNode } from './strapi';

// Convert Strapi rich text to plain text
export function richTextToPlainText(nodes: RichTextNode[] | string): string {
  if (typeof nodes === 'string') return nodes;
  if (!Array.isArray(nodes)) return '';

  return nodes
    .map((node) => {
      if (node.text) return node.text;
      if (node.children) return richTextToPlainText(node.children);
      return '';
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Render Strapi rich text as React components
export function renderRichText(nodes: RichTextNode[] | string): React.ReactNode {
  if (typeof nodes === 'string') return nodes;
  if (!Array.isArray(nodes)) return null;

  return nodes.map((node, index) => {
    const key = `richtext-${index}`;

    // Text node
    if (node.type === 'text' && node.text !== undefined) {
      return <span key={key}>{node.text}</span>;
    }

    // Paragraph
    if (node.type === 'paragraph') {
      return (
        <p key={key} className="mb-3">
          {node.children ? renderRichText(node.children) : null}
        </p>
      );
    }

    // Headings
    if (node.type === 'heading') {
      const level = node.level || 3;
      const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
      const className =
        level === 3
          ? 'text-xl font-bold text-[#8aaafc] mt-6 mb-3'
          : level === 4
          ? 'text-lg font-bold text-[#8aaafc] mt-4 mb-2'
          : 'text-2xl font-bold text-[#8aaafc] mt-8 mb-4';

      return (
        <HeadingTag key={key} className={className}>
          {node.children ? renderRichText(node.children) : null}
        </HeadingTag>
      );
    }

    // Lists
    if (node.type === 'list') {
      const ListTag = node.format === 'ordered' ? 'ol' : 'ul';
      const className = node.format === 'ordered' 
        ? 'list-decimal list-inside mb-3 space-y-1 ml-4' 
        : 'list-disc list-inside mb-3 space-y-1 ml-4';
      return (
        <ListTag key={key} className={className}>
          {node.children ? renderRichText(node.children) : null}
        </ListTag>
      );
    }

    // List item
    if (node.type === 'list-item') {
      return (
        <li key={key} className="text-gray-300">
          {node.children ? renderRichText(node.children) : null}
        </li>
      );
    }

    // Default: render children if available
    if (node.children) {
      return <React.Fragment key={key}>{renderRichText(node.children)}</React.Fragment>;
    }

    return null;
  });
}

