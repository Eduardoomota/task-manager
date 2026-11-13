# Task Manager

A small task manager built with **Next.js 15** (App Router), **tRPC 11** and **TanStack Query**. Tasks are kept in memory on the server; there is no database.

## Running

Requires Node.js 20 or newer (`.nvmrc` pins 22).

```bash
npm install
npm run dev
```

Open http://localhost:3000. The app starts with 30 sample tasks so the infinite scroll can be seen right away.

Other scripts: `npm run build`, `npm start`, `npm run lint`.

## Features

- List tasks with **server-side rendering**: the first page arrives in the HTML.
- **Infinite scroll**: the next pages load as the user reaches the end of the list.
- Create and edit tasks in a validated form.
- Delete tasks from the list, with confirmation and success/error toasts.
- Loading, empty, error and "end of list" states.

## How it works

```
src/
  schemas/task.ts          Zod schema + Task type, shared by client and server
  server/
    task-store.ts          the in-memory array (the "database")
    trpc.ts                tRPC setup and error formatting
    routers/tasks.ts       list, byId, create, update, delete
  trpc/
    server.ts              tRPC client for Server Components (prefetch)
    client.tsx             React provider and the useTRPC hook
  app/
    api/trpc/[trpc]/       exposes the router over HTTP
    page.tsx               task list (SSR)
    tasks/new, tasks/[id]/edit
  components/
    task-list.tsx          infinite list + delete
    task-form.tsx          create/edit form
```

The browser never calls `fetch` by hand. Components use typed tRPC hooks, and the types come straight from the router, so a change in the server contract shows up as a TypeScript error in the UI.

## Decisions

- **One validation schema.** `taskInputSchema` validates the form in the browser (instant feedback) and the input on the server (the check that actually protects the data). The rules cannot drift apart.
- **SSR through prefetch + hydration.** The home page is a Server Component that fetches the first page through the tRPC API, puts it in the TanStack Query cache and sends that cache with the HTML. The client list starts from it and only uses the network for the next pages. The page is `force-dynamic` because the data changes on every mutation.
- **Cursor pagination, not offset.** The cursor is the `dataCriacao` of the last task received. If a task is created or deleted while the user scrolls, no item is skipped or duplicated, which would happen with page numbers.
- **Infinite scroll with `IntersectionObserver`.** An empty element after the list triggers the next page when it becomes visible. No scroll listeners and no extra library. If a page fails to load, observing stops and a "Try again" button is shown, so a failing request is not retried in a loop.
- **Each row owns its delete mutation.** The "Deleting…" state belongs to a single row and several tasks can be deleted at once. After any delete attempt the list is refetched, so a row that was already removed elsewhere disappears.
- **Meaningful errors.** Operations on a missing task return `NOT_FOUND` with a readable message; invalid input returns `BAD_REQUEST` with the validation messages in plain text instead of a raw issue dump. The UI shows these messages as they are.
- **Plain `useState` in the form.** Two fields do not justify a form library.
- **Dates are shown in UTC with a fixed locale**, so the server and the browser render identical text and there is no hydration mismatch.
- **Field names** (`titulo`, `descricao`, `dataCriacao`) follow the challenge specification. Everything else is in English.

## Deployment

Live demo: https://task-manager-five-ashy-56.vercel.app

The demo runs on Vercel, where each page and the API route are separate serverless functions with separate memory. For that reason Server Components do not read the task array directly: they go through the tRPC HTTP API (`src/trpc/server.ts`), so the API route is the only owner of the data and every read and write sees the same list.

In-memory data on serverless is still best effort: the list resets to the sample tasks when the function goes cold, and consistency is not guaranteed if the platform runs more than one instance of the API. Running `npm run build && npm start` as a single Node process has neither issue.

## Limitations

- Data is lost when the server restarts, as requested by the challenge.
- The in-memory store assumes a single server process. On serverless or multi-instance hosting each instance would have its own list; a real deployment would need a database.
- There are no automated tests; the flows were verified manually.
