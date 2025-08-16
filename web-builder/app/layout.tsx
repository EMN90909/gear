import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Web Builder',
  description: 'Drag-and-drop website builder',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
