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
import './SmartLink.scss';

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
    <div className="smart-link-view__provider">
      <PlatformIcon platformName={platform.platform_name} size={28} />
      <span className="smart-link-view__provider-name">{platform.platform_name}</span>
      <button
        type="button"
        className={`smart-link-view__provider-btn smart-link-view__provider-btn--${isBuy ? 'buy' : 'play'}`}
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
      <div className="app-page">
        <p>View a smart link by visiting a short link (e.g. /link/your-slug).</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="app-page">
        <p>Loading…</p>
      </div>
    );
  }

  if (error || !link) {
    return (
      <div className="app-page">
        <h1>Smart link not found</h1>
        <p>This link may be invalid or the smart link may have been removed.</p>
      </div>
    );
  }

  const platforms = link.platforms ?? [];

  return (
    <BlurredBackground imageUrl={link.cover_image_url} className="smart-link-view">
      <div className="smart-link-view__inner">
        <div className="smart-link-view__left">
          <MediaPlayerCover
            imageUrl={link.cover_image_url}
            audioUrl={link.audio_file_url}
            playButtonPosition="center"
          />
        </div>
        <div className="smart-link-view__right">
          <div className="smart-link-view__panel">
            <h1 className="smart-link-view__title">{link.title}</h1>
            {link.subtitle && (
              <p className="smart-link-view__subtitle">{link.subtitle}</p>
            )}
            <div className="smart-link-view__providers">
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
