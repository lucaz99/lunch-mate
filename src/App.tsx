import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Star, User, Vote, X } from 'lucide-react';
import { ContextControls } from './components/ContextControls';
import {
  FavoriteSpotsSidebar,
  SidebarTab,
  SyncStatus,
} from './components/FavoriteSpotsSidebar';
import { Header } from './components/Header';
import { LunchHistoryPanel } from './components/LunchHistoryPanel';
import { RandomPicker } from './components/RandomPicker';
import { RecommendationSection } from './components/RecommendationSection';
import { ReviewModal } from './components/ReviewModal';
import {
  FAVORITE_SPOTS,
  GENERAL_MENUS,
  LOCATION_PRESETS,
} from './data/menus';
import { useLocalStorage } from './hooks/useLocalStorage';
import {
  aggregateDailyVotes,
  buildRatingSummaryMap,
  castDailyVote,
  clearDailyVotes,
  createLunchReview,
  deleteLunchReview,
  fetchDailyVotes,
  fetchLunchReviews,
  removeDailyVote,
  subscribeCommunityUpdates,
  updateLunchReview,
} from './services/supabaseCommunity';
import {
  addSharedFavoriteSpot,
  deleteSharedFavoriteSpot,
  fetchSharedFavoriteSpots,
  subscribeSharedFavoriteSpots,
} from './services/supabaseSpots';
import {
  fetchOpenMeteoWeather,
  formatWeatherSummary,
  reverseGeocodeKorean,
} from './services/weatherAndLocation';
import {
  ActiveTab,
  AggregatedPollCandidate,
  CommunityItemType,
  DailyVoteRecord,
  LiveWeatherData,
  LocationPreset,
  LocationState,
  LunchContext,
  LunchHistoryEntry,
  LunchReviewRecord,
  MenuCategory,
  MenuItem,
  ReviewDraftTarget,
  ScoredMenu,
} from './types/lunch';
import {
  getTodayDateString,
  isYesterdayWeekend,
  scoreMenus,
} from './utils/recommender';

const DEFAULT_PRESET = LOCATION_PRESETS[0]; // 서울 강서구 화곡로 372

interface VoteTargetInput {
  itemId: string;
  itemName: string;
  itemEmoji: string;
  itemCategory: MenuCategory;
  itemType: CommunityItemType;
}

function generateClientId(): string {
  return `member-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function App() {
  const autoWeekendDetected = useMemo(() => isYesterdayWeekend(), []);
  const todayStr = getTodayDateString();

  const [activeTab, setActiveTab] = useState<ActiveTab>('recommend');
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('spots');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Persistent local identity (no login required)
  const [memberId] = useLocalStorage<string>(
    'lunchmate_member_id_v1',
    generateClientId()
  );
  const [memberNickname, setMemberNickname] = useLocalStorage<string>(
    'lunchmate_member_nickname_v1',
    ''
  );

  // Pending vote prompt if user votes before setting nickname
  const [pendingVoteTarget, setPendingVoteTarget] =
    useState<VoteTargetInput | null>(null);
  const [nickModalInput, setNickModalInput] = useState('');

  // Review modal state
  const [reviewTarget, setReviewTarget] = useState<ReviewDraftTarget | null>(
    null
  );
  const [reviewJustConfirmed, setReviewJustConfirmed] = useState(false);

  const [history, setHistory] = useLocalStorage<LunchHistoryEntry[]>(
    'lunchmate_history_v1',
    []
  );
  const [customSpots, setCustomSpots] = useLocalStorage<MenuItem[]>(
    'lunchmate_custom_spots_v1',
    []
  );
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('loading');
  const [disabledSpotIds, setDisabledSpotIds] = useLocalStorage<string[]>(
    'lunchmate_disabled_spots_v1',
    []
  );

  // Live Supabase community state (votes & reviews)
  const [dailyVotes, setDailyVotes] = useState<DailyVoteRecord[]>([]);
  const [reviews, setReviews] = useState<LunchReviewRecord[]>([]);

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
    noPickActive: false,
    ryeolPickActive: false,
    seonPickActive: false,
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

  useEffect(() => {
    loadWeatherForCoords(DEFAULT_PRESET.lat, DEFAULT_PRESET.lon);
  }, [loadWeatherForCoords]);

  const syncSharedSpots = useCallback(async () => {
    setSyncStatus('loading');
    try {
      const remoteSpots = await fetchSharedFavoriteSpots();
      setCustomSpots(remoteSpots);
      setSyncStatus('synced');
    } catch {
      setSyncStatus('offline');
    }
  }, [setCustomSpots]);

  const syncVotes = useCallback(async () => {
    try {
      const rows = await fetchDailyVotes(todayStr);
      setDailyVotes(rows);
    } catch {
      // keep existing state when offline
    }
  }, [todayStr]);

  const syncReviews = useCallback(async () => {
    try {
      const rows = await fetchLunchReviews();
      setReviews(rows);
    } catch {
      // keep existing state when offline
    }
  }, []);

  // Initial load + Supabase Realtime subscriptions
  useEffect(() => {
    void syncSharedSpots();
    void syncVotes();
    void syncReviews();

    const unsubSpots = subscribeSharedFavoriteSpots(() => {
      void syncSharedSpots();
    });
    const unsubCommunity = subscribeCommunityUpdates(
      () => void syncVotes(),
      () => void syncReviews()
    );

    return () => {
      unsubSpots();
      unsubCommunity();
    };
  }, [syncSharedSpots, syncVotes, syncReviews]);

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

  // Main recommendations: strictly food menu categories/dishes only
  const scoredMenus = useMemo(
    () => scoreMenus(GENERAL_MENUS, context, history),
    [context, history]
  );

  // Aggregated poll candidates & maps
  const pollCandidates = useMemo(
    () => aggregateDailyVotes(dailyVotes, memberId),
    [dailyVotes, memberId]
  );

  const pollMap = useMemo(() => {
    const map = new Map<string, AggregatedPollCandidate>();
    for (const c of pollCandidates) {
      map.set(c.itemId, c);
    }
    return map;
  }, [pollCandidates]);

  const ratingMap = useMemo(() => buildRatingSummaryMap(reviews), [reviews]);

  const todayConfirmedMenuId = useMemo(() => {
    const todayEntry = history.find((h) => h.date === todayStr);
    return todayEntry?.menuId ?? null;
  }, [history, todayStr]);

  // Execute vote toggle with a resolved nickname
  const executeToggleVote = useCallback(
    async (target: VoteTargetInput, voterName: string) => {
      const alreadyVoted = dailyVotes.some(
        (v) => v.itemId === target.itemId && v.voterId === memberId
      );

      if (alreadyVoted) {
        setDailyVotes((prev) =>
          prev.filter(
            (v) => !(v.itemId === target.itemId && v.voterId === memberId)
          )
        );
        try {
          await removeDailyVote(todayStr, target.itemId, memberId);
          showToast(`'${target.itemName}' 투표를 취소했어요.`);
        } catch {
          void syncVotes();
          showToast('투표 취소 중 오류가 발생했어요.');
        }
      } else {
        try {
          const inserted = await castDailyVote({
            voteDate: todayStr,
            itemId: target.itemId,
            itemName: target.itemName,
            itemEmoji: target.itemEmoji,
            itemCategory: target.itemCategory,
            itemType: target.itemType,
            voterId: memberId,
            voterName,
          });
          setDailyVotes((prev) => [
            ...prev.filter((v) => v.id !== inserted.id),
            inserted,
          ]);
          setSidebarTab('poll');
          showToast(
            `👍 '${target.itemName}'에 투표했어요! 오른쪽 [오늘 투표] 탭에 반영됐습니다.`
          );
        } catch {
          void syncVotes();
          showToast('투표 저장 중 오류가 발생했어요.');
        }
      }
    },
    [dailyVotes, memberId, showToast, syncVotes, todayStr]
  );

  const requestVoteToggle = useCallback(
    (target: VoteTargetInput) => {
      const alreadyVoted = dailyVotes.some(
        (v) => v.itemId === target.itemId && v.voterId === memberId
      );
      if (!alreadyVoted && !memberNickname.trim()) {
        setNickModalInput('');
        setPendingVoteTarget(target);
        return;
      }
      void executeToggleVote(target, memberNickname.trim() || '익명 팀원');
    },
    [dailyVotes, executeToggleVote, memberId, memberNickname]
  );

  const handleToggleVoteForMenu = useCallback(
    (menu: ScoredMenu) => {
      requestVoteToggle({
        itemId: menu.id,
        itemName: menu.name,
        itemEmoji: menu.emoji,
        itemCategory: menu.category,
        itemType: menu.isFavoriteSpot ? 'spot' : 'menu',
      });
    },
    [requestVoteToggle]
  );

  const handleToggleVoteForCandidate = useCallback(
    (cand: AggregatedPollCandidate) => {
      requestVoteToggle({
        itemId: cand.itemId,
        itemName: cand.itemName,
        itemEmoji: cand.itemEmoji,
        itemCategory: cand.itemCategory,
        itemType: cand.itemType,
      });
    },
    [requestVoteToggle]
  );

  const handleClearTodayPoll = useCallback(async () => {
    setDailyVotes([]);
    try {
      await clearDailyVotes(todayStr);
      showToast('오늘 팀 투표를 초기화했어요.');
    } catch {
      void syncVotes();
    }
  }, [showToast, syncVotes, todayStr]);

  // Confirm lunch -> record history + open optional ReviewModal
  const confirmLunchAndPromptReview = useCallback(
    (item: {
      id: string;
      name: string;
      emoji: string;
      category: MenuCategory;
      itemType: CommunityItemType;
    }) => {
      const entry: LunchHistoryEntry = {
        id: `${Date.now()}-${item.id}`,
        menuId: item.id,
        menuName: item.name,
        emoji: item.emoji,
        category: item.category,
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
        `${item.emoji} 오늘 점심으로 '${item.name}' 확정! 식사 후 별점·한줄평도 남겨보세요.`
      );

      const existing = reviews.find(
        (r) =>
          r.itemId === item.id &&
          r.authorId === memberId &&
          r.eatenDate === todayStr
      );
      setReviewJustConfirmed(true);
      setReviewTarget({
        itemId: item.id,
        itemName: item.name,
        itemEmoji: item.emoji,
        itemCategory: item.category,
        itemType: item.itemType,
        eatenDate: todayStr,
        existingReview: existing,
      });
    },
    [context, location.name, memberId, reviews, setHistory, showToast, todayStr]
  );

  const handleConfirmMenu = useCallback(
    (menu: ScoredMenu) => {
      confirmLunchAndPromptReview({
        id: menu.id,
        name: menu.name,
        emoji: menu.emoji,
        category: menu.category,
        itemType: menu.isFavoriteSpot ? 'spot' : 'menu',
      });
    },
    [confirmLunchAndPromptReview]
  );

  const handleConfirmPollCandidate = useCallback(
    (cand: AggregatedPollCandidate) => {
      confirmLunchAndPromptReview({
        id: cand.itemId,
        name: cand.itemName,
        emoji: cand.itemEmoji,
        category: cand.itemCategory,
        itemType: cand.itemType,
      });
    },
    [confirmLunchAndPromptReview]
  );

  const handleOpenReviewForMenu = useCallback(
    (menu: ScoredMenu) => {
      const existing = reviews.find(
        (r) =>
          r.itemId === menu.id &&
          r.authorId === memberId &&
          r.eatenDate === todayStr
      );
      setReviewJustConfirmed(false);
      setReviewTarget({
        itemId: menu.id,
        itemName: menu.name,
        itemEmoji: menu.emoji,
        itemCategory: menu.category,
        itemType: menu.isFavoriteSpot ? 'spot' : 'menu',
        eatenDate: todayStr,
        existingReview: existing,
      });
    },
    [memberId, reviews, todayStr]
  );

  const handleOpenReviewForHistory = useCallback(
    (entry: LunchHistoryEntry) => {
      const isSpot = allFavoriteSpots.some((s) => s.id === entry.menuId);
      const existing = reviews.find(
        (r) =>
          r.itemId === entry.menuId &&
          r.authorId === memberId &&
          r.eatenDate === entry.date
      );
      setReviewJustConfirmed(false);
      setReviewTarget({
        itemId: entry.menuId,
        itemName: entry.menuName,
        itemEmoji: entry.emoji,
        itemCategory: entry.category,
        itemType: isSpot ? 'spot' : 'menu',
        eatenDate: entry.date,
        existingReview: existing,
      });
    },
    [allFavoriteSpots, memberId, reviews]
  );

  const handleSubmitReview = useCallback(
    async (payload: {
      rating: number;
      comment: string;
      authorName: string;
      existingId?: number;
    }) => {
      if (!reviewTarget) return;
      try {
        if (payload.existingId) {
          const updated = await updateLunchReview(
            payload.existingId,
            payload.rating,
            payload.comment,
            payload.authorName
          );
          setReviews((prev) =>
            prev.map((r) => (r.id === updated.id ? updated : r))
          );
          showToast(`★ '${reviewTarget.itemName}' 리뷰를 수정했어요!`);
        } else {
          const created = await createLunchReview({
            itemId: reviewTarget.itemId,
            itemName: reviewTarget.itemName,
            itemEmoji: reviewTarget.itemEmoji,
            itemCategory: reviewTarget.itemCategory,
            itemType: reviewTarget.itemType,
            rating: payload.rating,
            comment: payload.comment,
            authorId: memberId,
            authorName: payload.authorName,
            eatenDate: reviewTarget.eatenDate,
          });
          setReviews((prev) => [
            created,
            ...prev.filter((r) => r.id !== created.id),
          ]);
          showToast(
            `★ '${reviewTarget.itemName}' 별점(${payload.rating}점)·한줄평이 팀에 공유됐어요!`
          );
        }
      } catch {
        showToast('리뷰 저장 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.');
      }
    },
    [memberId, reviewTarget, showToast]
  );

  const handleDeleteReview = useCallback(
    async (id: number) => {
      setReviews((prev) => prev.filter((r) => r.id !== id));
      try {
        await deleteLunchReview(id);
        showToast('리뷰를 삭제했어요.');
      } catch {
        void syncReviews();
        showToast('리뷰 삭제 중 오류가 발생했어요.');
      }
    },
    [showToast, syncReviews]
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
    async (spot: MenuItem) => {
      setCustomSpots((prev) => [spot, ...prev.filter((s) => s.id !== spot.id)]);
      try {
        const saved = await addSharedFavoriteSpot(spot);
        setCustomSpots((prev) => [
          saved,
          ...prev.filter((s) => s.id !== spot.id && s.id !== saved.id),
        ]);
        setSyncStatus('synced');
        showToast(`⭐ '${spot.name}'을(를) 팀 전체에 실시간 동기화했어요!`);
      } catch {
        setSyncStatus('offline');
        showToast(
          `⭐ '${spot.name}'을(를) 내 브라우저에 저장했어요 (서버 연결 재시도 필요).`
        );
      }
    },
    [setCustomSpots, showToast]
  );

  const handleRemoveCustomSpot = useCallback(
    async (id: string) => {
      setCustomSpots((prev) => prev.filter((s) => s.id !== id));
      setDisabledSpotIds((prev) => prev.filter((item) => item !== id));
      try {
        await deleteSharedFavoriteSpot(id);
        setSyncStatus('synced');
        showToast('팀 공유 목록에서 해당 식당을 삭제했어요.');
      } catch {
        setSyncStatus('offline');
        showToast('로컬 목록에서 삭제했어요 (서버 동기화 실패).');
      }
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

  const activeItemReviews = useMemo(() => {
    if (!reviewTarget) return [];
    return reviews.filter((r) => r.itemId === reviewTarget.itemId);
  }, [reviewTarget, reviews]);

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

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-5 py-4">
        <div className="flex flex-col lg:flex-row items-stretch gap-5">
          {/* Left Main Column */}
          <div className="flex-1 min-w-0 w-full space-y-4">
            {/* Mobile-only triggers for Sidebar Drawer */}
            <div className="flex lg:hidden justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setSidebarTab('poll');
                  setMobileSidebarOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-orange-100 hover:bg-orange-200/80 border border-orange-300/70 text-orange-950 text-xs font-extrabold transition cursor-pointer"
              >
                <Vote className="w-3.5 h-3.5 text-[#E85D2A]" />
                오늘 투표 ({pollCandidates.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setSidebarTab('spots');
                  setMobileSidebarOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-amber-100 hover:bg-amber-200/80 border border-amber-300/70 text-amber-950 text-xs font-extrabold transition cursor-pointer"
              >
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                기본 식당 ({activeFavoriteCount}/{allFavoriteSpots.length})
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
                pollMap={pollMap}
                ratingMap={ratingMap}
                onConfirmMenu={handleConfirmMenu}
                onToggleVote={handleToggleVoteForMenu}
                onOpenReview={handleOpenReviewForMenu}
              />
            )}

            {activeTab === 'picker' && (
              <RandomPicker
                scoredMenus={scoredMenus}
                favoriteSpots={enabledFavoriteSpots}
                locationName={location.name}
                pollMap={pollMap}
                onConfirmMenu={handleConfirmMenu}
                onToggleVote={handleToggleVoteForMenu}
              />
            )}

            {activeTab === 'history' && (
              <LunchHistoryPanel
                history={history}
                reviews={reviews}
                memberId={memberId}
                favoriteSpots={allFavoriteSpots}
                excludeRecentDays={context.excludeRecentDays}
                locationName={location.name}
                onAddManualEntry={handleAddManualEntry}
                onDeleteEntry={handleDeleteEntry}
                onClearAll={handleClearHistory}
                onOpenReviewForHistory={handleOpenReviewForHistory}
                onDeleteReview={handleDeleteReview}
              />
            )}
          </div>

          {/* Right Sticky Sidebar: 기본 확정 식당 & 오늘 투표 */}
          <FavoriteSpotsSidebar
            favoriteSpots={sidebarFavoriteSpots}
            customSpotIds={customSpotIds}
            disabledSpotIds={disabledSpotIds}
            todayConfirmedMenuId={todayConfirmedMenuId}
            locationName={location.name}
            locationLat={location.lat}
            locationLon={location.lon}
            syncStatus={syncStatus}
            activeSidebarTab={sidebarTab}
            onChangeSidebarTab={setSidebarTab}
            pollCandidates={pollCandidates}
            ratingMap={ratingMap}
            memberNickname={memberNickname}
            onChangeNickname={setMemberNickname}
            onToggleVoteCandidate={handleToggleVoteForCandidate}
            onConfirmPollCandidate={handleConfirmPollCandidate}
            onClearTodayPoll={handleClearTodayPoll}
            onOpenReviewForSpot={handleOpenReviewForMenu}
            onRefreshSync={() => {
              void syncSharedSpots();
              void syncVotes();
              void syncReviews();
            }}
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
        실시간 날씨 데이터: Open-Meteo · 팀 동기화/투표/리뷰: Supabase · 지도: 네이버 &amp; 카카오맵
      </footer>

      {/* First-time Nickname Modal for Voting */}
      {pendingVoteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-stone-950/45 backdrop-blur-[1px]"
            onClick={() => setPendingVoteTarget(null)}
          />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const nick = nickModalInput.trim() || '익명 팀원';
              setMemberNickname(nick);
              const target = pendingVoteTarget;
              setPendingVoteTarget(null);
              void executeToggleVote(target, nick);
            }}
            className="relative z-10 w-full max-w-xs rounded-3xl bg-white border border-stone-200 shadow-2xl p-5 space-y-4 animate-pop-in"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#E85D2A] flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-stone-900">
                    투표 닉네임 입력
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    한 번 입력하면 다음에 바로 투표돼요
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPendingVoteTarget(null)}
                className="p-1 rounded-lg text-stone-400 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-xl bg-stone-50 px-3 py-2 text-xs text-stone-700 font-semibold">
              {pendingVoteTarget.itemEmoji} {pendingVoteTarget.itemName}에 투표
            </div>

            <input
              type="text"
              value={nickModalInput}
              onChange={(e) => setNickModalInput(e.target.value)}
              placeholder="이름 또는 닉네임 (예: 홍길동)"
              maxLength={24}
              autoFocus
              className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 focus:border-[#E85D2A] text-sm text-stone-900 focus:outline-none"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  const target = pendingVoteTarget;
                  setMemberNickname('익명 팀원');
                  setPendingVoteTarget(null);
                  void executeToggleVote(target, '익명 팀원');
                }}
                className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-bold cursor-pointer"
              >
                익명으로 투표
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#E85D2A] hover:bg-[#D14D1E] text-white text-xs font-bold cursor-pointer"
              >
                확인하고 투표
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Star Rating & One-Line Review Modal */}
      <ReviewModal
        target={reviewTarget}
        itemReviews={activeItemReviews}
        memberId={memberId}
        memberNickname={memberNickname}
        justConfirmed={reviewJustConfirmed}
        onSaveNickname={setMemberNickname}
        onSubmitReview={handleSubmitReview}
        onDeleteReview={handleDeleteReview}
        onClose={() => setReviewTarget(null)}
      />

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
