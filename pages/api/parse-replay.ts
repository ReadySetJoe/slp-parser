import { IncomingForm } from "formidable";
import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import { parseSlippiReplay } from "@/lib/slippiParser";
import { unzipFile } from "@/lib/unzip";
import path from "path";

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

    return new Promise<void>((resolve) => {
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

          // Accept .zip file
          if (
            !file.originalFilename ||
            !file.originalFilename.endsWith(".zip")
          ) {
            res.status(400).json({ message: "Only .zip files are accepted" });
            return resolve();
          }

          // Read zip file buffer
          const zipBuffer = fs.readFileSync(file.filepath);
          const unzipped = unzipFile(zipBuffer);

          // For each .slp file in the zip, write to temp, parse, then delete
          const results = [];
          for (const [filename, data] of Object.entries(unzipped)) {
            if (!filename.endsWith(".slp")) continue;
            let tempPath;
            if (process.env.APP_ENV === "development") {
              tempPath = path.join(process.cwd(), "tmp_" + filename);
            } else {
              tempPath = path.join("/tmp", "tmp_" + filename);
            }
            fs.writeFileSync(tempPath, data);
            try {
              const parsed = await parseSlippiReplay(tempPath);
              results.push({ filename, parsed });
            } catch (err) {
              console.error(`Error parsing ${filename}:`, err);
              results.push({ filename, error: "Failed to parse" });
            }
            try {
              fs.unlinkSync(tempPath);
            } catch {}
          }

          // Clean up zip temp file
          try {
            fs.unlinkSync(file.filepath);
          } catch {}

          res.status(200).json({ results });
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
