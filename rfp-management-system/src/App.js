// src/App.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
// Import other pages as needed

// Main layout component if you have one
import MainLayout from './components/layout/MainLayout';

const App = () => {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/documents/:id" element={<div>Document Detail Page</div>} />
        {/* Add your other routes here */}
      </Routes>
    </MainLayout>
  );
};

export default App;