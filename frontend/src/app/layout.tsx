import type { Metadata } from 'next';
import { Bricolage_Grotesque, IBM_Plex_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-display',
  display: 'swap',
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'twintell — The B2B Social Network + Business Directory',
  description:
    'Verified Indian manufacturers, wholesalers, D2C brands, and procurement teams sharing business updates and trade requirements.',
  keywords: [
    'B2B',
    'Business Directory',
    'Manufacturers',
    'Suppliers',
    'Wholesale',
    'Procurement',
    'Trade',
    'RFQ',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${bricolageGrotesque.variable} ${ibmPlexSans.variable}`}>
      <body className="bg-surface text-ink font-sans antialiased selection:bg-cobalt-soft selection:text-cobalt min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
