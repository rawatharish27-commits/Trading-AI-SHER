
import React from 'react';
import './globals.css';

export const metadata = {
  title: 'SHER.AI | Institutional AI Terminal',
  description: 'Sovereign Neural Trading Intelligence',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>
      </head>
      <body>{children}</body>
    </html>
  );
}
