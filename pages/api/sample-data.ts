import { promises as fs } from "fs";
import path from "path";

import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse
) {
  const dir = path.join(process.cwd(), "public", "assets", "slp-demo-data");
  console.log("Listing files in directory:", dir);
  try {
    const files = await fs.readdir(dir);
    const slpFiles = files.filter((f) => f.endsWith(".slp"));
    console.log("Found SLP files:", slpFiles);
    res.status(200).json({ files: slpFiles });
  } catch (e) {
    console.error("Error listing sample files:", e);
    res.status(500).json({ error: "Failed to list sample files" });
  }
}
