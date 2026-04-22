import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Playfair_Display } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  style: ['italic'],
  weight: ['400', '700'],
  variable: '--font-serif',
});

export const metadata: Metadata = {
  title: 'TeleDash - Real-time Telegram Dashboard',
  description: 'Monitor your Telegram bot interactions in real-time with TeleDash.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} ${playfairDisplay.variable}`}>
      <body suppressHydrationWarning className="antialiased">
        {children}
      </body>
    </html>
  );
}
