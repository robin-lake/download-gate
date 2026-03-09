import { useState, useEffect, useCallback } from "react";
import { useController, type Control, type FieldPath, type FieldValues } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import "./CoverArtDropzone.scss";

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
    <div className="cover-art-dropzone__field">
      <Label className="cover-art-dropzone__label">{label}</Label>
      <div
        className={`cover-art-dropzone ${isDragOver ? "cover-art-dropzone--dragover" : ""} ${hasFile ? "cover-art-dropzone--has-file" : ""}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={ref}
          type="file"
          accept={acceptedTypes}
          className="cover-art-dropzone__input"
          aria-label={label}
          onChange={handleInputChange}
          onBlur={onBlur}
        />
        {previewUrl ? (
          <div className="cover-art-dropzone__preview">
            <img
              src={previewUrl}
              alt="Cover art preview"
              className="cover-art-dropzone__preview-img"
            />
            <p className="cover-art-dropzone__text">{file?.name}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="cover-art-dropzone__clear"
              onClick={handleClear}
            >
              Remove
            </Button>
          </div>
        ) : (
          <>
            <span className="cover-art-dropzone__icon" aria-hidden>
              🖼
            </span>
            <p className="cover-art-dropzone__text">
              {isDragOver ? "Drop image here" : "Drop cover image or browse"}
            </p>
            <p className="cover-art-dropzone__hint">JPEG, PNG, GIF or WebP, max 5 MB</p>
          </>
        )}
      </div>
      {sizeError && (
        <p className="cover-art-dropzone__error" role="alert">
          {sizeError}
        </p>
      )}
    </div>
  );
}
