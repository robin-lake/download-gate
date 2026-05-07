import { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useGetSmartLinkPublic } from '../../network/smartLinks/getSmartLinkPublic';
import {
  recordSmartLinkVisit,
  recordSmartLinkClick,
} from '../../network/smartLinks/recordSmartLinkAnalytics';
import BlurredBackground from '../../components/BlurredBackground/BlurredBackground';
import MediaPlayerCover from '../../components/MediaPlayerCover/MediaPlayerCover';
import PlatformIcon from '../../components/PlatformIcon/PlatformIcon';
import type { SmartLinkPlatformResponse } from '../../network/smartLinks/types';
import { cn } from '@/lib/utils';

const BUY_PLATFORMS = new Set([
  'itunes',
  'bandcamp',
  'beatport',
  'amazon',
  'amazon_music',
  'google_play',
]);

function ProviderLink({
  platform,
  onRecordClick,
}: {
  platform: SmartLinkPlatformResponse;
  onRecordClick: (platformId: string) => void;
}) {
  const resolvedLabel =
    platform.action_label?.trim() ||
    (BUY_PLATFORMS.has(platform.platform_name?.toLowerCase().replace(/\s+/g, '_'))
      ? 'Buy'
      : 'Play');
  const isBuy = resolvedLabel.toLowerCase() === 'buy';

  const handleClick = () => {
    onRecordClick(platform.id);
    window.open(platform.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border border-black/10 bg-white p-3 transition-colors hover:bg-black/[0.02]">
      <PlatformIcon platformName={platform.platform_name} size={28} />
      <span className="flex-1 text-[0.95rem] font-medium capitalize text-[#1a1a2e]">
        {platform.platform_name}
      </span>
      <button
        type="button"
        className={cn(
          "cursor-pointer rounded-md border px-4 py-1.5 text-[0.85rem] font-semibold transition-colors",
          isBuy
            ? "border-[var(--accent-brand)] text-[var(--accent-brand)] hover:bg-[rgba(115,41,189,0.08)]"
            : "border-[var(--button-cta)] text-[var(--button-cta)] hover:bg-[rgba(55,176,131,0.08)]"
        )}
        onClick={handleClick}
      >
        {resolvedLabel}
      </button>
    </div>
  );
}

export default function SmartLink() {
  const { gateIdOrSlug } = useParams<{ gateIdOrSlug: string }>();
  const { data: link, error, isLoading } = useGetSmartLinkPublic({
    linkIdOrSlug: gateIdOrSlug,
    enabled: Boolean(gateIdOrSlug),
  });
  const visitRecordedRef = useRef(false);

  const handleRecordClick = (platformId: string) => {
    if (gateIdOrSlug?.trim()) {
      recordSmartLinkClick(gateIdOrSlug, platformId);
    }
  };

  useEffect(() => {
    if (!link || !gateIdOrSlug?.trim() || visitRecordedRef.current) return;
    visitRecordedRef.current = true;
    recordSmartLinkVisit(gateIdOrSlug);
  }, [link, gateIdOrSlug]);

  if (gateIdOrSlug === undefined) {
    return (
      <div className="mx-auto max-w-prose p-8 text-center">
        <p>View a smart link by visiting a short link (e.g. /link/your-slug).</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-prose p-8 text-center">
        <p>Loading…</p>
      </div>
    );
  }

  if (error || !link) {
    return (
      <div className="mx-auto max-w-prose p-8 text-center">
        <h1>Smart link not found</h1>
        <p>This link may be invalid or the smart link may have been removed.</p>
      </div>
    );
  }

  const platforms = link.platforms ?? [];

  return (
    <BlurredBackground
      imageUrl={link.cover_image_url}
      className="relative mx-[-1.5rem] mb-[-2rem] mt-0 flex min-h-screen flex-col overflow-hidden text-left md:flex-row"
    >
      <div className="relative z-[1] flex min-h-screen flex-1 flex-col md:flex-row">
        <div className="relative z-[1] flex flex-1 items-center justify-center px-6 py-8 min-h-[280px] md:min-h-0 md:p-12">
          <MediaPlayerCover
            imageUrl={link.cover_image_url}
            audioUrl={link.audio_file_url}
            playButtonPosition="center"
          />
        </div>
        <div className="relative z-[1] flex w-full items-center justify-center px-6 py-8 md:w-[400px] md:shrink-0 md:justify-start md:p-12 md:py-12 md:pr-8">
          <div className="w-full max-w-[360px] rounded-xl bg-white/95 p-6 shadow-[0_24px_48px_rgba(0,0,0,0.25)] md:p-8">
            <h1 className="m-0 mb-1 text-2xl font-bold leading-tight tracking-tight text-[#1a1a2e] md:text-[1.75rem]">
              {link.title}
            </h1>
            {link.subtitle && (
              <p className="mb-5 text-base text-[rgba(26,26,46,0.75)]">{link.subtitle}</p>
            )}
            <div className="flex max-h-[360px] flex-col gap-2 overflow-y-auto">
              {platforms.map((platform) => (
                <ProviderLink
                  key={platform.id}
                  platform={platform}
                  onRecordClick={handleRecordClick}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </BlurredBackground>
  );
}
