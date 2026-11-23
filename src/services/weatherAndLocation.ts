import { LOCATION_PRESETS } from '../data/menus';
import { LiveWeatherData, WeatherCondition, WeatherFeel } from '../types/lunch';

export function classifyWeatherFeel(apparentTempC: number): WeatherFeel {
  if (apparentTempC <= 5) return 'cold';
  if (apparentTempC <= 13) return 'chilly';
  if (apparentTempC <= 21) return 'mild';
  if (apparentTempC <= 27) return 'warm';
  return 'hot';
}

export function classifyWmoCode(code: number): {
  condition: WeatherCondition;
  description: string;
} {
  if (code === 0) return { condition: 'clear', description: '맑음' };
  if (code >= 1 && code <= 3) return { condition: 'cloudy', description: '구름 조금·흐림' };
  if (code === 45 || code === 48) return { condition: 'cloudy', description: '안개' };
  if (
    (code >= 51 && code <= 67) ||
    (code >= 80 && code <= 82) ||
    code >= 95
  ) {
    return { condition: 'rain', description: code >= 95 ? '뇌우·비' : '비' };
  }
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return { condition: 'snow', description: '눈' };
  }
  return { condition: 'cloudy', description: '흐림' };
}

export async function fetchOpenMeteoWeather(
  lat: number,
  lon: number
): Promise<LiveWeatherData> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}` +
    `&current=temperature_2m,apparent_temperature,precipitation,weather_code&timezone=auto`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`날씨 정보를 불러오지 못했어요 (HTTP ${res.status})`);
  }
  const data = await res.json();
  const current = data?.current;
  if (!current) {
    throw new Error('날씨 데이터 형식이 올바르지 않아요.');
  }

  const temperatureC = Math.round(Number(current.temperature_2m) * 10) / 10;
  const apparentTemperatureC = Math.round(Number(current.apparent_temperature) * 10) / 10;
  const precipitationMm = Number(current.precipitation ?? 0);
  const weatherCode = Number(current.weather_code ?? 0);

  const { condition, description } = classifyWmoCode(weatherCode);
  const feel = classifyWeatherFeel(apparentTemperatureC);

  return {
    temperatureC,
    apparentTemperatureC,
    precipitationMm,
    weatherCode,
    condition: precipitationMm > 0.2 && condition !== 'snow' ? 'rain' : condition,
    feel,
    description,
    fetchedAt: Date.now(),
  };
}

export async function reverseGeocodeKorean(
  lat: number,
  lon: number
): Promise<{ name: string; district: string }> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&accept-language=ko`;
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });
    if (!res.ok) throw new Error('reverse geocode failed');
    const data = await res.json();
    const addr = data?.address ?? {};
    const neighbourhood =
      addr.quarter ||
      addr.neighbourhood ||
      addr.suburb ||
      addr.town ||
      addr.village ||
      addr.borough ||
      '';
    const cityDistrict = [addr.city || addr.province, addr.borough || addr.county || addr.city_district]
      .filter(Boolean)
      .join(' ');

    if (neighbourhood) {
      return {
        name: neighbourhood,
        district: cityDistrict || '현재 위치',
      };
    }
    if (cityDistrict) {
      return {
        name: cityDistrict,
        district: '현재 GPS 위치',
      };
    }
  } catch {
    // Fallback to nearest known Korean business district
  }

  const nearest = findNearestPreset(lat, lon);
  return {
    name: `${nearest.name} 부근`,
    district: nearest.district,
  };
}

function findNearestPreset(lat: number, lon: number) {
  let best = LOCATION_PRESETS[0];
  let bestDist = Infinity;
  for (const preset of LOCATION_PRESETS) {
    const d = Math.hypot(preset.lat - lat, preset.lon - lon);
    if (d < bestDist) {
      bestDist = d;
      best = preset;
    }
  }
  return best;
}

function buildMapQuery(
  locationName: string,
  keyword: string,
  isSpecificSpot?: boolean
): string {
  if (isSpecificSpot) {
    return keyword.trim();
  }
  // Remove trailing street building number (e.g. "강서구 화곡로 372" -> "강서구 화곡로") for broader restaurant search
  const cleanLoc = locationName
    .replace(' 부근', '')
    .replace(/\s+\d+(?:-\d+)?$/, '')
    .trim();
  return `${cleanLoc} ${keyword}`.trim();
}

export function buildNaverMapUrl(
  locationName: string,
  keyword: string,
  isSpecificSpot?: boolean
): string {
  const query = buildMapQuery(locationName, keyword, isSpecificSpot);
  return `https://map.naver.com/p/search/${encodeURIComponent(query)}`;
}

export function buildKakaoMapUrl(
  locationName: string,
  keyword: string,
  isSpecificSpot?: boolean,
  coords?: { lat?: number; lon?: number; label?: string }
): string {
  if (coords?.lat !== undefined && coords?.lon !== undefined) {
    const pinName = (coords.label || keyword).trim();
    return `https://map.kakao.com/link/map/${encodeURIComponent(pinName)},${coords.lat.toFixed(6)},${coords.lon.toFixed(6)}`;
  }
  const query = buildMapQuery(locationName, keyword, isSpecificSpot);
  return `https://map.kakao.com/link/search/${encodeURIComponent(query)}`;
}

export function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function formatDistanceKorean(meters: number): string {
  if (meters < 1000) {
    return `${meters}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

export function formatWeatherSummary(
  feel: WeatherFeel,
  condition: WeatherCondition,
  tempC: number | null
): string {
  const condLabel: Record<WeatherCondition, string> = {
    clear: '맑음',
    cloudy: '흐림',
    rain: '비',
    snow: '눈',
  };
  const feelLabel: Record<WeatherFeel, string> = {
    cold: '추움',
    chilly: '쌀쌀',
    mild: '선선',
    warm: '따뜻',
    hot: '더움',
  };
  if (tempC !== null) {
    return `${Math.round(tempC)}°C · ${condLabel[condition]}`;
  }
  return `${feelLabel[feel]} · ${condLabel[condition]}`;
}
