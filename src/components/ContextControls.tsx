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
    icon: <Snowflake className="w-3.5 h-3.5" />,
  },
  {
    id: 'chilly',
    label: '쌀쌀해요',
    feel: 'chilly',
    condition: 'cloudy',
    temp: 10,
    icon: <Wind className="w-3.5 h-3.5" />,
  },
  {
    id: 'mild',
    label: '선선해요',
    feel: 'mild',
    condition: 'clear',
    temp: 19,
    icon: <Sun className="w-3.5 h-3.5" />,
  },
  {
    id: 'hot',
    label: '더워요',
    feel: 'hot',
    condition: 'clear',
    temp: 31,
    icon: <Flame className="w-3.5 h-3.5" />,
  },
  {
    id: 'rain',
    label: '비 와요',
    feel: 'chilly',
    condition: 'rain',
    temp: 13,
    icon: <CloudRain className="w-3.5 h-3.5" />,
  },
  {
    id: 'snow',
    label: '눈 와요',
    feel: 'cold',
    condition: 'snow',
    temp: -2,
    icon: <CloudSnow className="w-3.5 h-3.5" />,
  },
];

const BUDGET_OPTIONS: { value: BudgetRange; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'under10k', label: '~1만원' },
  { value: '10kTo15k', label: '1~1.5만원' },
  { value: 'over15k', label: '1.5만원+' },
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
    <section className="bg-white rounded-3xl border border-stone-200/80 shadow-xs p-4 sm:p-6 space-y-5">
      {/* Row 1: Yesterday life condition toggles */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#E85D2A]" />
            오늘의 생활 컨디션
          </h2>
          <span className="text-[11px] text-stone-400">
            조건을 바꾸면 추천 순위가 즉시 변동돼요
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Yesterday Weekend Toggle */}
          <button
            type="button"
            onClick={() =>
              onChange({ wasWeekendYesterday: !context.wasWeekendYesterday })
            }
            className={`group flex items-center justify-between p-3.5 rounded-2xl border text-left transition cursor-pointer ${
              context.wasWeekendYesterday
                ? 'bg-amber-50/90 border-amber-300 shadow-2xs'
                : 'bg-stone-50/70 border-stone-200 hover:border-stone-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition ${
                  context.wasWeekendYesterday
                    ? 'bg-amber-500 text-white'
                    : 'bg-white text-stone-500 border border-stone-200'
                }`}
              >
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-stone-900">
                    어제가 주말·휴일이었어요
                  </span>
                  {autoWeekendDetected && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-amber-200/80 text-amber-900">
                      자동
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  월요병 활력 메뉴 또는 가벼운 리셋 메뉴 가중치
                </p>
              </div>
            </div>
            <div
              className={`w-11 h-6 rounded-full p-0.5 transition shrink-0 ${
                context.wasWeekendYesterday ? 'bg-amber-500' : 'bg-stone-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                  context.wasWeekendYesterday ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </button>

          {/* Yesterday Company Dinner Toggle */}
          <button
            type="button"
            onClick={() =>
              onChange({ hadCompanyDinner: !context.hadCompanyDinner })
            }
            className={`group flex items-center justify-between p-3.5 rounded-2xl border text-left transition cursor-pointer ${
              context.hadCompanyDinner
                ? 'bg-orange-50/90 border-[#E85D2A]/50 shadow-2xs'
                : 'bg-stone-50/70 border-stone-200 hover:border-stone-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition ${
                  context.hadCompanyDinner
                    ? 'bg-[#E85D2A] text-white'
                    : 'bg-white text-stone-500 border border-stone-200'
                }`}
              >
                <Beer className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-stone-900">
                  어제 회식·음주했어요
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  해장 국물·속 편한 메뉴 우선 추천, 기름진 음식 제외
                </p>
              </div>
            </div>
            <div
              className={`w-11 h-6 rounded-full p-0.5 transition shrink-0 ${
                context.hadCompanyDinner ? 'bg-[#E85D2A]' : 'bg-stone-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                  context.hadCompanyDinner ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </button>
        </div>
      </div>

      {/* Row 2: Weather Condition & Simulator */}
      <div className="pt-1 border-t border-stone-100">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <span className="text-xs font-bold text-stone-600">
            날씨 반영
            {liveWeather && !context.isWeatherSimulated && (
              <span className="ml-2 font-normal text-stone-400">
                실시간 {Math.round(liveWeather.temperatureC)}°C (체감{' '}
                {Math.round(liveWeather.apparentTemperatureC)}°C · {liveWeather.description})
              </span>
            )}
          </span>
          {context.isWeatherSimulated && liveWeather && (
            <button
              type="button"
              onClick={onResetLiveWeather}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#E85D2A] hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              실시간 날씨로 복원
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
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
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
                  isActive
                    ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                    : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                }`}
              >
                {wp.icon}
                {wp.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Row 3: Dining constraints (Budget, Companion, Pace, Dedup) */}
      <div className="pt-1 border-t border-stone-100 grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Budget */}
        <div>
          <label className="text-xs font-semibold text-stone-500 flex items-center gap-1 mb-1.5">
            <Wallet className="w-3.5 h-3.5" /> 예산/가격대
          </label>
          <div className="grid grid-cols-4 gap-1 bg-stone-100 p-1 rounded-xl">
            {BUDGET_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ budget: opt.value })}
                className={`py-1.5 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
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

        {/* Companion */}
        <div>
          <label className="text-xs font-semibold text-stone-500 flex items-center gap-1 mb-1.5">
            <Users className="w-3.5 h-3.5" /> 함께하는 사람
          </label>
          <div className="grid grid-cols-3 gap-1 bg-stone-100 p-1 rounded-xl">
            {COMPANION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ companion: opt.value })}
                className={`py-1.5 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
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

        {/* Pace */}
        <div>
          <label className="text-xs font-semibold text-stone-500 flex items-center gap-1 mb-1.5">
            <Clock className="w-3.5 h-3.5" /> 식사 속도
          </label>
          <div className="grid grid-cols-3 gap-1 bg-stone-100 p-1 rounded-xl">
            {PACE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ pace: opt.value })}
                className={`py-1.5 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
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

      {/* Row 4: Category filter & Recent duplicate prevention */}
      <div className="pt-1 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => onChange({ selectedCategories: [] })}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
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
                className={`px-2.5 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
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

        <div className="inline-flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-stone-500">
            <History className="w-3.5 h-3.5" />
            중복 제외
          </span>
          <div className="inline-flex items-center gap-0.5 bg-stone-100 p-0.5 rounded-xl border border-stone-200/70">
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
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
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
