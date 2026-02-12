import React, { useState } from 'react';
import { raceDefinitions } from '../data/races';
import { classDefinitions } from '../data/classes';
import { InlineIcon, EssentialIcon } from '../data/uiSprites';

const TABS = [
  { id: 'overview', label: 'OVERVIEW', icon: 'Scroll' },
  { id: 'races', label: 'RACES', icon: 'Team' },
  { id: 'classes', label: 'CLASSES', icon: 'Gamepad' },
  { id: 'attributes', label: 'ATTRIBUTES', icon: 'Settings' },
  { id: 'combat', label: 'COMBAT', icon: 'Crosshair' },
  { id: 'tips', label: 'TIPS', icon: 'Trophy' },
];

const ATTRIBUTE_INFO = [
  { name: 'Strength', icon: 'battle', color: '#ef4444', desc: 'Increases physical attack damage. Warriors and Barbarians benefit most.', formula: 'Physical Damage = Base × (1 + STR × 0.05)' },
  { name: 'Intellect', icon: 'crystal', color: '#8b5cf6', desc: 'Increases magical damage and max mana pool. Essential for Mage Priests.', formula: 'Magic Damage = Base × (1 + INT × 0.05)' },
  { name: 'Vitality', icon: 'heart', color: '#22c55e', desc: 'Increases maximum HP. Important for all frontline fighters.', formula: 'Max HP = 100 + (VIT × 12)' },
  { name: 'Dexterity', icon: 'target', color: '#f59e0b', desc: 'Increases critical hit chance and ranged damage. Key stat for Rangers.', formula: 'Crit Chance = 5% + (DEX × 1.5%)' },
  { name: 'Endurance', icon: 'shield', color: '#6366f1', desc: 'Increases physical defense and max stamina. Dwarves excel here.', formula: 'Defense = 2 + (END × 2)' },
  { name: 'Wisdom', icon: 'sparkle', color: '#06b6d4', desc: 'Increases magical defense, heal power, and mana regeneration.', formula: 'Heal Power = Base × (1 + WIS × 0.04)' },
  { name: 'Agility', icon: 'energy', color: '#10b981', desc: 'Increases evasion chance and turn speed. Determines action order.', formula: 'Evasion = AGI × 1.2%, Speed = 50 + AGI × 2' },
  { name: 'Tactics', icon: 'scroll', color: '#f97316', desc: 'Increases buff/debuff effectiveness and ability damage modifiers.', formula: 'Ability Bonus = TAC × 2%' },
];

const COMBAT_FORMULAS = [
  { title: 'Physical Damage', formula: 'ATK × Ability Multiplier × (1 - DEF%) + Bonus', detail: 'ATK scales from Strength. DEF% is target defense reduction capped at 70%.' },
  { title: 'Magical Damage', formula: 'MATK × Ability Multiplier × (1 - MDEF%) + Bonus', detail: 'MATK scales from Intellect. MDEF% is target magic defense from Wisdom.' },
  { title: 'Critical Strike', formula: 'Damage × 1.5 (or 2.0 with Tactics bonus)', detail: 'Crit chance from Dexterity. Rangers have Focus stacking mechanic.' },
  { title: 'Evasion Check', formula: 'Roll < Evasion% → Dodge (0 damage)', detail: 'Agility-based. Evasive Roll adds +50% for 2 turns.' },
  { title: 'Turn Order', formula: 'Speed = 50 + (Agility × 2) + Equipment Bonus', detail: 'Higher speed acts first. Ties broken by unit index.' },
  { title: 'Healing', formula: 'MaxHP × HealPercent × (1 + Wisdom × 0.04)', detail: 'Divine Heal restores 30% base. Wisdom amplifies all healing.' },
  { title: 'DoT Damage', formula: 'MaxHP × DoT% per turn for Duration', detail: 'Poison, Burn, Bleed tick at start of affected unit turn.' },
  { title: 'Bear Form', formula: '+25% Damage, +10 Flat Defense, Maul replaces basic', detail: 'Worge signature. Permanent until manually cancelled.' },
];

const TIPS = [
  { title: 'Build a Balanced War Party', tip: 'Run 1 tank (Warrior/Dwarf), 1 healer (Mage Priest), and 1 DPS (Ranger/Worge) for best results.' },
  { title: 'Use Abilities Wisely', tip: 'Basic attacks restore mana and stamina. Spam basics early, then unload big abilities when the enemy is weakened.' },
  { title: 'Watch Turn Order', tip: 'Agility determines who acts first. A fast Ranger can eliminate threats before they attack.' },
  { title: 'Equip Gear Regularly', tip: 'Equipment provides massive stat boosts. Check the merchant after every battle for upgrades.' },
  { title: 'Level Multiple Heroes', tip: 'Higher-level content requires 3 heroes. Spread XP across your roster.' },
  { title: 'Conquer Zones', tip: 'Conquered zones provide auto-harvest resources and bonus XP. Prioritize zones near your level.' },
  { title: 'Complete Zone Quests', tip: 'Each zone has 4 optional quests that reward gold, XP, and rare items.' },
  { title: 'Arena Ranking', tip: 'Submit your best team to the GRUDA Arena. Higher ranks earn better daily rewards and prestige badges.' },
  { title: 'Worge Transform Timing', tip: 'Enter Bear Form early in tough fights. The defense bonus helps survival while Maul deals strong damage.' },
  { title: 'Focus Stacking (Ranger)', tip: 'Focus passively gains +10% crit per turn. Activate Focus to double stacks and guarantee a devastating crit.' },
];

const panelStyle = {
  background: 'linear-gradient(180deg, rgba(15,20,35,0.95), rgba(10,14,25,0.98))',
  border: '1px solid rgba(110,231,183,0.15)',
  borderRadius: 12,
  padding: 20,
  marginBottom: 16,
};

export default function GrudgeOnlinePage({ onClose }) {
  const [tab, setTab] = useState('overview');

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(0,0,0,0.92)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 24px',
        background: 'linear-gradient(90deg, rgba(15,20,35,0.98), rgba(70,65,84,0.6))',
        borderBottom: '2px solid rgba(250,172,71,0.3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="font-cinzel" style={{
            fontSize: '1.3rem',
            background: 'linear-gradient(135deg, #FAAC47, #DB6331)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            GRUDGE ONLINE
          </span>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', letterSpacing: 3 }}>
            WARLORD COMPENDIUM
          </span>
        </div>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 6, padding: '6px 18px', color: '#ccc', cursor: 'pointer',
          fontFamily: "'Cinzel', serif", fontSize: '0.75rem', letterSpacing: 2,
        }}>
          CLOSE
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, padding: '12px 24px', flexWrap: 'wrap', background: 'rgba(0,0,0,0.3)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: tab === t.id ? 'rgba(250,172,71,0.15)' : 'rgba(255,255,255,0.03)',
            border: tab === t.id ? '1px solid rgba(250,172,71,0.5)' : '1px solid rgba(255,255,255,0.08)',
            borderRadius: 6, padding: '6px 16px',
            color: tab === t.id ? '#FAAC47' : 'rgba(255,255,255,0.5)',
            fontFamily: "'Cinzel', serif", fontSize: '0.7rem', letterSpacing: 2,
            cursor: 'pointer', transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <EssentialIcon name={t.icon} size={14} />
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        {tab === 'overview' && <OverviewTab />}
        {tab === 'races' && <RacesTab />}
        {tab === 'classes' && <ClassesTab />}
        {tab === 'attributes' && <AttributesTab />}
        {tab === 'combat' && <CombatTab />}
        {tab === 'tips' && <TipsTab />}
      </div>
    </div>
  );
}

function OverviewTab() {
  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ ...panelStyle, borderColor: 'rgba(250,172,71,0.3)' }}>
        <h2 className="font-cinzel" style={{ color: '#FAAC47', fontSize: '1.2rem', marginBottom: 12 }}>
          Welcome to the Grudge War
        </h2>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', lineHeight: 1.8 }}>
          <p>Grudge Warlords is a tactical turn-based RPG set in a dark fantasy world where ancient grudges fuel eternal conflict. Build a roster of heroes from <strong style={{ color: '#fff' }}>6 races</strong> and <strong style={{ color: '#fff' }}>4 classes</strong>, creating <strong style={{ color: '#FAAC47' }}>24 unique Warlord combinations</strong>.</p>
          <p style={{ marginTop: 12 }}>Lead your War Party across a vast world map with 32 zones, conquer territories, complete quests, and climb the GRUDA Arena leaderboard. Three factions vie for control — the <span style={{ color: '#fbbf24' }}>Crusade</span>, the <span style={{ color: '#ef4444' }}>Legion</span>, and the <span style={{ color: '#22d3ee' }}>Fabled</span>.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 8 }}>
        {[
          { title: '6 Races', desc: 'Human, Orc, Elf, Undead, Barbarian, Dwarf', color: '#22d3ee' },
          { title: '4 Classes', desc: 'Warrior, Mage Priest, Worge, Ranger', color: '#a855f7' },
          { title: '8 Attributes', desc: 'STR, INT, VIT, DEX, END, WIS, AGI, TAC', color: '#ef4444' },
          { title: '32 Zones', desc: '5 terrain regions with unique enemies', color: '#22c55e' },
          { title: '7 Equipment Slots', desc: '8-tier upgrade system per slot', color: '#f59e0b' },
          { title: 'Arena PvP', desc: 'Ranked battles with 6 prestige tiers', color: '#f43f5e' },
        ].map((item, i) => (
          <div key={i} style={{ ...panelStyle, padding: 16 }}>
            <div className="font-cinzel" style={{ color: item.color, fontSize: '0.95rem', marginBottom: 4 }}>
              {item.title}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>{item.desc}</div>
          </div>
        ))}
      </div>

      <div style={{ ...panelStyle, marginTop: 8, borderColor: 'rgba(219,99,49,0.3)' }}>
        <h3 className="font-cinzel" style={{ color: '#DB6331', fontSize: '1rem', marginBottom: 8 }}>
          The Three Factions
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { name: 'The Crusade', god: 'Odin', races: 'Humans & Barbarians', color: '#fbbf24', desc: 'Warriors of honor and fury, sworn to their war-god.' },
            { name: 'The Legion', god: 'Madra', races: 'Orcs & Undead', color: '#ef4444', desc: 'Dark armies united by bloodlust and death magic.' },
            { name: 'The Fabled', god: 'The Omni', races: 'Elves & Dwarves', color: '#22d3ee', desc: 'Ancient alliance of magic and craftsmanship.' },
          ].map((f, i) => (
            <div key={i} style={{ padding: 12, background: 'rgba(0,0,0,0.3)', borderRadius: 8, border: `1px solid ${f.color}33` }}>
              <div className="font-cinzel" style={{ color: f.color, fontSize: '0.85rem' }}>{f.name}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', marginTop: 2 }}>Patron: {f.god}</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', marginTop: 4 }}>{f.races}</div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem', marginTop: 4 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RacesTab() {
  const races = Object.values(raceDefinitions);
  return (
    <div style={{ maxWidth: 800 }}>
      <h2 className="font-cinzel" style={{ color: '#FAAC47', fontSize: '1.2rem', marginBottom: 16 }}>
        Race Index
      </h2>
      {races.map(race => (
        <div key={race.id} style={{ ...panelStyle, borderLeft: `3px solid ${race.color}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div className="font-cinzel" style={{ color: race.color, fontSize: '1rem' }}>{race.name}</div>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem', letterSpacing: 2 }}>
              {race.trait}
            </span>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', marginBottom: 8 }}>{race.description}</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', fontStyle: 'italic', marginBottom: 10 }}>{race.lore}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {Object.entries(race.bonuses).filter(([, v]) => v > 0).map(([attr, val]) => (
              <span key={attr} style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 4, padding: '2px 8px', fontSize: '0.7rem', color: '#ccc',
              }}>
                +{val} {attr}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ClassesTab() {
  const classes = Object.entries(classDefinitions);
  return (
    <div style={{ maxWidth: 800 }}>
      <h2 className="font-cinzel" style={{ color: '#FAAC47', fontSize: '1.2rem', marginBottom: 16 }}>
        Class Index
      </h2>
      {classes.map(([classId, cls]) => (
        <div key={classId} style={{ ...panelStyle, borderLeft: `3px solid ${cls.color}` }}>
          <div className="font-cinzel" style={{ color: cls.color, fontSize: '1rem', marginBottom: 4 }}>{cls.name}</div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', marginBottom: 8 }}>{cls.description}</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', fontStyle: 'italic', marginBottom: 12 }}>{cls.lore}</div>

          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', letterSpacing: 2, marginBottom: 8 }}>ABILITIES</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 8 }}>
            {cls.abilities.map(a => (
              <div key={a.id} style={{
                background: 'rgba(0,0,0,0.3)', borderRadius: 6, padding: '8px 12px',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 600 }}>
                    <InlineIcon name={a.icon} size={12} /> {a.name}
                  </span>
                  <span style={{ color: a.type === 'physical' ? '#ef4444' : a.type === 'magical' ? '#8b5cf6' : a.type === 'heal' || a.type === 'heal_over_time' ? '#22c55e' : '#f59e0b', fontSize: '0.65rem' }}>
                    {a.type.toUpperCase()}
                  </span>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.7rem', marginTop: 4 }}>{a.description}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                  {a.damage > 0 && <StatPill label="DMG" value={`${a.damage}x`} color="#ef4444" />}
                  {a.manaCost > 0 && <StatPill label="Mana" value={a.manaCost} color="#3b82f6" />}
                  {a.staminaCost > 0 && <StatPill label="STA" value={a.staminaCost} color="#f59e0b" />}
                  {a.cooldown > 0 && <StatPill label="CD" value={`${a.cooldown}t`} color="#6366f1" />}
                </div>
              </div>
            ))}
          </div>

          {cls.signatureAbility && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(250,172,71,0.08)', borderRadius: 8, border: '1px solid rgba(250,172,71,0.2)' }}>
              <div style={{ color: '#FAAC47', fontSize: '0.75rem', letterSpacing: 2, marginBottom: 4 }}>SIGNATURE ABILITY</div>
              <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600 }}>
                <InlineIcon name={cls.signatureAbility.icon} size={12} /> {cls.signatureAbility.name}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginTop: 4 }}>{cls.signatureAbility.description}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function AttributesTab() {
  return (
    <div style={{ maxWidth: 800 }}>
      <h2 className="font-cinzel" style={{ color: '#FAAC47', fontSize: '1.2rem', marginBottom: 16 }}>
        Attribute Guide
      </h2>
      {ATTRIBUTE_INFO.map(attr => (
        <div key={attr.name} style={{ ...panelStyle, borderLeft: `3px solid ${attr.color}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <InlineIcon name={attr.icon} size={16} />
            <span className="font-cinzel" style={{ color: attr.color, fontSize: '0.95rem' }}>{attr.name}</span>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', marginBottom: 6 }}>{attr.desc}</div>
          <div style={{
            background: 'rgba(0,0,0,0.4)', borderRadius: 4, padding: '6px 12px',
            color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', fontFamily: 'monospace',
          }}>
            {attr.formula}
          </div>
        </div>
      ))}
    </div>
  );
}

function CombatTab() {
  return (
    <div style={{ maxWidth: 800 }}>
      <h2 className="font-cinzel" style={{ color: '#FAAC47', fontSize: '1.2rem', marginBottom: 16 }}>
        Combat Math
      </h2>
      <div style={{ ...panelStyle, marginBottom: 20, borderColor: 'rgba(250,172,71,0.2)' }}>
        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', lineHeight: 1.6 }}>
          Combat uses a speed-based initiative system. Each unit has an action timer that fills based on their Speed stat. When a unit's timer is full, they take their turn. Up to 3 heroes fight against AI-controlled enemies.
        </div>
      </div>
      {COMBAT_FORMULAS.map((f, i) => (
        <div key={i} style={{ ...panelStyle, padding: 16 }}>
          <div className="font-cinzel" style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: 6 }}>{f.title}</div>
          <div style={{
            background: 'rgba(0,0,0,0.4)', borderRadius: 4, padding: '8px 14px',
            color: '#FAAC47', fontSize: '0.75rem', fontFamily: 'monospace', marginBottom: 6,
          }}>
            {f.formula}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.7rem' }}>{f.detail}</div>
        </div>
      ))}
    </div>
  );
}

function TipsTab() {
  return (
    <div style={{ maxWidth: 800 }}>
      <h2 className="font-cinzel" style={{ color: '#FAAC47', fontSize: '1.2rem', marginBottom: 16 }}>
        Warlord Tips & Strategy
      </h2>
      {TIPS.map((t, i) => (
        <div key={i} style={{ ...panelStyle, padding: 16, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{
            minWidth: 28, height: 28, borderRadius: '50%',
            background: 'rgba(250,172,71,0.15)', border: '1px solid rgba(250,172,71,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#FAAC47', fontSize: '0.75rem', fontWeight: 700, fontFamily: "'Cinzel', serif",
          }}>
            {i + 1}
          </div>
          <div>
            <div className="font-cinzel" style={{ color: '#fff', fontSize: '0.85rem', marginBottom: 4 }}>{t.title}</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', lineHeight: 1.5 }}>{t.tip}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatPill({ label, value, color }) {
  return (
    <span style={{
      fontSize: '0.6rem', color, background: `${color}15`, border: `1px solid ${color}33`,
      borderRadius: 3, padding: '1px 6px',
    }}>
      {label}: {value}
    </span>
  );
}
