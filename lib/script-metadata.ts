export interface ScriptMetadata {
  description: string;
  features: string[];
  // You can add more fields here if needed (e.g., videoUrl, keyLink)
}

// Map Script ID or Name to its metadata
// We prioritize ID matches, but fallback to Name if ID changes or is easier to manage
export const SCRIPT_METADATA: Record<string, ScriptMetadata> = {
  // Example by Universe ID (Preferred for stability)
  "blox-fruits-id": { 
    description: "The ultimate auto-farming script for Blox Fruits. Features auto-quest, auto-stats, and raid carries.",
    features: [
      "Auto Farm Level",
      "Auto Raid",
      "Fruit Sniper",
      "ESP / Wallhack",
      "Teleports"
    ]
  },

  "Anime Expedition": {
    description: "The go-to script for Anime Expedition — auto-farm, quest automation, and stat grinding on autopilot.",
    features: [
      "Auto Farm",
      "Auto Quest",
      "Teleport",
      "God Mode",
      "Speed Hack",
    ]
  },

  // Example by Name (Matches the name shown on the card)
  "Anime Vanguards": {
    description: "Dominate Anime Vanguards with powerful macro and auto-play features.",
    features: [
      "Auto Play / Macro",
      "Auto Upgrade",
      "Infinite Mode Support",
      "Unit Sniper"
    ]
  },
  
  // Default fallback for scripts without specific metadata
  "default": {
    description: "A premium script providing enhanced functionality and automation features.",
    features: ["Optimized Performance", "Anti-Ban Protection", "Regular Updates"]
  }
};
