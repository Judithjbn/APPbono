// src/components/Asistencias.js
import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';

function Asistencias({ bonoId, sesionesRestantes }) {
  const [asistencias, setAsistencias] = useState([]);
  const [asistenciaEditando, setAsistenciaEditando] = useState(null);
  const [nuevaFecha, setNuevaFecha] = useState('');


  const obtenerAsistencias = async () => {
    try {
      const asistenciasRef = collection(db, 'bonos', bonoId, 'asistencias');
      const asistenciasSnapshot = await getDocs(asistenciasRef);
      const listaAsistencias = asistenciasSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAsistencias(listaAsistencias);
    } catch (e) {
      console.error('Error al obtener asistencias: ', e);
    }
  };

  useEffect(() => {
    obtenerAsistencias();
  }, [bonoId]);

  const guardarFechaAsistencia = async (asistenciaId) => {
    try {
      const asistenciaRef = doc(db, 'bonos', bonoId, 'asistencias', asistenciaId);
      //convertir la nueva fecha a Timestamp
      const nuevaFechaTimestamp = Timestamp.fromDate(new Date(nuevaFecha));
      await updateDoc(asistenciaRef, {
        fecha: nuevaFechaTimestamp,
      });
      setAsistenciaEditando(null);
      obtenerAsistencias();
    } catch (e) {
      console.error('Error al actualizar la fecha de asistencia: ', e);
    }
  };
  

  const eliminarAsistencia = async (asistenciaId) => {
    try {
      const asistenciaRef = doc(db, 'bonos', bonoId, 'asistencias', asistenciaId);
      await deleteDoc(asistenciaRef);

      const bonoRef = doc(db, 'bonos', bonoId);
      await updateDoc(bonoRef, {
        sesionesRestantes: sesionesRestantes + 1,
      });

      obtenerAsistencias();

    } catch (e) {
      console.error('Error al eliminar asistencia: ', e);
    }
  };

  return (
    <ul>
      {asistencias.map((asistencia) => (
        <li key={asistencia.id}>
          {asistenciaEditando === asistencia.id ? (
            <>
              <input
                type="date"
                value={nuevaFecha}
                onChange={(e) => setNuevaFecha(e.target.value)}
              />
              <button onClick={() => guardarFechaAsistencia(asistencia.id)}>Guardar</button>
              <button onClick={() => setAsistenciaEditando(null)}>Cancelar</button>
            </>
          ) : (
            <>
              {asistencia.fecha.toDate().toLocaleDateString()}
              <button
                onClick={() => {
                  setAsistenciaEditando(asistencia.id);
                  setNuevaFecha(asistencia.fecha.toDate().toISOString().split('T')[0]);
                }}
              >
                Editar
              </button>
              <button onClick={() => eliminarAsistencia(asistencia.id)}>Eliminar</button>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}

export default Asistencias;