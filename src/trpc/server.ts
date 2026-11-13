import "server-only";

import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { cache } from "react";
import { appRouter } from "@/server/routers/_app";
import { makeQueryClient } from "./query-client";

/** One QueryClient per request, shared by every Server Component in it. */
export const getQueryClient = cache(makeQueryClient);

/**
 * Server-side tRPC helpers. Server Components call the router directly
 * (plain function calls, no HTTP round trip to our own API).
 */
export const trpc = createTRPCOptionsProxy({
  ctx: {},
  router: appRouter,
  queryClient: getQueryClient,
});

export const caller = appRouter.createCaller({});
