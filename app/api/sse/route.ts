import { NextRequest } from 'next/server';
import { eventEmitter } from '@/lib/events';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const responseStream = new ReadableStream({
    start(controller) {
      const onMessage = (data: any) => {
        try {
          const message = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch (e) {
          console.error('SSE Enqueue Error:', e);
        }
      };

      eventEmitter.on('new-message', onMessage);

      // Heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch (e) {
          // Ignore if controller is closed
        }
      }, 15000);

      req.signal.addEventListener('abort', () => {
        eventEmitter.off('new-message', onMessage);
        clearInterval(heartbeat);
        try {
          controller.close();
        } catch (e) {
          // Already closed
        }
      });
    },
  });

  return new Response(responseStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering for Nginx
    },
  });
}
