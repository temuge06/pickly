import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center p-4 text-center">
      <div>
        <h1 className="text-xl font-semibold">Хуудас олдсонгүй</h1>
        <p className="mt-2 opacity-70">This page doesn&apos;t exist.</p>
        <Link href="/" className="mt-4 inline-block underline">
          LinkSpot
        </Link>
      </div>
    </main>
  );
}
