import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { ENVIRONMENT_CHAR_LIMIT } from "../types";
import { socket, connectSocket } from "../lib/socket";
import { useGameStore } from "../stores/gameStore";
import { api } from "../lib/api";
import { resizeImage } from "../lib/resizeImage";
import { DEFAULT_ENVIRONMENTS } from "../lib/defaultEnvironments";

export function HostEnvironment() {
  const [environment, setEnvironment] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referencePreview, setReferencePreview] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, navigate] = useLocation();
  const { setRoom, setIsHost } = useGameStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    connectSocket();

    function onRoomCreated({ roomId, room }: { roomId: string; room: any }) {
      setRoom(room);
      setIsHost(true);
      navigate(`/host/${roomId}`);
    }

    socket.on("room:created", onRoomCreated);

    return () => {
      socket.off("room:created", onRoomCreated);
    };
  }, [navigate, setRoom, setIsHost]);

  // Cleanup blob URLs
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
    if (!environment.trim() || generating) return;
    setGenerating(true);
    setError(null);

    try {
      let result: { url: string };
      if (referenceFile) {
        result = await api.generateCharacterImageWithReference(
          referenceFile,
          environment.trim(),
        );
      } else {
        result = await api.generateCharacterImage(environment.trim());
      }
      setImageUrl(result.url);
    } catch (err: any) {
      console.error("Arena generation failed:", err);
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
      const result = await api.suggestEnvironment();
      setEnvironment(result.prompt);
    } catch (err: any) {
      console.error("Suggestion failed:", err);
      setError(err.message || "Suggestion failed");
    } finally {
      setSuggesting(false);
    }
  }

  async function handleEnhance() {
    if (!environment.trim() || enhancing) return;
    setEnhancing(true);
    setError(null);

    try {
      const result = await api.enhanceEnvironmentPrompt(environment.trim());
      setEnvironment(result.enhancedPrompt);
    } catch (err: any) {
      console.error("Enhancement failed:", err);
      setError(err.message || "Enhancement failed");
    } finally {
      setEnhancing(false);
    }
  }

  function selectPreset(preset: (typeof DEFAULT_ENVIRONMENTS)[number]) {
    setEnvironment(preset.description);
    // Use preset image if no generated image yet
    if (!imageUrl) {
      setImageUrl(preset.imageUrl);
    }
  }

  function handleContinue() {
    if (!environment.trim() || creating) return;
    setCreating(true);
    socket.emit("room:create", {
      username: "Host",
      environment: environment.trim(),
      environmentImageUrl: imageUrl || undefined,
    });
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-6 gap-6 max-w-lg mx-auto">
      <h2 className="text-2xl font-bold">Set Battle Arena</h2>

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
        <div className="w-full bg-red-900/50 border border-red-700 rounded-lg p-3 text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Arena Image Preview */}
      <div className="w-full aspect-video bg-gray-900 border border-gray-700 rounded-xl flex items-center justify-center overflow-hidden">
        {generating ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Generating arena...</p>
          </div>
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt="Battle arena"
            className="w-full h-full object-cover"
          />
        ) : (
          <p className="text-gray-500 text-center px-4">
            Describe your arena and click "Generate Arena" to preview
          </p>
        )}
      </div>

      {/* Environment Description */}
      <div className="w-full">
        <label className="block text-sm text-gray-400 mb-2">
          Describe the battle environment:
        </label>
        <textarea
          value={environment}
          onChange={(e) =>
            setEnvironment(e.target.value.slice(0, ENVIRONMENT_CHAR_LIMIT))
          }
          className="w-full h-28 bg-gray-900 border border-gray-700 rounded-lg p-3 text-white resize-none focus:outline-none focus:border-indigo-500"
          placeholder="A volcanic arena with rivers of molten lava..."
        />
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-gray-500">
            {environment.length}/{ENVIRONMENT_CHAR_LIMIT}
          </p>
          <button
            type="button"
            onClick={handleEnhance}
            disabled={!environment.trim() || enhancing}
            className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 disabled:text-gray-600 transition-colors"
          >
            {enhancing ? (
              <div className="w-3 h-3 border border-amber-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l2.09 6.26L20.18 9.27l-4.64 4.53L16.54 20 12 16.77 7.46 20l1-6.2L3.82 9.27l6.09-1.01z" />
              </svg>
            )}
            {enhancing ? "Enhancing..." : "Enhance"}
          </button>
        </div>
      </div>

      {/* Reference Image Upload */}
      <div className="w-full">
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
              Drag & drop a reference image, or click to browse
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
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={!environment.trim() || generating}
        className="w-full bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-600 border border-gray-700 py-3 rounded-lg font-semibold transition-colors"
      >
        {generating ? "Generating..." : "Generate Arena"}
      </button>

      {/* Presets */}
      <div className="w-full">
        <p className="text-sm text-gray-400 mb-3">Or choose a preset:</p>
        <div className="grid grid-cols-2 gap-3">
          {DEFAULT_ENVIRONMENTS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => selectPreset(preset)}
              className={`bg-gray-900 border rounded-lg overflow-hidden text-left transition-colors hover:border-indigo-500 ${
                environment === preset.description
                  ? "border-indigo-500"
                  : "border-gray-700"
              }`}
            >
              <div className="aspect-video bg-gray-800">
                <img
                  src={preset.imageUrl}
                  alt={preset.label}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-2">
                <p className="text-sm font-semibold truncate">{preset.label}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Continue Button */}
      <button
        onClick={handleContinue}
        disabled={!environment.trim() || creating}
        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 py-3 rounded-lg font-semibold text-lg transition-colors"
      >
        {creating ? "Creating room..." : "Continue"}
      </button>
    </div>
  );
}
