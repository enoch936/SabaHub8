import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import Providers from "./providers";
import { use } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SabaHub",
  description: "Freelance platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = use(cookies());
  const themeValue = cookieStore.get('theme')?.value;
  const themeClass = themeValue === 'dark' ? 'theme-dark' : 'theme-light';
  
  return (
    <html lang="en" className={themeClass} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function(){
  try {
    var t = localStorage.getItem('theme');
    if (t !== 'light' && t !== 'dark') { t = 'light'; }
    var root = document.documentElement;
    var desired = t === 'dark' ? 'theme-dark' : 'theme-light';
    if (!root.classList.contains(desired)) {
      root.classList.remove('theme-light','theme-dark');
      root.classList.add(desired);
    }
  } catch (e) {}
})();
            `.trim(),
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
