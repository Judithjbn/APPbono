// src/components/Reservas.js

import React, { useState, useEffect, useCallback, useContext } from 'react';
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
  deleteDoc,
} from 'firebase/firestore';

import { Calendar, momentLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import { ContextoCliente } from '../ContextoCliente'; // Importamos el contexto

const localizer = momentLocalizer(moment);
const DragAndDropCalendar = withDragAndDrop(Calendar);

function Reservas() {
  const { clienteSeleccionado, setClienteSeleccionado } = useContext(ContextoCliente);
  const [clientes, setClientes] = useState([]);
  const [espacios, setEspacios] = useState([]);
  const [espacioSeleccionado, setEspacioSeleccionado] = useState('');
  const [reservas, setReservas] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [bonosCliente, setBonosCliente] = useState([]);
  const [bonoSeleccionado, setBonoSeleccionado] = useState('');

  // Obtener clientes, espacios y reservas al montar el componente
  useEffect(() => {
    obtenerClientes();
    obtenerEspacios();
    obtenerReservas();
  }, []);

  // Obtener clientes
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

  // Obtener espacios
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

  // Obtener reservas
  const obtenerReservas = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'reservas'));
      const listaReservas = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
        };
      });
      console.log('Reservas obtenidas:', listaReservas);
      setReservas(listaReservas);
    } catch (e) {
      console.error('Error al obtener reservas:', e);
    }
  };

  // Generar eventos para el calendario
  const generarEventos = useCallback(() => {
    if (reservas.length > 0 && clientes.length > 0 && espacios.length > 0) {
      const eventosReservas = reservas.map((reserva) => {
        const cliente = clientes.find((c) => c.id === reserva.clienteId);
        const espacio = espacios.find((e) => e.id === reserva.espacioId);

        if (!cliente || !espacio) {
          console.warn('Cliente o espacio no encontrado para la reserva:', reserva);
          return null;
        }

        return {
          id: reserva.id,
          title: `${cliente.nombre} - ${espacio.nombre}`,
          start: reserva.fechaInicio.toDate(),
          end: reserva.fechaFin.toDate(),
          bonoId: reserva.bonoId,
          asistenciaRegistrada: reserva.asistenciaRegistrada,
          clienteId: reserva.clienteId,
          espacioId: reserva.espacioId,
        };
      }).filter(Boolean); // Eliminar elementos nulos
      console.log('Eventos generados:', eventosReservas);
      setEventos(eventosReservas);
    }
  }, [reservas, clientes, espacios]);

  useEffect(() => {
    generarEventos();
  }, [reservas, clientes, espacios, generarEventos]);

  // Obtener bonos del cliente seleccionado
  const obtenerBonosCliente = useCallback(async () => {
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
  }, [clienteSeleccionado]);

  useEffect(() => {
    obtenerBonosCliente();
  }, [clienteSeleccionado, obtenerBonosCliente]);

  // Función para agregar una reserva directamente (desde el calendario)
  const agregarReservaDirecta = async (fechaInicioTimestamp, fechaFinTimestamp) => {
    if (!clienteSeleccionado) {
      alert('Por favor, selecciona un cliente.');
      return;
    }

    if (!espacioSeleccionado) {
      alert('Por favor, selecciona un espacio.');
      return;
    }

    // Verificar que las fechas sean correctas
    if (fechaFinTimestamp <= fechaInicioTimestamp) {
      alert('La fecha de fin debe ser posterior a la fecha de inicio.');
      return;
    }

    if (fechaInicioTimestamp <= Timestamp.now()) {
      alert('La fecha de inicio debe ser posterior al momento actual.');
      return;
    }

    // Verificar disponibilidad del espacio
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

    // Verificar que el bono tenga sesiones disponibles (si se seleccionó un bono)
    if (bonoSeleccionado) {
      const bonoRef = doc(db, 'bonos', bonoSeleccionado);
      const bonoDoc = await getDoc(bonoRef);
      if (bonoDoc.exists()) {
        const sesionesRestantes = bonoDoc.data().sesionesRestantes;
        if (sesionesRestantes <= 0) {
          alert('El bono seleccionado no tiene sesiones restantes.');
          return;
        }
      }
    }

    // Crear la reserva
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
    obtenerReservas(); // Actualizar las reservas
  };

  // Función para manejar la selección de un slot en el calendario
  const manejarSeleccionSlot = async (slotInfo) => {
    const confirmacion = window.confirm(
      `¿Deseas crear una reserva desde ${slotInfo.start.toLocaleString()} hasta ${slotInfo.end.toLocaleString()}?`
    );

    if (confirmacion) {
      if (!clienteSeleccionado || !espacioSeleccionado) {
        alert('Por favor, selecciona un cliente y un espacio antes de crear una reserva.');
        return;
      }

      try {
        const fechaInicioTimestamp = Timestamp.fromDate(slotInfo.start);
        const fechaFinTimestamp = Timestamp.fromDate(slotInfo.end);

        await agregarReservaDirecta(fechaInicioTimestamp, fechaFinTimestamp);
      } catch (error) {
        console.error('Error al crear reserva desde el calendario:', error);
        alert('Ocurrió un error al crear la reserva.');
      }
    }
  };

  // Funciones para mover y redimensionar reservas (drag and drop)
  const moverReserva = async ({ event, start, end, isAllDay }) => {
    try {
      const fechaInicioTimestamp = Timestamp.fromDate(start);
      const fechaFinTimestamp = Timestamp.fromDate(end);

      // Verificar disponibilidad del espacio
      const reservasRef = collection(db, 'reservas');
      const q = query(
        reservasRef,
        where('espacioId', '==', event.espacioId),
        where('fechaInicio', '<', fechaFinTimestamp),
        where('fechaFin', '>', fechaInicioTimestamp),
        where('__name__', '!=', event.id) // Excluir la reserva actual
      );
      const querySnapshot = await getDocs(q);
      const reservasSimultaneas = querySnapshot.size;

      const espacioDoc = await getDoc(doc(db, 'espacios', event.espacioId));
      const capacidad = espacioDoc.data().capacidad;

      if (reservasSimultaneas >= capacidad) {
        alert('El espacio no está disponible en el horario seleccionado.');
        return;
      }

      await updateDoc(doc(db, 'reservas', event.id), {
        fechaInicio: fechaInicioTimestamp,
        fechaFin: fechaFinTimestamp,
      });

      alert('Reserva actualizada');
      obtenerReservas();
    } catch (error) {
      console.error('Error al mover reserva:', error);
      alert('Ocurrió un error al actualizar la reserva.');
    }
  };

  const redimensionarReserva = async ({ event, start, end }) => {
    try {
      const fechaInicioTimestamp = Timestamp.fromDate(start);
      const fechaFinTimestamp = Timestamp.fromDate(end);

      // Verificar que la fecha de fin sea posterior a la fecha de inicio
      if (fechaFinTimestamp <= fechaInicioTimestamp) {
        alert('La fecha de fin debe ser posterior a la fecha de inicio.');
        return;
      }

      const reservasRef = collection(db, 'reservas');
      const q = query(
        reservasRef,
        where('espacioId', '==', event.espacioId),
        where('fechaInicio', '<', fechaFinTimestamp),
        where('fechaFin', '>', fechaInicioTimestamp),
        where('__name__', '!=', event.id) // Excluir la reserva actual
      );
      const querySnapshot = await getDocs(q);
      const reservasSimultaneas = querySnapshot.size;

      const espacioDoc = await getDoc(doc(db, 'espacios', event.espacioId));
      const capacidad = espacioDoc.data().capacidad;

      if (reservasSimultaneas >= capacidad) {
        alert('El espacio no está disponible en el horario seleccionado.');
        return;
      }

      await updateDoc(doc(db, 'reservas', event.id), {
        fechaInicio: fechaInicioTimestamp,
        fechaFin: fechaFinTimestamp,
      });

      alert('Reserva actualizada');
      obtenerReservas();
    } catch (error) {
      console.error('Error al redimensionar reserva:', error);
      alert('Ocurrió un error al actualizar la reserva.');
    }
  };

  const registrarAsistencia = async (event) => {
    if (event.asistenciaRegistrada) {
      alert('La asistencia ya ha sido registrada para esta reserva.');
      return;
    }

    const confirmacion = window.confirm('¿Deseas registrar la asistencia de esta reserva?');
    if (confirmacion) {
      try {
        await updateDoc(doc(db, 'reservas', event.id), {
          asistenciaRegistrada: true,
        });

        if (event.bonoId) {
          const bonoRef = doc(db, 'bonos', event.bonoId);
          const bonoDoc = await getDoc(bonoRef);
          if (bonoDoc.exists()) {
            const sesionesRestantes = bonoDoc.data().sesionesRestantes;
            if (sesionesRestantes > 0) {
              await updateDoc(bonoRef, {
                sesionesRestantes: sesionesRestantes - 1,
              });
            } else {
              alert('El bono no tiene sesiones restantes.');
            }
          }
        }

        alert('Asistencia registrada');
        obtenerReservas();
      } catch (error) {
        console.error('Error al registrar asistencia:', error);
        alert('Ocurrió un error al registrar la asistencia.');
      }
    }
  };

  const cancelarReserva = async (event) => {
    const confirmacion = window.confirm('¿Estás seguro de que deseas cancelar esta reserva?');
    if (confirmacion) {
      try {
        await deleteDoc(doc(db, 'reservas', event.id));
        alert('Reserva cancelada');
        obtenerReservas();
      } catch (error) {
        console.error('Error al cancelar reserva:', error);
        alert('Ocurrió un error al cancelar la reserva.');
      }
    }
  };

  const manejarSeleccionEvento = (event) => {
    const opciones = window.prompt(
      `Selecciona una opción para la reserva:\n1. Registrar Asistencia\n2. Cancelar Reserva\n3. Cerrar`
    );

    if (opciones === '1') {
      registrarAsistencia(event);
    } else if (opciones === '2') {
      cancelarReserva(event);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-4">Reservas</h1>

      <div className="space-y-4 mb-8">
        <div>
          <label className="block font-medium text-gray-700">Cliente:</label>
          <select
            value={clienteSeleccionado}
            onChange={(e) => setClienteSeleccionado(e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
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
      </div>

      <div className="flex space-x-4 my-4">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-300 mr-2"></div>
          <span>Asistencia registrada</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-300 mr-2"></div>
          <span>Asistencia pendiente</span>
        </div>
      </div>

      <DndProvider backend={HTML5Backend}>
        <div style={{ height: '500px' }}>
          <DragAndDropCalendar
            localizer={localizer}
            events={eventos}
            startAccessor="start"
            endAccessor="end"
            views={['day', 'week']}
            defaultView="day"
            step={30}
            timeslots={2}
            selectable
            resizable
            onEventDrop={moverReserva}
            onEventResize={redimensionarReserva}
            onSelectEvent={manejarSeleccionEvento}
            onSelectSlot={manejarSeleccionSlot}
            eventPropGetter={(event) => {
              let backgroundColor = event.asistenciaRegistrada ? '#6EE7B7' : '#FCA5A5';
              return { style: { backgroundColor } };
            }}
          />
        </div>
      </DndProvider>
    </div>
  );
}

export default Reservas;