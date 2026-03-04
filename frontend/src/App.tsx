import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Dashboard from './pages/Dashboard/Dashboard';
import NewDownloadGate from './pages/NewDownloadGate/NewDownloadGate';
import Users from './pages/Users';
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
          <Route path="/" element={<div className="app-home">Welcome to Download Gate test</div>} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/new-download-gate" element={<NewDownloadGate />} />
          <Route path="/login" element={<div className="app-page"><SignIn /></div>} />
          <Route path="/signup" element={<div className="app-page"><SignUp /></div>} />
          <Route path="/users" element={<div className="app-page"><Users /></div>} />
          <Route path="/me" element={<div className="app-page"><Me /></div>} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App
