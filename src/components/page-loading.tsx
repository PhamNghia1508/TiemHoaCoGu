import { FlowerMark } from '@/components/site';
export default function Loading() {
  return (
    <div className="error-page">
      <div className="loading-flower">
        <FlowerMark />
      </div>
      <p className="eyebrow">ĐANG MỞ MỘT GÓC NHỎ…</p>
    </div>
  );
}
