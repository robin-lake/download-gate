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
    </div>
  )
}
