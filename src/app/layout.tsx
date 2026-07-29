import type { Metadata, Viewport } from "next";
import { Cormorant, Jost, Lora, Space_Grotesk } from "next/font/google";
import { DeploymentVersion } from "@/components/deployment-version";
import "./globals.css";

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const cormorant = Cormorant({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Muromío — Estudio de interiorismo en León, Guanajuato",
  description:
    "Muromío es un estudio de interiorismo en León, Guanajuato. Diseñamos espacios residenciales, comerciales y de hospitalidad, y exploramos renders con IA en nuestro Render Lab.",
  applicationName: "Muromío",
  appleWebApp: {
    capable: true,
    title: "Muromío",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#262220",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${jost.variable} ${lora.variable} ${spaceGrotesk.variable} ${cormorant.variable}`}
    >
      <body>
        {children}
        <DeploymentVersion />
      </body>
    </html>
  );
}
