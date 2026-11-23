import React, { useState } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  Flame,
  Sparkles,
  Star,
  ThumbsUp,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  buildKakaoMapUrl,
  buildNaverMapUrl,
} from '../services/weatherAndLocation';
import {
  AggregatedPollCandidate,
  ItemRatingSummary,
  LunchContext,
  ScoredMenu,
} from '../types/lunch';
import { getConditionHeadline } from '../utils/recommender';

interface RecommendationSectionProps {
  scoredMenus: ScoredMenu[];
  context: LunchContext;
  locationName: string;
  todayConfirmedMenuId: string | null;
  pollMap: Map<string, AggregatedPollCandidate>;
  ratingMap: Map<string, ItemRatingSummary>;
  onConfirmMenu: (menu: ScoredMenu) => void;
  onToggleVote: (menu: ScoredMenu) => void;
  onOpenReview: (menu: ScoredMenu) => void;
}

export const RecommendationSection: React.FC<RecommendationSectionProps> = ({
  scoredMenus,
  context,
  locationName,
  todayConfirmedMenuId,
  pollMap,
  ratingMap,
  onConfirmMenu,
  onToggleVote,
  onOpenReview,
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

  const heroPoll = pollMap.get(hero.id);
  const heroRating = ratingMap.get(hero.id);

  return (
    <section className="space-y-3.5">
      {/* Compact Contextual Headline */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-0.5 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100/80 text-[#C2410C] text-[11px] font-bold shrink-0">
            <Sparkles className="w-3 h-3" />
            맞춤 분석
          </span>
          <h2 className="text-sm sm:text-base font-extrabold tracking-tight text-stone-900 truncate">
            {headline.title}
          </h2>
        </div>

        {(context.noPickActive ||
          context.ryeolPickActive ||
          context.seonPickActive) && (
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            {context.noPickActive && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                🚫 No픽 적용됨
              </span>
            )}
            {context.ryeolPickActive && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                🌿 렬픽 적용됨
              </span>
            )}
            {context.seonPickActive && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                🍜 선픽 적용됨
              </span>
            )}
          </div>
        )}
      </div>

      {/* Hero #1 Best Recommendation Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#FFF7F2] via-white to-[#FFFBF5] border border-[#E85D2A]/35 shadow-sm p-4 sm:p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div className="w-15 h-15 rounded-2xl bg-white border border-orange-100 shadow-xs flex items-center justify-center text-3xl sm:text-4xl shrink-0">
              {hero.emoji}
            </div>

            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E85D2A] text-white text-[11px] font-bold">
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
                {heroRating && (
                  <button
                    type="button"
                    onClick={() => onOpenReview(hero)}
                    title="팀원 별점·한줄평 보기"
                    className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-200 text-[11px] font-bold text-amber-800 transition cursor-pointer"
                  >
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    {heroRating.avgRating} ({heroRating.count})
                  </button>
                )}
                <span className="text-[11px] text-stone-400 hidden sm:inline">
                  약 {hero.avgPrice.toLocaleString()}원 · {hero.kcalApprox} kcal
                </span>
              </div>

              <p className="text-xs sm:text-[13px] text-stone-600 truncate">
                {hero.description}
              </p>

              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {hero.matchReasons.map((reason) => (
                  <span
                    key={reason}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-white border border-orange-200/80 text-[11px] font-semibold text-stone-700"
                  >
                    {reason}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Hero Action Column */}
          <div className="flex sm:flex-row md:flex-col gap-2 md:w-48 shrink-0">
            <div className="flex gap-1.5 flex-1 md:flex-none">
              <button
                type="button"
                onClick={() => onConfirmMenu(hero)}
                className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer shadow-2xs whitespace-nowrap ${
                  todayConfirmedMenuId === hero.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#E85D2A] hover:bg-[#D14D1E] text-white'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {todayConfirmedMenuId === hero.id ? '오늘 확정됨' : '오늘 먹기'}
              </button>
              <button
                type="button"
                onClick={() => onToggleVote(hero)}
                title="오늘 팀 투표 후보에 올리기 / 투표"
                className={`px-3 py-2.5 rounded-xl font-bold text-xs inline-flex items-center justify-center gap-1 border transition cursor-pointer shrink-0 ${
                  heroPoll?.myVoted
                    ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                    : 'bg-white hover:bg-amber-50 text-stone-700 border-stone-200 hover:border-amber-300'
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>{heroPoll?.voteCount ? heroPoll.voteCount : '투표'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <a
                href={buildNaverMapUrl(locationName, hero.searchKeyword)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-0.5 py-2 px-2 rounded-lg bg-[#03C75A]/10 hover:bg-[#03C75A]/20 text-[#029944] text-[11px] font-bold transition"
              >
                네이버
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
              <a
                href={buildKakaoMapUrl(locationName, hero.searchKeyword)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-0.5 py-2 px-2 rounded-lg bg-[#FEE500]/40 hover:bg-[#FEE500]/65 text-stone-900 text-[11px] font-bold transition"
              >
                카카오
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 5-Column Runner-up Menu Grid */}
      <div>
        <div className="flex items-center justify-between mb-2.5 px-0.5">
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

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {visibleOthers.map((menu, idx) => {
            const rank = idx + 2;
            const confirmed = todayConfirmedMenuId === menu.id;
            const poll = pollMap.get(menu.id);
            const rating = ratingMap.get(menu.id);
            return (
              <article
                key={menu.id}
                className={`rounded-2xl bg-white border p-3 flex flex-col justify-between gap-2.5 transition hover:shadow-sm ${
                  menu.isRecentlyEaten
                    ? 'border-stone-200/80 opacity-60 bg-stone-50/70'
                    : 'border-stone-200/90 hover:border-stone-300'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="text-xl leading-none shrink-0">
                        {menu.emoji}
                      </span>
                      <span className="text-[10px] font-extrabold text-stone-400">
                        #{rank}
                      </span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 truncate">
                        {menu.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onToggleVote(menu)}
                        title={
                          poll?.myVoted
                            ? '투표 취소하기'
                            : '오늘 팀 투표 후보로 올리기 / 투표'
                        }
                        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold border transition cursor-pointer ${
                          poll?.myVoted
                            ? 'bg-amber-500 text-white border-amber-500'
                            : poll?.voteCount
                              ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                              : 'bg-stone-50 text-stone-500 border-stone-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200'
                        }`}
                      >
                        <ThumbsUp className="w-2.5 h-2.5" />
                        {poll?.voteCount ? <span>{poll.voteCount}</span> : null}
                      </button>

                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
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
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <h4
                        title={menu.name}
                        className="font-extrabold text-stone-900 text-sm leading-snug truncate"
                      >
                        {menu.name}
                      </h4>
                      {rating && (
                        <button
                          type="button"
                          onClick={() => onOpenReview(menu)}
                          title={`팀 평균 별점 ${rating.avgRating} (${rating.count}명)`}
                          className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-600 hover:text-amber-800 shrink-0 cursor-pointer"
                        >
                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                          {rating.avgRating}
                        </button>
                      )}
                    </div>
                    <p
                      title={menu.description}
                      className="text-[11px] text-stone-500 truncate mt-0.5"
                    >
                      {menu.description}
                    </p>
                  </div>

                  <p
                    title={menu.matchReasons[0]}
                    className="text-[10px] font-medium px-2 py-1 rounded-lg bg-stone-100/90 text-stone-700 truncate"
                  >
                    {menu.matchReasons[0]}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-stone-100">
                  <div className="flex items-center justify-between text-[10px] text-stone-400">
                    <span>
                      ~
                      {(menu.avgPrice / 1000).toFixed(
                        menu.avgPrice % 1000 === 0 ? 0 : 1
                      )}
                      천원
                    </span>
                    <span>{menu.kcalApprox} kcal</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onConfirmMenu(menu)}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition cursor-pointer whitespace-nowrap ${
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
                      className="py-1.5 px-2 rounded-lg bg-[#03C75A]/10 hover:bg-[#03C75A]/20 text-[#029944] text-[10px] font-bold transition shrink-0"
                    >
                      네이버
                    </a>
                    <a
                      href={buildKakaoMapUrl(locationName, menu.searchKeyword)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`${locationName} ${menu.name} 카카오맵 검색`}
                      className="py-1.5 px-2 rounded-lg bg-[#FEE500]/45 hover:bg-[#FEE500]/70 text-stone-900 text-[10px] font-bold transition shrink-0"
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
