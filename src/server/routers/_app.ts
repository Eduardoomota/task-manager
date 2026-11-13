import { router } from "../trpc";
import { tasksRouter } from "./tasks";

export const appRouter = router({
  tasks: tasksRouter,
});

/** Only the type crosses to the client; no server code is bundled there. */
export type AppRouter = typeof appRouter;
