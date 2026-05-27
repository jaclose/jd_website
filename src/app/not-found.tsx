import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-40 text-center">
      <p className="text-6xl font-bold text-indigo-500">404</p>
      <h1 className="mt-4 text-2xl font-semibold text-white">
        Page not found
      </h1>
      <p className="mt-2 text-slate-400">
        The page you&apos;re looking for doesn&apos;t exist or was moved.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
      >
        Back to home
      </Link>
    </div>
  );
}
