import { useState } from 'react'
import { Plane, MapPin, Calendar, FileDown, Loader2, Star, ExternalLink, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'
import { generateTravelPlan } from '../api/travelEngine'
import jsPDF from 'jspdf'

interface TravelPlan {
  origin: string; country: string; startDate: string;
  cities: { name: string; days: number; activities: string[]; hotels: { id: string; name: string; image: string; rooms: { id: string; plan: string; price: number; type: string }[]; isReal: boolean }[] }[];
  flight: { id: string; airline: string; priceUSD: number; url: string };
}

const fixText = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ñ/g, "n");

export default function TravelPlanner() {
  const [origen, setOrigen] = useState('Chihuahua')
  const [pais, setPais] = useState('Japon')
  const [fechaIn, setFechaIn] = useState('2025-09-15')
  const [plan, setPlan] = useState<TravelPlan | null>(null)
  const [loading, setLoading] = useState(false)
  const [openCity, setOpenCity] = useState<string | null>(null)
  // Guarda las habitaciones seleccionadas por ciudad: { 'Tokyo': 'r-0-1', 'Kyoto': 'r-1-2' }
  const [selectedRooms, setSelectedRooms] = useState<Record<string, string>>({})

  const buscarPlan = async () => {
    setLoading(true); setPlan(null); setSelectedRooms({}); setOpenCity(null)
    const data = await generateTravelPlan(origen, pais, fechaIn)
    setPlan(data); setLoading(false)
  }

  const totalCalculado = () => {
    if (!plan) return 0
    let total = plan.flight.priceUSD
    plan.cities.forEach(city => {
      const roomId = selectedRooms[city.name];
      if (roomId) {
        const hotel = city.hotels.find(h => h.rooms.some(r => r.id === roomId));
        const room = hotel?.rooms.find(r => r.id === roomId);
        if (room) total += room.price * city.days;
      }
    });
    return total
  }

  const generatePDF = () => {
    if (!plan) return;
    const doc = new jsPDF();
    const w = doc.internal.pageSize.getWidth();
    let y = 20;

    doc.setFillColor(15, 23, 42); doc.rect(0, 0, w, 35, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(20); doc.text("ITINERARIO MULTICIUDAD", w/2, 15, {align:"center"});
    doc.setFontSize(10); doc.text(fixText(plan.origin) + " ➡ " + fixText(plan.country) + " | Inicio: " + plan.startDate, w/2, 25, {align:"center"});
    y = 45;

    doc.setTextColor(59, 130, 246); doc.setFontSize(12); doc.text("VUELO PRINCIPAL", 20, y);
    doc.setTextColor(30); doc.setFontSize(10); doc.text("Aerolinea: " + fixText(plan.flight.airline), 20, y+7);
    doc.setTextColor(22, 163, 74); doc.text("$" + plan.flight.priceUSD + " USD", 150, y+7);
    y += 20;

    plan.cities.forEach(city => {
      if(y > 240) { doc.addPage(); y = 20; }
      doc.setFillColor(240, 240, 255); doc.roundedRect(15, y-5, w-30, 15, 3, 3, 'F');
      doc.setTextColor(15, 23, 42); doc.setFontSize(12); doc.text(fixText(city.name) + " (" + city.days + " dias)", 25, y+3);
      y += 20;

      doc.setFontSize(9); doc.setTextColor(100); doc.text("Que hacer:", 25, y);
      city.activities.forEach(act => { y += 5; doc.text("- " + fixText(act), 30, y); });
      y += 10;

      const roomId = selectedRooms[city.name];
      if (roomId) {
        const hotel = city.hotels.find(h => h.rooms.some(r => r.id === roomId));
        const room = hotel?.rooms.find(r => r.id === roomId);
        if (hotel && room) {
          doc.setTextColor(22, 163, 74); doc.text("Hotel Seleccionado: " + fixText(hotel.name), 25, y); y+=6;
          doc.setTextColor(30); doc.text("Habitacion: " + fixText(room.plan), 25, y); y+=6;
          doc.setTextColor(80); doc.text("$" + room.price + " USD x " + city.days + " noches = $" + (room.price * city.days) + " USD", 25, y); y+=15;
        }
      } else {
        doc.setTextColor(150); doc.text("(No se selecciono hotel para esta ciudad)", 25, y); y+=15;
      }
    });

    if(y > 250) { doc.addPage(); y = 20; }
    doc.setDrawColor(0); doc.line(25, y, w-25, y); y+=10;
    doc.setTextColor(30); doc.setFontSize(14); doc.text("TOTAL ESTIMADO DEL VIAJE:", 25, y);
    doc.setTextColor(22, 163, 74); doc.setFontSize(18); doc.text("$" + totalCalculado().toLocaleString() + " USD", 150, y);

    doc.save("Viaje_" + fixText(plan.country) + ".pdf");
  }

  return (
    <div className="h-full overflow-y-auto p-6 bg-dark-950">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2"><Plane className="w-5 h-5 text-accent" /> Planeador Multiciudad (Makcorps + OpenData)</h2>
          <p className="text-xs text-dark-400 mt-1">Escribe el país (Japon, Mexico, Europa). Se generará un itinerario divido por ciudades con múltiples opciones de habitación reales.</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-4">
            <label className="text-[10px] uppercase tracking-wider text-dark-400 font-medium flex items-center gap-1.5 mb-2"><Plane className="w-3 h-3" />Origen</label>
            <input className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent" value={origen} onChange={e => setOrigen(e.target.value)} />
          </div>
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-4">
            <label className="text-[10px] uppercase tracking-wider text-dark-400 font-medium flex items-center gap-1.5 mb-2"><MapPin className="w-3 h-3" />País / Región</label>
            <input className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent" placeholder="Japon, Mexico, Europa..." value={pais} onChange={e => setPais(e.target.value)} />
          </div>
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-4">
            <label className="text-[10px] uppercase tracking-wider text-dark-400 font-medium flex items-center gap-1.5 mb-2"><Calendar className="w-3 h-3" />Fecha de Salida</label>
            <input type="date" className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent" value={fechaIn} onChange={e => setFechaIn(e.target.value)} />
          </div>
        </div>

        <button onClick={buscarPlan} disabled={loading} className="w-full bg-accent hover:bg-accent-dark disabled:bg-dark-700 text-white py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 mb-8">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Consultando Makcorps por cada ciudad...</> : <><Plane className="w-4 h-4" /> Generar Itinerario Multiciudad</>}
        </button>

        {plan && (
          <div className="space-y-6">
            {/* Vuelo Principal */}
            <div className="bg-dark-900 border border-accent/30 rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="text-xs text-dark-400">VUELO PRINCIPAL {plan.origin} ➡ {plan.country}</p>
                <p className="text-lg font-bold text-white">{plan.flight.airline}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-success">${plan.flight.priceUSD} USD</p>
                <a href={plan.flight.url} target="_blank" rel="noopener" className="text-[10px] text-accent hover:underline flex items-center gap-1 justify-end"><ExternalLink className="w-3 h-3"/>Buscar vuelo real</a>
              </div>
            </div>

            {/* Ciudades */}
            {plan.cities.map((city) => (
              <div key={city.name} className="border border-dark-700 rounded-xl overflow-hidden">
                <button onClick={() => setOpenCity(openCity === city.name ? null : city.name)} className="w-full bg-dark-900 p-4 flex justify-between items-center hover:bg-dark-800 transition-colors">
                  <div className="text-left">
                    <h3 className="text-base font-bold text-white">{city.name} <span className="text-xs text-dark-400 font-normal">({city.days} días)</span></h3>
                    <div className="flex gap-2 mt-1">{city.activities.slice(0, 2).map((a, i) => <span key={i} className="text-[9px] bg-dark-800 text-dark-300 px-2 py-0.5 rounded">{a}</span>)}</div>
                  </div>
                  {openCity === city.name ? <ChevronUp className="w-5 h-5 text-dark-400" /> : <ChevronDown className="w-5 h-5 text-dark-400" />}
                </button>

                {openCity === city.name && (
                  <div className="p-4 border-t border-dark-800 bg-dark-950">
                    {/* Actividades */}
                    <div className="mb-4 grid grid-cols-2 gap-2">
                      {city.activities.map((act, i) => (
                        <div key={i} className="bg-dark-900 border border-dark-700 rounded-lg p-2 text-xs text-dark-300 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0"></div>
                          {act}
                        </div>
                      ))}
                    </div>

                    {/* Hoteles y Habitaciones */}
                    <h4 className="text-xs font-bold text-dark-400 mb-3 uppercase">Selecciona Habitación para {city.name}</h4>
                    <div className="space-y-3">
                      {city.hotels.map(hotel => (
                        <div key={hotel.id} className="bg-dark-900 border border-dark-700 rounded-xl p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                              {hotel.image && <img src={hotel.image} className="w-12 h-12 rounded-lg object-cover" />}
                              <div>
                                <p className="text-sm font-bold text-white">{hotel.name}</p>
                                {hotel.isReal && <span className="text-[8px] bg-success/10 text-success px-1.5 py-0.5 rounded">DATOS REALES</span>}
                              </div>
                            </div>
                            <a href={`https://www.google.com/search?q=${encodeURIComponent(hotel.name)}`} target="_blank" rel="noopener" className="text-[10px] text-accent hover:underline flex items-center gap-1"><ExternalLink className="w-3 h-3"/>Ver</a>
                          </div>
                          
                          <div className="space-y-2">
                            {hotel.rooms.map(room => {
                              const isSelected = selectedRooms[city.name] === room.id;
                              const totalRoom = room.price * city.days;
                              return (
                                <div key={room.id} onClick={() => setSelectedRooms({...selectedRooms, [city.name]: room.id})} 
                                  className={`cursor-pointer border rounded-lg p-3 flex justify-between items-center transition-all ${isSelected ? 'border-success bg-success/10' : 'border-dark-700 hover:border-dark-500'}`}>
                                  <div className="flex items-center gap-2">
                                    {isSelected ? <CheckCircle2 className="w-4 h-4 text-success" /> : <div className="w-4 h-4 rounded-full border border-dark-600" />}
                                    <div>
                                      <p className="text-xs font-semibold text-white">{room.plan}</p>
                                      <p className="text-[10px] text-dark-500">{room.type} — ${room.price} USD/noche</p>
                                    </div>
                                  </div>
                                  <p className="text-sm font-bold text-white">${totalRoom} USD <span className="text-[10px] text-dark-400 font-normal">total</span></p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Resumen Final */}
            <div className="bg-dark-900 border-2 border-accent/30 rounded-xl p-6 sticky bottom-0">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-dark-400">PRESUPUESTO MULTICIUDAD</p>
                  <p className="text-2xl font-bold text-white mt-1">${totalCalculado().toLocaleString()} USD</p>
                </div>
                <button onClick={generatePDF} className="bg-success hover:bg-success-dark text-white px-8 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg">
                  <FileDown className="w-5 h-5" /> Descargar PDF Completo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}