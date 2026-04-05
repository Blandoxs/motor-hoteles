import { useState } from 'react'
import { ArrowUpDown, Filter, Download, Star, MapPin, ExternalLink, Image as ImageIcon } from 'lucide-react'

interface Props { results: any[]; providerStatuses: any[] }

export default function ResultsPanel({ results, providerStatuses }: Props) {
  const [sortField, setSortField] = useState<string>('total')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [filterProveedor, setFilterProveedor] = useState('todos')
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [selectedHotel, setSelectedHotel] = useState<any>(null)

  const sorted = [...results].sort((a, b) => {
    const va = typeof a[sortField] === 'string' ? a[sortField] : Number(a[sortField])
    const vb = typeof b[sortField] === 'string' ? b[sortField] : Number(b[sortField])
    return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1)
  })
  
  const filtered = filterProveedor === 'todos' ? sorted : sorted.filter(r => r.proveedorId === filterProveedor)
  const uniqueProviders = [...new Set(results.map(r => r.proveedorId))] 
  const minPrice = results.length ? Math.min(...results.map(r => r.total)) : 0
  const best = results.length ? results.reduce((b, r) => r.total < b.total ? r : b) : null
  const realCount = results.filter(r => r.real).length

  const toggleSort = (field: string) => { 
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); 
    else { setSortField(field); setSortDir('asc') } 
  }

  const renderStars = (rating: number) => {
    const stars = Math.round(rating / 2)
    return (
      <span className="flex gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} className={`w-3 h-3 ${i < stars ? 'text-amber-400 fill-amber-400' : 'text-dark-700'}`} />
        ))}
      </span>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      {/* Stats */}
      <div className="grid grid-cols-6 gap-3 mb-6">
        <div className="bg-dark-900 border border-dark-700 rounded-xl p-4">
          <p className="text-[10px] text-dark-400 uppercase">Total</p>
          <p className="text-2xl font-bold text-white mt-1">{results.length}</p>
        </div>
        <div className="bg-dark-900 border border-dark-700 rounded-xl p-4">
          <p className="text-[10px] text-dark-400 uppercase">Mejor Precio</p>
          {/* Corregido: Uso de concatenación en lugar de template literal */}
          <p className="text-2xl font-bold text-success mt-1">{best ? "$" + best.total : '—'}</p>
        </div>
        <div className="bg-dark-900 border border-dark-700 rounded-xl p-4">
          <p className="text-[10px] text-dark-400 uppercase">Mejor Portal</p>
          <p className="text-lg font-bold text-accent mt-1">{best?.proveedor || '—'}</p>
        </div>
        <div className="bg-dark-900 border border-dark-700 rounded-xl p-4">
          <p className="text-[10px] text-dark-400 uppercase">Datos Reales</p>
          <p className="text-2xl font-bold text-white mt-1">{realCount}</p>
        </div>
        <div className="bg-dark-900 border border-dark-700 rounded-xl p-4">
          <p className="text-[10px] text-dark-400 uppercase">Portales OK</p>
          <p className="text-2xl font-bold text-white mt-1">
            {providerStatuses.filter(p => p.state === 'completado').length}/{providerStatuses.filter(p => p.enabled).length}
          </p>
        </div>
        <div className="bg-dark-900 border border-dark-700 rounded-xl p-4">
          <p className="text-[10px] text-dark-400 uppercase">Errores</p>
          <p className="text-2xl font-bold text-danger mt-1">{providerStatuses.filter(p => p.state === 'error').length}</p>
        </div>
      </div>

      {/* Mejor precio destacado */}
      {best && best.real && best.imagen && (
        <div className="bg-dark-900 border border-success/20 rounded-xl p-4 mb-6 flex gap-4">
          <img src={best.imagen} alt={best.hotel} className="w-32 h-24 rounded-xl object-cover" loading="lazy" />
          <div className="flex-1">
            <p className="text-[10px] text-success uppercase tracking-wider font-semibold mb-1">MEJOR PRECIO ENCONTRADO</p>
            <h3 className="text-lg font-bold text-white">{best.hotel}</h3>
            <p className="text-xs text-dark-400">{best.direccion}{best.landmark && ` — ${best.landmark}`}</p>
            <div className="flex items-center gap-3 mt-2">
              {/* Corregido: Separado correctamente para que imprima las variables */}
              <span className="text-2xl font-bold text-success">${best.total} {best.moneda}</span>
              {best.estrellas > 0 && (
                <>
                  {renderStars(best.estrellas)}
                  <span className="text-xs text-dark-400 ml-1">{best.rating}/10 ({best.reviews})</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Controles */}
      <div className="flex items-center gap-3 mb-4">
        <Filter className="w-4 h-4 text-dark-400" />
        <span className="text-xs text-dark-400">Filtrar:</span>
        <button 
          onClick={() => setFilterProveedor('todos')} 
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterProveedor === 'todos' ? 'bg-accent/20 text-accent border border-accent/30' : 'bg-dark-800 text-dark-400 border border-dark-700 hover:border-dark-500'}`}
        >
          Todos ({results.length})
        </button>
        {uniqueProviders.map(id => {
          const name = results.find(r => r.proveedorId === id)?.proveedor || id
          const count = results.filter(r => r.proveedorId === id).length
          return (
            <button 
              key={id} 
              onClick={() => setFilterProveedor(id)} 
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterProveedor === id ? 'bg-accent/20 text-accent border border-accent/30' : 'bg-dark-800 text-dark-400 border border-dark-700 hover:border-dark-500'}`}
            >
              {name} ({count})
            </button>
          )
        })}
        <div className="ml-auto flex gap-2">
          <button 
            onClick={() => setViewMode('table')} 
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === 'table' ? 'bg-accent/20 text-accent border border-accent/30' : 'bg-dark-800 text-dark-400 border border-dark-700 hover:border-dark-500'}`}
          >
            Tabla
          </button>
          <button 
            onClick={() => setViewMode('cards')} 
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === 'cards' ? 'bg-accent/20 text-accent border border-accent/30' : 'bg-dark-800 text-dark-400 border border-dark-700 hover:border-dark-500'}`}
          >
            Tarjetas
          </button>
          <button className="flex items-center gap-1.5 bg-dark-800 border border-dark-700 px-3 py-1.5 rounded-lg text-xs text-dark-300 hover:border-dark-500 transition-colors">
            <Download className="w-3 h-3" /> Exportar
          </button>
        </div>
      </div>

      {/* Vista Tarjetas */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map((r, i) => (
            <div 
              key={i} 
              onClick={() => setSelectedHotel(selectedHotel?.hotelId === r.hotelId && selectedHotel?.proveedorId === r.proveedorId ? null : r)} 
              className={`bg-dark-900 border rounded-xl overflow-hidden cursor-pointer transition-all hover:border-accent/30 hover:shadow-lg ${selectedHotel?.hotelId === r.hotelId && selectedHotel?.proveedorId === r.proveedorId ? 'border-accent/50 ring-1 ring-accent/20' : 'border-dark-700'}`}
            >
              {r.imagen ? (
                <img src={r.imagen} alt={r.hotel} className="w-full h-40 object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-40 bg-dark-800 flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-dark-700" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-semibold text-white leading-tight flex-1">{r.hotel}</h4>
                  {r.real ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-success/10 text-success font-semibold flex-shrink-0">REAL</span>
                  ) : (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-dark-700 text-dark-500 font-semibold flex-shrink-0">SIM</span>
                  )}
                </div>
                {r.direccion && (
                  <p className="text-[10px] text-dark-500 flex items-center gap-1 mb-1">
                    <MapPin className="w-2.5 h-2.5" />{r.direccion}
                  </p>
                )}
                <div className="flex items-center gap-2 text-[10px] text-dark-400 mb-2">
                  <span className="px-1.5 py-0.5 rounded bg-dark-800 text-dark-300">{r.categoria}</span>
                  <span className="text-dark-600">|</span>
                  <span>{r.plan}</span>
                </div>
                <div className="flex items-end justify-between mt-2">
                  {r.estrellas > 0 && (
                    <div className="flex items-center gap-1 mb-1">
                      {renderStars(r.estrellas)}
                      <span className="text-[10px] text-dark-400">{r.rating}/10</span>
                    </div>
                  )}
                  <p className="text-xs text-dark-500">{r.moneda} {r.precio.toLocaleString()} + {r.impuestos.toLocaleString()} impuestos</p>
                </div>
                <p className="text-[9px] text-dark-600 mt-2 font-mono">{r.proveedor}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-dark-900 border border-dark-700 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-dark-800 text-left text-[10px] uppercase tracking-wider text-dark-400">
                <th className="px-4 py-3 cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('proveedor')}>Portal <ArrowUpDown className="w-3 h-3 inline ml-1" /></th>
                <th className="px-4 py-3">Hotel</th>
                <th className="px-4 py-3">Foto</th>
                <th className="px-4 py-3 cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('categoria')}>Categoria <ArrowUpDown className="w-3 h-3 inline ml-1" /></th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3 cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('precio')}>Base <ArrowUpDown className="w-3 h-3 inline ml-1" /></th>
                <th className="px-4 py-3 cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('impuestos')}>Impuestos <ArrowUpDown className="w-3 h-3 inline ml-1" /></th>
                <th className="px-4 py-3 cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('total')}>Total <ArrowUpDown className="w-3 h-3 inline ml-1" /></th>
                <th className="px-4 py-3">Origen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800">
              {filtered.map((r, i) => (
                <tr key={i} className="hover:bg-dark-800/50 transition-colors cursor-pointer" onClick={() => setSelectedHotel(r)}>
                  <td className="px-4 py-3"><span className="text-xs font-mono px-2 py-0.5 rounded bg-dark-800 text-dark-300">{r.proveedor}</span></td>
                  <td className="px-4 py-3 text-white font-medium text-xs max-w-[200px] truncate" title={r.hotel}>{r.hotel}</td>
                  <td className="px-4 py-3">{r.imagen ? <img src={r.imagen} alt="" className="w-12 h-8 rounded object-cover" loading="lazy" /> : <span className="text-dark-600">—</span>}</td>
                  <td className="px-4 py-3"><span className="text-xs px-1.5 py-0.5 rounded bg-dark-800 text-dark-200">{r.categoria}</span></td>
                  <td className="px-4 py-3 text-xs text-dark-300">{r.plan}</td>
                  <td className="px-4 py-3 font-mono text-xs text-dark-300">{r.precio.toLocaleString()} {r.moneda}</td>
                  <td className="px-4 py-3 font-mono text-xs text-dark-400">{r.impuestos.toLocaleString()} {r.moneda}</td>
                  <td className="px-4 py-3 font-mono text-sm text-white font-bold">${r.total.toLocaleString()} {r.moneda}</td>
                  <td className="px-4 py-3">{r.real ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success font-medium">API REAL</span> : <span className="text-[9px] px-2 py-0.5 rounded-full bg-dark-700 text-dark-400 font-medium">SIMULADO</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="text-center text-dark-500 py-12 text-sm">Sin resultados</p>}
        </div>
      )}

      {/* Modal detalle */}
      {selectedHotel && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6" onClick={() => setSelectedHotel(null)}>
          <div className="bg-dark-900 border border-dark-700 rounded-2xl max-w-2xl w-[90vw] max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {selectedHotel.imagen && <img src={selectedHotel.imagen} alt="" className="w-full h-56 object-cover" loading="lazy" />}
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedHotel.hotel}</h3>
                  {selectedHotel.real && <span className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success font-semibold inline-block mt-1">DATOS REALES DE MAKCORPS</span>}
                </div>
                {selectedHotel.estrellas > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    {renderStars(selectedHotel.estrellas)}
                    <span className="text-sm text-dark-300">{selectedHotel.rating}/10 ({selectedHotel.reviews} reviews)</span>
                  </div>
                )}
              </div>
              {selectedHotel.direccion && (
                <p className="text-xs text-dark-400 flex items-center gap-1 mb-4">
                  <MapPin className="w-3 h-3" />{selectedHotel.direccion}{selectedHotel.landmark && ` — ${selectedHotel.landmark}`}
                </p>
              )}
              <div className="grid grid-cols-3 gap-4 mb-4 text-xs">
                <div className="bg-dark-800 rounded-lg p-3"><p className="text-dark-500 mb-1">Categoria</p><p className="text-white font-semibold">{selectedHotel.categoria}</p></div>
                <div className="bg-dark-800 rounded-lg p-3"><p className="text-dark-500 mb-1">Plan</p><p className="text-white font-medium">{selectedHotel.plan}</p></div>
                <div className="bg-dark-800 rounded-lg p-3"><p className="text-dark-500 mb-1">Check-in / Out</p><p className="text-white font-medium">{selectedHotel.checkIn} → {selectedHotel.checkOut}</p></div>
              </div>
              <div className="bg-dark-800 rounded-lg p-4 mb-4">
                <p className="text-dark-500 text-xs mb-2">Desglose de precio</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-dark-300">Precio base</span>
                    <span className="font-mono text-white">${selectedHotel.precio.toLocaleString()} {selectedHotel.moneda}</span>
                  </div>
                  <div className="flex justify-between border-t border-dark-700 pt-2">
                    <span className="text-dark-300">Impuestos (17%)</span>
                    <span className="font-mono text-dark-400">{selectedHotel.impuestos.toLocaleString()} {selectedHotel.moneda}</span>
                  </div>
                  <div className="flex justify-between border-t border-dark-700 pt-2">
                    <span className="text-white font-semibold">TOTAL</span>
                    <span className="font-mono text-success text-lg font-bold">${selectedHotel.total.toLocaleString()} {selectedHotel.moneda}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-4">
                <button onClick={() => setSelectedHotel(null)} className="flex-1 bg-dark-800 border border-dark-700 px-4 py-2.5 rounded-xl text-xs text-dark-300 hover:bg-dark-700 transition-colors">Cerrar</button>
                <a 
                  href={`https://www.google.com/search?q=${encodeURIComponent(selectedHotel.hotel + ' ' + (selectedHotel.direccion || ''))}`} 
                  target="_blank" 
                  rel="noopener" 
                  className="flex-1 bg-accent/10 border border-accent/20 px-4 py-2.5 rounded-xl text-xs text-accent hover:bg-accent/20 transition-colors flex items-center justify-center gap-1.5"
                >
                  <span className="text-xs font-medium">Ver en Google</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <div className="flex items-center gap-2 text-xs text-dark-400 mt-4">
                <span className="font-mono">Portal:</span><span className="text-white">{selectedHotel.proveedor}</span>
                <span className="font-mono">ID:</span><span className="text-dark-300">{selectedHotel.hotelId}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}