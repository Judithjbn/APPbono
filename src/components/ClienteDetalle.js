import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebaseConfig";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  addDoc,
} from "firebase/firestore";
import Asistencias from "./Asistencias";

function ClienteDetalle() {
  const { id } = useParams();
  const [cliente, setCliente] = useState(null);
  const [bonos, setBonos] = useState([]);
  const [fechasUltimasSesiones, setFechasUltimasSesiones] = useState({});
  const [bonosDesplegados, setBonosDesplegados] = useState({});


  const obtenerClienteYBonos = async () => {
    try {
      // obtener datos del cliente
      const clienteRef = doc(db, "clientes", id);
      const clienteSnap = await getDoc(clienteRef);
      if (clienteSnap.exists()) {
        setCliente({ id: clienteSnap.id, ...clienteSnap.data() });
      } else {
        console.log("No se ha encontrado el cliente");
      }

      // obtener bonos asociados al cliente
      const bonosQuery = query(
        collection(db, "bonos"),
        where("clienteId", "==", id)
      );
      const bonosSnapshot = await getDocs(bonosQuery);
      const listaBonos = bonosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setBonos(listaBonos);
    } catch (e) {
      console.error("Error al obtener datos del cliente y bonos: ", e);
    }
  };

  useEffect(() => {
    obtenerClienteYBonos();
  }, [id]);

  // fechas de las últimas sesiones de bonos gastados
  useEffect(() => {
    const bonosGastados = bonos.filter((bono) => bono.sesionesRestantes === 0);

    const obtenerFechasUltimasSesiones = async () => {
      const nuevasFechas = {};
      for (const bono of bonosGastados) {
        try {
          const asistenciasRef = collection(db, "bonos", bono.id, "asistencias");
          const asistenciasSnapshot = await getDocs(asistenciasRef);
          const asistencias = asistenciasSnapshot.docs.map((doc) => doc.data());

          if (asistencias.length > 0) {
            asistencias.sort((a, b) => a.fecha.toDate() - b.fecha.toDate());

          const ultimaFecha = asistencias[asistencias.length - 1].fecha.toDate();
          nuevasFechas[bono.id] = ultimaFecha;
          }
        }
        catch (e) {
          console.error("Error al obtener fechas de las últimas sesiones de bonos gastados: ", e);
        }
      }

      setFechasUltimasSesiones(nuevasFechas);
    };

    if (bonosGastados.length > 0) {
      obtenerFechasUltimasSesiones();
    }
  }, [bonos]);

  // altermar los bonos desplegados
  const toggleBonoDesplegado = (bonoId) => {
    setBonosDesplegados((prevState) => ({
      ...prevState,
      [bonoId]: !prevState[bonoId],
    }));
  };

  
  const registrarAsistencia = async (bonoId, sesionesRestantes) => {
    if (sesionesRestantes <= 0) {
      alert("No quedan sesiones disponibles en este bono.");
      return;
    }
    try {
      // restar una sesión
      const bonoRef = doc(db, "bonos", bonoId);
      await updateDoc(bonoRef, {
        sesionesRestantes: sesionesRestantes - 1,
      });
      await addDoc(collection(bonoRef, "asistencias"), {
        fecha: new Date(),
      });
      obtenerClienteYBonos();
    } catch (e) {
      console.error("Error al registrar asistencia: ", e);
    }
  };

  const actualizarEstadoPago = async (bonoId, nuevoEstado) => {
    try {
      const bonoRef = doc(db, "bonos", bonoId);
      await updateDoc(bonoRef, {
        estadoPago: nuevoEstado,
      });
      obtenerClienteYBonos();
    } catch (e) {
      console.error("Error al actualizar estado de pago: ", e);
    }
  };

  if (!cliente) {
    return <div>Cargando...</div>;
  }

  const bonosActivos = bonos.filter((bono) => bono.sesionesRestantes > 0);
  const bonosGastados = bonos.filter((bono) => bono.sesionesRestantes === 0);

  return (
    <div>
      <h1>Detalle del Cliente</h1>
      <h2>{cliente.nombre}</h2>
      <p>Tipo de Cliente: {cliente.tipoCliente}</p>

      <h2>Bonos Activos</h2>
      {bonosActivos.map((bono) => (
        <div key={bono.id}>
          <h3>{bono.tipoBono}</h3>
          <p>Número de Sesiones/Horas: {bono.numeroSesiones}</p>
          <p>Sesiones/Horas Restantes: {bono.sesionesRestantes}</p>
          <p style={{ color: bono.estadoPago === "Pagado" ? "green" : "red" }}>
            Estado de Pago: {bono.estadoPago}
          </p>
          <button
            onClick={() => registrarAsistencia(bono.id, bono.sesionesRestantes)}
          >
            Registrar Asistencia
          </button>
          <button onClick={() => actualizarEstadoPago(bono.id, "Pagado")}>
            Marcar como Pagado
          </button>
          <button onClick={() => actualizarEstadoPago(bono.id, "Pendiente")}>
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

            {/* Bonos Gastados */}
            {bonosGastados.length > 0 && (
        <>
          <h2>Bonos Gastados</h2>
          {bonosGastados.map((bono) => {
            const ultimaFecha = fechasUltimasSesiones[bono.id];
            const titulo = `Bono gastado${
              ultimaFecha ? ` - Última sesión: ${ultimaFecha.toLocaleDateString()}` : ''
            }`;

            return (
              <div key={bono.id}>
                <div
                  onClick={() => toggleBonoDesplegado(bono.id)}
                  style={{
                    cursor: 'pointer',
                    backgroundColor: '#f0f0f0',
                    padding: '10px',
                    marginBottom: '5px',
                  }}
                >
                  {titulo}
                </div>
                {bonosDesplegados[bono.id] && (
                  <div style={{ paddingLeft: '20px' }}>
                    {/* detalles del bono */}
                    <h3>{bono.tipoBono}</h3>
                    <p>Número de Sesiones/Horas: {bono.numeroSesiones}</p>
                    <p style={{ color: bono.estadoPago === 'Pagado' ? 'green' : 'red' }}>
                      Estado de Pago: {bono.estadoPago}
                    </p>
                    <h4>Asistencias</h4>
                    <Asistencias
                      bonoId={bono.id}
                      sesionesRestantes={bono.sesionesRestantes}
                    />
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
