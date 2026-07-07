import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { encodeDestination } from "@/lib/qr-encoding";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "QR Code Generator — Turn any URL into a QR code" },
      {
        name: "description",
        content:
          "Paste a website URL and instantly generate a unique, scannable QR code with custom colors and a shareable link.",
      },
      { property: "og:title", content: "QR Code Generator" },
      {
        property: "og:description",
        content: "Paste a URL, style it, and share a scannable QR code.",
      },
    ],
  }),
  component: Index,
});

type HistoryItem = {
  id: string;
  url: string;
  qr: string;
  shareUrl: string;
  fg: string;
  bg: string;
  createdAt: number;
};

const STORAGE_KEY = "qr-history-v2";
const MAX_HISTORY = 50;
const DEFAULT_FG = "#0f172a";
const DEFAULT_BG = "#ffffff";

function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function buildShareUrl(destination: string): string {
  const id = encodeDestination(destination);
  const origin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "";
  return `${origin}/qr/${id}`;
}

function Index() {
  const [url, setUrl] = useState("");
  const [fg, setFg] = useState(DEFAULT_FG);
  const [bg, setBg] = useState(DEFAULT_BG);
  const [qr, setQr] = useState<string | null>(null);
  const [finalUrl, setFinalUrl] = useState<string>("");
  const [shareUrl, setShareUrl] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch {
      // ignore
    }
  }, [history, hydrated]);

  async function makeQr(payload: string, foreground: string, background: string) {
    return QRCode.toDataURL(payload, {
      width: 512,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: foreground, light: background },
    });
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCopied(false);
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
      const share = buildShareUrl(target);
      const dataUrl = await makeQr(share, fg, bg);
      setQr(dataUrl);
      setFinalUrl(target);
      setShareUrl(share);
      setHistory((prev) => {
        const filtered = prev.filter((h) => h.url !== target);
        const next: HistoryItem[] = [
          {
            id:
              typeof crypto !== "undefined" && "randomUUID" in crypto
                ? crypto.randomUUID()
                : String(Date.now()),
            url: target,
            qr: dataUrl,
            shareUrl: share,
            fg,
            bg,
            createdAt: Date.now(),
          },
          ...filtered,
        ];
        return next.slice(0, MAX_HISTORY);
      });
    } catch {
      setError("Could not generate QR code. Try another URL.");
    } finally {
      setLoading(false);
    }
  }

  function revisit(item: HistoryItem) {
    setUrl(item.url);
    setQr(item.qr);
    setFinalUrl(item.url);
    setShareUrl(item.shareUrl || buildShareUrl(item.url));
    setFg(item.fg || DEFAULT_FG);
    setBg(item.bg || DEFAULT_BG);
    setError(null);
    setCopied(false);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function removeItem(id: string) {
    setHistory((prev) => prev.filter((h) => h.id !== id));
  }

  function clearHistory() {
    setHistory([]);
  }

  async function copyShare() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground flex justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">QR Code Generator</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Paste any website URL, style it, and share a scannable QR code.
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

          <div className="grid grid-cols-2 gap-3">
            <ColorField label="Foreground" value={fg} onChange={setFg} />
            <ColorField label="Background" value={bg} onChange={setBg} />
          </div>
          <button
            type="button"
            onClick={() => {
              setFg(DEFAULT_FG);
              setBg(DEFAULT_BG);
            }}
            className="self-start text-xs text-muted-foreground hover:text-foreground"
          >
            Reset colors
          </button>

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
              className="w-64 h-64 rounded-md border border-border"
            />
            <div className="w-full text-center">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Destination
              </p>
              <a
                href={finalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm underline break-all"
              >
                {finalUrl}
              </a>
            </div>
            <div className="w-full text-center">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Shareable link
              </p>
              <a
                href={shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm underline break-all"
              >
                {shareUrl}
              </a>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <a
                href={qr}
                download="qr-code.png"
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
              >
                Download PNG
              </a>
              <button
                type="button"
                onClick={copyShare}
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
              >
                {copied ? "Copied!" : "Copy share link"}
              </button>
            </div>
          </section>
        )}

        {hydrated && history.length > 0 && (
          <section className="mt-10">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">History</h2>
              <button
                onClick={clearHistory}
                className="text-xs text-muted-foreground hover:text-destructive"
              >
                Clear all
              </button>
            </div>
            <ul className="flex flex-col gap-2">
              {history.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 bg-card border border-border rounded-lg p-3 shadow-sm"
                >
                  <button
                    onClick={() => revisit(item)}
                    className="shrink-0"
                    aria-label={`Revisit QR for ${item.url}`}
                  >
                    <img src={item.qr} alt="" className="w-12 h-12 rounded" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => revisit(item)}
                      className="block w-full text-left text-sm font-medium truncate hover:underline"
                      title={item.url}
                    >
                      {item.url}
                    </button>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <a
                      href={item.qr}
                      download={`qr-${safeHost(item.url)}.png`}
                      className="inline-flex items-center justify-center rounded-md border border-input bg-background px-2 py-1 text-xs font-medium hover:bg-accent"
                    >
                      Download
                    </a>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="inline-flex items-center justify-center rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-destructive"
                      aria-label="Remove"
                    >
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}

function safeHost(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "code";
  }
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2 rounded-md border border-input bg-background px-2 py-1">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
          aria-label={`${label} color`}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-xs font-mono outline-none"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
