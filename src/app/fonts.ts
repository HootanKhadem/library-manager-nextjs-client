import localFont from "next/font/local";

// Self-hosted (from @fontsource-variable/*) rather than next/font/google: the Google loader
// downloads the font files at build time, so any network hiccup in the Docker build (no cache)
// fails the whole build with "module-not-found". These files ship with node_modules instead.

export const plusJakartaSans = localFont({
    src: "../../node_modules/@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2",
    variable: "--font-plus-jakarta-sans",
    weight: "200 800",
    display: "swap",
});

export const vazirmatn = localFont({
    src: "../../node_modules/@fontsource-variable/vazirmatn/files/vazirmatn-arabic-wght-normal.woff2",
    variable: "--font-vazirmatn",
    weight: "100 900",
    display: "swap",
});

export const manrope = localFont({
    src: "../../node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2",
    variable: "--font-manrope",
    weight: "200 800",
    display: "swap",
});
