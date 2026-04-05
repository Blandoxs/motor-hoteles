import { useEffect, useState } from 'react'
import { Activity, CheckCircle2, XCircle, Loader2, Wifi } from 'lucide-react'

interface Props { providerStatuses: any[]; searchRunning: boolean }

const stateConfig: Record<string, { icon: typeof Loader2; color: string; label: string }> = {
  omitido: { icon: Wifi, color: 'text-dark-600', label: 'OMITIDO' },
  conectando: { icon: Loader2, color: 'text-warn', label: 'CONECTANDO' },
  autenticando: { icon: Loader2, color: 'text-accent-light', label: 'AUTENTICANDO' },
  navegando: { icon: Loader2, color: 'text-accent', label: 'NAVEGANDO' },
  buscando: { icon: Loader2, color: 'text-accent', label: 'BUSCANDO' },
  extrayendo: { icon: Loader2, color: 'text-purple-400', label: 'EXTRAYENDO' },
  normalizando: { icon: Loader2, color: 'text-cyan-400', label: 'NORMALIZANDO' },
  completado: { icon: CheckCircle2, color: 'text-success', label: 'COMPLETADO' },
  error: { icon: XCircle, color: 'text-danger', label: 'ERROR' },
}

export default function EngineMonitor({ providerStatuses, searchRunning }: Props) {
  const [logs, setLogs] = useState<string[]>([])

  useEffect(() => {
    if (!searchRunning && providerStatuses.length === 0) return
    const active = providerStatuses.filter(p => p.enabled && p.state !== 'omitido' && p.state !== 'completado' && p.state !== 'error')
    active.forEach(p => {
      const msg = `[${new Date().toLocaleTimeString('es-MX')}] [${p.id.toUpperCase()}] Estado: ${p.state.toUpperCase()} — ${p.url}`
      setLogs(prev => {
        if (prev.length > 0 && prev[prev.length - 1].includes(p.id) && prev[prev.length - 1].includes(p.state)) return prev
        return [...prev.slice(-50), msg]
      })
    })
  }, [providerStatuses, searchRunning])

  return (
    <div className="h-full overflow-y-auto p-6">
      <h2 className="text-lg font-bold text-white mb-1">Monitor del Motor</h2>
      <p className="text-xs text-dark-400 mb-6">Vista en tiempo real de cada proceso de extraccion por portal</p>

      {/* Provider cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {providerStatuses.map((p, i) => {
          const cfg = stateConfig[p.state] || stateConfig.omitido
          const Icon = cfg.icon
          const spin = !['omitido', 'completado', 'error'].includes(p.state)
          return (
            <div key={i} className={`bg-dark-900 border rounded-xl p-4 transition-all ${p.state === 'error' ? 'border-danger/30' : p.state === 'completado' ? 'border-success/20' : p.state === 'omitido' ? 'border-dark-800' : 'border-accent/20 pulse-glow'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${cfg.color} ${spin ? 'animate-spin' : ''}`} />
                  <span className="text-sm font-medium text-white">{p.name}</span>
                </div>
                <span className={`text-[10px] font-mono font-semibold ${cfg.color}`}>{cfg.label}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-dark-500 font-mono truncate mb-2">{p.url}</div>
              {p.state !== 'omitido' && (
                <div className="w-full bg-dark-800 rounded-full h-1.5 mb-2">
                  <div className={`h-1.5 rounded-full transition-all duration-500 ${p.state === 'error' ? 'bg-danger' : p.state === 'completado' ? 'bg-success' : 'bg-accent'}`} style={{ width: `${p.progress}%` }} />
                </div>
              )}
              {p.state === 'completado' && <p className="text-[10px] text-success">{p.rooms?.length || 0} habitaciones extraidas</p>}
              {p.state === 'error' && <p className="text-[10px] text-danger">{p.error}</p>}
            </div>
          )
        })}
      </div>

      {/* Log */}
      <div className="bg-dark-900 border border-dark-700 rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 border-b border-dark-700 flex items-center gap-2"><Activity className="w-3.5 h-3.5 text-accent" /><span className="text-[10px] uppercase tracking-wider text-dark-400 font-medium">Log de ejecucion</span></div>
        <div className="h-48 overflow-y-auto p-4 font-mono text-[11px] leading-relaxed">
          {logs.length === 0 ? <p className="text-dark-600">Esperando ejecucion de busqueda...</p> : logs.map((l, i) => (
            <p key={i} className={`${l.includes('ERROR') ? 'text-danger' : l.includes('COMPLETADO') ? 'text-success' : 'text-dark-400'}`}>{l}</p>
          ))}
        </div>
      </div>
    </div>
  )
}