import React, { useState, useEffect } from 'react';
import useGameStore, { getHeroStatsWithBonuses } from '../stores/gameStore';
import { setBgm } from '../utils/audioManager';
import { locations } from '../data/enemies';
import { classDefinitions } from '../data/classes';
import { raceDefinitions } from '../data/races';
import { TIERS, EQUIPMENT_SLOTS } from '../data/equipment';
import { getQuestsForZone, checkQuestProgress } from '../data/quests';
import SpriteAnimation from './SpriteAnimation';
import { getPlayerSprite } from '../data/spriteMap';
import { InlineIcon, EssentialIcon } from '../data/uiSprites';

const SLOT_ICONS = {
  weapon: 'crossed_swords', offhand: 'shield', helmet: 'helm', armor: 'shield',
  feet: 'boots', ring: 'ring', relic: 'crystal',
};
const SLOT_LABELS = {
  weapon: 'Weapon', offhand: 'Off-Hand', helmet: 'Helmet', armor: 'Armor',
  feet: 'Boots', ring: 'Ring', relic: 'Relic',
};

const CLASS_BG = {
  warrior: 'linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(153,27,27,0.10) 50%, rgba(20,26,43,0.95) 100%)',
  mage: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(88,28,135,0.10) 50%, rgba(20,26,43,0.95) 100%)',
  ranger: 'linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(21,128,61,0.10) 50%, rgba(20,26,43,0.95) 100%)',
  worge: 'linear-gradient(135deg, rgba(217,119,6,0.15) 0%, rgba(146,64,14,0.10) 50%, rgba(20,26,43,0.95) 100%)',
};

const RACE_BG = {
  human: '/backgrounds/card_divine.png',
  elf: '/backgrounds/card_beach.png',
  dwarf: '/backgrounds/card_green_hills.png',
  undead: '/backgrounds/card_dark.png',
  orc: '/backgrounds/blood_canyon.png',
  barbarian: '/backgrounds/volcanic_field.png',
};

const CLASS_BORDER = {
  warrior: 'rgba(239,68,68,0.3)',
  mage: 'rgba(139,92,246,0.3)',
  ranger: 'rgba(34,197,94,0.3)',
  worge: 'rgba(217,119,6,0.3)',
};

function HeroCard({ hero, isLeader, conquer }) {
  const cls = classDefinitions[hero.classId];
  const race = raceDefinitions?.[hero.raceId];
  const clsColor = cls?.color || 'var(--accent)';
  const stats = getHeroStatsWithBonuses(hero);

  const bars = [
    { label: 'HP', value: Math.floor(hero.currentHealth ?? stats.health), max: Math.floor(stats.health), color: '#22c55e', barColor: '#16a34a' },
    { label: 'MP', value: Math.floor(hero.currentMana ?? stats.mana), max: Math.floor(stats.mana), color: '#3b82f6', barColor: '#2563eb' },
    { label: 'SP', value: Math.floor(hero.currentStamina ?? stats.stamina), max: Math.floor(stats.stamina), color: '#f59e0b', barColor: '#d97706' },
  ];

  const combatStats = [
    { label: 'P.Dmg', value: Math.floor(stats.physicalDamage) },
    { label: 'M.Dmg', value: Math.floor(stats.magicDamage) },
    { label: 'Def', value: Math.floor(stats.defense) },
    { label: 'Spd', value: Math.floor(stats.speed) },
    { label: 'Crit', value: `${Math.floor(stats.critChance)}%` },
    { label: 'Dodge', value: `${Math.floor(stats.dodge)}%` },
  ];

  const raceBg = RACE_BG[hero.raceId] || RACE_BG.human;

  return (
    <div style={{
      backgroundImage: `linear-gradient(135deg, rgba(14,22,48,0.75), rgba(20,26,43,0.85)), url(${raceBg})`,
      backgroundSize: 'cover', backgroundPosition: 'center',
      border: `1px solid ${CLASS_BORDER[hero.classId] || CLASS_BORDER.warrior}`,
      borderRadius: 12,
      padding: 10,
      marginBottom: 8,
    }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
        <div style={{ filter: `drop-shadow(0 0 6px ${clsColor}50)`, flexShrink: 0 }}>
          <SpriteAnimation spriteData={getPlayerSprite(hero.classId, hero.raceId)} animation="idle" scale={2} speed={150} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 1 }}>
            <span className="font-cinzel" style={{ color: clsColor, fontSize: '0.75rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {hero.name}
            </span>
            {isLeader && <span style={{ fontSize: '0.45rem', color: 'var(--gold)', background: 'rgba(255,215,0,0.15)', padding: '1px 4px', borderRadius: 3, fontWeight: 700, letterSpacing: 0.5 }}>LEAD</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 1 }}>
            <span style={{ fontSize: '0.55rem', color: clsColor, fontWeight: 600 }}>Lv.{hero.level}</span>
            <span style={{ fontSize: '0.4rem', color: 'rgba(255,255,255,0.2)' }}>|</span>
            <span style={{ fontSize: '0.5rem', color: 'var(--muted)' }}>{race?.name || hero.raceId}</span>
            <span style={{ fontSize: '0.5rem', color: 'var(--muted)' }}>{cls?.name || hero.classId}</span>
          </div>
          <div style={{ fontSize: '0.45rem', color: 'var(--accent)', fontWeight: 600, marginBottom: 3 }}>IN PARTY</div>
          {bars.map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 1.5 }}>
              <span style={{ fontSize: '0.45rem', color: s.color, width: 16, textAlign: 'right', fontWeight: 600 }}>{s.label}</span>
              <div style={{ flex: 1, height: 4, background: 'rgba(0,0,0,0.4)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${Math.min(100, (s.value / s.max) * 100)}%`,
                  background: `linear-gradient(90deg, ${s.barColor}, ${s.color})`,
                  borderRadius: 2, transition: 'width 0.3s',
                }} />
              </div>
              <span style={{ fontSize: '0.4rem', color: 'var(--muted)', width: 36, textAlign: 'right' }}>{s.value}/{s.max}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2,
        background: 'rgba(0,0,0,0.2)', borderRadius: 5, padding: 3, marginBottom: 5,
      }}>
        {combatStats.map(s => (
          <div key={s.label} style={{ textAlign: 'center', padding: '1px 0' }}>
            <div style={{ fontSize: '0.4rem', color: 'var(--muted)', textTransform: 'uppercase' }}>{s.label}</div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text)', fontWeight: 600 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: '0.5rem', color: clsColor, fontWeight: 600, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        Equipment
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {EQUIPMENT_SLOTS.map(slot => {
          const item = hero.equipment?.[slot];
          const tierDef = item ? TIERS[item.tier] || TIERS[1] : null;
          const is2HLocked = slot === 'offhand' && hero.equipment?.weapon?.twoHanded;
          return (
            <div key={slot} style={{
              display: 'flex', alignItems: 'center', gap: 3,
              padding: '1.5px 4px', borderRadius: 3,
              background: item ? `${tierDef.color}10` : 'rgba(0,0,0,0.15)',
              border: `1px solid ${item ? tierDef.color + '25' : 'rgba(255,255,255,0.03)'}`,
              opacity: is2HLocked ? 0.3 : 1,
            }}>
              <span style={{ fontSize: '0.5rem', width: 12, textAlign: 'center' }}><InlineIcon name={SLOT_ICONS[slot]} size={12} /></span>
              {item ? (
                <>
                  <span style={{ fontSize: '0.5rem', color: tierDef.color, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.name}
                  </span>
                  <span style={{ fontSize: '0.4rem', color: tierDef.color, opacity: 0.7 }}>T{item.tier}</span>
                </>
              ) : (
                <span style={{ fontSize: '0.45rem', color: 'rgba(255,255,255,0.2)', flex: 1 }}>
                  {is2HLocked ? 'Locked' : SLOT_LABELS[slot]}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QuestItem({ quest, zoneId, zoneStats, gameState, completed, onComplete }) {
  const progress = checkQuestProgress(quest, { ...zoneStats, zoneId }, gameState);
  const canClaim = progress.done && !completed;

  return (
    <div style={{
      padding: '7px 10px',
      background: completed ? 'rgba(16,185,129,0.08)' : canClaim ? 'rgba(255,215,0,0.08)' : 'rgba(0,0,0,0.2)',
      border: `1px solid ${completed ? 'rgba(16,185,129,0.25)' : canClaim ? 'rgba(255,215,0,0.3)' : 'rgba(255,255,255,0.06)'}`,
      borderRadius: 8,
      transition: 'all 0.2s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {completed && <span style={{ color: 'var(--success)', fontSize: '0.7rem' }}>&#10003;</span>}
            <span className="font-cinzel" style={{
              fontSize: '0.72rem', fontWeight: 600,
              color: completed ? 'var(--success)' : canClaim ? 'var(--gold)' : 'var(--text)',
            }}>
              {quest.name}
            </span>
          </div>
          <div style={{ fontSize: '0.58rem', color: 'var(--muted)', marginTop: 2, lineHeight: 1.3 }}>
            {quest.description}
          </div>
        </div>
        {canClaim && (
          <button
            onClick={() => onComplete(quest)}
            style={{
              background: 'linear-gradient(135deg, var(--gold), #f59e0b)',
              border: 'none', borderRadius: 6, padding: '3px 10px',
              color: '#0b1020', fontWeight: 700, fontSize: '0.6rem',
              cursor: 'pointer', fontFamily: "'Cinzel', serif",
              boxShadow: '0 2px 8px rgba(255,215,0,0.3)',
              flexShrink: 0,
            }}
            onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.target.style.transform = 'none'}
          >
            CLAIM
          </button>
        )}
        {completed && (
          <span style={{ fontSize: '0.48rem', color: 'var(--success)', fontWeight: 600, flexShrink: 0 }}>COMPLETED</span>
        )}
      </div>

      {!completed && (
        <div style={{ marginTop: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
            <span style={{ fontSize: '0.48rem', color: 'var(--muted)' }}>Progress</span>
            <span style={{ fontSize: '0.48rem', color: progress.done ? 'var(--gold)' : 'var(--accent)', fontWeight: 600 }}>
              {typeof progress.target === 'string' ? (progress.done ? 'Done' : 'Incomplete') : `${Math.min(progress.current, progress.target)}/${progress.target}`}
            </span>
          </div>
          {typeof progress.target === 'number' && (
            <div style={{ height: 4, background: 'rgba(0,0,0,0.4)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.min(100, (progress.current / progress.target) * 100)}%`,
                background: progress.done ? 'linear-gradient(90deg, var(--gold), #ffed4a)' : 'linear-gradient(90deg, var(--accent), #10b981)',
                borderRadius: 2, transition: 'width 0.3s',
              }} />
            </div>
          )}
        </div>
      )}

      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginTop: 4, paddingTop: 3, borderTop: '1px solid rgba(255,255,255,0.04)',
      }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {quest.rewards.gold > 0 && (
            <span style={{ fontSize: '0.48rem', color: 'var(--gold)' }}>+{quest.rewards.gold}g</span>
          )}
          {quest.rewards.xp > 0 && (
            <span style={{ fontSize: '0.48rem', color: '#60a5fa' }}>+{quest.rewards.xp} XP</span>
          )}
          <span style={{ fontSize: '0.48rem', color: '#22c55e' }}>+{quest.conquerBonus}% CP</span>
        </div>
      </div>
    </div>
  );
}

export default function LocationView() {
  const {
    currentLocation, startBattle, startBossBattle, returnToWorld,
    bossesDefeated, level, heroRoster, activeHeroIds, zoneConquer,
    zoneStats, completedQuests, completeQuest, gold,
  } = useGameStore();
  useEffect(() => { setBgm('scene'); }, []);
  const loc = locations.find(l => l.id === currentLocation);
  if (!loc) return null;

  const bossDefeated = loc.boss ? bossesDefeated.includes(loc.boss) : false;
  const conquer = (zoneConquer || {})[currentLocation] || 0;

  const activeHeroes = heroRoster.filter(h =>
    h.id === 'player' || (activeHeroIds || []).includes(h.id)
  );
  const primaryHero = activeHeroes[0];
  const primaryClass = primaryHero?.classId || 'warrior';
  const clsColor = classDefinitions[primaryClass]?.color || '#6ee7b7';

  const quests = getQuestsForZone(currentLocation);
  const zoneCompleted = (completedQuests || {})[currentLocation] || [];
  const zStats = (zoneStats || {})[currentLocation] || { kills: 0, flawless: 0 };
  const gameState = { bossesDefeated, zoneConquer };

  const completedCount = zoneCompleted.length;
  const totalQuests = quests.length;

  const handleCompleteQuest = (quest) => {
    completeQuest(currentLocation, quest.id, quest.rewards, quest.conquerBonus);
  };

  return (
    <div style={{
      width: '100%', height: '100%', overflow: 'hidden',
      background: loc.bgGradient, position: 'relative',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.2), rgba(0,0,0,0.6))',
      }} />

      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', height: '100%', overflow: 'hidden',
      }}>
        <div style={{
          flex: 1, overflowY: 'auto', padding: '14px 16px 14px 20px',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <button onClick={returnToWorld} style={{
              background: 'rgba(42,49,80,0.8)', border: '1px solid var(--border)',
              borderRadius: 6, padding: '4px 10px', color: 'var(--text)',
              cursor: 'pointer', fontSize: '0.7rem', flexShrink: 0,
            }}
            onMouseEnter={e => e.target.style.background = 'rgba(60,70,100,0.9)'}
            onMouseLeave={e => e.target.style.background = 'rgba(42,49,80,0.8)'}
            >
              &#8592; Map
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: '1.4rem' }}>{loc.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 className="font-cinzel" style={{ color: 'var(--gold)', fontSize: '1.05rem', margin: 0, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {loc.name}
                </h2>
                <div style={{ fontSize: '0.6rem', color: 'var(--muted)', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span>Lv.{loc.levelRange[0]}-{loc.levelRange[1]}</span>
                  {bossDefeated && <span style={{ color: 'var(--gold)' }}>Boss Cleared</span>}
                  {conquer > 0 && <span style={{ color: conquer >= 100 ? 'var(--gold)' : clsColor, fontWeight: 600 }}>CP: {Math.floor(conquer)}%</span>}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
              <button onClick={() => startBattle(currentLocation)} style={{
                background: 'linear-gradient(135deg, var(--accent), #10b981)',
                border: 'none', borderRadius: 7, padding: '7px 14px',
                color: '#0b1020', fontWeight: 700, fontSize: '0.75rem',
                cursor: 'pointer', fontFamily: "'Cinzel', serif",
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
              onMouseEnter={e => { e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 4px 12px rgba(110,231,183,0.4)'; }}
              onMouseLeave={e => { e.target.style.transform = 'none'; e.target.style.boxShadow = 'none'; }}
              >
                <img src="/images/hunt_battle.png" alt="" style={{ width: 18, height: 18, borderRadius: 3, objectFit: 'cover' }} /> Hunt
              </button>
              {loc.boss && !bossDefeated && (
                <button onClick={() => startBossBattle(loc.boss)} style={{
                  background: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.1))',
                  border: '2px solid var(--danger)', borderRadius: 7, padding: '7px 14px',
                  color: 'var(--danger)', fontWeight: 700, fontSize: '0.75rem',
                  cursor: 'pointer', fontFamily: "'Cinzel', serif",
                  transition: 'all 0.2s', animation: 'glow 2s infinite',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
                onMouseEnter={e => e.target.style.transform = 'translateY(-1px)'}
                onMouseLeave={e => e.target.style.transform = 'none'}
                >
                  <InlineIcon name="skull" size={14} style={{ marginRight: 0 }} /> Boss
                </button>
              )}
            </div>
          </div>

          {conquer > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ height: 4, background: 'rgba(0,0,0,0.4)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${conquer}%`, borderRadius: 2,
                  background: conquer >= 100 ? 'linear-gradient(90deg, var(--gold), #ffed4a)' : `linear-gradient(90deg, ${clsColor}, ${clsColor}80)`,
                  transition: 'width 0.3s',
                }} />
              </div>
            </div>
          )}

          <div style={{
            flex: 1, overflowY: 'auto',
            background: 'rgba(14,22,48,0.85)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12, padding: '12px 14px',
            backdropFilter: 'blur(10px)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div>
                <h3 className="font-cinzel" style={{ color: 'var(--gold)', fontSize: '0.85rem', margin: 0, display: 'flex', alignItems: 'center' }}>
                  <InlineIcon name="scroll" size={16} style={{ marginRight: 6 }} />Zone Quests
                </h3>
                <div style={{ fontSize: '0.5rem', color: 'var(--muted)', marginTop: 1 }}>
                  Complete quests for rewards & faster conquering
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', gap: 5, fontSize: '0.45rem' }}>
                  <span style={{ color: 'var(--muted)', background: 'rgba(0,0,0,0.3)', padding: '2px 5px', borderRadius: 3 }}>
                    Kills: {zStats.kills}
                  </span>
                  <span style={{ color: 'var(--muted)', background: 'rgba(0,0,0,0.3)', padding: '2px 5px', borderRadius: 3 }}>
                    Flawless: {zStats.flawless}
                  </span>
                </div>
                <div style={{
                  background: completedCount === totalQuests ? 'rgba(255,215,0,0.15)' : 'rgba(110,231,183,0.1)',
                  border: `1px solid ${completedCount === totalQuests ? 'var(--gold)' : 'var(--accent)'}40`,
                  borderRadius: 5, padding: '2px 7px',
                }}>
                  <span style={{
                    fontSize: '0.6rem', fontWeight: 700,
                    color: completedCount === totalQuests ? 'var(--gold)' : 'var(--accent)',
                  }}>
                    {completedCount}/{totalQuests}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {quests.map(quest => (
                <QuestItem
                  key={quest.id}
                  quest={quest}
                  zoneId={currentLocation}
                  zoneStats={zStats}
                  gameState={gameState}
                  completed={zoneCompleted.includes(quest.id)}
                  onComplete={handleCompleteQuest}
                />
              ))}
            </div>
          </div>
        </div>

        <div style={{
          width: 240, flexShrink: 0, overflowY: 'auto',
          padding: '14px 12px 14px 0',
          borderLeft: '1px solid rgba(255,255,255,0.04)',
        }}>
          <div style={{
            fontSize: '0.6rem', color: 'var(--gold)', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: 1.5,
            marginBottom: 8, textAlign: 'center',
            fontFamily: "'Cinzel', serif",
          }}>
            Party ({activeHeroes.length})
          </div>

          {activeHeroes.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.65rem', padding: 16 }}>
              No active heroes
            </div>
          )}

          {activeHeroes.map((hero, idx) => (
            <HeroCard key={hero.id} hero={hero} isLeader={idx === 0} conquer={conquer} />
          ))}
        </div>
      </div>
    </div>
  );
}
