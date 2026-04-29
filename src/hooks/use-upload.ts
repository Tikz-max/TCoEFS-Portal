"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface UploadState {
  isUploading: boolean;
  progress: number;
  error: Error | null;
}

interface UseUploadReturn extends UploadState {
  upload: (file: File, bucket?: string, path?: string) => Promise<string | null>;
  reset: () => void;
}

export function useUpload(): UseUploadReturn {
  const [state, setState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
  });

  const upload = useCallback(async (file: File, bucket = "files", path?: string): Promise<string | null> => {
    setState({ isUploading: true, progress: 0, error: null });

    try {
      const supabase = createClient();
      const filePath = path || `${Date.now()}-${file.name}`;
      const fileExt = file.name.split(".").pop();
      const fileName = fileExt ? `${filePath}.${fileExt}` : filePath;

      const { data: presigned, error: presignError } = await supabase.storage
        .from(bucket)
        .createSignedUrl(fileName, 60);

      if (presignError) throw presignError;

      const xhr = new XMLHttpRequest();
      xhr.open("PUT", presigned.signedUrl);
      xhr.setRequestHeader("Content-Type", file.type);

      const uploadPromise = new Promise<string>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(fileName);
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setState((s) => ({ ...s, progress: Math.round((e.loaded / e.total) * 100) }));
          }
        };
      });

      xhr.send(file);

      const result = await uploadPromise;
      setState({ isUploading: false, progress: 100, error: null });
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Upload failed");
      setState({ isUploading: false, progress: 0, error });
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ isUploading: false, progress: 0, error: null });
  }, []);

  return { ...state, upload, reset };
}