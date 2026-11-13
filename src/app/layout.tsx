import type { Metadata } from "next";
import Link from "next/link";
import { Toaster } from "sonner";
import { TRPCReactProvider } from "@/trpc/client";
import "./globals.css";

export const metadata: Metadata = {
  title: "Task Manager",
  description: "A simple task manager built with Next.js and tRPC.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <TRPCReactProvider>
          <header className="border-b border-neutral-200 bg-white">
            <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
              <Link href="/" className="text-lg font-semibold">
                Task Manager
              </Link>
              <Link
                href="/tasks/new"
                className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-700"
              >
                New task
              </Link>
            </div>
          </header>
          <main className="mx-auto max-w-2xl px-4 py-8">{children}</main>
          <Toaster richColors position="top-right" />
        </TRPCReactProvider>
      </body>
    </html>
  );
}
