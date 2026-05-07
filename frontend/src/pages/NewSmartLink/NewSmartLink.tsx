import { useState } from "react";
import { useForm, Controller, type UseFormRegister } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { createSmartLink } from "../../network/smartLinks/createSmartLink";
import { uploadCoverArt, uploadAudio } from "../../network/media/uploadMedia";
import { buildCreateSmartLinkPayload } from "./newSmartLinkUtils";
import ToggleMenuItem from "../../components/ToggleMenuItem/ToggleMenuItem";
import CoverArtDropzone from "../../components/CoverArtDropzone/CoverArtDropzone";
import LinkUrlField from "../../components/LinkUrlField/LinkUrlField";
import TrackingPixelsCard from "../../components/TrackingPixelsCard/TrackingPixelsCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GENRE_GROUPS } from "@/constants/genres";
import { DESIGN_OPTIONS } from "@/constants/designOptions";
import { SHORT_CODE_PATTERN, SHORT_CODE_VALIDATION_MESSAGE } from "@/constants/shortCode";
import { GENRE_SELECT_TRIGGER_CLASS } from "@/constants/genreSelectTrigger";
import { cn } from "@/lib/utils";
import { SMART_LINK_PLATFORMS, type SmartLinkPlatformId } from "@/constants/platforms";
import type { SmartLinkPlatform } from "@/types/smartLink";
import SmartLinkPlatformComponent, {
  DEFAULT_PLATFORM_VALUE,
} from "@/components/SmartLinkPlatform/SmartLinkPlatform";
export type { SmartLinkPlatform } from "@/types/smartLink";

export interface NewSmartLinkFormValues {
  sourceUrl: string;
  genre: string;
  artist: string;
  title: string;
  design: string;
  coverFile: FileList | null;
  platformLinks: Record<SmartLinkPlatformId, SmartLinkPlatform>;
  shortCode: string;
  audioFile: FileList | null;
  audioStartSeconds: number;
  facebookPixelId: string;
  conversionApiToken: string;
  includeInNewReleases: boolean;
  customNotes: string;
}

const defaultPlatformLinks = SMART_LINK_PLATFORMS.reduce(
  (acc, { id }) => {
    acc[id] = { ...DEFAULT_PLATFORM_VALUE };
    return acc;
  },
  {} as Record<SmartLinkPlatformId, SmartLinkPlatform>
);

const defaultValues: NewSmartLinkFormValues = {
  sourceUrl: "",
  genre: "",
  artist: "",
  title: "",
  design: "impact-dark",
  coverFile: null,
  platformLinks: defaultPlatformLinks,
  shortCode: "",
  audioFile: null,
  audioStartSeconds: 0,
  facebookPixelId: "",
  conversionApiToken: "",
  includeInNewReleases: false,
  customNotes: "",
};

export default function NewSmartLink() {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openStep, setOpenStep] = useState(1);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
    setError,
  } = useForm<NewSmartLinkFormValues>({
    defaultValues,
  });

  const watchedSourceUrl = watch("sourceUrl");
  const watchedArtist = watch("artist");
  const watchedTitle = watch("title");
  const watchedGenre = watch("genre");
  const watchedPlatformLinks = watch("platformLinks");
  const watchedCoverFile = watch("coverFile");
  const watchedAudioFile = watch("audioFile");

  async function onSubmit(data: NewSmartLinkFormValues) {
    const coverFile = data.coverFile?.[0];
    const audioFile = data.audioFile?.[0];
    if (!coverFile) {
      setError("root", { type: "submit", message: "Please upload cover art in the Design step." });
      return;
    }
    if (!audioFile) {
      setError("root", { type: "submit", message: "Please upload an audio file in the Audio preview step." });
      return;
    }
    setIsSubmitting(true);
    try {
      const uploadOpts = { getToken };
      const [coverResult, audioResult] = await Promise.all([
        uploadCoverArt(coverFile, uploadOpts),
        uploadAudio(audioFile, uploadOpts),
      ]);
      const payload = buildCreateSmartLinkPayload({
        ...data,
        cover_image_url: coverResult.url,
        audio_file_url: audioResult.url,
      });
      const link = await createSmartLink(payload, { getToken });
      navigate("/dashboard", { state: { createdSmartLinkId: link.link_id, activeTab: 'smart-links' } });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create smart link";
      setError("root", { type: "submit", message });
      console.error("Create smart link failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-[700px] min-w-[min(100vw,700px)] py-6">
      <h1 className="mb-6 text-2xl font-semibold text-black">Create New Smart Link</h1>

      <form
        onSubmit={handleSubmit(onSubmit, (formErrors) => {
          // Expand the first step that has a validation error so the user sees what to fix
          if (formErrors.sourceUrl) setOpenStep(1);
          else if (formErrors.genre) setOpenStep(2);
          else if (formErrors.artist || formErrors.title) setOpenStep(3);
          else if (formErrors.coverFile) setOpenStep(4);
          else if (formErrors.platformLinks) setOpenStep(5);
          else if (formErrors.shortCode) setOpenStep(6);
          else if (formErrors.audioFile) setOpenStep(7);
          else if (formErrors.facebookPixelId || formErrors.conversionApiToken) setOpenStep(8);
        })}
        noValidate
      >
        {/* Step 1: Source */}
        <ToggleMenuItem
          stepNumber={1}
          title="Source"
          completed
          expanded={openStep === 1}
          onExpandedChange={(expanded) => setOpenStep(expanded ? 1 : 0)}
        >
          <p className="mb-3 text-sm leading-snug text-neutral-500">
            Enter source/track URL for your title
          </p>
          <div className="mb-3 min-h-5">
            {/* Platform icons: SoundCloud, YouTube, Spotify, Apple Music, etc. */}
          </div>
          <div className="mb-4 space-y-1.5 [&_label]:mb-1.5 [&_label]:block [&_label]:text-sm [&_label]:font-medium [&_label]:text-black">
            <Label htmlFor="source-url" className="sr-only">
              Source URL
            </Label>
            <Input
              id="source-url"
              type="url"
              placeholder="https://www..."
              aria-label="Source URL"
              aria-invalid={Boolean(errors.sourceUrl)}
              className="mb-4 w-full rounded-md border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-black placeholder:text-neutral-400 focus-visible:border-black focus-visible:ring-0"
              {...register("sourceUrl", {
                required: "Please enter a Track URL.",
              })}
            />
            {errors.sourceUrl && (
              <p className="-mt-2 mb-3 text-[13px] text-red-600">
                {errors.sourceUrl.message}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Button
              type="button"
              variant="default"
              onClick={() => setOpenStep(2)}
            >
              Next
            </Button>
          </div>
        </ToggleMenuItem>

        {/* Step 2: Genre */}
        <ToggleMenuItem
          stepNumber={2}
          title="Genre"
          completed
          expanded={openStep === 2}
          onExpandedChange={(expanded) => setOpenStep(expanded ? 2 : 0)}
        >
          <p className="mb-3 text-sm leading-snug text-neutral-500">
            Select genre of your title.
          </p>
          <Controller
            name="genre"
            control={control}
            render={({ field }) => (
              <div className="mb-4 space-y-1.5 [&_label]:mb-1.5 [&_label]:block [&_label]:text-sm [&_label]:font-medium [&_label]:text-black">
                <Label htmlFor="genre">Genre</Label>
                <Select
                  value={field.value || undefined}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    id="genre"
                    className={cn(
                      "mb-4 w-full",
                      GENRE_SELECT_TRIGGER_CLASS,
                    )}
                  >
                    <SelectValue placeholder="Select genre" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENRE_GROUPS.map((group) => (
                      <SelectGroup key={group.heading || group.genres[0]}>
                        {group.heading ? (
                          <SelectLabel className="uppercase font-semibold text-muted-foreground">
                            {group.heading}
                          </SelectLabel>
                        ) : null}
                        {group.genres.map((genre) => (
                          <SelectItem key={genre} value={genre}>
                            {genre}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          />
          <div className="flex flex-wrap gap-2.5">
            <Button type="button" variant="default" onClick={() => setOpenStep(3)}>
              Next
            </Button>
          </div>
        </ToggleMenuItem>

        {/* Step 3: Title */}
        <ToggleMenuItem
          stepNumber={3}
          title="Title"
          completed
          expanded={openStep === 3}
          onExpandedChange={(expanded) => setOpenStep(expanded ? 3 : 0)}
        >
          <p className="mb-3 text-sm leading-snug text-neutral-500">
            Enter artist and title for your release.
          </p>
          <div className="mb-4 space-y-1.5 [&_label]:mb-1.5 [&_label]:block [&_label]:text-sm [&_label]:font-medium [&_label]:text-black">
            <Label htmlFor="artist-name">Enter artist name</Label>
            <Input
              id="artist-name"
              type="text"
              placeholder="Artist name"
              className="mb-4 w-full rounded-md border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-black placeholder:text-neutral-400 focus-visible:border-black focus-visible:ring-0"
              {...register("artist")}
            />
          </div>
          <div className="mb-4 space-y-1.5 [&_label]:mb-1.5 [&_label]:block [&_label]:text-sm [&_label]:font-medium [&_label]:text-black">
            <Label htmlFor="title">Enter title</Label>
            <Input
              id="title"
              type="text"
              placeholder="Title"
              className="mb-4 w-full rounded-md border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-black placeholder:text-neutral-400 focus-visible:border-black focus-visible:ring-0"
              {...register("title")}
            />
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Button type="button" variant="default" onClick={() => setOpenStep(4)}>
              Next
            </Button>
          </div>
        </ToggleMenuItem>

        {/* Step 4: Design */}
        <ToggleMenuItem
          stepNumber={4}
          title="Design"
          completed={Boolean(watchedCoverFile?.[0])}
          expanded={openStep === 4}
          onExpandedChange={(expanded) => setOpenStep(expanded ? 4 : 0)}
        >
          <p className="mb-3 text-sm leading-snug text-neutral-500">
            Upload cover art and customize how your smart link looks. Cover art is required.
          </p>
          {/* <div className="new-smart-link__preview">
            <div className="new-smart-link__preview-cover">
              Cover art
            </div>
            <div className="new-smart-link__preview-track">
              {watchedTitle || "Track Title"}
            </div>
            <div className="new-smart-link__preview-artist">
              {watchedArtist || "Artist Name"}
            </div>
          </div> */}
          <CoverArtDropzone<NewSmartLinkFormValues>
            name="coverFile"
            control={control}
            label="Upload cover art"
          />
          <div className="mb-4 space-y-1.5 [&_label]:mb-1.5 [&_label]:block [&_label]:text-sm [&_label]:font-medium [&_label]:text-black">
            <Label htmlFor="design">Customize design</Label>
            <Controller
              name="design"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="design"
                    className="mb-4 w-full"
                  >
                    <SelectValue placeholder="Select design" />
                  </SelectTrigger>
                  <SelectContent>
                    {DESIGN_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Button type="button" variant="default" onClick={() => setOpenStep(5)}>
              Next
            </Button>
          </div>
        </ToggleMenuItem>

        {/* Step 5: Links */}
        <ToggleMenuItem
          stepNumber={5}
          title="Links"
          completed
          expanded={openStep === 5}
          onExpandedChange={(expanded) => setOpenStep(expanded ? 5 : 0)}
        >
          <p className="mb-3 text-sm leading-snug text-neutral-500">
            Add links to your music on any store and platform.
          </p>
          <Controller
            name="platformLinks"
            control={control}
            render={({ field: { value, onChange } }) => (
              <div className="mb-4 grid grid-cols-2 gap-2.5">
                {SMART_LINK_PLATFORMS.map(({ id, label }) => (
                  <SmartLinkPlatformComponent
                    key={id}
                    platformId={id}
                    label={label}
                    value={value[id] ?? DEFAULT_PLATFORM_VALUE}
                    onChange={(next) =>
                      onChange({ ...value, [id]: next })
                    }
                  />
                ))}
              </div>
            )}
          />
          <div className="flex flex-wrap gap-2.5">
            <Button type="button" variant="default" onClick={() => setOpenStep(6)}>
              Next
            </Button>
          </div>
        </ToggleMenuItem>

        {/* Step 6: Link URL */}
        <ToggleMenuItem
          stepNumber={6}
          title="Link URL"
          completed
          expanded={openStep === 6}
          onExpandedChange={(expanded) => setOpenStep(expanded ? 6 : 0)}
        >
          <p className="mb-3 text-sm leading-snug text-neutral-500">
            Customize your link URL. Use only letters, numbers, hyphens and
            underscores (3–32 characters). Leave blank to auto-generate.
          </p>
          <LinkUrlField
            prefix={typeof window !== "undefined" ? `${window.location.origin}/` : ""}
            name="shortCode"
            register={register as unknown as UseFormRegister<Record<string, string>>}
            registerOptions={{
              validate: (v) =>
                !v?.trim() ||
                SHORT_CODE_PATTERN.test(v.trim()) ||
                SHORT_CODE_VALIDATION_MESSAGE,
            }}
            error={errors.shortCode}
            placeholder="e.g. my-track or leave blank"
          />
          <div className="flex flex-wrap gap-2.5">
            <Button type="button" variant="default" onClick={() => setOpenStep(7)}>
              Next
            </Button>
          </div>
        </ToggleMenuItem>

        {/* Step 7: Audio preview */}
        <ToggleMenuItem
          stepNumber={7}
          title="Audio preview"
          completed={Boolean(watchedAudioFile?.[0])}
          expanded={openStep === 7}
          onExpandedChange={(expanded) => setOpenStep(expanded ? 7 : 0)}
        >
          <p className="mb-3 text-sm leading-snug text-neutral-500">
            Upload an audio file and choose where playback should start. Audio is required.
          </p>
          <Controller
            name="audioFile"
            control={control}
            render={({ field: { ref, onChange, onBlur, value } }) => (
              <div className="relative mb-4 flex min-h-[120px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-200 bg-neutral-50 p-6 transition-colors hover:border-neutral-300 hover:bg-neutral-100">
                <input
                  ref={ref}
                  type="file"
                  accept=".mp3,.wav,.flac,.aac,.ogg,audio/mpeg,audio/mp3,audio/wav,audio/flac,audio/x-flac,audio/aac,audio/ogg"
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  aria-label="Upload audio file"
                  onChange={(e) => onChange(e.target.files)}
                  onBlur={onBlur}
                />
                <span aria-hidden>♪</span>
                <p>
                  {value?.[0]
                    ? value[0].name
                    : "Drop your audio file here or browse"}
                </p>
                <p className="mb-3 text-sm leading-snug text-neutral-500">MP3, WAV, FLAC, AAC or OGG</p>
              </div>
            )}
          />
          <div className="mb-4 mt-3 space-y-1.5 [&_label]:mb-1.5 [&_label]:block [&_label]:text-sm [&_label]:font-medium [&_label]:text-black">
            <Label htmlFor="audio-start">Start playback at (seconds)</Label>
            <Input
              id="audio-start"
              type="number"
              min={0}
              step={1}
              className="mb-4 w-full rounded-md border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-black placeholder:text-neutral-400 focus-visible:border-black focus-visible:ring-0"
              {...register("audioStartSeconds", { valueAsNumber: true })}
            />
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Button type="button" variant="default" onClick={() => setOpenStep(8)}>
              Next
            </Button>
          </div>
        </ToggleMenuItem>

        {/* Step 8: Tracking pixels */}
        <ToggleMenuItem
          stepNumber={8}
          title="Tracking pixels"
          expanded={openStep === 8}
          onExpandedChange={(expanded) => setOpenStep(expanded ? 8 : 0)}
        >
          <p className="mb-3 text-sm leading-snug text-neutral-500">
            Enter pixels for tracking and retargeting fans that visit your smart link.
          </p>
          <TrackingPixelsCard
            register={register as unknown as ReturnType<typeof useForm<Record<string, string>>>["register"]}
            pixelIdName="facebookPixelId"
            conversionTokenName="conversionApiToken"
          />
          <div className="flex flex-wrap gap-2.5">
            <Button type="button" variant="default" onClick={() => setOpenStep(9)}>
              Next
            </Button>
          </div>
        </ToggleMenuItem>

        {/* Step 9: Confirmation */}
        <ToggleMenuItem
          stepNumber={9}
          title="Confirmation"
          expanded={openStep === 9}
          onExpandedChange={(expanded) => setOpenStep(expanded ? 9 : 0)}
        >
          <p className="mb-3 text-sm leading-snug text-neutral-500">
            Review and create your smart link.
          </p>
          <div className="mb-4">
            <div className="mb-4 space-y-1.5 [&_label]:mb-1.5 [&_label]:block [&_label]:text-sm [&_label]:font-medium [&_label]:text-black">
              <Label htmlFor="conf-source">Source:</Label>
              <Input
                id="conf-source"
                type="text"
                readOnly
                className="mb-4 w-full rounded-md border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-black placeholder:text-neutral-400 focus-visible:border-black focus-visible:ring-0"
                value={watchedSourceUrl}
              />
            </div>
            <div className="mb-4 space-y-1.5 [&_label]:mb-1.5 [&_label]:block [&_label]:text-sm [&_label]:font-medium [&_label]:text-black">
              <Label htmlFor="conf-artist">Artist:</Label>
              <Input
                id="conf-artist"
                type="text"
                readOnly
                className="mb-4 w-full rounded-md border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-black placeholder:text-neutral-400 focus-visible:border-black focus-visible:ring-0"
                value={watchedArtist}
              />
            </div>
            <div className="mb-4 space-y-1.5 [&_label]:mb-1.5 [&_label]:block [&_label]:text-sm [&_label]:font-medium [&_label]:text-black">
              <Label htmlFor="conf-title">Title:</Label>
              <Input
                id="conf-title"
                type="text"
                readOnly
                className="mb-4 w-full rounded-md border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-black placeholder:text-neutral-400 focus-visible:border-black focus-visible:ring-0"
                value={watchedTitle}
              />
            </div>
            <div className="mb-4 space-y-1.5 [&_label]:mb-1.5 [&_label]:block [&_label]:text-sm [&_label]:font-medium [&_label]:text-black">
              <Label htmlFor="conf-genre">Genre:</Label>
              <Input
                id="conf-genre"
                type="text"
                readOnly
                className="mb-4 w-full rounded-md border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-black placeholder:text-neutral-400 focus-visible:border-black focus-visible:ring-0"
                value={watchedGenre}
              />
            </div>
            <div className="mb-4 space-y-1.5 [&_label]:mb-1.5 [&_label]:block [&_label]:text-sm [&_label]:font-medium [&_label]:text-black">
              <Label htmlFor="conf-platforms">Platforms:</Label>
              <Input
                id="conf-platforms"
                type="text"
                readOnly
                className="mb-4 w-full rounded-md border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-black placeholder:text-neutral-400 focus-visible:border-black focus-visible:ring-0"
                value={
                  !watchedPlatformLinks
                    ? "None"
                    : (() => {
                        const labels = Object.entries(watchedPlatformLinks)
                          .filter(([, data]) => data?.trackUrl?.trim())
                          .map(
                            ([id]) =>
                              SMART_LINK_PLATFORMS.find((p) => p.id === id)?.label ?? id
                          );
                        return labels.length === 0 ? "None" : labels.join(", ");
                      })()
                }
              />
            </div>
            <div className="mb-4 flex items-center gap-2.5 [&_label]:mb-0">
              <Label htmlFor="conf-new-releases">Include in New Releases:</Label>
              <Controller
                name="includeInNewReleases"
                control={control}
                render={({ field }) => (
                  <input
                    id="conf-new-releases"
                    type="checkbox"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="m-0 w-auto"
                  />
                )}
              />
            </div>
            <div className="mb-4 space-y-1.5 [&_label]:mb-1.5 [&_label]:block [&_label]:text-sm [&_label]:font-medium [&_label]:text-black">
              <Label htmlFor="conf-notes">Custom Notes:</Label>
              <Textarea
                id="conf-notes"
                rows={3}
                className="mt-2 min-h-[80px] w-full resize-y rounded-md border border-neutral-200 px-3 py-2 text-sm focus-visible:border-black focus-visible:ring-0"
                {...register("customNotes")}
              />
            </div>
          </div>
          {errors.root?.message && (
            <p className="-mt-2 mb-3 text-[13px] text-red-600" role="alert">
              {errors.root.message}
            </p>
          )}
          <div className="flex flex-wrap gap-2.5">
            <Button type="submit" variant="default" disabled={isSubmitting}>
              {isSubmitting ? "Creating…" : "Create"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => navigate("/dashboard")}
            >
              Cancel
            </Button>
          </div>
        </ToggleMenuItem>
      </form>
    </div>
  );
}
