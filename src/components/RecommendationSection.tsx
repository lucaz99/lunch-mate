import React, { useState } from 'react';
import {
  CheckCircle2,
  Dices,
  ExternalLink,
  Flame,
  Shuffle,
  Sparkles,
  Star,
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
  const visibleOthers = showAll ? others : others.slice(0, 6);

  if (!hero) {
    return (
      <div className="bg-white rounded-3xl border border-stone-200 p-10 text-center">
        <p className="text-stone-600 font-medium">
          선택하신 조건에 맞는 메뉴가 없어요. 음식 종류 필터를 넓혀보세요!
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-5">
      {/* Contextual Headline + Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 px-1">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E85D2A] mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            {locationName} 기준 맞춤 분석
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-stone-900">
            {headline.title}
          </h2>
          <p className="text-sm text-stone-500 mt-0.5">{headline.subtitle}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onShuffle}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-stone-200 hover:border-stone-300 text-xs font-semibold text-stone-700 shadow-2xs transition cursor-pointer"
          >
            <Shuffle className="w-3.5 h-3.5" />
            순서 살짝 바꾸기
          </button>
          <button
            type="button"
            onClick={onOpenPicker}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-xs font-semibold text-white shadow-xs transition cursor-pointer"
          >
            <Dices className="w-3.5 h-3.5" />
            랜덤 뽑기
          </button>
        </div>
      </div>

      {/* Hero #1 Best Recommendation Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FFF7F2] via-white to-[#FFFBF5] border-2 border-[#E85D2A]/30 shadow-md shadow-orange-950/5 p-5 sm:p-7">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3.5 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E85D2A] text-white text-xs font-bold">
                <Flame className="w-3.5 h-3.5" /> 오늘의 1순위 추천
              </span>
              {hero.isFavoriteSpot && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 border border-amber-300/80 text-amber-900 text-xs font-bold">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> 우리 단골집
                </span>
              )}
              <span className="px-2.5 py-1 rounded-full bg-white border border-stone-200 text-xs font-semibold text-stone-700">
                {hero.category}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700">
                적합도 {hero.matchPercent}%
              </span>
              {hero.isRecentlyEaten && (
                <span className="px-2.5 py-1 rounded-full bg-stone-200 text-xs font-semibold text-stone-600">
                  최근 식사 기록 있음
                </span>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border border-orange-100 shadow-sm flex items-center justify-center text-4xl sm:text-5xl animate-float-slow shrink-0">
                {hero.emoji}
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
                  {hero.name}
                </h3>
                <p className="text-sm text-stone-600 mt-1 leading-relaxed">
                  {hero.description}
                </p>
                {hero.signatureMenus && hero.signatureMenus.length > 0 && (
                  <p className="text-xs font-semibold text-[#C2410C] mt-1.5">
                    대표 메뉴: {hero.signatureMenus.join(' · ')}
                  </p>
                )}
              </div>
            </div>

            {/* Match reasons */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {hero.matchReasons.map((reason) => (
                <span
                  key={reason}
                  className="inline-flex items-center px-3 py-1 rounded-xl bg-white border border-orange-200/80 text-xs font-semibold text-stone-800 shadow-2xs"
                >
                  {reason}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-4 text-xs text-stone-500 pt-1">
              <span>평균 약 {hero.avgPrice.toLocaleString()}원</span>
              <span>•</span>
              <span>약 {hero.kcalApprox} kcal</span>
              {hero.fastServe && (
                <>
                  <span>•</span>
                  <span className="text-stone-700 font-medium">빠른 식사 가능</span>
                </>
              )}
            </div>
          </div>

          {/* Hero Action Column */}
          <div className="flex flex-col gap-2.5 md:w-56 shrink-0">
            <button
              type="button"
              onClick={() => onConfirmMenu(hero)}
              className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-sm ${
                todayConfirmedMenuId === hero.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#E85D2A] hover:bg-[#D14D1E] text-white shadow-[#E85D2A]/25'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              {todayConfirmedMenuId === hero.id
                ? '오늘 점심으로 기록됨!'
                : '오늘 이거 먹기!'}
            </button>

            <div className="grid grid-cols-2 gap-2">
              <a
                href={buildNaverMapUrl(
                  locationName,
                  hero.searchKeyword,
                  hero.isFavoriteSpot
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 py-2.5 px-3 rounded-xl bg-[#03C75A]/10 hover:bg-[#03C75A]/20 text-[#029944] text-xs font-bold transition"
              >
                네이버 지도
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href={buildKakaoMapUrl(
                  locationName,
                  hero.searchKeyword,
                  hero.isFavoriteSpot
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 py-2.5 px-3 rounded-xl bg-[#FEE500]/35 hover:bg-[#FEE500]/55 text-stone-900 text-xs font-bold transition"
              >
                카카오맵
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Runner-up Menu Cards */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-sm font-bold text-stone-700">
            함께 고려해볼 만한 추천 메뉴 ({others.length}개)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {visibleOthers.map((menu, idx) => {
            const rank = idx + 2;
            const confirmed = todayConfirmedMenuId === menu.id;
            return (
              <article
                key={menu.id}
                className={`rounded-2xl bg-white border p-4 flex flex-col justify-between gap-3.5 transition hover:shadow-md ${
                  menu.isRecentlyEaten
                    ? 'border-stone-200/80 opacity-65 bg-stone-50/70'
                    : 'border-stone-200/90 hover:border-stone-300'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-11 h-11 rounded-xl bg-stone-100 flex items-center justify-center text-2xl shrink-0">
                        {menu.emoji}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-extrabold text-stone-400">
                            #{rank}
                          </span>
                          {menu.isFavoriteSpot && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800">
                              <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                              단골
                            </span>
                          )}
                          <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-600">
                            {menu.category}
                          </span>
                        </div>
                        <h4 className="font-bold text-stone-900 text-base leading-snug mt-0.5">
                          {menu.name}
                        </h4>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        menu.isRecentlyEaten
                          ? 'bg-stone-200 text-stone-600'
                          : 'bg-orange-50 text-[#C2410C]'
                      }`}
                    >
                      {menu.isRecentlyEaten
                        ? menu.lastEatenDaysAgo === 0
                          ? '오늘 식사'
                          : `${menu.lastEatenDaysAgo}일 전`
                        : `${menu.matchPercent}%`}
                    </span>
                  </div>

                  <p className="text-xs text-stone-500 leading-relaxed line-clamp-2">
                    {menu.description}
                  </p>

                  {menu.signatureMenus && menu.signatureMenus.length > 0 && (
                    <p className="text-[11px] font-semibold text-stone-700 truncate">
                      🍽️ {menu.signatureMenus.join(' · ')}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-1">
                    {menu.matchReasons.slice(0, 2).map((reason) => (
                      <span
                        key={reason}
                        className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-stone-100/90 text-stone-700"
                      >
                        {reason}
                      </span>
                    ))}
                  </div>

                  {menu.penaltyReasons.length > 0 && (
                    <p className="text-[11px] text-amber-700 bg-amber-50 px-2 py-1 rounded-lg">
                      참고: {menu.penaltyReasons[0]}
                    </p>
                  )}
                </div>

                <div className="space-y-2 pt-2 border-t border-stone-100">
                  <div className="flex items-center justify-between text-[11px] text-stone-400">
                    <span>약 {menu.avgPrice.toLocaleString()}원</span>
                    <span>{menu.kcalApprox} kcal</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onConfirmMenu(menu)}
                      className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        confirmed
                          ? 'bg-emerald-600 text-white'
                          : 'bg-stone-900 hover:bg-[#E85D2A] text-white'
                      }`}
                    >
                      {confirmed ? '오늘 확정 ✓' : '이거 먹기'}
                    </button>
                    <a
                      href={buildNaverMapUrl(
                        locationName,
                        menu.searchKeyword,
                        menu.isFavoriteSpot
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`${menu.name} 네이버 지도 검색`}
                      className="py-2 px-2.5 rounded-xl bg-[#03C75A]/10 hover:bg-[#03C75A]/20 text-[#029944] text-xs font-bold transition"
                    >
                      네이버
                    </a>
                    <a
                      href={buildKakaoMapUrl(
                        locationName,
                        menu.searchKeyword,
                        menu.isFavoriteSpot
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`${menu.name} 카카오맵 검색`}
                      className="py-2 px-2.5 rounded-xl bg-[#FEE500]/40 hover:bg-[#FEE500]/65 text-stone-900 text-xs font-bold transition"
                    >
                      카카오
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {others.length > 6 && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setShowAll((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white border border-stone-200 hover:border-stone-300 text-xs font-bold text-stone-700 shadow-2xs transition cursor-pointer"
            >
              {showAll ? (
                <>
                  접기 <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  전체 메뉴 {others.length - 6}개 더 보기{' '}
                  <ChevronDown className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
