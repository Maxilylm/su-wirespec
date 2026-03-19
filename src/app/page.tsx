"use client";

import { useState, useCallback, useRef } from "react";

// ── Types ──────────────────────────────────────────────────────────────────

interface Component {
  name: string;
  type: string;
  description: string;
  interactions: string[];
}

interface Spec {
  title: string;
  overview: string;
  components: Component[];
  userFlow: string[];
  technicalNotes: string[];
  accessibilityNotes: string[];
  estimatedComplexity: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const COMPLEXITY_COLORS: Record<string, string> = {
  low: "bg-green-500/20 text-green-400 border-green-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  high: "bg-red-500/20 text-red-400 border-red-500/30",
};

function getComplexityStyle(complexity: string): string {
  const lower = complexity.toLowerCase();
  if (lower.includes("low")) return COMPLEXITY_COLORS.low;
  if (lower.includes("high")) return COMPLEXITY_COLORS.high;
  return COMPLEXITY_COLORS.medium;
}

function specToMarkdown(spec: Spec): string {
  let md = `# ${spec.title}\n\n`;
  md += `## Overview\n${spec.overview}\n\n`;
  md += `## Components\n`;
  spec.components.forEach((c) => {
    md += `### ${c.name} (${c.type})\n${c.description}\n`;
    if (c.interactions.length > 0) {
      md += `**Interactions:**\n`;
      c.interactions.forEach((i) => (md += `- ${i}\n`));
    }
    md += `\n`;
  });
  md += `## User Flow\n`;
  spec.userFlow.forEach((step, i) => (md += `${i + 1}. ${step}\n`));
  md += `\n## Technical Notes\n`;
  spec.technicalNotes.forEach((n) => (md += `- ${n}\n`));
  md += `\n## Accessibility Notes\n`;
  spec.accessibilityNotes.forEach((n) => (md += `- ${n}\n`));
  md += `\n## Estimated Complexity\n${spec.estimatedComplexity}\n`;
  return md;
}

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB

// ── Component ──────────────────────────────────────────────────────────────

export default function Home() {
  const [imageData, setImageData] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [spec, setSpec] = useState<Spec | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (PNG, JPG, WEBP, etc.)");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("File size must be under 4MB");
      return;
    }
    setError("");
    setFileName(file.name);
    setSpec(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageData(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleAnalyze = useCallback(async () => {
    if (!imageData) return;
    setLoading(true);
    setError("");
    setSpec(null);

    try {
      const res = await fetch("/api/describe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageData }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      setSpec(data.spec);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [imageData]);

  const handleCopyMarkdown = useCallback(async () => {
    if (!spec) return;
    await navigator.clipboard.writeText(specToMarkdown(spec));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [spec]);

  const handleReset = useCallback(() => {
    setImageData(null);
    setFileName("");
    setSpec(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[#262626] bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center font-bold text-white text-sm">
              W
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[#fafafa] leading-tight">
                WireSpec
              </h1>
              <p className="text-xs text-[#a3a3a3]">
                AI Wireframe to Product Spec
              </p>
            </div>
          </div>
          <a
            href="https://github.com/maxilylm/su-wirespec"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#a3a3a3] hover:text-[#fafafa] transition-colors"
          >
            GitHub
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Hero */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#fafafa] mb-3 tracking-tight">
            Wireframe to Product Spec
          </h2>
          <p className="text-[#a3a3a3] text-lg max-w-2xl mx-auto">
            Upload a wireframe or sketch and get a detailed, structured product
            specification in seconds.
          </p>
        </div>

        {/* Upload Zone */}
        <section className="mb-10">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
              dragOver
                ? "border-violet-500 bg-violet-500/10"
                : imageData
                  ? "border-[#262626] bg-[#141414]"
                  : "border-[#262626] bg-[#141414] hover:border-[#404040] hover:bg-[#1a1a1a]"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {imageData ? (
              <div className="space-y-4">
                <img
                  src={imageData}
                  alt="Uploaded wireframe"
                  className="max-h-80 mx-auto rounded-xl border border-[#262626]"
                />
                <div className="flex items-center justify-center gap-3">
                  <span className="text-sm text-[#a3a3a3]">{fileName}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReset();
                    }}
                    className="text-xs px-3 py-1.5 rounded-lg border border-[#262626] text-[#a3a3a3] hover:text-[#fafafa] hover:border-[#404040] transition-colors cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-[#1a1a1a] border border-[#262626] flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-[#a3a3a3]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                    />
                  </svg>
                </div>
                <p className="text-[#fafafa] font-medium">
                  Drop your wireframe here or click to browse
                </p>
                <p className="text-sm text-[#a3a3a3]">
                  PNG, JPG, WEBP up to 4MB
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Analyze Button */}
        <div className="flex justify-center mb-12">
          <button
            onClick={handleAnalyze}
            disabled={!imageData || loading}
            className={`relative px-8 py-3.5 rounded-xl font-semibold text-base transition-all duration-200 ${
              imageData && !loading
                ? "bg-gradient-to-r from-violet-600 to-purple-700 text-white hover:shadow-lg hover:shadow-violet-500/25 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                : "bg-[#262626] text-[#525252] cursor-not-allowed"
            }`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Analyzing Wireframe...
              </span>
            ) : (
              "Analyze Wireframe"
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-8 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-4 mb-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="border border-[#262626] bg-[#141414] rounded-xl p-5"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-24 h-5 rounded animate-shimmer" />
                  <div className="w-16 h-5 rounded animate-shimmer" />
                </div>
                <div className="space-y-2">
                  <div className="w-full h-4 rounded animate-shimmer" />
                  <div className="w-4/5 h-4 rounded animate-shimmer" />
                  <div className="w-3/5 h-4 rounded animate-shimmer" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {spec && (
          <section className="animate-fade-in-up space-y-8">
            {/* Title + Copy */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold text-[#fafafa]">
                  {spec.title}
                </h3>
                <span
                  className={`inline-block mt-2 text-xs px-3 py-1 rounded-full border font-medium ${getComplexityStyle(spec.estimatedComplexity)}`}
                >
                  {spec.estimatedComplexity} complexity
                </span>
              </div>
              <button
                onClick={handleCopyMarkdown}
                className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-[#262626] bg-[#0a0a0a] text-[#a3a3a3] hover:text-[#fafafa] hover:border-[#404040] transition-all cursor-pointer"
              >
                {copied ? (
                  <>
                    <svg
                      className="w-4 h-4 text-green-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Copy as Markdown
                  </>
                )}
              </button>
            </div>

            {/* Overview */}
            <div className="border border-[#262626] bg-[#141414] rounded-xl p-6">
              <h4 className="text-sm font-semibold text-violet-400 uppercase tracking-wider mb-3">
                Overview
              </h4>
              <p className="text-[#d4d4d4] leading-relaxed">{spec.overview}</p>
            </div>

            {/* Components */}
            <div>
              <h4 className="text-sm font-semibold text-violet-400 uppercase tracking-wider mb-4">
                Components
              </h4>
              <div className="grid sm:grid-cols-2 gap-4">
                {spec.components.map((comp, i) => (
                  <div
                    key={i}
                    className="border border-[#262626] bg-[#141414] rounded-xl p-5 hover:border-[#404040] transition-colors animate-fade-in-up"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold text-[#fafafa]">
                        {comp.name}
                      </h5>
                      <span className="text-xs px-2 py-0.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-400">
                        {comp.type}
                      </span>
                    </div>
                    <p className="text-sm text-[#a3a3a3] mb-3">
                      {comp.description}
                    </p>
                    {comp.interactions.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-[#737373] uppercase tracking-wider mb-1.5">
                          Interactions
                        </p>
                        <ul className="space-y-1">
                          {comp.interactions.map((interaction, j) => (
                            <li
                              key={j}
                              className="text-xs text-[#a3a3a3] flex items-start gap-2"
                            >
                              <span className="text-violet-400 mt-0.5 flex-shrink-0">
                                &bull;
                              </span>
                              {interaction}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* User Flow */}
            {spec.userFlow.length > 0 && (
              <div className="border border-[#262626] bg-[#141414] rounded-xl p-6">
                <h4 className="text-sm font-semibold text-violet-400 uppercase tracking-wider mb-4">
                  User Flow
                </h4>
                <ol className="space-y-3">
                  {spec.userFlow.map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-violet-500/20 text-violet-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-sm text-[#d4d4d4]">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Technical Notes */}
            {spec.technicalNotes.length > 0 && (
              <div className="border border-[#262626] bg-[#141414] rounded-xl p-6">
                <h4 className="text-sm font-semibold text-violet-400 uppercase tracking-wider mb-3">
                  Technical Notes
                </h4>
                <ul className="space-y-2">
                  {spec.technicalNotes.map((note, i) => (
                    <li
                      key={i}
                      className="text-sm text-[#d4d4d4] flex items-start gap-2"
                    >
                      <svg
                        className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Accessibility Notes */}
            {spec.accessibilityNotes.length > 0 && (
              <div className="border border-[#262626] bg-[#141414] rounded-xl p-6">
                <h4 className="text-sm font-semibold text-violet-400 uppercase tracking-wider mb-3">
                  Accessibility Notes
                </h4>
                <ul className="space-y-2">
                  {spec.accessibilityNotes.map((note, i) => (
                    <li
                      key={i}
                      className="text-sm text-[#d4d4d4] flex items-start gap-2"
                    >
                      <svg
                        className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#262626] mt-20">
        <div className="max-w-5xl mx-auto px-6 py-6 text-center text-xs text-[#a3a3a3]">
          Powered by Groq + Llama 3.2 Vision &middot; Specs are AI-generated
          &mdash; always review before using
        </div>
      </footer>
    </div>
  );
}
