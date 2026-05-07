import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import ToggleMenuItem from "../../components/ToggleMenuItem/ToggleMenuItem";
import GateStep from './GateStep';
import { createDownloadGate } from "@/network/downloadGates/createDownloadGate";
import { uploadCoverArt, uploadAudio } from "@/network/media/uploadMedia";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GENRE_GROUPS } from "@/constants/genres";
import { DESIGN_OPTIONS } from "@/constants/designOptions";
import {
  SHORT_CODE_PATTERN,
  SHORT_CODE_VALIDATION_MESSAGE,
} from "@/constants/shortCode";
import { GENRE_SELECT_TRIGGER_CLASS } from "@/constants/genreSelectTrigger";
import { cn } from "@/lib/utils";
/** One gate step in the form (selection order = step_order). */
export interface GateStepFormItem {
  service_type: string;
  is_skippable: boolean;
  config: Record<string, unknown>;
}

export interface NewDownloadGateFormValues {
  sourceUrl: string;
  genre: string;
  coverFile: FileList | null;
  file: FileList | null;
  artist: string;
  title: string;
  design: string;
  gateSteps: GateStepFormItem[];
  shortCode: string;
  facebookPixelId: string;
  conversionApiToken: string;
  includeInNewReleases: boolean;
  customNotes: string;
}

/** Gate step options: label (UI) and service_type (API / DATA_MODEL). */
// const GATE_STEP_OPTIONS: { label: string; service_type: string }[] = [
const GATE_STEP_OPTIONS: { label: string; service_type: string }[] = [
  { label: "Email capture", service_type: "email_capture" },
  { label: "SoundCloud", service_type: "soundcloud" },
  // { label: "YouTube", service_type: "youtube" },
  { label: "Spotify", service_type: "spotify" },
  // { label: "Apple Music", service_type: "apple_music" },
  // { label: "Deezer", service_type: "deezer" },
  // { label: "Twitch", service_type: "twitch" },
  // { label: "Mixcloud", service_type: "mixcloud" },
  // { label: "Facebook", service_type: "facebook" },
  { label: "Instagram", service_type: "instagram" },
  // { label: "X / Twitter", service_type: "twitter" },
  // { label: "TikTok", service_type: "tiktok" },
  // { label: "Bandcamp", service_type: "bandcamp" },
  { label: "Donation", service_type: "donation" },
];

const defaultValues: NewDownloadGateFormValues = {
  sourceUrl: "",
  genre: "",
  coverFile: null,
  file: null,
  artist: "",
  title: "",
  design: "impact-light",
  gateSteps: [],
  shortCode: "",
  facebookPixelId: "",
  conversionApiToken: "",
  includeInNewReleases: false,
  customNotes: "",
};

export default function NewDownloadGate() {
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
  } = useForm<NewDownloadGateFormValues>({
    defaultValues,
  });

  const watchedArtist = watch("artist");
  const watchedTitle = watch("title");
  const watchedSourceUrl = watch("sourceUrl");
  const watchedGenre = watch("genre");
  const watchedGateSteps = watch("gateSteps");

  async function onSubmit(data: NewDownloadGateFormValues) {
    const audioFile = data.file?.[0];
    if (!audioFile) {
      setError("root", { type: "submit", message: "Please upload an audio file in step 3." });
      return;
    }
    setIsSubmitting(true);
    try {
      const uploadOpts = { getToken };
      const [coverResult, audioResult] = await Promise.all([
        data.coverFile?.[0]
          ? uploadCoverArt(data.coverFile[0], uploadOpts)
          : Promise.resolve(null),
        uploadAudio(audioFile, uploadOpts),
      ]);
      const gate = await createDownloadGate(
        {
          artist_name: data.artist.trim(),
          title: data.title.trim(),
          audio_file_url: audioResult.url,
          thumbnail_url: coverResult?.url,
          short_code: data.shortCode.trim() ? data.shortCode.trim() : undefined,
          steps:
            data.gateSteps.length > 0
              ? data.gateSteps.map((s) => ({
                  service_type: s.service_type,
                  is_skippable: s.is_skippable,
                  config: s.config,
                }))
              : undefined,
        },
        { getToken }
      );
      navigate("/dashboard", { state: { createdGateId: gate.gate_id } });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create download gate";
      setError("root", { type: "submit", message });
      console.error("Create download gate failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-[700px] min-w-[min(100vw,700px)] py-6">
      <h1 className="mb-6 text-2xl font-semibold text-black">Create New Download Gate</h1>

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
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
            {/* Platform icons placeholder - SoundCloud, YouTube, Spotify, etc. */}
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
              {...register("sourceUrl")}
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
            <Button type="button" variant="outline">
              Enter Later
            </Button>
          </div>
        </ToggleMenuItem>

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
                      "w-full mb-4",
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
            <Button
              type="button"
              variant="default"
              onClick={() => setOpenStep(3)}
            >
              Next
            </Button>
          </div>
        </ToggleMenuItem>

        <ToggleMenuItem
          stepNumber={3}
          title="Upload"
          expanded={openStep === 3}
          onExpandedChange={(expanded) => setOpenStep(expanded ? 3 : 0)}
        >
          <p className="mb-3 text-sm leading-snug text-neutral-500">
            Upload cover art (optional) and the audio file you would like to share with fans.
          </p>
          <div className="mb-4 space-y-1.5 [&_label]:mb-1.5 [&_label]:block [&_label]:text-sm [&_label]:font-medium [&_label]:text-black">
            <Label className="mb-1.5 block text-sm font-medium text-black">Cover art (optional)</Label>
            <Controller
              name="coverFile"
              control={control}
              render={({ field: { onChange, onBlur, ref } }) => (
                <div className="relative mb-4 flex min-h-40 flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-200 bg-neutral-50 p-6 transition-colors hover:border-neutral-300 hover:bg-neutral-100">
                  <input
                    ref={ref}
                    type="file"
                    accept=".jpg,.jpeg,.png,.gif,.webp,image/jpeg,image/png,image/gif,image/webp"
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    aria-label="Upload cover art"
                    onChange={(e) => onChange(e.target.files)}
                    onBlur={onBlur}
                  />
                  <span className="mb-3 text-5xl text-neutral-500" aria-hidden>
                    🖼
                  </span>
                  <p className="m-0 mb-1 text-sm font-semibold text-black">
                    {watch("coverFile")?.[0]
                      ? watch("coverFile")![0].name
                      : "Drop cover image or browse"}
                  </p>
                  <p className="m-0 text-[13px] text-neutral-500">
                    JPEG, PNG, GIF or WebP, max 5 MB
                  </p>
                </div>
              )}
            />
          </div>
          <div className="mb-4 space-y-1.5 [&_label]:mb-1.5 [&_label]:block [&_label]:text-sm [&_label]:font-medium [&_label]:text-black">
            <Label className="mb-1.5 block text-sm font-medium text-black">Audio file (required)</Label>
            <Controller
              name="file"
              control={control}
              render={({ field: { onChange, onBlur, ref } }) => (
                <div className="relative mb-4 flex min-h-40 flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-200 bg-neutral-50 p-6 transition-colors hover:border-neutral-300 hover:bg-neutral-100">
                  <input
                    ref={ref}
                    type="file"
                    accept=".mp3,.wav,.flac,.aac,.ogg,audio/mpeg,audio/mp3,audio/wav,audio/flac,audio/x-flac,audio/aac,audio/ogg"
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    aria-label="Upload audio file"
                    onChange={(e) => onChange(e.target.files)}
                    onBlur={onBlur}
                  />
                  <span className="mb-3 text-5xl text-neutral-500" aria-hidden>
                    ♪
                  </span>
                  <p className="m-0 mb-1 text-sm font-semibold text-black">
                    {watch("file")?.[0]
                      ? watch("file")![0].name
                      : "Drop your audio file here or browse"}
                  </p>
                  <p className="m-0 text-[13px] text-neutral-500">
                    MP3, WAV, FLAC, AAC or OGG, max 100 MB
                  </p>
                </div>
              )}
            />
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Button
              type="button"
              variant="default"
              onClick={() => setOpenStep(4)}
            >
              Next
            </Button>
          </div>
        </ToggleMenuItem>

        <ToggleMenuItem
          stepNumber={4}
          title="Title"
          completed
          expanded={openStep === 4}
          onExpandedChange={(expanded) => setOpenStep(expanded ? 4 : 0)}
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
              aria-label="Artist name"
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
              aria-label="Title"
              className="mb-4 w-full rounded-md border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-black placeholder:text-neutral-400 focus-visible:border-black focus-visible:ring-0"
              {...register("title")}
            />
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Button
              type="button"
              variant="default"
              onClick={() => setOpenStep(5)}
            >
              Next
            </Button>
          </div>
        </ToggleMenuItem>

        <ToggleMenuItem
          stepNumber={5}
          title="Design"
          completed
          expanded={openStep === 5}
          onExpandedChange={(expanded) => setOpenStep(expanded ? 5 : 0)}
        >
          <p className="mb-3 text-sm leading-snug text-neutral-500">Customize design</p>
          <Controller
            name="design"
            control={control}
            render={({ field }) => (
              <div className="mb-4 space-y-1.5 [&_label]:mb-1.5 [&_label]:block [&_label]:text-sm [&_label]:font-medium [&_label]:text-black">
                <Label htmlFor="design">Design theme</Label>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="design"
                    className="w-full mb-4"
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
              </div>
            )}
          />
          <div className="flex flex-wrap gap-2.5">
            <Button
              type="button"
              variant="default"
              onClick={() => setOpenStep(6)}
            >
              Next
            </Button>
          </div>
        </ToggleMenuItem>

        <ToggleMenuItem
          stepNumber={6}
          title="Gate steps"
          expanded={openStep === 6}
          onExpandedChange={(expanded) => setOpenStep(expanded ? 6 : 0)}
        >
          <p className="mb-3 text-sm leading-snug text-neutral-500">
            Choose how you want fans to support this track.
          </p>
          <Controller
            name="gateSteps"
            control={control}
            render={({ field: { value, onChange } }) => (
              <div className="mb-4 grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2.5">
                {GATE_STEP_OPTIONS.map(({ label, service_type }) => (
                  <GateStep
                    key={service_type}
                    label={label}
                    service_type={service_type}
                    value={value}
                    onChange={onChange}
                  />
                ))}
              </div>
            )}
          />
          <div className="flex flex-wrap gap-2.5">
            <Button
              type="button"
              variant="default"
              onClick={() => setOpenStep(7)}
            >
              Next
            </Button>
          </div>
        </ToggleMenuItem>

        <ToggleMenuItem
          stepNumber={7}
          title="Link URL"
          completed
          expanded={openStep === 7}
          onExpandedChange={(expanded) => setOpenStep(expanded ? 7 : 0)}
        >
          <p className="mb-3 text-sm leading-snug text-neutral-500">
            Choose a short code for your gate link. Use only letters, numbers,
            hyphens and underscores (3–32 characters). Leave blank to auto-generate
            one. This cannot be changed after the gate is created.
          </p>
          <div className="mb-4 space-y-1.5 [&_label]:mb-1.5 [&_label]:block [&_label]:text-sm [&_label]:font-medium [&_label]:text-black">
            <Label htmlFor="short-code">Short code</Label>
            <div className="mb-2 flex items-center gap-0 rounded-md border border-neutral-200 bg-neutral-50 px-3.5 py-2.5">
              <span className="shrink-0 text-sm text-neutral-500">
                {typeof window !== "undefined" ? window.location.origin : ""}/
              </span>
              <Input
                id="short-code"
                type="text"
                placeholder="e.g. saxy-sax or leave blank"
                className="min-w-0 flex-1 border-0 bg-transparent text-sm text-blue-600 shadow-none focus-visible:ring-0"
                aria-label="Short code for link URL"
                aria-invalid={Boolean(errors.shortCode)}
                {...register("shortCode", {
                  validate: (v) =>
                    !v?.trim() ||
                    SHORT_CODE_PATTERN.test(v.trim()) ||
                    SHORT_CODE_VALIDATION_MESSAGE,
                })}
              />
            </div>
            {errors.shortCode && (
              <p className="-mt-2 mb-3 text-[13px] text-red-600">
                {errors.shortCode.message}
              </p>
            )}
            <p className="mb-4 text-[13px] text-neutral-500">
              Your gate will be at:{" "}
              <strong>
                {typeof window !== "undefined" ? window.location.origin : ""}/
                {watch("shortCode")?.trim() || "…"}
              </strong>
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Button
              type="button"
              variant="default"
              onClick={() => setOpenStep(8)}
            >
              Next
            </Button>
          </div>
        </ToggleMenuItem>

        <ToggleMenuItem
          stepNumber={8}
          title="Tracking pixels"
          expanded={openStep === 8}
          onExpandedChange={(expanded) => setOpenStep(expanded ? 8 : 0)}
        >
          <p className="mb-3 text-sm leading-snug text-neutral-500">
            Enter pixels for tracking and retargeting fans that visit your
            download gate.
          </p>
          <Card className="mb-4 rounded-lg border border-neutral-200 bg-white p-4 shadow-none">
            <CardHeader>
              <CardTitle>Facebook</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="mb-4 space-y-1.5 [&_label]:mb-1.5 [&_label]:block [&_label]:text-sm [&_label]:font-medium [&_label]:text-black">
                <Label htmlFor="facebook-pixel-id">Facebook Pixel ID</Label>
                <Input
                  id="facebook-pixel-id"
                  type="text"
                  placeholder="Enter Facebook Pixel ID"
                  aria-label="Facebook Pixel ID"
                  className="mb-4 w-full rounded-md border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-black placeholder:text-neutral-400 focus-visible:border-black focus-visible:ring-0"
                  {...register("facebookPixelId")}
                />
              </div>
              <div className="mb-4 space-y-1.5 [&_label]:mb-1.5 [&_label]:block [&_label]:text-sm [&_label]:font-medium [&_label]:text-black">
                <Label htmlFor="conversion-api-token">
                  Conversion API access token (optional)
                </Label>
                <Input
                  id="conversion-api-token"
                  type="text"
                  placeholder="Enter Conversion API access token"
                  aria-label="Conversion API access token"
                  className="mb-4 w-full rounded-md border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-black placeholder:text-neutral-400 focus-visible:border-black focus-visible:ring-0"
                  {...register("conversionApiToken")}
                />
              </div>
            </CardContent>
          </Card>
          <div className="flex flex-wrap gap-2.5">
            <Button
              type="button"
              variant="default"
              onClick={() => setOpenStep(9)}
            >
              Next
            </Button>
          </div>
        </ToggleMenuItem>

        <ToggleMenuItem
          stepNumber={9}
          title="Confirmation"
          expanded={openStep === 9}
          onExpandedChange={(expanded) => setOpenStep(expanded ? 9 : 0)}
        >
          <p className="mb-3 text-sm leading-snug text-neutral-500">
            Review and create your download gate.
          </p>
          <div className="mb-4">
            <div className="mb-4 space-y-1.5 [&_label]:mb-1.5 [&_label]:block [&_label]:text-sm [&_label]:font-medium [&_label]:text-black">
              <Label htmlFor="conf-artist">Artist:</Label>
              <Input
                id="conf-artist"
                type="text"
                readOnly
                className="mb-4 w-full rounded-md border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-black placeholder:text-neutral-400 focus-visible:border-black focus-visible:ring-0"
                value={watchedArtist}
                aria-label="Artist"
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
                aria-label="Title"
              />
            </div>
            <div className="mb-4 space-y-1.5 [&_label]:mb-1.5 [&_label]:block [&_label]:text-sm [&_label]:font-medium [&_label]:text-black">
              <Label htmlFor="conf-source">Source:</Label>
              <Input
                id="conf-source"
                type="text"
                readOnly
                className="mb-4 w-full rounded-md border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-black placeholder:text-neutral-400 focus-visible:border-black focus-visible:ring-0"
                value={watchedSourceUrl}
                aria-label="Source"
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
                aria-label="Genre"
              />
            </div>
            <div className="mb-4 space-y-1.5 [&_label]:mb-1.5 [&_label]:block [&_label]:text-sm [&_label]:font-medium [&_label]:text-black">
              <Label htmlFor="conf-gate-steps">Gate steps:</Label>
              <Input
                id="conf-gate-steps"
                type="text"
                readOnly
                className="mb-4 w-full rounded-md border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-black placeholder:text-neutral-400 focus-visible:border-black focus-visible:ring-0"
                value={
                  watchedGateSteps.length === 0
                    ? "None"
                    : watchedGateSteps
                        .map(
                          (s) =>
                            GATE_STEP_OPTIONS.find((o) => o.service_type === s.service_type)
                              ?.label ?? s.service_type
                        )
                        .join(", ")
                }
                aria-label="Gate steps"
              />
            </div>
            <div className="mb-4 flex items-center gap-2.5 [&_label]:mb-0">
              {/* <Controller
                name="includeInNewReleases"
                control={control}
                render={({ field }) => (
                  <>
                    <Label
                      htmlFor="conf-new-releases"
                      className="cursor-pointer"
                    >
                      Include in New Releases:
                    </Label>
                    <Checkbox
                      id="conf-new-releases"
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                      aria-label="Include in New Releases"
                    />
                  </>
                )}
              /> */}
            </div>
            {/* <div className="mb-4 space-y-1.5 [&_label]:mb-1.5 [&_label]:block [&_label]:text-sm [&_label]:font-medium [&_label]:text-black">
              <Label htmlFor="conf-notes">Custom Notes:</Label>
              <Button type="button" variant="outline" size="sm">
                Edit
              </Button>
              <Textarea
                id="conf-notes"
                rows={3}
                className="new-download-gate__textarea mt-2"
                aria-label="Custom Notes"
                {...register("customNotes")}
              />
            </div> */}
          </div>
          {errors.root?.message && (
            <p className="-mt-2 mb-3 text-[13px] text-red-600" role="alert">
              {errors.root.message}
            </p>
          )}
          <div className="flex flex-wrap gap-2.5">
            <Button type="submit" variant="default" disabled={isSubmitting}>
              {isSubmitting ? "Uploading & creating…" : "Create"}
            </Button>
            <Button type="button" variant="outline" disabled={isSubmitting}>
              Cancel
            </Button>
          </div>
        </ToggleMenuItem>
      </form>
    </div>
  );
}
