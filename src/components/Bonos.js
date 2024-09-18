import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';

function Bonos() {
  const [clientes, setClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState('');
  const [tipoBono, setTipoBono] = useState('Alquiler de espacio');
  const [numeroSesiones, setNumeroSesiones] = useState(1);
  const [estadoPago, setEstadoPago] = useState('Pendiente');
  const [bonos, setBonos] = useState([]); // estado para almacenar los bonos

  //función para agregar un nuevo bono
  const agregarBono = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'bonos'), {
        clienteId: clienteSeleccionado,
        tipoBono,
        numeroSesiones,
        sesionesRestantes: numeroSesiones, // Añade este campo
        estadoPago,
        fechaCreacion: new Date(),
      });

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
      obtenerBonos(); // actualizamos la lista de bonos
    } catch (e) {
      console.error('Error al eliminar bono: ', e);
    }
  };

  return (
    <div>
      <h1>Gestión de Bonos</h1>
      {/* Formulario para agregar bonos */}
      <form onSubmit={agregarBono}>
        <label>
          Cliente:
          <select
            value={clienteSeleccionado}
            onChange={(e) => setClienteSeleccionado(e.target.value)}
          >
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nombre} - {cliente.tipoCliente}
              </option>
            ))}
          </select>
        </label>
        <br />
        <label>
          Tipo de Bono:
          <select
            value={tipoBono}
            onChange={(e) => setTipoBono(e.target.value)}
          >
            <option value="Alquiler de espacio">Alquiler de espacio</option>
            <option value="Bono de sesiones">Bono de sesiones</option>
          </select>
        </label>
        <br />
        <label>
          Número de sesiones u horas:
          <input
            type="number"
            value={numeroSesiones}
            onChange={(e) => setNumeroSesiones(e.target.value)}
            min="1"
          />
        </label>
        <br />
        <label>
          Estado de pago:
          <select
            value={estadoPago}
            onChange={(e) => setEstadoPago(e.target.value)}
          >
            <option value="Pendiente">Pendiente</option>
            <option value="Pagado">Pagado</option>
          </select>
        </label>
        <br />
        <button type="submit">Agregar Bono</button>
      </form>

      {/* Mostrar la lista de bonos */}
      <h2>Lista de Bonos</h2>
      <table>
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Tipo de Bono</th>
            <th>Número de Sesiones/Horas</th>
            <th>Estado de Pago</th>
            <th>Acciones</th> {/* Nueva columna */}
          </tr>
        </thead>
        <tbody>
          {bonos.map((bono) => {
            // Obtener el nombre del cliente asociado
            const cliente = clientes.find((c) => c.id === bono.clienteId);
            return (
              <tr key={bono.id}>
                <td>{cliente ? cliente.nombre : "Cliente no encontrado"}</td>
                <td>{bono.tipoBono}</td>
                <td>{bono.numeroSesiones}</td>
                <td
                  style={{
                    color: bono.estadoPago === "Pagado" ? "green" : "red",
                  }}
                >
                  {bono.estadoPago}
                </td>
                <td>
                  <button onClick={() => eliminarBono(bono.id)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default Bonos;