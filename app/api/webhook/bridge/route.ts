import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { eventEmitter } from '@/lib/events';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Auth Check
    const token = req.headers.get('Authorization');
    const expectedToken = `Bearer ${process.env.TELEGRAM_BOT_TOKEN}`;
    if (token !== expectedToken) {
       return NextResponse.json({ error: 'Unauthorized Bridge Access' }, { status: 401 });
    }

    const { chatId, telegramId, username, firstName, text, messageId } = body;

    // 1. Save Message
    const insertMsg = db.prepare(`
      INSERT INTO Message (messageId, chatId, text, username, firstName)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = insertMsg.run(messageId || Date.now(), chatId || 'bridge', text || '[Media]', username || 'System', firstName || 'WA-Loco');
    const savedMessageId = result.lastInsertRowid;

    // 2. Emit event for SSE Live Stream
    eventEmitter.emit('new-message', {
      type: 'message',
      data: {
        id: savedMessageId,
        chatId: chatId || 'bridge',
        text: text || '[Media]',
        username: username || firstName || 'WA-Loco',
        createdAt: new Date().toISOString()
      }
    });

    return NextResponse.json({ ok: true, id: savedMessageId });
  } catch (error) {
    console.error('Bridge Error:', error);
    return NextResponse.json({ ok: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
