/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ảnh sản phẩm là file tĩnh đã được tối ưu sẵn trong public/products (xem scripts/make-product-images.js),
  // nên tải thẳng, không qua bộ tối ưu theo yêu cầu (chậm ở lần mở đầu).
  // localPatterns: cho phép ảnh có query ?v=... (dùng để làm mới cache) trong /products.
  images: { unoptimized: true, localPatterns: [{ pathname: "/products/**" }] },
  // Tắt nút tròn "N" của Next.js hiện ở góc dưới khi chạy next dev.
  devIndicators: false,
  // Cho phép chạy thêm một server khác (cổng khác) mà không dùng chung thư mục build .next: NEXT_DIST_DIR=.next-3001 npm run dev -- -p 3001
  distDir: process.env.NEXT_DIST_DIR || ".next",
};
export default nextConfig;
