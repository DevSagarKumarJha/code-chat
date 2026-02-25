import util from "util";

export function print(...args: unknown[]): void {
  const output = util.format(...args);
  process.stdout.write(output + "\n");
}
