"use client";

import { useRef, useState, useEffect } from "react";
import { ImagePlus, X } from "lucide-react";

interface Props {
  onChange: (files: File[]) => void;
  maxFiles?: number;
}

/** Seleção de fotos com preview local, antes de fazer upload de fato. */
export default function PhotoPicker({ onChange, maxFiles = 6 }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files || []);
    const next = [...files, ...picked].slice(0, maxFiles);
    setFiles(next);
    onChange(next);
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeAt(idx: number) {
    const next = files.filter((_, i) => i !== idx);
    setFiles(next);
    onChange(next);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {previews.map((src, idx) => (
          <div key={idx} className="group relative h-20 w-20 overflow-hidden rounded-sm border border-line">
            {/* preview local, ainda não é URL do Storage */}
            <img src={src} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removeAt(idx)}
              className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              <X size={12} />
            </button>
          </div>
        ))}

        {files.length < maxFiles && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-sm border border-dashed border-line text-ink/40 hover:border-accent hover:text-accent"
          >
            <ImagePlus size={18} />
            <span className="text-[10px]">Adicionar</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleSelect}
      />
    </div>
  );
}
