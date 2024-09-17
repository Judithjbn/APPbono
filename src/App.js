// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import Clientes from './components/Clientes';
import Bonos from './components/Bonos';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/bonos" element={<Bonos />} />
      </Routes>
    </Router>
  );
}

export default App;