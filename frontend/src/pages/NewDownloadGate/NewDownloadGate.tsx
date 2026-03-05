import { useForm, Controller } from "react-hook-form";
import ToggleMenuItem from "../../components/ToggleMenuItem/ToggleMenuItem";
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
          <input
            type="url"
            className="new-download-gate__input"
            placeholder="https://www..."
            aria-label="Source URL"
            {...register("sourceUrl")}
          />
          {errors.sourceUrl && (
            <p className="new-download-gate__error">{errors.sourceUrl.message}</p>
          )}
          <div className="new-download-gate__actions">
            <button
              type="button"
              className="new-download-gate__btn new-download-gate__btn--primary"
            >
              Next
            </button>
            <button
              type="button"
              className="new-download-gate__btn new-download-gate__btn--secondary"
            >
              Enter Later
            </button>
          </div>
        </ToggleMenuItem>

        <ToggleMenuItem stepNumber={2} title="Genre" completed defaultExpanded={false}>
          <p className="new-download-gate__instruction">
            Select genre of your title.
          </p>
          <div className="new-download-gate__select-wrapper">
            <select
              className="new-download-gate__select"
              aria-label="Genre"
              {...register("genre")}
            >
              <option value="">Select genre</option>
            </select>
          </div>
          <div className="new-download-gate__actions">
            <button
              type="button"
              className="new-download-gate__btn new-download-gate__btn--primary"
            >
              Next
            </button>
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
            <button
              type="button"
              className="new-download-gate__btn new-download-gate__btn--primary"
            >
              Next
            </button>
          </div>
        </ToggleMenuItem>

        <ToggleMenuItem stepNumber={4} title="Title" completed defaultExpanded={false}>
          <p className="new-download-gate__instruction">
            Enter artist and title for your release.
          </p>
          <div className="new-download-gate__field">
            <label htmlFor="artist-name">Enter artist name</label>
            <input
              id="artist-name"
              type="text"
              className="new-download-gate__input"
              placeholder="Artist name"
              aria-label="Artist name"
              {...register("artist")}
            />
          </div>
          <div className="new-download-gate__field">
            <label htmlFor="title">Enter title</label>
            <input
              id="title"
              type="text"
              className="new-download-gate__input"
              placeholder="Title"
              aria-label="Title"
              {...register("title")}
            />
          </div>
          <div className="new-download-gate__actions">
            <button
              type="button"
              className="new-download-gate__btn new-download-gate__btn--primary"
            >
              Next
            </button>
          </div>
        </ToggleMenuItem>

        <ToggleMenuItem stepNumber={5} title="Design" completed defaultExpanded={false}>
          <p className="new-download-gate__instruction">Customize design</p>
          <div className="new-download-gate__select-wrapper">
            <select
              className="new-download-gate__select"
              aria-label="Design theme"
              {...register("design")}
            >
              {DESIGN_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="new-download-gate__actions">
            <button
              type="button"
              className="new-download-gate__btn new-download-gate__btn--primary"
            >
              Next
            </button>
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
                    <button
                      key={label}
                      type="button"
                      className={`new-download-gate__gate-step ${isSelected ? "new-download-gate__gate-step--selected" : ""}`}
                      onClick={() =>
                        onChange(
                          isSelected
                            ? value.filter((s) => s !== label)
                            : [...value, label]
                        )
                      }
                    >
                      {label} +
                    </button>
                  );
                })}
              </div>
            )}
          />
          <div className="new-download-gate__actions">
            <button
              type="button"
              className="new-download-gate__btn new-download-gate__btn--primary"
            >
              Next
            </button>
          </div>
        </ToggleMenuItem>

        <ToggleMenuItem stepNumber={7} title="Link URL" completed defaultExpanded={false}>
          <p className="new-download-gate__instruction">
            Customize your link URL. Please note that link URLs for download
            gates are permanent and cannot be changed or edited after the gate
            has been created.
          </p>
          <div className="new-download-gate__link-url">
            <input
              type="text"
              className="new-download-gate__link-url-input"
              aria-label="Link URL"
              {...register("linkUrl")}
            />
            <button
              type="button"
              className="new-download-gate__link-url-edit"
              aria-label="Edit URL"
              onClick={() => {}}
            >
              Edit
            </button>
          </div>
          <div className="new-download-gate__actions">
            <button
              type="button"
              className="new-download-gate__btn new-download-gate__btn--primary"
            >
              Next
            </button>
          </div>
        </ToggleMenuItem>

        <ToggleMenuItem stepNumber={8} title="Tracking pixels" defaultExpanded={false}>
          <p className="new-download-gate__instruction">
            Enter pixels for tracking and retargeting fans that visit your
            download gate.
          </p>
          <div className="new-download-gate__tracking-card">
            <div className="new-download-gate__tracking-header">
              <span>Facebook</span>
            </div>
            <div className="new-download-gate__field">
              <label htmlFor="facebook-pixel-id">Facebook Pixel ID</label>
              <input
                id="facebook-pixel-id"
                type="text"
                className="new-download-gate__input"
                placeholder="Enter Facebook Pixel ID"
                aria-label="Facebook Pixel ID"
                {...register("facebookPixelId")}
              />
            </div>
            <div className="new-download-gate__field">
              <label htmlFor="conversion-api-token">
                Conversion API access token (optional)
              </label>
              <input
                id="conversion-api-token"
                type="text"
                className="new-download-gate__input"
                placeholder="Enter Conversion API access token"
                aria-label="Conversion API access token"
                {...register("conversionApiToken")}
              />
            </div>
          </div>
          <div className="new-download-gate__actions">
            <button
              type="button"
              className="new-download-gate__btn new-download-gate__btn--primary"
            >
              Next
            </button>
          </div>
        </ToggleMenuItem>

        <ToggleMenuItem stepNumber={9} title="Confirmation" defaultExpanded={false}>
          <p className="new-download-gate__instruction">
            Review and create your download gate.
          </p>
          <div className="new-download-gate__confirmation-fields">
            <div className="new-download-gate__field">
              <label htmlFor="conf-artist">Artist:</label>
              <input
                id="conf-artist"
                type="text"
                className="new-download-gate__input"
                aria-label="Artist"
                readOnly
                value={watchedArtist}
              />
            </div>
            <div className="new-download-gate__field">
              <label htmlFor="conf-title">Title:</label>
              <input
                id="conf-title"
                type="text"
                className="new-download-gate__input"
                aria-label="Title"
                readOnly
                value={watchedTitle}
              />
            </div>
            <div className="new-download-gate__field">
              <label htmlFor="conf-source">Source:</label>
              <input
                id="conf-source"
                type="text"
                className="new-download-gate__input"
                aria-label="Source"
                readOnly
                value={watchedSourceUrl}
              />
            </div>
            <div className="new-download-gate__field">
              <label htmlFor="conf-genre">Genre:</label>
              <input
                id="conf-genre"
                type="text"
                className="new-download-gate__input"
                aria-label="Genre"
                readOnly
                value={watchedGenre}
              />
            </div>
            <div className="new-download-gate__field new-download-gate__field--row">
              <label htmlFor="conf-new-releases">
                Include in New Releases:
              </label>
              <input
                id="conf-new-releases"
                type="checkbox"
                className="new-download-gate__checkbox"
                aria-label="Include in New Releases"
                {...register("includeInNewReleases")}
              />
            </div>
            <div className="new-download-gate__field">
              <label htmlFor="conf-notes">Custom Notes:</label>
              <button type="button" className="new-download-gate__link-url-edit">
                Edit
              </button>
              <textarea
                id="conf-notes"
                className="new-download-gate__input new-download-gate__textarea"
                rows={3}
                aria-label="Custom Notes"
                {...register("customNotes")}
              />
            </div>
          </div>
          <div className="new-download-gate__actions">
            <button
              type="submit"
              className="new-download-gate__btn new-download-gate__btn--primary"
            >
              Create
            </button>
            <button
              type="button"
              className="new-download-gate__btn new-download-gate__btn--secondary"
            >
              Cancel
            </button>
          </div>
        </ToggleMenuItem>
      </form>
    </div>
  );
}
