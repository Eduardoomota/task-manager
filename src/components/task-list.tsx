"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { PAGE_SIZE } from "@/lib/constants";
import type { Task } from "@/schemas/task";
import { useTRPC } from "@/trpc/client";

// Fixed locale and time zone: the server and the browser must render the
// exact same text, otherwise React reports a hydration mismatch.
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

export function TaskList() {
  const trpc = useTRPC();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const {
    data,
    error,
    isPending,
    isFetchingNextPage,
    isFetchNextPageError,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery(
    trpc.tasks.list.infiniteQueryOptions(
      { limit: PAGE_SIZE },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    ),
  );

  // Infinite scroll: an invisible element sits after the last task. When it
  // enters the viewport, the next page is requested. It stops observing after
  // a failure so a broken request is not retried in a loop; the user gets a
  // "Try again" button instead.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage || isFetchingNextPage || isFetchNextPageError) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) fetchNextPage();
      },
      { rootMargin: "200px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage]);

  if (isPending) {
    return <p role="status">Loading tasks…</p>;
  }

  // Nothing to show at all: the very first load failed.
  if (!data) {
    return (
      <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-4">
        <p className="text-red-800">Could not load tasks: {error?.message}</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-3 rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100"
        >
          Try again
        </button>
      </div>
    );
  }

  const tasks = data.pages.flatMap((page) => page.items);

  if (tasks.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-neutral-300 p-8 text-center text-neutral-600">
        No tasks yet.{" "}
        <Link href="/tasks/new" className="font-medium text-blue-700 underline">
          Create the first one
        </Link>
        .
      </p>
    );
  }

  return (
    <>
      <ul className="space-y-3">
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </ul>

      <div ref={sentinelRef} aria-hidden="true" />

      <div className="py-6 text-center text-sm text-neutral-600" aria-live="polite">
        {isFetchingNextPage && <p>Loading more tasks…</p>}
        {isFetchNextPageError && (
          <p className="text-red-700">
            Could not load more tasks.{" "}
            <button
              type="button"
              onClick={() => fetchNextPage()}
              className="font-medium underline"
            >
              Try again
            </button>
          </p>
        )}
        {!hasNextPage && <p>You have reached the end of the list.</p>}
      </div>
    </>
  );
}

/**
 * Each row owns its delete mutation, so its loading state is independent:
 * deleting one task never disables or blocks the others.
 */
function TaskItem({ task }: { task: Task }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const deleteTask = useMutation(
    trpc.tasks.delete.mutationOptions({
      onSuccess: (removed) => {
        toast.success(`"${removed.titulo}" was deleted.`);
      },
      onError: (mutationError) => {
        toast.error(`Could not delete the task: ${mutationError.message}`);
      },
      // Success or failure, resync with the server. On failure the task may
      // already be gone (deleted elsewhere) and the list should reflect that.
      // Returning the promise keeps the button disabled until the list is fresh.
      onSettled: () => queryClient.invalidateQueries(trpc.tasks.pathFilter()),
    }),
  );

  function handleDelete() {
    if (window.confirm(`Delete "${task.titulo}"?`)) {
      deleteTask.mutate({ id: task.id });
    }
  }

  return (
    <li
      className={`rounded-md border border-neutral-200 bg-white p-4 transition-opacity ${
        deleteTask.isPending ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-medium break-words">{task.titulo}</h2>
          {task.descricao && (
            <p className="mt-1 text-sm break-words whitespace-pre-line text-neutral-700">
              {task.descricao}
            </p>
          )}
          <p className="mt-2 text-xs text-neutral-500">
            Created{" "}
            <time dateTime={new Date(task.dataCriacao).toISOString()}>
              {dateFormatter.format(task.dataCriacao)} UTC
            </time>
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          <Link
            href={`/tasks/${task.id}/edit`}
            aria-label={`Edit ${task.titulo}`}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium hover:bg-neutral-100"
          >
            Edit
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteTask.isPending}
            aria-label={`Delete ${task.titulo}`}
            className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed"
          >
            {deleteTask.isPending ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </li>
  );
}
