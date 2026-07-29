import { renderWordmarkIcon } from "@/lib/app-icon";

export async function GET() {
  return renderWordmarkIcon(512);
}
