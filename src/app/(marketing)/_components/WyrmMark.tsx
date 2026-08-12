export function WyrmMark({className = 'h-8 w-8'}: { className?: string }) {
    return (
        <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
            <circle cx="20" cy="20" r="19" fill="none" stroke="var(--bw-vermilion)" strokeWidth="1.4"/>
            <path
                d="M13 15c0-3 2.5-5 6-5s6 2.3 6 5.2c0 2.6-2 3.8-4.4 4.6-2.7.9-4.6 1.9-4.6 4.2 0 2.5 2.3 4 5 4 2.2 0 4-1 4.9-2.6"
                fill="none"
                stroke="var(--bw-vermilion)"
                strokeWidth="1.6"
                strokeLinecap="round"
            />
            <circle cx="25.6" cy="25.9" r="1.3" fill="var(--bw-vermilion)"/>
        </svg>
    );
}
