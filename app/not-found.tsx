import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container section center">
      <p className="tag" style={{ display: "inline-block" }}>LỖI 404</p>
      <h1 className="h1" style={{ marginTop: 12 }}>KHÔNG TÌM THẤY TRANG</h1>
      <p className="muted pad">Trang bạn tìm không tồn tại hoặc đã được di chuyển.</p>
      <Link href="/" className="btn btn-black">VỀ TRANG CHỦ</Link>
    </div>
  );
}
