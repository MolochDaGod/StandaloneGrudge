/**
 * GRUDGE Sync SDK
 * Handles character data exchange between GRUDA-Wars and grudgewarlords.com
 * 
 * Character flow:
 * 1. Import: Load characters from grudgewarlords.com into GRUDA-Wars
 * 2. Export: Save GRUDA-Wars characters/progress back to grudgewarlords.com
 */

// Platform URLs
const GRUDGE_PLATFORM_URL = 'https://grudgewarlords.com';
const GRUDA_WARS_URL = 'https://gruda-wars.vercel.app';

// Storage keys
const SYNC_TOKEN_KEY = 'grudge_sync_token';
const SYNC_USER_KEY = 'grudge_sync_user';
const IMPORTED_CHARACTERS_KEY = 'grudge_imported_characters';

// ============================================================================
// SHARED DATA DEFINITIONS
// ============================================================================

// Standard attribute names used across all Grudge games
export const STANDARD_ATTRIBUTES = [
  'Strength', 'Vitality', 'Endurance', 'Dexterity', 
  'Agility', 'Intellect', 'Wisdom', 'Tactics'
];

// Class mapping between platforms
export const CLASS_MAP = {
  // GRUDA-Wars class -> Main platform class
  'warrior': 'warrior',
  'mage': 'mage',
  'worge': 'druid',  // Worge maps to Druid on main platform
  'ranger': 'ranger',
  // Main platform -> GRUDA-Wars
  'druid': 'worge',
  'rogue': 'ranger',  // Rogue can play as Ranger
  'cleric': 'mage',   // Cleric can play as Mage
};

// Race mapping
export const RACE_MAP = {
  'human': 'human',
  'orc': 'orc', 
  'elf': 'elf',
  'undead': 'undead',
  'dwarf': 'dwarf',
  'goblin': 'goblin',
};

// ============================================================================
// AUTHENTICATION
// ============================================================================

/**
 * Check if user is connected to grudgewarlords.com
 */
export function isConnected() {
  return !!localStorage.getItem(SYNC_TOKEN_KEY);
}

/**
 * Get current sync user
 */
export function getSyncUser() {
  const data = localStorage.getItem(SYNC_USER_KEY);
  return data ? JSON.parse(data) : null;
}

/**
 * Connect to grudgewarlords.com via postMessage
 * Opens a popup window to authenticate
 */
export function connectToPlatform() {
  return new Promise((resolve, reject) => {
    // Check if already connected
    if (isConnected()) {
      resolve(getSyncUser());
      return;
    }

    // Open popup to grudgewarlords.com auth endpoint
    const authUrl = `${GRUDGE_PLATFORM_URL}/game-auth?game=gruda-wars&returnUrl=${encodeURIComponent(window.location.href)}`;
    const popup = window.open(authUrl, 'grudge_auth', 'width=500,height=600');

    if (!popup) {
      reject(new Error('Popup blocked. Please allow popups for this site.'));
      return;
    }

    // Listen for auth response
    const handleMessage = (event) => {
      if (event.origin !== GRUDGE_PLATFORM_URL) return;
      
      if (event.data.type === 'GRUDGE_AUTH_SUCCESS') {
        window.removeEventListener('message', handleMessage);
        
        // Store auth data
        localStorage.setItem(SYNC_TOKEN_KEY, event.data.token);
        localStorage.setItem(SYNC_USER_KEY, JSON.stringify(event.data.user));
        
        popup.close();
        resolve(event.data.user);
      } else if (event.data.type === 'GRUDGE_AUTH_CANCEL') {
        window.removeEventListener('message', handleMessage);
        popup.close();
        reject(new Error('Authentication cancelled'));
      }
    };

    window.addEventListener('message', handleMessage);

    // Timeout after 5 minutes
    setTimeout(() => {
      window.removeEventListener('message', handleMessage);
      if (!popup.closed) popup.close();
      reject(new Error('Authentication timeout'));
    }, 300000);
  });
}

/**
 * Disconnect from platform
 */
export function disconnect() {
  localStorage.removeItem(SYNC_TOKEN_KEY);
  localStorage.removeItem(SYNC_USER_KEY);
  localStorage.removeItem(IMPORTED_CHARACTERS_KEY);
}

// ============================================================================
// CHARACTER IMPORT (from grudgewarlords.com to GRUDA-Wars)
// ============================================================================

/**
 * Fetch characters from grudgewarlords.com
 */
export async function fetchPlatformCharacters() {
  const token = localStorage.getItem(SYNC_TOKEN_KEY);
  if (!token) {
    throw new Error('Not connected to grudgewarlords.com');
  }

  try {
    const response = await fetch(`${GRUDGE_PLATFORM_URL}/api/characters`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        disconnect();
        throw new Error('Session expired. Please reconnect.');
      }
      throw new Error('Failed to fetch characters');
    }

    const data = await response.json();
    return data.characters || [];
  } catch (error) {
    console.error('[GrudgeSync] Fetch characters error:', error);
    throw error;
  }
}

/**
 * Convert a grudgewarlords.com character to GRUDA-Wars format
 */
export function convertToGrudaWarsFormat(platformCharacter) {
  const classId = CLASS_MAP[platformCharacter.classId] || platformCharacter.classId;
  const raceId = RACE_MAP[platformCharacter.raceId] || platformCharacter.raceId;
  
  // Convert attributes from platform format to GRUDA-Wars format
  const attributes = platformCharacter.attributes || {};
  const attributePoints = {};
  
  STANDARD_ATTRIBUTES.forEach(attr => {
    const key = attr.charAt(0).toUpperCase() + attr.slice(1).toLowerCase();
    attributePoints[key] = attributes[attr.toLowerCase()] || attributes[attr] || 5;
  });

  return {
    id: `import_${platformCharacter.id}`,
    platformId: platformCharacter.id,
    name: platformCharacter.name,
    classId: classId,
    raceId: raceId,
    level: platformCharacter.level || 1,
    xp: platformCharacter.xp || 0,
    attributePoints: attributePoints,
    unspentPoints: platformCharacter.unspentAttributePoints || 0,
    skillPoints: platformCharacter.skillPoints || 1,
    unlockedSkills: {},
    equipment: convertEquipment(platformCharacter.equipment || {}),
    currentHealth: platformCharacter.hp || 100,
    currentMana: platformCharacter.mana || 50,
    currentStamina: platformCharacter.stamina || 100,
    abilityLoadout: null,
    imported: true,
    importedAt: Date.now(),
    lastSyncedAt: Date.now(),
  };
}

/**
 * Convert equipment from platform format
 */
function convertEquipment(platformEquipment) {
  const equipment = {};
  
  // Map equipment slots
  const slotMap = {
    'weapon': 'weapon',
    'offhand': 'offhand', 
    'head': 'helmet',
    'chest': 'armor',
    'legs': 'legs',
    'feet': 'boots',
    'hands': 'gloves',
    'accessory1': 'ring',
    'accessory2': 'amulet',
  };

  Object.entries(platformEquipment).forEach(([slot, item]) => {
    if (item && slotMap[slot]) {
      equipment[slotMap[slot]] = {
        id: item.itemId || item.id,
        name: item.name,
        tier: item.tier || 1,
        stats: item.stats || {},
      };
    }
  });

  return equipment;
}

/**
 * Import a character from platform to local game
 */
export function importCharacter(platformCharacter) {
  const grudaWarsChar = convertToGrudaWarsFormat(platformCharacter);
  
  // Store in local imported characters
  const imported = getImportedCharacters();
  const existingIndex = imported.findIndex(c => c.platformId === platformCharacter.id);
  
  if (existingIndex >= 0) {
    imported[existingIndex] = grudaWarsChar;
  } else {
    imported.push(grudaWarsChar);
  }
  
  localStorage.setItem(IMPORTED_CHARACTERS_KEY, JSON.stringify(imported));
  
  return grudaWarsChar;
}

/**
 * Get all imported characters
 */
export function getImportedCharacters() {
  const data = localStorage.getItem(IMPORTED_CHARACTERS_KEY);
  return data ? JSON.parse(data) : [];
}

// ============================================================================
// CHARACTER EXPORT (from GRUDA-Wars to grudgewarlords.com)
// ============================================================================

/**
 * Convert a GRUDA-Wars character to platform format
 */
export function convertToPlatformFormat(grudaWarsCharacter) {
  const classId = Object.entries(CLASS_MAP).find(([k, v]) => v === grudaWarsCharacter.classId)?.[0] 
    || grudaWarsCharacter.classId;
  const raceId = Object.entries(RACE_MAP).find(([k, v]) => v === grudaWarsCharacter.raceId)?.[0]
    || grudaWarsCharacter.raceId;

  // Convert attributes to platform format (lowercase keys)
  const attributes = {};
  Object.entries(grudaWarsCharacter.attributePoints || {}).forEach(([key, value]) => {
    attributes[key.toLowerCase()] = value;
  });

  return {
    name: grudaWarsCharacter.name,
    classId: classId,
    raceId: raceId,
    level: grudaWarsCharacter.level || 1,
    xp: grudaWarsCharacter.xp || 0,
    hp: grudaWarsCharacter.currentHealth || 100,
    mana: grudaWarsCharacter.currentMana || 50,
    stamina: grudaWarsCharacter.currentStamina || 100,
    attributes: attributes,
    unspentAttributePoints: grudaWarsCharacter.unspentPoints || 0,
    skillPoints: grudaWarsCharacter.skillPoints || 1,
    equipment: convertEquipmentToPlatform(grudaWarsCharacter.equipment || {}),
    // Game-specific data stored as metadata
    grudaWarsData: {
      unlockedSkills: grudaWarsCharacter.unlockedSkills,
      abilityLoadout: grudaWarsCharacter.abilityLoadout,
      namedHeroId: grudaWarsCharacter.namedHeroId,
    },
    source: 'gruda-wars',
    sourceVersion: '1.0.0',
  };
}

/**
 * Convert GRUDA-Wars equipment to platform format
 */
function convertEquipmentToPlatform(grudaWarsEquipment) {
  const equipment = {};
  
  const slotMap = {
    'weapon': 'weapon',
    'offhand': 'offhand',
    'helmet': 'head',
    'armor': 'chest',
    'legs': 'legs',
    'boots': 'feet',
    'gloves': 'hands',
    'ring': 'accessory1',
    'amulet': 'accessory2',
  };

  Object.entries(grudaWarsEquipment).forEach(([slot, item]) => {
    if (item && slotMap[slot]) {
      equipment[slotMap[slot]] = item.id || item.itemId;
    }
  });

  return equipment;
}

/**
 * Export a GRUDA-Wars character to grudgewarlords.com
 */
export async function exportCharacter(grudaWarsCharacter) {
  const token = localStorage.getItem(SYNC_TOKEN_KEY);
  if (!token) {
    throw new Error('Not connected to grudgewarlords.com');
  }

  const platformCharacter = convertToPlatformFormat(grudaWarsCharacter);

  try {
    const response = await fetch(`${GRUDGE_PLATFORM_URL}/api/characters/import`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(platformCharacter),
    });

    if (!response.ok) {
      if (response.status === 401) {
        disconnect();
        throw new Error('Session expired. Please reconnect.');
      }
      const error = await response.json();
      throw new Error(error.message || 'Failed to export character');
    }

    const data = await response.json();
    
    // Update local character with platform ID
    if (data.characterId) {
      grudaWarsCharacter.platformId = data.characterId;
      grudaWarsCharacter.lastSyncedAt = Date.now();
    }

    return data;
  } catch (error) {
    console.error('[GrudgeSync] Export character error:', error);
    throw error;
  }
}

/**
 * Sync character progress back to platform
 */
export async function syncProgress(grudaWarsCharacter) {
  if (!grudaWarsCharacter.platformId) {
    // Character not from platform, export as new
    return exportCharacter(grudaWarsCharacter);
  }

  const token = localStorage.getItem(SYNC_TOKEN_KEY);
  if (!token) {
    throw new Error('Not connected to grudgewarlords.com');
  }

  const updates = {
    level: grudaWarsCharacter.level,
    xp: grudaWarsCharacter.xp,
    hp: grudaWarsCharacter.currentHealth,
    attributes: {},
    grudaWarsData: {
      unlockedSkills: grudaWarsCharacter.unlockedSkills,
      abilityLoadout: grudaWarsCharacter.abilityLoadout,
    },
  };

  // Convert attributes
  Object.entries(grudaWarsCharacter.attributePoints || {}).forEach(([key, value]) => {
    updates.attributes[key.toLowerCase()] = value;
  });

  try {
    const response = await fetch(`${GRUDGE_PLATFORM_URL}/api/characters/${grudaWarsCharacter.platformId}/sync`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      if (response.status === 401) {
        disconnect();
        throw new Error('Session expired. Please reconnect.');
      }
      throw new Error('Failed to sync progress');
    }

    grudaWarsCharacter.lastSyncedAt = Date.now();
    return await response.json();
  } catch (error) {
    console.error('[GrudgeSync] Sync progress error:', error);
    throw error;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get sync status for a character
 */
export function getSyncStatus(character) {
  if (!character.platformId) {
    return { synced: false, status: 'local', message: 'Not synced to platform' };
  }
  
  if (!character.lastSyncedAt) {
    return { synced: true, status: 'imported', message: 'Imported from platform' };
  }

  const timeSinceSync = Date.now() - character.lastSyncedAt;
  const hoursSinceSync = timeSinceSync / (1000 * 60 * 60);

  if (hoursSinceSync < 1) {
    return { synced: true, status: 'synced', message: 'Recently synced' };
  } else if (hoursSinceSync < 24) {
    return { synced: true, status: 'stale', message: `Synced ${Math.floor(hoursSinceSync)}h ago` };
  } else {
    return { synced: true, status: 'outdated', message: 'Needs sync' };
  }
}

/**
 * Format GRUDGE ID for display
 */
export function formatGrudgeId(character) {
  if (character.platformId) {
    return `GRUDGE-${character.name.substring(0, 4).toUpperCase()}-${character.platformId.substring(0, 6).toUpperCase()}`;
  }
  return `LOCAL-${character.id.substring(0, 8).toUpperCase()}`;
}

// Export SDK as default
export default {
  // Auth
  isConnected,
  getSyncUser,
  connectToPlatform,
  disconnect,
  
  // Import
  fetchPlatformCharacters,
  convertToGrudaWarsFormat,
  importCharacter,
  getImportedCharacters,
  
  // Export
  convertToPlatformFormat,
  exportCharacter,
  syncProgress,
  
  // Utils
  getSyncStatus,
  formatGrudgeId,
  
  // Data
  STANDARD_ATTRIBUTES,
  CLASS_MAP,
  RACE_MAP,
  GRUDGE_PLATFORM_URL,
};
