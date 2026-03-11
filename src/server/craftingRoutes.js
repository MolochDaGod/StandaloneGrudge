/**
 * Crafting & Inventory Routes
 * Bridges GRUDA-Wars with the Warlord-Crafting-Suite database.
 * All queries hit the suite Neon PostgreSQL via suiteDb pool.
 */
import { suiteQuery, isConnected, getSuiteClient } from './suiteDb.js';

// ── Static definitions (served from memory, not DB) ──
// These mirror the shared/definitions from Warlord-Crafting-Suite
const PROFESSIONS = ['Miner', 'Forester', 'Mystic', 'Chef', 'Engineer'];

const MATERIAL_CATEGORIES = [
  'ore', 'wood', 'cloth', 'essence', 'ingredient',
  'component', 'gem', 'leather', 'infusion'
];

// Tier costs for crafting
const TIER_COSTS = {
  1: { gold: 100, materials: 5 },
  2: { gold: 200, materials: 10 },
  3: { gold: 400, materials: 15 },
  4: { gold: 800, materials: 20 },
  5: { gold: 1600, materials: 30 },
  6: { gold: 3200, materials: 45 },
  7: { gold: 6400, materials: 60 },
  8: { gold: 12800, materials: 80 },
};

// ── Helpers ──

function requireSuiteDb(req, res, next) {
  if (!isConnected()) {
    return res.status(503).json({
      error: 'Suite database not configured',
      hint: 'Set DATABASE_URL environment variable',
    });
  }
  next();
}

/** Resolve suite accountId from discord_id */
async function resolveAccountByDiscord(discordId) {
  const result = await suiteQuery(
    `SELECT id, grudge_id, username, display_name, gold, gbux_balance, account_xp,
            is_premium, discord_id, discord_username
     FROM accounts WHERE discord_id = $1`,
    [discordId]
  );
  return result.rows[0] || null;
}

/** Resolve suite accountId from grudge_id */
async function resolveAccountByGrudgeId(grudgeId) {
  const result = await suiteQuery(
    `SELECT id, grudge_id, username, display_name, gold, gbux_balance, account_xp,
            is_premium, discord_id, discord_username
     FROM accounts WHERE grudge_id = $1`,
    [grudgeId]
  );
  return result.rows[0] || null;
}

// ── Route registration ──

export function registerCraftingRoutes(app) {
  const ADMIN_TOKEN = process.env.GAME_API_GRUDA;

  function requireAuth(req, res, next) {
    const token = req.headers['x-api-key'] || req.query.token;
    if (!token || token !== ADMIN_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  }

  // ────────────────────────────────────────────
  // ACCOUNT LINKING
  // ────────────────────────────────────────────

  /**
   * POST /api/crafting/link-account
   * Links a GRUDA-Wars Discord account to the suite's GRUDGE ID system.
   * Body: { discord_id }
   * Returns: { grudgeId, accountId, username, gold, ... }
   */
  app.post('/api/crafting/link-account', requireAuth, requireSuiteDb, async (req, res) => {
    try {
      const { discord_id } = req.body;
      if (!discord_id) return res.status(400).json({ error: 'discord_id required' });

      const account = await resolveAccountByDiscord(discord_id);
      if (!account) {
        return res.status(404).json({
          error: 'No suite account found for this Discord ID',
          hint: 'Create an account at the Warlord-Crafting-Suite first',
        });
      }

      res.json({
        linked: true,
        accountId: account.id,
        grudgeId: account.grudge_id,
        username: account.username,
        displayName: account.display_name,
        gold: account.gold || 0,
        gbux: account.gbux_balance || 0,
        accountXp: account.account_xp || 0,
        isPremium: account.is_premium || false,
      });
    } catch (err) {
      console.error('[Crafting] Link account error:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // ────────────────────────────────────────────
  // RECIPES
  // ────────────────────────────────────────────

  /**
   * GET /api/crafting/recipes
   * Fetch all recipes. Optional filters: ?profession=Miner&category=weapon
   */
  app.get('/api/crafting/recipes', requireAuth, requireSuiteDb, async (req, res) => {
    try {
      const { profession, category, tier } = req.query;
      let sql = 'SELECT * FROM recipes WHERE 1=1';
      const params = [];
      let idx = 1;

      if (profession) {
        sql += ` AND profession = $${idx++}`;
        params.push(profession);
      }
      if (category) {
        sql += ` AND category = $${idx++}`;
        params.push(category);
      }
      if (tier) {
        sql += ` AND tier = $${idx++}`;
        params.push(parseInt(tier));
      }

      sql += ' ORDER BY tier, name';
      const result = await suiteQuery(sql, params);

      res.json({
        success: true,
        recipes: result.rows,
        count: result.rows.length,
      });
    } catch (err) {
      console.error('[Crafting] Recipes fetch error:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * GET /api/crafting/recipes/unlocked/:grudgeId
   * Get unlocked recipes for a character (by grudge_id → accountId → characterId)
   */
  app.get('/api/crafting/recipes/unlocked/:grudgeId', requireAuth, requireSuiteDb, async (req, res) => {
    try {
      const { grudgeId } = req.params;
      const { characterId } = req.query;

      // Verify account
      const account = await resolveAccountByGrudgeId(grudgeId);
      if (!account) return res.status(404).json({ error: 'Account not found' });

      let sql, params;
      if (characterId) {
        sql = `SELECT ur.*, c.name as character_name
               FROM unlocked_recipes ur
               JOIN characters c ON c.id = ur.character_id
               WHERE ur.character_id = $1 AND c.account_id = $2
               ORDER BY ur.unlocked_at`;
        params = [characterId, account.id];
      } else {
        // Get all unlocked recipes across all characters on the account
        sql = `SELECT ur.*, c.name as character_name
               FROM unlocked_recipes ur
               JOIN characters c ON c.id = ur.character_id
               WHERE c.account_id = $1
               ORDER BY ur.unlocked_at`;
        params = [account.id];
      }

      const result = await suiteQuery(sql, params);

      res.json({
        success: true,
        unlockedRecipes: result.rows.map(r => ({
          id: r.id,
          recipeId: r.recipe_id,
          characterId: r.character_id,
          characterName: r.character_name,
          source: r.source,
          recipeXp: r.recipe_xp,
          recipeLevel: r.recipe_level,
          timesCrafted: r.times_crafted,
          unlockedAt: r.unlocked_at,
        })),
        count: result.rows.length,
      });
    } catch (err) {
      console.error('[Crafting] Unlocked recipes error:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // ────────────────────────────────────────────
  // MATERIALS
  // ────────────────────────────────────────────

  /**
   * GET /api/crafting/materials
   * Fetch materials catalog. Optional filters: ?category=ore&tier=3
   */
  app.get('/api/crafting/materials', requireAuth, requireSuiteDb, async (req, res) => {
    try {
      const { category, tier, profession } = req.query;
      // Materials are defined in the items table with category = 'material'
      let sql = `SELECT * FROM items WHERE category = 'material'`;
      const params = [];
      let idx = 1;

      if (tier) {
        sql += ` AND tier = $${idx++}`;
        params.push(parseInt(tier));
      }
      if (category) {
        sql += ` AND sub_type = $${idx++}`;
        params.push(category);
      }

      sql += ' ORDER BY tier, name';
      const result = await suiteQuery(sql, params);

      res.json({
        success: true,
        materials: result.rows,
        count: result.rows.length,
        tierCosts: TIER_COSTS,
      });
    } catch (err) {
      console.error('[Crafting] Materials fetch error:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // ────────────────────────────────────────────
  // INVENTORY & RESOURCES
  // ────────────────────────────────────────────

  /**
   * GET /api/crafting/inventory/:grudgeId
   * Get account-wide inventory (items + resources + currency)
   */
  app.get('/api/crafting/inventory/:grudgeId', requireAuth, requireSuiteDb, async (req, res) => {
    try {
      const { grudgeId } = req.params;
      const account = await resolveAccountByGrudgeId(grudgeId);
      if (!account) return res.status(404).json({ error: 'Account not found' });

      // Fetch account inventory (crafted items, equipment)
      const invResult = await suiteQuery(
        `SELECT * FROM account_inventory WHERE account_id = $1`,
        [account.id]
      );

      // Fetch account resources (harvested materials)
      const resResult = await suiteQuery(
        `SELECT * FROM account_resources WHERE account_id = $1`,
        [account.id]
      );

      // Fetch characters for this account
      const charResult = await suiteQuery(
        `SELECT id, name, class_id, level, gold, equipment,
                profession_progression
         FROM characters WHERE account_id = $1 ORDER BY slot_index`,
        [account.id]
      );

      res.json({
        success: true,
        inventory: invResult.rows.map(item => ({
          id: item.id,
          itemId: item.item_id,
          quantity: item.quantity,
          tier: item.tier,
          quality: item.quality,
          boundToCharacterId: item.bound_to_character_id,
          metadata: item.metadata,
          createdAt: item.created_at,
        })),
        resources: resResult.rows.map(r => ({
          id: r.id,
          resourceType: r.resource_type,
          tier: r.tier,
          quantity: r.quantity,
          updatedAt: r.updated_at,
        })),
        currency: {
          gold: account.gold || 0,
          gbux: account.gbux_balance || 0,
          accountXp: account.account_xp || 0,
        },
        characters: charResult.rows.map(c => ({
          id: c.id,
          name: c.name,
          classId: c.class_id,
          level: c.level,
          gold: c.gold,
          equipment: c.equipment,
          professionProgression: c.profession_progression,
        })),
      });
    } catch (err) {
      console.error('[Crafting] Inventory fetch error:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // ────────────────────────────────────────────
  // CRAFTING JOBS
  // ────────────────────────────────────────────

  /**
   * POST /api/crafting/craft
   * Submit a crafting job.
   * Body: { grudgeId, characterId, recipeId, quantity, tier }
   */
  app.post('/api/crafting/craft', requireAuth, requireSuiteDb, async (req, res) => {
    const client = await getSuiteClient();
    try {
      const { grudgeId, characterId, recipeId, quantity = 1, tier = 1 } = req.body;
      if (!grudgeId || !characterId || !recipeId) {
        return res.status(400).json({ error: 'grudgeId, characterId, recipeId required' });
      }

      const account = await resolveAccountByGrudgeId(grudgeId);
      if (!account) return res.status(404).json({ error: 'Account not found' });

      // Verify character belongs to account
      const charCheck = await client.query(
        'SELECT id, name FROM characters WHERE id = $1 AND account_id = $2',
        [characterId, account.id]
      );
      if (!charCheck.rows[0]) return res.status(403).json({ error: 'Character not owned by this account' });

      await client.query('BEGIN');

      // Fetch recipe from suite DB
      const recipeResult = await client.query(
        'SELECT * FROM recipes WHERE id = $1',
        [recipeId]
      );
      const recipe = recipeResult.rows[0];
      if (!recipe) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Recipe not found' });
      }

      // Check & deduct ingredients from account_resources
      const ingredients = recipe.ingredients || [];
      for (const ing of ingredients) {
        const needed = (ing.quantity || 1) * quantity;
        const resCheck = await client.query(
          `SELECT id, quantity FROM account_resources
           WHERE account_id = $1 AND resource_type = $2`,
          [account.id, ing.itemId]
        );
        const available = resCheck.rows[0]?.quantity || 0;
        if (available < needed) {
          await client.query('ROLLBACK');
          return res.status(400).json({
            error: `Not enough ${ing.itemId}: need ${needed}, have ${available}`,
          });
        }
        // Deduct
        await client.query(
          `UPDATE account_resources SET quantity = quantity - $1, updated_at = NOW()
           WHERE account_id = $2 AND resource_type = $3`,
          [needed, account.id, ing.itemId]
        );
      }

      // Deduct gold cost
      const goldCost = (TIER_COSTS[tier]?.gold || 100) * quantity;
      const goldCheck = await client.query(
        'SELECT gold FROM accounts WHERE id = $1',
        [account.id]
      );
      if ((goldCheck.rows[0]?.gold || 0) < goldCost) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Not enough gold: need ${goldCost}` });
      }
      await client.query(
        'UPDATE accounts SET gold = gold - $1 WHERE id = $2',
        [goldCost, account.id]
      );

      // Calculate craft duration (seconds)
      const baseDuration = recipe.craft_time || 30;
      const duration = baseDuration * quantity;
      const completesAt = new Date(Date.now() + duration * 1000);

      // Insert crafting job
      const jobResult = await client.query(
        `INSERT INTO crafting_jobs
         (character_id, recipe_id, quantity, duration, completes_at, status, profession, tier)
         VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7)
         RETURNING *`,
        [characterId, recipeId, quantity, duration, completesAt, recipe.profession, tier]
      );

      await client.query('COMMIT');

      const job = jobResult.rows[0];
      res.json({
        success: true,
        job: {
          id: job.id,
          recipeId: job.recipe_id,
          quantity: job.quantity,
          duration: job.duration,
          completesAt: job.completes_at,
          status: job.status,
          profession: job.profession,
          tier: job.tier,
        },
        goldSpent: goldCost,
      });
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      console.error('[Crafting] Craft error:', err.message);
      res.status(500).json({ error: err.message });
    } finally {
      client.release();
    }
  });

  /**
   * POST /api/crafting/craft/claim
   * Claim a completed crafting job.
   * Body: { grudgeId, jobId }
   */
  app.post('/api/crafting/craft/claim', requireAuth, requireSuiteDb, async (req, res) => {
    const client = await getSuiteClient();
    try {
      const { grudgeId, jobId } = req.body;
      if (!grudgeId || !jobId) return res.status(400).json({ error: 'grudgeId, jobId required' });

      const account = await resolveAccountByGrudgeId(grudgeId);
      if (!account) return res.status(404).json({ error: 'Account not found' });

      await client.query('BEGIN');

      // Fetch job
      const jobResult = await client.query(
        `SELECT cj.*, c.account_id
         FROM crafting_jobs cj
         JOIN characters c ON c.id = cj.character_id
         WHERE cj.id = $1`,
        [jobId]
      );
      const job = jobResult.rows[0];
      if (!job) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Crafting job not found' });
      }
      if (job.account_id !== account.id) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: 'Job not owned by this account' });
      }
      if (job.status === 'claimed') {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Job already claimed' });
      }
      if (new Date(job.completes_at) > new Date()) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: 'Job not yet complete',
          completesAt: job.completes_at,
        });
      }

      // Fetch recipe to get outputs
      const recipeResult = await client.query('SELECT * FROM recipes WHERE id = $1', [job.recipe_id]);
      const recipe = recipeResult.rows[0];
      const outputs = recipe?.outputs || [];

      // Add crafted items to account_inventory
      const addedItems = [];
      for (const output of outputs) {
        const qty = (output.quantity || 1) * job.quantity;
        // Upsert into account_inventory
        const existing = await client.query(
          `SELECT id, quantity FROM account_inventory
           WHERE account_id = $1 AND item_id = $2 AND tier = $3`,
          [account.id, output.itemId, job.tier || 1]
        );
        if (existing.rows[0]) {
          await client.query(
            `UPDATE account_inventory SET quantity = quantity + $1,
             updated_at = extract(epoch from now()) * 1000
             WHERE id = $2`,
            [qty, existing.rows[0].id]
          );
        } else {
          await client.query(
            `INSERT INTO account_inventory (account_id, item_id, quantity, tier, quality, metadata)
             VALUES ($1, $2, $3, $4, 'normal', $5)`,
            [account.id, output.itemId, qty, job.tier || 1,
             JSON.stringify({ craftedBy: job.character_id, sourceApp: 'gruda-wars' })]
          );
        }
        addedItems.push({ itemId: output.itemId, quantity: qty, tier: job.tier || 1 });
      }

      // Update recipe progression (times_crafted, recipe_xp)
      const xpGain = 25 * (job.tier || 1) * job.quantity;
      await client.query(
        `UPDATE unlocked_recipes
         SET times_crafted = times_crafted + $1,
             recipe_xp = recipe_xp + $2
         WHERE character_id = $3 AND recipe_id = $4`,
        [job.quantity, xpGain, job.character_id, job.recipe_id]
      );

      // Mark job as claimed
      await client.query(
        `UPDATE crafting_jobs SET status = 'claimed', claimed_at = NOW() WHERE id = $1`,
        [jobId]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        claimed: addedItems,
        recipeXpGained: xpGain,
      });
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      console.error('[Crafting] Claim error:', err.message);
      res.status(500).json({ error: err.message });
    } finally {
      client.release();
    }
  });

  /**
   * GET /api/crafting/jobs/:grudgeId
   * Get active/pending crafting jobs for the account.
   */
  app.get('/api/crafting/jobs/:grudgeId', requireAuth, requireSuiteDb, async (req, res) => {
    try {
      const { grudgeId } = req.params;
      const account = await resolveAccountByGrudgeId(grudgeId);
      if (!account) return res.status(404).json({ error: 'Account not found' });

      const result = await suiteQuery(
        `SELECT cj.*, c.name as character_name
         FROM crafting_jobs cj
         JOIN characters c ON c.id = cj.character_id
         WHERE c.account_id = $1 AND cj.status != 'claimed'
         ORDER BY cj.completes_at`,
        [account.id]
      );

      res.json({
        success: true,
        jobs: result.rows.map(j => ({
          id: j.id,
          characterId: j.character_id,
          characterName: j.character_name,
          recipeId: j.recipe_id,
          quantity: j.quantity,
          duration: j.duration,
          startedAt: j.started_at,
          completesAt: j.completes_at,
          status: j.status,
          profession: j.profession,
          tier: j.tier,
          isReady: new Date(j.completes_at) <= new Date(),
        })),
      });
    } catch (err) {
      console.error('[Crafting] Jobs fetch error:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // ────────────────────────────────────────────
  // HARVESTING
  // ────────────────────────────────────────────

  /**
   * POST /api/crafting/harvest
   * Record a harvest event and add resources to account.
   * Body: { grudgeId, characterId, materialId, quantity, tier, profession, nodeType }
   */
  app.post('/api/crafting/harvest', requireAuth, requireSuiteDb, async (req, res) => {
    const client = await getSuiteClient();
    try {
      const { grudgeId, characterId, materialId, quantity = 1, tier = 1, profession, nodeType } = req.body;
      if (!grudgeId || !characterId || !materialId || !profession) {
        return res.status(400).json({ error: 'grudgeId, characterId, materialId, profession required' });
      }

      const account = await resolveAccountByGrudgeId(grudgeId);
      if (!account) return res.status(404).json({ error: 'Account not found' });

      await client.query('BEGIN');

      // Upsert resource into account_resources
      const existing = await client.query(
        `SELECT id, quantity FROM account_resources
         WHERE account_id = $1 AND resource_type = $2 AND tier = $3`,
        [account.id, materialId, tier]
      );

      if (existing.rows[0]) {
        await client.query(
          `UPDATE account_resources SET quantity = quantity + $1, updated_at = NOW()
           WHERE id = $2`,
          [quantity, existing.rows[0].id]
        );
      } else {
        await client.query(
          `INSERT INTO account_resources (account_id, grudge_id, resource_type, tier, quantity)
           VALUES ($1, $2, $3, $4, $5)`,
          [account.id, grudgeId, materialId, tier, quantity]
        );
      }

      // Calculate profession XP gained
      const baseXp = 10 * tier;
      const profXpGained = baseXp * quantity;

      // Update character profession progression
      const profKey = `prof_${profession.toLowerCase()}_xp`;
      const profLevelKey = `prof_${profession.toLowerCase()}_level`;
      await client.query(
        `UPDATE characters
         SET ${profKey} = ${profKey} + $1,
             updated_at = NOW()
         WHERE id = $2 AND account_id = $3`,
        [profXpGained, characterId, account.id]
      );

      // Log the harvest event
      await client.query(
        `INSERT INTO harvest_log
         (account_id, character_id, grudge_id, node_type, material_id, tier, quantity, profession_xp_gained, profession)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [account.id, characterId, grudgeId, nodeType || profession.toLowerCase(),
         materialId, tier, quantity, profXpGained, profession]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        materialId,
        quantity,
        tier,
        professionXpGained: profXpGained,
        newTotal: (existing.rows[0]?.quantity || 0) + quantity,
      });
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      console.error('[Crafting] Harvest error:', err.message);
      res.status(500).json({ error: err.message });
    } finally {
      client.release();
    }
  });

  // ────────────────────────────────────────────
  // PROFESSIONS
  // ────────────────────────────────────────────

  /**
   * GET /api/crafting/professions/:grudgeId
   * Get profession progression for all characters on the account.
   */
  app.get('/api/crafting/professions/:grudgeId', requireAuth, requireSuiteDb, async (req, res) => {
    try {
      const { grudgeId } = req.params;
      const account = await resolveAccountByGrudgeId(grudgeId);
      if (!account) return res.status(404).json({ error: 'Account not found' });

      const result = await suiteQuery(
        `SELECT id, name, class_id, level,
                prof_miner_level, prof_miner_xp, prof_miner_points_spent,
                prof_forester_level, prof_forester_xp, prof_forester_points_spent,
                prof_mystic_level, prof_mystic_xp, prof_mystic_points_spent,
                prof_chef_level, prof_chef_xp, prof_chef_points_spent,
                prof_engineer_level, prof_engineer_xp, prof_engineer_points_spent,
                profession_progression
         FROM characters WHERE account_id = $1 ORDER BY slot_index`,
        [account.id]
      );

      res.json({
        success: true,
        characters: result.rows.map(c => ({
          id: c.id,
          name: c.name,
          classId: c.class_id,
          level: c.level,
          professions: {
            Miner: { level: c.prof_miner_level, xp: c.prof_miner_xp, pointsSpent: c.prof_miner_points_spent },
            Forester: { level: c.prof_forester_level, xp: c.prof_forester_xp, pointsSpent: c.prof_forester_points_spent },
            Mystic: { level: c.prof_mystic_level, xp: c.prof_mystic_xp, pointsSpent: c.prof_mystic_points_spent },
            Chef: { level: c.prof_chef_level, xp: c.prof_chef_xp, pointsSpent: c.prof_chef_points_spent },
            Engineer: { level: c.prof_engineer_level, xp: c.prof_engineer_xp, pointsSpent: c.prof_engineer_points_spent },
          },
        })),
      });
    } catch (err) {
      console.error('[Crafting] Professions fetch error:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * POST /api/crafting/professions/:characterId/xp
   * Add profession XP to a character.
   * Body: { grudgeId, profession, xpAmount }
   */
  app.post('/api/crafting/professions/:characterId/xp', requireAuth, requireSuiteDb, async (req, res) => {
    try {
      const { characterId } = req.params;
      const { grudgeId, profession, xpAmount } = req.body;

      if (!grudgeId || !profession || !xpAmount) {
        return res.status(400).json({ error: 'grudgeId, profession, xpAmount required' });
      }
      if (!PROFESSIONS.includes(profession)) {
        return res.status(400).json({ error: `Invalid profession: ${profession}` });
      }

      const account = await resolveAccountByGrudgeId(grudgeId);
      if (!account) return res.status(404).json({ error: 'Account not found' });

      const profXpCol = `prof_${profession.toLowerCase()}_xp`;
      const profLevelCol = `prof_${profession.toLowerCase()}_level`;

      // Fetch current XP
      const current = await suiteQuery(
        `SELECT ${profXpCol} as xp, ${profLevelCol} as level
         FROM characters WHERE id = $1 AND account_id = $2`,
        [characterId, account.id]
      );
      if (!current.rows[0]) return res.status(404).json({ error: 'Character not found' });

      const currentXp = current.rows[0].xp || 0;
      const newXp = currentXp + xpAmount;

      // Simple level calculation: level = floor(sqrt(xp / 100)) + 1, cap at 100
      const newLevel = Math.min(100, Math.floor(Math.sqrt(newXp / 100)) + 1);

      await suiteQuery(
        `UPDATE characters SET ${profXpCol} = $1, ${profLevelCol} = $2, updated_at = NOW()
         WHERE id = $3 AND account_id = $4`,
        [newXp, newLevel, characterId, account.id]
      );

      res.json({
        success: true,
        profession,
        previousXp: currentXp,
        newXp,
        previousLevel: current.rows[0].level,
        newLevel,
        leveledUp: newLevel > current.rows[0].level,
      });
    } catch (err) {
      console.error('[Crafting] Profession XP error:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // ────────────────────────────────────────────
  // HOME ISLAND BATCH HARVEST
  // ────────────────────────────────────────────

  /**
   * POST /api/crafting/island/tick
   * Batch-record harvests from home island heroes.
   * Body: { grudgeId, harvests: [{ characterId, buildingType, materialId, quantity, tier, profession }] }
   */
  app.post('/api/crafting/island/tick', requireAuth, requireSuiteDb, async (req, res) => {
    const client = await getSuiteClient();
    try {
      const { grudgeId, harvests } = req.body;
      if (!grudgeId || !harvests || !Array.isArray(harvests) || harvests.length === 0) {
        return res.status(400).json({ error: 'grudgeId and non-empty harvests array required' });
      }

      const account = await resolveAccountByGrudgeId(grudgeId);
      if (!account) return res.status(404).json({ error: 'Account not found' });

      await client.query('BEGIN');

      const results = [];
      for (const h of harvests) {
        const { characterId, buildingType, materialId, quantity = 1, tier = 1, profession } = h;
        if (!characterId || !materialId || !profession) continue;
        if (!PROFESSIONS.includes(profession)) continue;

        // Upsert resource
        const existing = await client.query(
          `SELECT id, quantity FROM account_resources
           WHERE account_id = $1 AND resource_type = $2 AND tier = $3`,
          [account.id, materialId, tier]
        );

        if (existing.rows[0]) {
          await client.query(
            `UPDATE account_resources SET quantity = quantity + $1, updated_at = NOW() WHERE id = $2`,
            [quantity, existing.rows[0].id]
          );
        } else {
          await client.query(
            `INSERT INTO account_resources (account_id, grudge_id, resource_type, tier, quantity)
             VALUES ($1, $2, $3, $4, $5)`,
            [account.id, grudgeId, materialId, tier, quantity]
          );
        }

        // Profession XP
        const baseXp = 10 * tier;
        const profXpGained = baseXp * quantity;
        const profXpCol = `prof_${profession.toLowerCase()}_xp`;
        await client.query(
          `UPDATE characters SET ${profXpCol} = ${profXpCol} + $1, updated_at = NOW()
           WHERE id = $2 AND account_id = $3`,
          [profXpGained, characterId, account.id]
        );

        // Log
        await client.query(
          `INSERT INTO harvest_log
           (account_id, character_id, grudge_id, node_type, material_id, tier, quantity, profession_xp_gained, profession)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [account.id, characterId, grudgeId, buildingType || 'island',
           materialId, tier, quantity, profXpGained, profession]
        );

        results.push({ characterId, materialId, quantity, profXpGained });
      }

      await client.query('COMMIT');
      res.json({ success: true, processed: results.length, results });
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      console.error('[Crafting] Island tick error:', err.message);
      res.status(500).json({ error: err.message });
    } finally {
      client.release();
    }
  });

  // ────────────────────────────────────────────
  // SUITE DB STATUS
  // ────────────────────────────────────────────

  app.get('/api/crafting/status', requireAuth, async (req, res) => {
    try {
      if (!isConnected()) {
        return res.json({ connected: false, hint: 'DATABASE_URL not set' });
      }
      const result = await suiteQuery('SELECT NOW() as time');
      const tables = await suiteQuery(`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' ORDER BY table_name
      `);
      res.json({
        connected: true,
        time: result.rows[0].time,
        tables: tables.rows.map(r => r.table_name),
      });
    } catch (err) {
      res.status(500).json({ connected: false, error: err.message });
    }
  });
}
