import { useParams } from 'react-router-dom';
import { useGetDownloadGateById } from '../network/downloadGates/getDownloadGateById';

export default function DownloadGate() {
  const { gateIdOrSlug } = useParams<{ gateIdOrSlug: string }>();
  const { data: gate, error, isLoading } = useGetDownloadGateById({
    gateId: gateIdOrSlug,
    enabled: Boolean(gateIdOrSlug),
  });

  if (gateIdOrSlug === undefined) {
    return (
      <div className="app-page">
        <p>View a download gate by visiting a short link (e.g. /your-gate-id).</p>
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

  if (error || !gate) {
    return (
      <div className="app-page">
        <h1>Download gate not found</h1>
        <p>This link may be invalid or the gate may have been removed.</p>
      </div>
    );
  }

  return (
    <div className="app-page download-gate-view">
      <header className="download-gate-header">
        <h1>{gate.title}</h1>
        <p className="download-gate-artist">{gate.artist_name}</p>
      </header>
      {gate.thumbnail_url && (
        <img
          src={gate.thumbnail_url}
          alt=""
          className="download-gate-thumbnail"
        />
      )}
      <p className="download-gate-meta">
        Visits: {gate.visits} · Downloads: {gate.downloads}
      </p>
      {/* TODO: gate steps (e.g. follow on SoundCloud), then unlock download */}
    </div>
  );
}
