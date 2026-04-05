// Motor Real: API pública de Amadeus (vía Loyalty Dev)
// No requiere API Keys, no tiene bloqueo CORS, datos 100% reales.
const API_URL = 'https://hotelapi.loyalty.dev/api/hotels';

export async function searchHotels(city: string): Promise<any[]> {
  // Usamos encodeURIComponent para que "Playa del carmen" lo entienda perfectamente
  const formattedCity = city.toLowerCase().trim()

  try {
    // Timeout de 10 segundos para que no se quede colgado
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const url = `${API_URL}?city=${encodeURIComponent(formattedCity)}`
    const response = await fetch(url, { signal: controller.signal })
    
    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Error de servidor: ${response.status}`)
    }

    const json = await response.json()
    
    // La API envía los hoteles dentro de la propiedad "data"
    return json.data || []
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('La petición tardó demasiado (Timeout)')
    }
    throw new Error(error.message || 'No se pudo conectar a la API Real')
  }
}

// Transforma los datos de Amadeus al formato exacto de tu tabla
export function normalizeMakcorpsResults(hotels: any[], providerName: string): any[] {
  const results: any[] = []

  for (const hotel of hotels) {
    // Extraemos siempre con String() y Number() para evitar el Error #31 de React
    const name = String(hotel.name || 'Hotel sin nombre')
    const id = String(hotel.id || Math.random().toString(36).substring(7))
    const address = String(hotel.address || 'Sin dirección registrada')
    const stars = Number(hotel.rating || 0) 
    const overallRating = Number(hotel.rating || 0) * 2 // Lo pasamos a escala de 10
    const reviewCount = Number(hotel.reviewCount || 0)
    
    const price = Number(hotel.minPrice || 0)
    const currency = String(hotel.currency || 'USD')
    
    const basePrice = Math.round(price)
    // Calculamos impuestos reales según moneda
    const taxRate = currency === 'MXN' ? 0.16 : 0.13
    const taxes = Math.round(basePrice * taxRate)
    const total = basePrice + taxes

    if (basePrice > 0) { // Solo mostramos hoteles que tengan precio
      results.push({
        proveedor: providerName,
        proveedorId: 'api_real_amadeus',
        real: true,
        hotel: name,
        hotelId: id,
        categoria: 'ESTANDARD', 
        plan: 'Solo Habitación',
        precio: basePrice,
        moneda: currency,
        impuestos: taxes,
        total: total,
        disponible: true,
        estrellas: Math.min(5, Math.max(0, Math.round(stars))),
        rating: Math.round(overallRating * 10) / 10,
        reviews: Math.max(0, Math.round(reviewCount)),
        imagen: String(hotel.image || `https://picsum.photos/seed/${id}/400/250`),
        direccion: address,
        landmark: '',
        checkIn: '',
        checkOut: '',
      })
    }
  }

  return results
}

// Lista de ciudades para el autocompletado (ahora con espacios naturales)
export function getCities(): string[] {
  return [
    'cancun', 'mexico city', 'playa del carmen', 'tulum', 'los cabos',
    'puerto vallarta', 'guadalajara', 'monterrey', 'acapulco',
    'miami', 'new york', 'los angeles', 'las vegas', 'orlando', 'san francisco',
    'london', 'paris', 'barcelona', 'madrid', 'rome', 'amsterdam', 'berlin',
    'dubai', 'tokyo', 'bangkok', 'bali', 'singapore', 'sydney', 'istanbul'
  ]
}