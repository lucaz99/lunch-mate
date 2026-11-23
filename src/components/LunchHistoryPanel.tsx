import React, { useState } from 'react';
import {
  Calendar,
  History,
  Plus,
  Trash2,
  Ban,
  MapPin,
} from 'lucide-react';
import { FAVORITE_SPOTS, GENERAL_MENUS } from '../data/menus';
import { LunchHistoryEntry, MenuItem } from '../types/lunch';
import { daysBetweenDates, getTodayDateString } from '../utils/recommender';

interface LunchHistoryPanelProps {
  history: LunchHistoryEntry[];
  favoriteSpots: MenuItem[];
  excludeRecentDays: number;
  locationName: string;
  onAddManualEntry: (menu: MenuItem, daysAgo: number) => void;
  onDeleteEntry: (id: string) => void;
  onClearAll: () => void;
}

export const LunchHistoryPanel: React.FC<LunchHistoryPanelProps> = ({
  history,
  favoriteSpots,
  excludeRecentDays,
  locationName,
  onAddManualEntry,
  onDeleteEntry,
  onClearAll,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedMenuId, setSelectedMenuId] = useState(
    favoriteSpots[0]?.id ?? FAVORITE_SPOTS[0].id
  );
  const [daysAgo, setDaysAgo] = useState(1);

  const allAvailableMenus = [...favoriteSpots, ...GENERAL_MENUS];

  const todayStr = getTodayDateString();

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
    <section className="bg-white rounded-3xl border border-stone-200/80 shadow-xs p-5 sm:p-7 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 flex items-center gap-2">
            <History className="w-5 h-5 text-[#E85D2A]" />
            최근 점심 기록 & 중복 방지
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            기록된 메뉴는 최근 {excludeRecentDays || 3}일 동안 자동으로 추천 우선순위에서 제외돼요.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAddForm((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            지난 점심 기록 추가
          </button>
          {history.length > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-semibold transition cursor-pointer"
            >
              전체 초기화
            </button>
          )}
        </div>
      </div>

      {/* Active Exclusion Banner */}
      {excludedNames.length > 0 && (
        <div className="rounded-2xl bg-emerald-50/80 border border-emerald-200/80 p-3.5 flex flex-wrap items-center gap-2">
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
              먹었던 메뉴
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
            추천 메뉴에서 &ldquo;오늘 이거 먹기!&rdquo;를 누르거나 어제 먹은 점심을 추가하면,
            내일부터 겹치지 않게 똑똑하게 추천해드려요.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-stone-100">
          {history.map((entry) => {
            const diff = daysBetweenDates(entry.date, todayStr);
            const dayBadge =
              diff === 0 ? '오늘' : diff === 1 ? '어제' : `${diff}일 전`;
            return (
              <div
                key={entry.id}
                className="py-3.5 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
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
                    </div>
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

                <button
                  type="button"
                  onClick={() => onDeleteEntry(entry.id)}
                  title="기록 삭제"
                  className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
