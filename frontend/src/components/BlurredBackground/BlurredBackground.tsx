import './BlurredBackground.scss';

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
      className={`blurred-background ${className}`.trim()}
      style={{ '--blurred-bg-image': bgImage } as React.CSSProperties}
    >
      <div className="blurred-background__bg" aria-hidden />
      {children}
    </div>
  );
}
