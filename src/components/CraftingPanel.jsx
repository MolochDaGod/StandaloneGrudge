import React, { useState, useEffect, useCallback } from 'react';
import useGameStore from '../stores/gameStore';
import {
  linkAccount,
  fetchRecipes,
  fetchUnlockedRecipes,
  fetchInventory,
  submitCraft,
  claimCraft,
  fetchCraftingJobs,
  fetchProfessions,
  fetchSuiteStatus,
} from '../services/craftingApi';

const TABS = ['Recipes', 'Inventory', 'Resources', 'Jobs', 'Professions'];
const TIER_COLORS = ['#9ca3af','#22c55e','#3b82f6','#a855f7','#f59e0b','#ef4444','#ec4899','#06b6d4'];

function tierLabel(tier) {
  const names = ['T1','T2','T3','T4','T5','T6','T7','T8'];
  return names[tier - 1] || `T${tier}`;
}

function tierColor(tier) {
  return TIER_COLORS[Math.min(tier - 1, TIER_COLORS.length - 1)] || '#9ca3af';
}

// ── Sub-panels ──

function RecipeList({ recipes, unlockedIds, resources, suiteGold, grudgeId, onCraft }) {
  const [filter, setFilter] = useState('');
  const [tierFilter, setTierFilter] = useState(0);

  const filtered = recipes.filter(r => {
    if (filter && !r.name?.toLowerCase().includes(filter.toLowerCase())) return false;
    if (tierFilter > 0 && r.tier !== tierFilter) return false;
    return true;
  });

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <input
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Search recipes..."
          style={inputStyle}
        />
        <select value={tierFilter} onChange={e => setTierFilter(+e.target.value)} style={inputStyle}>
          <option value={0}>All Tiers</option>
          {[1,2,3,4,5,6,7,8].map(t => <option key={t} value={t}>{tierLabel(t)}</option>)}
        </select>
      </div>
      {filtered.length === 0 && <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 20 }}>No recipes found.</div>}
      <div style={{ display: 'grid', gap: 8 }}>
        {filtered.map(recipe => {
          const unlocked = !recipe.requiresUnlock || unlockedIds.includes(recipe.id || recipe.recipeId);
          const canAfford = (recipe.goldCost || 0) <= suiteGold;
          return (
            <div key={recipe.id || recipe.recipeId} style={{
              background: 'rgba(20,26,43,0.9)', border: `1px solid ${unlocked ? 'var(--border)' : 'rgba(239,68,68,0.3)'}`,
              borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <span style={{ color: tierColor(recipe.tier || 1), fontWeight: 700, fontSize: '0.85rem' }}>
                  [{tierLabel(recipe.tier || 1)}]
                </span>{' '}
                <span style={{ color: unlocked ? 'var(--accent)' : 'var(--muted)', fontWeight: 600 }}>{recipe.name}</span>
                {recipe.profession && <span style={{ color: 'var(--muted)', fontSize: '0.75rem', marginLeft: 8 }}>({recipe.profession})</span>}
                {recipe.goldCost > 0 && <span style={{ color: 'var(--gold)', fontSize: '0.75rem', marginLeft: 8 }}>{recipe.goldCost}g</span>}
                {recipe.ingredients && recipe.ingredients.length > 0 && (
                  <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: 2 }}>
                    Needs: {recipe.ingredients.map(i => `${i.quantity}x ${i.name || i.materialId}`).join(', ')}
                  </div>
                )}
              </div>
              <button
                disabled={!unlocked || !canAfford}
                onClick={() => onCraft(recipe)}
                style={{
                  ...btnStyle,
                  opacity: unlocked && canAfford ? 1 : 0.4,
                  cursor: unlocked && canAfford ? 'pointer' : 'not-allowed',
                }}
              >
                Craft
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InventoryList({ inventory }) {
  if (!inventory || inventory.length === 0) {
    return <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 30 }}>No crafted items in suite inventory.</div>;
  }
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {inventory.map((item, idx) => (
        <div key={item.id || idx} style={{
          background: 'rgba(20,26,43,0.9)', border: '1px solid var(--border)',
          borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <span style={{ color: tierColor(item.tier || 1), fontWeight: 700, fontSize: '0.85rem' }}>
              [{tierLabel(item.tier || 1)}]
            </span>{' '}
            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{item.name || item.itemId}</span>
            {item.quality && <span style={{ color: 'var(--muted)', fontSize: '0.75rem', marginLeft: 8 }}>({item.quality})</span>}
          </div>
          <span style={{ color: 'var(--gold)', fontFamily: 'monospace', fontWeight: 600 }}>x{item.quantity || 1}</span>
        </div>
      ))}
    </div>
  );
}

function ResourceList({ resources }) {
  if (!resources || resources.length === 0) {
    return <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 30 }}>No resources stored in suite.</div>;
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      {resources.map((res, idx) => (
        <div key={idx} style={{
          background: 'rgba(20,26,43,0.9)', border: '1px solid var(--border)',
          borderRadius: 10, padding: '10px 14px'
        }}>
          <div style={{ color: tierColor(res.tier || 1), fontWeight: 600, fontSize: '0.85rem' }}>
            {res.resourceType || res.name}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>{tierLabel(res.tier || 1)}</span>
            <span style={{ color: 'var(--accent)', fontFamily: 'monospace', fontWeight: 700 }}>{res.quantity}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function JobsList({ jobs, grudgeId, onClaim }) {
  if (!jobs || jobs.length === 0) {
    return <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 30 }}>No active crafting jobs.</div>;
  }
  const now = Date.now();
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {jobs.map(job => {
        const ready = job.isReady || (job.completesAt && new Date(job.completesAt).getTime() <= now);
        return (
          <div key={job.id} style={{
            background: 'rgba(20,26,43,0.9)', border: `1px solid ${ready ? 'rgba(34,197,94,0.4)' : 'var(--border)'}`,
            borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div>
              <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{job.recipeName || job.recipeId}</span>
              <div style={{ color: ready ? '#22c55e' : '#f59e0b', fontSize: '0.75rem', marginTop: 2 }}>
                {ready ? '✓ Ready to claim!' : `Crafting... completes ${new Date(job.completesAt).toLocaleTimeString()}`}
              </div>
            </div>
            {ready && (
              <button onClick={() => onClaim(job.id)} style={btnStyle}>Claim</button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ProfessionsList({ professions }) {
  const entries = Object.entries(professions || {});
  if (entries.length === 0) {
    return <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 30 }}>No profession data loaded.</div>;
  }
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {entries.map(([charId, profs]) => (
        <div key={charId} style={{ background: 'rgba(20,26,43,0.9)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
          <div style={{ color: 'var(--gold)', fontWeight: 700, marginBottom: 8, fontSize: '0.9rem' }}>Character {charId}</div>
          {Object.entries(profs || {}).map(([profName, data]) => {
            const level = data?.level || 0;
            const xp = data?.xp || 0;
            const xpToNext = data?.xpToNext || 100;
            const pct = xpToNext > 0 ? Math.min(100, (xp / xpToNext) * 100) : 0;
            return (
              <div key={profName} style={{ marginBottom: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--accent)' }}>{profName}</span>
                  <span style={{ color: 'var(--muted)' }}>Lv {level} ({xp}/{xpToNext})</span>
                </div>
                <div style={{ height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden', marginTop: 2 }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: '#22c55e', borderRadius: 3, transition: 'width 0.3s' }} />
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ── Main Panel ──

export default function CraftingPanel({ onClose }) {
  const {
    suiteLinked, suiteGrudgeId, suiteGold, suiteGbux, suiteAccountXp,
    suiteResources, suiteInventory, suiteRecipes, suiteUnlockedRecipes,
    suiteCraftingJobs, suiteProfessions, suiteSyncError,
    linkSuiteAccount, setSuiteInventory, setSuiteRecipes,
    setSuiteUnlockedRecipes, setSuiteCraftingJobs, setSuiteProfessions,
    setSuiteSyncError, removeSuiteCraftingJob, addSuiteCraftingJob,
  } = useGameStore();

  const [tab, setTab] = useState('Recipes');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [discordId, setDiscordId] = useState('');
  const [suiteOnline, setSuiteOnline] = useState(null);

  // Check suite DB status on mount
  useEffect(() => {
    fetchSuiteStatus().then(res => setSuiteOnline(res.success && res.connected));
  }, []);

  const loadData = useCallback(async () => {
    if (!suiteGrudgeId) return;
    setLoading(true);
    try {
      const [invRes, recRes, unlRes, jobRes, profRes] = await Promise.all([
        fetchInventory(suiteGrudgeId),
        fetchRecipes(),
        fetchUnlockedRecipes(suiteGrudgeId),
        fetchCraftingJobs(suiteGrudgeId),
        fetchProfessions(suiteGrudgeId),
      ]);
      if (invRes.success) setSuiteInventory(invRes);
      if (recRes.success) setSuiteRecipes(recRes.recipes || []);
      if (unlRes.success) setSuiteUnlockedRecipes(unlRes.recipeIds || unlRes.recipes || []);
      if (jobRes.success) setSuiteCraftingJobs(jobRes.jobs || []);
      if (profRes.success) setSuiteProfessions(profRes);
      setSuiteSyncError(null);
    } catch (err) {
      setSuiteSyncError(err.message);
    } finally {
      setLoading(false);
    }
  }, [suiteGrudgeId]);

  // Auto-load when linked
  useEffect(() => {
    if (suiteLinked && suiteGrudgeId) loadData();
  }, [suiteLinked, suiteGrudgeId, loadData]);

  const handleLink = async () => {
    if (!discordId.trim()) return;
    setLoading(true);
    setMsg(null);
    const res = await linkAccount(discordId.trim());
    if (res.success) {
      linkSuiteAccount({ accountId: res.accountId, grudgeId: res.grudgeId, gold: res.gold, gbux: res.gbux, accountXp: res.accountXp });
      setMsg('Account linked!');
    } else {
      setMsg(`Link failed: ${res.error}`);
    }
    setLoading(false);
  };

  const handleCraft = async (recipe) => {
    if (!suiteGrudgeId) return;
    setLoading(true);
    const res = await submitCraft({ grudgeId: suiteGrudgeId, recipeId: recipe.id || recipe.recipeId, quantity: 1, tier: recipe.tier || 1 });
    if (res.success) {
      if (res.job) addSuiteCraftingJob(res.job);
      setMsg(`Crafting ${recipe.name} started!`);
      setTab('Jobs');
    } else {
      setMsg(`Craft failed: ${res.error}`);
    }
    setLoading(false);
  };

  const handleClaim = async (jobId) => {
    if (!suiteGrudgeId) return;
    setLoading(true);
    const res = await claimCraft(suiteGrudgeId, jobId);
    if (res.success) {
      removeSuiteCraftingJob(jobId);
      setMsg('Item claimed!');
      loadData(); // refresh inventory
    } else {
      setMsg(`Claim failed: ${res.error}`);
    }
    setLoading(false);
  };

  // ── Render ──

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center',
    }}>
      <div style={{
        width: '90%', maxWidth: 800, maxHeight: '85vh', overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(14,22,48,0.98), rgba(20,26,43,0.95))',
        border: '2px solid var(--border)', borderRadius: 16, display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '12px 20px', borderBottom: '2px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'rgba(14,22,48,0.8)',
        }}>
          <h2 className="font-cinzel" style={{ color: 'var(--gold)', fontSize: '1.1rem', margin: 0 }}>
            ⚒ Crafting Suite
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {suiteLinked && (
              <div style={{ display: 'flex', gap: 12, fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--gold)' }}>💰 {suiteGold}</span>
                <span style={{ color: '#a855f7' }}>💎 {suiteGbux}</span>
                <span style={{ color: '#3b82f6' }}>⭐ {suiteAccountXp} XP</span>
              </div>
            )}
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: suiteOnline ? '#22c55e' : suiteOnline === false ? '#ef4444' : '#f59e0b',
              display: 'inline-block',
            }} />
            <button onClick={onClose} style={{
              background: 'var(--border)', border: 'none', borderRadius: 8,
              padding: '6px 14px', color: 'var(--text)', cursor: 'pointer', fontWeight: 600,
            }}>✕</button>
          </div>
        </div>

        {/* Link prompt or tab content */}
        {!suiteLinked ? (
          <div style={{ padding: 30, textAlign: 'center' }}>
            <p style={{ color: 'var(--muted)', marginBottom: 16 }}>
              Link your Discord account to connect with the Warlord Crafting Suite database.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 12 }}>
              <input
                value={discordId}
                onChange={e => setDiscordId(e.target.value)}
                placeholder="Discord ID"
                style={{ ...inputStyle, width: 220 }}
              />
              <button onClick={handleLink} disabled={loading} style={btnStyle}>
                {loading ? 'Linking...' : 'Link Account'}
              </button>
            </div>
            {msg && <div style={{ color: msg.includes('fail') ? '#ef4444' : '#22c55e', fontSize: '0.85rem' }}>{msg}</div>}
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 12px' }}>
              {TABS.map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    padding: '10px 16px', cursor: 'pointer',
                    background: tab === t ? 'rgba(110,231,183,0.12)' : 'transparent',
                    borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
                    border: 'none', color: tab === t ? 'var(--accent)' : 'var(--muted)',
                    fontWeight: tab === t ? 700 : 400, fontSize: '0.85rem',
                    transition: 'all 0.2s',
                  }}
                >
                  {t} {t === 'Jobs' && suiteCraftingJobs.length > 0 ? `(${suiteCraftingJobs.length})` : ''}
                </button>
              ))}
              <div style={{ flex: 1 }} />
              <button onClick={loadData} disabled={loading} style={{
                ...btnStyle, padding: '6px 12px', fontSize: '0.75rem', alignSelf: 'center',
              }}>
                {loading ? '↻' : '↻ Refresh'}
              </button>
            </div>

            {/* Feedback */}
            {msg && (
              <div style={{
                padding: '6px 20px', fontSize: '0.8rem',
                color: msg.includes('fail') ? '#ef4444' : '#22c55e',
                background: 'rgba(0,0,0,0.3)',
              }}>
                {msg}
              </div>
            )}
            {suiteSyncError && (
              <div style={{ padding: '6px 20px', fontSize: '0.8rem', color: '#ef4444', background: 'rgba(239,68,68,0.1)' }}>
                Sync error: {suiteSyncError}
              </div>
            )}

            {/* Content */}
            <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
              {loading && <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 30 }}>Loading...</div>}
              {!loading && tab === 'Recipes' && (
                <RecipeList
                  recipes={suiteRecipes}
                  unlockedIds={suiteUnlockedRecipes}
                  resources={suiteResources}
                  suiteGold={suiteGold}
                  grudgeId={suiteGrudgeId}
                  onCraft={handleCraft}
                />
              )}
              {!loading && tab === 'Inventory' && <InventoryList inventory={suiteInventory} />}
              {!loading && tab === 'Resources' && <ResourceList resources={suiteResources} />}
              {!loading && tab === 'Jobs' && <JobsList jobs={suiteCraftingJobs} grudgeId={suiteGrudgeId} onClaim={handleClaim} />}
              {!loading && tab === 'Professions' && <ProfessionsList professions={suiteProfessions} />}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Shared Styles ──

const inputStyle = {
  background: 'rgba(11,16,32,0.9)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '8px 12px',
  color: 'var(--text)',
  fontSize: '0.85rem',
  outline: 'none',
};

const btnStyle = {
  background: 'rgba(110,231,183,0.15)',
  border: '1px solid rgba(110,231,183,0.3)',
  borderRadius: 8,
  padding: '8px 16px',
  color: 'var(--accent)',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: '0.85rem',
  transition: 'all 0.15s',
};
