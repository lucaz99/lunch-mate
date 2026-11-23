import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Dices,
  ExternalLink,
  Heart,
  Layers,
  RotateCcw,
  Sparkles,
  ThumbsUp,
  X,
} from 'lucide-react';
import {
  buildKakaoMapUrl,
  buildNaverMapUrl,
} from '../services/weatherAndLocation';
import { AggregatedPollCandidate, ScoredMenu } from '../types/lunch';

interface RandomPickerProps {
  scoredMenus: ScoredMenu[];
  favoriteSpots: ScoredMenu[];
  locationName: string;
  pollMap: Map<string, AggregatedPollCandidate>;
  onConfirmMenu: (menu: ScoredMenu) => void;
  onToggleVote: (menu: ScoredMenu) => void;
}

type PickerMode = 'slot' | 'swipe';
type PickerTarget = 'menus' | 'spots';

export const RandomPicker: React.FC<RandomPickerProps> = ({
  scoredMenus,
  favoriteSpots,
  locationName,
  pollMap,
  onConfirmMenu,
  onToggleVote,
}) => {
  const [mode, setMode] = useState<PickerMode>('slot');
  const [target, setTarget] = useState<PickerTarget>('menus');

  const activeSource = target === 'menus' ? scoredMenus : favoriteSpots;

  // Pool: prefer non-recently-eaten top 18 items from the chosen pool (never mixed)
  const candidatePool = useMemo(() => {
    const fresh = activeSource.filter((m) => !m.isRecentlyEaten);
    const source = fresh.length >= 3 ? fresh : activeSource;
    return source.slice(0, 18);
  }, [activeSource]);

  // Slot Machine state
  const [spinning, setSpinning] = useState(false);
  const [slotIndex, setSlotIndex] = useState(0);
  const [winner, setWinner] = useState<ScoredMenu | null>(null);
  const [useShortlistOnly, setUseShortlistOnly] = useState(false);
  const timerRef = useRef<number | null>(null);

  // Card Swipe state
  const [swipeIdx, setSwipeIdx] = useState(0);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [passedIds, setPassedIds] = useState<string[]>([]);

  const shortlistedMenus = useMemo(
    () => candidatePool.filter((m) => likedIds.includes(m.id)),
    [candidatePool, likedIds]
  );

  const activeSlotPool =
    useShortlistOnly && shortlistedMenus.length >= 2
      ? shortlistedMenus
      : candidatePool;

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  // Reset swipe index if pool changes significantly
  useEffect(() => {
    if (swipeIdx >= candidatePool.length) {
      setSwipeIdx(0);
    }
  }, [candidatePool.length, swipeIdx]);

  const handleSpin = () => {
    if (spinning || activeSlotPool.length === 0) return;
    setSpinning(true);
    setWinner(null);

    const totalTicks = 20 + Math.floor(Math.random() * 10);
    let tick = 0;
    let current = slotIndex % activeSlotPool.length;

    const step = () => {
      tick += 1;
      current = (current + 1) % activeSlotPool.length;
      setSlotIndex(current);

      if (tick >= totalTicks) {
        setSpinning(false);
        setWinner(activeSlotPool[current]);
        return;
      }

      // Smooth deceleration curve
      const progress = tick / totalTicks;
      const delay = 55 + Math.pow(progress, 2.4) * 280;
      timerRef.current = window.setTimeout(step, delay);
    };

    step();
  };

  const currentCard = candidatePool[swipeIdx];
  const swipeFinished = swipeIdx >= candidatePool.length;

  const handleSwipeDecision = (decision: 'pass' | 'like') => {
    if (!currentCard) return;
    if (decision === 'like') {
      setLikedIds((prev) =>
        prev.includes(currentCard.id) ? prev : [...prev, currentCard.id]
      );
    } else {
      setPassedIds((prev) =>
        prev.includes(currentCard.id) ? prev : [...prev, currentCard.id]
      );
    }
    setSwipeIdx((prev) => prev + 1);
  };

  const resetSwipe = () => {
    setSwipeIdx(0);
    setLikedIds([]);
    setPassedIds([]);
    setUseShortlistOnly(false);
  };

  const displayedSlotMenu =
    activeSlotPool[slotIndex % Math.max(1, activeSlotPool.length)];

  return (
    <section className="bg-white rounded-3xl border border-stone-200/80 shadow-xs p-5 sm:p-7 space-y-6">
      {/* Header & Mode Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 flex items-center gap-2">
            <Dices className="w-5 h-5 text-[#E85D2A]" />
            결정 장애 해결기
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            {target === 'menus'
              ? `오늘 조건에 맞는 음식 종류 상위 ${candidatePool.length}개 중에서 뽑아보세요!`
              : `오른쪽 사이드바에서 선택된 기본 확정 식당 ${candidatePool.length}곳 중에서 뽑아보세요!`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Pool Target Switch (Menus vs Favorite Spots — strictly separate) */}
          <div className="inline-flex bg-stone-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setTarget('menus');
                setSlotIndex(0);
                setWinner(null);
                setSwipeIdx(0);
                setLikedIds([]);
                setPassedIds([]);
                setUseShortlistOnly(false);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                target === 'menus'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              🍽️ 음식 종류
            </button>
            <button
              type="button"
              onClick={() => {
                setTarget('spots');
                setSlotIndex(0);
                setWinner(null);
                setSwipeIdx(0);
                setLikedIds([]);
                setPassedIds([]);
                setUseShortlistOnly(false);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                target === 'spots'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              ⭐ 기본 식당 ({favoriteSpots.length})
            </button>
          </div>

          <div className="inline-flex bg-stone-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setMode('slot')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                mode === 'slot'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Dices className="w-3.5 h-3.5" />
              슬롯
            </button>
            <button
              type="button"
              onClick={() => setMode('swipe')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                mode === 'swipe'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              스와이프
              {shortlistedMenus.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-[#E85D2A] text-white text-[10px]">
                  {shortlistedMenus.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* SLOT MACHINE MODE */}
      {mode === 'slot' && (
        <div className="max-w-lg mx-auto text-center space-y-5 py-2">
          {shortlistedMenus.length >= 2 && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-xs font-semibold text-orange-900">
              <input
                id="shortlist-toggle"
                type="checkbox"
                checked={useShortlistOnly}
                onChange={(e) => {
                  setUseShortlistOnly(e.target.checked);
                  setSlotIndex(0);
                  setWinner(null);
                }}
                className="accent-[#E85D2A] w-3.5 h-3.5 cursor-pointer"
              />
              <label htmlFor="shortlist-toggle" className="cursor-pointer">
                찜한 후보 {shortlistedMenus.length}개 중에서만 뽑기
              </label>
            </div>
          )}

          {/* Slot Display Box */}
          <div
            className={`relative rounded-3xl border-2 p-7 sm:p-9 transition-all ${
              winner
                ? 'bg-gradient-to-b from-orange-50 to-white border-[#E85D2A] shadow-lg shadow-orange-500/10'
                : spinning
                  ? 'bg-stone-50 border-stone-300 animate-slot-pulse'
                  : 'bg-stone-50/80 border-stone-200'
            }`}
          >
            {displayedSlotMenu ? (
              <div className="space-y-3">
                <div className="text-6xl sm:text-7xl select-none">
                  {displayedSlotMenu.emoji}
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1.5 mb-1.5">
                    {displayedSlotMenu.isFavoriteSpot && (
                      <span className="inline-block text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                        ⭐ 단골집
                      </span>
                    )}
                    <span className="inline-block text-xs font-bold px-2.5 py-0.5 rounded-full bg-white border border-stone-200 text-stone-600">
                      {displayedSlotMenu.category} · 적합도{' '}
                      {displayedSlotMenu.matchPercent}%
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-stone-900">
                    {displayedSlotMenu.name}
                  </h3>
                  {displayedSlotMenu.signatureMenus &&
                    displayedSlotMenu.signatureMenus.length > 0 && (
                      <p className="text-xs font-semibold text-[#C2410C] mt-1">
                        대표: {displayedSlotMenu.signatureMenus.join(' · ')}
                      </p>
                    )}
                </div>
                <p className="text-xs sm:text-sm text-stone-600 max-w-sm mx-auto">
                  {displayedSlotMenu.description}
                </p>

                {winner && (
                  <div className="pt-2 space-y-3 animate-pop-in">
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {winner.matchReasons.map((r) => (
                        <span
                          key={r}
                          className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-orange-100/80 text-orange-900"
                        >
                          {r}
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => onConfirmMenu(winner)}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        이걸로 오늘 점심 확정!
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleVote(winner)}
                        className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          pollMap.get(winner.id)?.myVoted
                            ? 'bg-amber-500 text-white border-amber-500'
                            : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                        }`}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        {pollMap.get(winner.id)?.myVoted
                          ? `투표 완료 (${pollMap.get(winner.id)?.voteCount ?? 1})`
                          : '오늘 투표에 올리기'}
                      </button>
                      <a
                        href={buildNaverMapUrl(
                          locationName,
                          winner.searchKeyword,
                          winner.isFavoriteSpot
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3.5 py-2.5 rounded-xl bg-[#03C75A]/15 text-[#029944] text-xs font-bold hover:bg-[#03C75A]/25"
                      >
                        네이버 지도 <ExternalLink className="w-3 h-3" />
                      </a>
                      <a
                        href={buildKakaoMapUrl(
                          locationName,
                          winner.searchKeyword,
                          winner.isFavoriteSpot
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3.5 py-2.5 rounded-xl bg-[#FEE500]/50 text-stone-900 text-xs font-bold hover:bg-[#FEE500]/75"
                      >
                        카카오맵 <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-stone-500">후보 메뉴가 없습니다.</p>
            )}
          </div>

          <button
            type="button"
            disabled={spinning || activeSlotPool.length === 0}
            onClick={handleSpin}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#E85D2A] hover:bg-[#D14D1E] disabled:opacity-60 text-white font-extrabold text-base shadow-md shadow-[#E85D2A]/25 inline-flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Sparkles className={`w-5 h-5 ${spinning ? 'animate-spin' : ''}`} />
            {spinning
              ? '오늘의 운명을 돌리는 중...'
              : winner
                ? '한 번 더 돌려보기!'
                : '랜덤 슬롯 돌리기!'}
          </button>

          <p className="text-xs text-stone-400">
            현재 풀: {activeSlotPool.map((m) => m.name).slice(0, 6).join(', ')}
            {activeSlotPool.length > 6 ? ` 외 ${activeSlotPool.length - 6}개` : ''}
          </p>
        </div>
      )}

      {/* CARD SWIPE MODE */}
      {mode === 'swipe' && (
        <div className="max-w-md mx-auto space-y-5">
          {!swipeFinished && currentCard ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-stone-400 px-1">
                <span>
                  후보 {swipeIdx + 1} / {candidatePool.length}
                </span>
                <span>
                  찜 {likedIds.length} · 패스 {passedIds.length}
                </span>
              </div>

              <div
                key={currentCard.id}
                className="rounded-3xl bg-gradient-to-b from-[#FFF9F5] to-white border border-stone-200 shadow-md p-6 text-center space-y-4 animate-pop-in"
              >
                <div className="w-20 h-20 mx-auto rounded-2xl bg-white border border-orange-100 shadow-xs flex items-center justify-center text-5xl">
                  {currentCard.emoji}
                </div>
                <div>
                  <span className="text-xs font-bold text-[#E85D2A]">
                    {currentCard.isFavoriteSpot ? '⭐ 단골집 · ' : ''}
                    {currentCard.category} · 적합도 {currentCard.matchPercent}%
                  </span>
                  <h3 className="text-2xl font-black text-stone-900 mt-1">
                    {currentCard.name}
                  </h3>
                  {currentCard.signatureMenus &&
                    currentCard.signatureMenus.length > 0 && (
                      <p className="text-xs font-semibold text-[#C2410C] mt-1">
                        대표: {currentCard.signatureMenus.join(' · ')}
                      </p>
                    )}
                  <p className="text-sm text-stone-600 mt-1.5">
                    {currentCard.description}
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-1.5">
                  {currentCard.matchReasons.map((r) => (
                    <span
                      key={r}
                      className="text-xs font-medium px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700"
                    >
                      {r}
                    </span>
                  ))}
                </div>

                <div className="text-xs text-stone-400">
                  평균 약 {currentCard.avgPrice.toLocaleString()}원 ·{' '}
                  {currentCard.kcalApprox} kcal
                </div>
              </div>

              {/* Swipe Controls */}
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => handleSwipeDecision('pass')}
                  className="py-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-1 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  패스
                </button>
                <button
                  type="button"
                  onClick={() => onToggleVote(currentCard)}
                  className={`py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1 border transition cursor-pointer ${
                    pollMap.get(currentCard.id)?.myVoted
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  {pollMap.get(currentCard.id)?.voteCount
                    ? `투표 ${pollMap.get(currentCard.id)?.voteCount}`
                    : '투표'}
                </button>
                <button
                  type="button"
                  onClick={() => onConfirmMenu(currentCard)}
                  className="py-3 rounded-2xl bg-[#E85D2A] hover:bg-[#D14D1E] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1 transition cursor-pointer shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  확정
                </button>
                <button
                  type="button"
                  onClick={() => handleSwipeDecision('like')}
                  className="py-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-1 transition cursor-pointer"
                >
                  <Heart className="w-4 h-4 fill-rose-500" />
                  찜
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 px-4 rounded-3xl bg-stone-50 border border-stone-200 space-y-4">
              <div className="text-4xl">🎉</div>
              <div>
                <h3 className="text-lg font-extrabold text-stone-900">
                  후보 카드를 모두 확인했어요!
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  {shortlistedMenus.length > 0
                    ? `찜해둔 ${shortlistedMenus.length}개 중에서 골라보거나 슬롯으로 최종 결정해보세요.`
                    : '마음에 드는 메뉴를 다시 살펴보시겠어요?'}
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {shortlistedMenus.length >= 2 && (
                  <button
                    type="button"
                    onClick={() => {
                      setUseShortlistOnly(true);
                      setSlotIndex(0);
                      setWinner(null);
                      setMode('slot');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-[#E85D2A] text-white text-xs font-bold cursor-pointer"
                  >
                    찜한 {shortlistedMenus.length}개로 슬롯 돌리기
                  </button>
                )}
                <button
                  type="button"
                  onClick={resetSwipe}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-stone-300 text-stone-700 text-xs font-bold cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  처음부터 다시 보기
                </button>
              </div>
            </div>
          )}

          {/* Shortlist Tray */}
          {shortlistedMenus.length > 0 && (
            <div className="pt-3 border-t border-stone-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-600">
                  ♥ 찜한 후보 ({shortlistedMenus.length})
                </span>
                {shortlistedMenus.length >= 2 && (
                  <button
                    type="button"
                    onClick={() => {
                      setUseShortlistOnly(true);
                      setSlotIndex(0);
                      setWinner(null);
                      setMode('slot');
                    }}
                    className="text-xs font-bold text-[#E85D2A] hover:underline cursor-pointer"
                  >
                    이 후보들로만 랜덤 뽑기 →
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {shortlistedMenus.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onConfirmMenu(m)}
                    title="클릭하여 오늘 점심으로 확정"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-semibold text-stone-800 transition cursor-pointer"
                  >
                    <span>{m.emoji}</span>
                    <span>{m.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
