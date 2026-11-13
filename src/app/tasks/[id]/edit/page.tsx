import { TRPCClientError } from "@trpc/client";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TaskForm } from "@/components/task-form";
import { serverClient } from "@/trpc/server";

export const metadata: Metadata = { title: "Edit task | Task Manager" };

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // The task is loaded on the server, so the form arrives already filled in.
  const task = await serverClient.tasks.byId.query({ id }).catch((error: unknown) => {
    if (error instanceof TRPCClientError && error.data?.code === "NOT_FOUND") {
      notFound();
    }
    throw error;
  });

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Edit task</h1>
      <TaskForm task={task} />
    </>
  );
}
