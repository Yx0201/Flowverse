'use client';

import React, { memo, type JSX, type ComponentPropsWithoutRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface MarkdownRendererProps {
  content: string;
}

// 定义代码组件的 Props 类型，继承原生 code 标签的属性
type CodeComponentProps = ComponentPropsWithoutRef<'code'>;

const MarkdownRenderer: React.FC<MarkdownRendererProps> = memo(({ content }) => {
  return (
    <article className="prose prose-slate max-w-none dark:prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          code({ className, children, ...props }: CodeComponentProps) {
            // 1. 获取语言类型 (例如 language-js)
            const match = /language-(\w+)/.exec(className || '');
            
            // 2. 判断逻辑：
            // 如果有 match (说明声明了语言，如 ```js)，则是代码块
            // 如果没有 match，通常是内联代码 (如 `const a = 1`)
            const isMatch = match ? true : false;

            if (!isMatch) {
              // --- 内联代码样式 (Inline Code) ---
              return (
                <code 
                  className="bg-gray-100 text-red-500 px-1 py-0.5 rounded text-sm font-mono mx-1" 
                  {...props}
                >
                  {children}
                </code>
              );
            }

            // --- 代码块样式 (Block Code) ---
            return (
              <SyntaxHighlighter
                {...props}
                style={oneLight}
                language={match![1]} // 强制断言 match 存在，因为上面已判断
                PreTag="div" // 外层标签使用 div 避免 p 标签嵌套报错
                showLineNumbers={true} // 可选：显示行号
                wrapLongLines={true}   // 可选：自动换行
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
});

MarkdownRenderer.displayName = 'MarkdownRenderer';

export default MarkdownRenderer;