/**
 * Serviço de geolocalização e cálculo de distâncias
 */

export interface UserLocation {
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
}

export interface GeocodingResult {
  city?: string;
  state?: string;
  country?: string;
  address?: {
    road?: string;
    street?: string;
    house_number?: string;
    neighbourhood?: string;
    suburb?: string;
    sublocality?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

/**
 * Pega a localização atual do usuário
 */
export async function getUserLocation(): Promise<UserLocation | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.error('Geolocalização não suportada pelo navegador');
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Tenta descobrir a cidade via geocoding reverso
        const geocode = await reverseGeocode(latitude, longitude);

        resolve({
          latitude,
          longitude,
          city: geocode?.city,
          state: geocode?.state,
        });
      },
      (error) => {
        console.error('Erro ao obter localização:', error);
        resolve(null);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // Cache de 5 minutos
      }
    );
  });
}

/**
 * Geocoding reverso - descobre cidade a partir de coordenadas
 * Usa OpenStreetMap Nominatim (gratuito)
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<GeocodingResult | null> {
  try {
    // Zoom 18 = máximo detalhamento (rua, número, bairro)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'pt-BR',
          'User-Agent': 'PiscinaPWA/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Erro ao buscar localização');
    }

    const data = await response.json();

    if (!data || data.error) {
      throw new Error('Localização não encontrada');
    }

    const address = data.address || {};

    return {
      city: address.city || address.town || address.village || address.municipality,
      state: address.state,
      country: address.country,
      address: address, // Retorna o objeto completo de endereço
    };
  } catch (error) {
    console.error('Erro no geocoding reverso:', error);
    return null;
  }
}

/**
 * Calcula distância entre dois pontos em km (fórmula de Haversine)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Raio da Terra em km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.asin(Math.sqrt(a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Busca CEP via ViaCEP (API brasileira gratuita)
 * Usa cidade, estado e logradouro para encontrar CEP
 */
export async function searchCepByAddress(
  state: string,
  city: string,
  street: string
): Promise<string | null> {
  try {
    if (!state || !city || !street) {
      return null;
    }

    // Converte nome do estado para sigla (ViaCEP precisa da sigla)
    const stateMap: Record<string, string> = {
      'acre': 'AC', 'alagoas': 'AL', 'amapá': 'AP', 'amapa': 'AP',
      'amazonas': 'AM', 'bahia': 'BA', 'ceará': 'CE', 'ceara': 'CE',
      'distrito federal': 'DF', 'espírito santo': 'ES', 'espirito santo': 'ES',
      'goiás': 'GO', 'goias': 'GO', 'maranhão': 'MA', 'maranhao': 'MA',
      'mato grosso': 'MT', 'mato grosso do sul': 'MS', 'minas gerais': 'MG',
      'pará': 'PA', 'para': 'PA', 'paraíba': 'PB', 'paraiba': 'PB',
      'paraná': 'PR', 'parana': 'PR', 'pernambuco': 'PE', 'piauí': 'PI', 'piaui': 'PI',
      'rio de janeiro': 'RJ', 'rio grande do norte': 'RN', 'rio grande do sul': 'RS',
      'rondônia': 'RO', 'rondonia': 'RO', 'roraima': 'RR', 'santa catarina': 'SC',
      'são paulo': 'SP', 'sao paulo': 'SP', 'sergipe': 'SE', 'tocantins': 'TO'
    };

    const stateUF = stateMap[state.toLowerCase()] || state.toUpperCase();

    // Remove acentos e caracteres especiais
    const normalizeString = (str: string) =>
      str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

    const normalizedStreet = normalizeString(street);
    const normalizedCity = normalizeString(city);

    // ViaCEP: GET https://viacep.com.br/ws/{UF}/{cidade}/{logradouro}/json/
    const response = await fetch(
      `https://viacep.com.br/ws/${stateUF}/${normalizedCity}/${normalizedStreet}/json/`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    // Retorna o primeiro resultado (geralmente o mais relevante)
    if (Array.isArray(data) && data.length > 0) {
      return data[0].cep || null;
    }

    return null;
  } catch (error) {
    console.error('Erro ao buscar CEP via ViaCEP:', error);
    return null;
  }
}
