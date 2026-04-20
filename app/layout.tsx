import type { Metadata } from "next";
import "./globals.css";
import SiteChrome from "@/components/SiteChrome";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "MindCanvas Certification Platform",
  description:
    "AI+X 교육 수료 → App Canvas 등록 → 살아있는 인증서. MindCanvas가 만드는 새로운 실력 증명 인프라.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const userProp = user ? { name: user.name, role: user.role } : null;
  return (
    <html lang="ko">
      <body>
        <SiteChrome user={userProp}>{children}</SiteChrome>
      </body>
    </html>
  );
}
