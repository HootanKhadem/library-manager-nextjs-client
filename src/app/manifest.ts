import type {MetadataRoute} from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'toumaar — Personal Library Manager',
        short_name: 'toumaar',
        description: 'Catalogue books and manage lending in your personal library.',
        id: '/',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#1c1917',
        theme_color: '#e11d48',
        icons: [
            {src: '/pwa-192.png', sizes: '192x192', type: 'image/png'},
            {src: '/pwa-512.png', sizes: '512x512', type: 'image/png'},
            {src: '/pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable'},
        ],
    };
}
