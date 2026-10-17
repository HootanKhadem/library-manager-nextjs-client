export function ToumaarMark({className = 'h-8 w-8'}: { className?: string }) {
    return (
        <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
            <circle cx="20" cy="20" r="19" fill="none" stroke="var(--bw-seal)" strokeWidth="1.4"/>
            <path
                d="M9 13.5c4.5-1.5 8.2-.9 11 1.8 2.8-2.7 6.5-3.3 11-1.8v14c-4.5-1.5-8.2-.9-11 1.8-2.8-2.7-6.5-3.3-11-1.8zM20 15.3v14"
                fill="none"
                stroke="var(--bw-seal)"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
