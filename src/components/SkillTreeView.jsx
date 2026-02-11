import React from 'react';
import useGameStore from '../stores/gameStore';
import { skillTrees } from '../data/skillTrees';
import AbilityIcon from './AbilityIcon';

export default function SkillTreeView() {
  const { setScreen, playerClass, level, skillPoints, unlockedSkills, unlockSkill } = useGameStore();
  const tree = skillTrees[playerClass];

  if (!tree) return null;

  const isSkillAvailable = (skill, tier) => {
    if (level < tier.requiredLevel) return false;
    if (skill.requires && !(unlockedSkills[skill.requires] > 0)) return false;
    const current = unlockedSkills[skill.id] || 0;
    if (current >= skill.maxPoints) return false;
    if (skillPoints <= 0) return false;
    return true;
  };

  const isSkillUnlocked = (skillId) => (unlockedSkills[skillId] || 0) > 0;
  const isMaxed = (skill) => (unlockedSkills[skill.id] || 0) >= skill.maxPoints;

  return (
    <div style={{
      width: '100%', height: '100%', overflow: 'auto',
      background: 'linear-gradient(180deg, rgba(5,10,21,0.8), rgba(11,16,32,0.75), rgba(20,26,43,0.7))'
    }}>
      <header style={{
        background: 'linear-gradient(135deg, rgba(14,22,48,0.9), rgba(20,26,43,0.7))',
        borderBottom: `2px solid ${tree.color}`, padding: '12px 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <button onClick={() => setScreen('world')} style={{
          background: 'var(--border)', border: 'none', borderRadius: 8,
          padding: '8px 16px', color: 'var(--text)', cursor: 'pointer'
        }}>← Back</button>
        <div style={{ textAlign: 'center' }}>
          <h1 className="font-cinzel" style={{ color: tree.color, fontSize: '1.2rem' }}>
            {tree.className} Skill Tree
          </h1>
          <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Level {level}</div>
        </div>
        <div style={{
          background: `rgba(110,231,183,0.1)`, border: '1px solid var(--accent)',
          borderRadius: 8, padding: '6px 14px', textAlign: 'center'
        }}>
          <div style={{ color: 'var(--muted)', fontSize: '0.7rem' }}>Skill Points</div>
          <div style={{ color: 'var(--accent)', fontSize: '1.3rem', fontWeight: 700 }}>{skillPoints}</div>
        </div>
      </header>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: 30 }}>
        {tree.tiers.map((tier, tierIdx) => {
          const tierLocked = level < tier.requiredLevel;
          return (
            <div key={tierIdx} style={{ marginBottom: 40, position: 'relative' }}>
              {tierIdx > 0 && (
                <div style={{
                  position: 'absolute', top: -20, left: '50%', width: 2, height: 20,
                  background: tierLocked ? 'var(--border)' : tree.color, transform: 'translateX(-50%)'
                }} />
              )}
              <div style={{
                textAlign: 'center', marginBottom: 16,
                color: tierLocked ? 'var(--muted)' : 'var(--gold)',
                fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1
              }}>
                {tier.name}
                {tierLocked && <span style={{ color: 'var(--danger)', marginLeft: 8, fontSize: '0.75rem' }}>
                  (Requires Lv.{tier.requiredLevel})
                </span>}
              </div>

              <div style={{
                display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap'
              }}>
                {tier.skills.map(skill => {
                  const available = isSkillAvailable(skill, tier);
                  const unlocked = isSkillUnlocked(skill.id);
                  const maxed = isMaxed(skill);
                  const current = unlockedSkills[skill.id] || 0;
                  const locked = tierLocked || (skill.requires && !isSkillUnlocked(skill.requires));

                  return (
                    <div key={skill.id}
                      onClick={() => available && unlockSkill(skill.id)}
                      style={{
                        background: maxed
                          ? `linear-gradient(135deg, ${tree.color}30, ${tree.color}10)`
                          : unlocked
                          ? 'rgba(42,49,80,0.8)'
                          : 'rgba(20,26,43,0.6)',
                        border: `2px solid ${maxed ? tree.color : unlocked ? 'var(--gold)' : available ? 'var(--accent)' : 'var(--border)'}`,
                        borderRadius: 14, padding: 18, width: 200,
                        cursor: available ? 'pointer' : 'default',
                        opacity: locked ? 0.4 : 1, transition: 'all 0.3s',
                        textAlign: 'center', position: 'relative',
                        animation: available ? 'glow 2s infinite' : 'none'
                      }}
                      onMouseEnter={e => { if (available) e.currentTarget.style.transform = 'translateY(-4px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
                    >
                      <div style={{ marginBottom: 8 }}><AbilityIcon ability={skill} size={48} /></div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: unlocked ? 'var(--gold)' : 'var(--text)', marginBottom: 4 }}>
                        {skill.name}
                      </div>
                      <div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginBottom: 8 }}>
                        {skill.description}
                      </div>
                      <div style={{ color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>
                        {skill.effect}
                      </div>
                      <div style={{
                        background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: '3px 10px',
                        display: 'inline-block', fontSize: '0.75rem',
                        color: maxed ? tree.color : 'var(--gold)', fontWeight: 700
                      }}>
                        {current}/{skill.maxPoints}
                      </div>
                      {maxed && (
                        <div style={{
                          position: 'absolute', top: -8, right: -8,
                          background: tree.color, borderRadius: '50%',
                          width: 24, height: 24, display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: '0.8rem'
                        }}>✓</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
