'use client';

import {useEffect} from 'react';

export function PwaRegistration() {
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(() => {
                // Install and online use still work when service workers are unavailable.
            });
        }
    }, []);

    return null;
}
