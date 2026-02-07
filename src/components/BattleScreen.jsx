import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import useGameStore from '../stores/gameStore';
import { classDefinitions } from '../data/classes';
import SpriteAnimation from './SpriteAnimation';
import { getPlayerSprite, getEnemySprite, getWorgTransformSprite } from '../data/spriteMap';
import AmbientParticles, { CastingParticles, HitParticles, HealParticles } from './BattleParticles';
import { playSwordHit, playMagicCast, playHeal, playBuff, playHurt, playCrit, playDodge, playVictory, playDefeat, setBgm } from '../utils/audioManager';

const locationBackgrounds = {
  verdant_plains: '/backgrounds/verdant_plains.png',
  dark_forest: '/backgrounds/dark_forest.png',
  cursed_ruins: '/backgrounds/cursed_ruins.png',
  blood_canyon: '/backgrounds/blood_canyon.png',
  dragon_peaks: '/backgrounds/dragon_peaks.png',
  shadow_citadel: '/backgrounds/shadow_citadel.png',
  demon_gate: '/backgrounds/demon_gate.png',
  void_throne: '/backgrounds/void_throne.png',
};

function MiniBar({ current, max, color, height = 5, width = 60 }) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  return (
    <div style={{
      height, width, background: 'rgba(0,0,0,0.6)', borderRadius: height / 2,
      overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)',
    }}>
      <div style={{
        height: '100%', width: `${pct}%`,
        background: `linear-gradient(90deg, ${color}, ${color}cc)`,
        borderRadius: height / 2, transition: 'width 0.4s ease',
      }} />
    </div>
  );
}

function getUnitSprite(unit) {
  if (unit.team === 'player' && unit.classId) {
    if (unit.classId === 'worg' && unit.bearForm) {
      return getWorgTransformSprite(unit.raceId);
    }
    return getPlayerSprite(unit.classId, unit.raceId);
  }
  if (unit.templateId) {
    return getEnemySprite(unit.templateId);
  }
  return getPlayerSprite('warrior');
}

function isRangedUnit(unit) {
  if (unit.classId === 'ranger' || unit.classId === 'mage') return true;
  if (unit.templateId === 'dark_mage' || unit.templateId === 'lich') return true;
  return false;
}

function getProjectileColor(unit, abilityName) {
  if (!abilityName) return '#e2e8f0';
  const n = abilityName.toLowerCase();
  if (n.includes('fire') || n.includes('hellfire') || n.includes('meteor')) return '#f97316';
  if (n.includes('shadow') || n.includes('dark') || n.includes('void') || n.includes('death') || n.includes('soul')) return '#7c3aed';
  if (n.includes('ice') || n.includes('frost')) return '#38bdf8';
  if (n.includes('drain')) return '#a855f7';
  if (n.includes('arcane')) return '#8b5cf6';
  if (n.includes('arrow') || n.includes('shot') || n.includes('poison')) return '#22c55e';
  if (unit.classId === 'mage') return '#8b5cf6';
  if (unit.classId === 'ranger') return '#22c55e';
  return '#e2e8f0';
}

export default function BattleScreen() {
  const {
    battleState, battleUnits, battleTurnOrder, battleCurrentTurn,
    selectedTargetId, lastAction, battleLog, playerClass, playerName,
    level, cooldowns, currentLocation,
    useAbility, processAIAction, advanceTurn, setSelectedTarget,
    returnToWorld, startBattle,
    playerHealth, playerMana, playerStamina,
    playerMaxHealth, playerMaxMana, playerMaxStamina,
  } = useGameStore();

  const [unitAnims, setUnitAnims] = useState({});
  const [dashPositions, setDashPositions] = useState({});
  const [projectiles, setProjectiles] = useState([]);
  const [floatingDmg, setFloatingDmg] = useState([]);
  const [introComplete, setIntroComplete] = useState(false);
  const [activeParticles, setActiveParticles] = useState([]);
  const logRef = useRef(null);
  const actionProcessed = useRef(null);
  const introStarted = useRef(false);
  const aiProcessing = useRef(false);

  const phase = battleState?.phase;
  const isBoss = battleState?.isBoss;
  const bgImage = locationBackgrounds[currentLocation] || null;

  const currentUnitId = battleTurnOrder[battleCurrentTurn];
  const currentUnit = battleUnits.find(u => u.id === currentUnitId);
  const playerUnit = battleUnits.find(u => u.id === 'player');

  const playerTeam = useMemo(() => battleUnits.filter(u => u.team === 'player'), [battleUnits]);
  const enemyTeam = useMemo(() => battleUnits.filter(u => u.team === 'enemy'), [battleUnits]);

  const isPlayerTurn = phase === 'player_turn';
  const currentCls = currentUnit?.classId ? classDefinitions[currentUnit.classId] : null;

  useEffect(() => {
    setBgm('battle');
    return () => setBgm('ambient');
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [battleLog]);

  useEffect(() => {
    if (phase === 'intro' && !introStarted.current) {
      introStarted.current = true;
      setTimeout(() => {
        setIntroComplete(true);
        setTimeout(() => advanceTurn(), 300);
      }, 1000);
    }
  }, [phase]);

  useEffect(() => {
    if (phase === 'ai_turn' && introComplete && !aiProcessing.current) {
      aiProcessing.current = true;
      const timer = setTimeout(() => {
        processAIAction();
        aiProcessing.current = false;
      }, 600);
      return () => { clearTimeout(timer); aiProcessing.current = false; };
    }
  }, [phase, battleCurrentTurn, introComplete]);

  useEffect(() => {
    if (phase === 'victory') playVictory();
    if (phase === 'defeat') playDefeat();
  }, [phase]);

  const addParticle = useCallback((type, x, y, color) => {
    const id = Date.now() + Math.random();
    setActiveParticles(prev => [...prev, { id, type, x, y, color }]);
    setTimeout(() => setActiveParticles(prev => prev.filter(p => p.id !== id)), 1200);
  }, []);

  useEffect(() => {
    if (!lastAction || lastAction === actionProcessed.current) return;
    actionProcessed.current = lastAction;

    const { attackerId, targetId, abilityType, abilityName, totalDmg, evaded, blocked, isCrit, healAmt, type } = lastAction;

    if (type === 'stunned') {
      setTimeout(() => advanceTurn(), 600);
      return;
    }

    const attacker = battleUnits.find(u => u.id === attackerId);
    const target = battleUnits.find(u => u.id === targetId);
    if (!attacker) { setTimeout(() => advanceTurn(), 200); return; }

    const spriteData = getUnitSprite(attacker);
    const getAttackAnim = () => {
      if (abilityType === 'heal' || abilityType === 'heal_over_time') return spriteData.heal ? 'heal' : 'attack1';
      if (abilityType === 'buff') return spriteData.block ? 'block' : 'attack1';
      const anims = ['attack1', 'attack2', 'attack3'].filter(a => spriteData[a]);
      if (totalDmg > 50 && anims.length > 2) return anims[2];
      if (totalDmg > 25 && anims.length > 1) return anims[1];
      return 'attack1';
    };

    if (abilityType === 'physical' || abilityType === 'magical') {
      if (!target) { setTimeout(() => advanceTurn(), 200); return; }

      const ranged = isRangedUnit(attacker) || abilityType === 'magical';

      if (abilityType === 'magical' && attacker.position) {
        addParticle('cast', attacker.position.x, attacker.position.y, getProjectileColor(attacker, abilityName));
        playMagicCast();
      }

      if (ranged) {
        setUnitAnims(prev => ({ ...prev, [attackerId]: getAttackAnim() }));
        setTimeout(() => {
          if (attacker.position && target.position) {
            const projId = Date.now();
            const color = getProjectileColor(attacker, abilityName);
            setProjectiles(prev => [...prev, {
              id: projId,
              startX: attacker.position.x + (attacker.team === 'player' ? 4 : -4),
              startY: attacker.position.y,
              endX: target.position.x,
              endY: target.position.y,
              color,
              phase: 'start',
            }]);
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                setProjectiles(prev => prev.map(p => p.id === projId ? { ...p, phase: 'fly' } : p));
              });
            });
            setTimeout(() => {
              setProjectiles(prev => prev.filter(p => p.id !== projId));
              showDamageFloat(target, totalDmg, evaded, blocked, isCrit);
              if (!evaded) {
                setUnitAnims(prev => ({ ...prev, [targetId]: 'hurt' }));
                addParticle('hit', target.position.x, target.position.y, '#ef4444');
                if (isCrit) playCrit(); else playHurt();
              } else {
                playDodge();
              }
              setTimeout(() => setUnitAnims(prev => ({ ...prev, [targetId]: target.health > 0 ? 'idle' : 'death' })), 400);
            }, 500);
          }
          setTimeout(() => setUnitAnims(prev => ({ ...prev, [attackerId]: 'idle' })), 600);
        }, 250);
        setTimeout(() => advanceTurn(), 1300);
      } else {
        if (abilityType === 'physical') playSwordHit();
        if (attacker.position && target.position) {
          const dashX = target.position.x + (attacker.team === 'player' ? -8 : 8);
          const dashY = target.position.y;
          setDashPositions(prev => ({ ...prev, [attackerId]: { x: dashX, y: dashY } }));
        }
        setTimeout(() => {
          setUnitAnims(prev => ({ ...prev, [attackerId]: getAttackAnim() }));
        }, 300);
        setTimeout(() => {
          showDamageFloat(target, totalDmg, evaded, blocked, isCrit);
          if (!evaded) {
            setUnitAnims(prev => ({ ...prev, [targetId]: 'hurt' }));
            if (target.position) addParticle('hit', target.position.x, target.position.y, '#ef4444');
            if (isCrit) playCrit(); else playHurt();
          } else {
            playDodge();
          }
          setTimeout(() => setUnitAnims(prev => ({ ...prev, [targetId]: target.health > 0 ? 'idle' : 'death' })), 400);
        }, 500);
        setTimeout(() => {
          setDashPositions(prev => ({ ...prev, [attackerId]: null }));
          setUnitAnims(prev => ({ ...prev, [attackerId]: 'idle' }));
        }, 800);
        setTimeout(() => advanceTurn(), 1300);
      }
    } else {
      setUnitAnims(prev => ({ ...prev, [attackerId]: getAttackAnim() }));
      if (healAmt && target) {
        showHealFloat(target, healAmt);
        if (target.position) addParticle('heal', target.position.x, target.position.y);
        playHeal();
      } else if (abilityType === 'heal_over_time') {
        playHeal();
        if (attacker.position) addParticle('heal', attacker.position.x, attacker.position.y);
      } else {
        playBuff();
        if (attacker.position) addParticle('cast', attacker.position.x, attacker.position.y, '#6ee7b7');
      }
      setTimeout(() => setUnitAnims(prev => ({ ...prev, [attackerId]: 'idle' })), 600);
      setTimeout(() => advanceTurn(), 900);
    }
  }, [lastAction]);

  const showDamageFloat = useCallback((target, totalDmg, evaded, blocked, isCrit) => {
    if (!target?.position) return;
    const id = Date.now() + Math.random();
    let text, color;
    if (evaded) { text = 'DODGE!'; color = '#6ee7b7'; }
    else if (blocked) { text = `BLOCK ${totalDmg}`; color = '#3b82f6'; }
    else if (isCrit) { text = `CRIT ${totalDmg}`; color = '#fbbf24'; }
    else { text = `-${totalDmg}`; color = '#ef4444'; }
    setFloatingDmg(prev => [...prev, { id, text, color, x: target.position.x, y: target.position.y - 8 }]);
    setTimeout(() => setFloatingDmg(prev => prev.filter(f => f.id !== id)), 1500);
  }, []);

  const showHealFloat = useCallback((target, healAmt) => {
    if (!target?.position) return;
    const id = Date.now() + Math.random();
    setFloatingDmg(prev => [...prev, { id, text: `+${healAmt}`, color: '#22c55e', x: target.position.x, y: target.position.y - 8 }]);
    setTimeout(() => setFloatingDmg(prev => prev.filter(f => f.id !== id)), 1500);
  }, []);

  const handleAbility = useCallback((abilityId) => {
    if (phase !== 'player_turn') return;
    useAbility(abilityId);
  }, [phase, useAbility]);

  useEffect(() => {
    if (phase !== 'player_turn') return;
    const abilities = currentCls?.abilities;
    if (!abilities) return;
    const handleKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const num = parseInt(e.key);
      if (num >= 1 && num <= abilities.length) {
        const ability = abilities[num - 1];
        if (!currentUnit) return;
        const onCd = (currentUnit.cooldowns[ability.id] || 0) > 0;
        const noMana = (ability.manaCost || 0) > currentUnit.mana;
        const noStamina = (ability.staminaCost || 0) > currentUnit.stamina;
        if (!onCd && !noMana && !noStamina) handleAbility(ability.id);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [phase, currentCls, currentUnit, handleAbility]);

  if (!battleState || battleUnits.length === 0) return null;

  const isVictory = phase === 'victory';
  const isDefeat = phase === 'defeat';

  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      background: 'var(--bg)', position: 'relative', overflow: 'hidden'
    }}>
      {bgImage && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: 0.55, zIndex: 0,
        }} />
      )}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        background: 'linear-gradient(180deg, rgba(11,16,32,0.2) 0%, rgba(11,16,32,0.4) 50%, rgba(11,16,32,0.8) 100%)',
        zIndex: 0,
      }} />

      <div style={{
        flex: '0 0 auto', padding: '6px 16px', background: 'rgba(0,0,0,0.6)',
        borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', zIndex: 10, backdropFilter: 'blur(4px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="font-cinzel" style={{ color: isBoss ? 'var(--gold)' : 'var(--accent)', fontSize: '0.8rem' }}>
            {isBoss ? 'BOSS BATTLE' : 'BATTLE'}
          </span>
          <span style={{ color: 'var(--muted)', fontSize: '0.7rem' }}>Turn {battleState.turnCount}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {currentUnit && !isVictory && !isDefeat && (
            <div style={{
              color: currentUnit.team === 'player' ? 'var(--accent)' : 'var(--danger)',
              fontSize: '0.7rem', fontWeight: 600,
              padding: '2px 8px',
              background: currentUnit.team === 'player' ? 'rgba(110,231,183,0.15)' : 'rgba(239,68,68,0.15)',
              borderRadius: 6,
              border: `1px solid ${currentUnit.team === 'player' ? 'var(--accent)' : 'var(--danger)'}`,
            }}>
              {currentUnit.isPlayerControlled ? `${currentUnit.name}'s TURN` : `${currentUnit.name}'s turn`}
            </div>
          )}
          {(isVictory || isDefeat) && (
            <button onClick={returnToWorld} style={{
              background: 'var(--border)', border: 'none', borderRadius: 8,
              padding: '4px 12px', color: 'var(--text)', cursor: 'pointer', fontSize: '0.75rem'
            }}>Return</button>
          )}
        </div>
      </div>

      <div style={{
        flex: 1, position: 'relative', zIndex: 1, minHeight: 0, overflow: 'hidden',
      }}>
        <AmbientParticles />

        {battleUnits.map((unit, idx) => {
          if (!unit.position) return null;
          const dash = dashPositions[unit.id];
          const posX = dash ? dash.x : unit.position.x;
          const posY = dash ? dash.y : unit.position.y;
          const spriteData = getUnitSprite(unit);
          const anim = unitAnims[unit.id] || 'idle';
          const isCurrentTurnUnit = currentUnit?.id === unit.id;
          const isSelected = selectedTargetId === unit.id;
          const isEnemyClickable = unit.team === 'enemy' && unit.alive && isPlayerTurn;
          const flipSprite = unit.team === 'enemy';
          const introDelay = introComplete ? 0 : (idx * 100);
          const spriteScale = 1.5;

          return (
            <div
              key={unit.id}
              onClick={() => isEnemyClickable && setSelectedTarget(unit.id)}
              style={{
                position: 'absolute',
                left: `${posX}%`,
                top: `${posY}%`,
                transform: 'translate(-50%, -50%)',
                transition: dash ? 'left 0.3s ease-out, top 0.3s ease-out' : 'left 0.5s ease, top 0.5s ease',
                cursor: isEnemyClickable ? 'pointer' : 'default',
                opacity: introComplete ? (unit.alive ? 1 : 0.4) : 0,
                animation: introComplete ? 'none' : `unitSlideIn 0.6s ease ${introDelay}ms forwards`,
                zIndex: Math.floor(posY),
                pointerEvents: unit.alive ? 'auto' : 'none',
              }}
            >
              {isCurrentTurnUnit && unit.alive && (
                <div style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  width: 0, height: 0,
                  borderLeft: '6px solid transparent', borderRight: '6px solid transparent',
                  borderTop: `8px solid ${unit.team === 'player' ? 'var(--accent)' : 'var(--danger)'}`,
                  animation: 'pulse 1s infinite',
                  filter: `drop-shadow(0 0 4px ${unit.team === 'player' ? 'var(--accent)' : 'var(--danger)'})`,
                }} />
              )}

              {isSelected && unit.alive && (
                <div style={{
                  position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)',
                  width: 40, height: 10, borderRadius: '50%',
                  background: 'rgba(239,68,68,0.4)',
                  border: '2px solid var(--danger)',
                  animation: 'pulse 1s infinite',
                }} />
              )}

              <div style={{
                filter: isCurrentTurnUnit && unit.alive
                  ? `drop-shadow(0 0 8px ${unit.team === 'player' ? 'rgba(110,231,183,0.6)' : 'rgba(239,68,68,0.6)'})`
                  : 'none',
                transition: 'filter 0.3s',
              }}>
                <SpriteAnimation
                  spriteData={spriteData}
                  animation={anim}
                  scale={spriteScale}
                  flip={flipSprite}
                  speed={150}
                  loop={anim === 'idle' || anim === 'walk'}
                />
              </div>

              <div style={{
                textAlign: 'center', marginTop: -4,
                background: 'rgba(0,0,0,0.5)', borderRadius: 6, padding: '2px 6px',
                backdropFilter: 'blur(2px)', minWidth: 65,
              }}>
                <div style={{
                  fontSize: '0.55rem', fontWeight: 600,
                  color: unit.id === 'player' ? 'var(--accent)' : (unit.team === 'player' ? '#93c5fd' : '#fca5a5'),
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 75,
                }}>
                  {unit.name}
                </div>
                <MiniBar current={unit.health} max={unit.maxHealth} color={unit.team === 'player' ? '#22c55e' : '#ef4444'} height={4} width={60} />
                {unit.team === 'player' && (
                  <div style={{ display: 'flex', gap: 2, marginTop: 1, justifyContent: 'center' }}>
                    <MiniBar current={unit.mana} max={unit.maxMana} color="#3b82f6" height={3} width={28} />
                    <MiniBar current={unit.stamina} max={unit.maxStamina} color="#f59e0b" height={3} width={28} />
                  </div>
                )}
                {unit.buffs?.length > 0 && (
                  <div style={{ display: 'flex', gap: 1, justifyContent: 'center', marginTop: 1, flexWrap: 'wrap' }}>
                    {unit.buffs.slice(0, 3).map((b, i) => (
                      <span key={i} style={{
                        fontSize: '0.4rem', padding: '0 2px', borderRadius: 2,
                        background: 'rgba(110,231,183,0.3)', color: 'var(--accent)',
                      }}>{b.source?.slice(0, 4)}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {activeParticles.map(p => {
          if (p.type === 'cast') return <CastingParticles key={p.id} x={p.x} y={p.y} color={p.color} />;
          if (p.type === 'hit') return <HitParticles key={p.id} x={p.x} y={p.y} color={p.color} />;
          if (p.type === 'heal') return <HealParticles key={p.id} x={p.x} y={p.y} />;
          return null;
        })}

        {projectiles.map(p => (
          <div key={p.id} style={{
            position: 'absolute',
            left: `${p.phase === 'fly' ? p.endX : p.startX}%`,
            top: `${p.phase === 'fly' ? p.endY : p.startY}%`,
            width: 14, height: 14,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${p.color}, ${p.color}88, transparent)`,
            boxShadow: `0 0 12px ${p.color}, 0 0 24px ${p.color}66, 0 0 4px #fff`,
            transition: 'left 0.45s ease-in, top 0.45s ease-in',
            transform: 'translate(-50%, -50%)',
            zIndex: 200,
            pointerEvents: 'none',
          }} />
        ))}

        {floatingDmg.map(f => (
          <div key={f.id} style={{
            position: 'absolute',
            left: `${f.x}%`, top: `${f.y}%`,
            transform: 'translate(-50%, 0)',
            color: f.color, fontWeight: 800, fontSize: '1rem',
            textShadow: `0 0 8px ${f.color}, 0 2px 4px rgba(0,0,0,0.8)`,
            animation: 'floatUp 1.5s ease forwards',
            pointerEvents: 'none', zIndex: 300,
            fontFamily: "'Cinzel', serif",
          }}>
            {f.text}
          </div>
        ))}

        {(isVictory || isDefeat) && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            textAlign: 'center', animation: 'slideUp 0.5s ease', zIndex: 100,
            background: 'rgba(11,16,32,0.9)', padding: '24px 40px', borderRadius: 16,
            border: `2px solid ${isVictory ? 'var(--gold)' : 'var(--danger)'}`,
            backdropFilter: 'blur(8px)',
          }}>
            <div className="font-cinzel" style={{
              fontSize: '1.8rem',
              color: isVictory ? 'var(--gold)' : 'var(--danger)',
              textShadow: `0 0 20px ${isVictory ? 'rgba(255,215,0,0.4)' : 'rgba(239,68,68,0.4)'}`
            }}>
              {isVictory ? 'VICTORY!' : 'DEFEAT'}
            </div>
            {isVictory && (
              <div style={{ color: 'var(--accent)', marginTop: 8, fontSize: '0.8rem' }}>
                +{battleUnits.filter(u => u.team === 'enemy').reduce((s, e) => s + (e.xpReward || 0), 0)} XP |
                +{battleUnits.filter(u => u.team === 'enemy').reduce((s, e) => s + (e.goldReward || 0), 0)} Gold
              </div>
            )}
            {isDefeat && (
              <div style={{ color: 'var(--muted)', marginTop: 8, fontSize: '0.75rem' }}>
                Recover at 50% HP, lose 10% gold.
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'center' }}>
              {isVictory && currentLocation && (
                <button onClick={() => startBattle(currentLocation)} style={{
                  background: 'linear-gradient(135deg, var(--accent), #10b981)',
                  border: 'none', borderRadius: 10, padding: '8px 16px',
                  color: '#0b1020', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem'
                }}>Fight Again</button>
              )}
              <button onClick={returnToWorld} style={{
                background: isDefeat ? 'linear-gradient(135deg, rgba(239,68,68,0.3), rgba(239,68,68,0.1))' : 'var(--border)',
                border: isDefeat ? '2px solid var(--danger)' : 'none',
                borderRadius: 10, padding: '8px 16px',
                color: isDefeat ? 'var(--danger)' : 'var(--text)',
                fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem'
              }}>
                {isDefeat ? 'Retreat & Recover' : 'Return to World'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{
        flex: '0 0 60px', background: 'rgba(0,0,0,0.65)',
        borderTop: '1px solid var(--border)', padding: '4px 10px',
        overflow: 'auto', fontSize: '0.7rem', zIndex: 10,
        backdropFilter: 'blur(4px)',
      }} ref={logRef}>
        <div style={{
          color: 'var(--muted)', fontSize: '0.55rem', fontWeight: 600,
          marginBottom: 2, letterSpacing: 1, textTransform: 'uppercase'
        }}>Battle Log</div>
        {battleLog.map((msg, i) => (
          <div key={i} style={{
            color: i === battleLog.length - 1 ? 'var(--text)' : 'var(--muted)',
            padding: '0.5px 0', opacity: i === battleLog.length - 1 ? 1 : 0.65,
            fontSize: '0.68rem',
          }}>{msg}</div>
        ))}
      </div>

      {!isVictory && !isDefeat && (
        <div style={{
          flex: '0 0 auto', minHeight: 80,
          background: isPlayerTurn ? 'rgba(14,22,48,0.95)' : (currentUnit?.team === 'enemy' ? 'rgba(30,10,10,0.95)' : 'rgba(14,22,48,0.90)'),
          borderTop: `2px solid ${isPlayerTurn ? 'var(--accent)' : (currentUnit?.team === 'enemy' ? 'var(--danger)' : '#3b82f6')}`,
          padding: '8px 10px', zIndex: 10,
          backdropFilter: 'blur(4px)',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          transition: 'background 0.3s, border-color 0.3s',
        }}>
          {isPlayerTurn && currentUnit ? (
            <>
              <div style={{
                textAlign: 'center', marginBottom: 4, color: 'var(--muted)',
                fontSize: '0.6rem', letterSpacing: 1
              }}>
                <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{currentUnit.name}</span>
                {' — '}Choose action <span style={{ color: 'var(--accent)' }}>(1-{currentCls?.abilities.length})</span>
                {selectedTargetId && (
                  <span style={{ color: 'var(--danger)', marginLeft: 8 }}>
                    Target: {battleUnits.find(u => u.id === selectedTargetId)?.name || '—'}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
                {currentCls?.abilities.map((ability, idx) => {
                  const onCd = (currentUnit.cooldowns[ability.id] || 0) > 0;
                  const noMana = (ability.manaCost || 0) > currentUnit.mana;
                  const noStamina = (ability.staminaCost || 0) > currentUnit.stamina;
                  const alreadyTransformed = ability.isBearForm && currentUnit.bearForm;
                  const disabled = onCd || noMana || noStamina || alreadyTransformed;
                  return (
                    <button key={ability.id} onClick={() => !disabled && handleAbility(ability.id)}
                      title={`${ability.description}\n${ability.manaCost ? `MP: ${ability.manaCost}` : ''} ${ability.staminaCost ? `SP: ${ability.staminaCost}` : ''}`}
                      style={{
                        background: disabled ? 'rgba(42,49,80,0.3)' : 'linear-gradient(135deg, rgba(42,49,80,0.8), rgba(42,49,80,0.5))',
                        border: `2px solid ${disabled ? 'var(--border)' : 'var(--accent)'}`,
                        borderRadius: 8, padding: '5px 10px', minWidth: 90,
                        color: disabled ? 'var(--muted)' : 'var(--text)',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s', textAlign: 'center', opacity: disabled ? 0.5 : 1,
                        position: 'relative',
                      }}
                      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}}
                      onMouseLeave={e => { if (!disabled) { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'none'; }}}
                    >
                      <div style={{
                        position: 'absolute', top: -5, left: -5,
                        background: disabled ? '#444' : 'var(--accent)', borderRadius: '50%',
                        width: 16, height: 16, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: '0.55rem', fontWeight: 700,
                        color: disabled ? '#888' : '#0b1020', border: '1px solid rgba(0,0,0,0.3)'
                      }}>{idx + 1}</div>
                      <div style={{ fontSize: '0.9rem', marginBottom: 0 }}>{ability.icon}</div>
                      <div style={{ fontWeight: 600, fontSize: '0.65rem' }}>{ability.name}</div>
                      <div style={{ fontSize: '0.5rem', color: 'var(--muted)', marginTop: 0 }}>
                        {ability.manaCost > 0 && <span style={{ color: '#3b82f6' }}>{ability.manaCost}MP </span>}
                        {ability.staminaCost > 0 && <span style={{ color: '#f59e0b' }}>{ability.staminaCost}SP</span>}
                      </div>
                      {onCd && (
                        <div style={{
                          position: 'absolute', top: 2, right: 2,
                          background: 'var(--danger)', borderRadius: '50%',
                          width: 14, height: 14, display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: '0.5rem', fontWeight: 700
                        }}>{currentUnit.cooldowns[ability.id]}</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div style={{
              color: currentUnit?.team === 'enemy' ? 'var(--danger)' : '#93c5fd',
              fontSize: '0.8rem', fontWeight: 600,
              animation: 'pulse 1s infinite', textAlign: 'center'
            }}>
              {currentUnit?.name || 'Processing'}{phase === 'animating' ? ' attacks...' : ' is acting...'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
