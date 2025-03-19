import { SlippiGame } from "@slippi/slippi-js";

export async function parseSlippiReplay(filePath: string) {
  try {
    const game = new SlippiGame(filePath);

    // Get game metadata
    const metadata = game.getMetadata();

    // Get game settings (characters, stage, etc.)
    const settings = game.getSettings();

    // Get stats (conversions, combos, actions, etc.)
    const stats = game.getStats();

    // Return the parsed data
    return {
      metadata,
      settings,
      stats,
      // You can add more game data here as needed
      // frames: game.getFrames(), // Be careful with this, it can be very large
    };
  } catch (error) {
    console.error("Error parsing Slippi replay:", error);
    throw error;
  }
}
