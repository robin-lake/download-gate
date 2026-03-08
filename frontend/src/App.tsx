import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header/Header';
import Dashboard from './pages/Dashboard/Dashboard';
import NewDownloadGate from './pages/NewDownloadGate/NewDownloadGate';
import Users from './pages/Users';
import DownloadGate from './pages/DownloadGate';
import OAuthSoundCloudSuccess from './pages/OAuthSoundCloudSuccess';
import OAuthSpotifySuccess from './pages/OAuthSpotifySuccess';
import OAuthInstagramSuccess from './pages/OAuthInstagramSuccess';
import Me from './pages/Me';
import SignUp from './pages/SignUp';
import SignIn from './pages/SignIn';
import './App.scss'

function App() {
  return (
    <BrowserRouter>
      <Header />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<div className="app-home">Welcome to Download Gate</div>} />
          <Route path="/download-gates" element={<DownloadGate />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/new-download-gate" element={<NewDownloadGate />} />
          <Route path="/login" element={<div className="app-page"><SignIn /></div>} />
          <Route path="/signup" element={<div className="app-page"><SignUp /></div>} />
          <Route path="/users" element={<div className="app-page"><Users /></div>} />
          <Route path="/me" element={<div className="app-page"><Me /></div>} />
          <Route path="/oauth/soundcloud/success" element={<OAuthSoundCloudSuccess />} />
          <Route path="/oauth/spotify/success" element={<OAuthSpotifySuccess />} />
          <Route path="/oauth/instagram/success" element={<OAuthInstagramSuccess />} />
          {/* Short URL for a single download gate (e.g. /abc123). Must be last so other paths match first. */}
          <Route path="/:gateIdOrSlug" element={<DownloadGate />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App
