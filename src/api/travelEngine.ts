// Base de datos de destinos internacionales con itinerarios reales
const DESTINATIONS_DB: Record<string, { country: string; currency: string; dailyCost: number; flightBaseCost: number; itinerary: { day: number; title: string; description: string }[] }> = {
  'japon': {
    country: 'Japón', currency: 'JPY', dailyCost: 80, flightBaseCost: 1800,
    itinerary: [
      { day: 1, title: 'Llegada a Tokio', description: 'Traslado al hotel en Shinjuku. Paseo por la iluminación nocturna de Shibuya.' },
      { day: 2, title: 'Tokio Tradicional', description: 'Visita al templo Senso-ji en Asakusa y recorrido por el Palacio Imperial.' },
      { day: 3, title: 'Tokio Moderno', description: 'Akihabara, distrito tecnológico. Cruce famoso en Shibuya y compras en Harajuku.' },
      { day: 4, title: 'Viaje a Kioto', description: 'Viaje en Shinkansen (Tren bala). Llegada y visita al bosque de Bambú de Arashiyama.' },
      { day: 5, title: 'Kioto Histórico', description: 'Templo Kinkaku-ji (Pabellón Dorado) y barrio de Geishas en Gion.' },
      { day: 6, title: 'Osaka', description: 'Viaje a Osaka. Castillo de Osaka y calle Dotonbori para gastronomía.' }
    ]
  },
  'madrid': {
    country: 'España', currency: 'EUR', dailyCost: 60, flightBaseCost: 900,
    itinerary: [
      { day: 1, title: 'Llegada a Madrid', description: 'Check-in. Paseo por la Gran Vía y visita a la Puerta del Sol.' },
      { day: 2, title: 'Arte y Cultura', description: 'Museo del Prado y paseo por el Retiro (Barco y Cristal Palace).' },
      { day: 3, title: 'Madrid Histórico', description: 'Palacio Real, Catedral de la Almudena y mercado de San Miguel.' },
      { day: 4, title: 'Toledo (Excursión)', description: 'Viaje en tren AVE a Toledo. Ciudad de las tres culturas.' }
    ]
  },
  'paris': {
    country: 'Francia', currency: 'EUR', dailyCost: 70, flightBaseCost: 950,
    itinerary: [
      { day: 1, title: 'Llegada a París', description: 'Traslado, cruce del Sena y primera vista de la Torre Eiffel de noche.' },
      { day: 2, title: 'Iconos de París', description: 'Visita a la Torre Eiffel, paseo por los Campos Elíseos y Arco del Triunfo.' },
      { day: 3, title: 'Museos', description: 'Museo del Louvre (Mona Lisa) y paseo por el barrio de Montmartre.' },
      { day: 4, title: 'Versalles', description: 'Excursión de medio día al Palacio de Versalles y sus jardines.' }
    ]
  },
  'new york': {
    country: 'Estados Unidos', currency: 'USD', dailyCost: 90, flightBaseCost: 600,
    itinerary: [
      { day: 1, title: 'Llegada a NYC', description: 'Times Square al estilo debutante y cena en Manhattan.' },
      { day: 2, title: 'Estatua y Downtown', description: 'Ferry a la Estatua de la Libertad, Wall Street y Memorial 9/11.' },
      { day: 3, title: 'Arte y Central Park', description: 'Museo MET, caminata por Central Park y Fifth Avenue.' },
      { day: 4, title: 'Brooklyn', description: 'Cruce del Brooklyn Bridge, DUMBO y pizza auténtica en Brooklyn.' }
    ]
  },
  'cancun': {
    country: 'México', currency: 'MXN', dailyCost: 50, flightBaseCost: 200,
    itinerary: [
      { day: 1, title: 'Llegada a Cancún', description: 'Check-in en zona hotelera, relax en la playa.' },
      { day: 2, title: 'Isla Mujeres', description: 'Ferry a Isla Mujeres, snorkel y playa Norte.' },
      { day: 3, title: 'Riviera Maya', description: 'Excursión a Xcaret o Xel-Há (Parques eco-arqueológicos).' }
    ]
  }
};

// Lógica de cálculo de vuelos según origen
function calculateFlightCost(origin: string, baseCost: number): number {
  const originLower = origin.toLowerCase();
  const isMexico = originLower.includes('mexico') || originLower.includes('chihuahua') || originLower.includes('juarez') || originLower.includes('cdmx') || originLower.includes('monterrey');
  
  if (isMexico) {
    if (baseCost <= 300) return baseCost + Math.round(Math.random() * 100); // Vuelos nacionales
    return baseCost + 200 + Math.round(Math.random() * 300); // Latam -> Internacional
  }
  return baseCost; // Resto del mundo
}

export interface TravelPlan {
  origin: string;
  destination: string;
  country: string;
  days: number;
  flightCostUSD: number;
  dailyCostUSD: number;
  hotelCostUSD: number;
  totalCostUSD: number;
  itinerary: { day: number; title: string; description: string }[];
}

export function generateTravelPlan(origin: string, destination: string, days: number): TravelPlan | null {
  const destKey = destination.toLowerCase().trim();
  const destData = DESTINATIONS_DB[destKey];

  if (!destData) return null; // Destino no soportado

  // Ajustar itinerario si piden más o menos días
  const maxDays = destData.itinerary.length;
  const finalDays = Math.min(days, maxDays);
  const adjustedItinerary = destData.itinerary.slice(0, finalDays);

  // Si piden más días de los que hay, rellenamos con "Día Libre"
  for (let i = finalDays; i < days; i++) {
    adjustedItinerary.push({ day: i + 1, title: `Día Libre en ${destData.country}`, description: 'Día libre para explorar, compras o descansar.' });
  }

  const flightCost = calculateFlightCost(origin, destData.flightBaseCost);
  const dailyCost = destData.dailyCost * days;
  const hotelCost = (destData.dailyCost * 0.8) * days; // El hotel suele ser 80% del costo diario
  const total = flightCost + dailyCost + hotelCost;

  return {
    origin, destination, country: destData.country, days,
    flightCostUSD: flightCost,
    dailyCostUSD: dailyCost,
    hotelCostUSD: hotelCost,
    totalCostUSD: total,
    itinerary: adjustedItinerary
  };
}

export function getAvailableDestinations() {
  return Object.keys(DESTINATIONS_DB).map(key => ({
    id: key,
    name: DESTINATIONS_DB[key].country,
    baseFlight: DESTINATIONS_DB[key].flightBaseCost
  }));
}