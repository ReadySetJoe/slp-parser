import { useState } from "react";
import Head from "next/head";
import FileUpload from "@/components/FileUpload";
import ReplayDetails, { ReplayData } from "@/components/ReplayDetails";
import ReplayDataSummary from "@/components/ReplayDataSummary";

export default function Home() {
  const [replayDataList, setReplayDataList] = useState<ReplayData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileUpload = async (files: File[]) => {
    setLoading(true);
    setError("");

    const newReplayDataList: ReplayData[] = [];

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("replayFile", file);

        const response = await fetch("/api/parse-replay", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to parse replay file: ${file.name}`);
        }

        const data = await response.json();
        console.log("data", data);
        newReplayDataList.push(data);
      }

      setReplayDataList(prev => [...prev, ...newReplayDataList]);
    } catch (err) {
      console.error("Error parsing replay files:", err);
      setError(
        "Error parsing replay files. Please make sure they are valid .slp files."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <Head>
        <title>Slippi Replay Analyzer</title>
        <meta
          name="description"
          content="Upload and analyze your Slippi replay files"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex flex-col items-center justify-center w-full flex-1 px-4 sm:px-20 text-center">
        <h1 className="text-4xl font-bold text-blue-600 mb-8">
          Slippi Replay Analyzer
        </h1>

        <div className="w-full max-w-3xl bg-white rounded-lg shadow-md p-6">
          {replayDataList.length === 0 && (
            <FileUpload
              onFileUpload={handleFileUpload}
              loading={loading}
              error={error}
            />
          )}

          {replayDataList.length > 0 && (
            <>
              <ReplayDataSummary replayDataList={replayDataList} />
              {replayDataList.map((data, index) => (
                <ReplayDetails key={index} data={data} />
              ))}
              <button
                onClick={() => {
                  setReplayDataList([]);
                }}
                className="mb-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded"
              >
                Start Over
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
