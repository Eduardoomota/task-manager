import { QueryClient } from "@tanstack/react-query";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data prefetched on the server is considered fresh for a while, so
        // the browser does not refetch it immediately after hydration.
        staleTime: 30 * 1000,
      },
    },
  });
}
