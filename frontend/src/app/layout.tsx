import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'twintell — The B2B Social Network + Business Directory',
  description:
    'Connect, discover, and grow your business network. Browse verified manufacturers, suppliers, products, and direct industry updates.',
  keywords: [
    'B2B',
    'Business Directory',
    'Social Network',
    'Manufacturers',
    'Suppliers',
    'Wholesale',
    'Packaging',
    'Industrial',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 antialiased selection:bg-primary-100 selection:text-primary-700">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
