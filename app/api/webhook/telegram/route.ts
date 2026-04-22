import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { eventEmitter } from '@/lib/events';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Extract message from various possible Telegram update formats
    const message = body.message || body.edited_message || body.channel_post || body.edited_channel_post;

    if (message) {
      const chatId = message.chat?.id?.toString() || 'unknown_chat';
      const telegramId = message.from?.id?.toString() || message.sender_chat?.id?.toString() || 'unknown';
      const username = message.from?.username || message.sender_chat?.username || null;
      const firstName = message.from?.first_name || message.sender_chat?.title || null;
      const lastName = message.from?.last_name || null;
      const messageId = message.message_id;

      // Identify the media type and text content
      let text = message.text || message.caption || '';
      
      let contentType = [];
      if (message.photo) contentType.push('[Photo]');
      if (message.video) contentType.push('[Video]');
      if (message.video_note) contentType.push('[Video Note]');
      if (message.document) contentType.push('[Document]');
      if (message.sticker) contentType.push(`[Sticker: ${message.sticker.emoji || ''}]`);
      if (message.voice) contentType.push('[Voice]');
      if (message.audio) contentType.push('[Audio]');
      if (message.animation) contentType.push('[GIF]');
      if (message.poll) contentType.push(`[Poll: ${message.poll.question}]`);
      if (message.contact) contentType.push(`[Contact: ${message.contact.first_name}]`);
      if (message.location) contentType.push('[Location]');
      if (message.new_chat_members) contentType.push('[User Joined]');
      if (message.left_chat_member) contentType.push('[User Left]');

      if (contentType.length > 0) {
        text = text ? `${contentType.join(' ')} ${text}` : contentType.join(' ');
      }

      if (!text) {
        text = '[System / Unknown Media]';
      }

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
