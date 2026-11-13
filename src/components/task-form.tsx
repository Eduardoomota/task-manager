"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { taskInputSchema, type Task } from "@/schemas/task";
import { useTRPC } from "@/trpc/client";

type FieldErrors = { titulo?: string; descricao?: string };

/**
 * Create and edit share this form: with a `task` prop it edits, without it
 * creates. State is handled with plain `useState`; two fields do not justify
 * a form library.
 */
export function TaskForm({ task }: { task?: Task }) {
  const isEditing = Boolean(task);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();

  const [titulo, setTitulo] = useState(task?.titulo ?? "");
  const [descricao, setDescricao] = useState(task?.descricao ?? "");
  const [errors, setErrors] = useState<FieldErrors>({});

  const mutationCallbacks = {
    onSuccess: async (saved: Task) => {
      // Drop cached lists so the home page shows the change right away.
      await queryClient.invalidateQueries(trpc.tasks.pathFilter());
      toast.success(
        isEditing
          ? `"${saved.titulo}" was updated.`
          : `"${saved.titulo}" was created.`,
      );
      router.push("/");
    },
    onError: (error: { message: string }) => {
      toast.error(`Could not save the task: ${error.message}`);
    },
  };

  const createTask = useMutation(
    trpc.tasks.create.mutationOptions(mutationCallbacks),
  );
  const updateTask = useMutation(
    trpc.tasks.update.mutationOptions(mutationCallbacks),
  );
  const isSaving = createTask.isPending || updateTask.isPending;
  const serverError = createTask.error ?? updateTask.error;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Client-side validation with the same schema the server uses. It gives
    // instant feedback; the server still validates on its own.
    const result = taskInputSchema.safeParse({ titulo, descricao });
    if (!result.success) {
      const fieldErrors = z.flattenError(result.error).fieldErrors;
      setErrors({
        titulo: fieldErrors.titulo?.[0],
        descricao: fieldErrors.descricao?.[0],
      });
      return;
    }

    setErrors({});
    if (task) {
      updateTask.mutate({ id: task.id, ...result.data });
    } else {
      createTask.mutate(result.data);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div>
        <label htmlFor="titulo" className="mb-1 block text-sm font-medium">
          Title <span aria-hidden="true">*</span>
        </label>
        <input
          id="titulo"
          name="titulo"
          type="text"
          value={titulo}
          onChange={(event) => {
            setTitulo(event.target.value);
            if (errors.titulo) setErrors({ ...errors, titulo: undefined });
          }}
          required
          autoFocus
          aria-invalid={Boolean(errors.titulo)}
          aria-describedby={errors.titulo ? "titulo-error" : undefined}
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 aria-invalid:border-red-500"
        />
        {errors.titulo && (
          <p id="titulo-error" role="alert" className="mt-1 text-sm text-red-700">
            {errors.titulo}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="descricao" className="mb-1 block text-sm font-medium">
          Description <span className="font-normal text-neutral-500">(optional)</span>
        </label>
        <textarea
          id="descricao"
          name="descricao"
          rows={4}
          value={descricao}
          onChange={(event) => {
            setDescricao(event.target.value);
            if (errors.descricao) setErrors({ ...errors, descricao: undefined });
          }}
          aria-invalid={Boolean(errors.descricao)}
          aria-describedby={errors.descricao ? "descricao-error" : undefined}
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 aria-invalid:border-red-500"
        />
        {errors.descricao && (
          <p id="descricao-error" role="alert" className="mt-1 text-sm text-red-700">
            {errors.descricao}
          </p>
        )}
      </div>

      {/* Server errors also stay on the page; a toast alone disappears. */}
      {serverError && !isSaving && (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {serverError.message}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving…" : isEditing ? "Save changes" : "Create task"}
        </button>
        <Link href="/" className="text-sm font-medium text-neutral-700 underline">
          Cancel
        </Link>
      </div>
    </form>
  );
}
