import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  addDoc,
  Timestamp,
} from 'firebase/firestore';
import Asistencias from './Asistencias';
import Nota from './Nota';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { ContextoCliente } from '../ContextoCliente'; 

function ClienteDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setClienteSeleccionado } = useContext(ContextoCliente);
  const [cliente, setCliente] = useState(null);
  const [bonos, setBonos] = useState([]);
  const [bonosDesplegados, setBonosDesplegados] = useState({});
  const [reservasCliente, setReservasCliente] = useState([]);
  const [espacios, setEspacios] = useState([]);

  const obtenerClienteYBonos = useCallback(async () => {
    try {
      const clienteRef = doc(db, 'clientes', id);
      const clienteSnap = await getDoc(clienteRef);
      if (clienteSnap.exists()) {
        setCliente({ id: clienteSnap.id, ...clienteSnap.data() });
      }

      const bonosQuery = query(collection(db, 'bonos'), where('clienteId', '==', id));
      const bonosSnapshot = await getDocs(bonosQuery);
      const listaBonos = bonosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setBonos(listaBonos);
    } catch (e) {
      console.error('Error al obtener datos del cliente y bonos: ', e);
    }
  }, [id]);

  const obtenerReservasCliente = useCallback(async () => {
    try {
      const reservasRef = collection(db, 'reservas');
      const q = query(reservasRef, where('clienteId', '==', id));
      const querySnapshot = await getDocs(q);
      const listaReservas = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setReservasCliente(listaReservas);
    } catch (e) {
      console.error('Error al obtener reservas del cliente:', e);
    }
  }, [id]);

  const obtenerEspacios = useCallback(async () => {
    try {
      const espaciosSnapshot = await getDocs(collection(db, 'espacios'));
      const listaEspacios = espaciosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEspacios(listaEspacios);
    } catch (e) {
      console.error('Error al obtener espacios:', e);
    }
  }, []);

  useEffect(() => {
    obtenerClienteYBonos();
    obtenerReservasCliente();
    obtenerEspacios();
  }, [id, obtenerClienteYBonos, obtenerReservasCliente, obtenerEspacios]);

  const toggleBonoDesplegado = (bonoId) => {
    setBonosDesplegados((prevState) => ({
      ...prevState,
      [bonoId]: !prevState[bonoId],
    }));
  };

  const registrarAsistencia = async (bonoId, sesionesRestantes) => {
    if (sesionesRestantes <= 0) {
      alert('No quedan sesiones disponibles en este bono.');
      return;
    }
    try {
      const bonoRef = doc(db, 'bonos', bonoId);
      const fechaActual = Timestamp.now();

      await updateDoc(bonoRef, {
        sesionesRestantes: sesionesRestantes - 1,
        ultimaAsistencia: fechaActual,
      });
      await addDoc(collection(bonoRef, 'asistencias'), {
        fecha: fechaActual,
      });
      obtenerClienteYBonos();
    } catch (e) {
      console.error('Error al registrar asistencia: ', e);
    }
  };

  const actualizarEstadoPago = async (bonoId, nuevoEstado) => {
    try {
      const bonoRef = doc(db, 'bonos', bonoId);
      await updateDoc(bonoRef, {
        estadoPago: nuevoEstado,
      });
      obtenerClienteYBonos();
    } catch (e) {
      console.error('Error al actualizar estado de pago: ', e);
    }
  };

  // Función para ir a Reservas y establecer el cliente seleccionado
  const irAReservas = () => {
    setClienteSeleccionado(id);
    navigate('/reservas');
  };

  if (!cliente) {
    return <div>Cargando...</div>;
  }

  const bonosActivos = bonos.filter((bono) => bono.sesionesRestantes > 0);
  const bonosGastados = bonos.filter((bono) => bono.sesionesRestantes === 0);

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:px-6 lg:px-8">
      <h1 className="text-xl font-bold text-gray-800 sm:text-2xl">Detalle del Cliente</h1>
      <h2 className="text-lg text-indigo-600 mt-2 sm:text-xl">{cliente.nombre}</h2>
      <p className="text-sm text-gray-600 mb-4 sm:text-base">
        Tipo de Cliente: {cliente.tipoCliente}
      </p>

      {cliente.entrenadores && cliente.entrenadores.length > 0 ? (
        <p className="text-sm text-gray-600">
          Entrenador/Fisio: {cliente.entrenadores.join(' / ')}
        </p>
      ) : (
        <p className="text-sm text-gray-600">Entrenador/Fisio: Ninguno</p>
      )}

      <Nota clienteId={cliente.id} />

      {/* Botón para ir a Reservas */}
      <button
        onClick={irAReservas}
        className="bg-indigo-500 text-white px-4 py-2 rounded-md mt-4 hover:bg-indigo-600"
      >
        Crear Reserva
      </button>

      {/* Mostrar reservas del cliente */}
      <h2 className="text-lg font-semibold text-gray-800 mt-4 sm:mt-6">Reservas</h2>

      {reservasCliente.length > 0 ? (
        reservasCliente.map((reserva) => {
          const espacio = espacios.find((e) => e.id === reserva.espacioId);
          const fechaInicio = reserva.fechaInicio.toDate();
          const fechaFin = reserva.fechaFin.toDate();
          return (
            <div key={reserva.id} className="border rounded-lg p-4 mb-4 bg-white shadow-md">
              <p className="text-gray-600">
                <strong>Espacio:</strong> {espacio ? espacio.nombre : 'Espacio desconocido'}
              </p>
              <p className="text-gray-600">
                <strong>Fecha y Hora:</strong> {fechaInicio.toLocaleString()} -{' '}
                {fechaFin.toLocaleString()}
              </p>
              <p className="text-gray-600">
                <strong>Asistencia:</strong>{' '}
                {reserva.asistenciaRegistrada ? 'Registrada' : 'Pendiente'}
              </p>
            </div>
          );
        })
      ) : (
        <p className="text-gray-600">No hay reservas para este cliente.</p>
      )}

      {/* Bonos Activos */}
      <h2 className="text-lg font-semibold text-gray-800 mt-4 sm:mt-6">Bonos Activos</h2>

      {bonosActivos.length > 0 ? (
        bonosActivos.map((bono) => (
          <div
            key={bono.id}
            className="border rounded-lg p-4 mb-4 bg-white shadow-md w-full sm:w-auto"
          >
            <h3 className="text-lg font-semibold">{bono.tipoBono}</h3>
            <p className="text-gray-600">Duración: {bono.duracionSesion} minutos</p>
            <p className="text-gray-600">Número de Sesiones/Horas: {bono.numeroSesiones}</p>
            <p className="text-gray-600">Sesiones/Horas Restantes: {bono.sesionesRestantes}</p>
            <p
              className={`font-semibold mt-2 ${
                bono.estadoPago === 'Pagado' ? 'text-green-500' : 'text-red-500'
              }`}
            >
              Estado de Pago: {bono.estadoPago}
            </p>
            <div className="mt-4 space-y-2 sm:space-y-0 sm:space-x-2 flex flex-col sm:flex-row">
              <button
                className="bg-indigo-500 text-white px-3 py-2 rounded-md w-full sm:w-auto"
                onClick={() => registrarAsistencia(bono.id, bono.sesionesRestantes)}
              >
                Registrar Asistencia
              </button>
              <button
                className="bg-green-500 text-white px-3 py-2 rounded-md w-full sm:w-auto"
                onClick={() => actualizarEstadoPago(bono.id, 'Pagado')}
              >
                Marcar como Pagado
              </button>
              <button
                className="bg-red-500 text-white px-3 py-2 rounded-md w-full sm:w-auto"
                onClick={() => actualizarEstadoPago(bono.id, 'Pendiente')}
              >
                Marcar como Pendiente
              </button>
            </div>
            <h4 className="text-md font-semibold mt-4">Asistencias</h4>
            <Asistencias bonoId={bono.id} sesionesRestantes={bono.sesionesRestantes} />
          </div>
        ))
      ) : (
        <div>
          <p className="text-gray-600">No hay bonos activos para este cliente.</p>
          <Link to="/bonos" className="text-indigo-600 hover:underline">
            Añadir Bono Nuevo
          </Link>
        </div>
      )}

      {/* Bonos Gastados */}
      {bonosGastados.length > 0 && (
        <>
          <h2 className="text-lg font-semibold text-gray-800 mt-6">Bonos Gastados</h2>
          {bonosGastados.map((bono) => {
            const ultimaFecha = bono.ultimaAsistencia ? bono.ultimaAsistencia.toDate() : null;
            const estadoPago = bono.estadoPago;
            const titulo = `Bono gastado${
              ultimaFecha ? ` - Última sesión: ${ultimaFecha.toLocaleDateString()}` : ''
            } - Estado de Pago: ${estadoPago}`;

            const fondoBono = estadoPago === 'Pendiente' ? 'bg-red-100' : 'bg-gray-100';

            return (
              <div key={bono.id} className={`border rounded-lg p-4 mb-4 shadow-md ${fondoBono}`}>
                <div
                  onClick={() => toggleBonoDesplegado(bono.id)}
                  className="cursor-pointer flex items-center justify-between text-black-400 hover:text-indigo-800"
                >
                  <span>{titulo}</span>
                  {bonosDesplegados[bono.id] ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </div>

                {bonosDesplegados[bono.id] && (
                  <div className="mt-2">
                    <h3 className="text-md font-semibold">{bono.tipoBono}</h3>
                    <p>Número de Sesiones/Horas: {bono.numeroSesiones}</p>
                    <label className="block mt-2">
                      Estado de Pago:
                      <select
                        value={bono.estadoPago}
                        onChange={(e) => actualizarEstadoPago(bono.id, e.target.value)}
                        className="ml-2 bg-white border border-gray-300 rounded-md"
                      >
                        <option value="Pendiente">Pendiente</option>
                        <option value="Pagado">Pagado</option>
                      </select>
                    </label>
                    <h4 className="text-md font-semibold mt-4">Asistencias</h4>
                    <Asistencias bonoId={bono.id} sesionesRestantes={bono.sesionesRestantes} />
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

export default ClienteDetalle;
