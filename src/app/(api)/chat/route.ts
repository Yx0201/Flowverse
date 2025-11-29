// app/api/chat/route.ts (修改 SSE 包装为 JSON 对象)

import { NextRequest } from 'next/server';
import { getOllamaChatStream, OllamaMessage, OllamaChatResponseChunk } from '@/lib/ollamaService';

export const runtime = 'edge'; 

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Missing or invalid messages array' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const ollamaStream = await getOllamaChatStream(messages as OllamaMessage[]);
    
    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk);
        const lines = text.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          try {
            const data: OllamaChatResponseChunk = JSON.parse(line);
            
            const responseText = data.message?.content; 

            if (responseText) {
              // 1. 构建要发送的 JSON 对象
              const payload = {
                content: responseText, // Ollama 返回的内容片段
                time: new Date().toISOString(), // 添加当前时间戳
                // future_data: '...' // 后续可扩展其他字段
              };

              // 2. 将 JSON 对象转换为字符串
              const jsonString = JSON.stringify(payload);

              // 3. 按照 Server-Sent Events (SSE) 规范格式化数据
              // 格式: data: [JSON 字符串]\n\n
              const sseEvent = `data: ${jsonString}\n\n`;
              controller.enqueue(new TextEncoder().encode(sseEvent));
            }

            // 检查是否完成
            if (data.done) {
                // 对于完成标记，也最好封装成 JSON，或者使用 event: done
                const donePayload = {
                    content: '[DONE]',
                    time: new Date().toISOString(),
                    status: 'completed'
                };
                const sseEvent = `event: done\ndata: ${JSON.stringify(donePayload)}\n\n`;
                controller.enqueue(new TextEncoder().encode(sseEvent));
            }
          } catch (error) {
            // 解析失败时跳过
            console.warn('Skipping chunk due to JSON parse error:', line);
          }
        }
      },
      flush(controller) {
          controller.terminate();
      }
    });

    return new Response(ollamaStream.pipeThrough(transformStream), {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}