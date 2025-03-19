import { characters, stages } from "@slippi/slippi-js";

interface Player {
  names: {
    netplay: string;
    code: string;
  };
}

export interface ReplayData {
  metadata: {
    startAt: string;
    lastFrame: number;
    playedOn: string;
    players: Player[];
  };
  stats: {
    conversions: {
      moves: { moveName: string }[];
      playerIndex: number;
      opponentIndex: number;
      didKill: boolean;
      damage: number;
      endPercent: number;
    }[];
    overall: {
      conversionCount: number;
      counterHitRatio: {
        count: number;
        total: number;
        ratio: number;
      };
      damagePerOpening: {
        count: number;
        total: number;
        ratio: number;
      };
      digitalInputsPerMinute: {
        count: number;
        total: number;
        ratio: number;
      };
      inputsPerMinute: {
        count: number;
        total: number;
        ratio: number;
      };
      neutralWinRatio: { count: number; total: number; ratio: number };
      openingsPerKill: { count: number; total: number; ratio: number };
      playerIndex: number;
      successfulConversions: { count: number; total: number; ratio: number };
      totalDamage: number;
    }[];
    stocks: {
      count: number;
      currentPercent: number;
      deathAnimation?: null;
      endFrame?: number;
      endPercent?: number;
      playerIndex: number;
      startFrame: number;
      startPercent: number;
    }[];
  };
  settings: {
    stageId: number;
    players: {
      displayName: string;
      port: number;
      characterId: number;
      characterColor: string;
      playerIndex: number;
    }[];
  };
}

export default function ReplayDetails({ data }: { data: ReplayData }) {
  if (!data) return null;

  const { metadata, stats, settings } = data;

  return (
    <div className="text-left border border-gray-200 rounded-lg p-2 m-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-2 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-blue-600">
            Game Info
          </h3>
          <div className="space-y-2">
            <p>
              <span className="font-medium">Date:</span>{" "}
              {new Date(metadata.startAt).toLocaleString()}
            </p>
            <p>
              <span className="font-medium">Stage:</span>{" "}
              {stages.getStageName(settings.stageId)}
            </p>
            <p>
              <span className="font-medium">Game Duration:</span>{" "}
              {Math.floor(metadata.lastFrame / 60)} seconds
            </p>
          </div>
        </div>

        <div className="bg-gray-50 p-2 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-600">Players</h3>
          {settings.players.map((player, index) => (
            <div
              key={index}
              className="py-2 border-b border-gray-200 last:border-0"
            >
              <div className="flex justify-between items-center">
                <p className="font-bold">{player.displayName}</p>
                <p className="text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                  {characters.getCharacterName(player.characterId)}
                </p>
              </div>

              {stats?.conversions && (
                <p>
                  Stocks Taken:{" "}
                  {
                    stats.conversions.filter(
                      conv =>
                        conv.moves &&
                        conv.moves.length &&
                        conv.playerIndex === player.playerIndex &&
                        conv.didKill
                    ).length
                  }
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
