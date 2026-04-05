import { useState, useEffect } from 'react'
import { Calendar, MapPin, User, Mail, Phone, Trash2, CheckCircle, XCircle, Eye } from 'lucide-react'

interface Reservacion {
  id: string
  fechaCreacion: string
  cliente: { nombre: string; email: string; telefono: string }
  hotel: any
  estado: 'pendiente' | 'confirmada' | 'cancelada'
}

export default function Lobby() {
  const [reservaciones, setReservaciones] = useState<Reservacion[]>([])
  const [verDetalle, setVerDetalle] = useState<Reservacion | null>(null)

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('reservaciones_app') || '[]')
    setReservaciones(data.sort((a: any, b: any) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()))
  }, [])

  const eliminar = (id: string) => {
    if(confirm('¿Estás seguro de eliminar esta reservación?')) {
      const nuevas = reservaciones.filter(r => r.id !== id)
      setReservaciones(nuevas)
      localStorage.setItem('reservaciones_app', JSON.stringify(nuevas))
      if(verDetalle?.id === id) setVerDetalle(null)
    }
  }

  const cambiarEstado = (id: string, nuevoEstado: string) => {
    const actualizadas = reservaciones.map(r => r.id === id ? { ...r, estado: nuevoEstado } : r)
    setReservaciones(actualizadas)
    localStorage.setItem('reservaciones_app', JSON.stringify(actualizadas))
    if(verDetalle) setVerDetalle({...verDetalle, estado: nuevoEstado as any})
  }

  const coloresEstado = {
    pendiente: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    confirmada: 'bg-success/10 text-success border-success/30',
    cancelada: 'bg-danger/10 text-danger border-danger/30'
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-white">Lobby de Reservaciones</h2>
            <p className="text-xs text-dark-400 mt-1">{reservaciones.length} reservaciones registradas en sistema</p>
          </div>
        </div>

        {reservaciones.length === 0 ? (
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-12 text-center">
            <p className="text-dark-500 text-sm">No hay reservaciones guardadas.</p>
            <p className="text-dark-600 text-xs mt-1">Ve a Busqueda, encuentra un hotel y guardalo desde el panel de resultados.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reservaciones.map(res => (
              <div key={res.id} className="bg-dark-900 border border-dark-700 rounded-xl p-4 hover:border-dark-500 transition-all">
                <div className="flex items-center gap-4">
                  {res.hotel.imagen && <img src={res.hotel.imagen} alt="" className="w-24 h-16 rounded-lg object-cover flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-white truncate">{res.hotel.hotel}</h3>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full border font-medium ${coloresEstado[res.estado]}`}>{res.estado.toUpperCase()}</span>
                    </div>
                    <p className="text-xs text-dark-400 truncate"><User className="w-3 h-3 inline mr-1" />{res.cliente.nombre} — <Mail className="w-3 h-3 inline mx-1" />{res.cliente.email}</p>
                    <div className="flex gap-4 mt-1 text-[10px] text-dark-500">
                      <span><MapPin className="w-3 h-3 inline mr-1" />{res.hotel.direccion}</span>
                      <span className="font-bold text-accent">${res.hotel.total} {res.hotel.moneda}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button onClick={() => setVerDetalle(res)} className="bg-dark-800 border border-dark-600 p-2 rounded-lg text-dark-300 hover:text-white transition-colors"><Eye className="w-4 h-4" /></button>
                    <button onClick={() => eliminar(res.id)} className="bg-dark-800 border border-dark-600 p-2 rounded-lg text-danger hover:bg-danger/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {verDetalle && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6" onClick={() => setVerDetalle(null)}>
            <div className="bg-dark-900 border border-dark-700 rounded-2xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-white mb-4">Gestionar Reservación</h3>
              {verDetalle.hotel.imagen && <img src={verDetalle.hotel.imagen} className="w-full h-40 object-cover rounded-xl mb-4" />}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-dark-400">Hotel</span><span className="text-white font-medium">{verDetalle.hotel.hotel}</span></div>
                <div className="flex justify-between"><span className="text-dark-400">Plan</span><span className="text-white">{verDetalle.hotel.plan}</span></div>
                <div className="flex justify-between border-t border-dark-800 pt-2"><span className="text-dark-400 font-semibold">Total</span><span className="text-success font-bold text-lg">${verDetalle.hotel.total} {verDetalle.hotel.moneda}</span></div>
                
                <div className="bg-dark-800 rounded-lg p-3 mt-4">
                  <p className="text-[10px] text-dark-500 mb-2 uppercase">Datos del Cliente</p>
                  <p className="text-white"><User className="w-3 h-3 inline mr-2 text-dark-400"/>{verDetalle.cliente.nombre}</p>
                  <p className="text-white"><Mail className="w-3 h-3 inline mr-2 text-dark-400"/>{verDetalle.cliente.email}</p>
                  <p className="text-white"><Phone className="w-3 h-3 inline mr-2 text-dark-400"/>{verDetalle.cliente.telefono}</p>
                </div>

                <div className="flex gap-2 mt-4">
                  {verDetalle.estado !== 'confirmada' && <button onClick={() => cambiarEstado(verDetalle.id, 'confirmada')} className="flex-1 bg-success/10 border border-success/30 text-success py-2 rounded-lg text-xs flex items-center justify-center gap-1"><CheckCircle className="w-3 h-3"/> Confirmar</button>}
                  {verDetalle.estado !== 'cancelada' && <button onClick={() => cambiarEstado(verDetalle.id, 'cancelada')} className="flex-1 bg-danger/10 border border-danger/30 text-danger py-2 rounded-lg text-xs flex items-center justify-center gap-1"><XCircle className="w-3 h-3"/> Cancelar</button>}
                  {verDetalle.estado !== 'pendiente' && <button onClick={() => cambiarEstado(verDetalle.id, 'pendiente')} className="flex-1 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 py-2 rounded-lg text-xs">Pendiente</button>}
                </div>
              </div>
              <button onClick={() => setVerDetalle(null)} className="w-full mt-4 bg-dark-800 py-2 rounded-lg text-dark-300 text-xs hover:bg-dark-700">Cerrar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}