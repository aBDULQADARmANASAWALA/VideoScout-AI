import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import VideoUpload from './components/VideoUpload';
import VideoList from './components/VideoList';
import VideoDetails from './components/VideoDetails';
import './App.css';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <Router>
      <div className="container">
        <header className="header">
          <h1 className="title">VideoScout AI</h1>
          <p className="subtitle">Upload, Transcribe, and Evaluate Video Content at Scale</p>
        </header>

        <main>
          <Routes>
            <Route path="/" element={
              <>
                <VideoUpload onUploadSuccess={handleUploadSuccess} />
                <VideoList refreshTrigger={refreshTrigger} />
              </>
            } />
            <Route path="/video/:id" element={<VideoDetails />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
