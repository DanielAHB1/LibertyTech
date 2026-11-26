
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import InventarioPage from './pages/InventarioPage';
import POSPage from './pages/POSPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/inventario" replace />} />
        <Route path="/inventario" element={<InventarioPage />} />
        <Route path="/pos" element={<POSPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
