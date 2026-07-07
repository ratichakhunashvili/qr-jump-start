import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { decodeDestination } from "@/lib/qr-encoding";

export const Route = createFileRoute("/qr/$id")({
  head: () => ({
    meta: [
      { title: "Opening link…" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: QrRedirect,
});

function QrRedirect() {
  const { id } = Route.useParams();
  const destination = useMemo(() => decodeDestination(id), [id]);
  const [redirected, setRedirected] = useState(false);

  useEffect(() => {
    if (destination) {
      const t = setTimeout(() => {
        setRedirected(true);
        window.location.replace(destination);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [destination]);

  if (!destination) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background text-foreground px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold">Invalid QR link</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This shareable QR link is malformed or has been tampered with.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Create a new QR
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background text-foreground px-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold">
          {redirected ? "Redirecting…" : "Opening link…"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground break-all">
          Taking you to{" "}
          <a href={destination} className="underline">
            {destination}
          </a>
        </p>
        <p className="mt-6 text-xs text-muted-foreground">
          Not redirected automatically?{" "}
          <a href={destination} className="underline">
            Click here
          </a>
          .
        </p>
      </div>
    </main>
  );
}
