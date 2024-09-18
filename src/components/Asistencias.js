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
          {asistencia.fecha.toDate().toLocaleDateString()}
          <button onClick={() => eliminarAsistencia(asistencia.id)}>Eliminar</button>
        </li>
      ))}
    </ul>
  );
}

export default Asistencias;