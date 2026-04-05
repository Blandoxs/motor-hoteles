// Lista de proxies CORS gratuitos para evitar el bloqueo del navegador
const CORS_PROXIES = [
  '', // Intenta directo primero
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
]

// Función inteligente que intenta conectar por varios caminos
async function fetchWithFallback(url: string): Promise<any> {
  let lastError: any = null
  
  for (const proxy of CORS_PROXIES) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 12000) // 12 segundos max por intento
      
      const finalUrl = proxy ? `${proxy}${encodeURIComponent(url)}` : url
      const res = await fetch(finalUrl, { signal: controller.signal })
      clearTimeout(timeoutId)
      
      if (res.ok) {
        const data = await res.json()
        return data
      }
    } catch (err: any) {
      lastError = err
      continue // Si falla este proxy, prueba el siguiente
    }
  }
  
  throw new Error(`No se pudo conectar a Makcorps: ${lastError?.message || 'Todos los proxies fallaron'}`)
}

// Busca hoteles reales en la API
export async function searchHotels(city: string): Promise<any[]> {
  const formattedCity = city.toLowerCase().trim().replace(/\s+/g, '-')
  const url = `https://api.makcorps.com/free/${formattedCity}`
  
  const rawData = await fetchWithFallback(url)
  
  // La API puede devolver los datos en diferentes estructuras, manejamos todas:
  if (Array.isArray(rawData)) return rawData
  if (rawData?.payload?.hotels && Array.isArray(rawData.payload.hotels)) return rawData.payload.hotels
  if (rawData?.data && Array.isArray(rawData.data)) return rawData.data
  if (rawData?.results && Array.isArray(rawData.results)) return rawData.results
  if (rawData?.hotels && Array.isArray(rawData.hotels)) return rawData.hotels
  
  // Si la estructura es desconocida, devolvemos vacío para no romper la UI
  console.warn('Estructura de API inesperada:', rawData)
  return []
}

// Transforma los datos crudos de la API en el formato exacto que espera ResultsPanel
export function normalizeMakcorpsResults(hotels: any[], providerName: string): any[] {
  const results: any[] = []

  for (const hotel of hotels) {
    // 1. EXTRAER DATOS BÁSICOS (Siempre con String() o Number() para evitar Error #31 de React)
    const name = String(hotel.hotelName || hotel.propertyName || hotel.name || 'Hotel sin nombre')
    const id = String(hotel.hotelId || hotel.propertyId || hotel.id || Math.random().toString(36).substring(7))
    const address = String(hotel.streetAddress || hotel.address || hotel.location || hotel.city || 'Sin dirección')
    const stars = Number(hotel.starRating || hotel.stars || hotel.classification || 0)
    
    // 2. EXTRAER IMÁGENES (Busca en varios lugares posibles)
    let mainImage = ''
    if (hotel.media?.heroImage) mainImage = String(hotel.media.heroImage)
    else if (hotel.media?.images && Array.isArray(hotel.media.images) && hotel.media.images.length > 0) mainImage = String(hotel.media.images[0])
    else if (hotel.image) mainImage = String(hotel.image)
    else if (hotel.imageUrl) mainImage = String(hotel.imageUrl)
    else if (hotel.thumbnail) mainImage = String(hotel.thumbnail)
    
    // Si no hay imagen, generamos una real usando el nombre del hotel
    if (!mainImage || mainImage === 'undefined') {
      mainImage = `https://picsum.photos/seed/${id}/400/250`
    }

    // 3. EXTRAER RATING
    let overallRating = 0
    let reviewCount = 0
    if (hotel.rating && typeof hotel.rating === 'object') {
      overallRating = Number(hotel.rating.overall || hotel.rating.score || 0)
      reviewCount = Number(hotel.rating.count || hotel.rating.reviews || 0)
    } else if (typeof hotel.rating === 'number') {
      overallRating = hotel.rating
    }
    reviewCount = Number(hotel.reviewCount || hotel.totalReviews || reviewCount || 0)

    // 4. EXTRAER HABITACIONES Y PRECIOS
    const rooms = Array.isArray(hotel.rooms) ? hotel.rooms : []
    
    if (rooms.length > 0) {
      // Si hay habitaciones, creamos un resultado por cada tipo de habitación
      for (const room of rooms) {
        let priceAmount = 0
        let currency = 'USD'
        
        // Extraer precio de forma segura (puede estar en room.price.amount o room.price directamente)
        if (room.price && typeof room.price === 'object') {
          priceAmount = Number(room.price.amount || room.price.base || room.price.total || 0)
          currency = String(room.price.currency || 'USD')
        } else if (typeof room.price === 'number') {
          priceAmount = room.price
        }

        const basePrice = Math.round(priceAmount)
        const taxRate = currency === 'MXN' ? 0.16 : 0.13
        const taxes = Math.round(basePrice * taxRate)
        const total = basePrice + taxes

        if (basePrice > 0) { // Solo agregar si tiene precio válido
          results.push({
            proveedor: providerName,
            proveedorId: 'makcorps',
            real: true,
            hotel: name,
            hotelId: id,
            categoria: String(room.roomName || room.roomType || 'ESTANDARD').toUpperCase(),
            plan: String(room.boardType || room.mealPlan || room.boardName || 'Solo Habitación'),
            precio: basePrice,
            moneda: currency,
            impuestos: taxes,
            total: total,
            disponible: String(room.available || room.status) !== 'false',
            estrellas: Math.min(5, Math.max(0, Math.round(stars))),
            rating: Math.round(overallRating * 10) / 10,
            reviews: Math.max(0, Math.round(reviewCount)),
            imagen: mainImage,
            direccion: address,
            landmark: '',
            checkIn: String(room.checkIn || hotel.checkIn || ''),
            checkOut: String(room.checkOut || hotel.checkOut || ''),
          })
        }
      }
    } else {
      // Si no hay habitaciones separadas, sacar el precio general del hotel
      let priceAmount = 0
      let currency = 'USD'
      
      if (hotel.price && typeof hotel.price === 'object') {
        priceAmount = Number(hotel.price.amount || hotel.price.min || hotel.price.total || 0)
        currency = String(hotel.price.currency || 'USD')
      } else if (typeof hotel.price === 'number' || typeof hotel.minPrice === 'number') {
        priceAmount = Number(hotel.price || hotel.minPrice || 0)
      }

      const basePrice = Math.round(priceAmount)
      const taxRate = currency === 'MXN' ? 0.16 : 0.13
      const taxes = Math.round(basePrice * taxRate)
      const total = basePrice + taxes

      if (basePrice > 0) {
        results.push({
          proveedor: providerName,
          proveedorId: 'makcorps',
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
          imagen: mainImage,
          direccion: address,
          landmark: '',
          checkIn: '',
          checkOut: '',
        })
      }
    }
  }

  return results
}

// Lista de ciudades soportadas por la API para el autocompletado
export function getCities(): string[] {
  return [
    'cancun', 'mexico-city', 'playa-del-carmen', 'tulum', 'los-cabos',
    'puerto-vallarta', 'guadalajara', 'monterrey', 'riviera-maya', 'acapulco',
    'miami', 'new-york', 'los-angeles', 'las-vegas', 'orlando', 'san-francisco',
    'london', 'paris', 'barcelona', 'madrid', 'rome', 'amsterdam', 'berlin',
    'dubai', 'tokyo', 'bangkok', 'bali', 'singapore', 'sydney', 'istanbul'
  ]
}