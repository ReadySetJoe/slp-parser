import { IncomingForm } from "formidable";
import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import { parseSlippiReplay } from "@/lib/slippiParser";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const form = new IncomingForm({
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
    });

    return new Promise<void>(resolve => {
      form.parse(req, async (err, fields, files) => {
        if (err) {
          console.error("Form parsing error:", err);
          res.status(500).json({ message: "Error parsing form data" });
          return resolve();
        }

        try {
          if (!files.replayFile || files.replayFile.length === 0) {
            res.status(400).json({ message: "No replay file uploaded" });
            return resolve();
          }
          const file = files.replayFile[0];

          if (
            !file.originalFilename ||
            !file.originalFilename.endsWith(".slp")
          ) {
            res.status(400).json({ message: "Only .slp files are accepted" });
            return resolve();
          }

          const tempPath = file.filepath;
          const replayData = await parseSlippiReplay(tempPath);

          // Clean up temp file
          try {
            fs.unlinkSync(tempPath);
          } catch (unlinkErr) {
            console.error("Error removing temp file:", unlinkErr);
          }

          res.status(200).json(replayData);
          return resolve();
        } catch (parseErr) {
          console.error("Error parsing replay:", parseErr);
          res.status(500).json({ message: "Error parsing replay file" });
          return resolve();
        }
      });
    });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ message: "Server error" });
  }
}
