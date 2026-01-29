import util from "util";

export function print(...args) {
  const output = util.format(...args);
  process.stdout.write(output + "\n");
}
