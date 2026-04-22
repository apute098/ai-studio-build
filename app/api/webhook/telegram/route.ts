import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { eventEmitter } from '@/lib/events';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    if (body.message) {
      const { message } = body;
      const chatId = message.chat.id.toString();
      const telegramId = message.from?.id.toString() || 'unknown';
      const username = message.from?.username || null;
      const firstName = message.from?.first_name || null;
      const lastName = message.from?.last_name || null;
      const text = message.text || null;
      const messageId = message.message_id;

      // 1. Save Message
      const insertMsg = db.prepare(`
        INSERT INTO Message (messageId, chatId, text, username, firstName)
        VALUES (?, ?, ?, ?, ?)
      `);
      const result = insertMsg.run(messageId, chatId, text, username, firstName);
      const savedMessageId = result.lastInsertRowid;

      // 2. Update User Stats
      const userExists = db.prepare('SELECT id FROM TelegramUser WHERE telegramId = ?').get(telegramId);
      
      if (userExists) {
        db.prepare(`
          UPDATE TelegramUser 
          SET username = ?, firstName = ?, lastName = ?, lastMessage = ?, 
              messageCount = messageCount + 1, updatedAt = CURRENT_TIMESTAMP
          WHERE telegramId = ?
        `).run(username, firstName, lastName, text, telegramId);
      } else {
        db.prepare(`
          INSERT INTO TelegramUser (telegramId, username, firstName, lastName, lastMessage, messageCount)
          VALUES (?, ?, ?, ?, ?, 1)
        `).run(telegramId, username, firstName, lastName, text);
      }

      // 3. Emit event for SSE
      eventEmitter.emit('new-message', {
        type: 'message',
        data: {
          id: savedMessageId,
          chatId,
          text,
          username: username || firstName || 'Anonymous',
          createdAt: new Date().toISOString()
        }
      });

      // 4. Log system event
      db.prepare('INSERT INTO SystemLog (event, details) VALUES (?, ?)').run(
        'webhook_received',
        `Message from ${username || telegramId}: ${text?.substring(0, 50)}`
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ ok: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
