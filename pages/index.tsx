import { useState } from "react";
import Head from "next/head";
import FileUpload from "@/components/FileUpload";
import ReplayDetails, { ReplayData } from "@/components/ReplayDetails";
import ReplayDataSummary from "@/components/ReplayDataSummary";
import CharacterBreakdown from "@/components/CharacterBreakdown";
import MatchupAnalysis from "@/components/MatchupAnalysis";

export default function Home() {
  const [replayDataList, setReplayDataList] = useState<ReplayData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("summary");

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

  // Count player occurrences
  const playerFrequency: Record<string, number> = {};
  replayDataList.forEach(replay => {
    const players = [replay.metadata.players[0], replay.metadata.players[1]];
    players.forEach(player => {
      playerFrequency[player.names.code] =
        (playerFrequency[player.names.code] || 0) + 1;
    });
  });

  const sortedPlayers = Object.entries(playerFrequency).sort(
    (a, b) => b[1] - a[1]
  );

  const handlePlayerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPlayer(e.target.value || null);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "summary":
        return <ReplayDataSummary replayDataList={replayDataList} />;
      case "characters":
        return (
          <CharacterBreakdown
            replayDataList={replayDataList}
            selectedPlayer={selectedPlayer}
          />
        );
      case "matchups":
        return (
          <MatchupAnalysis
            replayDataList={replayDataList}
            selectedPlayer={selectedPlayer}
          />
        );
      case "details":
        return (
          <div className="space-y-4">
            {replayDataList.map((data, index) => (
              <ReplayDetails key={index} data={data} />
            ))}
          </div>
        );
      default:
        return <ReplayDataSummary replayDataList={replayDataList} />;
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
      <main className="flex flex-col items-center w-full flex-1 px-4 sm:px-20">
        <h1 className="text-4xl font-bold text-blue-600 mb-8">
          Slippi Replay Analyzer
        </h1>

        {replayDataList.length === 0 ? (
          <div className="w-full max-w-3xl bg-white rounded-lg shadow-md p-6">
            <FileUpload
              onFileUpload={handleFileUpload}
              loading={loading}
              error={error}
            />
          </div>
        ) : (
          <div className="w-full max-w-6xl">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-800">
                    {replayDataList.length} Replays Analyzed
                  </h2>
                </div>

                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-2 sm:mt-0">
                  <select
                    onChange={handlePlayerSelect}
                    value={selectedPlayer || ""}
                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Players</option>
                    {sortedPlayers.map(([player, count]) => (
                      <option key={player} value={player}>
                        {player} ({count} games)
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => {
                      setReplayDataList([]);
                      setSelectedPlayer(null);
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-md"
                  >
                    Clear All Replays
                  </button>
                </div>
              </div>

              <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto">
                  <button
                    onClick={() => setActiveTab("summary")}
                    className={`py-3 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "summary"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Performance Summary
                  </button>
                  <button
                    onClick={() => setActiveTab("characters")}
                    className={`py-3 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "characters"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Character Breakdown
                  </button>
                  <button
                    onClick={() => setActiveTab("matchups")}
                    className={`py-3 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "matchups"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Matchup Analysis
                  </button>
                  <button
                    onClick={() => setActiveTab("details")}
                    className={`py-3 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "details"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Game Details
                  </button>
                </nav>
              </div>

              {renderTabContent()}
            </div>
          </div>
        )}
      </main>

      <footer className="w-full text-center py-4 text-gray-500 text-sm">
        <p>Slippi Replay Analyzer - Analyze and improve your Smash gameplay</p>
      </footer>
    </div>
  );
}
