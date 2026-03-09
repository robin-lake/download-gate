import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UseFormRegister, FieldError, RegisterOptions } from "react-hook-form";
import "./LinkUrlField.scss";

export interface LinkUrlFieldProps {
  /** URL prefix (e.g. origin + "/") */
  prefix: string;
  /** Input name for react-hook-form */
  name: string;
  register: UseFormRegister<Record<string, string>>;
  registerOptions?: RegisterOptions<Record<string, string>, string>;
  error?: FieldError;
  placeholder?: string;
  /** Validation message for invalid short code */
  validationMessage?: string;
}

export default function LinkUrlField({
  prefix,
  name,
  register,
  registerOptions,
  error,
  placeholder = "e.g. my-track or leave blank",
  validationMessage,
}: LinkUrlFieldProps) {
  const message = error?.message ?? validationMessage;

  return (
    <div className="link-url-field">
      <Label htmlFor={name} className="link-url-field__label">
        Customize your link URL
      </Label>
      <div className="link-url-field__row">
        <span className="link-url-field__prefix">{prefix}</span>
        <Input
          id={name}
          type="text"
          placeholder={placeholder}
          className="link-url-field__input"
          aria-invalid={Boolean(error)}
          {...register(name, registerOptions)}
        />
      </div>
      {message && (
        <p className="link-url-field__error" role="alert">
          {message}
        </p>
      )}
      <p className="link-url-field__hint">
        Your link will be at: <strong>{prefix.replace(/\/?$/, "")}/…</strong>
      </p>
    </div>
  );
}
