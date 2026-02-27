interface GenreTagProps {
    genre: string;
}

export default function GenreTag({genre}: GenreTagProps) {
    return (
        <span
            className="inline-block bg-[#ede5d5] border border-[rgba(61,28,2,0.1)] rounded-sm font-mono text-[0.6rem] px-1.5 py-0.5 text-[#6b4c2a] tracking-[0.08em]">
      {genre}
    </span>
    );
}
