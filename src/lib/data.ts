import {ActivityItem, Author, Book} from "@/src/lib/types";

export const BOOKS: Book[] = [
    {
        id: "blood-meridian",
        title: "Blood Meridian",
        author: "Cormac McCarthy",
        year: 1985,
        genre: "Fiction",
        status: "Owned",
        rating: 5,
        publisher: "Random House",
        isbn: "978-0679728757",
        pages: 337,
        description:
            "Set in the 1850s along the Texas–Mexico border, Blood Meridian follows the Kid through a landscape of near-mythic violence. McCarthy's most ambitious novel — a meditation on the nature of evil, war, and human darkness.",
        notes:
            "One of the most demanding reads I've ever experienced. The prose is biblical, relentless. Judge Holden is one of literature's most terrifying characters. Read alongside Moby-Dick for themes of obsession and fate.",
        lendingHistory: [
            {
                lentTo: "Sofia K.",
                dateOut: "Mar 2024",
                dateReturned: "May 2024",
                condition: "Good",
            },
        ],
    },
    {
        id: "orientalism",
        title: "Orientalism",
        author: "Edward Said",
        year: 1978,
        genre: "Non-fiction",
        status: "Lent Out",
        lentTo: "Marco Rossi",
        dateLent: "13 Feb 2026",
        dueBack: "27 Mar 2026",
        rating: 4,
        overdue: false,
    },
    {
        id: "name-of-the-rose",
        title: "The Name of the Rose",
        author: "Umberto Eco",
        year: 1980,
        genre: "Mystery",
        status: "Owned",
        rating: 5,
    },
    {
        id: "ficciones",
        title: "Ficciones",
        author: "Jorge Luis Borges",
        year: 1944,
        genre: "Fiction",
        status: "Lent Out",
        lentTo: "Lucas Martinez",
        dateLent: "25 Feb 2026",
        dueBack: "25 Mar 2026",
        rating: 5,
        overdue: false,
        notes: "Masterpiece of magical realism",
    },
    {
        id: "ways-of-seeing",
        title: "Ways of Seeing",
        author: "John Berger",
        year: 1972,
        genre: "Art Theory",
        status: "Owned",
        rating: 4,
    },
    {
        id: "invisible-cities",
        title: "Invisible Cities",
        author: "Italo Calvino",
        year: 1972,
        genre: "Fiction",
        status: "Lent Out",
        lentTo: "Ana Pereira",
        dateLent: "10 Jan 2026",
        dueBack: "10 Feb 2026",
        rating: 5,
        overdue: true,
    },
    {
        id: "remains-of-the-day",
        title: "The Remains of the Day",
        author: "Kazuo Ishiguro",
        year: 1989,
        genre: "Fiction",
        status: "Owned",
        rating: 5,
    },
    {
        id: "thinking-fast-and-slow",
        title: "Thinking, Fast and Slow",
        author: "Daniel Kahneman",
        year: 2011,
        genre: "Psychology",
        status: "Wishlist",
    },
    {
        id: "old-man-and-the-sea",
        title: "The Old Man and the Sea",
        author: "Ernest Hemingway",
        year: 1952,
        genre: "Fiction",
        status: "Lent Out",
        lentTo: "Theresa W.",
        dateLent: "1 Feb 2026",
        dueBack: "1 Apr 2026",
        overdue: false,
    },
    {
        id: "siddhartha",
        title: "Siddhartha",
        author: "Hermann Hesse",
        year: 1922,
        genre: "Fiction",
        status: "Lent Out",
        lentTo: "Pawel K.",
        dateLent: "15 Dec 2025",
        dueBack: "15 Jan 2026",
        overdue: true,
    },
    {
        id: "master-and-margarita",
        title: "The Master and Margarita",
        author: "Mikhail Bulgakov",
        year: 1967,
        genre: "Fiction",
        status: "Lent Out",
        lentTo: "Julia S.",
        dateLent: "20 Feb 2026",
        dueBack: "20 Apr 2026",
        overdue: false,
    },
    {
        id: "labyrinths",
        title: "Labyrinths",
        author: "Jorge Luis Borges",
        year: 1962,
        genre: "Fiction",
        status: "Owned",
        rating: 5,
        notes: "Essential Borges anthology",
    },
    {
        id: "the-aleph",
        title: "The Aleph",
        author: "Jorge Luis Borges",
        year: 1949,
        genre: "Fiction",
        status: "Owned",
        rating: 4,
    },
    {
        id: "dreamtigers",
        title: "Dreamtigers",
        author: "Jorge Luis Borges",
        year: 1960,
        genre: "Poetry/Prose",
        status: "Owned",
        rating: 4,
        notes: "Beautiful prose poems",
    },
    {
        id: "universal-history-of-infamy",
        title: "A Universal History of Infamy",
        author: "Jorge Luis Borges",
        year: 1935,
        genre: "Fiction",
        status: "Owned",
        rating: 3,
        notes: "Early work, interesting but minor",
    },
];

export const AUTHORS: Author[] = [
    {id: "cormac-mccarthy", initials: "CM", name: "Cormac McCarthy", bookCount: 3, genre: "Fiction"},
    {id: "jorge-luis-borges", initials: "JLB", name: "Jorge Luis Borges", bookCount: 5, genre: "Fiction"},
    {id: "umberto-eco", initials: "UE", name: "Umberto Eco", bookCount: 4, genre: "Fiction"},
    {id: "italo-calvino", initials: "IC", name: "Italo Calvino", bookCount: 3, genre: "Fiction"},
    {id: "kazuo-ishiguro", initials: "KI", name: "Kazuo Ishiguro", bookCount: 2, genre: "Fiction"},
    {id: "edward-said", initials: "ES", name: "Edward Said", bookCount: 2, genre: "Non-fiction"},
    {id: "john-berger", initials: "JB", name: "John Berger", bookCount: 2, genre: "Art Theory"},
    {id: "mikhail-bulgakov", initials: "MB", name: "Mikhail Bulgakov", bookCount: 1, genre: "Fiction"},
];

export const ACTIVITY_ITEMS: ActivityItem[] = [
    {id: "1", type: "lent", text: "Lent <strong>Ficciones</strong> to <strong>Lucas M.</strong>", time: "2 days ago"},
    {id: "2", type: "added", text: "Added <strong>Blood Meridian</strong> to collection", time: "4 days ago"},
    {
        id: "3",
        type: "returned",
        text: "<strong>Sofia K.</strong> returned <strong>The Stranger</strong>",
        time: "1 week ago"
    },
    {
        id: "4",
        type: "lent",
        text: "Lent <strong>Orientalism</strong> to <strong>Marco R.</strong>",
        time: "2 weeks ago"
    },
    {id: "5", type: "added", text: "Added <strong>Ways of Seeing</strong> to collection", time: "3 weeks ago"},
];

export const BORGES_WORKS = BOOKS.filter((b) => b.author === "Jorge Luis Borges");

export function getLentBooks(): Book[] {
    return BOOKS.filter((b) => b.status === "Lent Out");
}

export function getOverdueBooks(): Book[] {
    return BOOKS.filter((b) => b.overdue === true);
}

export function getBookById(id: string): Book | undefined {
    return BOOKS.find((b) => b.id === id);
}
