import { useState } from 'react'
import { Plane, MapPin, Calendar, DollarSign, FileDown, Loader2, AlertTriangle } from 'lucide-react'
import { generateTravelPlan, getAvailableDestinations, TravelPlan } from '../api/travelEngine'
import jsPDF from 'jspdf'

export default function TravelPlanner() {
  const [origen, setOrigen] = useState('Cd. Juarez')
  const [destino, setDestino] = useState('japon')
  const [dias, setDias] = useState(5)
  const [plan, setPlan] = useState<TravelPlan | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const destinos = getAvailableDestinations()

  const buscarPlan = () => {
    setError('')
    setPlan(null)
    setLoading(true)
    // Simulamos el tiempo de cálculo del motor algorítmico
    setTimeout(() => {
      const result = generateTravelPlan(origen, destino, dias)
      if (result) {
        setPlan(result)
      } else {
        setError(`El destino "${destino}" no está en nuestra base de datos. Prueba con: ${destinos.map(d => d.id).join(', ')}`)
      }
      setLoading(false)
    }, 1500)
  }

  const generatePDF = () => {
    if (!plan) return
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(15, 23, 42); // dark-900
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text("ITINERARIO DE VIAJE", pageWidth / 2, 20, { align: "center" });
    doc.setFontSize(10);
    doc.text("Generado por Motor de Cotización Multibuscador", pageWidth / 2, 30, { align: "center" });

    // Info General
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`Origen: ${plan.origin}`, 20, 55);
    doc.text(`Destino: ${plan.destination} (${plan.country})`, 20, 65);
    doc.text(`Duración: ${plan.days} Días / ${plan.days - 1} Noches`, 20, 75);

    // Costos (Tabla simple)
    doc.setFillColor(241, 245, 249); // gray-100
    doc.rect(15, 85, pageWidth - 30, 35, 'F');
    doc.setFontSize(11);
    doc.setTextColor(55, 65, 81);
    doc.text("Cotización Estimada (USD):", 20, 95);
    doc.text(`Vuelo Internacional:        $${plan.flightCostUSD.toLocaleString()}`, 20, 105);
    doc.text(`Hospedaje (${plan.days-1} noches):      $${plan.hotelCostUSD.toLocaleString()}`, 20, 112);

    doc.setFontSize(14);
    doc.setTextColor(22, 163, 74); // success
    doc.text(`TOTAL ESTIMADO: $${plan.totalCostUSD.toLocaleString()} USD`, 20, 128);

    // Itinerario
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text("Itinerario Día a Día", 20, 145);

    let y = 155;
    plan.itinerary.forEach(item => {
      if (y > 270) { doc.addPage(); y = 20; } // Salto de página
      doc.setFontSize(11);
      doc.setTextColor(59, 130, 246); // accent
      doc.text(`Día ${item.day}: ${item.title}`, 20, y);
      doc.setFontSize(10);
      doc.setTextColor(75, 85, 99); // gray-600
      const splitDesc = doc.splitTextToSize(item.description, pageWidth - 40);
      doc.text(splitDesc, 25, y + 6);
      y += 15 + (splitDesc.length * 5);
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Página ${i} de ${pageCount}`, pageWidth / 2, 290, { align: "center" });
    }

    doc.save(`Viaje_${plan.destination}_${plan.days}dias.pdf`);
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-white">Planeador de Viajes Internacionales</h2>
          <p className="text-xs text-dark-400 mt-1">Crea itinerarios reales y descarga cotizaciones en PDF</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-4">
            <label className="text-[10px] uppercase tracking-wider text-dark-400 font-medium flex items-center gap-1.5 mb-2"><Plane className="w-3 h-3" />Ciudad de Origen</label>
            <input className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent" placeholder="Ej: Cd. Juarez" value={origen} onChange={e => setOrigen(e.target.value)} />
          </div>
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-4">
            <label className="text-[10px] uppercase tracking-wider text-dark-400 font-medium flex items-center gap-1.5 mb-2"><MapPin className="w-3 h-3" />Destino Internacional</label>
            <select className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent" value={destino} onChange={e => setDestino(e.target.value)}>
              {destinos.map(d => <option key={d.id} value={d.id}>{d.name} (Vuelo base ~${d.baseFlight})</option>)}
            </select>
          </div>
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-4">
            <label className="text-[10px] uppercase tracking-wider text-dark-400 font-medium flex items-center gap-1.5 mb-2"><Calendar className="w-3 h-3" />Días de Viaje</label>
            <input type="number" min="1" max="15" className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent" value={dias} onChange={e => setDias(Number(e.target.value))} />
          </div>
        </div>

        <button onClick={buscarPlan} disabled={loading} className="w-full bg-accent hover:bg-accent-dark disabled:bg-dark-700 text-white py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 mb-6">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Calculando ruta y precios...</> : <><Plane className="w-4 h-4" /> Generar Itinerario y Cotización</>}
        </button>

        {error && (
          <div className="bg-danger/10 border border-danger/30 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        {plan && (
          <div className="space-y-6 animate-fade-up">
            {/* Resumen de Costos */}
            <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2"><DollarSign className="w-4 h-4 text-success" /> Cotización Estimada: {plan.origin} → {plan.country}</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-dark-800 rounded-lg p-3"><p className="text-dark-500 text-[10px]">Vuelo Internacional</p><p className="text-lg font-bold text-white">${plan.flightCostUSD} <span className="text-xs text-dark-400 font-normal">USD</span></p></div>
                <div className="bg-dark-800 rounded-lg p-3"><p className="text-dark-500 text-[10px]">Hospedaje ({plan.days-1} noches)</p><p className="text-lg font-bold text-white">${plan.hotelCostUSD} <span className="text-xs text-dark-400 font-normal">USD</span></p></div>
                <div className="bg-dark-800 rounded-lg p-3"><p className="text-dark-500 text-[10px]">Comida y Traslad.</p><p className="text-lg font-bold text-white">${plan.dailyCostUSD} <span className="text-xs text-dark-400 font-normal">USD</span></p></div>
              </div>
              <div className="mt-4 border-t border-dark-700 pt-4 flex justify-between items-center">
                <span className="text-dark-400 font-medium">TOTAL ESTIMADO:</span>
                <span className="text-2xl font-bold text-success">${plan.totalCostUSD.toLocaleString()} USD</span>
              </div>
            </div>

            {/* Itinerario */}
            <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2"><MapPin className="w-4 h-4 text-accent" /> Itinerario Detallado</h3>
              <div className="space-y-3">
                {plan.itinerary.map((item) => (
                  <div key={item.day} className="bg-dark-800 border-l-4 border-accent p-4 rounded-r-lg">
                    <h4 className="text-sm font-bold text-accent mb-1">Día {item.day}: {item.title}</h4>
                    <p className="text-xs text-dark-300 leading-relaxed">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Botón PDF */}
            <button onClick={generatePDF} className="w-full bg-success hover:bg-success-dark text-white py-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-success/20">
              <FileDown className="w-5 h-5" /> Descargar Cotización en PDF
            </button>
          </div>
        )}
      </div>
    </div>
  )
}