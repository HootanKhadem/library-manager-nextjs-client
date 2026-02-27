# Bibliotheca — Personal Library Manager

A personal library management application built with **Next.js 16**, **React 19**, **TypeScript 5**, and **Tailwind CSS
v4**. Track your book collection, manage lent books, and catalogue authors — all in a beautifully styled, client-side
app.

---

## Features

- **Dashboard** — Overview of your library with KPI cards (total books, lent, overdue) and recent activity
- **All Books** — Browse, filter (All / Owned / Lent Out / Wishlist), and search your full collection
- **Currently Lent** — Track books lent to friends and family; filter by overdue
- **Authors** — Browse authors represented in your collection
- **Add Book** — Add new books via modal form with full details
- **Book Detail** — View full book info, description, personal notes, and lending history
- **Settings** — Configure library name, loan duration, date format, and export options
- **Search** — Global search across book titles and authors
- **Responsive** — Mobile-friendly with collapsible sidebar

---

## Tech Stack

| Technology   | Version         |
|--------------|-----------------|
| Next.js      | 16 (App Router) |
| React        | 19              |
| TypeScript   | 5               |
| Tailwind CSS | 4               |
| Node.js      | ≥ 18            |

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9

### Installation

```bash
git clone <repository-url>
cd library-manager-nextjs-client
npm install
```

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm run start
```

---

## Running Tests

This project uses **Jest** + **React Testing Library** + **ts-jest** for unit and integration testing.

### Run all tests once

```bash
npm test
```

### Run tests in watch mode

```bash
npm run test:watch
```

### Run a specific test file

```bash
npx jest __tests__/Badge.test.tsx
npx jest __tests__/LibraryApp.test.tsx
```

### Test Coverage

```bash
npx jest --coverage
```

### What is tested

| Test File                  | What it covers                                                         |
|----------------------------|------------------------------------------------------------------------|
| `Badge.test.tsx`           | All four book status badge variants                                    |
| `StarRating.test.tsx`      | Star rendering for all ratings and custom max                          |
| `GenreTag.test.tsx`        | Genre tag text rendering                                               |
| `Sidebar.test.tsx`         | Navigation, active states, stats, Add Book button                      |
| `Topbar.test.tsx`          | Page titles, search input, query propagation                           |
| `BookDetailModal.test.tsx` | Book details, notes, lending history, keyboard close                   |
| `AddBookModal.test.tsx`    | Form validation, submit, cancel, keyboard close                        |
| `DashboardPage.test.tsx`   | KPI cards, panels, navigation callbacks                                |
| `BooksPage.test.tsx`       | Filter buttons, table rows, onBookClick, onAddBook                     |
| `LentPage.test.tsx`        | Lend cards, overdue filter, Mark Returned buttons                      |
| `data.test.ts`             | Data helpers: getLentBooks, getOverdueBooks, getBookById, BORGES_WORKS |
| `LibraryApp.test.tsx`      | Full integration: navigation, modals, search, add book                 |
| `page.test.tsx`            | Home page renders the app correctly                                    |

---

## Docker

### Build the Docker image

```bash
docker build -t bibliotheca .
```

### Run the container

```bash
docker run -p 3000:3000 bibliotheca
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Run with Docker Compose (optional)

```bash
docker compose up
```

---

## Project Structure

```
library-manager-nextjs-client/
├── app/
│   ├── globals.css          # Tailwind CSS v4 + custom fonts, animations
│   ├── layout.tsx           # Root layout with Next.js fonts (Playfair Display, Libre Baskerville, Courier Prime)
│   └── page.tsx             # Entry point — renders LibraryApp
├── components/
│   ├── LibraryApp.tsx       # Root client component with state management
│   ├── Sidebar.tsx          # Navigation sidebar
│   ├── Topbar.tsx           # Top bar with page title and search
│   ├── Badge.tsx            # Book status badge
│   ├── StarRating.tsx       # Star rating display
│   ├── GenreTag.tsx         # Genre label tag
│   ├── BookDetailModal.tsx  # Book detail modal with notes and history
│   ├── AddBookModal.tsx     # Add new book modal form
│   └── pages/
│       ├── DashboardPage.tsx
│       ├── BooksPage.tsx
│       ├── LentPage.tsx
│       ├── AuthorsPage.tsx
│       └── SettingsPage.tsx
├── lib/
│   ├── types.ts             # TypeScript types (Book, Author, etc.)
│   └── data.ts              # Sample data and helper functions
├── __tests__/               # Jest unit and integration tests
├── examples/
│   └── api-examples.ts      # Sync and async API usage examples
├── Dockerfile
├── docker-compose.yml
├── jest.config.ts
├── jest.setup.ts
├── next.config.ts
├── tsconfig.json
└── package.json
```

---

## Linting

```bash
npm run lint
```

---

## License

MIT
