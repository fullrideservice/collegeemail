import type { Metadata } from "next";
import { Geist_Mono, Poppins } from "next/font/google";
import "./globals.css";

const poppinsSans = Poppins({
  variable: "--font-poppins-sans",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Scrape 7",
  description: "helping truck make money woooohoooo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/*
                Key Changes:
                1. Removed `w-screen` from body: Let the browser manage the width.
                2. Added `min-h-screen`: Ensures the body always takes at least the full viewport height.
                3. `overflow-y-scroll`: Explicitly tells the browser to always show the vertical scrollbar.
                   This makes the scrollbar's width a consistent factor in layout calculations,
                   preventing content shifts when content *does* overflow.
                   If you only want it to appear when needed, you can use `overflow-y-auto`
                   but be aware of potential subtle shifts if the scrollbar appears/disappears.
                4. `pr-[var(--scrollbar-width)]` (optional but recommended for consistency):
                   This is a more advanced technique where you can define a custom property
                   for the scrollbar width (which is typically ~17px but can vary) and
                   apply it as padding to the right to visually "push" content away from where
                   the scrollbar would be, if your design requires very precise alignment.
                   However, `overflow-y-scroll` often handles this well enough by itself.
            */}
      <body
        className={`${poppinsSans.variable} ${geistMono.variable} flex flex-col min-h-screen bg-background overflow-x-hidden font-sans antialiased overflow-y-scroll`}
        // You might need to set a custom property for scrollbar width if you want to use it
        // style={{ '--scrollbar-width': '17px' }} // Example: You might need to detect this dynamically or set a common value
      >
        <main className="container sm:mx-auto max-w-none inline-block flex-grow ">
          {children}
        </main>
      </body>
    </html>
  );
}
