import { query, getClient } from './db.js';
import { suiteQuery, isConnected as isSuiteConnected } from './suiteDb.js';

export function registerDbRoutes(app) {
  const ADMIN_TOKEN = process.env.GAME_API_GRUDA;

  function requireAuth(req, res, next) {
    const token = req.headers['x-api-key'] || req.query.token;
    if (!token || token !== ADMIN_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  }

  app.get('/api/db/status', requireAuth, async (req, res) => {
    try {
      const result = await query('SELECT NOW() as time');
      const tables = await query(`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' ORDER BY table_name
      `);
      res.json({ connected: true, time: result.rows[0].time, tables: tables.rows.map(r => r.table_name) });
    } catch (err) {
      res.status(500).json({ connected: false, error: err.message });
    }
  });

  app.post('/api/db/accounts', requireAuth, async (req, res) => {
    try {
      const { discord_id, username, email, avatar_url } = req.body;
      if (!username) return res.status(400).json({ error: 'username required' });
      const result = await query(
        `INSERT INTO accounts (discord_id, username, email, avatar_url)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (discord_id) DO UPDATE SET
           username = EXCLUDED.username,
           email = EXCLUDED.email,
           avatar_url = EXCLUDED.avatar_url,
           updated_at = NOW(),
           last_login = NOW()
         RETURNING *`,
        [discord_id, username, email, avatar_url]
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/db/accounts', requireAuth, async (req, res) => {
    try {
      const { discord_id, id } = req.query;
      if (discord_id) {
        const result = await query('SELECT * FROM accounts WHERE discord_id = $1', [discord_id]);
        return res.json(result.rows[0] || null);
      }
      if (id) {
        const result = await query('SELECT * FROM accounts WHERE id = $1', [parseInt(id)]);
        return res.json(result.rows[0] || null);
      }
      const result = await query('SELECT * FROM accounts ORDER BY created_at DESC LIMIT 100');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/db/accounts/:id', requireAuth, async (req, res) => {
    try {
      const { gold, resources, premium, username } = req.body;
      const sets = [];
      const vals = [];
      let idx = 1;
      if (gold !== undefined) { sets.push(`gold = $${idx++}`); vals.push(gold); }
      if (resources !== undefined) { sets.push(`resources = $${idx++}`); vals.push(resources); }
      if (premium !== undefined) { sets.push(`premium = $${idx++}`); vals.push(premium); }
      if (username !== undefined) { sets.push(`username = $${idx++}`); vals.push(username); }
      if (sets.length === 0) return res.status(400).json({ error: 'No fields to update' });
      sets.push(`updated_at = NOW()`);
      vals.push(parseInt(req.params.id));
      const result = await query(
        `UPDATE accounts SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
        vals
      );
      res.json(result.rows[0] || null);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/db/characters', requireAuth, async (req, res) => {
    try {
      const { account_id, name, race_id, class_id, level, attribute_points, abilities, skill_tree } = req.body;
      if (!account_id || !name || !race_id || !class_id) {
        return res.status(400).json({ error: 'account_id, name, race_id, class_id required' });
      }
      const result = await query(
        `INSERT INTO characters (account_id, name, race_id, class_id, level, attribute_points, abilities, skill_tree)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [account_id, name, race_id, class_id, level || 1,
         JSON.stringify(attribute_points || {}),
         JSON.stringify(abilities || []),
         JSON.stringify(skill_tree || {})]
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/db/characters', requireAuth, async (req, res) => {
    try {
      const { account_id, id } = req.query;
      if (id) {
        const result = await query('SELECT * FROM characters WHERE id = $1', [parseInt(id)]);
        return res.json(result.rows[0] || null);
      }
      if (account_id) {
        const result = await query('SELECT * FROM characters WHERE account_id = $1 ORDER BY slot_index', [parseInt(account_id)]);
        return res.json(result.rows);
      }
      const result = await query('SELECT * FROM characters ORDER BY created_at DESC LIMIT 100');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/db/characters/:id', requireAuth, async (req, res) => {
    try {
      const fields = ['name', 'level', 'experience', 'attribute_points', 'abilities',
        'skill_tree', 'status_effects', 'current_health', 'current_mana',
        'current_stamina', 'is_active', 'slot_index'];
      const jsonFields = ['attribute_points', 'abilities', 'skill_tree', 'status_effects'];
      const sets = [];
      const vals = [];
      let idx = 1;
      for (const f of fields) {
        if (req.body[f] !== undefined) {
          sets.push(`${f} = $${idx++}`);
          vals.push(jsonFields.includes(f) ? JSON.stringify(req.body[f]) : req.body[f]);
        }
      }
      if (sets.length === 0) return res.status(400).json({ error: 'No fields to update' });
      sets.push(`updated_at = NOW()`);
      vals.push(parseInt(req.params.id));
      const result = await query(
        `UPDATE characters SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
        vals
      );
      res.json(result.rows[0] || null);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/db/characters/:id', requireAuth, async (req, res) => {
    try {
      await query('DELETE FROM characters WHERE id = $1', [parseInt(req.params.id)]);
      res.json({ deleted: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/db/inventory', requireAuth, async (req, res) => {
    try {
      const { character_id, item_key, item_type, tier, slot, stats, equipped, quantity } = req.body;
      if (!character_id || !item_key || !item_type) {
        return res.status(400).json({ error: 'character_id, item_key, item_type required' });
      }
      const result = await query(
        `INSERT INTO inventory_items (character_id, item_key, item_type, tier, slot, stats, equipped, quantity)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [character_id, item_key, item_type, tier || 1, slot, JSON.stringify(stats || {}), equipped || false, quantity || 1]
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/db/inventory', requireAuth, async (req, res) => {
    try {
      const { character_id } = req.query;
      if (!character_id) return res.status(400).json({ error: 'character_id required' });
      const result = await query(
        'SELECT * FROM inventory_items WHERE character_id = $1 ORDER BY created_at',
        [parseInt(character_id)]
      );
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/db/inventory/:id', requireAuth, async (req, res) => {
    try {
      const fields = ['equipped', 'quantity', 'stats', 'tier', 'slot'];
      const jsonFields = ['stats'];
      const sets = [];
      const vals = [];
      let idx = 1;
      for (const f of fields) {
        if (req.body[f] !== undefined) {
          sets.push(`${f} = $${idx++}`);
          vals.push(jsonFields.includes(f) ? JSON.stringify(req.body[f]) : req.body[f]);
        }
      }
      if (sets.length === 0) return res.status(400).json({ error: 'No fields to update' });
      vals.push(parseInt(req.params.id));
      const result = await query(
        `UPDATE inventory_items SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
        vals
      );
      res.json(result.rows[0] || null);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/db/inventory/:id', requireAuth, async (req, res) => {
    try {
      await query('DELETE FROM inventory_items WHERE id = $1', [parseInt(req.params.id)]);
      res.json({ deleted: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/db/crafted', requireAuth, async (req, res) => {
    try {
      const { character_id, item_key, item_type, tier, base_item_key, enchantments, stats } = req.body;
      if (!character_id || !item_key || !item_type) {
        return res.status(400).json({ error: 'character_id, item_key, item_type required' });
      }
      const result = await query(
        `INSERT INTO crafted_items (character_id, item_key, item_type, tier, base_item_key, enchantments, stats)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [character_id, item_key, item_type, tier || 1, base_item_key,
         JSON.stringify(enchantments || []), JSON.stringify(stats || {})]
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/db/crafted', requireAuth, async (req, res) => {
    try {
      const { character_id } = req.query;
      if (!character_id) return res.status(400).json({ error: 'character_id required' });
      const result = await query(
        'SELECT * FROM crafted_items WHERE character_id = $1 ORDER BY created_at',
        [parseInt(character_id)]
      );
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/db/crafted/:id', requireAuth, async (req, res) => {
    try {
      await query('DELETE FROM crafted_items WHERE id = $1', [parseInt(req.params.id)]);
      res.json({ deleted: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/db/islands', requireAuth, async (req, res) => {
    try {
      const { account_id, name, zone_data, conquer_progress, quest_progress, unlocked_locations, harvest_state } = req.body;
      if (!account_id || !name) return res.status(400).json({ error: 'account_id, name required' });
      const result = await query(
        `INSERT INTO islands (account_id, name, zone_data, conquer_progress, quest_progress, unlocked_locations, harvest_state)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [account_id, name, JSON.stringify(zone_data || {}), JSON.stringify(conquer_progress || {}),
         JSON.stringify(quest_progress || {}), JSON.stringify(unlocked_locations || []),
         JSON.stringify(harvest_state || {})]
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/db/islands', requireAuth, async (req, res) => {
    try {
      const { account_id, id } = req.query;
      if (id) {
        const result = await query('SELECT * FROM islands WHERE id = $1', [parseInt(id)]);
        return res.json(result.rows[0] || null);
      }
      if (account_id) {
        const result = await query('SELECT * FROM islands WHERE account_id = $1 ORDER BY created_at', [parseInt(account_id)]);
        return res.json(result.rows);
      }
      const result = await query('SELECT * FROM islands ORDER BY created_at DESC LIMIT 100');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/db/islands/:id', requireAuth, async (req, res) => {
    try {
      const fields = ['name', 'zone_data', 'conquer_progress', 'quest_progress', 'unlocked_locations', 'harvest_state'];
      const jsonFields = ['zone_data', 'conquer_progress', 'quest_progress', 'unlocked_locations', 'harvest_state'];
      const sets = [];
      const vals = [];
      let idx = 1;
      for (const f of fields) {
        if (req.body[f] !== undefined) {
          sets.push(`${f} = $${idx++}`);
          vals.push(jsonFields.includes(f) ? JSON.stringify(req.body[f]) : req.body[f]);
        }
      }
      if (sets.length === 0) return res.status(400).json({ error: 'No fields to update' });
      sets.push(`updated_at = NOW()`);
      vals.push(parseInt(req.params.id));
      const result = await query(
        `UPDATE islands SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
        vals
      );
      res.json(result.rows[0] || null);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/db/save-game', requireAuth, async (req, res) => {
    const client = await getClient();
    try {
      await client.query('BEGIN');
      const { discord_id, username, email, avatar_url, gold, resources, heroes, island } = req.body;
      if (!discord_id || !username) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'discord_id, username required' });
      }

      const accountResult = await client.query(
        `INSERT INTO accounts (discord_id, username, email, avatar_url, gold, resources)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (discord_id) DO UPDATE SET
           username = EXCLUDED.username, email = EXCLUDED.email,
           avatar_url = EXCLUDED.avatar_url, gold = EXCLUDED.gold,
           resources = EXCLUDED.resources, updated_at = NOW(), last_login = NOW()
         RETURNING *`,
        [discord_id, username, email, avatar_url, gold || 0, resources || 0]
      );
      const account = accountResult.rows[0];

      if (heroes && Array.isArray(heroes)) {
        await client.query('DELETE FROM characters WHERE account_id = $1', [account.id]);
        for (let i = 0; i < heroes.length; i++) {
          const h = heroes[i];
          const charResult = await client.query(
            `INSERT INTO characters (account_id, name, race_id, class_id, level, experience,
              attribute_points, abilities, skill_tree, status_effects,
              current_health, current_mana, current_stamina, is_active, slot_index)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id`,
            [account.id, h.name, h.raceId || h.race_id, h.classId || h.class_id,
             h.level || 1, h.experience || 0,
             JSON.stringify(h.attributePoints || h.attribute_points || {}),
             JSON.stringify(h.abilities || []),
             JSON.stringify(h.skillTree || h.skill_tree || {}),
             JSON.stringify(h.statusEffects || h.status_effects || []),
             h.currentHealth ?? h.current_health ?? null,
             h.currentMana ?? h.current_mana ?? null,
             h.currentStamina ?? h.current_stamina ?? null,
             h.isActive !== undefined ? h.isActive : true, i]
          );

          const charId = charResult.rows[0].id;
          if (h.inventory && Array.isArray(h.inventory)) {
            for (const item of h.inventory) {
              await client.query(
                `INSERT INTO inventory_items (character_id, item_key, item_type, tier, slot, stats, equipped, quantity)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
                [charId, item.itemKey || item.item_key, item.itemType || item.item_type || 'equipment',
                 item.tier || 1, item.slot, JSON.stringify(item.stats || {}),
                 item.equipped || false, item.quantity || 1]
              );
            }
          }
          if (h.craftedItems && Array.isArray(h.craftedItems)) {
            for (const ci of h.craftedItems) {
              await client.query(
                `INSERT INTO crafted_items (character_id, item_key, item_type, tier, base_item_key, enchantments, stats)
                 VALUES ($1,$2,$3,$4,$5,$6,$7)`,
                [charId, ci.itemKey || ci.item_key, ci.itemType || ci.item_type || 'crafted',
                 ci.tier || 1, ci.baseItemKey || ci.base_item_key || null,
                 JSON.stringify(ci.enchantments || []), JSON.stringify(ci.stats || {})]
              );
            }
          }
        }
      }

      if (island) {
        await client.query('DELETE FROM islands WHERE account_id = $1', [account.id]);
        await client.query(
          `INSERT INTO islands (account_id, name, zone_data, conquer_progress, quest_progress, unlocked_locations, harvest_state)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [account.id, island.name || 'Main Island',
           JSON.stringify(island.zoneData || island.zone_data || {}),
           JSON.stringify(island.conquerProgress || island.conquer_progress || {}),
           JSON.stringify(island.questProgress || island.quest_progress || {}),
           JSON.stringify(island.unlockedLocations || island.unlocked_locations || []),
           JSON.stringify(island.harvestState || island.harvest_state || {})]
        );
      }

      await client.query('COMMIT');

      // ── Best-effort sync to Warlord-Crafting-Suite DB ──
      let suiteSynced = false;
      if (isSuiteConnected()) {
        try {
          // Find matching account in suite DB by discord_id
          const suiteAcct = await suiteQuery(
            `SELECT id, grudge_id FROM accounts WHERE discord_id = $1`, [discord_id]
          );
          if (suiteAcct.rows[0]) {
            const suiteId = suiteAcct.rows[0].id;
            // Sync gold, account_xp, and last_login
            await suiteQuery(
              `UPDATE accounts SET gold = $1, updated_at = NOW() WHERE id = $2`,
              [gold || 0, suiteId]
            );
            suiteSynced = true;
          }
        } catch (suiteErr) {
          console.warn('[SaveGame] Suite DB sync failed (non-fatal):', suiteErr.message);
        }
      }

      res.json({ success: true, account_id: account.id, suiteSynced });
    } catch (err) {
      await client.query('ROLLBACK');
      res.status(500).json({ error: err.message });
    } finally {
      client.release();
    }
  });

  function toCamelChar(row) {
    if (!row) return null;
    return {
      id: row.id,
      accountId: row.account_id,
      name: row.name,
      raceId: row.race_id,
      classId: row.class_id,
      level: row.level,
      experience: row.experience,
      attributePoints: row.attribute_points || {},
      abilities: row.abilities || [],
      skillTree: row.skill_tree || {},
      statusEffects: row.status_effects || [],
      currentHealth: row.current_health,
      currentMana: row.current_mana,
      currentStamina: row.current_stamina,
      isActive: row.is_active,
      slotIndex: row.slot_index,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  function toCamelItem(row) {
    if (!row) return null;
    return {
      id: row.id,
      characterId: row.character_id,
      itemKey: row.item_key,
      itemType: row.item_type,
      tier: row.tier,
      slot: row.slot,
      stats: row.stats || {},
      equipped: row.equipped,
      quantity: row.quantity,
    };
  }

  function toCamelCrafted(row) {
    if (!row) return null;
    return {
      id: row.id,
      characterId: row.character_id,
      itemKey: row.item_key,
      itemType: row.item_type,
      tier: row.tier,
      baseItemKey: row.base_item_key,
      enchantments: row.enchantments || [],
      stats: row.stats || {},
    };
  }

  function toCamelIsland(row) {
    if (!row) return null;
    return {
      id: row.id,
      accountId: row.account_id,
      name: row.name,
      zoneData: row.zone_data || {},
      conquerProgress: row.conquer_progress || {},
      questProgress: row.quest_progress || {},
      unlockedLocations: row.unlocked_locations || [],
      harvestState: row.harvest_state || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  app.get('/api/db/load-game', requireAuth, async (req, res) => {
    try {
      const { discord_id } = req.query;
      if (!discord_id) return res.status(400).json({ error: 'discord_id required' });

      const accountResult = await query('SELECT * FROM accounts WHERE discord_id = $1', [discord_id]);
      if (!accountResult.rows[0]) return res.json({ found: false });
      const account = accountResult.rows[0];

      const charsResult = await query('SELECT * FROM characters WHERE account_id = $1 ORDER BY slot_index', [account.id]);
      const heroes = [];
      for (const c of charsResult.rows) {
        const invResult = await query('SELECT * FROM inventory_items WHERE character_id = $1', [c.id]);
        const craftResult = await query('SELECT * FROM crafted_items WHERE character_id = $1', [c.id]);
        heroes.push({
          ...toCamelChar(c),
          inventory: invResult.rows.map(toCamelItem),
          craftedItems: craftResult.rows.map(toCamelCrafted),
        });
      }

      const islandResult = await query('SELECT * FROM islands WHERE account_id = $1 LIMIT 1', [account.id]);

      // ── Best-effort fetch from Warlord-Crafting-Suite DB ──
      let suiteData = null;
      if (isSuiteConnected()) {
        try {
          const suiteAcct = await suiteQuery(
            `SELECT id, grudge_id, gold, gbux, account_xp FROM accounts WHERE discord_id = $1`, [discord_id]
          );
          if (suiteAcct.rows[0]) {
            const sa = suiteAcct.rows[0];
            const suiteRes = await suiteQuery(
              `SELECT resource_type, tier, quantity FROM account_resources WHERE account_id = $1`, [sa.id]
            );
            const suiteInv = await suiteQuery(
              `SELECT item_id, quantity, tier, quality, metadata FROM account_inventory WHERE account_id = $1`, [sa.id]
            );
            suiteData = {
              linked: true,
              accountId: sa.id,
              grudgeId: sa.grudge_id,
              gold: sa.gold,
              gbux: sa.gbux,
              accountXp: sa.account_xp,
              resources: suiteRes.rows.map(r => ({ resourceType: r.resource_type, tier: r.tier, quantity: r.quantity })),
              inventory: suiteInv.rows.map(r => ({ itemId: r.item_id, quantity: r.quantity, tier: r.tier, quality: r.quality, metadata: r.metadata })),
            };
          }
        } catch (suiteErr) {
          console.warn('[LoadGame] Suite DB fetch failed (non-fatal):', suiteErr.message);
        }
      }

      res.json({
        found: true,
        account: {
          id: account.id,
          discordId: account.discord_id,
          username: account.username,
          email: account.email,
          avatarUrl: account.avatar_url,
          gold: account.gold,
          resources: account.resources,
          premium: account.premium,
          lastLogin: account.last_login,
        },
        heroes,
        island: toCamelIsland(islandResult.rows[0]),
        suite: suiteData,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
}
