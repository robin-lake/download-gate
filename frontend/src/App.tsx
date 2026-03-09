import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import Home from './pages/Home/Home';
import Dashboard from './pages/Dashboard/Dashboard';
import NewDownloadGate from './pages/NewDownloadGate/NewDownloadGate';
import NewSmartLink from './pages/NewSmartLink/NewSmartLink';
// import Users from './pages/Users';
import DownloadGate from './pages/DownloadGate/DownloadGate';
import SmartLink from './pages/SmartLink/SmartLink';
import OAuthSoundCloudSuccess from './pages/OAuthSoundCloudSuccess';
import OAuthSpotifySuccess from './pages/OAuthSpotifySuccess';
import OAuthInstagramSuccess from './pages/OAuthInstagramSuccess';
import Me from './pages/Me';
import SignUp from './pages/SignUp';
import SignIn from './pages/SignIn';
import './App.scss'

const NON_LANDING_PAGES = ['dashboard', 'new-download-gate', 'login', 'signup', 'me', 'oauth'];

function useIsLandingPage(): boolean {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);
  return segments.length === 1 && !NON_LANDING_PAGES.includes(segments[0]);
}

function AppContent() {
  const showFooter = !useIsLandingPage();
  const showHeader = !useIsLandingPage();

  return (
    <>
     {showHeader && <Header />}
      <main className="app-main app-main--flex">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/new-download-gate" element={<NewDownloadGate />} />
          <Route path="/new-smart-link" element={<NewSmartLink />} />
          <Route path="/login" element={<div className="app-page"><SignIn /></div>} />
          <Route path="/signup" element={<div className="app-page"><SignUp /></div>} />
          <Route path="/me" element={<div className="app-page"><Me /></div>} />
          <Route path="/oauth/soundcloud/success" element={<OAuthSoundCloudSuccess />} />
          <Route path="/oauth/spotify/success" element={<OAuthSpotifySuccess />} />
          <Route path="/oauth/instagram/success" element={<OAuthInstagramSuccess />} />
          {/* admin routes */}
          {/* <Route path="/admin/users" element={<div className="app-page"><Users /></div>} /> */}
          {/* Short URL for a single download gate (e.g. /abc123). Must be last so other paths match first. */}
          <Route path="/:gateIdOrSlug" element={<DownloadGate />} />
          <Route path="/link/:gateIdOrSlug" element={<SmartLink />} />
        </Routes>
      </main>
      {showFooter && <Footer />}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App
