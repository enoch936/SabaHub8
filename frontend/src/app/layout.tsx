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
  const themeClass = 'theme-light';
  
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
    root.classList.remove('theme-light','theme-dark','dark');
    var desired = t === 'dark' ? 'theme-dark' : 'theme-light';
    root.classList.add(desired);
    if (t === 'dark') { root.classList.add('dark'); }
    var href = t === 'dark' ? '/themes/dark.css' : '/themes/light.css';
    var link = document.getElementById('theme-css');
    if (link && link.tagName === 'LINK') {
      if (link.getAttribute('href') !== href) link.setAttribute('href', href);
    } else {
      link = document.createElement('link');
      link.id = 'theme-css';
      link.rel = 'stylesheet';
      link.href = href;
      var head = document.head || document.getElementsByTagName('head')[0];
      head.insertBefore(link, head.firstChild);
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
