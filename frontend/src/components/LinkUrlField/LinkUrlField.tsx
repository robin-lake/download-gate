import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UseFormRegister, FieldError, RegisterOptions } from "react-hook-form";
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
    <div>
      <Label htmlFor={name} className="mb-1.5 block text-sm font-medium text-black">
        Customize your link URL
      </Label>
      <div className="mb-2 flex items-center gap-0 rounded-md border border-neutral-200 bg-neutral-50 px-3.5 py-2.5">
        <span className="shrink-0 text-sm text-neutral-500">{prefix}</span>
        <Input
          id={name}
          type="text"
          placeholder={placeholder}
          className="min-w-0 flex-1 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
          aria-invalid={Boolean(error)}
          {...register(name, registerOptions)}
        />
      </div>
      {message && (
        <p className="-mt-2 mb-2 text-[13px] text-red-600" role="alert">
          {message}
        </p>
      )}
      <p className="mb-4 text-[13px] text-neutral-500">
        Your link will be at: <strong>{prefix.replace(/\/?$/, "")}/…</strong>
      </p>
    </div>
  );
}
