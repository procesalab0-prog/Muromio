import { Landing } from "@/components/landing";

export default function Home() {
  const version = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local";
  return <Landing version={version} />;
}
