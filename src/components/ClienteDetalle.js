// src/components/ClienteDetalle.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
} from 'firebase/firestore';
import Asistencias from './Asistencias';

function ClienteDetalle() {
  const { id } = useParams();
  const [cliente, setCliente] = useState(null);
  const [bonos, setBonos] = useState([]);

  const obtenerClienteYBonos = async () => {
    try {
      // obtener datos del cliente
      const clienteRef = doc(db, 'clientes', id);
      const clienteSnap = await getDoc(clienteRef);
      if (clienteSnap.exists()) {
        setCliente({ id: clienteSnap.id, ...clienteSnap.data() });
      } else {
        console.log('No se encontró el cliente');
      }

      // obtener bonos asociados al cliente
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
  };

  useEffect(() => {
    obtenerClienteYBonos();
  }, [id]);

  const registrarAsistencia = async (bonoId, sesionesRestantes) => {
    if (sesionesRestantes <= 0) {
      alert('No quedan sesiones disponibles en este bono.');
      return;
    }
    try {
      // restar una sesión
      const bonoRef = doc(db, 'bonos', bonoId);
      await updateDoc(bonoRef, {
        sesionesRestantes: sesionesRestantes - 1,
      });
      await addDoc(collection(bonoRef, 'asistencias'), {
        fecha: new Date(),
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

  if (!cliente) {
    return <div>Cargando...</div>;
  }

  return (
    <div>
      <h1>Detalle del Cliente</h1>
      <h2>{cliente.nombre}</h2>
      <p>Tipo de Cliente: {cliente.tipoCliente}</p>

      <h2>Bonos</h2>
      {bonos.map((bono) => (
        <div key={bono.id}>
          <h3>{bono.tipoBono}</h3>
          <p>Número de Sesiones/Horas: {bono.numeroSesiones}</p>
          <p>Sesiones/Horas Restantes: {bono.sesionesRestantes}</p>
          <p style={{ color: bono.estadoPago === 'Pagado' ? 'green' : 'red' }}>
            Estado de Pago: {bono.estadoPago}
          </p>
          <button onClick={() => registrarAsistencia(bono.id, bono.sesionesRestantes)}>
            Registrar Asistencia
          </button>
          <button onClick={() => actualizarEstadoPago(bono.id, 'Pagado')}>
            Marcar como Pagado
          </button>
          <button onClick={() => actualizarEstadoPago(bono.id, 'Pendiente')}>
            Marcar como Pendiente
          </button>
          {/* Mostrar las fechas de asistencia */}
          <h4>Asistencias</h4>
          <Asistencias
            bonoId={bono.id}
            sesionesRestantes={bono.sesionesRestantes}
          />
        </div>
      ))}
    </div>
  );
}

export default ClienteDetalle;