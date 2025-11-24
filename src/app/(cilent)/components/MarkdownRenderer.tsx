"use client";

import React from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import oneDark from 'react-syntax-highlighter/dist/esm/styles/prism/one-dark';
import 'katex/dist/katex.min.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className }) => {
  // 自定义代码块渲染器，支持语法高亮
  const CodeBlock = React.memo(({ children, className, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';

    return match ? (
      <SyntaxHighlighter
        {...props}
        PreTag="div"
        language={language}
        style={oneDark}
        showLineNumbers={true}
        wrapLines={true}
        customStyle={{
          borderRadius: '8px',
          fontSize: '14px',
          margin: '8px 0',
        }}
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    ) : (
      <code
        {...props}
        className={`bg-gray-100 px-1 py-0.5 rounded text-sm ${className || ''}`}
      >
        {children}
      </code>
    );
  });

  CodeBlock.displayName = 'CodeBlock';

  // 自定义内联代码渲染器
  const InlineCode = React.memo(({ children, ...props }: any) => (
    <code
      {...props}
      className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded text-sm font-mono"
    >
      {children}
    </code>
  ));

  InlineCode.displayName = 'InlineCode';

  // 自定义表格渲染器
  const Table = React.memo(({ children, ...props }: any) => (
    <div className="overflow-x-auto my-4">
      <table
        {...props}
        className="min-w-full border-collapse border border-gray-200 rounded-lg"
      >
        {children}
      </table>
    </div>
  ));

  Table.displayName = 'Table';

  const TableHead = React.memo(({ children, ...props }: any) => (
    <thead {...props} className="bg-gray-50">
      {children}
    </thead>
  ));

  TableHead.displayName = 'TableHead';

  const TableBody = React.memo(({ children, ...props }: any) => (
    <tbody {...props} className="divide-y divide-gray-200">
      {children}
    </tbody>
  ));

  TableBody.displayName = 'TableBody';

  const TableRow = React.memo(({ children, ...props }: any) => (
    <tr {...props} className="hover:bg-gray-50">
      {children}
    </tr>
  ));

  TableRow.displayName = 'TableRow';

  const TableCell = React.memo(({ children, ...props }: any) => (
    <td
      {...props}
      className="px-4 py-2 text-sm border border-gray-200"
    >
      {children}
    </td>
  ));

  TableCell.displayName = 'TableCell';

  const TableHeaderCell = React.memo(({ children, ...props }: any) => (
    <th
      {...props}
      className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border border-gray-200"
    >
      {children}
    </th>
  ));

  TableHeaderCell.displayName = 'TableHeaderCell';

  // 自定义块引用渲染器
  const Blockquote = React.memo(({ children, ...props }: any) => (
    <blockquote
      {...props}
      className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 italic"
    >
      {children}
    </blockquote>
  ));

  Blockquote.displayName = 'Blockquote';

  // 自定义列表渲染器
  const UnorderedList = React.memo(({ children, ...props }: any) => (
    <ul {...props} className="list-disc list-inside my-4 space-y-1">
      {children}
    </ul>
  ));

  UnorderedList.displayName = 'UnorderedList';

  const OrderedList = React.memo(({ children, ...props }: any) => (
    <ol {...props} className="list-decimal list-inside my-4 space-y-1">
      {children}
    </ol>
  ));

  OrderedList.displayName = 'OrderedList';

  const ListItem = React.memo(({ children, ...props }: any) => (
    <li {...props} className="ml-4">
      {children}
    </li>
  ));

  ListItem.displayName = 'ListItem';

  // 自定义链接渲染器
  const Link = React.memo(({ href, children, ...props }: any) => (
    <a
      {...props}
      href={href}
      className="text-blue-600 hover:text-blue-800 underline"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ));

  Link.displayName = 'Link';

  return (
    <div className={`prose prose-sm max-w-none ${className || ''}`}>
      <Markdown
        remarkPlugins={[
          remarkGfm,
          remarkMath,
        ]}
        rehypePlugins={[
          rehypeKatex,
          rehypeRaw,
        ]}
        components={{
          code: CodeBlock,
          table: Table,
          thead: TableHead,
          tbody: TableBody,
          tr: TableRow,
          td: TableCell,
          th: TableHeaderCell,
          blockquote: Blockquote,
          ul: UnorderedList,
          ol: OrderedList,
          li: ListItem,
          a: Link,
        }}
      >
        {content}
      </Markdown>
    </div>
  );
};

export default MarkdownRenderer;