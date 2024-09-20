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
  
  const eliminarAsistencia = async (asistenciaId) => {
    try {
      const asistenciaRef = doc(db, 'bonos', bonoId, 'asistencias', asistenciaId);
      await deleteDoc(asistenciaRef);

      const asistenciasRef = collection(db, 'bonos', bonoId, 'asistencias');
      const asistenciasSnapshot = await getDocs(asistenciasRef);
      const asistenciasRestantes = asistenciasSnapshot.docs.map((doc) => doc.data());

      let nuevaUltimaAsistencia = null;
      if (asistenciasRestantes.length > 0) {
        // ordenar y obtener la última
        asistenciasRestantes.sort((a, b) => b.fecha.toDate() - a.fecha.toDate());
        nuevaUltimaAsistencia = asistenciasRestantes[0].fecha;
      }

      const bonoRef = doc(db, 'bonos', bonoId);
      await updateDoc(bonoRef, {
        sesionesRestantes: sesionesRestantes + 1,
        ultimaAsistencia: nuevaUltimaAsistencia,
      });

      obtenerAsistencias();
    } catch (e) {
      console.error('Error al eliminar asistencia: ', e);
    }
  };

  const guardarFechaAsistencia = async (asistenciaId) => {
    try {
      const asistenciaRef = doc(db, 'bonos', bonoId, 'asistencias', asistenciaId);
      const nuevaFechaTimestamp = Timestamp.fromDate(new Date(nuevaFecha));
      await updateDoc(asistenciaRef, {
        fecha: nuevaFechaTimestamp,
      });

      const asistenciasRef = collection(db, 'bonos', bonoId, 'asistencias');
      const asistenciasSnapshot = await getDocs(asistenciasRef);
      const asistencias = asistenciasSnapshot.docs.map((doc) => doc.data());

      // ordenar y encontrar la más reciente
      asistencias.sort((a, b) => b.fecha.toDate() - a.fecha.toDate());
      const ultimaAsistenciaFecha = asistencias[0].fecha;

      const bonoRef = doc(db, 'bonos', bonoId);
      await updateDoc(bonoRef, {
        ultimaAsistencia: ultimaAsistenciaFecha,
      });

      setAsistenciaEditando(null);
      obtenerAsistencias();
    } catch (e) {
      console.error('Error al actualizar la fecha de asistencia: ', e);
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