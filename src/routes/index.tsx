import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import QRCode from "qrcode";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "QR Code Generator — Turn any URL into a QR code" },
      {
        name: "description",
        content:
          "Paste a website URL and instantly generate a unique, scannable QR code that links straight back to it.",
      },
      { property: "og:title", content: "QR Code Generator — Turn any URL into a QR code" },
      {
        property: "og:description",
        content: "Paste a website URL and instantly generate a unique, scannable QR code that links straight back to it.",
      },
    ],
  }),
  component: Index,
});

function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function Index() {
  const [url, setUrl] = useState("");
  const [qr, setQr] = useState<string | null>(null);
  const [finalUrl, setFinalUrl] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const target = normalizeUrl(url);
    if (!target) {
      setError("Please enter a URL.");
      return;
    }
    try {
      new URL(target);
    } catch {
      setError("That doesn't look like a valid URL.");
      return;
    }
    setLoading(true);
    try {
      const dataUrl = await QRCode.toDataURL(target, {
        width: 512,
        margin: 2,
        errorCorrectionLevel: "M",
        color: { dark: "#0f172a", light: "#ffffff" },
      });
      setQr(dataUrl);
      setFinalUrl(target);
    } catch {
      setError("Could not generate QR code. Try another URL.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">QR Code Generator</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Paste any website URL and get a scannable QR code.
          </p>
        </header>

        <form
          onSubmit={handleGenerate}
          className="flex flex-col gap-3 bg-card border border-border rounded-xl p-5 shadow-sm"
        >
          <label htmlFor="url" className="text-sm font-medium">
            Website URL
          </label>
          <input
            id="url"
            type="text"
            inputMode="url"
            autoComplete="url"
            placeholder="example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-1 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate QR code"}
          </button>
        </form>

        {qr && (
          <section className="mt-8 flex flex-col items-center gap-4 bg-card border border-border rounded-xl p-6 shadow-sm">
            <img
              src={qr}
              alt={`QR code for ${finalUrl}`}
              className="w-64 h-64 rounded-md"
            />
            <a
              href={finalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground underline break-all text-center"
            >
              {finalUrl}
            </a>
            <a
              href={qr}
              download="qr-code.png"
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Download PNG
            </a>
          </section>
        )}
      </div>
    </main>
  );
}
