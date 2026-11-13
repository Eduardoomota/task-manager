import { z } from "zod";

/**
 * Single source of truth for task validation.
 *
 * The same schema runs in the browser (form validation, instant feedback)
 * and on the server (tRPC input validation, the one that actually protects
 * the data). Field names follow the challenge spec.
 */
export const taskInputSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(120, "Title must be at most 120 characters"),
  descricao: z
    .string()
    .trim()
    .max(1000, "Description must be at most 1000 characters")
    .optional(),
});

export type TaskInput = z.infer<typeof taskInputSchema>;

export type Task = {
  id: string;
  titulo: string;
  descricao?: string;
  /** Unix timestamp in milliseconds. */
  dataCriacao: number;
};
