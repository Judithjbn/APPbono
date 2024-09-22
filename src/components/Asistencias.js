import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, deleteDoc, doc, Timestamp, updateDoc } from 'firebase/firestore';

function Asistencias({ bonoId, sesionesRestantes }) {
  const [asistencias, setAsistencias] = useState([]);
  const [asistenciaEditando, setAsistenciaEditando] = useState(null);
  const [nuevaFecha, setNuevaFecha] = useState('');

  // Definir la función obtenerAsistencias
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

      setAsistenciaEditando(null);
      obtenerAsistencias();
    } catch (e) {
      console.error('Error al actualizar la fecha de asistencia: ', e);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-2xl font-bold mb-4">Asistencias</h2>

      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-md">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Editar</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Eliminar</th>
            </tr>
          </thead>
          <tbody>
            {asistencias.map((asistencia) => (
              <tr key={asistencia.id} className="border-b">
                <td className="px-6 py-4 whitespace-nowrap">
                  {asistenciaEditando === asistencia.id ? (
                    <input
                      type="date"
                      value={nuevaFecha}
                      onChange={(e) => setNuevaFecha(e.target.value)}
                      className="border rounded px-2 py-1 w-full"
                    />
                  ) : (
                    asistencia.fecha.toDate().toLocaleDateString()
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {asistenciaEditando === asistencia.id ? (
                    <button
                      onClick={() => guardarFechaAsistencia(asistencia.id)}
                      className="text-green-500 hover:text-green-700 mr-2"
                    >
                      Guardar
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setAsistenciaEditando(asistencia.id);
                        setNuevaFecha(asistencia.fecha.toDate().toISOString().split('T')[0]);
                      }}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <Edit className="inline-block h-5 w-5" />
                    </button>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => eliminarAsistencia(asistencia.id)}
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

export default Asistencias;