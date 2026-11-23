import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import InventarioPage from './pages/InventarioPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/inventario" replace />} />
        <Route path="/inventario" element={<InventarioPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;