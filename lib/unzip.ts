import { unzipSync } from "fflate";

export function unzipFile(buffer: Buffer | Uint8Array) {
  // Returns an object: { [filename]: Uint8Array }
  return unzipSync(new Uint8Array(buffer));
}
