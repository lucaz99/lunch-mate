import React, { useEffect, useState } from 'react';
import { MessageSquareQuote, Star, Trash2, User, X } from 'lucide-react';
import { LunchReviewRecord, ReviewDraftTarget } from '../types/lunch';

interface ReviewModalProps {
  target: ReviewDraftTarget | null;
  itemReviews: LunchReviewRecord[];
  memberId: string;
  memberNickname: string;
  justConfirmed?: boolean;
  onSaveNickname: (nickname: string) => void;
  onSubmitReview: (payload: {
    rating: number;
    comment: string;
    authorName: string;
    existingId?: number;
  }) => Promise<void>;
  onDeleteReview: (id: number) => Promise<void>;
  onClose: () => void;
}

const RATING_LABELS: Record<number, string> = {
  1: '아쉬웠어요',
  2: '그냥 그랬어요',
  3: '무난하게 괜찮아요',
  4: '맛있었어요!',
  5: '또 가고 싶은 강추!',
};

export const ReviewModal: React.FC<ReviewModalProps> = ({
  target,
  itemReviews,
  memberId,
  memberNickname,
  justConfirmed,
  onSaveNickname,
  onSubmitReview,
  onDeleteReview,
  onClose,
}) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [nickname, setNickname] = useState(memberNickname);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!target) return;
    setRating(target.existingReview?.rating ?? 5);
    setComment(target.existingReview?.comment ?? '');
    setNickname(memberNickname || target.existingReview?.authorName || '');
  }, [target, memberNickname]);

  if (!target) return null;

  const activeRating = hoverRating ?? rating;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const cleanNick = nickname.trim() || '익명 팀원';
    onSaveNickname(cleanNick);
    setSaving(true);
    try {
      await onSubmitReview({
        rating,
        comment: comment.trim(),
        authorName: cleanNick,
        existingId: target.existingReview?.id,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const avgRating =
    itemReviews.length > 0
      ? (
          itemReviews.reduce((acc, r) => acc + r.rating, 0) / itemReviews.length
        ).toFixed(1)
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-stone-950/45 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-3xl bg-white border border-stone-200 shadow-2xl overflow-hidden animate-pop-in">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-100 bg-[#FFF9F5] flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-white border border-orange-100 shadow-2xs flex items-center justify-center text-2xl shrink-0">
              {target.itemEmoji}
            </div>
            <div className="min-w-0">
              {justConfirmed && (
                <span className="inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 mb-1">
                  오늘 점심으로 확정되었어요!
                </span>
              )}
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-extrabold text-stone-900 truncate">
                  {target.itemName}
                </h3>
                {avgRating && (
                  <span className="inline-flex items-center gap-0.5 text-xs font-bold text-amber-600 shrink-0">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {avgRating} ({itemReviews.length})
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-500">
                {justConfirmed
                  ? '식사 후 별점과 한줄평을 남겨 팀원들과 공유해 보세요.'
                  : `${target.eatenDate} 식사 · 별점과 한줄 리뷰 남기기`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:bg-stone-200/70 hover:text-stone-700 cursor-pointer"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Review Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Star selector */}
          <div className="text-center space-y-1.5">
            <div className="flex items-center justify-center gap-1.5">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onMouseEnter={() => setHoverRating(num)}
                  onMouseLeave={() => setHoverRating(null)}
                  onClick={() => setRating(num)}
                  className="p-1 transition-transform hover:scale-110 cursor-pointer"
                  aria-label={`${num}점`}
                >
                  <Star
                    className={`w-8 h-8 transition ${
                      num <= activeRating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-stone-200'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs font-bold text-amber-700">
              {activeRating}점 · {RATING_LABELS[activeRating]}
            </p>
          </div>

          {/* One-line review */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-600 flex items-center justify-between">
              <span className="inline-flex items-center gap-1">
                <MessageSquareQuote className="w-3.5 h-3.5 text-[#E85D2A]" />
                한줄 리뷰 (선택)
              </span>
              <span className="text-[10px] text-stone-400">
                {comment.length}/140
              </span>
            </label>
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={140}
              placeholder="예: 국물이 진하고 회전율이 빨라서 점심에 딱 좋아요!"
              className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:border-[#E85D2A] text-xs sm:text-sm text-stone-900 focus:outline-none transition"
            />
          </div>

          {/* Nickname */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-stone-500 inline-flex items-center gap-1 shrink-0">
              <User className="w-3.5 h-3.5" /> 작성자
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={24}
              placeholder="닉네임 (예: 홍길동)"
              className="flex-1 px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:border-stone-400 text-xs text-stone-900 focus:outline-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-bold transition cursor-pointer"
            >
              {justConfirmed ? '나중에 점심 기록에서 쓰기' : '취소'}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-[#E85D2A] hover:bg-[#D14D1E] disabled:opacity-60 text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              {saving
                ? '저장 중...'
                : target.existingReview
                  ? '리뷰 수정하기'
                  : '팀에 별점·리뷰 등록'}
            </button>
          </div>
        </form>

        {/* Existing Team Reviews for this item */}
        {itemReviews.length > 0 && (
          <div className="px-5 py-3.5 bg-stone-50/90 border-t border-stone-100 max-h-44 overflow-y-auto space-y-2">
            <p className="text-[11px] font-bold text-stone-500">
              팀원들이 남긴 한줄평 ({itemReviews.length})
            </p>
            {itemReviews.map((rev) => (
              <div
                key={rev.id}
                className="rounded-xl bg-white border border-stone-200/80 px-3 py-2 flex items-start justify-between gap-2"
              >
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center text-[11px] font-bold text-amber-600">
                      {'★'.repeat(rev.rating)}
                      <span className="text-stone-200">
                        {'★'.repeat(5 - rev.rating)}
                      </span>
                    </span>
                    <span className="text-[11px] font-bold text-stone-800">
                      {rev.authorName}
                    </span>
                    <span className="text-[10px] text-stone-400">
                      {rev.eatenDate}
                    </span>
                  </div>
                  {rev.comment && (
                    <p className="text-xs text-stone-600 break-words">
                      {rev.comment}
                    </p>
                  )}
                </div>
                {rev.authorId === memberId && (
                  <button
                    type="button"
                    onClick={() => void onDeleteReview(rev.id)}
                    title="내 리뷰 삭제"
                    className="p-1 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
