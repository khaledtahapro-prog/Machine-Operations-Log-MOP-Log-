import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import DataEntry from './pages/DataEntry';
import TrialsDashboard from './pages/TrialsDashboard';

function App() {
  return (
    <Router>
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        <Navbar />
        <Routes>
          <Route path="/" element={<DataEntry />} />
          <Route path="/dashboard" element={<TrialsDashboard />} />
          <Route path="/formulations" element={<DataEntry />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;