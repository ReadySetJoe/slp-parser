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
  LineElement,
} from "chart.js";
import "chart.js/auto"; // For regression plugin support

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

type StatKey = Exclude<keyof ReplayData["stats"]["overall"][0], "playerIndex">;

// Expanded axis labels with more descriptive information
const axisKeyToLabel = {
  conversionCount: "Conversion Count",
  counterHitRatio: "Counter Hit Ratio",
  damagePerOpening: "Damage Per Opening",
  digitalInputsPerMinute: "Digital Inputs Per Minute",
  inputsPerMinute: "Inputs Per Minute",
  neutralWinRatio: "Neutral Win Ratio",
  openingsPerKill: "Openings Per Kill",
  successfulConversions: "Successful Conversions",
  totalDamage: "Total Damage",
};

// Add descriptions for tooltips
const axisDescriptions = {
  conversionCount:
    "Total number of times player converted neutral wins into damage",
  counterHitRatio: "Percentage of counter hits vs being counter hit",
  damagePerOpening: "Average damage dealt per opening/advantage state",
  digitalInputsPerMinute:
    "Number of digital inputs (button presses) per minute",
  inputsPerMinute: "Total inputs (analog + digital) per minute",
  neutralWinRatio: "Ratio of neutral wins vs opponent's neutral wins",
  openingsPerKill: "Average number of openings needed to secure a kill",
  successfulConversions:
    "Number of conversions that led to significant advantage",
  totalDamage: "Total damage dealt throughout the game",
};

// Statistics calculation utilities
const calculateAverage = (data: number[]) => {
  return data.reduce((sum, val) => sum + val, 0) / data.length;
};

const calculateMedian = (data: number[]) => {
  const sorted = [...data].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
};

const ReplayDataSummary = ({
  replayDataList,
  selectedPlayer,
}: {
  replayDataList: ReplayData[];
  selectedPlayer: string | null;
}) => {
  const [xAxis, setXAxis] = useState<StatKey>();
  const [yAxis, setYAxis] = useState<StatKey>();
  const [chartData, setChartData] = useState<{
    datasets: {
      label: string;
      data: { x: number; y: number }[];
      backgroundColor: string;
      borderColor: string;
      borderWidth: number;
      trendlineLinear?: {
        style: string;
        lineStyle: "solid" | "dotted";
        width: number;
      };
    }[];
  } | null>(null);

  // State for statistics summary
  const [stats, setStats] = useState<{
    wins: {
      count: number;
      xAvg: number;
      yAvg: number;
      xMedian: number;
      yMedian: number;
    };
    losses: {
      count: number;
      xAvg: number;
      yAvg: number;
      xMedian: number;
      yMedian: number;
    };
  } | null>(null);

  // Count player occurrences
  const playerFrequency: Record<string, number> = {};
  replayDataList.forEach((replay) => {
    const players = [replay.metadata.players[0], replay.metadata.players[1]];
    players.forEach((player) => {
      playerFrequency[player.names.code] =
        (playerFrequency[player.names.code] || 0) + 1;
    });
  });

  useEffect(() => {
    if (!xAxis || !yAxis || !replayDataList.length) return;

    // Filter data based on selected player
    const filteredData = selectedPlayer
      ? replayDataList.filter((replay) =>
          [replay.metadata.players[0], replay.metadata.players[1]]
            .map((p) => p.names.code)
            .includes(selectedPlayer)
        )
      : replayDataList;

    // Prepare data for chart
    const winData: { x: number; y: number }[] = [];
    const lossData: { x: number; y: number }[] = [];

    filteredData.forEach((replay) => {
      const playerData = replay.stats.overall;
      const stocks = replay.stats.stocks;
      const winnerIndex = stocks[stocks.length - 1].playerIndex;
      const winner = playerData.find((p) => p.playerIndex === winnerIndex);
      const loser = playerData.find((p) => p.playerIndex !== winnerIndex);
      const selectedPlayerIndex = [
        replay.metadata.players[0],
        replay.metadata.players[1],
      ].findIndex((p) => p.names.code === selectedPlayer);

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
          trendlineLinear: {
            style: "rgba(75, 192, 75, 0.6)",
            lineStyle: "solid",
            width: 2,
          },
        },
        {
          label: "Losses",
          data: lossData,
          backgroundColor: "rgba(255, 99, 99, 0.6)", // Red for losses
          borderColor: "rgba(255, 99, 99, 1)",
          borderWidth: 1,
          trendlineLinear: {
            style: "rgba(255, 99, 99, 0.6)",
            lineStyle: "solid",
            width: 2,
          },
        },
      ],
    });

    // Calculate statistics for wins and losses
    if (winData.length > 0 || lossData.length > 0) {
      setStats({
        wins: {
          count: winData.length,
          xAvg:
            winData.length > 0 ? calculateAverage(winData.map((d) => d.x)) : 0,
          yAvg:
            winData.length > 0 ? calculateAverage(winData.map((d) => d.y)) : 0,
          xMedian:
            winData.length > 0 ? calculateMedian(winData.map((d) => d.x)) : 0,
          yMedian:
            winData.length > 0 ? calculateMedian(winData.map((d) => d.y)) : 0,
        },
        losses: {
          count: lossData.length,
          xAvg:
            lossData.length > 0
              ? calculateAverage(lossData.map((d) => d.x))
              : 0,
          yAvg:
            lossData.length > 0
              ? calculateAverage(lossData.map((d) => d.y))
              : 0,
          xMedian:
            lossData.length > 0 ? calculateMedian(lossData.map((d) => d.x)) : 0,
          yMedian:
            lossData.length > 0 ? calculateMedian(lossData.map((d) => d.y)) : 0,
        },
      });
    } else {
      setStats(null);
    }
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
          label: (context) => {
            const label = context.dataset.label || "";
            const xValue = context.parsed.x.toFixed(2);
            const yValue = context.parsed.y.toFixed(2);

            return [
              `${label}: (${xValue}, ${yValue})`,
              `${xAxis}: ${xValue}`,
              `${yAxis}: ${yValue}`,
            ];
          },
          footer: () => {
            if (xAxis && yAxis) {
              return [
                `${axisDescriptions[xAxis]}`,
                `${axisDescriptions[yAxis]}`,
              ];
            }
            return "";
          },
        },
      },
    },
    responsive: true,
    maintainAspectRatio: false,
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
            X-Axis:
            <select
              onChange={handleXAxisChange}
              value={xAxis || ""}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
            >
              <option value="">Select X-Axis</option>
              {replayDataList.length > 0 &&
                (Object.keys(replayDataList[0].stats.overall[0]) as StatKey[])
                  .filter((k) => k in axisKeyToLabel)
                  .map((key) => (
                    <option key={key} value={key}>
                      {axisKeyToLabel[key as StatKey]}
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
                  .filter((k) => k in axisKeyToLabel)
                  .map((key) => (
                    <option key={key} value={key}>
                      {axisKeyToLabel[key as StatKey]}
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

        {/* Statistics Summary Panel */}
        {stats && xAxis && yAxis && (
          <div className="mt-6 bg-gray-50 p-4 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-3">
              Performance Statistics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Win Stats */}
              <div className="bg-green-50 p-3 rounded-md border border-green-200">
                <h4 className="font-medium text-green-800 mb-2">
                  Wins ({stats.wins.count})
                </h4>
                {stats.wins.count > 0 ? (
                  <ul className="space-y-1 text-sm">
                    <li>
                      Average {axisKeyToLabel[xAxis]}:{" "}
                      {stats.wins.xAvg.toFixed(2)}
                    </li>
                    <li>
                      Median {axisKeyToLabel[xAxis]}:{" "}
                      {stats.wins.xMedian.toFixed(2)}
                    </li>
                    <li>
                      Average {axisKeyToLabel[yAxis]}:{" "}
                      {stats.wins.yAvg.toFixed(2)}
                    </li>
                    <li>
                      Median {axisKeyToLabel[yAxis]}:{" "}
                      {stats.wins.yMedian.toFixed(2)}
                    </li>
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No win data available</p>
                )}
              </div>

              {/* Loss Stats */}
              <div className="bg-red-50 p-3 rounded-md border border-red-200">
                <h4 className="font-medium text-red-800 mb-2">
                  Losses ({stats.losses.count})
                </h4>
                {stats.losses.count > 0 ? (
                  <ul className="space-y-1 text-sm">
                    <li>
                      Average {axisKeyToLabel[xAxis]}:{" "}
                      {stats.losses.xAvg.toFixed(2)}
                    </li>
                    <li>
                      Median {axisKeyToLabel[xAxis]}:{" "}
                      {stats.losses.xMedian.toFixed(2)}
                    </li>
                    <li>
                      Average {axisKeyToLabel[yAxis]}:{" "}
                      {stats.losses.yAvg.toFixed(2)}
                    </li>
                    <li>
                      Median {axisKeyToLabel[yAxis]}:{" "}
                      {stats.losses.yMedian.toFixed(2)}
                    </li>
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">
                    No loss data available
                  </p>
                )}
              </div>
            </div>

            {/* Insights */}
            {stats.wins.count > 0 && stats.losses.count > 0 && (
              <div className="mt-4 bg-blue-50 p-3 rounded-md border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-2">
                  Performance Insights
                </h4>
                <ul className="space-y-1 text-sm">
                  <li>
                    {axisKeyToLabel[xAxis]} difference:{" "}
                    {(stats.wins.xAvg - stats.losses.xAvg).toFixed(2)}
                    {stats.wins.xAvg > stats.losses.xAvg
                      ? " higher in wins"
                      : " higher in losses"}
                  </li>
                  <li>
                    {axisKeyToLabel[yAxis]} difference:{" "}
                    {(stats.wins.yAvg - stats.losses.yAvg).toFixed(2)}
                    {stats.wins.yAvg > stats.losses.yAvg
                      ? " higher in wins"
                      : " higher in losses"}
                  </li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReplayDataSummary;
