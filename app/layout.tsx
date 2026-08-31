import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/manrope";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://portal.univelt.com.br"),
  title: {
    default: "Portal Univelt Machine Safety",
    template: "%s | Portal Univelt",
  },
  description:
    "Gestão corporativa de máquinas, riscos e documentação de segurança NR-12.",
  applicationName: "Portal Univelt Machine Safety",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
