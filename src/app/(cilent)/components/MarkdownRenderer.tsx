'use client';

import React, { memo, type ComponentPropsWithoutRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// 引入 Light 主题 (One Light 或者 VS)
import { oneLight } from 'react-syntax-highlighter/dist/cjs/styles/prism';

// 定义组件 Props
interface MarkdownRendererProps {
  content: string;
}

// 定义 Code 组件的 Props 类型
type CodeComponentProps = ComponentPropsWithoutRef<'code'>;

const MarkdownRenderer: React.FC<MarkdownRendererProps> = memo(({ content }) => {
  return (
    // prose: 基础排版
    // prose-slate: 颜色风格
    // max-w-none: 移除最大宽度限制，防止代码块或表格被截断
    <article className="prose prose-slate max-w-none">
      <ReactMarkdown
        // 插件列表
        remarkPlugins={[remarkGfm]} // 支持表格、删除线、自动链接
        rehypePlugins={[rehypeRaw]} // 支持解析原生 HTML 标签
        components={{
          // 自定义代码块渲染逻辑
          code({ className, children, ...props }: CodeComponentProps) {
            const codeContent = String(children).replace(/\n$/, '');
            
            // 检查是否有 language-xxx 类名
            const match = /language-(\w+)/.exec(className || '');
            const isMatch = match ? true : false;

            // 1. 内联代码 (Inline Code)
            // 没有语言标记，或者明确不在代码块中
            if (!isMatch) {
              return (
                <code
                  className="bg-gray-100 text-[#d73a49] px-1.5 py-0.5 rounded-md text-sm font-mono mx-0.5"
                  {...props}
                >
                  {codeContent}
                </code>
              );
            }

            // 2. 块级代码 (Block Code)
            return (
              <div className="not-prose my-4"> 
                {/* not-prose 避免 typography 样式干扰代码块内部布局 */}
                <SyntaxHighlighter
                  {...props}
                  style={oneLight} // 强制使用 Light 主题
                  language={match![1]}
                  PreTag="div" // 使用 div 替代 pre，避免 DOM 嵌套警告
                  showLineNumbers={true} // 显示行号
                  wrapLongLines={true}   // 自动换行
                  customStyle={{
                    margin: 0,
                    borderRadius: '0.5rem',
                    backgroundColor: '#fafafa', // 确保背景也是亮色
                    border: '1px solid #e5e7eb', // 加上淡灰色边框更像 GitHub
                  }}
                >
                  {codeContent}
                </SyntaxHighlighter>
              </div>
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