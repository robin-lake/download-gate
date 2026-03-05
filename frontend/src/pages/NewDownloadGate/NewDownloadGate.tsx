import { useForm, Controller } from "react-hook-form";
import ToggleMenuItem from "../../components/ToggleMenuItem/ToggleMenuItem";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import "./NewDownloadGate.scss";

export interface NewDownloadGateFormValues {
  sourceUrl: string;
  genre: string;
  file: FileList | null;
  artist: string;
  title: string;
  design: string;
  gateSteps: string[];
  linkUrl: string;
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

const GATE_STEP_LABELS = [
  "Email capture",
  "SoundCloud",
  "YouTube",
  "Spotify",
  "Apple Music",
  "Deezer",
  "Twitch",
  "Mixcloud",
  "Facebook",
  "Instagram",
  "X / Twitter",
  "TikTok",
  "Bandcamp",
  "Donation",
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
  file: null,
  artist: "",
  title: "",
  design: "impact-light",
  gateSteps: [],
  linkUrl: "https://downloadgate.com/it71zr",
  facebookPixelId: "",
  conversionApiToken: "",
  includeInNewReleases: false,
  customNotes: "",
};

export default function NewDownloadGate() {
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<NewDownloadGateFormValues>({
    defaultValues,
  });

  const watchedArtist = watch("artist");
  const watchedTitle = watch("title");
  const watchedSourceUrl = watch("sourceUrl");
  const watchedGenre = watch("genre");

  function onSubmit(data: NewDownloadGateFormValues) {
    // TODO: call createDownloadGate API with payload
    const payload = {
      sourceUrl: data.sourceUrl,
      genre: data.genre || undefined,
      artist: data.artist,
      title: data.title,
      design: data.design,
      gateSteps: data.gateSteps,
      linkUrl: data.linkUrl,
      trackingPixels: {
        facebookPixelId: data.facebookPixelId || undefined,
        conversionApiToken: data.conversionApiToken || undefined,
      },
      includeInNewReleases: data.includeInNewReleases,
      customNotes: data.customNotes || undefined,
      // file would be sent as FormData in a real implementation
    };
    console.log("Submit download gate:", payload);
  }

  return (
    <div className="new-download-gate">
      <h1>Create New Download Gate</h1>

      <form
        className="new-download-gate__form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <ToggleMenuItem stepNumber={1} title="Source" completed>
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
            <Button type="button" variant="default">
              Next
            </Button>
            <Button type="button" variant="outline">
              Enter Later
            </Button>
          </div>
        </ToggleMenuItem>

        <ToggleMenuItem stepNumber={2} title="Genre" completed defaultExpanded={false}>
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
            <Button type="button" variant="default">
              Next
            </Button>
          </div>
        </ToggleMenuItem>

        <ToggleMenuItem stepNumber={3} title="Upload">
          <p className="new-download-gate__instruction">
            Upload the audio file you would like to share with fans (mp3, wav,
            aiff, zip).
          </p>
          <Controller
            name="file"
            control={control}
            render={({ field: { onChange, onBlur, ref } }) => (
              <div className="new-download-gate__dropzone">
                <input
                  ref={ref}
                  type="file"
                  accept=".mp3,.wav,.aiff,.zip,audio/mpeg,audio/wav,audio/aiff"
                  className="new-download-gate__file-input"
                  aria-label="Upload audio file"
                  onChange={(e) => onChange(e.target.files)}
                  onBlur={onBlur}
                />
                <span className="new-download-gate__dropzone-icon" aria-hidden>
                  ♪
                </span>
                <p className="new-download-gate__dropzone-text">
                  Drop your audio file here or browse
                </p>
                <p className="new-download-gate__dropzone-hint">
                  Supports mp3, wav
                </p>
              </div>
            )}
          />
          <div className="new-download-gate__actions">
            <Button type="button" variant="default">
              Next
            </Button>
          </div>
        </ToggleMenuItem>

        <ToggleMenuItem stepNumber={4} title="Title" completed defaultExpanded={false}>
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
            <Button type="button" variant="default">
              Next
            </Button>
          </div>
        </ToggleMenuItem>

        <ToggleMenuItem stepNumber={5} title="Design" completed defaultExpanded={false}>
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
            <Button type="button" variant="default">
              Next
            </Button>
          </div>
        </ToggleMenuItem>

        <ToggleMenuItem stepNumber={6} title="Gate steps" defaultExpanded={false}>
          <p className="new-download-gate__instruction">
            Choose how you want fans to support this track.
          </p>
          <Controller
            name="gateSteps"
            control={control}
            render={({ field: { value, onChange } }) => (
              <div className="new-download-gate__gate-steps">
                {GATE_STEP_LABELS.map((label) => {
                  const isSelected = value.includes(label);
                  return (
                    <Button
                      key={label}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      className={cn(
                        "new-download-gate__gate-step",
                        isSelected && "new-download-gate__gate-step--selected"
                      )}
                      onClick={() =>
                        onChange(
                          isSelected
                            ? value.filter((s) => s !== label)
                            : [...value, label]
                        )
                      }
                    >
                      {label} +
                    </Button>
                  );
                })}
              </div>
            )}
          />
          <div className="new-download-gate__actions">
            <Button type="button" variant="default">
              Next
            </Button>
          </div>
        </ToggleMenuItem>

        <ToggleMenuItem stepNumber={7} title="Link URL" completed defaultExpanded={false}>
          <p className="new-download-gate__instruction">
            Customize your link URL. Please note that link URLs for download
            gates are permanent and cannot be changed or edited after the gate
            has been created.
          </p>
          <div className="new-download-gate__link-url">
            <Input
              type="text"
              className="new-download-gate__link-url-input"
              aria-label="Link URL"
              {...register("linkUrl")}
            />
            <Button type="button" variant="outline" size="sm">
              Edit
            </Button>
          </div>
          <div className="new-download-gate__actions">
            <Button type="button" variant="default">
              Next
            </Button>
          </div>
        </ToggleMenuItem>

        <ToggleMenuItem stepNumber={8} title="Tracking pixels" defaultExpanded={false}>
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
            <Button type="button" variant="default">
              Next
            </Button>
          </div>
        </ToggleMenuItem>

        <ToggleMenuItem stepNumber={9} title="Confirmation" defaultExpanded={false}>
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
            <div className="new-download-gate__field new-download-gate__field--row">
              <Controller
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
              />
            </div>
            <div className="new-download-gate__field">
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
            </div>
          </div>
          <div className="new-download-gate__actions">
            <Button type="submit" variant="default">
              Create
            </Button>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </div>
        </ToggleMenuItem>
      </form>
    </div>
  );
}
