import { useState, useEffect } from "react";
import { ReplayData } from "./ReplayDetails";
import { characters } from "@slippi/slippi-js";

type MatchupStats = {
  characterId: number;
  characterName: string;
  opponentCharacterId: number;
  opponentCharacterName: string;
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
  averageDamageDealt: number;
  averageDamageTaken: number;
  damageRatio: number;
};

const MatchupAnalysis = ({
  replayDataList,
  selectedPlayer,
}: {
  replayDataList: ReplayData[];
  selectedPlayer: string | null;
}) => {
  const [matchupStats, setMatchupStats] = useState<MatchupStats[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<number | null>(
    null
  );
  const [sortBy, setSortBy] = useState<keyof MatchupStats>("totalGames");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [uniqueCharacters, setUniqueCharacters] = useState<
    { id: number; name: string }[]
  >([]);

  useEffect(() => {
    if (!replayDataList.length) return;

    // Extract all unique characters used by the selected player
    const characterSet = new Set<number>();

    replayDataList.forEach(replay => {
      if (selectedPlayer) {
        // Find the player we're analyzing
        const players = [
          replay.metadata.players[0],
          replay.metadata.players[1],
        ];
        const playerEntry = players.find(p => p.names.code === selectedPlayer);
        if (playerEntry) {
          const playerIndex = players.indexOf(playerEntry);
          const character = replay.settings.players.find(
            p => p.playerIndex === playerIndex
          )?.characterId;
          if (character !== undefined) {
            characterSet.add(character);
          }
        }
      } else {
        // When no player is selected, add all characters
        replay.settings.players.forEach(player => {
          if (player.characterId !== undefined) {
            characterSet.add(player.characterId);
          }
        });
      }
    });

    const characters_list = Array.from(characterSet)
      .map(id => ({
        id,
        name: characters.getCharacterName(id),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    setUniqueCharacters(characters_list);
  }, [replayDataList, selectedPlayer]);

  useEffect(() => {
    if (!replayDataList.length) return;

    // Matchup stats aggregation object
    const statsMap: Record<
      string,
      {
        characterId: number;
        opponentCharacterId: number;
        totalGames: number;
        wins: number;
        losses: number;
        totalDamageDealt: number;
        totalDamageTaken: number;
      }
    > = {};

    // Process each replay
    replayDataList.forEach(replay => {
      // Must have two players
      if (replay.settings.players.length !== 2) return;

      let playerIndex = -1;
      let opponentIndex = -1;

      if (selectedPlayer) {
        // Find the selected player
        const players = [
          replay.metadata.players[0],
          replay.metadata.players[1],
        ];
        const playerEntry = players.find(p => p.names.code === selectedPlayer);
        if (!playerEntry) return;

        playerIndex = players.indexOf(playerEntry);
        opponentIndex = playerIndex === 0 ? 1 : 0;
      } else if (selectedCharacter !== null) {
        // When no player is selected but a character is, find games with that character
        const playerWithCharacter = replay.settings.players.findIndex(
          p => p.characterId === selectedCharacter
        );
        if (playerWithCharacter === -1) return;

        playerIndex = playerWithCharacter;
        opponentIndex = playerIndex === 0 ? 1 : 0;
      } else {
        // If neither player nor character is selected, skip
        return;
      }

      const playerCharacterId =
        replay.settings.players[playerIndex]?.characterId;
      const opponentCharacterId =
        replay.settings.players[opponentIndex]?.characterId;

      if (playerCharacterId === undefined || opponentCharacterId === undefined)
        return;

      // Skip if we're filtering by character and this doesn't match
      if (selectedCharacter !== null && playerCharacterId !== selectedCharacter)
        return;

      const matchupKey = `${playerCharacterId}-${opponentCharacterId}`;

      // Initialize matchup stats if needed
      if (!statsMap[matchupKey]) {
        statsMap[matchupKey] = {
          characterId: playerCharacterId,
          opponentCharacterId,
          totalGames: 0,
          wins: 0,
          losses: 0,
          totalDamageDealt: 0,
          totalDamageTaken: 0,
        };
      }

      // Find player stats
      const playerStats = replay.stats.overall.find(
        p => p.playerIndex === playerIndex
      );
      const opponentStats = replay.stats.overall.find(
        p => p.playerIndex === opponentIndex
      );

      if (!playerStats || !opponentStats) return;

      // Determine if this player won
      const stocks = replay.stats.stocks;
      const lastStock = stocks[stocks.length - 1];
      const isWinner = lastStock.playerIndex !== playerIndex;

      // Update stats
      statsMap[matchupKey].totalGames += 1;

      if (isWinner) {
        statsMap[matchupKey].wins += 1;
      } else {
        statsMap[matchupKey].losses += 1;
      }

      statsMap[matchupKey].totalDamageDealt += playerStats.totalDamage || 0;
      statsMap[matchupKey].totalDamageTaken += opponentStats.totalDamage || 0;
    });

    // Transform the map into an array of matchup stats with calculated metrics
    const matchupStatsArray: MatchupStats[] = Object.values(statsMap).map(
      stats => ({
        characterId: stats.characterId,
        characterName: characters.getCharacterName(stats.characterId),
        opponentCharacterId: stats.opponentCharacterId,
        opponentCharacterName: characters.getCharacterName(
          stats.opponentCharacterId
        ),
        totalGames: stats.totalGames,
        wins: stats.wins,
        losses: stats.losses,
        winRate:
          stats.totalGames > 0 ? (stats.wins / stats.totalGames) * 100 : 0,
        averageDamageDealt:
          stats.totalGames > 0 ? stats.totalDamageDealt / stats.totalGames : 0,
        averageDamageTaken:
          stats.totalGames > 0 ? stats.totalDamageTaken / stats.totalGames : 0,
        damageRatio:
          stats.totalDamageTaken > 0
            ? stats.totalDamageDealt / stats.totalDamageTaken
            : 0,
      })
    );

    // Sort the array
    const sortedStats = [...matchupStatsArray].sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDir === "asc" ? aValue - bValue : bValue - aValue;
      }

      return sortDir === "asc"
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });

    setMatchupStats(sortedStats);
  }, [replayDataList, selectedPlayer, selectedCharacter, sortBy, sortDir]);

  const handleSort = (column: keyof MatchupStats) => {
    setSortDir(sortBy === column && sortDir === "desc" ? "asc" : "desc");
    setSortBy(column);
  };

  const handleCharacterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedCharacter(value ? Number(value) : null);
  };

  if (replayDataList.length === 0) {
    return (
      <div className="p-4 bg-white rounded-lg shadow mt-6">
        <h2 className="text-2xl font-bold mb-4">Matchup Analysis</h2>
        <p className="text-gray-500">No replay data available.</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow mt-6">
      <h2 className="text-2xl font-bold mb-4">Matchup Analysis</h2>

      {/* Character Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Filter by Character:
          <select
            value={selectedCharacter?.toString() || ""}
            onChange={handleCharacterChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
          >
            <option value="">All Characters</option>
            {uniqueCharacters.map(char => (
              <option key={char.id} value={char.id}>
                {char.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {matchupStats.length === 0 ? (
        <p className="text-gray-500">
          No matchup data available for the selected filters.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-100">
              <tr>
                <th
                  className="px-6 py-3 text-left cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSort("characterName")}
                >
                  Your Character
                  {sortBy === "characterName" && (
                    <span className="ml-1">
                      {sortDir === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </th>
                <th
                  className="px-6 py-3 text-left cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSort("opponentCharacterName")}
                >
                  Opponent Character
                  {sortBy === "opponentCharacterName" && (
                    <span className="ml-1">
                      {sortDir === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </th>
                <th
                  className="px-6 py-3 text-left cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSort("totalGames")}
                >
                  Games
                  {sortBy === "totalGames" && (
                    <span className="ml-1">
                      {sortDir === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </th>
                <th
                  className="px-6 py-3 text-left cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSort("winRate")}
                >
                  Win Rate
                  {sortBy === "winRate" && (
                    <span className="ml-1">
                      {sortDir === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </th>
                <th
                  className="px-6 py-3 text-left cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSort("averageDamageDealt")}
                >
                  Avg DMG Dealt
                  {sortBy === "averageDamageDealt" && (
                    <span className="ml-1">
                      {sortDir === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </th>
                <th
                  className="px-6 py-3 text-left cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSort("averageDamageTaken")}
                >
                  Avg DMG Taken
                  {sortBy === "averageDamageTaken" && (
                    <span className="ml-1">
                      {sortDir === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </th>
                <th
                  className="px-6 py-3 text-left cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSort("damageRatio")}
                >
                  DMG Ratio
                  {sortBy === "damageRatio" && (
                    <span className="ml-1">
                      {sortDir === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </th>
              </tr>
            </thead>
            <tbody>
              {matchupStats.map((stat, index) => (
                <tr
                  key={index}
                  className={`border-b hover:bg-gray-50 ${
                    stat.winRate > 50
                      ? "bg-green-50"
                      : stat.winRate < 50
                      ? "bg-red-50"
                      : ""
                  }`}
                >
                  <td className="px-6 py-4">{stat.characterName}</td>
                  <td className="px-6 py-4">{stat.opponentCharacterName}</td>
                  <td className="px-6 py-4">{stat.totalGames}</td>
                  <td className="px-6 py-4">
                    <span
                      className={
                        stat.winRate > 50
                          ? "text-green-600"
                          : stat.winRate < 50
                          ? "text-red-600"
                          : ""
                      }
                    >
                      {stat.winRate.toFixed(1)}% ({stat.wins}-{stat.losses})
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {stat.averageDamageDealt.toFixed(1)}
                  </td>
                  <td className="px-6 py-4">
                    {stat.averageDamageTaken.toFixed(1)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={
                        stat.damageRatio > 1
                          ? "text-green-600"
                          : stat.damageRatio < 1
                          ? "text-red-600"
                          : ""
                      }
                    >
                      {stat.damageRatio.toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MatchupAnalysis;
