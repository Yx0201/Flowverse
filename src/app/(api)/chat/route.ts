// app/api/chat/route.ts (修改 SSE 包装为 JSON 对象)

import { NextRequest } from 'next/server';
import { getOllamaChatStream, OllamaMessage, OllamaChatResponseChunk } from '@/lib/ollamaService';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const controller = new AbortController();
  const { signal } = controller;

  // 监听请求中断，当客户端断开时中止整个流
  req.signal.addEventListener('abort', () => {
    controller.abort();
  });

  try {
    const { messages } = await req.json();
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Missing or invalid messages array' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const ollamaStream = await getOllamaChatStream(messages as OllamaMessage[], signal);

    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        // 检查是否已被中止
        if (signal.aborted) {
          controller.terminate();
          return;
        }

        const text = new TextDecoder().decode(chunk);
        const lines = text.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          try {
            // 再次检查中止状态
            if (signal.aborted) {
              controller.terminate();
              return;
            }

            const data: OllamaChatResponseChunk = JSON.parse(line);

            const thinkingText = data.message?.thinking;
            const responseText = data.message?.content;

            // 首先处理思考过程
            if (thinkingText) {
              const thinkingPayload = {
                type: 'thinking',
                content: thinkingText,
                time: new Date().toISOString(),
                done: data.done
              };

              const jsonString = JSON.stringify(thinkingPayload);
              const sseEvent = `data: ${jsonString}\n\n`;
              controller.enqueue(new TextEncoder().encode(sseEvent));
            }

            // 然后处理正常回复内容
            if (responseText) {
              const contentPayload = {
                type: 'ans',
                content: responseText,
                time: new Date().toISOString(),
                done: data.done
              };

              const jsonString = JSON.stringify(contentPayload);
              const sseEvent = `data: ${jsonString}\n\n`;
              controller.enqueue(new TextEncoder().encode(sseEvent));

            }

            if (data.done) {
              const donePayload = {
                type: 'done',
                content: '[DONE]',
                time: new Date().toISOString(),
                status: 'completed'
              };
              const sseEvent = `event: done\ndata: ${JSON.stringify(donePayload)}\n\n`;
              controller.enqueue(new TextEncoder().encode(sseEvent));
            }
          } catch {
            console.warn('Skipping chunk due to JSON parse error:', line);
          }
        }
      },
      flush(controller) {
        if (!signal.aborted) {
          controller.terminate();
        }
      }
    });

    // 处理流传输错误，特别是连接中断
    const pipeline = ollamaStream.pipeThrough(transformStream).pipeThrough(
      new TransformStream({
        transform(chunk, controller) {
          try {
            controller.enqueue(chunk);
          } catch (error) {
            console.warn('Stream enqueue error:', error);
            controller.terminate();
          }
        }
      })
    );

    return new Response(pipeline, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    // 处理连接中断的特殊情况
    if (error instanceof Error && (
      error.message.includes('aborted') ||
      error.message.includes('ECONNRESET') ||
      error.name === 'AbortError'
    )) {
      console.log('Connection aborted by client');
      return new Response('Connection closed', { status: 499 });
    }

    console.error('API Error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Internal Server Error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}