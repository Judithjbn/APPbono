import './index.css'; // O el nombre de tu archivo CSS principal

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './components/Home';
import Clientes from './components/Clientes';
import Bonos from './components/Bonos';
import ClienteDetalle from './components/ClienteDetalle';

function App() {
  return (
    <Router>
      <nav>
        <ul>
          <li><Link to="/">Inicio</Link></li>
          <li><Link to="/clientes">Clientes</Link></li>
          <li><Link to="/bonos">Bonos</Link></li>
        </ul>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/bonos" element={<Bonos />} />
        <Route path="/cliente/:id" element={<ClienteDetalle />} />
      </Routes>
    </Router>
  );
}

export default App;