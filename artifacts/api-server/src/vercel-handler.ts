import app from "./app";
import { runSeed } from "./seed";

let initialized = false;

export default async function handler(req: any, res: any) {
  if (!initialized) {
    initialized = true;
    await runSeed().catch(console.error);
  }
  return app(req, res);
}
