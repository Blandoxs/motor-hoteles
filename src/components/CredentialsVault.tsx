import { useState } from 'react'
import { Shield, Eye, EyeOff, Key, Lock } from 'lucide-react'

const credentials = [
  { id: 'bedsonline', provider: 'BedsOnline', user: 'agencia_maya_cancun', pass: '•••••••••••', lastUsed: '2025-07-18 14:32', status: 'valida', rotation: '30 dias' },
  { id: 'hotelbeds', provider: 'Hotelbeds', user: 'HTL_MX_2025_PRO', pass: '•••••••••••', lastUsed: '2025-07-18 14:32', status: 'valida', rotation: '30 dias' },
  { id: 'jactravel', provider: 'JAC Travel', user: 'JAC_MEXICO_MAIN', pass: '•••••••••••', lastUsed: '2025-07-17 09:15', status: 'valida', rotation: '15 dias' },
  { id: 'tourico', provider: 'Tourico Holidays', user: 'TOURICO_LATAM_B2B', pass: '•••••••••••', lastUsed: '2025-07-18 14:32', status: 'por_rotar', rotation: '15 dias' },
  { id: 'restel', provider: 'Restel Distribucion', user: 'RESTEL_DISTRIB_2025', pass: '•••••••••••', lastUsed: '2025-07-16 11:45', status: 'valida', rotation: '60 dias' },
  { id: 'mystays', provider: 'MyStays Group', user: 'MYSTAYS_B2B_MX', pass: '•••••••••••', lastUsed: '2025-07-18 14:32', status: 'valida', rotation: '30 dias' },
  { id: 'travco', provider: 'Travco', user: 'TRAVCO_LATAM_QRO', pass: '•••••••••••', lastUsed: '2025-07-10 08:20', status: 'expirada', rotation: '30 dias' },
  { id: 'cotizador_propio', provider: 'Cotizador Propio', user: 'admin_sistema', pass: '•••••••••••', lastUsed: '2025-07-18 14:32', status: 'valida', rotation: 'N/A' },
]

export default function CredentialsVault() {
  const [showPass, setShowPass] = useState<Record<string, boolean>>({})
  const toggle = (id: string) => setShowPass(p => ({ ...p, [id]: !p[id] }))

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><Shield className="w-5 h-5 text-accent" />Boveda de Credenciales</h2>
          <p className="text-xs text-dark-400 mt-1">Almacenamiento cifrado de sesiones autorizadas para cada portal de proveedor</p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-dark-400"><Lock className="w-3 h-3" />AES-256 Encrypted</div>
      </div>

      <div className="space-y-3">
        {credentials.map(c => (
          <div key={c.id} className="bg-dark-900 border border-dark-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-dark-800 rounded-lg flex items-center justify-center"><Key className="w-4 h-4 text-accent" /></div>
                <div>
                  <h4 className="text-sm font-semibold text-white">{c.provider}</h4>
                  <p className="text-[10px] text-dark-500 font-mono">{c.id}@portal.local</p>
                </div>
              </div>
              <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full font-semibold ${c.status === 'valida' ? 'bg-success/10 text-success' : c.status === 'por_rotar' ? 'bg-warn/10 text-warn' : 'bg-danger/10 text-danger'}`}>
                {c.status === 'valida' ? 'VALIDA' : c.status === 'por_rotar' ? 'POR ROTAR' : 'EXPIRADA'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div><p className="text-dark-500 mb-0.5">Usuario</p><p className="font-mono text-dark-200">{c.user}</p></div>
              <div><p className="text-dark-500 mb-0.5">Password</p><p className="font-mono text-dark-200 flex items-center gap-2">{showPass[c.id] ? 'cifrado_en_vault' : c.pass}<button onClick={() => toggle(c.id)} className="text-dark-500 hover:text-accent">{showPass[c.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}</button></p></div>
              <div><p className="text-dark-500 mb-0.5">Rotacion</p><p className="font-mono text-dark-300">{c.rotation}</p></div>
            </div>
            <p className="text-[10px] text-dark-600 mt-2">Ultimo uso: {c.lastUsed}</p>
          </div>
        ))}
      </div>
    </div>
  )
}