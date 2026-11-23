import React, { useMemo, useState } from 'react';
import {
  Ban,
  Calendar,
  History,
  MapPin,
  MessageSquareQuote,
  Plus,
  Star,
  Trash2,
} from 'lucide-react';
import { FAVORITE_SPOTS, GENERAL_MENUS } from '../data/menus';
import {
  LunchHistoryEntry,
  LunchReviewRecord,
  MenuItem,
} from '../types/lunch';
import { daysBetweenDates, getTodayDateString } from '../utils/recommender';

interface LunchHistoryPanelProps {
  history: LunchHistoryEntry[];
  reviews: LunchReviewRecord[];
  memberId: string;
  favoriteSpots: MenuItem[];
  excludeRecentDays: number;
  locationName: string;
  onAddManualEntry: (menu: MenuItem, daysAgo: number) => void;
  onDeleteEntry: (id: string) => void;
  onClearAll: () => void;
  onOpenReviewForHistory: (entry: LunchHistoryEntry) => void;
  onDeleteReview: (id: number) => Promise<void>;
}

type HistorySubTab = 'mine' | 'teamReviews';

export const LunchHistoryPanel: React.FC<LunchHistoryPanelProps> = ({
  history,
  reviews,
  memberId,
  favoriteSpots,
  excludeRecentDays,
  locationName,
  onAddManualEntry,
  onDeleteEntry,
  onClearAll,
  onOpenReviewForHistory,
  onDeleteReview,
}) => {
  const [subTab, setSubTab] = useState<HistorySubTab>('mine');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedMenuId, setSelectedMenuId] = useState(
    favoriteSpots[0]?.id ?? FAVORITE_SPOTS[0].id
  );
  const [daysAgo, setDaysAgo] = useState(1);

  const allAvailableMenus = [...favoriteSpots, ...GENERAL_MENUS];
  const todayStr = getTodayDateString();

  // Map (itemId + eatenDate) -> my review so history rows show existing rating & comment
  const myReviewByItemDate = useMemo(() => {
    const map = new Map<string, LunchReviewRecord>();
    for (const r of reviews) {
      if (r.authorId === memberId) {
        const key = `${r.itemId}::${r.eatenDate}`;
        if (!map.has(key)) map.set(key, r);
      }
    }
    return map;
  }, [reviews, memberId]);

  const excludedNames = Array.from(
    new Set(
      history
        .filter(
          (entry) =>
            excludeRecentDays > 0 &&
            daysBetweenDates(entry.date, todayStr) <= excludeRecentDays
        )
        .map((e) => `${e.emoji} ${e.menuName}`)
    )
  );

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const menu = allAvailableMenus.find((m) => m.id === selectedMenuId);
    if (!menu) return;
    onAddManualEntry(menu, daysAgo);
    setShowAddForm(false);
  };

  return (
    <section className="bg-white rounded-2xl border border-stone-200/80 shadow-xs p-5 sm:p-6 space-y-5">
      {/* Header & Sub-tab Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-stone-900 flex items-center gap-2">
            <History className="w-5 h-5 text-[#E85D2A]" />
            점심 기록 &amp; 팀 별점 리뷰
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            확정한 점심에 별점과 한줄평을 남기면 팀원들과 실시간으로 공유돼요.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex bg-stone-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setSubTab('mine')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                subTab === 'mine'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              내 점심 기록 ({history.length})
            </button>
            <button
              type="button"
              onClick={() => setSubTab('teamReviews')}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                subTab === 'teamReviews'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <MessageSquareQuote className="w-3.5 h-3.5 text-[#E85D2A]" />
              팀원 리뷰 ({reviews.length})
            </button>
          </div>
        </div>
      </div>

      {subTab === 'mine' && (
        <div className="space-y-4">
          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-stone-500">
              기록된 메뉴는 최근 {excludeRecentDays || 3}일 동안 중복 추천에서
              자동 제외돼요.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm((prev) => !prev)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                지난 점심 기록 추가
              </button>
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={onClearAll}
                  className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-semibold transition cursor-pointer"
                >
                  전체 초기화
                </button>
              )}
            </div>
          </div>

          {/* Active Exclusion Banner */}
          {excludedNames.length > 0 && (
            <div className="rounded-2xl bg-emerald-50/80 border border-emerald-200/80 p-3 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800">
                <Ban className="w-3.5 h-3.5" />
                최근 {excludeRecentDays}일 중복 방지 적용 중:
              </span>
              {excludedNames.map((label) => (
                <span
                  key={label}
                  className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white border border-emerald-200 text-stone-700"
                >
                  {label}
                </span>
              ))}
            </div>
          )}

          {/* Quick Manual Add Form */}
          {showAddForm && (
            <form
              onSubmit={handleManualSubmit}
              className="rounded-2xl bg-stone-50 border border-stone-200 p-4 flex flex-col sm:flex-row items-stretch sm:items-end gap-3 animate-pop-in"
            >
              <div className="flex-1">
                <label className="block text-xs font-bold text-stone-600 mb-1">
                  먹었던 메뉴 / 식당
                </label>
                <select
                  value={selectedMenuId}
                  onChange={(e) => setSelectedMenuId(e.target.value)}
                  className="w-full rounded-xl bg-white border border-stone-300 px-3 py-2 text-sm text-stone-800"
                >
                  <optgroup label={`⭐ 기본 확정 식당 (${favoriteSpots.length}곳)`}>
                    {favoriteSpots.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.emoji} {m.name} ({m.category})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="일반 점심 메뉴">
                    {GENERAL_MENUS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.emoji} {m.name} ({m.category})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div className="sm:w-40">
                <label className="block text-xs font-bold text-stone-600 mb-1">
                  언제 먹었나요?
                </label>
                <select
                  value={daysAgo}
                  onChange={(e) => setDaysAgo(Number(e.target.value))}
                  className="w-full rounded-xl bg-white border border-stone-300 px-3 py-2 text-sm text-stone-800"
                >
                  <option value={0}>오늘</option>
                  <option value={1}>어제 (1일 전)</option>
                  <option value={2}>그제 (2일 전)</option>
                  <option value={3}>3일 전</option>
                  <option value={5}>5일 전</option>
                </select>
              </div>

              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#E85D2A] hover:bg-[#D14D1E] text-white text-sm font-bold transition cursor-pointer"
              >
                기록 저장
              </button>
            </form>
          )}

          {/* History List */}
          {history.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-stone-300 bg-stone-50/50 space-y-2">
              <div className="text-3xl">🍽️</div>
              <p className="text-sm font-bold text-stone-700">
                아직 기록된 점심이 없어요
              </p>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                추천 메뉴나 기본 식당에서 &ldquo;오늘 먹기 / 확정&rdquo;을 누르면
                여기에 기록되고, 식사 후 별점과 한줄평도 남길 수 있어요.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {history.map((entry) => {
                const diff = daysBetweenDates(entry.date, todayStr);
                const dayBadge =
                  diff === 0 ? '오늘' : diff === 1 ? '어제' : `${diff}일 전`;
                const myReview = myReviewByItemDate.get(
                  `${entry.menuId}::${entry.date}`
                );

                return (
                  <div
                    key={entry.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-stone-100 flex items-center justify-center text-2xl shrink-0">
                        {entry.emoji}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-stone-900 text-sm">
                            {entry.menuName}
                          </span>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-stone-100 text-stone-600">
                            {entry.category}
                          </span>
                          <span className="text-[11px] font-bold text-[#E85D2A]">
                            {dayBadge}
                          </span>
                          {myReview && (
                            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-amber-600">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              {myReview.rating}.0
                            </span>
                          )}
                        </div>

                        {myReview?.comment && (
                          <p className="text-xs text-stone-700 bg-amber-50/70 border border-amber-200/70 rounded-lg px-2.5 py-1 mt-1.5 inline-block">
                            &ldquo;{myReview.comment}&rdquo;
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-stone-400 mt-1">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {entry.date}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3" />{' '}
                            {entry.contextSnapshot.locationName || locationName}
                          </span>
                          <span>{entry.contextSnapshot.weatherSummary}</span>
                          {entry.contextSnapshot.hadCompanyDinner && (
                            <span className="text-orange-600 font-semibold">
                              🍺 회식 다음날
                            </span>
                          )}
                          {entry.contextSnapshot.wasWeekendYesterday && (
                            <span className="text-amber-700 font-semibold">
                              📅 주말 직후
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => onOpenReviewForHistory(entry)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          myReview
                            ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                            : 'bg-white hover:bg-amber-50 text-stone-700 hover:text-amber-800 border-stone-200 hover:border-amber-300'
                        }`}
                      >
                        <Star
                          className={`w-3.5 h-3.5 ${
                            myReview
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-amber-400'
                          }`}
                        />
                        {myReview ? '리뷰 수정' : '별점·한줄평'}
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteEntry(entry.id)}
                        title="기록 삭제"
                        className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TEAM REVIEWS FEED */}
      {subTab === 'teamReviews' && (
        <div className="space-y-3">
          {reviews.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-stone-300 bg-stone-50/50 space-y-2">
              <div className="text-3xl">💬</div>
              <p className="text-sm font-bold text-stone-700">
                아직 팀원 리뷰가 없어요
              </p>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                점심 확정 후 팝업이나 &lsquo;내 점심 기록&rsquo; 탭에서 첫 별점과
                한줄평을 남겨보세요!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {reviews.map((rev) => (
                <article
                  key={rev.id}
                  className="rounded-2xl border border-stone-200/90 bg-stone-50/40 p-3.5 flex flex-col justify-between gap-2.5"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-9 h-9 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-xl shrink-0">
                          {rev.itemEmoji}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-sm font-extrabold text-stone-900 truncate">
                              {rev.itemName}
                            </h4>
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-stone-200/70 text-stone-600 shrink-0">
                              {rev.itemType === 'spot' ? '식당' : rev.itemCategory}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-xs text-amber-500 tracking-tighter">
                              {'★'.repeat(rev.rating)}
                              <span className="text-stone-300">
                                {'★'.repeat(5 - rev.rating)}
                              </span>
                            </span>
                            <span className="text-[11px] font-bold text-stone-700">
                              {rev.rating}.0
                            </span>
                          </div>
                        </div>
                      </div>

                      {rev.authorId === memberId && (
                        <button
                          type="button"
                          onClick={() => void onDeleteReview(rev.id)}
                          title="내 리뷰 삭제"
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {rev.comment ? (
                      <p className="text-xs sm:text-[13px] text-stone-700 bg-white rounded-xl border border-stone-200/70 px-3 py-2 leading-relaxed">
                        &ldquo;{rev.comment}&rdquo;
                      </p>
                    ) : (
                      <p className="text-[11px] text-stone-400 italic px-1">
                        (별점만 남김)
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-stone-400 pt-1 border-t border-stone-200/60">
                    <span className="font-semibold text-stone-600">
                      by {rev.authorName}
                    </span>
                    <span>{rev.eatenDate}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
