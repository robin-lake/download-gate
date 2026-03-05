import ToggleMenuItem from "./ToggleMenuItem"
import './NewDownloadGate.scss';

export default function NewDownloadGate() {
  return (
    <div className="new-download-gate">
      <h1>Create New Download Gate</h1>

      <ToggleMenuItem stepNumber={1} title="Source" completed>
        <p className="new-download-gate__instruction">Enter source/track URL for your title</p>
        <div className="new-download-gate__icons">
          {/* Platform icons placeholder - SoundCloud, YouTube, Spotify, etc. */}
        </div>
        <input
          type="url"
          className="new-download-gate__input"
          placeholder="https://www..."
          aria-label="Source URL"
        />
        <div className="new-download-gate__actions">
          <button type="button" className="new-download-gate__btn new-download-gate__btn--primary">
            Next
          </button>
          <button type="button" className="new-download-gate__btn new-download-gate__btn--secondary">
            Enter Later
          </button>
        </div>
      </ToggleMenuItem>

      <ToggleMenuItem stepNumber={2} title="Genre" completed defaultExpanded={false}>
        <p className="new-download-gate__instruction">Select genre of your title.</p>
        <div className="new-download-gate__select-wrapper">
          <select className="new-download-gate__select" aria-label="Genre">
            <option value="">Select genre</option>
          </select>
        </div>
        <div className="new-download-gate__actions">
          <button type="button" className="new-download-gate__btn new-download-gate__btn--primary">
            Next
          </button>
        </div>
      </ToggleMenuItem>

      <ToggleMenuItem stepNumber={3} title="Upload">
        <p className="new-download-gate__instruction">
          Upload the audio file you would like to share with fans (mp3, wav, aiff, zip).
        </p>
        <div className="new-download-gate__dropzone">
          <span className="new-download-gate__dropzone-icon" aria-hidden>♪</span>
          <p className="new-download-gate__dropzone-text">Drop your audio file here or browse</p>
          <p className="new-download-gate__dropzone-hint">Supports mp3, wav</p>
        </div>
        <div className="new-download-gate__actions">
          <button type="button" className="new-download-gate__btn new-download-gate__btn--primary">
            Next
          </button>
        </div>
      </ToggleMenuItem>

      <ToggleMenuItem stepNumber={4} title="Title" completed defaultExpanded={false}>
        <p className="new-download-gate__instruction">Enter artist and title for your release.</p>
        <div className="new-download-gate__field">
          <label htmlFor="artist-name">Enter artist name</label>
          <input
            id="artist-name"
            type="text"
            className="new-download-gate__input"
            placeholder="Artist name"
            aria-label="Artist name"
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
          />
        </div>
        <div className="new-download-gate__actions">
          <button type="button" className="new-download-gate__btn new-download-gate__btn--primary">
            Next
          </button>
        </div>
      </ToggleMenuItem>

      <ToggleMenuItem stepNumber={5} title="Design" completed defaultExpanded={false}>
        <p className="new-download-gate__instruction">Customize design</p>
        <div className="new-download-gate__select-wrapper">
          <select className="new-download-gate__select" aria-label="Design theme">
            <option value="impact-light">Impact - Light</option>
            <option value="impact-dark">Impact - Dark</option>
            <option value="minimal-light">Minimal - Light</option>
            <option value="minimal-dark">Minimal - Dark</option>
          </select>
        </div>
        <div className="new-download-gate__actions">
          <button type="button" className="new-download-gate__btn new-download-gate__btn--primary">
            Next
          </button>
        </div>
      </ToggleMenuItem>

      <ToggleMenuItem stepNumber={6} title="Gate steps" defaultExpanded={false}>
        <p className="new-download-gate__instruction">Choose how you want fans to support this track.</p>
        <div className="new-download-gate__gate-steps">
          {[
            'Email capture',
            'SoundCloud',
            'YouTube',
            'Spotify',
            'Apple Music',
            'Deezer',
            'Twitch',
            'Mixcloud',
            'Facebook',
            'Instagram',
            'X / Twitter',
            'TikTok',
            'Bandcamp',
            'Donation',
          ].map((label) => (
            <button key={label} type="button" className="new-download-gate__gate-step">
              {label} +
            </button>
          ))}
        </div>
        <div className="new-download-gate__actions">
          <button type="button" className="new-download-gate__btn new-download-gate__btn--primary">
            Next
          </button>
        </div>
      </ToggleMenuItem>

      <ToggleMenuItem stepNumber={7} title="Link URL" completed defaultExpanded={false}>
        <p className="new-download-gate__instruction">
          Customize your link URL. Please note that link URLs for download gates are permanent and cannot be changed or edited after the gate has been created.
        </p>
        <div className="new-download-gate__link-url">
          <span className="new-download-gate__link-url-text">https://hypeddit.com/it71zr</span>
          <button type="button" className="new-download-gate__link-url-edit" aria-label="Edit URL">
            {/* Pencil icon placeholder */}
            Edit
          </button>
        </div>
        <div className="new-download-gate__actions">
          <button type="button" className="new-download-gate__btn new-download-gate__btn--primary">
            Next
          </button>
        </div>
      </ToggleMenuItem>

      <ToggleMenuItem stepNumber={8} title="Tracking pixels" defaultExpanded={false}>
        <p className="new-download-gate__instruction">
          Enter pixels for tracking and retargeting fans that visit your download gate.
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
            />
          </div>
          <div className="new-download-gate__field">
            <label htmlFor="conversion-api-token">Conversion API access token (optional)</label>
            <input
              id="conversion-api-token"
              type="text"
              className="new-download-gate__input"
              placeholder="Enter Conversion API access token"
              aria-label="Conversion API access token"
            />
          </div>
        </div>
        <div className="new-download-gate__actions">
          <button type="button" className="new-download-gate__btn new-download-gate__btn--primary">
            Next
          </button>
        </div>
      </ToggleMenuItem>

      <ToggleMenuItem stepNumber={9} title="Confirmation" defaultExpanded={false}>
        <p className="new-download-gate__instruction">Review and create your download gate.</p>
        <div className="new-download-gate__confirmation-fields">
          <div className="new-download-gate__field">
            <label htmlFor="conf-artist">Artist:</label>
            <input id="conf-artist" type="text" className="new-download-gate__input" aria-label="Artist" />
          </div>
          <div className="new-download-gate__field">
            <label htmlFor="conf-title">Title:</label>
            <input id="conf-title" type="text" className="new-download-gate__input" aria-label="Title" />
          </div>
          <div className="new-download-gate__field">
            <label htmlFor="conf-source">Source:</label>
            <input id="conf-source" type="text" className="new-download-gate__input" aria-label="Source" />
          </div>
          <div className="new-download-gate__field">
            <label htmlFor="conf-genre">Genre:</label>
            <input id="conf-genre" type="text" className="new-download-gate__input" aria-label="Genre" />
          </div>
          <div className="new-download-gate__field new-download-gate__field--row">
            <label htmlFor="conf-new-releases">Include in New Releases:</label>
            <input id="conf-new-releases" type="checkbox" className="new-download-gate__checkbox" aria-label="Include in New Releases" />
          </div>
          <div className="new-download-gate__field">
            <label htmlFor="conf-notes">Custom Notes:</label>
            <button type="button" className="new-download-gate__link-url-edit">Edit</button>
            <textarea id="conf-notes" className="new-download-gate__input new-download-gate__textarea" rows={3} aria-label="Custom Notes" />
          </div>
        </div>
        <div className="new-download-gate__actions">
          <button type="button" className="new-download-gate__btn new-download-gate__btn--primary">
            Create
          </button>
          <button type="button" className="new-download-gate__btn new-download-gate__btn--secondary">
            Cancel
          </button>
        </div>
      </ToggleMenuItem>
    </div>
  )
}
