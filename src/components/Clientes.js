import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react'; // icono papepera

function Clientes() {
  const [nombre, setNombre] = useState('');
  const [tipoCliente, setTipoCliente] = useState('Profesional');
  const [clientes, setClientes] = useState([]);

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

  // obtener los clientes de Firestore
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
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-4">Gestión de Clientes</h1>

      {/* Form agregar cliente */}
      <form onSubmit={agregarCliente} className="space-y-4 mb-8">
        <div>
          <label className="block font-medium text-gray-700">Nombre del Cliente:</label>
          <input
            type="text"
            placeholder="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
          />
        </div>

        <div>
          <label className="block font-medium text-gray-700">Tipo de Cliente:</label>
          <select
            value={tipoCliente}
            onChange={(e) => setTipoCliente(e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
          >
            <option value="Profesional">Profesional</option>
            <option value="Cliente del Centro">Cliente del Centro</option>
          </select>
        </div>

        <button
          type="submit"
          className="bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-600"
        >
          Agregar Cliente
        </button>
      </form>

      <h2 className="text-xl font-semibold mb-4">Lista de Clientes</h2>

      {/* Lista de clientes */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-md">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo de Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((cliente) => (
              <tr key={cliente.id} className="border-b">
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link to={`/cliente/${cliente.id}`} className="text-indigo-600 hover:underline">
                    {cliente.nombre}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{cliente.tipoCliente}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => eliminarCliente(cliente.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="inline-block h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Clientes;