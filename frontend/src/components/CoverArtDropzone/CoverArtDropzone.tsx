import { useState, useEffect, useCallback } from "react";
import { useController, type Control, type FieldPath, type FieldValues } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface CoverArtDropzoneProps<T extends FieldValues> {
  name: FieldPath<T>;
  control: Control<T>;
  label?: string;
  acceptedTypes?: string;
}

const DEFAULT_ACCEPT = ".jpg,.jpeg,.png,.gif,.webp,image/jpeg,image/png,image/gif,image/webp";

function createFileList(file: File): FileList {
  const dt = new DataTransfer();
  dt.items.add(file);
  return dt.files;
}

export default function CoverArtDropzone<T extends FieldValues>({
  name,
  control,
  label = "Cover art",
  acceptedTypes = DEFAULT_ACCEPT,
}: CoverArtDropzoneProps<T>) {
  const {
    field: { ref, onChange, onBlur, value },
  } = useController({ name, control });

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [sizeError, setSizeError] = useState<string | null>(null);

  const fileList = value as FileList | null | undefined;
  const file = fileList?.[0];
  const hasFile = Boolean(file);

  // Create preview URL for image files and revoke when file changes or unmount
  useEffect(() => {
    if (!file || !file.type.startsWith("image/")) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file?.name, file?.size, file?.lastModified]);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      setSizeError(null);
      if (!files?.length) {
        onChange(null);
        return;
      }
      const first = files[0];
      if (first.size > MAX_SIZE_BYTES) {
        setSizeError("File must be 5 MB or smaller.");
        return;
      }
      if (!first.type.startsWith("image/")) {
        setSizeError("Please choose an image file (JPEG, PNG, GIF or WebP).");
        return;
      }
      onChange(createFileList(first));
    },
    [onChange]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    onBlur();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSizeError(null);
    onChange(null);
    setPreviewUrl(null);
  };

  return (
    <div className="mb-4">
      <Label className="mb-1.5 block text-sm font-medium text-black">{label}</Label>
      <div
        className={cn(
          "relative flex min-h-40 flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-200 bg-neutral-50 p-6 transition-colors hover:border-neutral-300 hover:bg-neutral-100",
          isDragOver && "border-neutral-500 bg-neutral-200",
          hasFile && "min-h-[200px]"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={ref}
          type="file"
          accept={acceptedTypes}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          aria-label={label}
          onChange={handleInputChange}
          onBlur={onBlur}
        />
        {previewUrl ? (
          <div className="flex w-full max-w-[200px] flex-col items-center gap-2">
            <img
              src={previewUrl}
              alt="Cover art preview"
              className="size-[120px] rounded-md border border-neutral-200 object-cover"
            />
            <p className="m-0 mb-1 text-sm font-semibold text-black">{file?.name}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-1"
              onClick={handleClear}
            >
              Remove
            </Button>
          </div>
        ) : (
          <>
            <span className="mb-3 text-5xl text-neutral-500" aria-hidden>
              🖼
            </span>
            <p className="m-0 mb-1 text-sm font-semibold text-black">
              {isDragOver ? "Drop image here" : "Drop cover image or browse"}
            </p>
            <p className="m-0 text-[13px] text-neutral-500">JPEG, PNG, GIF or WebP, max 5 MB</p>
          </>
        )}
      </div>
      {sizeError && (
        <p className="mt-2 text-[13px] text-red-600" role="alert">
          {sizeError}
        </p>
      )}
    </div>
  );
}
