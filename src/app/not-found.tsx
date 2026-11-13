import Link from "next/link";

export default function NotFound() {
  return (
    <div className="text-center">
      <h1 className="text-2xl font-semibold">Not found</h1>
      <p className="mt-2 text-neutral-600">
        This page or task does not exist. It may have been deleted.
      </p>
      <Link href="/" className="mt-4 inline-block font-medium text-blue-700 underline">
        Back to tasks
      </Link>
    </div>
  );
}
