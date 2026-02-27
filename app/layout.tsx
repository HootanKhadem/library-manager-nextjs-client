import type {Metadata} from "next";
import {Courier_Prime, Libre_Baskerville, Playfair_Display, Vazirmatn} from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
    variable: "--font-playfair",
  subsets: ["latin"],
    display: "swap",
});

const libreBaskerville = Libre_Baskerville({
    variable: "--font-libre-baskerville",
  subsets: ["latin"],
    weight: ["400", "700"],
    display: "swap",
});

const courierPrime = Courier_Prime({
    variable: "--font-courier-prime",
    subsets: ["latin"],
    weight: ["400", "700"],
    display: "swap",
});

/**
 * Vazirmatn is the recommended open-source typeface for Persian / Farsi UI.
 * It supports both Latin and Arabic scripts, so it works well as the sole
 * font when the app is in Farsi mode while still rendering Latin fallbacks.
 *
 * To use it: the CSS variable --font-vazirmatn is applied to <body> by
 * LanguageProvider (lib/i18n/context.tsx) whenever the language is "fa".
 * The Tailwind utility class font-vazirmatn is registered in globals.css.
 */
const vazirmatn = Vazirmatn({
    variable: "--font-vazirmatn",
    subsets: ["arabic"],
    display: "swap",
});

export const metadata: Metadata = {
    title: "Bibliotheca — Personal Library Manager",
    description: "A personal library manager to catalogue and track your book collection.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
          className={`${playfair.variable} ${libreBaskerville.variable} ${courierPrime.variable} ${vazirmatn.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
