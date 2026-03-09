import { SMART_LINK_PLATFORMS } from "@/constants/platforms";
import type { CreateSmartLinkRequest } from "../../network/smartLinks/types";

/**
 * Build short_url slug from title when shortCode is empty.
 * Used when creating a smart link without a custom short code.
 */
export function slugFromTitle(title: string): string {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "")
    .slice(0, 32);
  return slug || "link";
}

export interface BuildCreateSmartLinkPayloadInput {
  title: string;
  artist?: string;
  shortCode?: string;
  platformLinks: Record<string, { trackUrl?: string }>;
}

/**
 * Build the API payload for creating a smart link from NewSmartLink form values.
 */
export function buildCreateSmartLinkPayload(
  data: BuildCreateSmartLinkPayloadInput
): CreateSmartLinkRequest {
  const trimmedShortCode = data.shortCode?.trim();
  const shortUrl = trimmedShortCode ? trimmedShortCode : slugFromTitle(data.title);
  const platforms = SMART_LINK_PLATFORMS.filter(
    (p) => data.platformLinks[p.id]?.trackUrl?.trim()
  ).map((p) => ({
    platform_name: p.id,
    url: data.platformLinks[p.id].trackUrl!.trim(),
  }));
  return {
    title: data.title.trim(),
    subtitle: data.artist?.trim() || undefined,
    short_url: shortUrl,
    platforms: platforms.length > 0 ? platforms : undefined,
  };
}
