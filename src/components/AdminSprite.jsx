import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import SpriteAnimation from './SpriteAnimation';
import { raceClassSpriteMap, effectSprites, beamTrails, abilityEffectMap, weaponSkillEffectMap, enemyAbilityEffects, warriorTransformSprite, worgTransformSprite, projectileSprites, buffVisuals, weaponVisuals, effectLayerPresets, EFFECT_TYPE_TAGS } from '../data/spriteMap';
import { classDefinitions } from '../data/classes';
import { WEAPON_SKILLS, CLASS_EQUIPMENT_RULES } from '../data/equipment';

const races = ['human', 'orc', 'elf', 'undead', 'barbarian', 'dwarf'];
const classes = ['warrior', 'mage', 'worge', 'ranger'];
const allEffectKeys = Object.keys(effectSprites);
const allBeamKeys = ['none', ...Object.keys(beamTrails)];
const allProjectileKeys = Object.keys(projectileSprites);
const allBuffKeys = Object.keys(buffVisuals);
const allWeaponKeys = Object.keys(weaponVisuals);

const TABS = [
  { id: 'characters', label: 'Characters', icon: '\u{1F9D1}' },
  { id: 'effects', label: 'Effects Gallery', icon: '\u{1F4A5}' },
  { id: 'projectiles', label: 'Projectiles', icon: '\u{1F3AF}' },
  { id: 'buffs', label: 'Buffs & Effects', icon: '\u2728' },
  { id: 'weapons', label: 'Weapons', icon: '\u2694\uFE0F' },
  { id: 'layers', label: 'Effect Layers', icon: '\u{1F4DA}' },
];

const EFFECT_CATEGORIES = {
  hits: { label: 'Hit Effects', color: '#ef4444', keys: ['hitEffect1', 'hitEffect2', 'hitEffect3', 'weaponHit', 'hitBurst', 'critSlash'] },
  slashes: { label: 'Slashes & Melee', color: '#f97316', keys: ['slash', 'slashRanged', 'demonSlash1', 'demonSlash2', 'demonSlash3', ...Object.keys(effectSprites).filter(k => k.startsWith('slash') && k !== 'slash' && k !== 'slashRanged')] },
  fire: { label: 'Fire & Explosion', color: '#f59e0b', keys: ['brightFire', 'fire', 'fireSpin', 'fireExplosion', 'fireExplosion2', 'flameLash', 'fireBreath', 'fireBreathHit', 'firebolt', 'flamestrike'] },
  ice: { label: 'Ice & Frost', color: '#38bdf8', keys: ['freezing', 'frozenIce', 'frostbolt', 'iceVfx1', 'iceVfx2', 'iceHit', 'iceRepeatable', 'iceStart', 'iceActive', 'iceVfx2Start', 'iceEnding'] },
  water: { label: 'Water & Nature', color: '#22d3ee', keys: ['waterSpike', 'waterSplash', 'waterStartup1', 'waterStartup2', 'waterBall', 'waterBallImpact', 'waterBlast', 'waterBlastEnd', 'earthBump', 'earthWall', 'magicBubbles'] },
  thunder: { label: 'Thunder & Lightning', color: '#facc15', keys: ['thunderHit', 'thunderProjectile', 'thunderProjectile2', 'arcanelighting'] },
  holy: { label: 'Holy & Light', color: '#fde68a', keys: ['holyImpact', 'holyRepeatable', 'holyVfx', 'sunburn', 'beamHoly', 'holylight', 'holyheal', 'healEffect', 'resurrect', 'healingwave', 'healingregen'] },
  dark: { label: 'Dark & Shadow', color: '#a78bfa', keys: ['midnight', 'nebula', 'phantom', 'felSpell', 'vortex'] },
  arcane: { label: 'Arcane & Magic', color: '#818cf8', keys: ['magicSpell', 'magic8', 'blueFire', 'casting', 'magickaHit', 'arcaneslash', 'arcanebolt', 'arcanemist', 'arcanelighting'] },
  wind: { label: 'Wind & Smoke', color: '#4ade80', keys: ['windBreath', 'windHit', 'windProjectile', 'smokeVfx1', 'smokeVfx2', 'smokeVfx3'] },
  impact: { label: 'Retro Impacts', color: '#fb923c', keys: Object.keys(effectSprites).filter(k => k.startsWith('impact')) },
  bullet: { label: 'Bullet Impacts', color: '#e879f9', keys: Object.keys(effectSprites).filter(k => k.startsWith('bullet')) },
  defensive: { label: 'Defensive & Buff', color: '#2dd4bf', keys: ['protectionCircle', 'healEffect', 'resurrect'] },
  smears: { label: 'Smear Trails', color: '#94a3b8', keys: ['smearH1', 'smearH2', 'smearH3', 'smearV1', 'smearV2', 'smearV3'] },
  generic: { label: 'Generic Effects', color: '#a1a1aa', keys: ['effect1', 'effect2', 'effect3', 'effect4', 'thrust1', 'thrust2', 'loading'] },
};

function getEffectUsage(effectKey) {
  const usage = [];
  Object.entries(abilityEffectMap).forEach(([cls, abilities]) => {
    Object.entries(abilities).forEach(([name, fx]) => {
      if (fx.effect === effectKey) usage.push({ type: 'class', class: cls, name });
    });
  });
  Object.entries(weaponSkillEffectMap).forEach(([id, fx]) => {
    if (fx.effect === effectKey) usage.push({ type: 'weapon', id });
  });
  Object.entries(enemyAbilityEffects).forEach(([name, fx]) => {
    if (fx.effect === effectKey) usage.push({ type: 'enemy', name });
  });
  Object.entries(buffVisuals).forEach(([id, b]) => {
    if (b.effect === effectKey) usage.push({ type: 'buff', id, name: b.name });
  });
  Object.entries(weaponVisuals).forEach(([id, w]) => {
    if (w.trail === effectKey) usage.push({ type: 'weapon_trail', id, name: w.name });
  });
  return usage;
}

function getAllSkillsForClass(classId) {
  const skills = [];
  const cls = classDefinitions[classId];
  if (cls) {
    cls.abilities.forEach(ab => {
      skills.push({ id: ab.id, name: ab.name, icon: ab.icon, source: 'class', type: 'class' });
    });
    if (cls.signatureAbility) {
      skills.push({ id: cls.signatureAbility.id, name: cls.signatureAbility.name, icon: cls.signatureAbility.icon, source: 'signature', type: 'class' });
    }
    if (cls.bearFormAbilities) {
      Object.values(cls.bearFormAbilities).forEach(ab => {
        skills.push({ id: ab.id, name: ab.name, icon: ab.icon, source: 'bear_form', type: 'class' });
      });
    }
  }
  const weaponTypes = CLASS_EQUIPMENT_RULES[classId]?.weaponTypes || [];
  weaponTypes.forEach(wt => {
    const ws = WEAPON_SKILLS[wt];
    if (ws) {
      [...(ws.slot1 || []), ...(ws.slot23 || [])].forEach(ab => {
        if (!skills.find(s => s.id === ab.id)) {
          skills.push({ id: ab.id, name: ab.name, icon: ab.icon, source: wt, type: 'weapon' });
        }
      });
    }
  });
  return skills;
}

function getEffectForSkill(classId, skill) {
  if (skill.type === 'weapon' && weaponSkillEffectMap[skill.id]) {
    return weaponSkillEffectMap[skill.id];
  }
  const classEffects = abilityEffectMap[classId];
  if (classEffects && classEffects[skill.name]) {
    return classEffects[skill.name];
  }
  return { effect: 'weaponHit', beam: null, anim: 'attack1' };
}

const defaultLayout = {
  shadowOffsetX: 0, shadowOffsetY: 45, shadowWidth: 60, shadowHeight: 10,
  nameOffsetX: 0, nameOffsetY: -15, hitLocationX: 0, hitLocationY: -10,
  spellPlayX: 0, spellPlayY: -20, effectScale: 1.5, effectOffsetX: 0, effectOffsetY: -20,
};

function EffectSpritePreview({ effectKey, scale = 2, speed = 80, filter = '' }) {
  const [frame, setFrame] = useState(0);
  const intervalRef = useRef(null);
  const effect = effectSprites[effectKey];
  if (!effect) return null;

  const isGrid = effect.cols && effect.rows;
  const totalFrames = effect.frames || 1;

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    let f = 0;
    setFrame(0);
    intervalRef.current = setInterval(() => {
      f++;
      if (f >= totalFrames) f = 0;
      setFrame(f);
    }, speed);
    return () => clearInterval(intervalRef.current);
  }, [effectKey, totalFrames, speed]);

  if (isGrid) {
    const fw = (effect.frameW || 48) * scale;
    const fh = (effect.frameH || 48) * scale;
    const col = frame % effect.cols;
    const row = Math.floor(frame / effect.cols);
    return (
      <div style={{ width: fw, height: fh, overflow: 'hidden', imageRendering: 'pixelated' }}>
        <div style={{
          width: fw, height: fh,
          backgroundImage: `url(${effect.src})`,
          backgroundSize: `${effect.cols * fw}px ${effect.rows * fh}px`,
          backgroundPosition: `-${col * fw}px -${row * fh}px`,
          backgroundRepeat: 'no-repeat', imageRendering: 'pixelated',
          filter: filter || 'none',
        }} />
      </div>
    );
  }

  const gridSize = Math.ceil(Math.sqrt(totalFrames));
  const pixelSize = effect.size ? Math.round(effect.size / gridSize) : 100;
  const displaySize = pixelSize * scale;
  const col = frame % gridSize;
  const row = Math.floor(frame / gridSize);
  return (
    <div style={{ width: displaySize, height: displaySize, overflow: 'hidden', imageRendering: 'pixelated' }}>
      <div style={{
        width: displaySize, height: displaySize,
        backgroundImage: `url(${effect.src})`,
        backgroundSize: `${gridSize * displaySize}px ${gridSize * displaySize}px`,
        backgroundPosition: `-${col * displaySize}px -${row * displaySize}px`,
        backgroundRepeat: 'no-repeat', imageRendering: 'pixelated',
        filter: filter || 'none',
      }} />
    </div>
  );
}

function ProjectileSpritePreview({ projKey, scale = 4, speed = 100 }) {
  const [frame, setFrame] = useState(0);
  const intervalRef = useRef(null);
  const proj = projectileSprites[projKey];
  if (!proj) return null;

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    let f = 0;
    setFrame(0);
    intervalRef.current = setInterval(() => {
      f++;
      if (f >= proj.frames) f = 0;
      setFrame(f);
    }, speed);
    return () => clearInterval(intervalRef.current);
  }, [projKey, proj.frames, speed]);

  if (proj.animated && proj.frameFiles) {
    return (
      <div style={{ width: 128, height: 128, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img
          src={proj.frameFiles[frame]}
          alt={proj.name}
          style={{ maxWidth: 120, maxHeight: 120, imageRendering: 'auto' }}
        />
      </div>
    );
  }

  const fw = (proj.frameW || 32) * scale;
  const fh = (proj.frameH || 32) * scale;
  const col = frame % (proj.cols || 1);
  const row = Math.floor(frame / (proj.cols || 1));
  return (
    <div style={{ width: fw, height: fh, overflow: 'hidden', imageRendering: 'pixelated' }}>
      <div style={{
        width: fw, height: fh,
        backgroundImage: `url(${proj.src})`,
        backgroundSize: `${(proj.cols || 1) * fw}px ${(proj.rows || 1) * fh}px`,
        backgroundPosition: `-${col * fw}px -${row * fh}px`,
        backgroundRepeat: 'no-repeat', imageRendering: 'pixelated',
      }} />
    </div>
  );
}

function DraggableMarker({ label, color, x, y, onChange }) {
  const [dragging, setDragging] = useState(false);
  const startRef = useRef({ x: 0, y: 0, startX: 0, startY: 0 });

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
    startRef.current = { x: e.clientX, y: e.clientY, startX: x, startY: y };
  }, [x, y]);

  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e) => {
      const dx = e.clientX - startRef.current.x;
      const dy = e.clientY - startRef.current.y;
      onChange(startRef.current.startX + dx, startRef.current.startY + dy);
    };
    const handleUp = () => setDragging(false);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [dragging, onChange]);

  return (
    <div onMouseDown={handleMouseDown} style={{
      position: 'absolute', left: x - 6, top: y - 6, width: 12, height: 12,
      borderRadius: '50%', background: color, border: '2px solid #fff',
      cursor: 'grab', zIndex: 100, boxShadow: '0 0 6px rgba(0,0,0,0.8)',
    }} title={label}>
      <div style={{
        position: 'absolute', top: -18, left: '50%', transform: 'translateX(-50%)',
        fontSize: 9, color: '#fff', background: 'rgba(0,0,0,0.7)',
        padding: '1px 4px', borderRadius: 3, whiteSpace: 'nowrap', pointerEvents: 'none',
      }}>{label}</div>
    </div>
  );
}

const S = {
  select: { background: '#1a1a2e', color: '#e0d6c2', border: '1px solid #4a3c28', borderRadius: 4, padding: '4px 8px', fontSize: 13, outline: 'none', minWidth: 140 },
  row: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 },
  label: { color: '#c4b998', fontSize: 12, minWidth: 100, textAlign: 'right' },
  val: { color: '#ffd700', fontSize: 12, minWidth: 36, textAlign: 'left' },
  panel: { background: 'rgba(20,15,30,0.9)', border: '1px solid #4a3c28', borderRadius: 8, padding: 16 },
  h3: { color: '#ffd700', fontFamily: "'Cinzel', serif", fontSize: 15, marginBottom: 10 },
  btn: (bg) => ({ background: bg, color: bg === '#22c55e' ? '#000' : '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }),
};

function EffectLayerEditor({ layers, onChange }) {
  const addLayer = () => {
    onChange([...layers, { effect: 'weaponHit', delay: layers.length * 200, duration: 500, scale: 1.5, filter: '', opacity: 1 }]);
  };
  const removeLayer = (idx) => {
    onChange(layers.filter((_, i) => i !== idx));
  };
  const updateLayer = (idx, key, val) => {
    const next = [...layers];
    next[idx] = { ...next[idx], [key]: val };
    onChange(next);
  };

  return (
    <div>
      {layers.map((layer, idx) => (
        <div key={idx} style={{
          ...S.panel, marginBottom: 8, padding: 10,
          border: `1px solid ${idx === 0 ? '#ffd700' : '#4a3c28'}`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ color: '#ffd700', fontSize: 12, fontFamily: "'Cinzel', serif" }}>Layer {idx + 1}</span>
            <button onClick={() => removeLayer(idx)} style={S.btn('#ef4444')}>Remove</button>
          </div>
          <div style={S.row}>
            <span style={{ ...S.label, minWidth: 60 }}>Effect</span>
            <select value={layer.effect} onChange={e => updateLayer(idx, 'effect', e.target.value)} style={{ ...S.select, flex: 1 }}>
              {allEffectKeys.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
          <div style={S.row}>
            <span style={{ ...S.label, minWidth: 60 }}>Delay</span>
            <input type="range" min={0} max={2000} step={50} value={layer.delay} onChange={e => updateLayer(idx, 'delay', Number(e.target.value))} style={{ flex: 1 }} />
            <span style={S.val}>{layer.delay}ms</span>
          </div>
          <div style={S.row}>
            <span style={{ ...S.label, minWidth: 60 }}>Duration</span>
            <input type="range" min={100} max={3000} step={50} value={layer.duration} onChange={e => updateLayer(idx, 'duration', Number(e.target.value))} style={{ flex: 1 }} />
            <span style={S.val}>{layer.duration}ms</span>
          </div>
          <div style={S.row}>
            <span style={{ ...S.label, minWidth: 60 }}>Scale</span>
            <input type="range" min={0.5} max={5} step={0.25} value={layer.scale} onChange={e => updateLayer(idx, 'scale', Number(e.target.value))} style={{ flex: 1 }} />
            <span style={S.val}>{layer.scale}x</span>
          </div>
          <div style={S.row}>
            <span style={{ ...S.label, minWidth: 60 }}>Opacity</span>
            <input type="range" min={0.1} max={1} step={0.1} value={layer.opacity} onChange={e => updateLayer(idx, 'opacity', Number(e.target.value))} style={{ flex: 1 }} />
            <span style={S.val}>{layer.opacity}</span>
          </div>
          <div style={S.row}>
            <span style={{ ...S.label, minWidth: 60 }}>Filter</span>
            <input type="text" value={layer.filter} onChange={e => updateLayer(idx, 'filter', e.target.value)} placeholder="e.g. hue-rotate(90deg)" style={{ ...S.select, flex: 1, fontSize: 11 }} />
          </div>
        </div>
      ))}
      <button onClick={addLayer} style={{ ...S.btn('#3b82f6'), width: '100%', padding: '8px 12px', fontSize: 13 }}>+ Add Layer</button>
    </div>
  );
}

function EffectLayerPreview({ layers, speed = 80 }) {
  const [activeIndexes, setActiveIndexes] = useState([]);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef([]);

  const play = useCallback(() => {
    timerRef.current.forEach(t => clearTimeout(t));
    timerRef.current = [];
    setActiveIndexes([]);
    setPlaying(true);

    layers.forEach((layer, idx) => {
      const showTimer = setTimeout(() => {
        setActiveIndexes(prev => [...prev, idx]);
      }, layer.delay);
      const hideTimer = setTimeout(() => {
        setActiveIndexes(prev => prev.filter(i => i !== idx));
      }, layer.delay + layer.duration);
      timerRef.current.push(showTimer, hideTimer);
    });

    const totalTime = Math.max(...layers.map(l => l.delay + l.duration), 0);
    const endTimer = setTimeout(() => setPlaying(false), totalTime + 100);
    timerRef.current.push(endTimer);
  }, [layers]);

  useEffect(() => {
    return () => timerRef.current.forEach(t => clearTimeout(t));
  }, []);

  return (
    <div>
      <div style={{
        position: 'relative', width: 200, height: 200, margin: '0 auto',
        background: 'radial-gradient(ellipse at center, rgba(30,25,40,0.8) 0%, rgba(10,10,20,1) 80%)',
        borderRadius: 8, border: '1px solid rgba(74,60,40,0.3)', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {layers.map((layer, idx) => (
          activeIndexes.includes(idx) && (
            <div key={idx} style={{
              position: 'absolute', left: '50%', top: '50%',
              transform: 'translate(-50%, -50%)', opacity: layer.opacity, zIndex: idx + 1,
            }}>
              <EffectSpritePreview effectKey={layer.effect} scale={layer.scale} speed={speed} filter={layer.filter} />
            </div>
          )
        ))}
        {!playing && activeIndexes.length === 0 && (
          <div style={{ color: '#8a7d65', fontSize: 12 }}>Click Play</div>
        )}
      </div>
      <div style={{ textAlign: 'center', marginTop: 8 }}>
        <button onClick={play} disabled={playing || layers.length === 0} style={{
          ...S.btn(playing ? '#666' : '#22c55e'),
          padding: '6px 20px', fontSize: 13,
          cursor: playing ? 'not-allowed' : 'pointer',
        }}>{playing ? 'Playing...' : 'Play'}</button>
      </div>
      <div style={{ marginTop: 8 }}>
        {layers.map((layer, idx) => {
          const totalMax = Math.max(...layers.map(l => l.delay + l.duration), 1);
          const leftPct = (layer.delay / totalMax) * 100;
          const widthPct = (layer.duration / totalMax) * 100;
          return (
            <div key={idx} style={{ position: 'relative', height: 18, marginBottom: 2 }}>
              <div style={{ position: 'absolute', left: 0, right: 0, top: 7, height: 1, background: 'rgba(74,60,40,0.3)' }} />
              <div style={{
                position: 'absolute', left: `${leftPct}%`, width: `${widthPct}%`,
                height: 14, top: 2, background: `rgba(139,92,246,${layer.opacity * 0.6})`,
                border: '1px solid rgba(139,92,246,0.8)', borderRadius: 3,
              }}>
                <span style={{ fontSize: 8, color: '#fff', padding: '0 3px', whiteSpace: 'nowrap' }}>
                  L{idx + 1}: {layer.effect}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminSprite() {
  const [tab, setTab] = useState('characters');
  const [race, setRace] = useState('human');
  const [cls, setCls] = useState('warrior');
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [animation, setAnimation] = useState('idle');
  const [speed, setSpeed] = useState(120);
  const [scale, setScale] = useState(3);
  const [flip, setFlip] = useState(false);
  const [showTransform, setShowTransform] = useState(false);
  const [cssFilter, setCssFilter] = useState('');
  const [effectKey, setEffectKey] = useState('weaponHit');
  const [beamKey, setBeamKey] = useState('none');
  const [effectSpeed, setEffectSpeed] = useState(80);
  const [effectScale, setEffectScale] = useState(2);
  const [effectFilter, setEffectFilter] = useState('');
  const [showEffect, setShowEffect] = useState(false);
  const [showMarkers, setShowMarkers] = useState(true);
  const [layout, setLayout] = useState(() => {
    const saved = localStorage.getItem('adminSpriteLayout');
    return saved ? JSON.parse(saved) : { ...defaultLayout };
  });
  const [copied, setCopied] = useState('');
  const previewRef = useRef(null);

  const [selectedProjectile, setSelectedProjectile] = useState(allProjectileKeys[0]);
  const [projSpeed, setProjSpeed] = useState(100);
  const [projScale, setProjScale] = useState(4);

  const [selectedBuff, setSelectedBuff] = useState(allBuffKeys[0]);
  const [buffFilter, setBuffFilter] = useState('');

  const [selectedWeapon, setSelectedWeapon] = useState(allWeaponKeys[0]);

  const [effectLayers, setEffectLayers] = useState(() => {
    const saved = localStorage.getItem('adminEffectLayers');
    return saved ? JSON.parse(saved) : effectLayerPresets.fire_combo.layers.map(l => ({ ...l }));
  });
  const [layerPreset, setLayerPreset] = useState('fire_combo');
  const [layerSpeed, setLayerSpeed] = useState(80);

  const [galleryCat, setGalleryCat] = useState('all');
  const [gallerySearch, setGallerySearch] = useState('');
  const [gallerySelected, setGallerySelected] = useState(null);

  const spriteData = raceClassSpriteMap[race]?.[cls];
  const skills = getAllSkillsForClass(cls);
  const transformSprite = cls === 'warrior' ? warriorTransformSprite : cls === 'worge' ? worgTransformSprite[race] : null;
  const activeSpriteData = showTransform && transformSprite ? transformSprite : (spriteData ? { ...spriteData, filter: cssFilter || spriteData.filter || '' } : null);
  const availableAnims = activeSpriteData ? Object.keys(activeSpriteData).filter(k => typeof activeSpriteData[k] === 'object' && activeSpriteData[k]?.src && activeSpriteData[k]?.frames) : [];

  useEffect(() => {
    if (skills.length > 0 && !selectedSkill) setSelectedSkill(skills[0].id);
  }, [cls]);

  useEffect(() => {
    if (selectedSkill) {
      const skill = skills.find(s => s.id === selectedSkill);
      if (skill) {
        const fx = getEffectForSkill(cls, skill);
        if (fx) {
          setEffectKey(fx.effect || 'weaponHit');
          setBeamKey(fx.beam || 'none');
          if (fx.anim && availableAnims.includes(fx.anim)) setAnimation(fx.anim);
          setEffectFilter(fx.effectFilter || '');
        }
      }
    }
  }, [selectedSkill, cls]);

  const handleSkillChange = (skillId) => { setSelectedSkill(skillId); setShowEffect(true); };
  const updateLayout = (key, val) => setLayout(prev => ({ ...prev, [key]: val }));

  const saveLayout = () => { localStorage.setItem('adminSpriteLayout', JSON.stringify(layout)); flash('Saved!'); };
  const resetLayout = () => { setLayout({ ...defaultLayout }); localStorage.removeItem('adminSpriteLayout'); };
  const copyLayoutJSON = () => { navigator.clipboard.writeText(JSON.stringify(layout, null, 2)); flash('Copied JSON!'); };

  const flash = (msg) => { setCopied(msg); setTimeout(() => setCopied(''), 1500); };

  const copyEffectConfig = () => {
    const skill = skills.find(s => s.id === selectedSkill);
    const config = { skillId: selectedSkill, skillName: skill?.name, effect: effectKey, beam: beamKey === 'none' ? null : beamKey, anim: animation, effectFilter: effectFilter || undefined, effectScale, effectSpeed };
    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    flash('Copied effect config!');
  };

  const saveEffectLayers = () => {
    localStorage.setItem('adminEffectLayers', JSON.stringify(effectLayers));
    flash('Layers saved!');
  };

  const copyLayersJSON = () => {
    navigator.clipboard.writeText(JSON.stringify({ layers: effectLayers }, null, 2));
    flash('Copied layers!');
  };

  const loadPreset = (presetKey) => {
    setLayerPreset(presetKey);
    const preset = effectLayerPresets[presetKey];
    if (preset) setEffectLayers(preset.layers.map(l => ({ ...l })));
  };

  const VIEWPORT_W = 500;
  const VIEWPORT_H = 420;
  const spriteCenter = { x: VIEWPORT_W / 2, y: VIEWPORT_H / 2 };

  const currentBuff = buffVisuals[selectedBuff];
  const currentWeapon = weaponVisuals[selectedWeapon];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a2e 50%, #0d0d1a 100%)', color: '#e0d6c2', fontFamily: "'Jost', sans-serif", padding: 20 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 8 }}>
          <a href="/admin" style={{ color: '#94a3b8', textDecoration: 'none', fontWeight: 600, fontSize: '0.75rem', padding: '3px 8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4 }}>Admin Hub</a>
          <a href="/" style={{ color: '#f59e0b', textDecoration: 'none', fontWeight: 600, fontSize: '0.75rem', padding: '3px 8px', background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.15)', borderRadius: 4 }}>Back to Game</a>
        </div>
        <h1 style={{ fontFamily: "'Cinzel', serif", color: '#ffd700', fontSize: 28, textAlign: 'center', marginBottom: 8, textShadow: '0 0 10px rgba(255,215,0,0.3)' }}>Admin Sprite Editor</h1>
        <p style={{ textAlign: 'center', color: '#8a7d65', fontSize: 12, marginBottom: 16 }}>Configure how sprites appear on the map and in battles for attacks, buffs, projectiles, and effects</p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              background: tab === t.id ? 'rgba(139,92,246,0.3)' : 'rgba(20,15,30,0.8)',
              border: tab === t.id ? '1px solid #8b5cf6' : '1px solid #4a3c28',
              color: tab === t.id ? '#ffd700' : '#c4b998',
              borderRadius: 6, padding: '8px 16px', fontSize: 13, cursor: 'pointer',
              fontFamily: "'Cinzel', serif", transition: 'all 0.2s',
            }}>{t.icon} {t.label}</button>
          ))}
        </div>

        {tab === 'characters' && (
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: '0 0 320px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={S.panel}>
                <h3 style={S.h3}>Character</h3>
                <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#8a7d65', marginBottom: 3 }}>Race</div>
                    <select value={race} onChange={e => setRace(e.target.value)} style={S.select}>
                      {races.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#8a7d65', marginBottom: 3 }}>Class</div>
                    <select value={cls} onChange={e => { setCls(e.target.value); setSelectedSkill(null); setShowTransform(false); }} style={S.select}>
                      {classes.map(c => <option key={c} value={c}>{classDefinitions[c]?.name || c}</option>)}
                    </select>
                  </div>
                </div>
                {(cls === 'warrior' || cls === 'worge') && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#c4b998', marginTop: 4 }}>
                    <input type="checkbox" checked={showTransform} onChange={e => setShowTransform(e.target.checked)} />
                    {cls === 'warrior' ? 'Demon Blade Transform' : 'Worge Transform'}
                  </label>
                )}
              </div>

              <div style={S.panel}>
                <h3 style={S.h3}>Skill / Ability</h3>
                <select value={selectedSkill || ''} onChange={e => handleSkillChange(e.target.value)} style={{ ...S.select, width: '100%' }}>
                  <option value="" disabled>Select a skill...</option>
                  {(() => {
                    const classSrc = skills.filter(s => s.type === 'class');
                    const weaponSrc = skills.filter(s => s.type === 'weapon');
                    const weaponsByType = {};
                    weaponSrc.forEach(s => { if (!weaponsByType[s.source]) weaponsByType[s.source] = []; weaponsByType[s.source].push(s); });
                    return (
                      <>
                        <optgroup label="Class Abilities">
                          {classSrc.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name} [{s.source}]</option>)}
                        </optgroup>
                        {Object.entries(weaponsByType).map(([wt, wSkills]) => (
                          <optgroup key={wt} label={`${wt.charAt(0).toUpperCase() + wt.slice(1)} Skills`}>
                            {wSkills.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
                          </optgroup>
                        ))}
                      </>
                    );
                  })()}
                </select>
                {selectedSkill && (() => {
                  const skill = skills.find(s => s.id === selectedSkill);
                  const fx = skill ? getEffectForSkill(cls, skill) : null;
                  return skill ? (
                    <div style={{ marginTop: 8, fontSize: 11, color: '#8a7d65', lineHeight: 1.5 }}>
                      <div><strong style={{ color: '#c4b998' }}>Effect:</strong> {fx?.effect || 'none'}</div>
                      <div><strong style={{ color: '#c4b998' }}>Beam:</strong> {fx?.beam || 'none'}</div>
                      <div><strong style={{ color: '#c4b998' }}>Anim:</strong> {fx?.anim || 'attack1'}</div>
                      {fx?.comboAnims && <div><strong style={{ color: '#c4b998' }}>Combo:</strong> {fx.comboAnims.join(' \u2192 ')}</div>}
                    </div>
                  ) : null;
                })()}
              </div>

              <div style={S.panel}>
                <h3 style={S.h3}>Sprite Controls</h3>
                <div style={S.row}><span style={S.label}>Animation</span><select value={animation} onChange={e => setAnimation(e.target.value)} style={{ ...S.select, flex: 1 }}>{availableAnims.map(a => <option key={a} value={a}>{a}</option>)}</select></div>
                <div style={S.row}><span style={S.label}>Speed (ms)</span><input type="range" min={30} max={300} value={speed} onChange={e => setSpeed(Number(e.target.value))} style={{ flex: 1 }} /><span style={S.val}>{speed}</span></div>
                <div style={S.row}><span style={S.label}>Scale</span><input type="range" min={1} max={8} step={0.5} value={scale} onChange={e => setScale(Number(e.target.value))} style={{ flex: 1 }} /><span style={S.val}>{scale}x</span></div>
                <div style={S.row}><span style={S.label}>Flip</span><input type="checkbox" checked={flip} onChange={e => setFlip(e.target.checked)} /></div>
                <div style={S.row}><span style={S.label}>CSS Filter</span><input type="text" value={cssFilter} onChange={e => setCssFilter(e.target.value)} placeholder="e.g. hue-rotate(90deg)" style={{ ...S.select, flex: 1, fontSize: 11 }} /></div>
              </div>

              <div style={S.panel}>
                <h3 style={S.h3}>Effect Controls</h3>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#c4b998', marginBottom: 8 }}>
                  <input type="checkbox" checked={showEffect} onChange={e => setShowEffect(e.target.checked)} />Show Effect Overlay
                </label>
                <div style={S.row}><span style={S.label}>Effect</span><select value={effectKey} onChange={e => setEffectKey(e.target.value)} style={{ ...S.select, flex: 1 }}>{allEffectKeys.map(k => <option key={k} value={k}>{k}</option>)}</select></div>
                <div style={S.row}><span style={S.label}>Beam</span><select value={beamKey} onChange={e => setBeamKey(e.target.value)} style={{ ...S.select, flex: 1 }}>{allBeamKeys.map(k => <option key={k} value={k}>{k}</option>)}</select></div>
                <div style={S.row}><span style={S.label}>Effect Speed</span><input type="range" min={30} max={200} value={effectSpeed} onChange={e => setEffectSpeed(Number(e.target.value))} style={{ flex: 1 }} /><span style={S.val}>{effectSpeed}</span></div>
                <div style={S.row}><span style={S.label}>Effect Scale</span><input type="range" min={0.5} max={5} step={0.25} value={effectScale} onChange={e => setEffectScale(Number(e.target.value))} style={{ flex: 1 }} /><span style={S.val}>{effectScale}x</span></div>
                <div style={S.row}><span style={S.label}>Effect Filter</span><input type="text" value={effectFilter} onChange={e => setEffectFilter(e.target.value)} placeholder="e.g. hue-rotate(90deg)" style={{ ...S.select, flex: 1, fontSize: 11 }} /></div>
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 400 }}>
              <div style={{ ...S.panel, position: 'relative', minHeight: 500 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ ...S.h3, margin: 0 }}>Preview</h3>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#c4b998' }}>
                    <input type="checkbox" checked={showMarkers} onChange={e => setShowMarkers(e.target.checked)} />Show Layout Markers
                  </label>
                </div>

                <div style={{
                  width: '100%', height: VIEWPORT_H, position: 'relative', overflow: 'hidden',
                  background: 'radial-gradient(ellipse at center, rgba(30,25,40,0.8) 0%, rgba(10,10,20,1) 80%)',
                  borderRadius: 6, border: '1px solid rgba(74,60,40,0.3)',
                }} ref={previewRef}>
                  {activeSpriteData && (() => {
                    const fw = activeSpriteData.frameWidth || 100;
                    const fh = activeSpriteData.frameHeight || 100;
                    const dw = fw * scale;
                    const dh = fh * scale;
                    const spriteLeft = spriteCenter.x - dw / 2;
                    const spriteTop = spriteCenter.y - dh / 2;
                    return (
                      <>
                        <div style={{
                          position: 'absolute', left: spriteLeft, top: spriteTop,
                          width: dw, height: dh, pointerEvents: 'none',
                        }}>
                          <SpriteAnimation spriteData={activeSpriteData} animation={animation} scale={scale} flip={flip} loop={true} speed={speed} containerless={false} />
                        </div>

                        {showMarkers && (
                          <>
                            <div style={{ position: 'absolute', left: spriteCenter.x + layout.shadowOffsetX - layout.shadowWidth / 2, top: spriteCenter.y + layout.shadowOffsetY, width: layout.shadowWidth, height: layout.shadowHeight, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', pointerEvents: 'none', border: '1px dashed rgba(255,255,255,0.3)', zIndex: 2 }} />
                            <DraggableMarker label="Shadow" color="#666" x={spriteCenter.x + layout.shadowOffsetX} y={spriteCenter.y + layout.shadowOffsetY} onChange={(x, y) => { updateLayout('shadowOffsetX', Math.round(x - spriteCenter.x)); updateLayout('shadowOffsetY', Math.round(y - spriteCenter.y)); }} />
                            <DraggableMarker label="Name" color="#ffd700" x={spriteCenter.x + layout.nameOffsetX} y={layout.nameOffsetY + 20} onChange={(x, y) => { updateLayout('nameOffsetX', Math.round(x - spriteCenter.x)); updateLayout('nameOffsetY', Math.round(y - 20)); }} />
                            <DraggableMarker label="Hit Point" color="#ef4444" x={spriteCenter.x + layout.hitLocationX} y={spriteCenter.y + layout.hitLocationY} onChange={(x, y) => { updateLayout('hitLocationX', Math.round(x - spriteCenter.x)); updateLayout('hitLocationY', Math.round(y - spriteCenter.y)); }} />
                            <div style={{ position: 'absolute', left: spriteCenter.x + layout.hitLocationX - 8, top: spriteCenter.y + layout.hitLocationY - 8, width: 16, height: 16, border: '2px solid rgba(239,68,68,0.6)', borderRadius: '50%', pointerEvents: 'none', zIndex: 2 }} />
                            <DraggableMarker label="Spell Play" color="#8b5cf6" x={spriteCenter.x + layout.spellPlayX} y={spriteCenter.y + layout.spellPlayY} onChange={(x, y) => { updateLayout('spellPlayX', Math.round(x - spriteCenter.x)); updateLayout('spellPlayY', Math.round(y - spriteCenter.y)); }} />
                            <div style={{ position: 'absolute', left: spriteCenter.x + layout.spellPlayX - 12, top: spriteCenter.y + layout.spellPlayY - 12, width: 24, height: 24, border: '2px dashed rgba(139,92,246,0.5)', borderRadius: 4, pointerEvents: 'none', zIndex: 2 }} />
                            <DraggableMarker label="Effect" color="#22c55e" x={spriteCenter.x + layout.effectOffsetX} y={spriteCenter.y + layout.effectOffsetY} onChange={(x, y) => { updateLayout('effectOffsetX', Math.round(x - spriteCenter.x)); updateLayout('effectOffsetY', Math.round(y - spriteCenter.y)); }} />
                          </>
                        )}
                        {showEffect && (
                          <div style={{ position: 'absolute', left: spriteCenter.x + layout.effectOffsetX, top: spriteCenter.y + layout.effectOffsetY, transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 50 }}>
                            <EffectSpritePreview effectKey={effectKey} scale={effectScale} speed={effectSpeed} filter={effectFilter} />
                          </div>
                        )}
                        {showEffect && beamKey !== 'none' && beamTrails[beamKey] && (
                          <div style={{ position: 'absolute', left: spriteCenter.x + 50, top: spriteCenter.y - 2, width: 120, height: 12, zIndex: 45, pointerEvents: 'none' }}>
                            <img src={beamTrails[beamKey]} alt="beam" style={{ width: '100%', height: '100%', objectFit: 'fill', imageRendering: 'pixelated', opacity: 0.9 }} />
                          </div>
                        )}
                        {showMarkers && (
                          <div style={{ position: 'absolute', left: spriteCenter.x + layout.nameOffsetX, top: layout.nameOffsetY + 20, transform: 'translateX(-50%)', pointerEvents: 'none', zIndex: 60 }}>
                            <div style={{ color: '#ffd700', fontSize: 11, fontFamily: "'Cinzel', serif", textShadow: '0 0 4px rgba(0,0,0,0.8)', whiteSpace: 'nowrap', padding: '1px 6px', background: 'rgba(0,0,0,0.4)', borderRadius: 3 }}>{race} {cls}</div>
                          </div>
                        )}

                        <div style={{ position: 'absolute', left: spriteCenter.x, top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.06)', pointerEvents: 'none', zIndex: 1 }} />
                        <div style={{ position: 'absolute', top: spriteCenter.y, left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.06)', pointerEvents: 'none', zIndex: 1 }} />
                      </>
                    );
                  })()}
                </div>

                <div style={{ marginTop: 12, fontSize: 11, color: '#8a7d65' }}>
                  <strong>Sprite:</strong> {activeSpriteData?.folder || 'none'} | <strong>Frame:</strong> {(activeSpriteData?.frameWidth || 100)}x{(activeSpriteData?.frameHeight || 100)}px | <strong>Anim Frames:</strong> {activeSpriteData?.[animation]?.frames || 0}
                </div>
              </div>

              <div style={{ ...S.panel, marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <h3 style={{ ...S.h3, margin: 0 }}>Layout Offsets</h3>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={saveLayout} style={S.btn('#22c55e')}>Save</button>
                    <button onClick={copyLayoutJSON} style={S.btn('#3b82f6')}>Copy JSON</button>
                    <button onClick={copyEffectConfig} style={S.btn('#8b5cf6')}>Copy Effect</button>
                    <button onClick={resetLayout} style={S.btn('#ef4444')}>Reset</button>
                    {copied && <span style={{ color: '#22c55e', fontSize: 11, alignSelf: 'center' }}>{copied}</span>}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
                  {[
                    ['shadowOffsetX', 'Shadow X', -100, 100], ['shadowOffsetY', 'Shadow Y', -50, 100],
                    ['shadowWidth', 'Shadow W', 10, 120], ['shadowHeight', 'Shadow H', 2, 30],
                    ['nameOffsetX', 'Name X', -100, 100], ['nameOffsetY', 'Name Y', -60, 60],
                    ['hitLocationX', 'Hit X', -80, 80], ['hitLocationY', 'Hit Y', -80, 80],
                    ['spellPlayX', 'Spell X', -80, 80], ['spellPlayY', 'Spell Y', -80, 80],
                    ['effectOffsetX', 'Effect X', -100, 100], ['effectOffsetY', 'Effect Y', -100, 100],
                  ].map(([key, label, min, max]) => (
                    <div key={key} style={S.row}>
                      <span style={{ ...S.label, minWidth: 70 }}>{label}</span>
                      <input type="range" min={min} max={max} value={layout[key]} onChange={e => updateLayout(key, Number(e.target.value))} style={{ flex: 1 }} />
                      <span style={S.val}>{layout[key]}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ ...S.panel, marginTop: 12 }}>
                <h3 style={S.h3}>All Available Effects</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8, maxHeight: 400, overflow: 'auto' }}>
                  {allEffectKeys.map(key => (
                    <div key={key} onClick={() => { setEffectKey(key); setShowEffect(true); }} style={{
                      background: effectKey === key ? 'rgba(139,92,246,0.3)' : 'rgba(0,0,0,0.3)',
                      border: effectKey === key ? '1px solid #8b5cf6' : '1px solid rgba(74,60,40,0.3)',
                      borderRadius: 6, padding: 6, cursor: 'pointer', textAlign: 'center',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
                        <EffectSpritePreview effectKey={key} scale={1} speed={effectSpeed} />
                      </div>
                      <div style={{ fontSize: 9, color: '#c4b998', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{key}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'effects' && (
          <div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
              <button onClick={() => setGalleryCat('all')} style={{
                ...S.btn(galleryCat === 'all' ? '#8b5cf6' : '#333'),
                border: galleryCat === 'all' ? '1px solid #8b5cf6' : '1px solid #4a3c28',
              }}>All ({allEffectKeys.length})</button>
              {Object.entries(EFFECT_CATEGORIES).map(([catId, cat]) => (
                <button key={catId} onClick={() => setGalleryCat(catId)} style={{
                  ...S.btn(galleryCat === catId ? cat.color : '#333'),
                  border: galleryCat === catId ? `1px solid ${cat.color}` : '1px solid #4a3c28',
                  color: galleryCat === catId ? '#fff' : '#c4b998',
                }}>{cat.label} ({cat.keys.length})</button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
              <input
                type="text"
                value={gallerySearch}
                onChange={e => setGallerySearch(e.target.value)}
                placeholder="Search effects..."
                style={{ ...S.select, flex: 1, maxWidth: 300 }}
              />
              <span style={{ fontSize: 11, color: '#8a7d65' }}>
                {(() => {
                  const keys = galleryCat === 'all' ? allEffectKeys : (EFFECT_CATEGORIES[galleryCat]?.keys || []);
                  const filtered = gallerySearch ? keys.filter(k => k.toLowerCase().includes(gallerySearch.toLowerCase())) : keys;
                  return `${filtered.length} effects`;
                })()}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 600 }}>
                {(galleryCat === 'all' ? [{ id: 'all', label: 'All Effects', color: '#ffd700', keys: allEffectKeys }] : [EFFECT_CATEGORIES[galleryCat]].filter(Boolean).map(c => ({ ...c, id: galleryCat }))).map(cat => {
                  const filteredKeys = gallerySearch ? cat.keys.filter(k => k.toLowerCase().includes(gallerySearch.toLowerCase())) : cat.keys;
                  if (filteredKeys.length === 0) return null;
                  return (
                    <div key={cat.id} style={{ marginBottom: 20 }}>
                      <h3 style={{ ...S.h3, color: cat.color, borderBottom: `1px solid ${cat.color}33`, paddingBottom: 6 }}>
                        {cat.label} ({filteredKeys.length})
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
                        {filteredKeys.map(key => {
                          const isSelected = gallerySelected === key;
                          const usage = getEffectUsage(key);
                          return (
                            <div key={key} onClick={() => setGallerySelected(key)} style={{
                              background: isSelected ? 'rgba(139,92,246,0.3)' : 'rgba(0,0,0,0.3)',
                              border: isSelected ? '2px solid #8b5cf6' : '1px solid rgba(74,60,40,0.3)',
                              borderRadius: 8, padding: 8, cursor: 'pointer', textAlign: 'center',
                              transition: 'all 0.15s',
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6, height: 60, alignItems: 'center' }}>
                                <EffectSpritePreview effectKey={key} scale={1.2} speed={80} />
                              </div>
                              <div style={{ fontSize: 11, color: '#e0d6c2', fontWeight: 'bold', marginBottom: 2 }}>{key}</div>
                              <div style={{ fontSize: 9, color: usage.length > 0 ? '#22c55e' : '#666' }}>
                                {usage.length > 0 ? `${usage.length} binding${usage.length > 1 ? 's' : ''}` : 'unbound'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ flex: '0 0 360px' }}>
                {gallerySelected && (
                  <div style={{ position: 'sticky', top: 20 }}>
                    <div style={S.panel}>
                      <h3 style={{ ...S.h3, marginBottom: 12 }}>Preview: {gallerySelected}</h3>
                      <div style={{
                        display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200,
                        background: 'radial-gradient(ellipse at center, rgba(30,25,40,0.8) 0%, rgba(10,10,20,1) 80%)',
                        borderRadius: 6, border: '1px solid rgba(74,60,40,0.3)', marginBottom: 12,
                      }}>
                        <EffectSpritePreview effectKey={gallerySelected} scale={3} speed={80} />
                      </div>
                      <div style={{ fontSize: 11, color: '#8a7d65', lineHeight: 1.6, marginBottom: 12 }}>
                        {(() => {
                          const e = effectSprites[gallerySelected];
                          if (!e) return null;
                          return (
                            <>
                              <div><strong style={{ color: '#c4b998' }}>Source:</strong> {e.src}</div>
                              <div><strong style={{ color: '#c4b998' }}>Frames:</strong> {e.frames}</div>
                              {e.cols && <div><strong style={{ color: '#c4b998' }}>Grid:</strong> {e.cols}x{e.rows} ({e.frameW}x{e.frameH}px)</div>}
                              {e.size && <div><strong style={{ color: '#c4b998' }}>Sheet:</strong> {e.size}x{e.size}px (auto-grid)</div>}
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    <div style={{ ...S.panel, marginTop: 12 }}>
                      <h3 style={S.h3}>Skill Bindings</h3>
                      {(() => {
                        const usage = getEffectUsage(gallerySelected);
                        if (usage.length === 0) return <div style={{ fontSize: 11, color: '#666' }}>No skills or abilities use this effect yet.</div>;
                        return (
                          <div style={{ maxHeight: 300, overflow: 'auto' }}>
                            {usage.map((u, i) => {
                              const typeColors = { class: '#ffd700', weapon: '#3b82f6', enemy: '#ef4444', buff: '#22c55e', weapon_trail: '#f97316' };
                              const typeLabels = { class: 'Class Ability', weapon: 'Weapon Skill', enemy: 'Enemy Ability', buff: 'Buff Visual', weapon_trail: 'Weapon Trail' };
                              return (
                                <div key={i} style={{
                                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                  padding: '4px 8px', borderBottom: '1px solid rgba(74,60,40,0.2)',
                                  fontSize: 11,
                                }}>
                                  <span style={{ color: '#e0d6c2' }}>
                                    {u.type === 'class' ? `${u.class} - ${u.name}` :
                                     u.type === 'weapon' ? u.id :
                                     u.type === 'enemy' ? u.name :
                                     u.type === 'buff' ? u.name :
                                     u.type === 'weapon_trail' ? u.name : ''}
                                  </span>
                                  <span style={{
                                    color: typeColors[u.type] || '#888',
                                    fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5,
                                    background: `${typeColors[u.type]}22`, padding: '1px 6px', borderRadius: 3,
                                  }}>{typeLabels[u.type] || u.type}</span>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>

                    <div style={{ ...S.panel, marginTop: 12 }}>
                      <h3 style={S.h3}>Effect Type Tags</h3>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {Object.entries(EFFECT_TYPE_TAGS)
                          .filter(([, keys]) => keys.includes(gallerySelected))
                          .map(([tag]) => {
                            const tagColors = {
                              cast: '#ffd700', impact: '#ef4444', projectile: '#f97316', melee: '#fb923c',
                              aura: '#e879f9', buff: '#22c55e', debuff: '#dc2626', heal: '#34d399',
                              fire: '#f97316', ice: '#38bdf8', lightning: '#facc15', arcane: '#818cf8',
                              holy: '#fcd34d', earth: '#a1887f', water: '#22d3ee', wind: '#4ade80',
                              nature: '#66bb6a', dark: '#7c3aed', poison: '#84cc16', physical: '#d4d4d8',
                              explosion: '#ff6b6b', movement: '#a78bfa', crit: '#ef4444', spellcrit: '#818cf8',
                              largecrit: '#f59e0b', combo: '#fbbf24', counter: '#f97316', block: '#a1a1aa',
                              dodge: '#4ade80', stun: '#fbbf24', slow: '#94a3b8', haste: '#facc15',
                              sleep: '#6366f1', frozen: '#38bdf8', stone: '#a1a1aa', transform: '#a78bfa',
                              huechange: '#e879f9', slashColor: '#fb923c', bulletImpact: '#9ca3af',
                              retro: '#f472b6', custom: '#60a5fa', pixel: '#a5f3fc', misc: '#6b7280',
                            };
                            return (
                              <span key={tag} style={{
                                fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5,
                                color: tagColors[tag] || '#ccc', background: `${tagColors[tag] || '#888'}22`,
                                padding: '2px 6px', borderRadius: 3, border: `1px solid ${tagColors[tag] || '#888'}44`,
                              }}>{tag}</span>
                            );
                          })}
                        {Object.entries(EFFECT_TYPE_TAGS).filter(([, keys]) => keys.includes(gallerySelected)).length === 0 &&
                          <span style={{ fontSize: 11, color: '#666' }}>No tags assigned</span>}
                      </div>
                    </div>

                    <div style={{ ...S.panel, marginTop: 12 }}>
                      <h3 style={S.h3}>Quick Copy</h3>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button onClick={() => {
                          navigator.clipboard.writeText(`effect: '${gallerySelected}'`);
                          flash('Copied effect key!');
                        }} style={S.btn('#3b82f6')}>Copy Key</button>
                        <button onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(effectSprites[gallerySelected], null, 2));
                          flash('Copied sprite data!');
                        }} style={S.btn('#8b5cf6')}>Copy Sprite Data</button>
                        <button onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify({ effect: gallerySelected, beam: null, anim: 'attack1' }, null, 2));
                          flash('Copied binding template!');
                        }} style={S.btn('#22c55e')}>Copy Binding Template</button>
                        {copied && <span style={{ color: '#22c55e', fontSize: 11, alignSelf: 'center' }}>{copied}</span>}
                      </div>
                    </div>
                  </div>
                )}
                {!gallerySelected && (
                  <div style={S.panel}>
                    <p style={{ fontSize: 12, color: '#8a7d65', textAlign: 'center', padding: 40 }}>
                      Click on any effect to see its details, preview, and skill bindings
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 'projectiles' && (
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: '0 0 320px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={S.panel}>
                <h3 style={S.h3}>Projectile Selection</h3>
                <select value={selectedProjectile} onChange={e => setSelectedProjectile(e.target.value)} style={{ ...S.select, width: '100%', marginBottom: 8 }}>
                  {allProjectileKeys.map(k => {
                    const p = projectileSprites[k];
                    return <option key={k} value={k}>{p.name} ({p.type})</option>;
                  })}
                </select>
                <div style={{ fontSize: 11, color: '#8a7d65', lineHeight: 1.6 }}>
                  <div><strong style={{ color: '#c4b998' }}>Type:</strong> {projectileSprites[selectedProjectile]?.type}</div>
                  <div><strong style={{ color: '#c4b998' }}>Frames:</strong> {projectileSprites[selectedProjectile]?.frames}</div>
                  <div><strong style={{ color: '#c4b998' }}>Animated:</strong> {projectileSprites[selectedProjectile]?.animated ? 'Yes (individual frames)' : 'Sprite sheet'}</div>
                </div>
              </div>
              <div style={S.panel}>
                <h3 style={S.h3}>Projectile Controls</h3>
                <div style={S.row}><span style={S.label}>Speed (ms)</span><input type="range" min={30} max={300} value={projSpeed} onChange={e => setProjSpeed(Number(e.target.value))} style={{ flex: 1 }} /><span style={S.val}>{projSpeed}</span></div>
                <div style={S.row}><span style={S.label}>Scale</span><input type="range" min={1} max={10} step={0.5} value={projScale} onChange={e => setProjScale(Number(e.target.value))} style={{ flex: 1 }} /><span style={S.val}>{projScale}x</span></div>
              </div>
              <div style={S.panel}>
                <h3 style={S.h3}>Weapon Assignments</h3>
                <div style={{ fontSize: 11, color: '#8a7d65', lineHeight: 1.8 }}>
                  {allWeaponKeys.map(wk => {
                    const w = weaponVisuals[wk];
                    return (
                      <div key={wk} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(74,60,40,0.2)', padding: '2px 0' }}>
                        <span style={{ color: '#c4b998' }}>{w.name}</span>
                        <span style={{ color: w.projectile ? '#ffd700' : '#555' }}>{w.projectile ? projectileSprites[w.projectile]?.name : 'Melee'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 400 }}>
              <div style={{ ...S.panel, minHeight: 300 }}>
                <h3 style={S.h3}>Projectile Preview</h3>
                <div style={{
                  display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 250,
                  background: 'radial-gradient(ellipse at center, rgba(30,25,40,0.8) 0%, rgba(10,10,20,1) 80%)',
                  borderRadius: 6, border: '1px solid rgba(74,60,40,0.3)', position: 'relative',
                }}>
                  <ProjectileSpritePreview projKey={selectedProjectile} scale={projScale} speed={projSpeed} />
                </div>
              </div>
              <div style={{ ...S.panel, marginTop: 12 }}>
                <h3 style={S.h3}>All Projectiles</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
                  {allProjectileKeys.map(key => (
                    <div key={key} onClick={() => setSelectedProjectile(key)} style={{
                      background: selectedProjectile === key ? 'rgba(139,92,246,0.3)' : 'rgba(0,0,0,0.3)',
                      border: selectedProjectile === key ? '1px solid #8b5cf6' : '1px solid rgba(74,60,40,0.3)',
                      borderRadius: 6, padding: 8, cursor: 'pointer', textAlign: 'center',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
                        <ProjectileSpritePreview projKey={key} scale={2} speed={projSpeed} />
                      </div>
                      <div style={{ fontSize: 10, color: '#c4b998' }}>{projectileSprites[key].name}</div>
                      <div style={{ fontSize: 9, color: '#8a7d65' }}>{projectileSprites[key].type}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'buffs' && (
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: '0 0 320px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={S.panel}>
                <h3 style={S.h3}>Buff / Status Effect</h3>
                <select value={selectedBuff} onChange={e => { setSelectedBuff(e.target.value); setBuffFilter(''); }} style={{ ...S.select, width: '100%', marginBottom: 8 }}>
                  {allBuffKeys.map(k => {
                    const b = buffVisuals[k];
                    return <option key={k} value={k}>{b.icon} {b.name} ({b.category})</option>;
                  })}
                </select>
                {currentBuff && (
                  <div style={{ fontSize: 11, color: '#8a7d65', lineHeight: 1.6 }}>
                    <div><strong style={{ color: '#c4b998' }}>Category:</strong> <span style={{ color: currentBuff.category === 'debuff' ? '#ef4444' : currentBuff.category === 'buff' ? '#22c55e' : '#3b82f6' }}>{currentBuff.category}</span></div>
                    <div><strong style={{ color: '#c4b998' }}>Effect:</strong> {currentBuff.effect}</div>
                    <div><strong style={{ color: '#c4b998' }}>Color:</strong> <span style={{ color: currentBuff.color }}>{currentBuff.color}</span></div>
                    {currentBuff.effectFilter && <div><strong style={{ color: '#c4b998' }}>Filter:</strong> {currentBuff.effectFilter}</div>}
                  </div>
                )}
              </div>
              <div style={S.panel}>
                <h3 style={S.h3}>Override Filter</h3>
                <div style={S.row}>
                  <span style={S.label}>CSS Filter</span>
                  <input type="text" value={buffFilter} onChange={e => setBuffFilter(e.target.value)} placeholder="e.g. hue-rotate(90deg)" style={{ ...S.select, flex: 1, fontSize: 11 }} />
                </div>
                <button onClick={() => {
                  const config = { buffId: selectedBuff, ...currentBuff, effectFilter: buffFilter || currentBuff.effectFilter || undefined };
                  navigator.clipboard.writeText(JSON.stringify(config, null, 2));
                  flash('Copied buff config!');
                }} style={{ ...S.btn('#8b5cf6'), width: '100%', marginTop: 8 }}>Copy Buff Config</button>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 400 }}>
              <div style={{ ...S.panel, minHeight: 300 }}>
                <h3 style={S.h3}>Buff Effect Preview</h3>
                <div style={{
                  display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 250,
                  background: 'radial-gradient(ellipse at center, rgba(30,25,40,0.8) 0%, rgba(10,10,20,1) 80%)',
                  borderRadius: 6, border: '1px solid rgba(74,60,40,0.3)',
                }}>
                  {currentBuff && <EffectSpritePreview effectKey={currentBuff.effect} scale={2.5} speed={80} filter={buffFilter || currentBuff.effectFilter || ''} />}
                </div>
              </div>
              <div style={{ ...S.panel, marginTop: 12 }}>
                <h3 style={S.h3}>All Buffs & Status Effects</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
                  {allBuffKeys.map(key => {
                    const b = buffVisuals[key];
                    const catColor = b.category === 'debuff' ? '#ef4444' : b.category === 'buff' ? '#22c55e' : b.category === 'heal' ? '#44ff88' : '#3b82f6';
                    return (
                      <div key={key} onClick={() => { setSelectedBuff(key); setBuffFilter(''); }} style={{
                        background: selectedBuff === key ? 'rgba(139,92,246,0.3)' : 'rgba(0,0,0,0.3)',
                        border: selectedBuff === key ? '1px solid #8b5cf6' : '1px solid rgba(74,60,40,0.3)',
                        borderRadius: 6, padding: 8, cursor: 'pointer', textAlign: 'center',
                      }}>
                        <div style={{ fontSize: 24, marginBottom: 4 }}>{b.icon}</div>
                        <div style={{ fontSize: 11, color: '#c4b998' }}>{b.name}</div>
                        <div style={{ fontSize: 9, color: catColor, textTransform: 'uppercase', letterSpacing: 1 }}>{b.category}</div>
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
                          <EffectSpritePreview effectKey={b.effect} scale={0.8} speed={80} filter={b.effectFilter || ''} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'weapons' && (
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: '0 0 320px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={S.panel}>
                <h3 style={S.h3}>Weapon Type</h3>
                <select value={selectedWeapon} onChange={e => setSelectedWeapon(e.target.value)} style={{ ...S.select, width: '100%', marginBottom: 8 }}>
                  {allWeaponKeys.map(k => <option key={k} value={k}>{weaponVisuals[k].name}</option>)}
                </select>
                {currentWeapon && (
                  <div style={{ fontSize: 11, color: '#8a7d65', lineHeight: 1.6 }}>
                    <div><strong style={{ color: '#c4b998' }}>Projectile:</strong> {currentWeapon.projectile ? projectileSprites[currentWeapon.projectile]?.name : 'None (melee)'}</div>
                    <div><strong style={{ color: '#c4b998' }}>Trail Effect:</strong> {currentWeapon.trail || 'none'}</div>
                  </div>
                )}
              </div>
              <div style={S.panel}>
                <h3 style={S.h3}>Weapon Skills</h3>
                <div style={{ maxHeight: 400, overflow: 'auto', fontSize: 11, color: '#8a7d65' }}>
                  {Object.entries(weaponSkillEffectMap).filter(([id]) => id.startsWith(`ws_${selectedWeapon}_`) || id.startsWith(`ws_${selectedWeapon.replace('_', '')}_`)).map(([id, fx]) => (
                    <div key={id} style={{ borderBottom: '1px solid rgba(74,60,40,0.2)', padding: '4px 0' }}>
                      <div style={{ color: '#c4b998', fontWeight: 'bold' }}>{id}</div>
                      <div>Effect: <span style={{ color: '#ffd700' }}>{fx.effect}</span> | Beam: <span style={{ color: '#8b5cf6' }}>{fx.beam || 'none'}</span> | Anim: {fx.anim}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 400 }}>
              <div style={{ ...S.panel, minHeight: 300 }}>
                <h3 style={S.h3}>Weapon Visual Preview</h3>
                <div style={{
                  display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 40, minHeight: 250,
                  background: 'radial-gradient(ellipse at center, rgba(30,25,40,0.8) 0%, rgba(10,10,20,1) 80%)',
                  borderRadius: 6, border: '1px solid rgba(74,60,40,0.3)',
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#8a7d65', fontSize: 10, marginBottom: 4 }}>PROJECTILE</div>
                    {currentWeapon?.projectile ? (
                      <ProjectileSpritePreview projKey={currentWeapon.projectile} scale={4} speed={100} />
                    ) : (
                      <div style={{ color: '#555', fontSize: 12, padding: 20 }}>Melee Weapon</div>
                    )}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#8a7d65', fontSize: 10, marginBottom: 4 }}>TRAIL EFFECT</div>
                    {currentWeapon?.trail && effectSprites[currentWeapon.trail] ? (
                      <EffectSpritePreview effectKey={currentWeapon.trail} scale={2} speed={80} />
                    ) : (
                      <div style={{ color: '#555', fontSize: 12, padding: 20 }}>No Trail</div>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ ...S.panel, marginTop: 12 }}>
                <h3 style={S.h3}>All Weapon Types</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
                  {allWeaponKeys.map(key => {
                    const w = weaponVisuals[key];
                    return (
                      <div key={key} onClick={() => setSelectedWeapon(key)} style={{
                        background: selectedWeapon === key ? 'rgba(139,92,246,0.3)' : 'rgba(0,0,0,0.3)',
                        border: selectedWeapon === key ? '1px solid #8b5cf6' : '1px solid rgba(74,60,40,0.3)',
                        borderRadius: 6, padding: 10, cursor: 'pointer',
                      }}>
                        <div style={{ fontSize: 13, color: '#c4b998', fontFamily: "'Cinzel', serif", marginBottom: 4 }}>{w.name}</div>
                        <div style={{ fontSize: 10, color: '#8a7d65' }}>
                          {w.projectile ? `Proj: ${projectileSprites[w.projectile]?.name}` : 'Melee'}
                        </div>
                        <div style={{ fontSize: 10, color: '#8a7d65' }}>Trail: {w.trail || 'none'}</div>
                        {w.projectile && (
                          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
                            <ProjectileSpritePreview projKey={w.projectile} scale={2} speed={100} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'layers' && (
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: '0 0 380px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={S.panel}>
                <h3 style={S.h3}>Effect Layer Presets</h3>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                  {Object.entries(effectLayerPresets).map(([key, preset]) => (
                    <button key={key} onClick={() => loadPreset(key)} style={{
                      ...S.btn(layerPreset === key ? '#8b5cf6' : '#333'),
                      border: layerPreset === key ? '1px solid #8b5cf6' : '1px solid #4a3c28',
                    }}>{preset.name}</button>
                  ))}
                </div>
              </div>
              <div style={S.panel}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <h3 style={{ ...S.h3, margin: 0 }}>Effect Layers ({effectLayers.length})</h3>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={saveEffectLayers} style={S.btn('#22c55e')}>Save</button>
                    <button onClick={copyLayersJSON} style={S.btn('#3b82f6')}>Copy JSON</button>
                    {copied && <span style={{ color: '#22c55e', fontSize: 11, alignSelf: 'center' }}>{copied}</span>}
                  </div>
                </div>
                <p style={{ fontSize: 10, color: '#8a7d65', marginBottom: 8 }}>
                  Stack multiple effects with individual timing. Each layer has its own delay (when it starts), duration (how long it plays), scale, opacity, and CSS filter. Use this to create complex multi-stage visual combos.
                </p>
                <div style={S.row}>
                  <span style={S.label}>Playback Speed</span>
                  <input type="range" min={30} max={200} value={layerSpeed} onChange={e => setLayerSpeed(Number(e.target.value))} style={{ flex: 1 }} />
                  <span style={S.val}>{layerSpeed}ms</span>
                </div>
                <div style={{ maxHeight: 500, overflow: 'auto' }}>
                  <EffectLayerEditor layers={effectLayers} onChange={setEffectLayers} />
                </div>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 400 }}>
              <div style={S.panel}>
                <h3 style={S.h3}>Layered Effect Preview</h3>
                <EffectLayerPreview layers={effectLayers} speed={layerSpeed} />
              </div>
              <div style={{ ...S.panel, marginTop: 12 }}>
                <h3 style={S.h3}>Timeline View</h3>
                <div style={{ fontSize: 10, color: '#8a7d65', marginBottom: 8 }}>
                  Total duration: {effectLayers.length > 0 ? Math.max(...effectLayers.map(l => l.delay + l.duration)) : 0}ms
                </div>
                {effectLayers.map((layer, idx) => {
                  const totalMax = Math.max(...effectLayers.map(l => l.delay + l.duration), 1);
                  const leftPct = (layer.delay / totalMax) * 100;
                  const widthPct = (layer.duration / totalMax) * 100;
                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: '#c4b998', minWidth: 60 }}>L{idx + 1}: {layer.effect}</span>
                      <div style={{ flex: 1, position: 'relative', height: 20, background: 'rgba(0,0,0,0.3)', borderRadius: 3 }}>
                        <div style={{
                          position: 'absolute', left: `${leftPct}%`, width: `${widthPct}%`,
                          height: '100%', background: `rgba(139,92,246,${layer.opacity * 0.5})`,
                          border: '1px solid rgba(139,92,246,0.8)', borderRadius: 3,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <span style={{ fontSize: 8, color: '#fff' }}>{layer.delay}ms - {layer.delay + layer.duration}ms</span>
                        </div>
                      </div>
                      <span style={{ fontSize: 9, color: '#8a7d65', minWidth: 40 }}>{layer.scale}x</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ ...S.panel, marginTop: 12 }}>
                <h3 style={S.h3}>Layer Configuration Export</h3>
                <pre style={{
                  background: 'rgba(0,0,0,0.4)', borderRadius: 4, padding: 12,
                  fontSize: 10, color: '#c4b998', overflow: 'auto', maxHeight: 200,
                  whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                }}>
                  {JSON.stringify({ layers: effectLayers }, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
