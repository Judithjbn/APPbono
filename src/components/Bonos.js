import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react'; // icono papelera

function Bonos() {
  const [clientes, setClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState('');
  const [tipoBono, setTipoBono] = useState('Alquiler de espacio');
  const [numeroSesiones, setNumeroSesiones] = useState(1);
  const [estadoPago, setEstadoPago] = useState('Pendiente');
  const [bonos, setBonos] = useState([]);

  const agregarBono = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'bonos'), {
        clienteId: clienteSeleccionado,
        tipoBono,
        numeroSesiones,
        sesionesRestantes: numeroSesiones,
        estadoPago,
        fechaCreacion: new Date(),
      });

      // reiniciar el formulario
      setTipoBono('Alquiler de espacio');
      setNumeroSesiones(1);
      setEstadoPago('Pendiente');
      alert('Bono agregado correctamente');
      obtenerBonos();
    } catch (e) {
      console.error('Error al agregar bono: ', e);
    }
  };

  // obtener los clientes desde Firestore
  useEffect(() => {
    const obtenerClientes = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'clientes'));
        const listaClientes = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setClientes(listaClientes);
        if (listaClientes.length > 0) {
          setClienteSeleccionado(listaClientes[0].id);
        }
      } catch (e) {
        console.error('Error al obtener clientes: ', e);
      }
    };

    obtenerClientes();
    obtenerBonos();
  }, []);

  const obtenerBonos = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'bonos'));
      const listaBonos = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setBonos(listaBonos);
    } catch (e) {
      console.error('Error al obtener bonos: ', e);
    }
  };

  const eliminarBono = async (id) => {
    try {
      await deleteDoc(doc(db, 'bonos', id));
      obtenerBonos();
    } catch (e) {
      console.error('Error al eliminar bono: ', e);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-4">Gestión de Bonos</h1>

      {/* Form para agregar bonos */}
      <form onSubmit={agregarBono} className="space-y-4 mb-8">
        <div>
          <label className="block font-medium text-gray-700">Cliente:</label>
          <select
            value={clienteSeleccionado}
            onChange={(e) => setClienteSeleccionado(e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
          >
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nombre} - {cliente.tipoCliente}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-medium text-gray-700">Tipo de Bono:</label>
          <select
            value={tipoBono}
            onChange={(e) => setTipoBono(e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
          >
            <option value="Alquiler de espacio">Alquiler de espacio</option>
            <option value="Bono de sesiones">Bono de sesiones</option>
          </select>
        </div>

        <div>
          <label className="block font-medium text-gray-700">Número de Sesiones u Horas:</label>
          <input
            type="number"
            value={numeroSesiones}
            onChange={(e) => setNumeroSesiones(e.target.value)}
            min="1"
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
          />
        </div>

        <div>
          <label className="block font-medium text-gray-700">Estado de Pago:</label>
          <select
            value={estadoPago}
            onChange={(e) => setEstadoPago(e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
          >
            <option value="Pendiente">Pendiente</option>
            <option value="Pagado">Pagado</option>
          </select>
        </div>

        <button
          type="submit"
          className="bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-600"
        >
          Agregar Bono
        </button>
      </form>

      <h2 className="text-xl font-semibold mb-4">Lista de Bonos</h2>

      {/* Tabla de bonos */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-md">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo de Bono</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sesiones/Horas</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado de Pago</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {bonos.map((bono) => {
              const cliente = clientes.find((c) => c.id === bono.clienteId);
              return (
                <tr key={bono.id} className="border-b">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {cliente ? (
                      <Link to={`/cliente/${cliente.id}`} className="text-indigo-600 hover:underline">
                        {cliente.nombre}
                      </Link>
                    ) : (
                      'Cliente no encontrado'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{bono.tipoBono}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{bono.numeroSesiones}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        bono.estadoPago === 'Pagado'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {bono.estadoPago}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => eliminarBono(bono.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="inline-block h-5 w-5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Bonos;