import type { Metadata } from "next";
import { Jost, Lora, Space_Grotesk } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Muromío — Estudio de interiorismo en León, Guanajuato",
  description:
    "Muromío es un estudio de interiorismo en León, Guanajuato. Diseñamos espacios residenciales, comerciales y de hospitalidad, y exploramos renders con IA en nuestro Render Lab.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${jost.variable} ${lora.variable} ${spaceGrotesk.variable}`}
    >
      <body>
        {children}
        <DeploymentVersion />
      </body>
    </html>
  );
}
