import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { CatalogProvider } from "@/lib/catalog";
import { CartProvider } from "@/lib/cart";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import { ToastHost } from "@/lib/toast";

export const metadata: Metadata = {
  title: "KINETIC - Trang phục thể thao hiệu năng cao",
  description: "Cửa hàng thể thao & streetwear kỹ thuật Kinetic. Áo, quần, giày và phụ kiện cho mọi mùa.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600&family=Montserrat:wght@700;800&display=swap" />
      </head>
      <body>
        <AuthProvider><CartProvider>
          <CatalogProvider>
            <Header />
            <main>{children}</main>
            <Footer />
            <CartDrawer />
            <ToastHost />
          </CatalogProvider>
        </CartProvider></AuthProvider>
      </body>
    </html>
  );
}
