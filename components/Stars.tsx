// Mỗi sao được tô riêng theo phần lẻ của điểm: 4.7 → 4 sao đầy + sao thứ 5 tô 70%.
export default function Stars({ value, size = 16 }: { value: number; size?: number }) {
  const v = Math.max(0, Math.min(5, value));
  return (
    <span className="stars" style={{ fontSize: size }} role="img" aria-label={`${v.toFixed(1)} trên 5 sao`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.round(Math.max(0, Math.min(1, v - i)) * 100);
        return <i key={i} className="star" style={{ "--fill": `${fill}%` } as React.CSSProperties} />;
      })}
    </span>
  );
}
