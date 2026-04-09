// ==========================================
// MOTOR MULTICIUDAD + MAKCORPS + WIKIPEDIA
// ==========================================

const COUNTRIES_DB: Record<string, { cities: { name: string, makcorpsQuery: string, days: number, activities: string[] }[] }> = {
  'japon': { cities: [
    { name: 'Tokyo', makcorpsQuery: 'tokyo', days: 3, activities: ['Templo Senso-ji en Asakusa', 'Cruce de Shibuya', 'Akihabara (Distrito Tecnológico)', 'Palacio Imperial'] },
    { name: 'Kyoto', makcorpsQuery: 'kyoto', days: 2, activities: ['Fushimi Inari (Torii Rojos)', 'Bosque de Bambú de Arashiyama', 'Templo Kinkaku-ji (Pabellón Dorado)'] },
    { name: 'Osaka', makcorpsQuery: 'osaka', days: 2, activities: ['Castillo de Osaka', 'Calle gastronómica Dotonbori', 'Acuario Kaiyukan'] }
  ]},
  'mexico': { cities: [
    { name: 'Cancun', makcorpsQuery: 'cancun', days: 3, activities: ['Zona Hotelera', 'Isla Mujeres', 'Parque Xcaret'] },
    { name: 'Playa del Carmen', makcorpsQuery: 'playa-del-carmen', days: 2, activities: ['Quinta Avenida', 'Cenotes snorkel', 'Ruinas de Tulum'] },
    { name: 'Mexico City', makcorpsQuery: 'mexico-city', days: 2, activities: ['Zócalo y Palacio Nacional', 'Museo de Antropología', 'Coyoacán y Frida Kahlo'] }
  ]},
  'europa': { cities: [
    { name: 'Paris', makcorpsQuery: 'paris', days: 3, activities: ['Torre Eiffel', 'Museo del Louvre', 'Barrio de Montmartre'] },
    { name: 'Madrid', makcorpsQuery: 'madrid', days: 2, activities: ['Museo del Prado', 'Palacio Real', 'Mercado de San Miguel'] },
    { name: 'Roma', makcorpsQuery: 'rome', days: 2, activities: ['Coliseo Romano', 'Vaticano y Capilla Sixtina', 'Fontana de Trevi'] }
  ]}
};

// Llamada a Makcorps
async function fetchMakcorps(cityQuery: string) {
  try {
    const res = await fetch(`https://api.makcorps.com/free/${cityQuery}`);
    if (!res.ok) throw new Error('Makcorps 404');
    const json = await res.json();
    return json.data || json.payload?.hotels || json.hotels || json || [];
  } catch (e) {
    return []; // Si falla, usaremos OSM
  }
}

// Llamada a OpenStreetMap (Open Data puro, sin API Key)
async function fetchOSMHotels(city: string) {
  try {
    const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`);
    const geoData = await geoRes.json();
    if (!geoData.length) return [];
    const query = `[out:json][timeout:10];(node["tourism"="hotel"](around:10000,${geoData[0].lat},${geoData[0].lon}););out body;`;
    const hotelRes = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
    const hotelData = await hotelRes.json();
    return hotelData.elements.filter(el => el.tags?.name).map(el => el.tags.name).slice(0, 6);
  } catch (e) { return []; }
}

export interface RoomOption { id: string; plan: string; price: number; type: string; }
export interface HotelOption { id: string; name: string; image: string; rooms: RoomOption[]; isReal: boolean; }
export interface CityPlan { name: string; days: number; activities: string[]; hotels: HotelOption[]; }
export interface FlightOption { id: string; airline: string; priceUSD: number; url: string; }
export interface TravelPlan { origin: string; country: string; startDate: string; cities: CityPlan[]; flight: FlightOption; }

export async function generateTravelPlan(origin: string, country: string, startDate: string): Promise<TravelPlan> {
  const countryKey = country.toLowerCase().trim();
  const countryData = COUNTRIES_DB[countryKey] || { cities: [{ name: country, makcorpsQuery: country, days: 5, activities: ['Explorar centro histórico', 'Visitar museos locales', 'Gastronomía típica'] }] };
  
  const vary = () => 0.9 + Math.random() * 0.2;
  const baseFlight = countryKey === 'mexico' ? 150 : countryKey === 'europa' ? 900 : 1400;

  // Vuelo principal
  const flight: FlightOption = {
    id: 'fl-1', airline: countryKey === 'mexico' ? 'Volaris / Aeromexico' : 'American Airlines / Lufthansa',
    priceUSD: Math.round(baseFlight * vary()),
    url: `https://www.google.com/search?q=vuelos+${origin}+a+${country}`
  };

  // Procesar cada ciudad en paralelo
  const citiesPromises = countryData.cities.map(async (city) => {
    const makcorpsData = await fetchMakcorps(city.makcorpsQuery);
    let hotels: HotelOption[] = [];

    // Si Makcorps respondió, extraer HOTELES con MÚLTIPLES HABITACIONES
    if (makcorpsData.length > 0) {
      hotels = makcorpsData.slice(0, 5).map((h: any, i: number) => {
        const name = h.hotelName || h.propertyName || h.name || 'Hotel Real';
        const image = h.media?.heroImage || h.image || '';
        
        // Extraer múltiples opciones de habitación (Rooms)
        let rooms: RoomOption[] = [];
        if (Array.isArray(h.rooms) && h.rooms.length > 0) {
          rooms = h.rooms.map((r: any, rIdx: number) => {
            let price = 0;
            if (r.price && typeof r.price === 'object') price = Number(r.price.amount || r.price.total || 0);
            else if (typeof r.price === 'number') price = r.price;
            else price = 100 + rIdx * 50;
            
            return {
              id: `r-${i}-${rIdx}`,
              plan: String(r.roomName || r.boardType || r.plan || `Habitación ${rIdx + 1}`).toUpperCase(),
              price: Math.round(price * vary()),
              type: rIdx === 0 ? 'Económica' : rIdx === 1 ? 'Estándar' : 'Premium/Suite'
            };
          });
        } else {
          // Si el hotel no tiene habitaciones separadas, inventamos 3 opciones de precio
          const baseP = Number(h.minPrice || h.price?.amount || 120);
          rooms = [
            { id: `r-${i}-0`, plan: 'HABITACIÓN ESTÁNDAR', price: Math.round(baseP * vary()), type: 'Económica' },
            { id: `r-${i}-1`, plan: 'HABITACIÓN SUPERIOR', price: Math.round((baseP * 1.4) * vary()), type: 'Estándar' },
            { id: `r-${i}-2`, plan: 'SUITE O JUNIOR', price: Math.round((baseP * 2.2) * vary()), type: 'Premium/Suite' }
          ];
        }

        return { id: `ht-${i}`, name, image, rooms, isReal: true };
      });
    } else {
      // FALLBACK: Usar OpenStreetMap y simular habitaciones
      const osmNames = await fetchOSMHotels(city.name);
      const fallbackNames = osmNames.length > 0 ? osmNames : [`Hotel Central ${city.name}`, `Grand Plaza ${city.name}`];
      hotels = fallbackNames.map((name, i) => {
        const baseP = 80 + i * 60;
        return {
          id: `ht-fb-${i}`, name, image: '',
          rooms: [
            { id: `rfb-${i}-0`, plan: 'HABITACIÓN ESTÁNDAR', price: Math.round(baseP * vary()), type: 'Económica' },
            { id: `rfb-${i}-1`, plan: 'HABITACIÓN DOBLE', price: Math.round((baseP * 1.5) * vary()), type: 'Estándar' },
            { id: `rfb-${i}-2`, plan: 'SUITE', price: Math.round((baseP * 2.5) * vary()), type: 'Premium/Suite' }
          ],
          isReal: osmNames.length > 0
        };
      });
    }

    return { ...city, hotels };
  });

  const cities = await Promise.all(citiesPromises);

  return { origin, country, startDate, cities, flight };
}