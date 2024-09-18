// src/components/Clientes.js
import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { Link } from 'react-router-dom';

function Clientes() {
  const [nombre, setNombre] = useState('');
  const [tipoCliente, setTipoCliente] = useState('Profesional');
  const [clientes, setClientes] = useState([]);

  // Función para agregar un nuevo cliente
  const agregarCliente = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'clientes'), {
        nombre,
        tipoCliente,
      });
      setNombre('');
      obtenerClientes();
    } catch (e) {
      console.error('Error al agregar cliente: ', e);
    }
  };

  // Función para obtener los clientes de Firestore
  const obtenerClientes = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'clientes'));
      const docs = [];
      querySnapshot.forEach((doc) => {
        docs.push({ id: doc.id, ...doc.data() });
      });
      setClientes(docs);
    } catch (e) {
      console.error('Error al obtener clientes: ', e);
    }
  };

  // Función para eliminar un cliente
  const eliminarCliente = async (id) => {
    try {
      await deleteDoc(doc(db, 'clientes', id));
      obtenerClientes();
    } catch (e) {
      console.error('Error al eliminar cliente: ', e);
    }
  };

  useEffect(() => {
    obtenerClientes();
  }, []);

  return (
    <div>
      <h1>Gestión de Clientes</h1>
      <form onSubmit={agregarCliente}>
        <input
          type="text"
          placeholder="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
        <select value={tipoCliente} onChange={(e) => setTipoCliente(e.target.value)}>
          <option value="Profesional">Profesional</option>
          <option value="Cliente del Centro">Cliente del Centro</option>
        </select>
        <button type="submit">Agregar Cliente</button>
      </form>
      <h2>Lista de Clientes</h2>
      <ul>
        {clientes.map((cliente) => (
          <li key={cliente.id}>
            <Link to={`/cliente/${cliente.id}`}>{cliente.nombre}</Link> - {cliente.tipoCliente}
            <button onClick={() => eliminarCliente(cliente.id)}>Eliminar</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Clientes;