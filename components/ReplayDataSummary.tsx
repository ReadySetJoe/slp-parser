import { useState, useEffect } from "react";
import { ReplayData } from "./ReplayDetails";
import { Scatter } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend
);

type StatKey = keyof ReplayData["stats"]["overall"][0];

const axisKeyToLabel = {
  conversionCount: "Conversion Count",
  counterHitRatio: "Counter Hit Ratio",
  damagePerOpening: "Damage Per Opening",
  digitalInputsPerMinute: "Digital Inputs Per Minute",
  inputsPerMinute: "Inputs Per Minute",
  neutralWinRatio: "Neutral Win Ratio",
  openingsPerKill: "Openings Per Kill",
  playerIndex: "Player Index",
  successfulConversions: "Successful Conversions",
  totalDamage: "Total Damage",
};

const ReplayDataSummary = ({
  replayDataList,
}: {
  replayDataList: ReplayData[];
}) => {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [xAxis, setXAxis] = useState<StatKey>();
  const [yAxis, setYAxis] = useState<StatKey>();
  const [chartData, setChartData] = useState<{
    datasets: {
      label: string;
      data: { x: number; y: number }[];
      backgroundColor: string;
      borderColor: string;
      borderWidth: number;
    }[];
  } | null>(null);

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

  useEffect(() => {
    if (!xAxis || !yAxis || !replayDataList.length) return;

    // Filter data based on selected player
    const filteredData = selectedPlayer
      ? replayDataList.filter(replay =>
          [replay.metadata.players[0], replay.metadata.players[1]]
            .map(p => p.names.code)
            .includes(selectedPlayer)
        )
      : replayDataList;

    // Prepare data for chart
    const winData: { x: number; y: number }[] = [];
    const lossData: { x: number; y: number }[] = [];

    filteredData.forEach(replay => {
      const playerData = replay.stats.overall;
      const stocks = replay.stats.stocks;
      const winnerIndex = stocks[stocks.length - 1].playerIndex;
      const winner = playerData.find(p => p.playerIndex === winnerIndex);
      const loser = playerData.find(p => p.playerIndex !== winnerIndex);
      const selectedPlayerIndex = [
        replay.metadata.players[0],
        replay.metadata.players[1],
      ].findIndex(p => p.names.code === selectedPlayer);

      // Handle winner data
      if (
        winner &&
        winner?.playerIndex === selectedPlayerIndex &&
        winner[xAxis] !== undefined &&
        winner[yAxis] !== undefined
      ) {
        winData.push({
          x:
            typeof winner[xAxis] === "object" && "ratio" in winner[xAxis]
              ? winner[xAxis].ratio
              : winner[xAxis],
          y:
            typeof winner[yAxis] === "object" && "ratio" in winner[yAxis]
              ? winner[yAxis].ratio
              : winner[yAxis],
        });
      }

      // Handle loser data
      if (
        loser &&
        loser.playerIndex === selectedPlayerIndex &&
        loser[xAxis] !== undefined &&
        loser[yAxis] !== undefined
      ) {
        lossData.push({
          x:
            typeof loser[xAxis] === "object" && "ratio" in loser[xAxis]
              ? loser[xAxis].ratio
              : loser[xAxis],
          y:
            typeof loser[yAxis] === "object" && "ratio" in loser[yAxis]
              ? loser[yAxis].ratio
              : loser[yAxis],
        });
      }
    });

    setChartData({
      datasets: [
        {
          label: "Wins",
          data: winData,
          backgroundColor: "rgba(75, 192, 75, 0.6)", // Green for wins
          borderColor: "rgba(75, 192, 75, 1)",
          borderWidth: 1,
        },
        {
          label: "Losses",
          data: lossData,
          backgroundColor: "rgba(255, 99, 99, 0.6)", // Red for losses
          borderColor: "rgba(255, 99, 99, 1)",
          borderWidth: 1,
        },
      ],
    });
  }, [replayDataList, selectedPlayer, xAxis, yAxis]);

  const chartOptions: ChartOptions<"scatter"> = {
    scales: {
      x: {
        title: {
          display: true,
          text: xAxis ? axisKeyToLabel[xAxis] : "X Axis",
        },
      },
      y: {
        title: {
          display: true,
          text: yAxis ? axisKeyToLabel[yAxis] : "Y Axis",
        },
      },
    },
    plugins: {
      title: {
        display: true,
        text: `Player Stats: ${selectedPlayer || "All Players"}`,
      },
      legend: {
        display: true,
        position: "top",
      },
      tooltip: {
        callbacks: {
          label: context => {
            const label = context.dataset.label || "";
            return `${label}: (${context.parsed.x}, ${context.parsed.y})`;
          },
        },
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  const handlePlayerChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPlayer(event.target.value);
  };

  const handleXAxisChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setXAxis(event.target.value as StatKey);
  };

  const handleYAxisChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setYAxis(event.target.value as StatKey);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Replay Data Summary</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Select Player:
            <select
              onChange={handlePlayerChange}
              value={selectedPlayer || ""}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
            >
              <option value="">All Players</option>
              {sortedPlayers.map(([player, count]) => (
                <option key={player} value={player}>
                  {player} - {count} games
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            X-Axis:
            <select
              onChange={handleXAxisChange}
              value={xAxis || ""}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
            >
              <option value="">Select X-Axis</option>
              {replayDataList.length > 0 &&
                Object.keys(replayDataList[0].stats.overall[0])
                  .filter(k => !!axisKeyToLabel[k])
                  .map(key => (
                    <option key={key} value={key}>
                      {axisKeyToLabel[key]}
                    </option>
                  ))}
            </select>
          </label>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Y-Axis:
            <select
              onChange={handleYAxisChange}
              value={yAxis || ""}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
            >
              <option value="">Select Y-Axis</option>
              {replayDataList.length > 0 &&
                Object.keys(replayDataList[0].stats.overall[0])
                  .filter(k => !!axisKeyToLabel[k])
                  .map(key => (
                    <option key={key} value={key}>
                      {axisKeyToLabel[key]}
                    </option>
                  ))}
            </select>
          </label>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-xl font-semibold mb-2">Stats Visualization</h3>

        {(!xAxis || !yAxis) && (
          <div className="text-gray-500 p-4 text-center">
            Please select both X and Y axes to display the plot
          </div>
        )}

        {chartData && xAxis && yAxis && (
          <div className="h-96 w-full">
            <Scatter data={chartData} options={chartOptions} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ReplayDataSummary;
