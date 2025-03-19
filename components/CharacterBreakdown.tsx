import { useState, useEffect } from "react";
import { ReplayData } from "./ReplayDetails";
import { characters } from "@slippi/slippi-js";

type CharacterStats = {
  characterId: number;
  characterName: string;
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
  averageDamagePerOpening: number;
  averageOpeningsPerKill: number;
  averageInputsPerMinute: number;
};

const CharacterBreakdown = ({
  replayDataList,
  selectedPlayer,
}: {
  replayDataList: ReplayData[];
  selectedPlayer: string | null;
}) => {
  const [characterStats, setCharacterStats] = useState<CharacterStats[]>([]);
  const [sortBy, setSortBy] = useState<keyof CharacterStats>("totalGames");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    if (!replayDataList.length) return;

    // Character stats aggregation object
    const statsMap: Record<
      number,
      {
        characterId: number;
        totalGames: number;
        wins: number;
        losses: number;
        totalDamagePerOpening: number;
        openingsCount: number;
        openingsPerKillTotal: number;
        killsCount: number;
        inputsPerMinuteTotal: number;
      }
    > = {};

    // Process each replay
    replayDataList.forEach(replay => {
      // Find the player we're analyzing
      const selectedPlayerIndex = selectedPlayer
        ? replay.settings.players.findIndex(
            p =>
              replay.metadata.players[p.playerIndex]?.names.code ===
              selectedPlayer
          )
        : -1;

      // If no specific player is selected or we found the selected player
      if (selectedPlayer === null || selectedPlayerIndex !== -1) {
        // For "all players" mode, process each player in the game
        const playerIndices = selectedPlayer
          ? [selectedPlayerIndex]
          : replay.settings.players.map(p => p.playerIndex);

        playerIndices.forEach(playerIndex => {
          if (playerIndex === -1) return;

          const characterId = replay.settings.players.find(
            p => p.playerIndex === playerIndex
          )?.characterId;

          if (characterId === undefined) return;

          // Initialize character stats if needed
          if (!statsMap[characterId]) {
            statsMap[characterId] = {
              characterId,
              totalGames: 0,
              wins: 0,
              losses: 0,
              totalDamagePerOpening: 0,
              openingsCount: 0,
              openingsPerKillTotal: 0,
              killsCount: 0,
              inputsPerMinuteTotal: 0,
            };
          }

          // Find player stats
          const playerStats = replay.stats.overall.find(
            p => p.playerIndex === playerIndex
          );

          if (!playerStats) return;

          // Determine if this player won
          const stocks = replay.stats.stocks;
          const lastStock = stocks[stocks.length - 1];
          const isWinner = lastStock.playerIndex !== playerIndex;

          // Update stats
          statsMap[characterId].totalGames += 1;

          if (isWinner) {
            statsMap[characterId].wins += 1;
          } else {
            statsMap[characterId].losses += 1;
          }

          // Aggregate performance metrics
          if (playerStats.damagePerOpening?.ratio) {
            statsMap[characterId].totalDamagePerOpening +=
              playerStats.damagePerOpening.ratio;
            statsMap[characterId].openingsCount += 1;
          }

          if (playerStats.openingsPerKill?.ratio) {
            statsMap[characterId].openingsPerKillTotal +=
              playerStats.openingsPerKill.ratio;
            statsMap[characterId].killsCount += 1;
          }

          if (playerStats.inputsPerMinute?.ratio) {
            statsMap[characterId].inputsPerMinuteTotal +=
              playerStats.inputsPerMinute.ratio;
          }
        });
      }
    });

    // Transform the map into an array of character stats with calculated metrics
    const characterStatsArray: CharacterStats[] = Object.values(statsMap).map(
      stats => ({
        characterId: stats.characterId,
        characterName: characters.getCharacterName(stats.characterId),
        totalGames: stats.totalGames,
        wins: stats.wins,
        losses: stats.losses,
        winRate:
          stats.totalGames > 0 ? (stats.wins / stats.totalGames) * 100 : 0,
        averageDamagePerOpening:
          stats.openingsCount > 0
            ? stats.totalDamagePerOpening / stats.openingsCount
            : 0,
        averageOpeningsPerKill:
          stats.killsCount > 0
            ? stats.openingsPerKillTotal / stats.killsCount
            : 0,
        averageInputsPerMinute:
          stats.totalGames > 0
            ? stats.inputsPerMinuteTotal / stats.totalGames
            : 0,
      })
    );

    // Sort the array
    const sortedStats = [...characterStatsArray].sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDir === "asc" ? aValue - bValue : bValue - aValue;
      }

      // Fallback for string comparison if needed
      return sortDir === "asc"
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });

    setCharacterStats(sortedStats);
  }, [replayDataList, selectedPlayer, sortBy, sortDir]);

  const handleSort = (column: keyof CharacterStats) => {
    setSortDir(sortBy === column && sortDir === "desc" ? "asc" : "desc");
    setSortBy(column);
  };

  if (!characterStats.length) {
    return (
      <div className="p-4 bg-white rounded-lg shadow mt-6">
        <h2 className="text-2xl font-bold mb-4">Character Breakdown</h2>
        <p className="text-gray-500">No character data available.</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow mt-6">
      <h2 className="text-2xl font-bold mb-4">Character Breakdown</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th
                className="px-6 py-3 text-left cursor-pointer hover:bg-gray-200"
                onClick={() => handleSort("characterName")}
              >
                Character
                {sortBy === "characterName" && (
                  <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>
                )}
              </th>
              <th
                className="px-6 py-3 text-left cursor-pointer hover:bg-gray-200"
                onClick={() => handleSort("totalGames")}
              >
                Games
                {sortBy === "totalGames" && (
                  <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>
                )}
              </th>
              <th
                className="px-6 py-3 text-left cursor-pointer hover:bg-gray-200"
                onClick={() => handleSort("wins")}
              >
                Wins
                {sortBy === "wins" && (
                  <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>
                )}
              </th>
              <th
                className="px-6 py-3 text-left cursor-pointer hover:bg-gray-200"
                onClick={() => handleSort("losses")}
              >
                Losses
                {sortBy === "losses" && (
                  <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>
                )}
              </th>
              <th
                className="px-6 py-3 text-left cursor-pointer hover:bg-gray-200"
                onClick={() => handleSort("winRate")}
              >
                Win Rate
                {sortBy === "winRate" && (
                  <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>
                )}
              </th>
              <th
                className="px-6 py-3 text-left cursor-pointer hover:bg-gray-200"
                onClick={() => handleSort("averageDamagePerOpening")}
              >
                Dmg/Opening
                {sortBy === "averageDamagePerOpening" && (
                  <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>
                )}
              </th>
              <th
                className="px-6 py-3 text-left cursor-pointer hover:bg-gray-200"
                onClick={() => handleSort("averageOpeningsPerKill")}
              >
                Openings/Kill
                {sortBy === "averageOpeningsPerKill" && (
                  <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>
                )}
              </th>
            </tr>
          </thead>
          <tbody>
            {characterStats.map(stat => (
              <tr key={stat.characterId} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4">{stat.characterName}</td>
                <td className="px-6 py-4">{stat.totalGames}</td>
                <td className="px-6 py-4">{stat.wins}</td>
                <td className="px-6 py-4">{stat.losses}</td>
                <td className="px-6 py-4">{stat.winRate.toFixed(1)}%</td>
                <td className="px-6 py-4">
                  {stat.averageDamagePerOpening.toFixed(1)}
                </td>
                <td className="px-6 py-4">
                  {stat.averageOpeningsPerKill.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CharacterBreakdown;
