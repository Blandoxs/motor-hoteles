import { useState } from 'react'
import { Search, Plus, Trash2, Calendar, Users, MapPin, Building2, Loader2, Wifi } from 'lucide-react'
import { searchHotels, normalizeMakcorpsResults, getCities } from '../api/makcorps'

interface Props {
  setSearchRunning: (v: boolean) => void
  setSearchDone: (v: boolean) => void
  setResults: (v: any[]) => void
  setProviderStatuses: (v: any[]) => void
  onGoResults: () => void
}

const SIM_PROVIDERS = [
  { id: 'bedsonline', name: 'BedsOnline', url: 'https://b2b.bedsonline.com' },
  { id: 'hotelbeds', name: 'Hotelbeds', url: 'https://www.hotelbeds.com' },
  { id: 'jactravel', name: 'JAC Travel', url: 'https://portal.jactravel.com' },
  { id: 'tourico', name: 'Tourico Holidays', url: 'https://www.tourico.com' },
  { id: 'restel', name: 'Restel Distribucion', url: 'https://www.restel.es' },
  { id: 'mystays', name: 'MyStays Group', url: 'https://b2b.mystaysgroup.com' },
  { id: 'cotizador_propio', name: 'Cotizador Propio', url: 'https://cotizador.local' },
]

export default function SearchPanel({ setSearchRunning, setSearchDone, setResults, setProviderStatuses, onGoResults }: Props) {
  const [destino, setDestino] = useState('cancun')
  const [fechaIn, setFechaIn] = useState('2025-08-15')
  const [fechaOut, setFechaOut] = useState('2025-08-20')
  const [adultos, setAdultos] = useState(2)
  const [menores, setMenores] = useState(0)
  const [edadesMenores, setEdadesMenores] = useState<number[]>([])
  const [hotelNombre, setHotelNombre] = useState('')
  const [proveedores, setProveedores] = useState(SIM_PROVIDERS.map(p => p.id))
  const [ejecutando, setEjecutando] = useState(false)
  const [log, setLog] = useState<string[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const addLog = (msg: string) => setLog(prev => [...prev.slice(-20), `[${new Date().toLocaleTimeString('es-MX')}] ${msg}`])

  const addMenor = () => { setMenores(m => m + 1); setEdadesMenores(e => [...e, 5]) }
  const removeMenor = () => { if (menores > 0) { setMenores(m => m - 1); setEdadesMenores(e => e.slice(0, -1)) } }
  const setEdad = (i: number, v: number) => { const n = [...edadesMenores]; n[i] = v; setEdadesMenores(n) }
  const toggleProvider = (id: string) => setProveedores(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  const handleDestinoChange = (value: string) => {
    setDestino(value)
    if (value.length > 1) {
      const cities = getCities()
      const filtered = cities.filter(c => c.includes(value.toLowerCase().replace(/\s+/g, '-')))
      setSuggestions(filtered.length > 0 ? filtered : [])
      setShowSuggestions(filtered.length > 0)
    } else {
      setSuggestions([]); setShowSuggestions(false)
    }
  }

  const selectSuggestion = (city: string) => {
    setDestino(city)
    setSuggestions([]); setShowSuggestions(false)
  }

  const simulateProvider = async (allStatuses: any[], idx: number, hotelName: string): Promise<any[]> => {
    const p = allStatuses[idx]; if (!p.enabled) return []
    const states = ['conectando', 'autenticando', 'navegando', 'buscando', 'extrayendo', 'normalizando', 'completado'] as const
    for (let s = 0; s < states.length - 1; s++) {
      await new Promise(r => setTimeout(r, 300 + Math.random() * 500))
      setProviderStatuses(prev => prev.map((pr, i) => i === idx ? { ...pr, state: states[s], progress: Math.round(((s + 1) / (states.length - 1)) * 100) } : pr))
    }
    if (Math.random() < 0.1) {
      setProviderStatuses(prev => prev.map((pr, i) => i === idx ? { ...pr, state: 'error', error: 'Timeout: Sin respuesta en 30s', progress: 0 } : pr))
      return []
    }
    const plans = ['Solo Hab', 'Desayuno Americano', 'Media Pension', 'All Inclusive', 'All Incl. Premium']
    const cats = ['ESTANDARD', 'SUPERIOR', 'JUNIOR SUITE', 'SUITE', 'GRAN SUITE']
    const rooms = Array.from({ length: Math.floor(2 + Math.random() * 4) }, () => ({
      proveedor: p.name, proveedorId: p.id, real: false,
      hotel: hotelName || 'Grand Fiesta Americana Coral Beach',
      categoria: cats[Math.floor(Math.random() * cats.length)],
      plan: plans[Math.floor(Math.random() * plans.length)],
      precio: Math.round(800 + Math.random() * 4500), moneda: 'MXN',
      impuestos: Math.round(80 + Math.random() * 500),
      total: 0, disponible: Math.random() > 0.1, estrellas: Math.floor(3 + Math.random() * 3),
      rating: +(6 + Math.random() * 3).toFixed(1), reviews: Math.floor(200 + Math.random() * 2000),
      imagen: `https://picsum.photos/seed/${p.id}-${Math.random().toString(36)}/400/250`,
      direccion: 'Direccion simulada', landmark: 'Centro',
    })).map(r => ({ ...r, total: r.precio + r.impuestos }))
    setProviderStatuses(prev => prev.map((pr, i) => i === idx ? { ...pr, state: 'completado', progress: 100, rooms } : pr))
    return rooms
  }

  const ejecutarBusqueda = async () => {
    setEjecutando(true); setSearchRunning(true); setSearchDone(false); setLog([])
    addLog('Iniciando motor de cotizacion multibuscador...')

    const allStatuses = [
      { id: 'makcorps', name: 'Makcorps API (REAL)', url: 'https://api.makcorps.com', status: 'active', enabled: true, state: 'conectando' as string, progress: 0, rooms: [], error: null },
      ...SIM_PROVIDERS.map(p => ({ ...p, status: 'active' as const, enabled: proveedores.includes(p.id), state: proveedores.includes(p.id) ? 'conectando' as string : 'omitido' as string, progress: 0, rooms: [], error: null }))
    ]
    setProviderStatuses(allStatuses)

    const allResults: any[] = []
    const tasks: Promise<void>[] = []

    // API REAL — Makcorps
    addLog(`Consultando API REAL Makcorps — ciudad: ${destino}`)
    tasks.push((async () => {
      try {
        setProviderStatuses(prev => prev.map((pr, i) => i === 0 ? { ...pr, state: 'navegando', progress: 20 } : pr))
        addLog(`GET https://api.makcorps.com/free/${destino.replace(/\s+/g, '-')}`)
        const hotels = await searchHotels(destino)
        addLog(`API respondio: ${hotels.length} hoteles encontrados`)

        setProviderStatuses(prev => prev.map((pr, i) => i === 0 ? { ...pr, state: 'extrayendo', progress: 60 } : pr))
        await new Promise(r => setTimeout(r, 400))

        const normalized = normalizeMakcorpsResults(hotels, 'Makcorps API')
        addLog(`Normalizados ${normalized.length} resultados. Completado.`)
        setProviderStatuses(prev => prev.map((pr, i) => i === 0 ? { ...pr, state: 'completado', progress: 100, rooms: normalized } : pr))
        allResults.push(...normalized)
      } catch (e: any) {
        addLog(`ERROR Makcorps: ${e.message}`)
        setProviderStatuses(prev => prev.map((pr, i) => i === 0 ? { ...pr, state: 'error', error: e.message, progress: 0 } : pr))
      }
    })())

    // Simulados en paralelo
    for (let i = 0; i < SIM_PROVIDERS.length; i++) {
      const idx = i + 1
      tasks.push((async () => {
        const rooms = await simulateProvider(allStatuses, idx, hotelNombre)
        allResults.push(...rooms)
      })())
    }

    await Promise.all(tasks)
    allResults.sort((a, b) => a.total - b.total)
    setResults(allResults); setEjecutando(false); setSearchRunning(false); setSearchDone(true)
    addLog(`Busqueda completada. ${allResults.length} resultados totales. Mejor precio: $${allResults[0]?.total || 0}`)

    // Guardar historial
    const quotation = {
      id: Date.now().toString(), timestamp: new Date().toISOString(),
      params: { destino, fechaIn, fechaOut, adultos, menores, edadesMenores, hotelNombre, proveedores: allStatuses.filter(p => p.enabled).map(p => p.name) },
      results: allResults,
      stats: { total: allResults.length, minPrice: allResults.length ? Math.min(...allResults.map(r => r.total)) : 0, bestProvider: allResults.length ? allResults[0].proveedor : '—' }
    }
    const hist = JSON.parse(localStorage.getItem('quotation_history') || '[]')
    hist.push(quotation)
    localStorage.setItem('quotation_history', JSON.stringify(hist))

    setTimeout(onGoResults, 500)
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-white">Nueva Cotizacion</h2>
          <p className="text-xs text-dark-400 mt-1">Makcorps Free API + 7 portales simulados — sin API Key necesaria</p>
        </div>

        {/* Banner API Real */}
        <div className="bg-dark-900 border border-success/20 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center"><Wifi className="w-5 h-5 text-success" /></div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-success">API Real Activa — Makcorps Free Hotel API</p>
              <p className="text-[10px] text-dark-400">No requiere API Key, no requiere registro. Datos reales de hoteles con precios, fotos y ratings. Endpoint: api.makcorps.com/free/{destino}</p>            </div>
            <a href="https://docs.hotelapi.co/free-hotel-api" target="_blank" rel="noopener" className="text-[10px] text-accent hover:underline">Ver docs →</a>
          </div>
        </div>

        {/* Log en vivo */}
        {log.length > 0 && (
          <div className="bg-dark-950 border border-dark-800 rounded-xl p-3 mb-6 font-mono text-[10px] leading-relaxed max-h-24 overflow-y-auto">
            {log.map((l, i) => (
              <p key={i} className={l.includes('ERROR') ? 'text-danger' : l.includes('Completado') ? 'text-success' : l.includes('API') ? 'text-accent' : 'text-dark-500'}>{l}</p>
            ))}
          </div>
        )}

        {/* Parametros */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-4 relative">
            <label className="text-[10px] uppercase tracking-wider text-dark-400 font-medium flex items-center gap-1.5 mb-2"><MapPin className="w-3 h-3" />Ciudad / Destino</label>
            <input className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent" placeholder="cancun, london, paris, dubai..." value={destino} onChange={handleDestinoChange} onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} onFocus={() => destino.length > 1 && suggestions.length > 0 && setShowSuggestions(true)} />
            {showSuggestions && (
              <div className="absolute left-4 right-4 top-full mt-1 bg-dark-800 border border-dark-600 rounded-lg shadow-xl z-50 overflow-hidden">
                {suggestions.map(city => (
                  <button key={city} onClick={() => selectSuggestion(city)} className="w-full text-left px-3 py-2 text-xs text-dark-200 hover:bg-dark-700 transition-colors capitalize">{city.replace(/-/g, ' ')}</button>
                ))}
              </div>
            )}
          </div>
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-4">
            <label className="text-[10px] uppercase tracking-wider text-dark-400 font-medium flex items-center gap-1.5 mb-2"><Building2 className="w-3 h-3" />Hotel (filtro, opcional)</label>
            <input className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent" placeholder="Filtrar por nombre..." value={hotelNombre} onChange={e => setHotelNombre(e.target.value)} />
          </div>
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-4">
            <label className="text-[10px] uppercase tracking-wider text-dark-400 font-medium flex items-center gap-1.5 mb-2"><Calendar className="w-3 h-3" />Check-in</label>
            <input type="date" className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent" value={fechaIn} onChange={e => setFechaIn(e.target.value)} />
          </div>
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-4">
            <label className="text-[10px] uppercase tracking-wider text-dark-400 font-medium flex items-center gap-1.5 mb-2"><Calendar className="w-3 h-3" />Check-out</label>
            <input type="date" className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent" value={fechaOut} onChange={e => setFechaOut(e.target.value)} />
          </div>
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-4">
            <label className="text-[10px] uppercase tracking-wider text-dark-400 font-medium flex items-center gap-1.5 mb-2"><Users className="w-3 h-3" />Adultos</label>
            <input type="number" min="1" max="10" className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent" value={adultos} onChange={e => setAdults(Number(e.target.value))} />
          </div>
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-4">
            <label className="text-[10px] uppercase tracking-wider text-dark-400 font-medium flex items-center gap-1.5 mb-2"><Users className="w-3 h-3" />Menores</label>
            <div className="flex items-center gap-2">
              <input type="number" min="0" max="6" className="flex-1 bg-dark-800 border border-dark-600 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent" value={menores} readOnly />
              <button onClick={addMenor} className="w-10 h-10 bg-dark-700 rounded-lg flex items-center justify-center hover:bg-dark-600 transition-colors text-accent"><Plus className="w-4 h-4" /></button>
              <button onClick={removeMenor} className="w-10 h-10 bg-dark-700 rounded-lg flex items-center justify-center hover:bg-dark-600 transition-colors text-danger"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        </div>

        {menores > 0 && (
          <div className="bg-dark-900 border border-warn/20 rounded-xl p-4 mb-6 animate-fade-up">
            <label className="text-[10px] uppercase tracking-wider text-warn font-medium mb-3 block">Edades de menores (dato critico para tarifa)</label>
            <div className="flex gap-3">{edadesMenores.map((edad, i) => (<div key={i} className="flex-1"><label className="text-[10px] text-dark-500 block mb-1">Menor {i + 1}</label><input type="number" min="0" max="17" className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-sm text-white text-center focus:outline-none focus:border-accent" value={edad} onChange={e => setEdad(i, Number(e.target.value))} /></div>))}</div>
          </div>
        )}

        {/* Proveedores simulados */}
        <div className="bg-dark-900 border border-dark-700 rounded-xl p-4 mb-6">
          <label className="text-[10px] uppercase tracking-wider text-dark-400 font-medium mb-3 block">Portales simulados ({proveedores.length} activos)</label>
          <div className="grid grid-cols-4 gap-2">
            {SIM_PROVIDERS.map(p => {
              const enabled = proveedores.includes(p.id)
              return (
                <button key={p.id} onClick={() => toggleProvider(p.id)} className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-medium transition-all ${enabled ? 'border-accent/40 bg-accent/10 text-accent' : 'border-dark-700 bg-dark-800 text-dark-400 hover:border-dark-500'}`}>
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${enabled ? 'bg-accent' : 'bg-dark-600'}`} /><span className="truncate">{p.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Ejecutar */}
        <div className="bg-dark-900 border border-dark-700 rounded-xl p-4 flex items-center justify-between">
          <div className="text-xs text-dark-400"><span className="text-white font-medium">{destino}</span> — {fechaIn} a {fechaOut} — {adultos} adultos{menores > 0 && `, ${menores} menores (${edadesMenores.join(', ')} anos)`}{hotelNombre && ` — "${hotelNombre}"`}</div>
          <button onClick={ejecutarBusqueda} disabled={ejecutando} className="flex items-center gap-2 bg-accent hover:bg-accent-dark disabled:bg-dark-700 disabled:text-dark-500 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all">
            {ejecutando ? <><Loader2 className="w-4 h-4 animate-spin" /> Ejecutando...</> : <><Search className="w-4 h-4" /> Ejecutar Busqueda</>}
          </button>
        </div>
      </div>
    </div>
  )
}