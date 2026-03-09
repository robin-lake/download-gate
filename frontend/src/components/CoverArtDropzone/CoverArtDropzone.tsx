import { useController, type Control, type FieldPath, type FieldValues } from "react-hook-form";
import { Label } from "@/components/ui/label";
import "./CoverArtDropzone.scss";

export interface CoverArtDropzoneProps<T extends FieldValues> {
  name: FieldPath<T>;
  control: Control<T>;
  label?: string;
  /** Optional, for showing selected file name */
  acceptedTypes?: string;
}

const DEFAULT_ACCEPT = ".jpg,.jpeg,.png,.gif,.webp,image/jpeg,image/png,image/gif,image/webp";

export default function CoverArtDropzone<T extends FieldValues>({
  name,
  control,
  label = "Cover art",
  acceptedTypes = DEFAULT_ACCEPT,
}: CoverArtDropzoneProps<T>) {
  const {
    field: { ref, onChange, onBlur, value },
  } = useController({ name, control });

  const fileList = value as FileList | null | undefined;
  const fileName = fileList?.[0]?.name;

  return (
    <div className="cover-art-dropzone__field">
      <Label className="cover-art-dropzone__label">{label}</Label>
      <div className="cover-art-dropzone">
        <input
          ref={ref}
          type="file"
          accept={acceptedTypes}
          className="cover-art-dropzone__input"
          aria-label={label}
          onChange={(e) => onChange(e.target.files)}
          onBlur={onBlur}
        />
        <span className="cover-art-dropzone__icon" aria-hidden>
          🖼
        </span>
        <p className="cover-art-dropzone__text">
          {fileName || "Drop cover image or browse"}
        </p>
        <p className="cover-art-dropzone__hint">JPEG, PNG, GIF or WebP, max 5 MB</p>
      </div>
    </div>
  );
}
