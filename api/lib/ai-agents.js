/**
 * Grudge Studio AI Agents
 * 6 specialised agents with system prompts.
 * Server-side: uses Puter AI REST API when PUTER_API_TOKEN is set.
 * Client-side: returns agent config so GrudgePuter can call puter.ai.chat() directly.
 */

const AGENTS = {
  code: {
    type: 'code',
    name: 'Code Architect',
    description: 'Generates game systems, mechanics, and engine code for Grudge games',
    systemPrompt: `You are the Grudge Studio Code Architect. You write game systems for a souls-like MMO RPG built on web technologies. You understand ECS architecture, combat systems (warriors, mages, rangers, worges), crafting, professions, and faction AI. Output clean, modular JavaScript/TypeScript.`,
  },
  art: {
    type: 'art',
    name: 'Art Director',
    description: 'Manages sprite maps, animations, and visual asset pipelines',
    systemPrompt: `You are the Grudge Studio Art Director. You manage 2D pixel art sprite sheets, tile maps, and animation sequences for a medieval fantasy MMO. You understand sprite atlas packing, animation state machines, and rendering pipelines. Output asset specifications and pipeline configs as JSON.`,
  },
  lore: {
    type: 'lore',
    name: 'Lore Keeper',
    description: 'Creates world lore, faction backstories, quest narratives, and NPC dialogue',
    systemPrompt: `You are the Grudge Studio Lore Keeper. You write lore for a dark medieval fantasy world with warring factions, pirate crews, Piglin invasions, and magical islands. Races include Humans, Elves, Dwarves, Orcs, and Worges (shapeshifters). Output rich narrative text and structured quest JSON.`,
  },
  balance: {
    type: 'balance',
    name: 'Balance Engineer',
    description: 'Tunes combat stats, item tiers, progression curves, and economy',
    systemPrompt: `You are the Grudge Studio Balance Engineer. You tune a souls-like MMO with 4 classes (Warrior, Mage, Ranger, Worge), 6 armor tiers, 17 weapon types, and 5 harvesting professions. You understand DPS curves, stat scaling, economy sinks/faucets, and PvP balance. Output numerical data and formulas as JSON.`,
  },
  qa: {
    type: 'qa',
    name: 'QA Analyst',
    description: 'Tests systems, finds bugs, validates data integrity, and writes test cases',
    systemPrompt: `You are the Grudge Studio QA Analyst. You validate game data, find bugs in combat math, test edge cases in crafting/profession systems, and verify ObjectStore JSON schema integrity. Output structured bug reports and test cases as JSON.`,
  },
  mission: {
    type: 'mission',
    name: 'Mission Designer',
    description: 'Designs missions, encounters, island zones, and dynamic AI faction events',
    systemPrompt: `You are the Grudge Studio Mission Designer. You create missions for a faction-driven MMO with AI crews, permadeath, island conquest, and daily crew rotations at 11pm CST. You design encounters, boss fights, harvesting routes, and crew progression events. Output mission data as JSON.`,
  },
};

export function listAgents() {
  return Object.values(AGENTS).map(({ type, name, description }) => ({ type, name, description }));
}

export function getAgentInfo(type) {
  return AGENTS[type] || null;
}

/**
 * Run an AI query server-side via Puter AI REST API.
 * Falls back to returning the prepared prompt if no API token is configured.
 */
export async function queryAgent(agentType, userPrompt, opts = {}) {
  const agent = AGENTS[agentType];
  if (!agent) return { error: 'unknown_agent', available: Object.keys(AGENTS) };

  const messages = [
    { role: 'system', content: agent.systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  // Server-side execution if Puter API token is available
  const token = process.env.PUTER_API_TOKEN;
  if (token) {
    try {
      const res = await fetch('https://api.puter.com/drivers/call', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interface: 'puter-chat-completion',
          driver: opts.model || 'claude-sonnet',
          method: 'complete',
          args: {
            messages,
            ...(opts.temperature != null ? { temperature: opts.temperature } : {}),
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return {
          status: 'completed',
          agent: agentType,
          result: data.result?.message?.content || data.result || data,
          source: 'puter-ai-server',
        };
      }
    } catch (err) {
      console.error(`[AI] Puter API error for ${agentType}:`, err.message);
    }
  }

  // Fallback: return prepared prompt for client-side execution via puter.ai.chat()
  return {
    status: 'client_execute',
    agent: agentType,
    messages,
    instruction: 'Execute via puter.ai.chat(userPrompt, { systemPrompt }) on the client',
    source: 'prepared-prompt',
  };
}
