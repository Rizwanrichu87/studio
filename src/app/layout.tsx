import type { Metadata } from 'next';
import { Orbitron } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { BackgroundEffects } from '@/components/background-effects';

const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-orbitron' });

export const metadata: Metadata = {
  title: 'AI Habitual: Smart Habit Tracker',
  description: 'Build, track, and maintain good habits with AI-powered insights and motivation.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${orbitron.variable} font-headline antialiased`}>
        <BackgroundEffects />
        <main className="relative z-10">
          <FirebaseClientProvider>
            {children}
            <Toaster />
          </FirebaseClientProvider>
        </main>
      </body>
    </html>
  );
}
