import { initTRPC } from "@trpc/server";
import { ZodError } from "zod";

const t = initTRPC.create({
  /**
   * By default a failed Zod validation reaches the client as a JSON dump of
   * issues. Here it becomes a readable sentence the UI can show as is.
   */
  errorFormatter({ shape, error }) {
    if (error.cause instanceof ZodError) {
      return {
        ...shape,
        message: error.cause.issues.map((issue) => issue.message).join(". "),
      };
    }
    return shape;
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
