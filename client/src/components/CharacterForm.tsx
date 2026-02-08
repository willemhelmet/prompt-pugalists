import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { CHARACTER_PROMPT_CHAR_LIMIT } from "../types";
import { api } from "../lib/api";
import { resizeImage } from "../lib/resizeImage";

interface CharacterFormProps {
  initialName?: string;
  initialTextPrompt?: string;
  initialImageUrl?: string | null;
  initialReferenceImageUrl?: string | null;
  onSubmit: (data: {
    name: string;
    textPrompt: string;
    imageUrl: string;
    referenceImageUrl: string | null;
  }) => Promise<void>;
  submitLabel: string;
  submittingLabel: string;
  title: string;
  backHref: string;
}

export function CharacterForm({
  initialName = "",
  initialTextPrompt = "",
  initialImageUrl = null,
  initialReferenceImageUrl = null,
  onSubmit,
  submitLabel,
  submittingLabel,
  title,
  backHref,
}: CharacterFormProps) {
  const [name, setName] = useState(initialName);
  const [textPrompt, setTextPrompt] = useState(initialTextPrompt);
  const [imageUrl, setImageUrl] = useState<string | null>(initialImageUrl);
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referencePreview, setReferencePreview] = useState<string | null>(
    initialReferenceImageUrl,
  );
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (referencePreview && referencePreview.startsWith("blob:")) {
        URL.revokeObjectURL(referencePreview);
      }
    };
  }, [referencePreview]);

  async function applyFile(file: File) {
    const resized = await resizeImage(file);
    setReferenceFile(resized);
    setReferencePreview(URL.createObjectURL(resized));
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) applyFile(file);
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) applyFile(file);
  }

  function removeReference() {
    if (referencePreview && referencePreview.startsWith("blob:")) {
      URL.revokeObjectURL(referencePreview);
    }
    setReferenceFile(null);
    setReferencePreview(null);
  }

  async function handleGenerate() {
    if (!textPrompt.trim() || generating) return;
    setGenerating(true);
    setError(null);

    try {
      let result: { url: string };
      if (referenceFile) {
        result = await api.generateCharacterImageWithReference(
          referenceFile,
          textPrompt.trim(),
        );
      } else {
        result = await api.generateCharacterImage(textPrompt.trim());
      }
      setImageUrl(result.url);
    } catch (err: any) {
      console.error("Generation failed:", err);
      setError(err.message || "Image generation failed");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSurpriseMe() {
    if (suggesting) return;
    setSuggesting(true);
    setError(null);

    try {
      const result = await api.suggestCharacter();
      setName(result.name);
      setTextPrompt(result.prompt);
    } catch (err: any) {
      console.error("Suggestion failed:", err);
      setError(err.message || "Suggestion failed");
    } finally {
      setSuggesting(false);
    }
  }

  async function handleEnhance() {
    if (!textPrompt.trim() || enhancing) return;
    setEnhancing(true);
    setError(null);

    try {
      const result = await api.enhanceCharacterPrompt(textPrompt.trim());
      setTextPrompt(result.enhancedPrompt);
    } catch (err: any) {
      console.error("Enhancement failed:", err);
      setError(err.message || "Enhancement failed");
    } finally {
      setEnhancing(false);
    }
  }

  async function handleSubmit() {
    if (!name.trim() || !textPrompt.trim() || saving) return;
    setSaving(true);
    setError(null);

    // If no generated image yet, use DiceBear fallback
    const finalImage =
      imageUrl ||
      `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(name)}`;

    // Upload reference image to ImgBB if it's a new file
    let finalReferenceUrl: string | null = null;
    if (referenceFile) {
      try {
        const { url } = await api.uploadImage(referenceFile);
        finalReferenceUrl = url;
      } catch (err: any) {
        console.error("Reference upload failed:", err);
      }
    } else if (referencePreview && !referencePreview.startsWith("blob:")) {
      // Existing URL from loaded character
      finalReferenceUrl = referencePreview;
    }

    try {
      await onSubmit({
        name: name.trim(),
        textPrompt: textPrompt.trim(),
        imageUrl: finalImage,
        referenceImageUrl: finalReferenceUrl,
      });
    } catch (err: any) {
      console.error("Save failed:", err);
      setError(err.message || "Save failed");
      setSaving(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden font-body">
      {/* ── Background atmosphere ── */}
      <div className="fixed inset-0 bg-gray-950">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-indigo-600/15 rounded-full blur-[160px]" />
        <div className="absolute -bottom-40 -right-32 w-[500px] h-[400px] bg-purple-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 -left-40 w-[350px] h-[350px] bg-fuchsia-600/[0.07] rounded-full blur-[120px]" />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col items-center px-5 pt-8 pb-14 gap-7 max-w-xl mx-auto">
        {/* Back button */}
        <Link
          href={backHref}
          className="self-start flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors animate-fade-in"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back
        </Link>

        {/* Header */}
        <header className="text-center animate-fade-in -mt-2">
          <div className="flex items-center justify-center gap-3 mb-1">
            <span className="h-px w-10 bg-gradient-to-r from-transparent to-indigo-500/50" />
            <p className="text-[11px] tracking-[0.3em] uppercase text-indigo-400/60 font-medium">
              Fighter Workshop
            </p>
            <span className="h-px w-10 bg-gradient-to-l from-transparent to-indigo-500/50" />
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-bold tracking-tight uppercase leading-none">
            {title}
          </h1>
        </header>

        {/* ── Character Image Preview ── */}
        <div
          className="w-full animate-slide-up"
          style={{ animationDelay: "0.1s", animationFillMode: "backwards" }}
        >
          <div className="arena-frame">
            <div className="relative w-full aspect-[9/16] max-h-[420px] bg-gray-900/90 rounded-2xl overflow-hidden">
              {generating ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <div className="relative w-12 h-12">
                    <div className="absolute inset-0 border-2 border-indigo-500/20 rounded-full" />
                    <div className="absolute inset-0 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                  <p className="text-sm text-gray-500 tracking-wide">
                    Generating fighter&hellip;
                  </p>
                </div>
              ) : imageUrl ? (
                <img
                  src={imageUrl}
                  alt={name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8">
                  <svg
                    className="w-10 h-10 text-gray-700"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 00-3-3.87" />
                    <path d="M16 3.13a4 4 0 010 7.75" />
                  </svg>
                  <p className="text-gray-600 text-sm text-center leading-relaxed max-w-xs">
                    Describe your fighter below and generate to see a preview
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Name Input ── */}
        <div
          className="w-full animate-slide-up"
          style={{ animationDelay: "0.15s", animationFillMode: "backwards" }}
        >
          <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-4 space-y-3">
            <label className="text-[11px] tracking-[0.15em] uppercase text-gray-500 font-medium">
              Fighter Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/[0.06] rounded-xl p-3.5 text-white text-sm focus:outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20 transition-all placeholder:text-gray-700"
              placeholder="Zara the Pyromancer"
              maxLength={50}
            />
          </div>
        </div>

        {/* ── Description Panel ── */}
        <div
          className="w-full space-y-3 animate-slide-up"
          style={{ animationDelay: "0.2s", animationFillMode: "backwards" }}
        >
          <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] tracking-[0.15em] uppercase text-gray-500 font-medium">
                Fighter Description
              </label>
              <button
                type="button"
                onClick={handleEnhance}
                disabled={!textPrompt.trim() || enhancing}
                className="flex items-center gap-1.5 text-xs text-amber-400/80 hover:text-amber-300 disabled:text-gray-700 transition-colors cursor-pointer disabled:cursor-default"
              >
                {enhancing ? (
                  <div className="w-3 h-3 border border-amber-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg
                    className="w-3 h-3"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2l2.09 6.26L20.18 9.27l-4.64 4.53L16.54 20 12 16.77 7.46 20l1-6.2L3.82 9.27l6.09-1.01z" />
                  </svg>
                )}
                {enhancing ? "Enhancing..." : "Enhance"}
              </button>
            </div>

            <textarea
              value={textPrompt}
              onChange={(e) =>
                setTextPrompt(
                  e.target.value.slice(0, CHARACTER_PROMPT_CHAR_LIMIT),
                )
              }
              className="w-full h-28 bg-white/[0.02] border border-white/[0.06] rounded-xl p-3.5 text-white text-sm leading-relaxed resize-none focus:outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20 transition-all placeholder:text-gray-700"
              placeholder="A fierce fire mage wearing crimson robes with glowing embers swirling around her hands..."
            />

            <p className="text-[11px] text-gray-600 text-right tabular-nums">
              {textPrompt.length}/{CHARACTER_PROMPT_CHAR_LIMIT}
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="bg-red-950/50 border border-red-500/20 rounded-xl px-4 py-3 text-red-300 text-sm flex items-start gap-2.5">
              <svg
                className="w-4 h-4 mt-0.5 shrink-0 text-red-400/80"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              {error}
            </div>
          )}

          {/* Reference Image Upload */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className="w-full border border-dashed border-white/[0.08] hover:border-white/[0.16] rounded-xl p-3.5 cursor-pointer transition-colors group"
          >
            {referencePreview ? (
              <div className="flex items-center gap-3">
                <img
                  src={referencePreview}
                  alt="Reference"
                  className="w-14 h-14 object-cover rounded-lg ring-1 ring-white/10"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400">Reference image set</p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeReference();
                    }}
                    className="text-[11px] text-red-400/70 hover:text-red-300 mt-0.5 cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-gray-600 group-hover:text-gray-500 transition-colors">
                <svg
                  className="w-5 h-5 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
                <p className="text-xs">
                  Drop a reference image, or click to browse
                </p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>

        {/* ── Action Buttons ── */}
        <div
          className="w-full flex gap-3 animate-slide-up"
          style={{ animationDelay: "0.3s", animationFillMode: "backwards" }}
        >
          <button
            onClick={handleSurpriseMe}
            disabled={suggesting}
            className="flex-1 bg-purple-500/10 hover:bg-purple-500/20 disabled:bg-white/[0.02] disabled:text-gray-700 border border-purple-500/20 hover:border-purple-400/30 py-3 rounded-xl font-semibold text-sm text-purple-300 transition-all cursor-pointer disabled:cursor-default"
          >
            {suggesting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin inline-block" />
                Thinking&hellip;
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                  <circle cx="9" cy="9" r="1" fill="currentColor" />
                  <circle cx="15" cy="9" r="1" fill="currentColor" />
                  <circle cx="9" cy="15" r="1" fill="currentColor" />
                  <circle cx="15" cy="15" r="1" fill="currentColor" />
                  <circle cx="12" cy="12" r="1" fill="currentColor" />
                </svg>
                Surprise Me
              </span>
            )}
          </button>

          <button
            onClick={handleGenerate}
            disabled={!textPrompt.trim() || generating}
            className="flex-1 bg-white/[0.04] hover:bg-white/[0.08] disabled:bg-white/[0.02] disabled:text-gray-700 border border-white/[0.08] hover:border-white/[0.14] py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer disabled:cursor-default"
          >
            {generating ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin inline-block" />
                Generating&hellip;
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M13 2L3 14h9l-1 10 10-12h-9l1-10z" />
                </svg>
                Generate Fighter
              </span>
            )}
          </button>
        </div>

        {/* ── CTA: Submit ── */}
        <div
          className="w-full pt-2 animate-slide-up"
          style={{ animationDelay: "0.4s", animationFillMode: "backwards" }}
        >
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || !textPrompt.trim() || saving}
            className="group relative w-full overflow-hidden py-4 rounded-2xl font-display text-2xl uppercase tracking-wider font-bold transition-all disabled:opacity-25 disabled:cursor-default cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_100%] animate-shimmer transition-all group-hover:brightness-110" />
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_100%] animate-shimmer opacity-40 blur-xl" />
            <span className="relative z-10 drop-shadow-lg">
              {saving ? submittingLabel : submitLabel}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
