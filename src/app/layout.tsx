import type {Metadata, Viewport} from "next";
import "./globals.css";
import {plusJakartaSans, vazirmatn} from "./fonts";
import {AuthProvider} from "@/src/contexts/AuthContext";
import {PwaRegistration} from "@/src/components/PwaRegistration";
import {LanguageProvider} from "@/src/lib/i18n/context";
import {LANGUAGE_META} from "@/src/lib/i18n/meta";
import {getServerLanguage} from "@/src/lib/i18n/server";

export const metadata: Metadata = {
    title: "toumaar — Personal Library Manager",
    description: "A personal library manager to catalogue and track your book collection.",
    appleWebApp: {capable: true, statusBarStyle: 'default', title: 'toumaar'},
};

export const viewport: Viewport = {themeColor: '#e11d48', viewportFit: 'cover'};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    // Resolved on the server so the first paint is already in the user's language and direction.
    const language = await getServerLanguage();
    const meta = LANGUAGE_META[language];

    return (
        <html lang={language} dir={meta.dir}>
            <body className={`${plusJakartaSans.variable} ${vazirmatn.variable} ${meta.fontClass ?? ""} antialiased`}>
            <LanguageProvider initialLanguage={language}>
                <AuthProvider>{children}</AuthProvider>
            </LanguageProvider>
            <PwaRegistration/>
            </body>
        </html>
    );
}
