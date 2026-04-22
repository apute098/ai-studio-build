import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const messages = db.prepare('SELECT * FROM Message ORDER BY createdAt DESC LIMIT 50').all();
    const users = db.prepare('SELECT * FROM TelegramUser ORDER BY updatedAt DESC LIMIT 20').all();
    const logs = db.prepare('SELECT * FROM SystemLog ORDER BY createdAt DESC LIMIT 10').all();

    const stats = {
      totalMessages: (db.prepare('SELECT COUNT(*) as count FROM Message').get() as any).count,
      totalUsers: (db.prepare('SELECT COUNT(*) as count FROM TelegramUser').get() as any).count,
      todayMessages: (db.prepare("SELECT COUNT(*) as count FROM Message WHERE createdAt >= date('now')").get() as any).count
    };

    return NextResponse.json({
      messages,
      users,
      logs,
      stats,
      botToken: !!process.env.TELEGRAM_BOT_TOKEN,
      appUrl: process.env.APP_URL
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
