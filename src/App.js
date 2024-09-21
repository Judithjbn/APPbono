import './index.css'; // O el nombre de tu archivo CSS principal
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './components/Home';
import Clientes from './components/Clientes';
import Bonos from './components/Bonos';
import ClienteDetalle from './components/ClienteDetalle';
import { Home as HomeIcon, Users, Ticket } from 'lucide-react'; // Importamos los íconos

const navigation = [
  { name: 'Inicio', href: '/', icon: HomeIcon },
  { name: 'Clientes', href: '/clientes', icon: Users },
  { name: 'Bonos', href: '/bonos', icon: Ticket },
];

function Navigation() {
  const location = useLocation(); 

  return (
    <nav className="bg-white shadow-md">
      <div className="flex justify-between items-center h-16 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <img
          src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600"
          alt="logo"
          className="h-8 mr-4"
        />
        <ul className="flex ml-6 space-x-8">
          {navigation.map((item) => (
            <li key={item.name}>
              <Link
                to={item.href}
                className={`flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  location.pathname === item.href
                    ? 'border-indigo-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <item.icon className="mr-2 h-5 w-5" />
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <Navigation />
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