// Execute the winning fill on Byreal Perps. If the CLI isn't installed, return the exact
// command so the demo still shows the real integration call.
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const pexec = promisify(execFile);

export async function byrealFill(order, fillPrice) {
  const args = ["order", "limit", order.side, String(order.size), order.coin, String(Math.round(fillPrice)), "--tif", "Ioc"];
  const cmd = `byreal-perps-cli ${args.join(" ")}`;
  try {
    const { stdout } = await pexec("byreal-perps-cli", args, { timeout: 20000 });
    return { executed: true, cmd, stdout };
  } catch {
    return { executed: false, cmd, note: "byreal-perps-cli not found; showing command for demo" };
  }
}
