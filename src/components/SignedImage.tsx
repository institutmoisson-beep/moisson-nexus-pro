import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  bucket: string;
  pathOrUrl: string;
  alt?: string;
  className?: string;
  expiresIn?: number;
};

/**
 * Renders an image from a Supabase Storage bucket.
 * Accepts either a storage path (preferred for private buckets) or a legacy
 * public URL — public URLs are passed through unchanged.
 */
export default function SignedImage({ bucket, pathOrUrl, alt, className, expiresIn = 60 * 60 }: Props) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!pathOrUrl) return;
    if (/^https?:\/\//i.test(pathOrUrl)) {
      setSrc(pathOrUrl);
      return;
    }
    (async () => {
      const { data } = await supabase.storage.from(bucket).createSignedUrl(pathOrUrl, expiresIn);
      if (!cancelled) setSrc(data?.signedUrl || null);
    })();
    return () => { cancelled = true; };
  }, [bucket, pathOrUrl, expiresIn]);

  if (!src) return <div className={className} aria-busy="true" />;
  return <img src={src} alt={alt} className={className} />;
}
