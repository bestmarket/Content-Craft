import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Loader2, Pause, X, Volume2 } from "lucide-react";

interface VoiceSpeakButtonProps {
  getText?: () => string;
  text?: string;
  label?: string;
  compact?: boolean;
}

export function VoiceSpeakButton({ getText, text, label = "Speak", compact = false }: VoiceSpeakButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const resolveText = () => {
    if (getText) return getText();
    return text ?? "";
  };

  const handleSpeak = async () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    if (hasAudio && audioUrlRef.current) {
      if (!audioRef.current) {
        audioRef.current = new Audio(audioUrlRef.current);
        audioRef.current.onended = () => setIsPlaying(false);
      }
      audioRef.current.play();
      setIsPlaying(true);
      return;
    }

    const resolved = resolveText();
    if (!resolved?.trim()) return;

    const truncated = resolved.slice(0, 2000);

    setIsGenerating(true);
    try {
      const token = localStorage.getItem("token") ?? "";
      const res = await fetch("/api/voice/speak", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: truncated, voiceId: "af_sky", speed: 1.0 }),
      });

      if (!res.ok) throw new Error("Generation failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      audioUrlRef.current = url;

      if (audioRef.current) audioRef.current.pause();
      audioRef.current = new Audio(url);
      audioRef.current.onended = () => setIsPlaying(false);
      audioRef.current.play();
      setIsPlaying(true);
      setHasAudio(true);
    } catch {
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClear = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setIsPlaying(false);
    setHasAudio(false);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="outline"
          onClick={handleSpeak}
          disabled={isGenerating}
          className="gap-1.5 h-8 px-3 border-purple-200 text-primary hover:bg-primary/5"
          title="Speak this content"
        >
          {isGenerating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-3.5 h-3.5" />
          ) : (
            <Volume2 className="w-3.5 h-3.5" />
          )}
          {isGenerating ? "..." : isPlaying ? "Pause" : label}
        </Button>
        {hasAudio && !isGenerating && (
          <Button size="sm" variant="ghost" onClick={handleClear} className="h-8 w-8 p-0 text-muted-foreground hover:text-muted-foreground">
            <X className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleSpeak}
        disabled={isGenerating}
        variant="outline"
        className="gap-2 border-purple-200 text-primary hover:bg-primary/5"
      >
        {isGenerating ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Generating voice...</>
        ) : isPlaying ? (
          <><Pause className="w-4 h-4" /> Pause</>
        ) : (
          <><Mic className="w-4 h-4" /> {hasAudio ? "Play again" : "🎙 Speak this"}</>
        )}
      </Button>
      {hasAudio && !isGenerating && (
        <Button size="sm" variant="ghost" onClick={handleClear} className="text-muted-foreground hover:text-muted-foreground h-9 px-2">
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}

export default VoiceSpeakButton;
