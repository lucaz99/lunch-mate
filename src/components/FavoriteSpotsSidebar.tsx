import React, { useMemo, useState } from 'react';
import {
  Check,
  CheckCircle2,
  ExternalLink,
  Plus,
  Search,
  Star,
  Trash2,
  X,
  ArrowUpDown,
} from 'lucide-react';
import { MENU_CATEGORIES } from '../data/menus';
import {
  buildKakaoMapUrl,
  buildNaverMapUrl,
} from '../services/weatherAndLocation';
import { MenuCategory, MenuItem, ScoredMenu } from '../types/lunch';

interface FavoriteSpotsSidebarProps {
  favoriteSpots: ScoredMenu[];
  customSpotIds: Set<string>;
  disabledSpotIds: string[];
  todayConfirmedMenuId: string | null;
  locationName: string;
  onToggleSpotEnabled: (id: string) => void;
  onConfirmSpot: (menu: ScoredMenu) => void;
  onAddCustomSpot: (spot: MenuItem) => void;
  onRemoveCustomSpot: (id: string) => void;
  onEnableAll: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

const CATEGORY_EMOJI: Record<MenuCategory, string> = {
  한식: '🍲',
  중식: '🌶️',
  일식: '🍣',
  양식: '🍝',
  '아시안/분식': '🍜',
  가벼운식사: '🥗',
};

export const FavoriteSpotsSidebar: React.FC<FavoriteSpotsSidebarProps> = ({
  favoriteSpots,
  customSpotIds,
  disabledSpotIds,
  todayConfirmedMenuId,
  locationName,
  onToggleSpotEnabled,
  onConfirmSpot,
  onAddCustomSpot,
  onRemoveCustomSpot,
  onEnableAll,
  isOpenMobile,
  onCloseMobile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortByScore, setSortByScore] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // New custom spot form state
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<MenuCategory>('한식');
  const [newSignature, setNewSignature] = useState('');

  const enabledCount = favoriteSpots.length - disabledSpotIds.filter((id) =>
    favoriteSpots.some((s) => s.id === id)
  ).length;

  const displayedSpots = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = favoriteSpots.filter((spot) => {
      if (!q) return true;
      return (
        spot.name.toLowerCase().includes(q) ||
        spot.category.toLowerCase().includes(q) ||
        (spot.signatureMenus ?? []).some((m) => m.toLowerCase().includes(q))
      );
    });

    if (sortByScore) {
      return list;
    }
    return [...list].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  }, [favoriteSpots, searchQuery, sortByScore]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;

    const sigList = newSignature
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const newSpot: MenuItem = {
      id: `custom-spot-${Date.now()}`,
      name: trimmed,
      emoji: CATEGORY_EMOJI[newCategory],
      category: newCategory,
      priceRange: '10kTo15k',
      avgPrice: 11000,
      description:
        sigList.length > 0
          ? `${sigList.join(' · ')} 등을 즐길 수 있는 나만의 기본 확정 식당`
          : '직접 등록한 우리 주변 단골 음식점',
      searchKeyword: `강서구 ${trimmed}`,
      tags: ['hot', 'hearty', 'mondayBoost'],
      soloFriendly: true,
      groupFriendly: true,
      fastServe: true,
      relaxedMood: true,
      kcalApprox: 650,
      isFavoriteSpot: true,
      signatureMenus: sigList.length > 0 ? sigList : undefined,
    };

    onAddCustomSpot(newSpot);
    setNewName('');
    setNewSignature('');
    setShowAddForm(false);
  };

  const sidebarContent = (
    <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs flex flex-col max-h-[calc(100vh-4.25rem)] overflow-hidden">
      {/* Sidebar Header */}
      <div className="p-3 border-b border-stone-100 space-y-2 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-stone-900 leading-tight">
                기본 확정 식당
              </h2>
              <p className="text-[11px] text-stone-400">
                추천 포함 {enabledCount} / {favoriteSpots.length}곳
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowAddForm((prev) => !prev)}
              title="단골 식당 추가"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-stone-900 hover:bg-[#E85D2A] text-white text-[11px] font-bold transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              추가
            </button>
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-xl text-stone-400 hover:bg-stone-100 hover:text-stone-700 cursor-pointer"
              aria-label="사이드바 닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Add Custom Spot Form */}
        {showAddForm && (
          <form
            onSubmit={handleAddSubmit}
            className="p-3 rounded-2xl bg-stone-50 border border-stone-200 space-y-2 animate-pop-in"
          >
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="식당 이름 (예: 강서칼국수)"
              required
              className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-stone-200 text-xs text-stone-900 focus:outline-none focus:border-[#E85D2A]"
            />
            <div className="flex gap-1.5">
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as MenuCategory)}
                className="px-2 py-1.5 rounded-xl bg-white border border-stone-200 text-xs text-stone-700"
              >
                {MENU_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={newSignature}
                onChange={(e) => setNewSignature(e.target.value)}
                placeholder="대표 메뉴 (쉼표 구분)"
                className="flex-1 min-w-0 px-2.5 py-1.5 rounded-xl bg-white border border-stone-200 text-xs text-stone-900 focus:outline-none focus:border-[#E85D2A]"
              />
            </div>
            <div className="flex justify-end gap-1.5">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-stone-500 hover:bg-stone-200 cursor-pointer"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-3 py-1 rounded-lg bg-[#E85D2A] text-white text-[11px] font-bold hover:bg-[#D14D1E] cursor-pointer"
              >
                등록
              </button>
            </div>
          </form>
        )}

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="식당·메뉴 검색..."
              className="w-full pl-8 pr-2.5 py-1.5 rounded-xl bg-stone-100/90 border border-transparent focus:bg-white focus:border-stone-300 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none transition"
            />
          </div>
          <button
            type="button"
            onClick={() => setSortByScore((prev) => !prev)}
            title={sortByScore ? '오늘 추천순 정렬 중' : '가나다순 정렬 중'}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-[11px] font-semibold text-stone-600 transition cursor-pointer shrink-0"
          >
            <ArrowUpDown className="w-3 h-3" />
            {sortByScore ? '추천순' : '가나다'}
          </button>
        </div>

        {disabledSpotIds.length > 0 && (
          <div className="flex items-center justify-between text-[11px] bg-stone-50 px-2.5 py-1.5 rounded-xl border border-stone-200/70">
            <span className="text-stone-500">
              {disabledSpotIds.length}곳 오늘 후보에서 제외됨
            </span>
            <button
              type="button"
              onClick={onEnableAll}
              className="font-bold text-[#E85D2A] hover:underline cursor-pointer"
            >
              모두 켜기
            </button>
          </div>
        )}
      </div>

      {/* Scrollable Restaurant List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {displayedSpots.length === 0 ? (
          <div className="py-8 text-center text-xs text-stone-400">
            검색 결과가 없어요.
          </div>
        ) : (
          displayedSpots.map((spot) => {
            const isDisabled = disabledSpotIds.includes(spot.id);
            const isConfirmed = todayConfirmedMenuId === spot.id;
            const isCustom = customSpotIds.has(spot.id);

            return (
              <div
                key={spot.id}
                className={`group rounded-xl border p-2 transition ${
                  isConfirmed
                    ? 'bg-emerald-50/70 border-emerald-300'
                    : isDisabled
                      ? 'bg-stone-50/70 border-stone-200/60 opacity-55'
                      : 'bg-white border-stone-200/80 hover:border-stone-300 hover:shadow-2xs'
                }`}
              >
                <div className="flex items-start gap-2">
                  {/* Include / Exclude checkbox */}
                  <button
                    type="button"
                    onClick={() => onToggleSpotEnabled(spot.id)}
                    title={
                      isDisabled
                        ? '클릭하여 오늘 추천 후보에 다시 포함'
                        : '클릭하여 오늘 추천 후보에서 일시 제외'
                    }
                    className={`mt-0.5 w-4.5 h-4.5 rounded-md border flex items-center justify-center shrink-0 transition cursor-pointer ${
                      isDisabled
                        ? 'bg-white border-stone-300 text-transparent'
                        : 'bg-[#E85D2A] border-[#E85D2A] text-white'
                    }`}
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </button>

                  {/* Spot Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-base leading-none shrink-0">
                          {spot.emoji}
                        </span>
                        <span
                          className={`text-xs font-extrabold truncate ${
                            isDisabled
                              ? 'line-through text-stone-400'
                              : 'text-stone-900'
                          }`}
                        >
                          {spot.name}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                          spot.isRecentlyEaten
                            ? 'bg-stone-200 text-stone-600'
                            : 'bg-orange-50 text-[#C2410C]'
                        }`}
                      >
                        {spot.isRecentlyEaten
                          ? spot.lastEatenDaysAgo === 0
                            ? '오늘'
                            : `${spot.lastEatenDaysAgo}일전`
                          : `${spot.matchPercent}%`}
                      </span>
                    </div>

                    {spot.signatureMenus && spot.signatureMenus.length > 0 && (
                      <p className="text-[11px] text-stone-500 truncate mt-0.5">
                        {spot.signatureMenus.join(' · ')}
                      </p>
                    )}

                    {/* Compact Action Row */}
                    <div className="flex items-center justify-between gap-1 mt-2">
                      <div className="flex items-center gap-1">
                        <a
                          href={buildNaverMapUrl(
                            locationName,
                            spot.searchKeyword,
                            true
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[#03C75A]/10 hover:bg-[#03C75A]/20 text-[#029944] text-[10px] font-bold transition"
                        >
                          네이버 <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                        <a
                          href={buildKakaoMapUrl(
                            locationName,
                            spot.searchKeyword,
                            true
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[#FEE500]/45 hover:bg-[#FEE500]/70 text-stone-900 text-[10px] font-bold transition"
                        >
                          카카오 <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                        {isCustom && (
                          <button
                            type="button"
                            onClick={() => onRemoveCustomSpot(spot.id)}
                            title="직접 등록한 식당 삭제"
                            className="p-0.5 rounded text-stone-400 hover:text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => onConfirmSpot(spot)}
                        className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                          isConfirmed
                            ? 'bg-emerald-600 text-white'
                            : 'bg-stone-100 hover:bg-stone-900 text-stone-700 hover:text-white'
                        }`}
                      >
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        {isConfirmed ? '확정됨' : '오늘 확정'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Tip */}
      <div className="px-4 py-2.5 border-t border-stone-100 bg-stone-50/70 text-[11px] text-stone-400 shrink-0">
        체크를 해제하면 기본 식당 랜덤 뽑기 후보에서 잠깐 제외돼요.
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:block w-72 shrink-0">
        <div className="sticky top-[3.5rem]">{sidebarContent}</div>
      </aside>

      {/* Mobile Slide-over Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
          <div
            className="fixed inset-0 bg-stone-950/40 backdrop-blur-[1px]"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 w-[88vw] max-w-sm h-full p-3 flex flex-col justify-center animate-pop-in">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
