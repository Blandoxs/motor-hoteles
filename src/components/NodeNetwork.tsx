import { Globe, Wifi, WifiOff, AlertTriangle, RotateCw } from 'lucide-react'

const nodes = [
  { id: 'node-mx-01', ip: '187.234.12.45', country: 'Mexico', city: 'CDMX', provider: 'DigitalOcean', status: 'active', latency: 142, requests: 1243, success: 98.2, lastRotated: '2h ago' },
  { id: 'node-mx-02', ip: '189.45.67.89', country: 'Mexico', city: 'Guadalajara', provider: 'Vultr', status: 'active', latency: 98, requests: 987, success: 99.1, lastRotated: '45min ago' },
  { id: 'node-us-01', ip: '45.76.12.34', country: 'USA', city: 'Miami', provider: 'AWS', status: 'active', latency: 287, requests: 2156, success: 97.8, lastRotated: '1h ago' },
  { id: 'node-us-02', ip: '67.205.34.56', country: 'USA', city: 'Dallas', provider: 'Linode', status: 'rotating', latency: 0, requests: 876, success: 96.5, lastRotated: 'Ahora' },
  { id: 'node-co-01', ip: '200.12.45.67', country: 'Colombia', city: 'Bogota', provider: 'DigitalOcean', status: 'active', latency: 234, requests: 654, success: 97.9, lastRotated: '3h ago' },
  { id: 'node-es-01', ip: '82.156.78.90', country: 'Espana', city: 'Madrid', provider: 'Hetzner', status: 'blocked', latency: 0, requests: 0, success: 0, lastRotated: '6h ago' },
  { id: 'node-br-01', ip: '177.54.23.45', country: 'Brasil', city: 'Sao Paulo', provider: 'AWS', status: 'active', latency: 312, requests: 1432, success: 98.5, lastRotated: '30min ago' },
  { id: 'node-ar-01', ip: '190.113.45.67', country: 'Argentina', city: 'Buenos Aires', provider: 'Vultr', status: 'active', latency: 198, requests: 543, success: 99.3, lastRotated: '2h ago' },
]

export default function NodeNetwork() {
  const activeNodes = nodes.filter(n => n.status === 'active').length
  const totalRequests = nodes.reduce((s, n) => s + n.requests, 0)
  const avgLatency = Math.round(nodes.filter(n => n.latency > 0).reduce((s, n) => s + n.latency, 0) / nodes.filter(n => n.latency > 0).length)
  const avgSuccess = (nodes.filter(n => n.success > 0).reduce((s, n) => s + n.success, 0) / nodes.filter(n => n.success > 0).length).toFixed(1)

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-lg font-bold text-white">Red de Nodos de Salida</h2><p className="text-xs text-dark-400 mt-1">Infraestructura distribuida para prevencion de bloqueos de credenciales</p></div>
        <button className="flex items-center gap-1.5 bg-dark-800 border border-dark-700 px-3 py-1.5 rounded-lg text-xs text-dark-300 hover:border-dark-500 transition-colors"><RotateCw className="w-3 h-3" /> Rotar IPs</button>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-dark-900 border border-dark-700 rounded-xl p-4"><p className="text-[10px] text-dark-400 uppercase">Nodos Activos</p><p className="text-2xl font-bold text-success mt-1">{activeNodes}/{nodes.length}</p></div>
        <div className="bg-dark-900 border border-dark-700 rounded-xl p-4"><p className="text-[10px] text-dark-400 uppercase">Requests Hoy</p><p className="text-2xl font-bold text-white mt-1">{totalRequests.toLocaleString()}</p></div>
        <div className="bg-dark-900 border border-dark-700 rounded-xl p-4"><p className="text-[10px] text-dark-400 uppercase">Latencia Prom.</p><p className="text-2xl font-bold text-warn mt-1">{avgLatency}ms</p></div>
        <div className="bg-dark-900 border border-dark-700 rounded-xl p-4"><p className="text-[10px] text-dark-400 uppercase">Tasa Exito</p><p className="text-2xl font-bold text-accent mt-1">{avgSuccess}%</p></div>
      </div>

      <div className="space-y-2">
        {nodes.map(n => (
          <div key={n.id} className={`bg-dark-900 border rounded-xl p-4 flex items-center gap-4 ${n.status === 'blocked' ? 'border-danger/30' : n.status === 'rotating' ? 'border-warn/30' : 'border-dark-700'}`}>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${n.status === 'active' ? 'bg-success/10' : n.status === 'rotating' ? 'bg-warn/10' : 'bg-danger/10'}`}>
              {n.status === 'active' ? <Wifi className="w-4 h-4 text-success" /> : n.status === 'rotating' ? <RotateCw className="w-4 h-4 text-warn animate-spin" /> : <WifiOff className="w-4 h-4 text-danger" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">{n.id}</span>
                <span className="text-[10px] font-mono text-dark-400">{n.ip}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${n.status === 'active' ? 'bg-success/10 text-success' : n.status === 'rotating' ? 'bg-warn/10 text-warn' : 'bg-danger/10 text-danger'}`}>{n.status.toUpperCase()}</span>
                {n.status === 'blocked' && <AlertTriangle className="w-3 h-3 text-danger" />}
              </div>
              <p className="text-[10px] text-dark-500">{n.city}, {n.country} — {n.provider}</p>
            </div>
            <div className="text-right text-xs font-mono">
              <p className={n.latency > 250 ? 'text-warn' : 'text-dark-300'}>{n.latency > 0 ? `${n.latency}ms` : '—'}</p>
              <p className="text-dark-500 text-[10px]">{n.requests} req</p>
              <p className={Number(n.success) > 98 ? 'text-success' : 'text-dark-400'}>{n.success}%</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-dark-500">Rotacion: {n.lastRotated}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}