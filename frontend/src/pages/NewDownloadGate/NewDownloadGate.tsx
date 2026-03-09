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
import "./NewDownloadGate.scss";

/** Short code: 3–32 chars, letters, numbers, hyphens, underscores only. */
export const SHORT_CODE_PATTERN = /^[a-zA-Z0-9_-]{3,32}$/;

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

const DESIGN_OPTIONS = [
  { value: "impact-light", label: "Impact - Light" },
  { value: "impact-dark", label: "Impact - Dark" },
  { value: "minimal-light", label: "Minimal - Light" },
  { value: "minimal-dark", label: "Minimal - Dark" },
] as const;

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

/** Genre options with category subheadings, in display order. */
const GENRE_GROUPS: { heading: string; genres: string[] }[] = [
  {
    heading: "DANCE / ELECTRONIC",
    genres: [
      "Afro House",
      "Bass",
      "Bass House",
      "Breaks",
      "Chill Out",
      "Deep House",
      "Drum & Bass",
      "Dubstep",
      "Electro House",
      "Electronica",
      "Future House",
      "Glitch Hop",
      "Hard Dance",
      "Hardcore / Hard Techno",
      "House",
      "Indie Dance / Nu Disco",
      "Progressive House",
      "Psy Trance",
      "Tech House",
      "Techno",
      "Trance",
      "Trap",
      "Trip-Hop",
    ],
  },
  {
    heading: "HIP-HOP / R&B",
    genres: ["R&B", "Disco", "Funk", "Hip-Hop", "Soul"],
  },
  {
    heading: "POP / ROCK",
    genres: [
      "Acoustic",
      "Alternative",
      "Pop",
      "Country",
      "Folk",
      "Indie",
      "K-Pop",
      "Metal",
      "Punk",
      "Rock",
      "Singer Songwriter",
    ],
  },
  {
    heading: "",
    genres: ["World"],
  },
  {
    heading: "OTHER",
    genres: [
      "Blues",
      "Christian",
      "Classical",
      "Dancehall",
      "Dub",
      "Gospel",
      "Jazz",
      "Latin",
      "Reggae",
      "Reggaeton",
      "Other",
    ],
  },
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
    <div className="new-download-gate">
      <h1>Create New Download Gate</h1>

      <form
        className="new-download-gate__form"
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
          <p className="new-download-gate__instruction">
            Enter source/track URL for your title
          </p>
          <div className="new-download-gate__icons">
            {/* Platform icons placeholder - SoundCloud, YouTube, Spotify, etc. */}
          </div>
          <div className="new-download-gate__field">
            <Label htmlFor="source-url" className="sr-only">
              Source URL
            </Label>
            <Input
              id="source-url"
              type="url"
              placeholder="https://www..."
              aria-label="Source URL"
              aria-invalid={Boolean(errors.sourceUrl)}
              className="new-download-gate__input"
              {...register("sourceUrl")}
            />
            {errors.sourceUrl && (
              <p className="new-download-gate__error">
                {errors.sourceUrl.message}
              </p>
            )}
          </div>
          <div className="new-download-gate__actions">
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
          <p className="new-download-gate__instruction">
            Select genre of your title.
          </p>
          <Controller
            name="genre"
            control={control}
            render={({ field }) => (
              <div className="new-download-gate__field">
                <Label htmlFor="genre">Genre</Label>
                <Select
                  value={field.value || "__none__"}
                  onValueChange={(v) => field.onChange(v === "__none__" ? "" : v)}
                >
                  <SelectTrigger
                    id="genre"
                    className="w-full new-download-gate__select-trigger"
                  >
                    <SelectValue placeholder="Select genre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Select genre</SelectItem>
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
          <div className="new-download-gate__actions">
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
          <p className="new-download-gate__instruction">
            Upload cover art (optional) and the audio file you would like to share with fans.
          </p>
          <div className="new-download-gate__field">
            <Label className="new-download-gate__dropzone-label">Cover art (optional)</Label>
            <Controller
              name="coverFile"
              control={control}
              render={({ field: { onChange, onBlur, ref } }) => (
                <div className="new-download-gate__dropzone">
                  <input
                    ref={ref}
                    type="file"
                    accept=".jpg,.jpeg,.png,.gif,.webp,image/jpeg,image/png,image/gif,image/webp"
                    className="new-download-gate__file-input"
                    aria-label="Upload cover art"
                    onChange={(e) => onChange(e.target.files)}
                    onBlur={onBlur}
                  />
                  <span className="new-download-gate__dropzone-icon" aria-hidden>
                    🖼
                  </span>
                  <p className="new-download-gate__dropzone-text">
                    {watch("coverFile")?.[0]
                      ? watch("coverFile")![0].name
                      : "Drop cover image or browse"}
                  </p>
                  <p className="new-download-gate__dropzone-hint">
                    JPEG, PNG, GIF or WebP, max 5 MB
                  </p>
                </div>
              )}
            />
          </div>
          <div className="new-download-gate__field">
            <Label className="new-download-gate__dropzone-label">Audio file (required)</Label>
            <Controller
              name="file"
              control={control}
              render={({ field: { onChange, onBlur, ref } }) => (
                <div className="new-download-gate__dropzone">
                  <input
                    ref={ref}
                    type="file"
                    accept=".mp3,.wav,.flac,.aac,.ogg,audio/mpeg,audio/mp3,audio/wav,audio/flac,audio/x-flac,audio/aac,audio/ogg"
                    className="new-download-gate__file-input"
                    aria-label="Upload audio file"
                    onChange={(e) => onChange(e.target.files)}
                    onBlur={onBlur}
                  />
                  <span className="new-download-gate__dropzone-icon" aria-hidden>
                    ♪
                  </span>
                  <p className="new-download-gate__dropzone-text">
                    {watch("file")?.[0]
                      ? watch("file")![0].name
                      : "Drop your audio file here or browse"}
                  </p>
                  <p className="new-download-gate__dropzone-hint">
                    MP3, WAV, FLAC, AAC or OGG, max 100 MB
                  </p>
                </div>
              )}
            />
          </div>
          <div className="new-download-gate__actions">
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
          <p className="new-download-gate__instruction">
            Enter artist and title for your release.
          </p>
          <div className="new-download-gate__field">
            <Label htmlFor="artist-name">Enter artist name</Label>
            <Input
              id="artist-name"
              type="text"
              placeholder="Artist name"
              aria-label="Artist name"
              className="new-download-gate__input"
              {...register("artist")}
            />
          </div>
          <div className="new-download-gate__field">
            <Label htmlFor="title">Enter title</Label>
            <Input
              id="title"
              type="text"
              placeholder="Title"
              aria-label="Title"
              className="new-download-gate__input"
              {...register("title")}
            />
          </div>
          <div className="new-download-gate__actions">
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
          <p className="new-download-gate__instruction">Customize design</p>
          <Controller
            name="design"
            control={control}
            render={({ field }) => (
              <div className="new-download-gate__field">
                <Label htmlFor="design">Design theme</Label>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="design"
                    className="w-full new-download-gate__select-trigger"
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
          <div className="new-download-gate__actions">
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
          <p className="new-download-gate__instruction">
            Choose how you want fans to support this track.
          </p>
          <Controller
            name="gateSteps"
            control={control}
            render={({ field: { value, onChange } }) => (
              <div className="new-download-gate__gate-steps">
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
          <div className="new-download-gate__actions">
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
          <p className="new-download-gate__instruction">
            Choose a short code for your gate link. Use only letters, numbers,
            hyphens and underscores (3–32 characters). Leave blank to auto-generate
            one. This cannot be changed after the gate is created.
          </p>
          <div className="new-download-gate__field">
            <Label htmlFor="short-code">Short code</Label>
            <div className="new-download-gate__link-url">
              <span className="new-download-gate__link-url-prefix">
                {typeof window !== "undefined" ? window.location.origin : ""}/
              </span>
              <Input
                id="short-code"
                type="text"
                placeholder="e.g. saxy-sax or leave blank"
                className="new-download-gate__link-url-input"
                aria-label="Short code for link URL"
                aria-invalid={Boolean(errors.shortCode)}
                {...register("shortCode", {
                  validate: (v) =>
                    !v?.trim() ||
                    SHORT_CODE_PATTERN.test(v.trim()) ||
                    "Use 3–32 characters: letters, numbers, hyphens and underscores only",
                })}
              />
            </div>
            {errors.shortCode && (
              <p className="new-download-gate__error">
                {errors.shortCode.message}
              </p>
            )}
            <p className="new-download-gate__hint">
              Your gate will be at:{" "}
              <strong>
                {typeof window !== "undefined" ? window.location.origin : ""}/
                {watch("shortCode")?.trim() || "…"}
              </strong>
            </p>
          </div>
          <div className="new-download-gate__actions">
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
          <p className="new-download-gate__instruction">
            Enter pixels for tracking and retargeting fans that visit your
            download gate.
          </p>
          <Card className="new-download-gate__tracking-card">
            <CardHeader>
              <CardTitle>Facebook</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="new-download-gate__field">
                <Label htmlFor="facebook-pixel-id">Facebook Pixel ID</Label>
                <Input
                  id="facebook-pixel-id"
                  type="text"
                  placeholder="Enter Facebook Pixel ID"
                  aria-label="Facebook Pixel ID"
                  className="new-download-gate__input"
                  {...register("facebookPixelId")}
                />
              </div>
              <div className="new-download-gate__field">
                <Label htmlFor="conversion-api-token">
                  Conversion API access token (optional)
                </Label>
                <Input
                  id="conversion-api-token"
                  type="text"
                  placeholder="Enter Conversion API access token"
                  aria-label="Conversion API access token"
                  className="new-download-gate__input"
                  {...register("conversionApiToken")}
                />
              </div>
            </CardContent>
          </Card>
          <div className="new-download-gate__actions">
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
          <p className="new-download-gate__instruction">
            Review and create your download gate.
          </p>
          <div className="new-download-gate__confirmation-fields">
            <div className="new-download-gate__field">
              <Label htmlFor="conf-artist">Artist:</Label>
              <Input
                id="conf-artist"
                type="text"
                readOnly
                className="new-download-gate__input"
                value={watchedArtist}
                aria-label="Artist"
              />
            </div>
            <div className="new-download-gate__field">
              <Label htmlFor="conf-title">Title:</Label>
              <Input
                id="conf-title"
                type="text"
                readOnly
                className="new-download-gate__input"
                value={watchedTitle}
                aria-label="Title"
              />
            </div>
            <div className="new-download-gate__field">
              <Label htmlFor="conf-source">Source:</Label>
              <Input
                id="conf-source"
                type="text"
                readOnly
                className="new-download-gate__input"
                value={watchedSourceUrl}
                aria-label="Source"
              />
            </div>
            <div className="new-download-gate__field">
              <Label htmlFor="conf-genre">Genre:</Label>
              <Input
                id="conf-genre"
                type="text"
                readOnly
                className="new-download-gate__input"
                value={watchedGenre}
                aria-label="Genre"
              />
            </div>
            <div className="new-download-gate__field">
              <Label htmlFor="conf-gate-steps">Gate steps:</Label>
              <Input
                id="conf-gate-steps"
                type="text"
                readOnly
                className="new-download-gate__input"
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
            <div className="new-download-gate__field new-download-gate__field--row">
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
            {/* <div className="new-download-gate__field">
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
            <p className="new-download-gate__error" role="alert">
              {errors.root.message}
            </p>
          )}
          <div className="new-download-gate__actions">
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
