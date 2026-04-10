import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { optimizeImage } from "@/lib/imageOptimizer";

interface ImageUploaderProps {
  folder: string;
  images: string[];
  onChange: (images: string[]) => void;
  max?: number;
  label?: string;
}

const ImageUploader = ({ folder, images, onChange, max = 5, label = "Images" }: ImageUploaderProps) => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (images.length + files.length > max) {
      toast.error(`Maximum ${max} images`);
      return;
    }

    setUploading(true);
    const newUrls: string[] = [];

    for (const file of Array.from(files)) {
      try {
        const optimized = await optimizeImage(file, 1200, 1200, 0.7);
        const ext = optimized.name.split(".").pop() || "webp";
        const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from("images").upload(path, optimized);
        if (error) {
          toast.error(`Erreur upload: ${file.name}`);
          continue;
        }
        const { data: urlData } = supabase.storage.from("images").getPublicUrl(path);
        newUrls.push(urlData.publicUrl);
      } catch {
        toast.error(`Erreur optimisation: ${file.name}`);
      }
    }

    onChange([...images, ...newUrls]);
    setUploading(false);
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className="text-xs font-body text-muted-foreground mb-1 block">{label} ({images.length}/{max})</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {images.map((url, i) => (
          <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border group">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button type="button" onClick={() => removeImage(i)}
              className="absolute top-0.5 right-0.5 p-0.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        {images.length < max && (
          <label className="w-20 h-20 rounded-lg border-2 border-dashed border-input flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
            {uploading ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /> : <Upload className="w-5 h-5 text-muted-foreground" />}
            <input type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" disabled={uploading} />
          </label>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;
