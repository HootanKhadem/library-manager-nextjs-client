import type {Metadata} from "next";
import {Plus_Jakarta_Sans, Vazirmatn} from "next/font/google";
import "./globals.css";
import {AuthProvider} from "@/src/contexts/AuthContext";

const plusJakartaSans = Plus_Jakarta_Sans({
    variable: "--font-plus-jakarta-sans",
    subsets: ["latin"],
    display: "swap",
    weight: ["300", "400", "500", "600", "700", "800"],
});

const vazirmatn = Vazirmatn({
    variable: "--font-vazirmatn",
    subsets: ["arabic"],
    display: "swap",
});

export const metadata: Metadata = {
    title: "Librax — Personal Library Manager",
    description: "A personal library manager to catalogue and track your book collection.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${plusJakartaSans.variable} ${vazirmatn.variable} antialiased`}>
            <AuthProvider>{children}</AuthProvider>
            </body>
        </html>
    );
}
