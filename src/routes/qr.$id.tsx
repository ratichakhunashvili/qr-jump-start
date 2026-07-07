import { createFileRoute, Link } from "@tanstack/react-router";
import { decodeDestination } from "@/lib/qr-encoding";

export const Route = createFileRoute("/qr/$id")({
  head: ({ params }) => {
    const dest = decodeDestination(params.id);
    return {
      meta: [
        { title: dest ? `Open ${safeHost(dest)}` : "Invalid QR link" },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  component: QrLanding,
});

function safeHost(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "link";
  }
}

function QrLanding() {
  const { id } = Route.useParams();
  const destination = decodeDestination(id);

  if (!destination) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background text-foreground px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold">Invalid QR link</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This shareable link is malformed.
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
    <main className="min-h-screen flex items-center justify-center bg-background text-foreground px-4 py-12">
      <div className="w-full max-w-md text-center">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Shared link
        </p>
        <h1 className="mt-2 text-2xl font-bold break-all">
          {safeHost(destination)}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground break-all">
          {destination}
        </p>
        <a
          href={destination}
          className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Open link
        </a>
        <div className="mt-6">
          <Link
            to="/"
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Create your own QR code
          </Link>
        </div>
      </div>
    </main>
  );
}
