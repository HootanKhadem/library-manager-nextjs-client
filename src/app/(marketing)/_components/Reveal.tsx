'use client';

import {useEffect, useRef, useState} from 'react';

export function Reveal({
                           children,
                           className = '',
                           delay = 0,
                           style,
                       }: {
    children: React.ReactNode;
    className?: string;
    delay?: number;
    style?: React.CSSProperties;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        if (typeof IntersectionObserver === 'undefined') {
            setVisible(true);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    observer.disconnect();
                }
            },
            {threshold: 0.2, rootMargin: '0px 0px -40px 0px'}
        );
        observer.observe(el);

        // Belt-and-suspenders: never let content stay hidden because the
        // observer didn't fire (e.g. unusual viewport/compositor states).
        const fallback = setTimeout(() => setVisible(true), 2000);

        return () => {
            observer.disconnect();
            clearTimeout(fallback);
        };
    }, []);

    return (
        <div
            ref={ref}
            data-reveal={visible ? 'in' : 'out'}
            className={className}
            style={{...style, transitionDelay: visible ? `${delay}ms` : '0ms'}}
        >
            {children}
        </div>
    );
}
