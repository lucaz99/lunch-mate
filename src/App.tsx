import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Star } from 'lucide-react';
import { ContextControls } from './components/ContextControls';
import { FavoriteSpotsSidebar } from './components/FavoriteSpotsSidebar';
import { Header } from './components/Header';
import { LunchHistoryPanel } from './components/LunchHistoryPanel';
import { RandomPicker } from './components/RandomPicker';
import { RecommendationSection } from './components/RecommendationSection';
import {
  FAVORITE_SPOTS,
  GENERAL_MENUS,
  LOCATION_PRESETS,
} from './data/menus';
import { useLocalStorage } from './hooks/useLocalStorage';
import {
  fetchOpenMeteoWeather,
  formatWeatherSummary,
  reverseGeocodeKorean,
} from './services/weatherAndLocation';
import {
  ActiveTab,
  LiveWeatherData,
  LocationPreset,
  LocationState,
  LunchContext,
  LunchHistoryEntry,
  MenuItem,
  ScoredMenu,
} from './types/lunch';
import {
  getTodayDateString,
  isYesterdayWeekend,
  scoreMenus,
} from './utils/recommender';

const DEFAULT_PRESET = LOCATION_PRESETS[0]; // 서울 강서구 화곡로 372

export function App() {
  const autoWeekendDetected = useMemo(() => isYesterdayWeekend(), []);

  const [activeTab, setActiveTab] = useState<ActiveTab>('recommend');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [history, setHistory] = useLocalStorage<LunchHistoryEntry[]>(
    'lunchmate_history_v1',
    []
  );
  const [customSpots, setCustomSpots] = useLocalStorage<MenuItem[]>(
    'lunchmate_custom_spots_v1',
    []
  );
  const [disabledSpotIds, setDisabledSpotIds] = useLocalStorage<string[]>(
    'lunchmate_disabled_spots_v1',
    []
  );

  const [location, setLocation] = useState<LocationState>({
    lat: DEFAULT_PRESET.lat,
    lon: DEFAULT_PRESET.lon,
    name: DEFAULT_PRESET.name,
    district: DEFAULT_PRESET.district,
    source: 'preset',
    loading: false,
  });

  const [liveWeather, setLiveWeather] = useState<LiveWeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  const [context, setContext] = useState<LunchContext>({
    wasWeekendYesterday: autoWeekendDetected,
    hadCompanyDinner: false,
    weatherFeel: 'mild',
    weatherCondition: 'clear',
    temperatureC: null,
    apparentTemperatureC: null,
    isWeatherSimulated: false,
    budget: 'all',
    companion: 'colleagues',
    pace: 'normal',
    excludeRecentDays: 3,
    selectedCategories: [],
  });

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  }, []);

  const loadWeatherForCoords = useCallback(async (lat: number, lon: number) => {
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      const data = await fetchOpenMeteoWeather(lat, lon);
      setLiveWeather(data);
      setContext((prev) => ({
        ...prev,
        weatherFeel: data.feel,
        weatherCondition: data.condition,
        temperatureC: data.temperatureC,
        apparentTemperatureC: data.apparentTemperatureC,
        isWeatherSimulated: false,
      }));
    } catch (err) {
      setWeatherError(
        err instanceof Error ? err.message : '날씨 정보를 가져오지 못했어요.'
      );
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  // Fetch initial weather for default location on mount
  useEffect(() => {
    loadWeatherForCoords(DEFAULT_PRESET.lat, DEFAULT_PRESET.lon);
  }, [loadWeatherForCoords]);

  const handleRequestGps = useCallback(() => {
    if (!navigator.geolocation) {
      setLocation((prev) => ({
        ...prev,
        error:
          '이 브라우저는 GPS 위치 기능을 지원하지 않아 기본 지역으로 표시합니다.',
      }));
      return;
    }

    setLocation((prev) => ({ ...prev, loading: true, error: undefined }));

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const geo = await reverseGeocodeKorean(latitude, longitude);
        setLocation({
          lat: latitude,
          lon: longitude,
          name: geo.name,
          district: geo.district,
          source: 'gps',
          loading: false,
        });
        loadWeatherForCoords(latitude, longitude);
        showToast(`현재 위치(${geo.name})의 실시간 날씨를 반영했어요!`);
      },
      () => {
        setLocation((prev) => ({
          ...prev,
          loading: false,
          error:
            '위치 권한이 거부되었거나 가져올 수 없어요. 상단 위치 버튼에서 지역을 직접 선택할 수 있습니다.',
        }));
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  }, [loadWeatherForCoords, showToast]);

  const handleSelectPreset = useCallback(
    (preset: LocationPreset) => {
      setLocation({
        lat: preset.lat,
        lon: preset.lon,
        name: preset.name,
        district: preset.district,
        source: 'preset',
        loading: false,
      });
      loadWeatherForCoords(preset.lat, preset.lon);
      showToast(`${preset.name} 기준으로 위치와 날씨를 업데이트했어요.`);
    },
    [loadWeatherForCoords, showToast]
  );

  const handleResetLiveWeather = useCallback(() => {
    if (!liveWeather) return;
    setContext((prev) => ({
      ...prev,
      weatherFeel: liveWeather.feel,
      weatherCondition: liveWeather.condition,
      temperatureC: liveWeather.temperatureC,
      apparentTemperatureC: liveWeather.apparentTemperatureC,
      isWeatherSimulated: false,
    }));
  }, [liveWeather]);

  const allFavoriteSpots = useMemo(
    () => [...FAVORITE_SPOTS, ...customSpots],
    [customSpots]
  );

  const customSpotIds = useMemo(
    () => new Set(customSpots.map((s) => s.id)),
    [customSpots]
  );

  const activeFavoriteCount = useMemo(
    () =>
      allFavoriteSpots.filter((s) => !disabledSpotIds.includes(s.id)).length,
    [allFavoriteSpots, disabledSpotIds]
  );

  // Full scored favorite spots for the right sidebar (ignores category filter so all spots stay visible)
  const sidebarFavoriteSpots = useMemo(() => {
    const sidebarContext: LunchContext = {
      ...context,
      selectedCategories: [],
    };
    return scoreMenus(allFavoriteSpots, sidebarContext, history);
  }, [allFavoriteSpots, context, history]);

  // Enabled favorite spots for the Random Picker's "기본 식당" pool
  const enabledFavoriteSpots = useMemo(
    () =>
      sidebarFavoriteSpots.filter((s) => !disabledSpotIds.includes(s.id)),
    [sidebarFavoriteSpots, disabledSpotIds]
  );

  // Main recommendations: strictly food menu categories/dishes only (never mixed with specific restaurants)
  const scoredMenus = useMemo(
    () => scoreMenus(GENERAL_MENUS, context, history),
    [context, history]
  );

  const todayStr = getTodayDateString();
  const todayConfirmedMenuId = useMemo(() => {
    const todayEntry = history.find((h) => h.date === todayStr);
    return todayEntry?.menuId ?? null;
  }, [history, todayStr]);

  const handleConfirmMenu = useCallback(
    (menu: ScoredMenu) => {
      const entry: LunchHistoryEntry = {
        id: `${Date.now()}-${menu.id}`,
        menuId: menu.id,
        menuName: menu.name,
        emoji: menu.emoji,
        category: menu.category,
        date: todayStr,
        timestamp: Date.now(),
        contextSnapshot: {
          hadCompanyDinner: context.hadCompanyDinner,
          wasWeekendYesterday: context.wasWeekendYesterday,
          weatherSummary: formatWeatherSummary(
            context.weatherFeel,
            context.weatherCondition,
            context.temperatureC
          ),
          locationName: location.name,
        },
      };

      setHistory((prev) => [entry, ...prev].slice(0, 60));
      showToast(
        `${menu.emoji} 오늘 점심으로 '${menu.name}' 확정! 최근 식사 기록에 저장됐어요.`
      );
    },
    [context, location.name, setHistory, showToast, todayStr]
  );

  const handleToggleSpotEnabled = useCallback(
    (id: string) => {
      setDisabledSpotIds((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );
    },
    [setDisabledSpotIds]
  );

  const handleAddCustomSpot = useCallback(
    (spot: MenuItem) => {
      setCustomSpots((prev) => [...prev, spot]);
      showToast(`⭐ '${spot.name}'을(를) 기본 확정 식당에 추가했어요!`);
    },
    [setCustomSpots, showToast]
  );

  const handleRemoveCustomSpot = useCallback(
    (id: string) => {
      setCustomSpots((prev) => prev.filter((s) => s.id !== id));
      setDisabledSpotIds((prev) => prev.filter((item) => item !== id));
      showToast('직접 등록한 식당을 목록에서 삭제했어요.');
    },
    [setCustomSpots, setDisabledSpotIds, showToast]
  );

  const handleAddManualEntry = useCallback(
    (menu: MenuItem, daysAgo: number) => {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - daysAgo);
      const dateStr = getTodayDateString(targetDate);

      const entry: LunchHistoryEntry = {
        id: `${Date.now()}-${menu.id}`,
        menuId: menu.id,
        menuName: menu.name,
        emoji: menu.emoji,
        category: menu.category,
        date: dateStr,
        timestamp: targetDate.getTime(),
        contextSnapshot: {
          hadCompanyDinner: false,
          wasWeekendYesterday: false,
          weatherSummary: '직접 기록',
          locationName: location.name,
        },
      };

      setHistory((prev) =>
        [entry, ...prev].sort((a, b) => b.timestamp - a.timestamp).slice(0, 60)
      );
      showToast(
        `${menu.emoji} '${menu.name}' 기록 완료! 중복 추천에서 자동 제외돼요.`
      );
    },
    [location.name, setHistory, showToast]
  );

  const handleDeleteEntry = useCallback(
    (id: string) => {
      setHistory((prev) => prev.filter((item) => item.id !== id));
    },
    [setHistory]
  );

  const handleClearHistory = useCallback(() => {
    setHistory([]);
    showToast('점심 식사 기록을 모두 초기화했어요.');
  }, [setHistory, showToast]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F4]">
      <Header
        location={location}
        liveWeather={liveWeather}
        weatherLoading={weatherLoading}
        weatherError={weatherError}
        context={context}
        autoWeekendDetected={autoWeekendDetected}
        activeTab={activeTab}
        historyCount={history.length}
        onChangeTab={setActiveTab}
        onRequestGps={handleRequestGps}
        onSelectPreset={handleSelectPreset}
        onRefreshWeather={() => loadWeatherForCoords(location.lat, location.lon)}
      />

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-5 py-3">
        <div className="flex flex-col lg:flex-row items-start gap-4">
          {/* Left Main Column */}
          <div className="flex-1 min-w-0 w-full space-y-3.5">
            {/* Mobile-only button to open Favorite Spots Drawer */}
            <div className="flex lg:hidden justify-end">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-amber-100 hover:bg-amber-200/80 border border-amber-300/70 text-amber-950 text-xs font-extrabold transition cursor-pointer"
              >
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                기본 확정 식당 ({activeFavoriteCount}/{allFavoriteSpots.length})
              </button>
            </div>

            {/* Condition controls always visible on Recommend & Picker tabs */}
            {activeTab !== 'history' && (
              <ContextControls
                context={context}
                liveWeather={liveWeather}
                autoWeekendDetected={autoWeekendDetected}
                onChange={(patch) =>
                  setContext((prev) => ({ ...prev, ...patch }))
                }
                onResetLiveWeather={handleResetLiveWeather}
              />
            )}

            {activeTab === 'recommend' && (
              <RecommendationSection
                scoredMenus={scoredMenus}
                context={context}
                locationName={location.name}
                todayConfirmedMenuId={todayConfirmedMenuId}
                onConfirmMenu={handleConfirmMenu}
              />
            )}

            {activeTab === 'picker' && (
              <RandomPicker
                scoredMenus={scoredMenus}
                favoriteSpots={enabledFavoriteSpots}
                locationName={location.name}
                onConfirmMenu={handleConfirmMenu}
              />
            )}

            {activeTab === 'history' && (
              <LunchHistoryPanel
                history={history}
                favoriteSpots={allFavoriteSpots}
                excludeRecentDays={context.excludeRecentDays}
                locationName={location.name}
                onAddManualEntry={handleAddManualEntry}
                onDeleteEntry={handleDeleteEntry}
                onClearAll={handleClearHistory}
              />
            )}
          </div>

          {/* Right Sticky Sidebar: 기본 확정 식당 */}
          <FavoriteSpotsSidebar
            favoriteSpots={sidebarFavoriteSpots}
            customSpotIds={customSpotIds}
            disabledSpotIds={disabledSpotIds}
            todayConfirmedMenuId={todayConfirmedMenuId}
            locationName={location.name}
            onToggleSpotEnabled={handleToggleSpotEnabled}
            onConfirmSpot={handleConfirmMenu}
            onAddCustomSpot={handleAddCustomSpot}
            onRemoveCustomSpot={handleRemoveCustomSpot}
            onEnableAll={() => setDisabledSpotIds([])}
            isOpenMobile={mobileSidebarOpen}
            onCloseMobile={() => setMobileSidebarOpen(false)}
          />
        </div>
      </main>

      <footer className="max-w-[1440px] w-full mx-auto px-4 sm:px-5 py-2.5 text-center text-[11px] text-stone-400">
        실시간 날씨 데이터: Open-Meteo · 주변 식당 검색: 네이버 지도 &amp; 카카오맵 바로가기
      </footer>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-2xl bg-stone-900 text-white text-xs sm:text-sm font-semibold shadow-xl flex items-center gap-2 animate-pop-in max-w-[92vw]">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default App;
