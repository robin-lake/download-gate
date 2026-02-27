import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import './App.scss'

function App() {
  return (
    <BrowserRouter>
      <Header />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<div className="app-home">Welcome to Download Gate</div>} />
          <Route path="/login" element={<div className="app-page">Log in</div>} />
          <Route path="/signup" element={<div className="app-page">Sign up</div>} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App
