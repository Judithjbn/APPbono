import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc, deleteField } from 'firebase/firestore';
import { db } from '../firebaseConfig';

function Nota({ clienteId }) {
  const [nota, setNota] = useState('');
  const [editando, setEditando] = useState(false);
  const [mensajeError, setMensajeError] = useState('');

  const obtenerNota = async () => {
    try {
      const clienteRef = doc(db, 'clientes', clienteId);
      const clienteSnap = await getDoc(clienteRef);
      if (clienteSnap.exists() && clienteSnap.data().nota) {
        setNota(clienteSnap.data().nota);
      }
    } catch (e) {
      console.error('Error al obtener la nota:', e);
    }
  };

  useEffect(() => {
    obtenerNota();
  }, [clienteId]);

  const manejarCambio = (event) => {
    const nuevaNota = event.target.value;
    if (nuevaNota.length <= 100) {
      setNota(nuevaNota);
      setMensajeError('');
    } else {
      setMensajeError('Máximo 100 caracteres');
    }
  };

  // guardar la nota en Firestore
  const guardarNota = async () => {
    try {
      const clienteRef = doc(db, 'clientes', clienteId);
      await updateDoc(clienteRef, { nota });
      setEditando(false);
      alert('Nota guardada correctamente');
    } catch (e) {
      console.error('Error al guardar la nota:', e);
    }
  };

  const borrarNota = async () => {
    try {
      const clienteRef = doc(db, 'clientes', clienteId);
      await updateDoc(clienteRef, { nota: deleteField() });
      setNota('');
      setEditando(false);
      alert('Nota borrada correctamente');
    } catch (e) {
      console.error('Error al borrar la nota:', e);
    }
  };

  return (
    <div className="mt-8">
      <div className="relative transform rotate-1 hover:rotate-0 transition-transform duration-300">
        <textarea
          className="w-full h-20 p-4 bg-yellow-100 border-yellow-200 border-b-4 rounded-md shadow-md resize-none focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:border-yellow-300 transition-all duration-300"
          placeholder="Escribe una nota..."
          value={nota}
          onChange={manejarCambio}
          disabled={!editando}
          rows={4}
          style={{ boxShadow: '2px 2px 10px rgba(0,0,0,0.1)' }}
        />
        <div className="absolute -top-2 left-2 w-8 h-3 bg-yellow-300 rounded-sm transform -rotate-45"></div>
      </div>
      {mensajeError && <p className="text-red-500">{mensajeError}</p>}

      <div className="mt-4 flex space-x-4">
        {editando ? (
          <>
            <button
              onClick={guardarNota}
              className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
            >
              Guardar
            </button>
            <button
              onClick={() => setEditando(false)}
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
            >
              Cancelar
            </button>
          </>
        ) : (
          <button
            onClick={() => setEditando(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            Editar Nota
          </button>
        )}
        <button
          onClick={borrarNota}
          className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
        >
          Borrar Nota
        </button>
      </div>
    </div>
  );
}

export default Nota;