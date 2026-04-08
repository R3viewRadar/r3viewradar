import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import SearchPage from './pages/SearchPage';
import ResultsPage from './pages/ResultsPage';
import HowItWorksPage from './pages/HowItWorksPage';

export default function App() {
  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<SearchPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
