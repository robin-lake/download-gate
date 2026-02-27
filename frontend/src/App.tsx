import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Users from './pages/Users';
import SignUp from './pages/SignUp';
import './App.scss'

function App() {
  return (
    <BrowserRouter>
      <Header />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<div className="app-home">Welcome to Download Gate</div>} />
          <Route path="/login" element={<div className="app-page">Log in</div>} />
          <Route path="/signup" element={<div className="app-page"><SignUp /></div>} />
          <Route path="/users" element={<div className="app-page"><Users /></div>} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App
