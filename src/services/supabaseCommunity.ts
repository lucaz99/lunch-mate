import {
  AggregatedPollCandidate,
  CommunityItemType,
  DailyVoteRecord,
  ItemRatingSummary,
  LunchReviewRecord,
  MenuCategory,
} from '../types/lunch';
import { supabase } from './supabaseSpots';

interface DailyVoteRow {
  id: number;
  vote_date: string;
  item_id: string;
  item_name: string;
  item_emoji: string;
  item_category: MenuCategory;
  item_type: CommunityItemType;
  voter_id: string;
  voter_name: string;
  created_at: string;
}

interface LunchReviewRow {
  id: number;
  item_id: string;
  item_name: string;
  item_emoji: string;
  item_category: MenuCategory;
  item_type: CommunityItemType;
  rating: number;
  comment: string;
  author_id: string;
  author_name: string;
  eaten_date: string;
  created_at: string;
}

function toVoteRecord(row: DailyVoteRow): DailyVoteRecord {
  return {
    id: row.id,
    voteDate: row.vote_date,
    itemId: row.item_id,
    itemName: row.item_name,
    itemEmoji: row.item_emoji || '🍽️',
    itemCategory: row.item_category,
    itemType: row.item_type,
    voterId: row.voter_id,
    voterName: row.voter_name,
    createdAt: row.created_at,
  };
}

function toReviewRecord(row: LunchReviewRow): LunchReviewRecord {
  return {
    id: row.id,
    itemId: row.item_id,
    itemName: row.item_name,
    itemEmoji: row.item_emoji || '🍽️',
    itemCategory: row.item_category,
    itemType: row.item_type,
    rating: Number(row.rating),
    comment: row.comment ?? '',
    authorId: row.author_id,
    authorName: row.author_name,
    eatenDate: row.eaten_date,
    createdAt: row.created_at,
  };
}

export async function fetchDailyVotes(voteDate: string): Promise<DailyVoteRecord[]> {
  const { data, error } = await supabase
    .from('daily_lunch_votes')
    .select(
      'id, vote_date, item_id, item_name, item_emoji, item_category, item_type, voter_id, voter_name, created_at'
    )
    .eq('vote_date', voteDate)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return ((data ?? []) as DailyVoteRow[]).map(toVoteRecord);
}

export async function castDailyVote(input: {
  voteDate: string;
  itemId: string;
  itemName: string;
  itemEmoji: string;
  itemCategory: MenuCategory;
  itemType: CommunityItemType;
  voterId: string;
  voterName: string;
}): Promise<DailyVoteRecord> {
  const { data, error } = await supabase
    .from('daily_lunch_votes')
    .insert({
      vote_date: input.voteDate,
      item_id: input.itemId,
      item_name: input.itemName.trim(),
      item_emoji: input.itemEmoji,
      item_category: input.itemCategory,
      item_type: input.itemType,
      voter_id: input.voterId,
      voter_name: input.voterName.trim(),
    })
    .select(
      'id, vote_date, item_id, item_name, item_emoji, item_category, item_type, voter_id, voter_name, created_at'
    )
    .single();

  if (error) throw error;
  return toVoteRecord(data as DailyVoteRow);
}

export async function removeDailyVote(
  voteDate: string,
  itemId: string,
  voterId: string
): Promise<void> {
  const { error } = await supabase
    .from('daily_lunch_votes')
    .delete()
    .eq('vote_date', voteDate)
    .eq('item_id', itemId)
    .eq('voter_id', voterId);

  if (error) throw error;
}

export async function clearDailyVotes(voteDate: string): Promise<void> {
  const { error } = await supabase
    .from('daily_lunch_votes')
    .delete()
    .eq('vote_date', voteDate);

  if (error) throw error;
}

export function aggregateDailyVotes(
  votes: DailyVoteRecord[],
  myVoterId: string
): AggregatedPollCandidate[] {
  const map = new Map<string, AggregatedPollCandidate>();

  for (const v of votes) {
    let existing = map.get(v.itemId);
    if (!existing) {
      existing = {
        itemId: v.itemId,
        itemName: v.itemName,
        itemEmoji: v.itemEmoji,
        itemCategory: v.itemCategory,
        itemType: v.itemType,
        voteCount: 0,
        voters: [],
        myVoted: false,
      };
      map.set(v.itemId, existing);
    }
    existing.voteCount += 1;
    existing.voters.push({ voterId: v.voterId, voterName: v.voterName });
    if (v.voterId === myVoterId) {
      existing.myVoted = true;
    }
  }

  return Array.from(map.values()).sort((a, b) => b.voteCount - a.voteCount);
}

export async function fetchLunchReviews(): Promise<LunchReviewRecord[]> {
  const { data, error } = await supabase
    .from('lunch_reviews')
    .select(
      'id, item_id, item_name, item_emoji, item_category, item_type, rating, comment, author_id, author_name, eaten_date, created_at'
    )
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) throw error;
  return ((data ?? []) as LunchReviewRow[]).map(toReviewRecord);
}

export async function createLunchReview(input: {
  itemId: string;
  itemName: string;
  itemEmoji: string;
  itemCategory: MenuCategory;
  itemType: CommunityItemType;
  rating: number;
  comment: string;
  authorId: string;
  authorName: string;
  eatenDate: string;
}): Promise<LunchReviewRecord> {
  const { data, error } = await supabase
    .from('lunch_reviews')
    .insert({
      item_id: input.itemId,
      item_name: input.itemName.trim(),
      item_emoji: input.itemEmoji,
      item_category: input.itemCategory,
      item_type: input.itemType,
      rating: input.rating,
      comment: input.comment.trim(),
      author_id: input.authorId,
      author_name: input.authorName.trim(),
      eaten_date: input.eatenDate,
    })
    .select(
      'id, item_id, item_name, item_emoji, item_category, item_type, rating, comment, author_id, author_name, eaten_date, created_at'
    )
    .single();

  if (error) throw error;
  return toReviewRecord(data as LunchReviewRow);
}

export async function updateLunchReview(
  id: number,
  rating: number,
  comment: string,
  authorName: string
): Promise<LunchReviewRecord> {
  const { data, error } = await supabase
    .from('lunch_reviews')
    .update({
      rating,
      comment: comment.trim(),
      author_name: authorName.trim(),
    })
    .eq('id', id)
    .select(
      'id, item_id, item_name, item_emoji, item_category, item_type, rating, comment, author_id, author_name, eaten_date, created_at'
    )
    .single();

  if (error) throw error;
  return toReviewRecord(data as LunchReviewRow);
}

export async function deleteLunchReview(id: number): Promise<void> {
  const { error } = await supabase
    .from('lunch_reviews')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export function buildRatingSummaryMap(
  reviews: LunchReviewRecord[]
): Map<string, ItemRatingSummary> {
  const acc = new Map<
    string,
    { sum: number; count: number; latestComment?: string }
  >();

  for (const r of reviews) {
    const cur = acc.get(r.itemId);
    if (!cur) {
      acc.set(r.itemId, {
        sum: r.rating,
        count: 1,
        latestComment: r.comment || undefined,
      });
    } else {
      cur.sum += r.rating;
      cur.count += 1;
      if (!cur.latestComment && r.comment) {
        cur.latestComment = r.comment;
      }
    }
  }

  const out = new Map<string, ItemRatingSummary>();
  for (const [key, val] of acc.entries()) {
    out.set(key, {
      avgRating: Math.round((val.sum / val.count) * 10) / 10,
      count: val.count,
      latestComment: val.latestComment,
    });
  }
  return out;
}

export function subscribeCommunityUpdates(
  onVotesChange: () => void,
  onReviewsChange: () => void
): () => void {
  const channel = supabase
    .channel('lunch-community-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'daily_lunch_votes' },
      () => onVotesChange()
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'lunch_reviews' },
      () => onReviewsChange()
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
