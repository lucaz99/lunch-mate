import { createClient } from '@supabase/supabase-js';
import { MenuCategory, MenuItem, MenuTag } from '../types/lunch';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://krjzbasfmvvasdartkbk.supabase.co';
const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_obW03GOygHBpiMIotilDCw_7R776YT8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

interface SharedSpotRow {
  id: string;
  name: string;
  category: MenuCategory;
  emoji: string;
  signature_menus: string[] | null;
  description: string | null;
  search_keyword: string;
  address: string | null;
  lat: number | null;
  lon: number | null;
  avg_price: number;
  price_range: 'under10k' | '10kTo15k' | 'over15k';
  tags: string[] | null;
  created_at: string;
}

function rowToMenuItem(row: SharedSpotRow): MenuItem {
  const sig = row.signature_menus?.filter(Boolean) ?? [];
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji || '🍽️',
    category: row.category,
    priceRange: row.price_range || '10kTo15k',
    avgPrice: row.avg_price || 11000,
    description:
      row.description ||
      (sig.length > 0
        ? `${sig.join(' · ')} 등을 즐길 수 있는 팀 공유 식당`
        : '팀원이 등록한 공유 단골 음식점'),
    searchKeyword: row.search_keyword,
    tags: (row.tags?.length ? row.tags : ['hot', 'hearty', 'mondayBoost']) as MenuTag[],
    soloFriendly: true,
    groupFriendly: true,
    fastServe: true,
    relaxedMood: true,
    kcalApprox: 650,
    isFavoriteSpot: true,
    signatureMenus: sig.length > 0 ? sig : undefined,
    lat: row.lat ?? undefined,
    lon: row.lon ?? undefined,
    address: row.address ?? undefined,
  };
}

export async function fetchSharedFavoriteSpots(): Promise<MenuItem[]> {
  const { data, error } = await supabase
    .from('shared_favorite_spots')
    .select(
      'id, name, category, emoji, signature_menus, description, search_keyword, address, lat, lon, avg_price, price_range, tags, created_at'
    )
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as SharedSpotRow[]).map(rowToMenuItem);
}

export async function addSharedFavoriteSpot(spot: MenuItem): Promise<MenuItem> {
  const payload = {
    id: spot.id,
    name: spot.name.trim(),
    category: spot.category,
    emoji: spot.emoji,
    signature_menus: spot.signatureMenus ?? [],
    description: spot.description,
    search_keyword: spot.searchKeyword,
    address: spot.address ?? null,
    lat: spot.lat ?? null,
    lon: spot.lon ?? null,
    avg_price: spot.avgPrice,
    price_range: spot.priceRange,
    tags: spot.tags,
  };

  const { data, error } = await supabase
    .from('shared_favorite_spots')
    .insert(payload)
    .select(
      'id, name, category, emoji, signature_menus, description, search_keyword, address, lat, lon, avg_price, price_range, tags, created_at'
    )
    .single();

  if (error) {
    throw error;
  }

  return rowToMenuItem(data as SharedSpotRow);
}

export async function deleteSharedFavoriteSpot(id: string): Promise<void> {
  const { error } = await supabase
    .from('shared_favorite_spots')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }
}

export function subscribeSharedFavoriteSpots(onChange: () => void): () => void {
  const channel = supabase
    .channel('shared-favorite-spots-realtime')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'shared_favorite_spots',
      },
      () => {
        onChange();
      }
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
