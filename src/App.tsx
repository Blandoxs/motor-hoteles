import { useState } from 'react'
import SearchPanel from './components/SearchPanel'
import ResultsPanel from './components/ResultsPanel'
import EngineMonitor from './components/EngineMonitor'
import CredentialsVault from './components/CredentialsVault'
import NodeNetwork from './components/NodeNetwork'
import History from './components/History'
import Lobby from './components/Lobby'
import TravelPlanner from './components/TravelPlanner'
import { Search, Shield, Activity, Globe, Clock, Bookmark, Plane } from 'lucide-react'

type Tab = 'lobby' | 'travel' | 'search' | 'results' | 'engine' | 'history' | 'vault' | 'nodes'

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('search')
  const [searchRunning, setSearchRunning] = useState(false)
  const [searchDone, setSearchDone] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [providerStatuses, setProviderStatuses] = useState<any[]>([])

  const tabs: { id: Tab; label: string; icon: typeof Search }[] = [
    { id: 'lobby', label: 'Reservaciones', icon: Bookmark },
    { id: 'travel', label: 'Viajes Int.', icon: Plane },
    { id: 'search', label: 'Busqueda', icon: Search },
    { id: 'results', label: 'Resultados', icon: Globe },
    { id: 'engine', label: 'Motor', icon: Activity },
    { id: 'history', label: 'Historial', icon: Clock },
    { id: 'vault', label: 'Boveda', icon: Shield },
    { id: 'nodes', label: 'Nodos', icon: Globe },
  ]

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-dark-900 border-b border-dark-700 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center"><Globe className="w-4 h-4 text-white" /></div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide">MOTOR DE COTIZACION MULTIBUSCADOR</h1>
            <p className="text-[10px] text-dark-400 font-mono">MOTOR HÍBRIDO INTELIGENTE — DATOS REALES GARANTIZADOS</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {searchRunning && <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-accent animate-pulse" /><span className="text-xs text-accent font-mono font-medium">EJECUTANDO...</span></div>}
          {searchDone && <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-success" /><span className="text-xs text-success font-mono font-medium">COMPLETADO</span></div>}
          <div className="text-[10px] text-dark-500 font-mono">{new Date().toLocaleString('es-MX')}</div>
        </div>
      </header>
      <nav className="bg-dark-900 border-b border-dark-700 px-6 flex gap-1 flex-shrink-0">
        {tabs.map(t => {
          const Icon = t.icon; const active = activeTab === t.id
          const disabled = t.id === 'results' && !searchDone
          return (
            <button key={t.id} onClick={() => !disabled && setActiveTab(t.id)} className={`px-4 py-2.5 text-xs font-medium flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${active ? 'border-accent text-accent' : disabled ? 'border-transparent text-dark-600 cursor-not-allowed' : 'border-transparent text-dark-400 hover:text-dark-200 hover:border-dark-600'}`}>
              <Icon className="w-3.5 h-3.5" />{t.label}
            </button>
          )
        })}
      </nav>
      <main className="flex-1 overflow-hidden">
        {activeTab === 'lobby' && <Lobby />}
        {activeTab === 'travel' && <TravelPlanner />}
        {activeTab === 'search' && <SearchPanel setSearchRunning={setSearchRunning} setSearchDone={setSearchDone} setResults={setResults} setProviderStatuses={setProviderStatuses} onGoResults={() => setActiveTab('results')} />}
        {activeTab === 'results' && <ResultsPanel results={results} providerStatuses={providerStatuses} />}
        {activeTab === 'engine' && <EngineMonitor providerStatuses={providerStatuses} searchRunning={searchRunning} />}
        {activeTab === 'history' && <History />}
        {activeTab === 'vault' && <CredentialsVault />}
        {activeTab === 'nodes' && <NodeNetwork />}
      </main>
    </div>
  )
}