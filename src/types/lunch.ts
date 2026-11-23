export type MenuCategory = '한식' | '중식' | '일식' | '양식' | '아시안/분식' | '가벼운식사';

export type WeatherFeel = 'cold' | 'chilly' | 'mild' | 'warm' | 'hot';

export type WeatherCondition = 'clear' | 'cloudy' | 'rain' | 'snow';

export type BudgetRange = 'all' | 'under10k' | '10kTo15k' | 'over15k';

export type DiningCompanion = 'solo' | 'colleagues' | 'team';

export type MealPace = 'fast' | 'normal' | 'relaxed';

export type ActiveTab = 'recommend' | 'picker' | 'history';

export type MenuTag =
  | 'hangover'
  | 'soup'
  | 'hot'
  | 'cool'
  | 'rainy'
  | 'mondayBoost'
  | 'light'
  | 'spicy'
  | 'aromatic'
  | 'ramen'
  | 'hearty'
  | 'greasy'
  | 'noodle'
  | 'rice';

export interface MenuItem {
  id: string;
  name: string;
  emoji: string;
  category: MenuCategory;
  priceRange: Exclude<BudgetRange, 'all'>;
  avgPrice: number;
  description: string;
  searchKeyword: string;
  tags: MenuTag[];
  soloFriendly: boolean;
  groupFriendly: boolean;
  fastServe: boolean;
  relaxedMood: boolean;
  kcalApprox: number;
  isFavoriteSpot?: boolean;
  signatureMenus?: string[];
  lat?: number;
  lon?: number;
  address?: string;
}

export interface LunchContext {
  wasWeekendYesterday: boolean;
  hadCompanyDinner: boolean;
  noPickActive: boolean;
  ryeolPickActive: boolean;
  seonPickActive: boolean;
  weatherFeel: WeatherFeel;
  weatherCondition: WeatherCondition;
  temperatureC: number | null;
  apparentTemperatureC: number | null;
  isWeatherSimulated: boolean;
  budget: BudgetRange;
  companion: DiningCompanion;
  pace: MealPace;
  excludeRecentDays: number;
  selectedCategories: MenuCategory[];
}

export interface ScoredMenu extends MenuItem {
  score: number;
  matchPercent: number;
  matchReasons: string[];
  penaltyReasons: string[];
  isRecentlyEaten: boolean;
  lastEatenDaysAgo: number | null;
}

export interface LunchHistoryEntry {
  id: string;
  menuId: string;
  menuName: string;
  emoji: string;
  category: MenuCategory;
  date: string; // YYYY-MM-DD
  timestamp: number;
  contextSnapshot: {
    hadCompanyDinner: boolean;
    wasWeekendYesterday: boolean;
    weatherSummary: string;
    locationName: string;
  };
}

export interface LocationPreset {
  id: string;
  name: string;
  district: string;
  lat: number;
  lon: number;
}

export interface LocationState {
  lat: number;
  lon: number;
  name: string;
  district: string;
  source: 'gps' | 'preset';
  loading: boolean;
  error?: string;
}

export interface LiveWeatherData {
  temperatureC: number;
  apparentTemperatureC: number;
  precipitationMm: number;
  weatherCode: number;
  condition: WeatherCondition;
  feel: WeatherFeel;
  description: string;
  fetchedAt: number;
}
