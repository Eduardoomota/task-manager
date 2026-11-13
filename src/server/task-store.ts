import type { Task } from "@/schemas/task";

/**
 * In-memory "database": a plain array, newest task first.
 *
 * It lives on `globalThis` because Next.js re-evaluates modules on hot reload
 * and may bundle route handlers and pages separately; a module-level variable
 * could end up duplicated or reset. Data is lost when the process restarts,
 * which is what the challenge asks for.
 */
const globalStore = globalThis as typeof globalThis & { __tasks?: Task[] };

const HOUR = 60 * 60 * 1000;

const SAMPLE_TITLES = [
  "Review pull requests",
  "Update project dependencies",
  "Write release notes",
  "Fix flaky checkout test",
  "Plan next sprint",
  "Refactor date helpers",
  "Audit accessibility of forms",
  "Reply to design feedback",
  "Measure bundle size",
  "Document the deploy process",
];

/** Seeds enough tasks to make infinite scroll visible on first run. */
function seed(): Task[] {
  const now = Date.now();
  return Array.from({ length: 30 }, (_, index) => ({
    // Fixed ids: every server instance starts with the same sample tasks.
    id: `seed-${30 - index}`,
    titulo: `${SAMPLE_TITLES[index % SAMPLE_TITLES.length]} #${30 - index}`,
    descricao: index % 3 === 0 ? "Sample task created on startup." : undefined,
    dataCriacao: now - (index + 1) * HOUR,
  }));
}

export const tasks: Task[] = (globalStore.__tasks ??= seed());

/**
 * Creation timestamps double as the pagination cursor, so they must be unique.
 * Two tasks created in the same millisecond get consecutive values.
 */
export function nextTimestamp(): number {
  const newest = tasks[0]?.dataCriacao ?? 0;
  return Math.max(Date.now(), newest + 1);
}
