"use client";

import { useRef, useState } from "react";
import { Paperclip, X } from "lucide-react";

interface FileUploadProps {
  onUpload: (file: File) => void;
}

export function FileUpload({ onUpload }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    setSelectedFile(file.name);
    onUpload(file);

    // Reset input so the same file can be re-selected.
    e.target.value = "";
  };

  return (
    <div className="flex items-center gap-1">
      <input ref={inputRef} type="file" className="hidden" onChange={handleChange} />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="rounded-full bg-[var(--accent)] p-2 text-muted-foreground transition-colors hover:text-foreground"
        title="Attach file"
      >
        <Paperclip className="h-4 w-4" />
      </button>

      {selectedFile && (
        <div className="flex max-w-[120px] items-center gap-1 rounded-full bg-[var(--accent)] px-2 py-1 text-xs text-muted-foreground">
          <span className="truncate">{selectedFile}</span>
          <button type="button" onClick={() => setSelectedFile(null)} className="flex-shrink-0">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
