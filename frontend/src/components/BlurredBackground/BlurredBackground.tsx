import { cn } from "@/lib/utils";

export interface BlurredBackgroundProps {
  imageUrl?: string | null;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Renders a full-bleed blurred background from an image.
 * Used by DownloadGate and SmartLink views.
 */
export default function BlurredBackground({
  imageUrl,
  className = '',
  children,
}: BlurredBackgroundProps) {
  const bgImage = imageUrl ? `url(${imageUrl})` : 'none';
  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{ '--blurred-bg-image': bgImage } as React.CSSProperties}
    >
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-[#0f1929] before:pointer-events-none before:absolute before:inset-0 before:z-0 before:bg-[image:var(--blurred-bg-image)] before:bg-cover before:bg-center before:bg-no-repeat before:blur-[80px] before:saturate-[1.2] before:content-[''] before:scale-[1.15] after:pointer-events-none after:absolute after:inset-0 after:z-[1] after:bg-black/50 after:content-['']"
        aria-hidden
      />
      {children}
    </div>
  );
}
