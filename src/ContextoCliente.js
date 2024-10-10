import React, { createContext, useState } from 'react';


export const ContextoCliente = createContext();

export const ProveedorCliente = ({ children }) => {
  const [clienteSeleccionado, setClienteSeleccionado] = useState('');

  return (
    <ContextoCliente.Provider value={{ clienteSeleccionado, setClienteSeleccionado }}>
      {children}
    </ContextoCliente.Provider>
  );
};