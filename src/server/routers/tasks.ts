import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { taskInputSchema, type Task } from "@/schemas/task";
import { nextTimestamp, tasks } from "../task-store";
import { publicProcedure, router } from "../trpc";

const idSchema = z.object({ id: z.string().min(1) });

/** Returns the task's position in the array or throws a meaningful error. */
function findIndexOrThrow(id: string): number {
  const index = tasks.findIndex((task) => task.id === id);
  if (index === -1) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Task not found. It may have been deleted.",
    });
  }
  return index;
}

export const tasksRouter = router({
  /**
   * Cursor pagination for infinite scroll. The cursor is the `dataCriacao` of
   * the last task the client already has, so pages stay consistent even if
   * tasks are created or deleted between requests (an offset would shift).
   */
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(50).default(10),
        cursor: z.number().nullish(),
      }),
    )
    .query(({ input }) => {
      const remaining =
        input.cursor == null
          ? tasks
          : tasks.filter((task) => task.dataCriacao < input.cursor!);
      const items = remaining.slice(0, input.limit);
      const hasMore = remaining.length > input.limit;

      return {
        items,
        nextCursor: hasMore ? items[items.length - 1].dataCriacao : null,
      };
    }),

  byId: publicProcedure.input(idSchema).query(({ input }) => {
    return tasks[findIndexOrThrow(input.id)];
  }),

  create: publicProcedure.input(taskInputSchema).mutation(({ input }) => {
    const task: Task = {
      id: crypto.randomUUID(),
      titulo: input.titulo,
      descricao: input.descricao || undefined,
      dataCriacao: nextTimestamp(),
    };
    tasks.unshift(task);
    return task;
  }),

  update: publicProcedure
    .input(idSchema.extend(taskInputSchema.shape))
    .mutation(({ input }) => {
      const index = findIndexOrThrow(input.id);
      tasks[index] = {
        ...tasks[index],
        titulo: input.titulo,
        descricao: input.descricao || undefined,
      };
      return tasks[index];
    }),

  delete: publicProcedure.input(idSchema).mutation(({ input }) => {
    const [removed] = tasks.splice(findIndexOrThrow(input.id), 1);
    return removed;
  }),
});
