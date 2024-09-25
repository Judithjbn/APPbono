import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  Timestamp,
  getDoc,
  updateDoc,
  doc,
} from 'firebase/firestore';

import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

function Reservas() {
  const [clientes, setClientes] = useState([]);
  const [espacios, setEspacios] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState('');
  const [espacioSeleccionado, setEspacioSeleccionado] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [reservas, setReservas] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [bonosCliente, setBonosCliente] = useState([]);
  const [bonoSeleccionado, setBonoSeleccionado] = useState('');

  useEffect(() => {
    obtenerClientes();
    obtenerEspacios();
    obtenerReservas();
  }, []);

  useEffect(() => {
    generarEventos();
  }, [reservas, clientes, espacios]);

  useEffect(() => {
    obtenerBonosCliente();
  }, [clienteSeleccionado]);

  const obtenerClientes = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'clientes'));
      const listaClientes = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setClientes(listaClientes);
    } catch (e) {
      console.error('Error al obtener clientes:', e);
    }
  };

  const obtenerEspacios = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'espacios'));
      const listaEspacios = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEspacios(listaEspacios);
    } catch (e) {
      console.error('Error al obtener espacios:', e);
    }
  };

  const obtenerReservas = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'reservas'));
      const listaReservas = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setReservas(listaReservas);
    } catch (e) {
      console.error('Error al obtener reservas:', e);
    }
  };

  const obtenerBonosCliente = async () => {
    if (clienteSeleccionado) {
      try {
        const bonosRef = collection(db, 'bonos');
        const q = query(bonosRef, where('clienteId', '==', clienteSeleccionado));
        const querySnapshot = await getDocs(q);
        const listaBonos = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setBonosCliente(listaBonos);
      } catch (error) {
        console.error('Error al obtener bonos del cliente:', error);
      }
    } else {
      setBonosCliente([]);
    }
  };

  const generarEventos = () => {
    const eventosReservas = reservas.map((reserva) => {
      const cliente = clientes.find((c) => c.id === reserva.clienteId);
      const espacio = espacios.find((e) => e.id === reserva.espacioId);

      return {
        id: reserva.id,
        title: `${cliente ? cliente.nombre : 'Cliente desconocido'} - ${
          espacio ? espacio.nombre : 'Espacio desconocido'
        }`,
        start: reserva.fechaInicio.toDate(),
        end: reserva.fechaFin.toDate(),
        bonoId: reserva.bonoId,
        asistenciaRegistrada: reserva.asistenciaRegistrada,
      };
    });
    setEventos(eventosReservas);
  };

  const agregarReserva = async (e) => {
    e.preventDefault();
    try {
      const fechaInicioTimestamp = Timestamp.fromDate(new Date(fechaInicio));
      const fechaFinTimestamp = Timestamp.fromDate(new Date(fechaFin));

      if (fechaFinTimestamp <= fechaInicioTimestamp) {
        alert('La fecha de fin debe ser posterior a la fecha de inicio.');
        return;
      }

      const reservasRef = collection(db, 'reservas');
      const q = query(
        reservasRef,
        where('espacioId', '==', espacioSeleccionado),
        where('fechaInicio', '<', fechaFinTimestamp),
        where('fechaFin', '>', fechaInicioTimestamp)
      );
      const querySnapshot = await getDocs(q);
      const reservasSimultaneas = querySnapshot.size;

      const espacioDoc = await getDoc(doc(db, 'espacios', espacioSeleccionado));
      const capacidad = espacioDoc.data().capacidad;

      if (reservasSimultaneas >= capacidad) {
        alert('El espacio no está disponible en el horario seleccionado.');
        return;
      }

      await addDoc(collection(db, 'reservas'), {
        clienteId: clienteSeleccionado,
        espacioId: espacioSeleccionado,
        fechaInicio: fechaInicioTimestamp,
        fechaFin: fechaFinTimestamp,
        estado: 'confirmada',
        asistenciaRegistrada: false,
        bonoId: bonoSeleccionado || null,
      });

      alert('Reserva creada exitosamente');
      setClienteSeleccionado('');
      setEspacioSeleccionado('');
      setFechaInicio('');
      setFechaFin('');
      setBonoSeleccionado('');
      obtenerReservas();
    } catch (error) {
      console.error('Error al crear reserva:', error);
    }
  };

  const registrarAsistencia = async (event) => {
    const confirmacion = window.confirm('¿Deseas registrar la asistencia de esta reserva?');
    if (confirmacion) {
      try {
        await updateDoc(doc(db, 'reservas', event.id), {
          asistenciaRegistrada: true,
        });

        //si hay un bono asociado, decrementar sesiones restantes
        if (event.bonoId) {
          const bonoRef = doc(db, 'bonos', event.bonoId);
          const bonoDoc = await getDoc(bonoRef);
          if (bonoDoc.exists()) {
            const sesionesRestantes = bonoDoc.data().sesionesRestantes;
            await updateDoc(bonoRef, {
              sesionesRestantes: sesionesRestantes - 1,
            });
          }
        }

        alert('Asistencia registrada');
        obtenerReservas();
      } catch (error) {
        console.error('Error al registrar asistencia:', error);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-4">Reservas</h1>

      <form onSubmit={agregarReserva} className="space-y-4 mb-8">
        <div>
          <label className="block font-medium text-gray-700">Cliente:</label>
          <select
            value={clienteSeleccionado}
            onChange={(e) => setClienteSeleccionado(e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            required
          >
            <option value="">Selecciona un cliente</option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-medium text-gray-700">Espacio:</label>
          <select
            value={espacioSeleccionado}
            onChange={(e) => setEspacioSeleccionado(e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            required
          >
            <option value="">Selecciona un espacio</option>
            {espacios.map((espacio) => (
              <option key={espacio.id} value={espacio.id}>
                {espacio.nombre}
              </option>
            ))}
          </select>
        </div>

        {bonosCliente.length > 0 && (
          <div>
            <label className="block font-medium text-gray-700">Bono:</label>
            <select
              value={bonoSeleccionado}
              onChange={(e) => setBonoSeleccionado(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            >
              <option value="">Selecciona un bono (opcional)</option>
              {bonosCliente.map((bono) => (
                <option key={bono.id} value={bono.id}>
                  {bono.tipoBono} - {bono.sesionesRestantes} sesiones restantes
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block font-medium text-gray-700">Fecha y Hora de Inicio:</label>
          <input
            type="datetime-local"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            required
          />
        </div>

        <div>
          <label className="block font-medium text-gray-700">Fecha y Hora de Fin:</label>
          <input
            type="datetime-local"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            required
          />
        </div>

        <button
          type="submit"
          className="bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-600"
        >
          Agregar Reserva
        </button>
      </form>

      <div style={{ height: '500px' }}>
        <Calendar
          localizer={localizer}
          events={eventos}
          startAccessor="start"
          endAccessor="end"
          views={['day', 'week']}
          defaultView="day"
          step={30}
          timeslots={2}
          selectable
          onSelectEvent={(event) => registrarAsistencia(event)}
          onSelectSlot={(slotInfo) => {
            console.log('Slot seleccionado:', slotInfo);
          }}
        />
      </div>
    </div>
  );
}

export default Reservas;
