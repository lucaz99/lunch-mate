import React from 'react';
import {
  Beer,
  CalendarDays,
  CloudRain,
  CloudSnow,
  Clock,
  Flame,
  History,
  RotateCcw,
  Snowflake,
  Sparkles,
  Sun,
  Users,
  Wallet,
  Wind,
} from 'lucide-react';
import { MENU_CATEGORIES } from '../data/menus';
import {
  BudgetRange,
  DiningCompanion,
  LiveWeatherData,
  LunchContext,
  MealPace,
  MenuCategory,
  WeatherCondition,
  WeatherFeel,
} from '../types/lunch';

interface ContextControlsProps {
  context: LunchContext;
  liveWeather: LiveWeatherData | null;
  autoWeekendDetected: boolean;
  onChange: (patch: Partial<LunchContext>) => void;
  onResetLiveWeather: () => void;
}

const WEATHER_PRESETS: {
  id: string;
  label: string;
  feel: WeatherFeel;
  condition: WeatherCondition;
  temp: number;
  icon: React.ReactNode;
}[] = [
  {
    id: 'cold',
    label: '추워요',
    feel: 'cold',
    condition: 'clear',
    temp: 1,
    icon: <Snowflake className="w-3 h-3" />,
  },
  {
    id: 'chilly',
    label: '쌀쌀',
    feel: 'chilly',
    condition: 'cloudy',
    temp: 10,
    icon: <Wind className="w-3 h-3" />,
  },
  {
    id: 'mild',
    label: '선선',
    feel: 'mild',
    condition: 'clear',
    temp: 19,
    icon: <Sun className="w-3 h-3" />,
  },
  {
    id: 'hot',
    label: '더워요',
    feel: 'hot',
    condition: 'clear',
    temp: 31,
    icon: <Flame className="w-3 h-3" />,
  },
  {
    id: 'rain',
    label: '비 와요',
    feel: 'chilly',
    condition: 'rain',
    temp: 13,
    icon: <CloudRain className="w-3 h-3" />,
  },
  {
    id: 'snow',
    label: '눈 와요',
    feel: 'cold',
    condition: 'snow',
    temp: -2,
    icon: <CloudSnow className="w-3 h-3" />,
  },
];

const BUDGET_OPTIONS: { value: BudgetRange; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'under10k', label: '~1만' },
  { value: '10kTo15k', label: '1~1.5만' },
  { value: 'over15k', label: '1.5만+' },
];

const COMPANION_OPTIONS: { value: DiningCompanion; label: string }[] = [
  { value: 'solo', label: '혼밥' },
  { value: 'colleagues', label: '동료 2~4명' },
  { value: 'team', label: '팀 점심' },
];

const PACE_OPTIONS: { value: MealPace; label: string }[] = [
  { value: 'fast', label: '빠르게' },
  { value: 'normal', label: '보통' },
  { value: 'relaxed', label: '여유롭게' },
];

export const ContextControls: React.FC<ContextControlsProps> = ({
  context,
  liveWeather,
  autoWeekendDetected,
  onChange,
  onResetLiveWeather,
}) => {
  const toggleCategory = (cat: MenuCategory) => {
    const exists = context.selectedCategories.includes(cat);
    const next = exists
      ? context.selectedCategories.filter((c) => c !== cat)
      : [...context.selectedCategories, cat];
    onChange({ selectedCategories: next });
  };

  return (
    <section className="bg-white rounded-2xl border border-stone-200/80 shadow-xs p-3.5 sm:p-4 space-y-3">
      {/* Row 1: Yesterday life condition toggles + Weather simulator */}
      <div className="flex flex-col xl:flex-row xl:items-center gap-3">
        {/* Two compact condition toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 xl:w-[470px] shrink-0">
          <button
            type="button"
            onClick={() =>
              onChange({ wasWeekendYesterday: !context.wasWeekendYesterday })
            }
            className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition cursor-pointer ${
              context.wasWeekendYesterday
                ? 'bg-amber-50/90 border-amber-300'
                : 'bg-stone-50/70 border-stone-200 hover:border-stone-300'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition ${
                  context.wasWeekendYesterday
                    ? 'bg-amber-500 text-white'
                    : 'bg-white text-stone-500 border border-stone-200'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-stone-900 truncate">
                    전일 주말·휴일
                  </span>
                  {autoWeekendDetected && (
                    <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-amber-200/80 text-amber-900 shrink-0">
                      자동
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-stone-500 truncate">
                  월요병 활력 · 가벼운 리셋
                </p>
              </div>
            </div>
            <div
              className={`w-8 h-4.5 rounded-full p-0.5 transition shrink-0 ml-2 ${
                context.wasWeekendYesterday ? 'bg-amber-500' : 'bg-stone-300'
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full bg-white shadow-xs transition-transform ${
                  context.wasWeekendYesterday ? 'translate-x-3.5' : 'translate-x-0'
                }`}
              />
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              onChange({ hadCompanyDinner: !context.hadCompanyDinner })
            }
            className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition cursor-pointer ${
              context.hadCompanyDinner
                ? 'bg-orange-50/90 border-[#E85D2A]/50'
                : 'bg-stone-50/70 border-stone-200 hover:border-stone-300'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition ${
                  context.hadCompanyDinner
                    ? 'bg-[#E85D2A] text-white'
                    : 'bg-white text-stone-500 border border-stone-200'
                }`}
              >
                <Beer className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-stone-900 truncate">
                  어제 회식·음주
                </div>
                <p className="text-[10px] text-stone-500 truncate">
                  해장 국물 · 속 편한 메뉴
                </p>
              </div>
            </div>
            <div
              className={`w-8 h-4.5 rounded-full p-0.5 transition shrink-0 ml-2 ${
                context.hadCompanyDinner ? 'bg-[#E85D2A]' : 'bg-stone-300'
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full bg-white shadow-xs transition-transform ${
                  context.hadCompanyDinner ? 'translate-x-3.5' : 'translate-x-0'
                }`}
              />
            </div>
          </button>
        </div>

        {/* Weather Condition & Simulator */}
        <div className="flex-1 flex flex-wrap items-center gap-1.5 xl:pl-2 xl:border-l border-stone-100">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-stone-500 mr-0.5">
            <Sparkles className="w-3 h-3 text-[#E85D2A]" />
            날씨
          </span>
          {WEATHER_PRESETS.map((wp) => {
            const isActive =
              context.weatherFeel === wp.feel &&
              context.weatherCondition === wp.condition;
            return (
              <button
                key={wp.id}
                type="button"
                onClick={() =>
                  onChange({
                    weatherFeel: wp.feel,
                    weatherCondition: wp.condition,
                    temperatureC: wp.temp,
                    apparentTemperatureC: wp.temp,
                    isWeatherSimulated: true,
                  })
                }
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition cursor-pointer ${
                  isActive
                    ? 'bg-stone-900 text-white border-stone-900'
                    : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                }`}
              >
                {wp.icon}
                {wp.label}
              </button>
            );
          })}
          {context.isWeatherSimulated && liveWeather && (
            <button
              type="button"
              onClick={onResetLiveWeather}
              className="inline-flex items-center gap-0.5 text-[11px] font-bold text-[#E85D2A] hover:underline cursor-pointer ml-1"
            >
              <RotateCcw className="w-3 h-3" />
              실시간
            </button>
          )}
        </div>
      </div>

      {/* Row 2: Dining constraints (Budget, Companion, Pace) */}
      <div className="pt-2.5 border-t border-stone-100 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-stone-500 flex items-center gap-1 shrink-0 w-12">
            <Wallet className="w-3 h-3" /> 예산
          </span>
          <div className="flex-1 grid grid-cols-4 gap-0.5 bg-stone-100 p-0.5 rounded-lg">
            {BUDGET_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ budget: opt.value })}
                className={`py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                  context.budget === opt.value
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-stone-500 flex items-center gap-1 shrink-0 w-12">
            <Users className="w-3 h-3" /> 동행
          </span>
          <div className="flex-1 grid grid-cols-3 gap-0.5 bg-stone-100 p-0.5 rounded-lg">
            {COMPANION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ companion: opt.value })}
                className={`py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                  context.companion === opt.value
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-stone-500 flex items-center gap-1 shrink-0 w-12">
            <Clock className="w-3 h-3" /> 속도
          </span>
          <div className="flex-1 grid grid-cols-3 gap-0.5 bg-stone-100 p-0.5 rounded-lg">
            {PACE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ pace: opt.value })}
                className={`py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                  context.pace === opt.value
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Category filter & Explicit Recent Duplicate Exclusion buttons */}
      <div className="pt-2.5 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => onChange({ selectedCategories: [] })}
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition cursor-pointer ${
              context.selectedCategories.length === 0
                ? 'bg-[#E85D2A] text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            전체 종류
          </button>
          {MENU_CATEGORIES.map((cat) => {
            const active = context.selectedCategories.includes(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition cursor-pointer ${
                  active
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        <div className="inline-flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-500">
            <History className="w-3 h-3" />
            중복 제외
          </span>
          <div className="inline-flex items-center gap-0.5 bg-stone-100 p-0.5 rounded-lg border border-stone-200/70">
            {(
              [
                { days: 3, label: '최근 3일' },
                { days: 5, label: '최근 5일' },
                { days: 0, label: 'OFF' },
              ] as const
            ).map((opt) => {
              const active = context.excludeRecentDays === opt.days;
              return (
                <button
                  key={opt.days}
                  type="button"
                  onClick={() => onChange({ excludeRecentDays: opt.days })}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition cursor-pointer ${
                    active
                      ? opt.days > 0
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-stone-800 text-white shadow-2xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
