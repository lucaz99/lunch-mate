import React, { useState } from 'react';
import {
  CheckCircle2,
  Dices,
  ExternalLink,
  Flame,
  Shuffle,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  buildKakaoMapUrl,
  buildNaverMapUrl,
} from '../services/weatherAndLocation';
import { LunchContext, ScoredMenu } from '../types/lunch';
import { getConditionHeadline } from '../utils/recommender';

interface RecommendationSectionProps {
  scoredMenus: ScoredMenu[];
  context: LunchContext;
  locationName: string;
  todayConfirmedMenuId: string | null;
  onConfirmMenu: (menu: ScoredMenu) => void;
  onShuffle: () => void;
  onOpenPicker: () => void;
}

export const RecommendationSection: React.FC<RecommendationSectionProps> = ({
  scoredMenus,
  context,
  locationName,
  todayConfirmedMenuId,
  onConfirmMenu,
  onShuffle,
  onOpenPicker,
}) => {
  const [showAll, setShowAll] = useState(false);

  const headline = getConditionHeadline(context);
  const hero = scoredMenus[0];
  const others = scoredMenus.slice(1);
  // 10 items = 2 crisp rows of 5 columns on xl desktop
  const visibleOthers = showAll ? others : others.slice(0, 10);

  if (!hero) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center">
        <p className="text-sm text-stone-600 font-medium">
          선택하신 조건에 맞는 메뉴가 없어요. 음식 종류 필터를 넓혀보세요!
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-3">
      {/* Compact Contextual Headline + Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-0.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100/80 text-[#C2410C] text-[11px] font-bold shrink-0">
            <Sparkles className="w-3 h-3" />
            맞춤 분석
          </span>
          <h2 className="text-sm sm:text-base font-extrabold tracking-tight text-stone-900 truncate">
            {headline.title}
          </h2>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onShuffle}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-stone-200 hover:border-stone-300 text-[11px] font-semibold text-stone-700 shadow-2xs transition cursor-pointer"
          >
            <Shuffle className="w-3 h-3" />
            순서 바꾸기
          </button>
          <button
            type="button"
            onClick={onOpenPicker}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-[11px] font-semibold text-white shadow-2xs transition cursor-pointer"
          >
            <Dices className="w-3 h-3" />
            랜덤 뽑기
          </button>
        </div>
      </div>

      {/* Compact Hero #1 Best Recommendation Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#FFF7F2] via-white to-[#FFFBF5] border border-[#E85D2A]/35 shadow-sm p-3.5 sm:p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5">
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-white border border-orange-100 shadow-xs flex items-center justify-center text-3xl shrink-0">
              {hero.emoji}
            </div>

            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E85D2A] text-white text-[10px] font-bold">
                  <Flame className="w-3 h-3" /> 1순위
                </span>
                <h3 className="text-lg sm:text-xl font-black text-stone-900 tracking-tight">
                  {hero.name}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-white border border-stone-200 text-[11px] font-semibold text-stone-600">
                  {hero.category}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-700">
                  적합도 {hero.matchPercent}%
                </span>
                <span className="text-[11px] text-stone-400 hidden sm:inline">
                  약 {hero.avgPrice.toLocaleString()}원 · {hero.kcalApprox} kcal
                </span>
              </div>

              <p className="text-xs text-stone-600 truncate">{hero.description}</p>

              <div className="flex flex-wrap gap-1 pt-0.5">
                {hero.matchReasons.map((reason) => (
                  <span
                    key={reason}
                    className="inline-flex items-center px-2 py-0.5 rounded-md bg-white border border-orange-200/80 text-[11px] font-semibold text-stone-700"
                  >
                    {reason}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Hero Action Column */}
          <div className="flex sm:flex-row md:flex-col gap-1.5 md:w-44 shrink-0">
            <button
              type="button"
              onClick={() => onConfirmMenu(hero)}
              className={`flex-1 md:flex-none py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs ${
                todayConfirmedMenuId === hero.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#E85D2A] hover:bg-[#D14D1E] text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {todayConfirmedMenuId === hero.id ? '오늘 기록됨!' : '오늘 이거 먹기!'}
            </button>

            <div className="grid grid-cols-2 gap-1.5">
              <a
                href={buildNaverMapUrl(locationName, hero.searchKeyword)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-0.5 py-1.5 px-2 rounded-lg bg-[#03C75A]/10 hover:bg-[#03C75A]/20 text-[#029944] text-[11px] font-bold transition"
              >
                네이버
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
              <a
                href={buildKakaoMapUrl(locationName, hero.searchKeyword)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-0.5 py-1.5 px-2 rounded-lg bg-[#FEE500]/40 hover:bg-[#FEE500]/65 text-stone-900 text-[11px] font-bold transition"
              >
                카카오
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Compact 5-Column Runner-up Menu Grid */}
      <div>
        <div className="flex items-center justify-between mb-2 px-0.5">
          <h3 className="text-xs font-bold text-stone-600">
            추천 메뉴 ({others.length}개)
          </h3>
          {others.length > 10 && (
            <button
              type="button"
              onClick={() => setShowAll((prev) => !prev)}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#E85D2A] hover:underline cursor-pointer"
            >
              {showAll ? (
                <>
                  접기 <ChevronUp className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  전체 {others.length - 10}개 더 보기{' '}
                  <ChevronDown className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
          {visibleOthers.map((menu, idx) => {
            const rank = idx + 2;
            const confirmed = todayConfirmedMenuId === menu.id;
            return (
              <article
                key={menu.id}
                className={`rounded-xl bg-white border p-2.5 flex flex-col justify-between gap-2 transition hover:shadow-sm ${
                  menu.isRecentlyEaten
                    ? 'border-stone-200/80 opacity-60 bg-stone-50/70'
                    : 'border-stone-200/90 hover:border-stone-300'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-lg leading-none shrink-0">
                        {menu.emoji}
                      </span>
                      <span className="text-[10px] font-extrabold text-stone-400">
                        #{rank}
                      </span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-stone-100 text-stone-600 truncate">
                        {menu.category}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                        menu.isRecentlyEaten
                          ? 'bg-stone-200 text-stone-600'
                          : 'bg-orange-50 text-[#C2410C]'
                      }`}
                    >
                      {menu.isRecentlyEaten
                        ? menu.lastEatenDaysAgo === 0
                          ? '오늘'
                          : `${menu.lastEatenDaysAgo}일전`
                        : `${menu.matchPercent}%`}
                    </span>
                  </div>

                  <h4
                    title={menu.name}
                    className="font-extrabold text-stone-900 text-xs sm:text-[13px] leading-snug truncate"
                  >
                    {menu.name}
                  </h4>

                  <p
                    title={menu.matchReasons[0]}
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-stone-100/90 text-stone-600 truncate"
                  >
                    {menu.matchReasons[0]}
                  </p>
                </div>

                <div className="space-y-1.5 pt-1.5 border-t border-stone-100">
                  <div className="flex items-center justify-between text-[10px] text-stone-400">
                    <span>~{(menu.avgPrice / 1000).toFixed(menu.avgPrice % 1000 === 0 ? 0 : 1)}천원</span>
                    <span>{menu.kcalApprox}kcal</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onConfirmMenu(menu)}
                      className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] font-bold transition cursor-pointer whitespace-nowrap ${
                        confirmed
                          ? 'bg-emerald-600 text-white'
                          : 'bg-stone-900 hover:bg-[#E85D2A] text-white'
                      }`}
                    >
                      {confirmed ? '확정 ✓' : '이거 먹기'}
                    </button>
                    <a
                      href={buildNaverMapUrl(locationName, menu.searchKeyword)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`${locationName} ${menu.name} 네이버 지도 검색`}
                      className="py-1 px-1.5 rounded-lg bg-[#03C75A]/10 hover:bg-[#03C75A]/20 text-[#029944] text-[10px] font-bold transition shrink-0"
                    >
                      네이버
                    </a>
                    <a
                      href={buildKakaoMapUrl(locationName, menu.searchKeyword)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`${locationName} ${menu.name} 카카오맵 검색`}
                      className="py-1 px-1.5 rounded-lg bg-[#FEE500]/45 hover:bg-[#FEE500]/70 text-stone-900 text-[10px] font-bold transition shrink-0"
                    >
                      카카오
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
