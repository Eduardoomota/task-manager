import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { TaskList } from "@/components/task-list";
import { PAGE_SIZE } from "@/lib/constants";
import { getQueryClient, trpc } from "@/trpc/server";

// The list changes on every mutation and lives in memory, so this page must
// be rendered per request (SSR) instead of being prerendered at build time.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const queryClient = getQueryClient();

  // SSR: the first page is fetched on the server and shipped inside the HTML.
  // The client component picks it up from the cache and only goes to the
  // network for the following pages.
  await queryClient.prefetchInfiniteQuery(
    trpc.tasks.list.infiniteQueryOptions(
      { limit: PAGE_SIZE },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    ),
  );

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Tasks</h1>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <TaskList />
      </HydrationBoundary>
    </>
  );
}
