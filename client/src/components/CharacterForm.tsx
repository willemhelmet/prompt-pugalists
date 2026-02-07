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
    <div className="flex flex-col min-h-screen p-6 gap-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center w-full">
        <h2 className="text-2xl font-bold">{title}</h2>
        <Link
          href={backHref}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Back
        </Link>
      </div>

      {/* Surprise Me */}
      <button
        onClick={handleSurpriseMe}
        disabled={suggesting}
        className="w-full bg-purple-700/30 hover:bg-purple-700/50 disabled:bg-gray-800 disabled:text-gray-600 border border-purple-600/50 py-3 rounded-lg font-semibold transition-colors text-purple-200"
      >
        {suggesting ? "Thinking..." : "Surprise Me"}
      </button>

      {/* Error banner */}
      {error && (
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-3 text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Character Name */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">
          Character Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500"
          placeholder="Zara the Pyromancer"
          maxLength={50}
        />
      </div>

      {/* Character Image Preview */}
      <div className="w-full aspect-[9/16] max-h-[480px] bg-gray-900 border border-gray-700 rounded-xl flex items-center justify-center overflow-hidden">
        {generating ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Generating character...</p>
          </div>
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-contain"
          />
        ) : (
          <p className="text-gray-500 text-center px-4">
            Describe your character and click "Generate Character" to see a
            preview
          </p>
        )}
      </div>

      {/* Text Prompt */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">
          Describe your character
        </label>
        <textarea
          value={textPrompt}
          onChange={(e) =>
            setTextPrompt(e.target.value.slice(0, CHARACTER_PROMPT_CHAR_LIMIT))
          }
          className="w-full h-28 bg-gray-900 border border-gray-700 rounded-lg p-3 text-white resize-none focus:outline-none focus:border-indigo-500"
          placeholder="A fierce fire mage wearing crimson robes with glowing embers swirling around her hands"
        />
        <p className="text-xs text-gray-500 mt-1">
          {textPrompt.length}/{CHARACTER_PROMPT_CHAR_LIMIT}
        </p>
      </div>

      {/* Reference Image Upload */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">
          Reference Image (optional)
        </label>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          onClick={() => fileInputRef.current?.click()}
          className="w-full border-2 border-dashed border-gray-700 rounded-lg p-4 text-center cursor-pointer hover:border-gray-500 transition-colors"
        >
          {referencePreview ? (
            <div className="flex items-center gap-4">
              <img
                src={referencePreview}
                alt="Reference"
                className="w-20 h-20 object-cover rounded"
              />
              <div className="flex-1 text-left">
                <p className="text-sm text-gray-300">Reference image set</p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeReference();
                  }}
                  className="text-xs text-red-400 hover:text-red-300 mt-1"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">
              Drag & drop an image here, or click to browse
            </p>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
        <p className="text-xs text-gray-600 mt-1">
          Upload a reference image for the AI to base your character on
        </p>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={!textPrompt.trim() || generating}
        className="w-full bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-600 border border-gray-700 py-3 rounded-lg font-semibold transition-colors"
      >
        {generating ? "Generating..." : "Generate Character"}
      </button>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={!name.trim() || !textPrompt.trim() || saving}
        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 py-3 rounded-lg font-semibold text-lg transition-colors"
      >
        {saving ? submittingLabel : submitLabel}
      </button>
    </div>
  );
}
