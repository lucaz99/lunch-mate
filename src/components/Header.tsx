import React, { useState } from 'react';
import {
  Cloud,
  CloudRain,
  CloudSnow,
  Dices,
  History,
  LocateFixed,
  MapPin,
  RefreshCw,
  Sparkles,
  Sun,
  ChevronDown,
  UtensilsCrossed,
} from 'lucide-react';
import { LOCATION_PRESETS } from '../data/menus';
import {
  ActiveTab,
  LiveWeatherData,
  LocationPreset,
  LocationState,
  LunchContext,
} from '../types/lunch';

interface HeaderProps {
  location: LocationState;
  liveWeather: LiveWeatherData | null;
  weatherLoading: boolean;
  weatherError: string | null;
  context: LunchContext;
  autoWeekendDetected: boolean;
  activeTab: ActiveTab;
  historyCount: number;
  onChangeTab: (tab: ActiveTab) => void;
  onRequestGps: () => void;
  onSelectPreset: (preset: LocationPreset) => void;
  onRefreshWeather: () => void;
}

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'];

export const Header: React.FC<HeaderProps> = ({
  location,
  liveWeather,
  weatherLoading,
  weatherError,
  context,
  autoWeekendDetected,
  activeTab,
  historyCount,
  onChangeTab,
  onRequestGps,
  onSelectPreset,
  onRefreshWeather,
}) => {
  const [showLocationMenu, setShowLocationMenu] = useState(false);

  const now = new Date();
  const dateLabel = `${now.getMonth() + 1}월 ${now.getDate()}일 (${WEEKDAY_KO[now.getDay()]})`;

  const renderWeatherIcon = () => {
    switch (context.weatherCondition) {
      case 'rain':
        return <CloudRain className="w-4 h-4 text-sky-600" />;
      case 'snow':
        return <CloudSnow className="w-4 h-4 text-indigo-500" />;
      case 'cloudy':
        return <Cloud className="w-4 h-4 text-stone-500" />;
      default:
        return <Sun className="w-4 h-4 text-amber-500" />;
    }
  };

  const feelTextMap = {
    cold: '추움',
    chilly: '쌀쌀',
    mild: '선선',
    warm: '따뜻',
    hot: '더움',
  };

  return (
    <header className="sticky top-0 z-30 bg-[#FAF8F4]/92 backdrop-blur-md border-b border-stone-200/80">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-5 py-2 flex flex-wrap items-center justify-between gap-2">
        {/* Left: Brand */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-[#E85D2A] text-white flex items-center justify-center shadow-sm shadow-[#E85D2A]/25">
            <UtensilsCrossed className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-base font-extrabold tracking-tight text-stone-900">
              오늘점심
            </h1>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-stone-200/80 text-stone-700">
              {dateLabel}
            </span>
            {autoWeekendDetected && (
              <span className="hidden xl:inline-flex text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                주말 직후
              </span>
            )}
          </div>
        </div>

        {/* Center / Right Cluster: Tabs right next to Location & Weather */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full lg:w-auto justify-between lg:justify-end">
          {/* Navigation Tabs */}
          <nav
            aria-label="주요 메뉴"
            className="flex items-center gap-1 bg-stone-200/75 p-1 rounded-xl order-2 sm:order-1 w-full sm:w-auto"
          >
            <button
              type="button"
              onClick={() => onChangeTab('recommend')}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'recommend'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#E85D2A]" />
              맞춤 추천
            </button>
            <button
              type="button"
              onClick={() => onChangeTab('picker')}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'picker'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Dices className="w-3.5 h-3.5 text-[#E85D2A]" />
              결정 장애 뽑기
            </button>
            <button
              type="button"
              onClick={() => onChangeTab('history')}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'history'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <History className="w-3.5 h-3.5 text-[#E85D2A]" />
              점심 기록
              {historyCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-stone-900 text-white text-[10px]">
                  {historyCount}
                </span>
              )}
            </button>
          </nav>

          {/* Divider on desktop */}
          <div className="hidden lg:block w-px h-6 bg-stone-200/90 order-1" />

          {/* Location & Live Weather Controls */}
          <div className="flex items-center gap-2 flex-wrap order-1 sm:order-2">
            {/* Location Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowLocationMenu((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-stone-200 hover:border-stone-300 text-xs font-semibold text-stone-800 shadow-2xs transition cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-[#E85D2A] shrink-0" />
                <span className="max-w-[165px] truncate">
                  {location.loading ? '위치 찾는 중...' : location.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
              </button>

              {showLocationMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowLocationMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-stone-200 shadow-xl p-2 z-20 animate-pop-in">
                    <button
                      type="button"
                      onClick={() => {
                        setShowLocationMenu(false);
                        onRequestGps();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#C2410C] text-xs font-semibold transition cursor-pointer mb-1.5"
                    >
                      <LocateFixed className="w-4 h-4 shrink-0" />
                      <span>현재 GPS 위치 자동 감지</span>
                    </button>

                    <div className="px-2 py-1 text-[11px] font-semibold text-stone-400">
                      주요 지역 빠른 선택
                    </div>
                    <div className="max-h-56 overflow-y-auto space-y-0.5">
                      {LOCATION_PRESETS.map((preset) => {
                        const active =
                          location.source === 'preset' &&
                          location.name === preset.name;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => {
                              onSelectPreset(preset);
                              setShowLocationMenu(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition cursor-pointer ${
                              active
                                ? 'bg-stone-900 text-white font-semibold'
                                : 'hover:bg-stone-100 text-stone-700'
                            }`}
                          >
                            <span>{preset.name}</span>
                            <span
                              className={`text-[11px] ${
                                active ? 'text-stone-300' : 'text-stone-400'
                              }`}
                            >
                              {preset.district}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Weather Pill */}
            <button
              type="button"
              onClick={onRefreshWeather}
              title="실시간 날씨 새로고침 (Open-Meteo)"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-stone-200 hover:border-stone-300 text-xs font-semibold text-stone-700 shadow-2xs transition cursor-pointer"
            >
              {renderWeatherIcon()}
              {weatherLoading ? (
                <span className="text-stone-400">날씨 확인중</span>
              ) : context.isWeatherSimulated ? (
                <span className="text-[#E85D2A] font-semibold">
                  시뮬레이션 · {feelTextMap[context.weatherFeel]}
                </span>
              ) : liveWeather ? (
                <span>
                  {Math.round(liveWeather.temperatureC)}°C ·{' '}
                  {liveWeather.description}
                </span>
              ) : weatherError ? (
                <span className="text-stone-500">날씨 오프라인</span>
              ) : (
                <span>{feelTextMap[context.weatherFeel]}</span>
              )}
              <RefreshCw
                className={`w-3 h-3 text-stone-400 ${weatherLoading ? 'animate-spin' : ''}`}
              />
            </button>
          </div>
        </div>
      </div>

      {location.error && (
        <div className="bg-amber-50 border-t border-amber-200/70 px-4 py-1.5 text-center text-xs text-amber-800">
          {location.error}
        </div>
      )}
    </header>
  );
};
