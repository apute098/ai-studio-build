import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    return NextResponse.json({ ok: false, error: 'TELEGRAM_BOT_TOKEN not found' }, { status: 400 });
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const data = await response.json();
    
    if (data.ok) {
      // Also get webhook info
      const webhookResponse = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
      const webhookData = await webhookResponse.json();
      
      return NextResponse.json({ 
        ok: true, 
        bot: data.result,
        webhook: webhookData.result
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Bot Info Error:', error);
    return NextResponse.json({ ok: false, error: 'Failed to fetch bot info' }, { status: 500 });
  }
}
