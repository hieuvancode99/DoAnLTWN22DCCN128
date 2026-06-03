import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ứng Dụng Quản Lý Chi Tiêu Cá Nhân & Gia Đình | AI Smart Finance",
  description: "Giải pháp tối ưu quản lý tài chính cá nhân và hộ gia đình. Tích hợp AI thông minh để phân tích chi tiêu và tư vấn tiết kiệm.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full bg-slate-950 text-slate-100">
      <body className={`${inter.className} h-full antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
