import type { Metadata } from "next";

import "./globals.css";
import AuthInit from "@/components/AuthInit";
import ModalProvider from "@/providers/ModalProvider";

export const metadata: Metadata = {
  title: "Hams BAP",
  description: "Hams BAP service",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="app-root">
        <ModalProvider>
          <AuthInit />
          {children}
        </ModalProvider>
      </body>
    </html>
  );
}
