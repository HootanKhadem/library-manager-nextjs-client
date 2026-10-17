import type {Metadata, Viewport} from "next";
import {Plus_Jakarta_Sans, Vazirmatn} from "next/font/google";
import "./globals.css";
import {AuthProvider} from "@/src/contexts/AuthContext";
import {PwaRegistration} from "@/src/components/PwaRegistration";

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
    title: "toumaar — Personal Library Manager",
    description: "A personal library manager to catalogue and track your book collection.",
    appleWebApp: {capable: true, statusBarStyle: 'default', title: 'toumaar'},
};

export const viewport: Viewport = {themeColor: '#e11d48'};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${plusJakartaSans.variable} ${vazirmatn.variable} antialiased`}>
            <AuthProvider>{children}</AuthProvider>
            <PwaRegistration/>
            </body>
        </html>
    );
}
