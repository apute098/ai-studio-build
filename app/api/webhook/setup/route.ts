import { NextResponse } from 'next/server';

export async function POST() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const appUrl = process.env.APP_URL;

  if (!token) {
    return NextResponse.json({ 
      ok: false, 
      description: 'TELEGRAM_BOT_TOKEN is not set in environment variables.' 
    }, { status: 400 });
  }

  if (!appUrl) {
    return NextResponse.json({ 
      ok: false, 
      description: 'APP_URL is not set. Webhook requires a public URL.' 
    }, { status: 400 });
  }

  const webhookUrl = `${appUrl}/api/webhook/telegram`;
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook?url=${webhookUrl}`);
    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Webhook Setup Error:', error);
    return NextResponse.json({ 
      ok: false, 
      description: 'Failed to communicate with Telegram API.' 
    }, { status: 500 });
  }
}
