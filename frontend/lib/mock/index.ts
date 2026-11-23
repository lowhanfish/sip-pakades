import { handleMockRequest } from "./handlers";

export function isMockMode(): boolean {
  return (process.env.NEXT_PUBLIC_API_MODE ?? "mock") === "mock";
}

export { handleMockRequest };
