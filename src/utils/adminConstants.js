export const ADMIN_RACES = ['human', 'orc', 'elf', 'undead', 'barbarian', 'dwarf'];
export const ADMIN_CLASSES = ['warrior', 'mage', 'worge', 'ranger'];

export const RACE_LABELS = {
  human: 'Human', orc: 'Orc', elf: 'Elf',
  undead: 'Undead', barbarian: 'Barbarian', dwarf: 'Dwarf',
};

export const CLASS_LABELS = {
  warrior: 'Warrior', mage: 'Mage', worge: 'Worge', ranger: 'Ranger',
};

export const RACE_COLORS = {
  human: '#f59e0b', orc: '#ef4444', elf: '#22d3ee',
  undead: '#a855f7', barbarian: '#f97316', dwarf: '#10b981',
};

export const CLASS_COLORS = {
  warrior: '#ef4444', mage: '#3b82f6', worge: '#a855f7', ranger: '#22c55e',
};

export const ANIM_COLORS = {
  idle: '#22c55e', walk: '#3b82f6', run: '#06b6d4',
  attack1: '#ef4444', attack2: '#f97316', attack3: '#f59e0b', attack: '#ef4444',
  hurt: '#ec4899', death: '#6b7280', jump: '#8b5cf6', fall: '#a855f7',
  roll: '#14b8a6', doublejump: '#7c3aed', land: '#64748b', wallslide: '#475569',
  attack1_effect: '#fbbf24', attack2_effect: '#fb923c', attack3_effect: '#f87171',
  cast: '#06b6d4', heal: '#22c55e', block: '#94a3b8', charge: '#eab308',
  surf: '#38bdf8', slide: '#7dd3fc', special: '#d946ef',
};

export const S = {
  panel: {
    background: 'rgba(20,15,30,0.7)',
    border: '1px solid rgba(255,215,0,0.12)',
    borderRadius: 8,
    padding: 14,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  label: {
    fontSize: 11,
    color: '#8a7d65',
    fontWeight: 600,
    minWidth: 60,
  },
  val: {
    fontSize: 11,
    color: '#ffd700',
    minWidth: 40,
    textAlign: 'right',
    fontFamily: 'monospace',
  },
  select: {
    background: 'rgba(20,15,30,0.9)',
    border: '1px solid rgba(255,215,0,0.15)',
    borderRadius: 4,
    color: '#e0d6c2',
    padding: '3px 6px',
    outline: 'none',
  },
  btn: (color = '#8b5cf6') => ({
    background: `${color}22`,
    border: `1px solid ${color}55`,
    color,
    borderRadius: 4,
    padding: '4px 10px',
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 600,
    transition: 'all 0.15s',
  }),
};
