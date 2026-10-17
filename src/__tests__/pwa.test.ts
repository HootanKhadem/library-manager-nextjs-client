/** @jest-environment node */
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {runInNewContext} from 'node:vm';
import manifest from '@/src/app/manifest';

type FetchRequest = {url: string; method: string; mode: string};
type FetchEvent = {request: FetchRequest; respondWith: jest.Mock};
type InstallEvent = {waitUntil: jest.Mock};

function loadWorker(fetchMock: jest.Mock) {
    const listeners = new Map<string, (event: FetchEvent & InstallEvent) => void>();
    const cache = {addAll: jest.fn().mockResolvedValue(undefined)};
    const cachesMock = {
        open: jest.fn().mockResolvedValue(cache),
        match: jest.fn(),
        keys: jest.fn().mockResolvedValue([]),
        delete: jest.fn().mockResolvedValue(true),
    };
    const selfMock = {
        location: {origin: 'https://toumaar.example'},
        addEventListener: (name: string, listener: (event: FetchEvent & InstallEvent) => void) => listeners.set(name, listener),
        skipWaiting: jest.fn(),
        clients: {claim: jest.fn().mockResolvedValue(undefined)},
    };
    const source = readFileSync(resolve(process.cwd(), 'public/sw.js'), 'utf8');
    runInNewContext(source, {self: selfMock, caches: cachesMock, fetch: fetchMock, URL, Response});
    return {listeners, cache, cachesMock};
}

function navigate(url: string): FetchEvent {
    return {request: {url, method: 'GET', mode: 'navigate'}, respondWith: jest.fn()};
}

describe('PWA manifest', () => {
    it('provides install metadata and standard and maskable icons', () => {
        const data = manifest();
        expect(data).toMatchObject({short_name: 'toumaar', start_url: '/', scope: '/', display: 'standalone'});
        expect(data.icons).toEqual(expect.arrayContaining([
            expect.objectContaining({src: '/pwa-192.png', sizes: '192x192'}),
            expect.objectContaining({src: '/pwa-512.png', sizes: '512x512'}),
            expect.objectContaining({src: '/pwa-maskable-512.png', purpose: 'maskable'}),
        ]));

        for (const [name, size] of [['pwa-192.png', 192], ['pwa-512.png', 512], ['pwa-maskable-512.png', 512]] as const) {
            const file = readFileSync(resolve(process.cwd(), 'public', name));
            expect(file.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
            expect(file.readUInt32BE(16)).toBe(size);
            expect(file.readUInt32BE(20)).toBe(size);
        }
    });
});

describe('PWA service worker', () => {
    it('pre-caches only public offline assets', async () => {
        const {listeners, cache} = loadWorker(jest.fn());
        const event: InstallEvent = {waitUntil: jest.fn()};
        listeners.get('install')!(event as FetchEvent & InstallEvent);
        await event.waitUntil.mock.calls[0][0];
        expect(cache.addAll).toHaveBeenCalledWith([
            '/offline.html', '/pwa-192.png', '/pwa-512.png', '/pwa-maskable-512.png',
        ]);
    });

    it('uses network for navigation and offline page when network fails', async () => {
        const live = new Response('live');
        const offline = new Response('offline');
        const fetchMock = jest.fn().mockResolvedValueOnce(live).mockRejectedValueOnce(new Error('offline'));
        const {listeners, cachesMock} = loadWorker(fetchMock);
        cachesMock.match.mockResolvedValue(offline);

        const onlineEvent = navigate('https://toumaar.example/books');
        listeners.get('fetch')!(onlineEvent as FetchEvent & InstallEvent);
        await expect(onlineEvent.respondWith.mock.calls[0][0]).resolves.toBe(live);
        expect(cachesMock.match).not.toHaveBeenCalled();

        const offlineEvent = navigate('https://toumaar.example/books');
        listeners.get('fetch')!(offlineEvent as FetchEvent & InstallEvent);
        await expect(offlineEvent.respondWith.mock.calls[0][0]).resolves.toBe(offline);
        expect(cachesMock.match).toHaveBeenCalledWith('/offline.html');
    });

    it('does not intercept API, cross-origin, or non-navigation requests', () => {
        const fetchMock = jest.fn();
        const {listeners, cachesMock} = loadWorker(fetchMock);
        for (const request of [
            {url: 'https://toumaar.example/api/book', method: 'GET', mode: 'navigate'},
            {url: 'https://toumaar.example/api/book', method: 'POST', mode: 'cors'},
            {url: 'https://toumaar.example/books', method: 'GET', mode: 'cors'},
            {url: 'https://other.example/books', method: 'GET', mode: 'navigate'},
        ]) {
            const event: FetchEvent = {request, respondWith: jest.fn()};
            listeners.get('fetch')!(event as FetchEvent & InstallEvent);
            expect(event.respondWith).not.toHaveBeenCalled();
        }
        expect(fetchMock).not.toHaveBeenCalled();
        expect(cachesMock.match).not.toHaveBeenCalled();
    });
});
