import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mic, Upload, Trash2, Loader2, CheckCircle2, ArrowLeft, AudioWaveform, Star } from "lucide-react";
import { Link } from "wouter";
import { apiClient } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function VoiceClones() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [cloneName, setCloneName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["voice-clones"],
    queryFn: () => apiClient.get("/voice/clones").then(r => r.data),
  });

  const clones: any[] = data?.clones ?? [];

  const deleteClone = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/voice/clones/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["voice-clones"] });
      toast({ title: "Voice clone deleted" });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("audio/")) {
      toast({ title: "Please upload an audio file (WAV, MP3, OGG, M4A)", variant: "destructive" });
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "File must be under 20MB", variant: "destructive" });
      return;
    }
    setSelectedFile(file);
  };

  const handleClone = async () => {
    if (!cloneName.trim()) {
      toast({ title: "Give your voice clone a name", variant: "destructive" });
      return;
    }
    if (!selectedFile) {
      toast({ title: "Upload a voice sample first", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const audioBase64 = await fileToBase64(selectedFile);
      await apiClient.post("/voice/clone", {
        name: cloneName.trim(),
        audioBase64,
        mimeType: selectedFile.type,
      });

      toast({ title: `✅ "${cloneName}" voice clone created!` });
      setCloneName("");
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = "";
      qc.invalidateQueries({ queryKey: ["voice-clones"] });
    } catch (err: any) {
      toast({ title: err.message ?? "Clone failed", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/voice">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Voice Studio
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <AudioWaveform className="w-6 h-6 text-primary" />
            My Voice Clones
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Upload a voice sample — analyzed and cloned entirely on-device.</p>
        </div>
      </div>

      <Card className="p-6">
        <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
          <Mic className="w-4 h-4 text-primary" />
          Create New Voice Clone
        </h2>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-foreground mb-1.5 block">Clone Name</Label>
            <Input
              placeholder='e.g. "My Voice", "Deep Male Narrator", "Podcast Host"'
              value={cloneName}
              onChange={(e) => setCloneName(e.target.value)}
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-foreground mb-1.5 block">Voice Sample</Label>
            <div
              className="border-2 border-dashed border rounded-xl p-6 text-center hover:border-purple-400 transition-colors cursor-pointer"
              onClick={() => fileRef.current?.click()}
            >
              {selectedFile ? (
                <div className="flex items-center justify-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024).toFixed(0)} KB · Click to change</p>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">Click to upload voice sample</p>
                  <p className="text-xs text-muted-foreground mt-1">WAV · MP3 · OGG · M4A · 6–30 seconds recommended · max 20MB</p>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={handleFileChange} />
          </div>

          <div className="bg-primary/5 rounded-lg p-3 text-xs text-primary space-y-1">
            <p className="font-semibold">💡 Tips for best clone quality:</p>
            <p>• Clear recording, minimal background noise</p>
            <p>• 6–30 seconds of natural, even-paced speaking</p>
            <p>• Consistent tone throughout — no music or effects</p>
          </div>

          <Button
            onClick={handleClone}
            disabled={isUploading || !cloneName.trim() || !selectedFile}
            className="w-full bg-gradient-to-r from-primary to-pink-600 hover:opacity-90 gap-2"
          >
            {isUploading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing voice sample...</>
            ) : (
              <><Mic className="w-4 h-4" /> Create Voice Clone</>
            )}
          </Button>
        </div>
      </Card>

      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">Saved Clones ({clones.length})</h2>
        {isLoading ? (
          <div className="text-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />
          </div>
        ) : clones.length === 0 ? (
          <Card className="p-8 text-center">
            <AudioWaveform className="w-10 h-10 text-muted-foreground/60 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No voice clones yet</p>
            <p className="text-sm text-muted-foreground mt-1">Upload a voice sample above to create your first clone</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {clones.map((clone: any) => (
              <Card key={clone.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mic className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{clone.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <Badge variant="secondary" className="text-xs">Clone</Badge>
                      <span className="text-xs text-muted-foreground">
                        Base: {clone.baseVoiceId} · Pitch {clone.pitchFactor > 1 ? "+" : ""}{((clone.pitchFactor - 1) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/voice?clone=${clone.id}`}>
                    <Button size="sm" variant="outline" className="gap-1">
                      <Star className="w-3 h-3" /> Use
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => deleteClone.mutate(clone.id)}
                    disabled={deleteClone.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
