import {useId} from 'react';

const STATE_STYLE: Record<string, {
    fill: string;
    gradient?: [string, string];
    glow: boolean;
    pulse: boolean;
    opacity: number
}> = {
    folded: {fill: 'var(--bw-bg-raised)', glow: false, pulse: false, opacity: 0.9},
    lit: {fill: 'var(--bw-rose)', gradient: ['#FB7185', 'var(--bw-rose-dim)'], glow: true, pulse: false, opacity: 1},
    lent: {
        fill: 'var(--bw-rose-dim)',
        gradient: ['var(--bw-rose)', '#6B1530'],
        glow: true,
        pulse: false,
        opacity: 0.85
    },
    overdue: {fill: 'var(--bw-ember)', glow: true, pulse: true, opacity: 1},
};

export function LanternGlyph({
                                 state = 'lit',
                                 width = 64,
                                 tethered = false,
                                 className = '',
                             }: {
    state?: 'folded' | 'lit' | 'lent' | 'overdue';
    width?: number;
    tethered?: boolean;
    className?: string;
}) {
    const style = STATE_STYLE[state];
    const h = width * 1.5;
    const uid = useId();
    const filterId = `glow-${state}-${uid}`;
    const gradientId = `fill-${state}-${uid}`;

    return (
        <svg
            width={width}
            height={h + (tethered ? 22 : 0)}
            viewBox={`0 0 ${width} ${h + (tethered ? 22 : 0)}`}
            className={`${className} ${style.pulse ? 'animate-lantern-pulse' : ''}`}
            aria-hidden="true"
        >
            <defs>
                <filter id={filterId} x="-60%" y="-60%" width="220%" height="220%">
                    <feGaussianBlur stdDeviation={width * 0.09} result="blur"/>
                    <feMerge>
                        <feMergeNode in="blur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
                {style.gradient && (
                    <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={style.gradient[0]}/>
                        <stop offset="100%" stopColor={style.gradient[1]}/>
                    </linearGradient>
                )}
            </defs>

            {tethered && (
                <line
                    x1={width / 2} y1="2" x2={width / 2} y2="18"
                    stroke="var(--bw-rib)" strokeWidth="1" strokeDasharray="2 3"
                />
            )}

            <g transform={`translate(0 ${tethered ? 20 : 0})`}>
                {/* hanging ring */}
                <circle cx={width / 2} cy="4" r="3" fill="none" stroke="var(--bw-rib)" strokeWidth="1.4"/>

                {/* lantern body — folded hexagonal column. Folded gets an
                    outline so it stays legible against either theme's
                    ground, since its fill sits only one step off the base. */}
                <path
                    d={`M ${width * 0.12} ${h * 0.16}
                        L ${width * 0.5} ${h * 0.02}
                        L ${width * 0.88} ${h * 0.16}
                        L ${width * 0.88} ${h * 0.86}
                        L ${width * 0.5} ${h * 0.99}
                        L ${width * 0.12} ${h * 0.86}
                        Z`}
                    fill={style.gradient ? `url(#${gradientId})` : style.fill}
                    stroke={state === 'folded' ? 'var(--bw-rib)' : 'none'}
                    strokeWidth={state === 'folded' ? 1.2 : 0}
                    opacity={style.opacity}
                    filter={style.glow ? `url(#${filterId})` : undefined}
                />

                {/* pleat ribs */}
                {[0.3, 0.5, 0.7].map((x) => (
                    <line
                        key={x}
                        x1={width * x} y1={h * 0.08}
                        x2={width * x} y2={h * 0.92}
                        stroke={state === 'folded' ? 'var(--bw-rib)' : 'rgba(12,10,9,0.35)'}
                        strokeWidth="1"
                    />
                ))}
            </g>
        </svg>
    );
}
