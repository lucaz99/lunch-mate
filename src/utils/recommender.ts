import {
  LunchContext,
  LunchHistoryEntry,
  MenuItem,
  ScoredMenu,
} from '../types/lunch';

export function getTodayDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isYesterdayWeekend(date: Date = new Date()): boolean {
  // Sunday (0) -> yesterday was Saturday; Monday (1) -> yesterday was Sunday
  const day = date.getDay();
  return day === 1 || day === 0;
}

export function daysBetweenDates(dateStrA: string, dateStrB: string): number {
  const a = new Date(`${dateStrA}T00:00:00`);
  const b = new Date(`${dateStrB}T00:00:00`);
  const diffMs = Math.abs(b.getTime() - a.getTime());
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function deterministicJitter(id: string, seed: number): number {
  let hash = seed * 2654435761;
  for (let i = 0; i < id.length; i++) {
    hash = (hash ^ id.charCodeAt(i)) * 16777619;
  }
  return ((Math.abs(hash) % 100) / 100) * 6; // 0..6 pts subtle variety
}

export function scoreMenus(
  menus: MenuItem[],
  context: LunchContext,
  history: LunchHistoryEntry[],
  shuffleSeed: number = 0
): ScoredMenu[] {
  const todayStr = getTodayDateString();
  const daySeed = Number(todayStr.replace(/-/g, '')) + shuffleSeed * 97;

  // Map recent menu visits and recent categories
  const recentMenuDays = new Map<string, number>();
  const recentCategoryCount = new Map<string, number>();

  for (const entry of history) {
    const diff = daysBetweenDates(entry.date, todayStr);
    const existing = recentMenuDays.get(entry.menuId);
    if (existing === undefined || diff < existing) {
      recentMenuDays.set(entry.menuId, diff);
    }
    if (diff <= 2) {
      recentCategoryCount.set(
        entry.category,
        (recentCategoryCount.get(entry.category) ?? 0) + 1
      );
    }
  }

  const filtered = menus.filter((menu) => {
    if (context.noPickActive) {
      if (
        menu.id === 'malatang' ||
        menu.id === 'spot-hyundaiok' ||
        menu.tags.includes('spicy')
      ) {
        return false;
      }
    }
    if (context.ryeolPickActive) {
      if (menu.tags.includes('aromatic')) {
        return false;
      }
    }
    if (
      context.selectedCategories.length > 0 &&
      !context.selectedCategories.includes(menu.category)
    ) {
      return false;
    }
    return true;
  });

  const scored: ScoredMenu[] = filtered.map((menu) => {
    let score = 55;
    const matchReasons: string[] = [];
    const penaltyReasons: string[] = [];

    const has = (tag: MenuItem['tags'][number]) => menu.tags.includes(tag);

    // 1. 전일 회식/음주 여부 (Strongest physiological driver!)
    if (context.hadCompanyDinner) {
      if (has('hangover')) {
        score += 28;
        matchReasons.push('🍺 회식 다음날 해장 강력 추천');
      } else if (has('soup') && has('light')) {
        score += 18;
        matchReasons.push('🥣 속을 부드럽게 달래주는 국물');
      } else if (has('light')) {
        score += 10;
        matchReasons.push('🌿 회식 후 부담 없는 가벼운 식사');
      }

      if (has('greasy')) {
        score -= 22;
        penaltyReasons.push('회식 다음날엔 다소 기름질 수 있어요');
      }
    }

    // 2. 전일이 주말/휴일인지 (월요병 극복 & 주말 과식 리셋)
    if (context.wasWeekendYesterday) {
      if (has('mondayBoost')) {
        score += 14;
        matchReasons.push('📅 주말 직후 활력 충전 메뉴');
      } else if (has('light')) {
        score += 11;
        matchReasons.push('🥗 주말 식사 후 가볍게 컨디션 리셋');
      }
      if (has('greasy') && !has('mondayBoost')) {
        score -= 6;
      }
    }

    // 3. 날씨 (기온/체감온도)
    if (context.weatherFeel === 'cold') {
      if (has('soup') && has('hot')) {
        score += 20;
        matchReasons.push('🥶 추운 날 몸 녹이는 뜨끈한 국물');
      } else if (has('hot')) {
        score += 12;
        matchReasons.push('🔥 쌀쌀한 날씨에 어울리는 따뜻한 메뉴');
      }
      if (has('cool')) {
        score -= 18;
        penaltyReasons.push('오늘 날씨엔 조금 차가울 수 있어요');
      }
    } else if (context.weatherFeel === 'chilly') {
      if (has('hot') || has('soup')) {
        score += 11;
        matchReasons.push('🧣 선선·쌀쌀할 때 좋은 따뜻한 한 끼');
      }
      if (has('cool')) {
        score -= 8;
      }
    } else if (context.weatherFeel === 'hot') {
      if (has('cool')) {
        score += 22;
        matchReasons.push('☀️ 더운 날 입맛 살리는 시원한 메뉴');
      } else if (has('light')) {
        score += 9;
        matchReasons.push('🧊 더위에 부담 없는 산뜻한 식사');
      }
      if (has('soup') && has('hot') && !context.hadCompanyDinner) {
        score -= 14;
        penaltyReasons.push('더운 날엔 뜨거운 국물이 부담될 수 있어요');
      }
    } else if (context.weatherFeel === 'warm') {
      if (has('cool')) {
        score += 11;
        matchReasons.push('🌤️ 포근한 날 상큼·시원하게 즐기기');
      }
    } else {
      // mild
      if (has('mondayBoost') || has('light')) {
        score += 4;
      }
    }

    // 4. 강수 (비/눈)
    if (context.weatherCondition === 'rain') {
      if (has('rainy')) {
        score += 17;
        matchReasons.push('🌧️ 비 오는 날 생각나는 찰떡 메뉴');
      } else if (has('soup')) {
        score += 9;
        matchReasons.push('☔ 빗소리와 어울리는 따뜻한 국물');
      }
    } else if (context.weatherCondition === 'snow') {
      if (has('soup') && has('hot')) {
        score += 16;
        matchReasons.push('❄️ 눈 오는 날 따끈하게 몸 녹이기');
      }
    }

    // 5. 예산/가격대
    if (context.budget !== 'all') {
      if (menu.priceRange === context.budget) {
        score += 12;
        if (context.budget === 'under10k') {
          matchReasons.push('💸 1만원 이하 가성비 굿');
        } else if (context.budget === '10kTo15k') {
          matchReasons.push('💳 적당한 점심 예산(1~1.5만원)');
        } else {
          matchReasons.push('✨ 여유 있는 점심·기분전환');
        }
      } else if (
        context.budget === 'under10k' &&
        menu.priceRange === 'over15k'
      ) {
        score -= 24;
        penaltyReasons.push('설정한 예산보다 가격대가 높아요');
      } else {
        score -= 10;
      }
    }

    // 6. 동행자 (혼밥 vs 동료 vs 팀)
    if (context.companion === 'solo') {
      if (menu.soloFriendly) {
        score += 8;
        if (!menu.groupFriendly) {
          matchReasons.push('👤 혼밥 만족도 최상');
        }
      } else {
        score -= 26;
        penaltyReasons.push('혼자 먹기엔 조금 부담스러운 메뉴예요');
      }
    } else if (context.companion === 'team') {
      if (menu.groupFriendly && menu.relaxedMood) {
        score += 10;
        matchReasons.push('👥 팀 점심·함께 먹기 좋은 구성');
      } else if (!menu.groupFriendly) {
        score -= 18;
        penaltyReasons.push('다같이 모여 먹기엔 호불호가 있어요');
      }
    } else {
      if (menu.groupFriendly) {
        score += 5;
      }
    }

    // 7. 식사 속도
    if (context.pace === 'fast') {
      if (menu.fastServe) {
        score += 11;
        matchReasons.push('⚡ 빠르게 나와서 시간 절약');
      } else {
        score -= 18;
        penaltyReasons.push('조리·식사 시간이 조금 걸릴 수 있어요');
      }
    } else if (context.pace === 'relaxed') {
      if (menu.relaxedMood) {
        score += 10;
        matchReasons.push('☕ 여유롭게 즐기기 좋은 분위기');
      }
    }

    // 8. 최근 먹은 메뉴 중복 방지
    const lastDays = recentMenuDays.get(menu.id) ?? null;
    const isRecentlyEaten =
      lastDays !== null &&
      context.excludeRecentDays > 0 &&
      lastDays <= context.excludeRecentDays;

    if (isRecentlyEaten) {
      score -= 48;
      penaltyReasons.push(
        lastDays === 0
          ? '오늘 이미 기록된 메뉴예요'
          : `${lastDays}일 전에 먹어서 우선순위를 낮췄어요`
      );
    } else {
      const catRepeats = recentCategoryCount.get(menu.category) ?? 0;
      if (catRepeats === 0 && history.length > 0) {
        score += 5;
        matchReasons.push(`🔄 최근 안 먹은 ${menu.category} 리프레시`);
      } else if (catRepeats >= 2) {
        score -= 7;
      }
    }

    // Gentle variety jitter
    score += deterministicJitter(menu.id, daySeed);

    if (matchReasons.length === 0) {
      matchReasons.push('👍 오늘 무난하게 실패 없는 점심');
    }

    const clampedScore = Math.max(15, Math.min(130, Math.round(score)));
    const matchPercent = Math.max(42, Math.min(99, Math.round((clampedScore / 112) * 100)));

    return {
      ...menu,
      score: clampedScore,
      matchPercent,
      matchReasons: matchReasons.slice(0, 3),
      penaltyReasons,
      isRecentlyEaten,
      lastEatenDaysAgo: lastDays,
    };
  });

  return scored.sort((a, b) => {
    if (a.isRecentlyEaten !== b.isRecentlyEaten) {
      return a.isRecentlyEaten ? 1 : -1;
    }
    return b.score - a.score;
  });
}

export function getConditionHeadline(context: LunchContext): {
  title: string;
  subtitle: string;
} {
  if (context.hadCompanyDinner && context.weatherCondition === 'rain') {
    return {
      title: '비 오는 날 + 회식 다음날, 얼큰·시원한 해장이 답이에요',
      subtitle: '속을 편안하게 풀어주면서도 빗소리에 어울리는 국물 메뉴를 우선 추천했어요.',
    };
  }
  if (context.hadCompanyDinner) {
    return {
      title: '어제 회식하셨군요! 속 편한 해장 메뉴 위주로 골랐어요',
      subtitle: '기름진 음식은 잠시 쉬고, 맑고 따뜻한 국물과 부담 적은 메뉴의 점수를 높였어요.',
    };
  }
  if (context.wasWeekendYesterday && context.weatherFeel === 'cold') {
    return {
      title: '추운 월요일, 몸 녹이고 활력 채우는 든든한 점심 어때요?',
      subtitle: '주말 직후 컨디션 회복과 추운 날씨에 딱 맞는 따뜻한 메뉴를 선별했어요.',
    };
  }
  if (context.weatherCondition === 'rain') {
    return {
      title: '비 오는 날엔 역시 뜨끈한 국물과 면 요리가 찰떡이죠',
      subtitle: '강수 예보를 반영해 칼국수·쌀국수·짬뽕 등 비 오는 날 만족도 높은 메뉴를 올렸어요.',
    };
  }
  if (context.weatherCondition === 'snow') {
    return {
      title: '눈 오는 날, 속까지 따뜻해지는 한 그릇 추천드려요',
      subtitle: '추위를 녹여줄 뚝배기·찌개·국물 요리 위주로 추천 리스트를 구성했어요.',
    };
  }
  if (context.weatherFeel === 'hot') {
    return {
      title: '더운 날씨엔 시원하고 산뜻한 점심으로 입맛 살려보세요',
      subtitle: '체감온도가 높아 냉면·소바·포케 등 시원하고 가벼운 메뉴에 가중치를 두었어요.',
    };
  }
  if (context.weatherFeel === 'cold') {
    return {
      title: '날씨가 꽤 춥네요! 뜨끈한 국물 요리로 몸을 녹여보세요',
      subtitle: '차가운 메뉴는 뒤로 빼고 따뜻하고 든든한 메뉴를 상단에 배치했어요.',
    };
  }
  if (context.wasWeekendYesterday) {
    return {
      title: '주말 다음날! 활력을 주거나 가볍게 리셋하는 점심 추천',
      subtitle: '월요병 극복용 든든한 한 끼와 주말 과식 후 속 편한 메뉴를 균형 있게 골랐어요.',
    };
  }
  return {
    title: '오늘 컨디션과 날씨에 딱 맞는 점심 리스트예요',
    subtitle: '현재 위치·날씨·최근 식사 기록을 종합해 지금 가장 만족도 높을 메뉴를 추천해요.',
  };
}
