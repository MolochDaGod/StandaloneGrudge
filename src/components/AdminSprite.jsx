import React, { useState, useRef, useEffect, useCallback } from 'react';
import SpriteAnimation from './SpriteAnimation';
import { raceClassSpriteMap, effectSprites, beamTrails, abilityEffectMap, weaponSkillEffectMap, warriorTransformSprite, worgTransformSprite } from '../data/spriteMap';
import { classDefinitions } from '../data/classes';
import { WEAPON_SKILLS, CLASS_EQUIPMENT_RULES } from '../data/equipment';

const races = ['human', 'orc', 'elf', 'undead', 'barbarian', 'dwarf'];
const classes = ['warrior', 'mage', 'worge', 'ranger'];

const allEffectKeys = Object.keys(effectSprites);
const allBeamKeys = ['none', ...Object.keys(beamTrails)];

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
  shadowOffsetX: 0,
  shadowOffsetY: 45,
  shadowWidth: 60,
  shadowHeight: 10,
  nameOffsetX: 0,
  nameOffsetY: -15,
  hitLocationX: 0,
  hitLocationY: -10,
  spellPlayX: 0,
  spellPlayY: -20,
  effectScale: 1.5,
  effectOffsetX: 0,
  effectOffsetY: -20,
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
          width: fw,
          height: fh,
          backgroundImage: `url(${effect.src})`,
          backgroundSize: `${effect.cols * fw}px ${effect.rows * fh}px`,
          backgroundPosition: `-${col * fw}px -${row * fh}px`,
          backgroundRepeat: 'no-repeat',
          imageRendering: 'pixelated',
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
        width: displaySize,
        height: displaySize,
        backgroundImage: `url(${effect.src})`,
        backgroundSize: `${gridSize * displaySize}px ${gridSize * displaySize}px`,
        backgroundPosition: `-${col * displaySize}px -${row * displaySize}px`,
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
        filter: filter || 'none',
      }} />
    </div>
  );
}

function DraggableMarker({ label, color, x, y, onChange, containerRef }) {
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
    <div
      onMouseDown={handleMouseDown}
      style={{
        position: 'absolute',
        left: x - 6,
        top: y - 6,
        width: 12,
        height: 12,
        borderRadius: '50%',
        background: color,
        border: '2px solid #fff',
        cursor: 'grab',
        zIndex: 100,
        boxShadow: '0 0 6px rgba(0,0,0,0.8)',
      }}
      title={label}
    >
      <div style={{
        position: 'absolute',
        top: -18,
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: 9,
        color: '#fff',
        background: 'rgba(0,0,0,0.7)',
        padding: '1px 4px',
        borderRadius: 3,
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
      }}>{label}</div>
    </div>
  );
}

const selectStyle = {
  background: '#1a1a2e',
  color: '#e0d6c2',
  border: '1px solid #4a3c28',
  borderRadius: 4,
  padding: '4px 8px',
  fontSize: 13,
  outline: 'none',
  minWidth: 140,
};

const sliderRow = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 6,
};

const labelStyle = {
  color: '#c4b998',
  fontSize: 12,
  minWidth: 100,
  textAlign: 'right',
};

const valStyle = {
  color: '#ffd700',
  fontSize: 12,
  minWidth: 36,
  textAlign: 'left',
};

export default function AdminSprite() {
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

  const spriteData = raceClassSpriteMap[race]?.[cls];
  const skills = getAllSkillsForClass(cls);

  const transformSprite = cls === 'warrior' ? warriorTransformSprite :
    cls === 'worge' ? worgTransformSprite[race] : null;

  const activeSpriteData = showTransform && transformSprite ? transformSprite :
    (spriteData ? { ...spriteData, filter: cssFilter || spriteData.filter || '' } : null);

  const availableAnims = activeSpriteData ? Object.keys(activeSpriteData).filter(k =>
    typeof activeSpriteData[k] === 'object' && activeSpriteData[k]?.src && activeSpriteData[k]?.frames
  ) : [];

  useEffect(() => {
    if (skills.length > 0 && !selectedSkill) {
      setSelectedSkill(skills[0].id);
    }
  }, [cls]);

  useEffect(() => {
    if (selectedSkill) {
      const skill = skills.find(s => s.id === selectedSkill);
      if (skill) {
        const fx = getEffectForSkill(cls, skill);
        if (fx) {
          setEffectKey(fx.effect || 'weaponHit');
          setBeamKey(fx.beam || 'none');
          if (fx.anim && availableAnims.includes(fx.anim)) {
            setAnimation(fx.anim);
          }
          if (fx.effectFilter) {
            setEffectFilter(fx.effectFilter);
          } else {
            setEffectFilter('');
          }
        }
      }
    }
  }, [selectedSkill, cls]);

  const handleSkillChange = (skillId) => {
    setSelectedSkill(skillId);
    setShowEffect(true);
  };

  const updateLayout = (key, val) => {
    setLayout(prev => ({ ...prev, [key]: val }));
  };

  const saveLayout = () => {
    localStorage.setItem('adminSpriteLayout', JSON.stringify(layout));
    setCopied('Saved!');
    setTimeout(() => setCopied(''), 1500);
  };

  const resetLayout = () => {
    setLayout({ ...defaultLayout });
    localStorage.removeItem('adminSpriteLayout');
  };

  const copyLayoutJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(layout, null, 2));
    setCopied('Copied JSON!');
    setTimeout(() => setCopied(''), 1500);
  };

  const copyEffectConfig = () => {
    const skill = skills.find(s => s.id === selectedSkill);
    const config = {
      skillId: selectedSkill,
      skillName: skill?.name,
      effect: effectKey,
      beam: beamKey === 'none' ? null : beamKey,
      anim: animation,
      effectFilter: effectFilter || undefined,
      effectScale,
      effectSpeed,
    };
    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    setCopied('Copied effect config!');
    setTimeout(() => setCopied(''), 1500);
  };

  const spriteCenter = {
    x: activeSpriteData ? ((activeSpriteData.frameWidth || 100) * scale) / 2 : 150,
    y: activeSpriteData ? ((activeSpriteData.frameHeight || 100) * scale) / 2 : 150,
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a2e 50%, #0d0d1a 100%)',
      color: '#e0d6c2',
      fontFamily: "'Jost', sans-serif",
      padding: 20,
    }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <h1 style={{
          fontFamily: "'Cinzel', serif",
          color: '#ffd700',
          fontSize: 28,
          textAlign: 'center',
          marginBottom: 20,
          textShadow: '0 0 10px rgba(255,215,0,0.3)',
        }}>Admin Sprite Editor</h1>

        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: '0 0 320px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{
              background: 'rgba(20,15,30,0.9)',
              border: '1px solid #4a3c28',
              borderRadius: 8,
              padding: 16,
            }}>
              <h3 style={{ color: '#ffd700', fontFamily: "'Cinzel', serif", fontSize: 15, marginBottom: 10 }}>Character</h3>
              <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#8a7d65', marginBottom: 3 }}>Race</div>
                  <select value={race} onChange={e => setRace(e.target.value)} style={selectStyle}>
                    {races.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#8a7d65', marginBottom: 3 }}>Class</div>
                  <select value={cls} onChange={e => { setCls(e.target.value); setSelectedSkill(null); setShowTransform(false); }} style={selectStyle}>
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

            <div style={{
              background: 'rgba(20,15,30,0.9)',
              border: '1px solid #4a3c28',
              borderRadius: 8,
              padding: 16,
            }}>
              <h3 style={{ color: '#ffd700', fontFamily: "'Cinzel', serif", fontSize: 15, marginBottom: 10 }}>Skill / Ability</h3>
              <select
                value={selectedSkill || ''}
                onChange={e => handleSkillChange(e.target.value)}
                style={{ ...selectStyle, width: '100%' }}
              >
                <option value="" disabled>Select a skill...</option>
                {(() => {
                  const classSrc = skills.filter(s => s.type === 'class');
                  const weaponSrc = skills.filter(s => s.type === 'weapon');
                  const weaponsByType = {};
                  weaponSrc.forEach(s => {
                    if (!weaponsByType[s.source]) weaponsByType[s.source] = [];
                    weaponsByType[s.source].push(s);
                  });
                  return (
                    <>
                      <optgroup label="Class Abilities">
                        {classSrc.map(s => (
                          <option key={s.id} value={s.id}>{s.icon} {s.name} [{s.source}]</option>
                        ))}
                      </optgroup>
                      {Object.entries(weaponsByType).map(([wt, wSkills]) => (
                        <optgroup key={wt} label={`${wt.charAt(0).toUpperCase() + wt.slice(1)} Skills`}>
                          {wSkills.map(s => (
                            <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                          ))}
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
                    <div><strong style={{ color: '#c4b998' }}>Mapped Effect:</strong> {fx?.effect || 'none'}</div>
                    <div><strong style={{ color: '#c4b998' }}>Beam:</strong> {fx?.beam || 'none'}</div>
                    <div><strong style={{ color: '#c4b998' }}>Anim:</strong> {fx?.anim || 'attack1'}</div>
                    {fx?.comboAnims && <div><strong style={{ color: '#c4b998' }}>Combo:</strong> {fx.comboAnims.join(' → ')}</div>}
                  </div>
                ) : null;
              })()}
            </div>

            <div style={{
              background: 'rgba(20,15,30,0.9)',
              border: '1px solid #4a3c28',
              borderRadius: 8,
              padding: 16,
            }}>
              <h3 style={{ color: '#ffd700', fontFamily: "'Cinzel', serif", fontSize: 15, marginBottom: 10 }}>Sprite Controls</h3>
              <div style={sliderRow}>
                <span style={labelStyle}>Animation</span>
                <select value={animation} onChange={e => setAnimation(e.target.value)} style={{ ...selectStyle, flex: 1 }}>
                  {availableAnims.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div style={sliderRow}>
                <span style={labelStyle}>Speed (ms)</span>
                <input type="range" min={30} max={300} value={speed} onChange={e => setSpeed(Number(e.target.value))} style={{ flex: 1 }} />
                <span style={valStyle}>{speed}</span>
              </div>
              <div style={sliderRow}>
                <span style={labelStyle}>Scale</span>
                <input type="range" min={1} max={8} step={0.5} value={scale} onChange={e => setScale(Number(e.target.value))} style={{ flex: 1 }} />
                <span style={valStyle}>{scale}x</span>
              </div>
              <div style={sliderRow}>
                <span style={labelStyle}>Flip</span>
                <input type="checkbox" checked={flip} onChange={e => setFlip(e.target.checked)} />
              </div>
              <div style={sliderRow}>
                <span style={labelStyle}>CSS Filter</span>
                <input type="text" value={cssFilter} onChange={e => setCssFilter(e.target.value)} placeholder="e.g. hue-rotate(90deg)" style={{ ...selectStyle, flex: 1, fontSize: 11 }} />
              </div>
            </div>

            <div style={{
              background: 'rgba(20,15,30,0.9)',
              border: '1px solid #4a3c28',
              borderRadius: 8,
              padding: 16,
            }}>
              <h3 style={{ color: '#ffd700', fontFamily: "'Cinzel', serif", fontSize: 15, marginBottom: 10 }}>Effect Controls</h3>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#c4b998', marginBottom: 8 }}>
                <input type="checkbox" checked={showEffect} onChange={e => setShowEffect(e.target.checked)} />
                Show Effect Overlay
              </label>
              <div style={sliderRow}>
                <span style={labelStyle}>Effect</span>
                <select value={effectKey} onChange={e => setEffectKey(e.target.value)} style={{ ...selectStyle, flex: 1 }}>
                  {allEffectKeys.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div style={sliderRow}>
                <span style={labelStyle}>Beam</span>
                <select value={beamKey} onChange={e => setBeamKey(e.target.value)} style={{ ...selectStyle, flex: 1 }}>
                  {allBeamKeys.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div style={sliderRow}>
                <span style={labelStyle}>Effect Speed</span>
                <input type="range" min={30} max={200} value={effectSpeed} onChange={e => setEffectSpeed(Number(e.target.value))} style={{ flex: 1 }} />
                <span style={valStyle}>{effectSpeed}</span>
              </div>
              <div style={sliderRow}>
                <span style={labelStyle}>Effect Scale</span>
                <input type="range" min={0.5} max={5} step={0.25} value={effectScale} onChange={e => setEffectScale(Number(e.target.value))} style={{ flex: 1 }} />
                <span style={valStyle}>{effectScale}x</span>
              </div>
              <div style={sliderRow}>
                <span style={labelStyle}>Effect Filter</span>
                <input type="text" value={effectFilter} onChange={e => setEffectFilter(e.target.value)} placeholder="e.g. hue-rotate(90deg)" style={{ ...selectStyle, flex: 1, fontSize: 11 }} />
              </div>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 400 }}>
            <div style={{
              background: 'rgba(10,10,20,0.95)',
              border: '1px solid #4a3c28',
              borderRadius: 8,
              padding: 20,
              position: 'relative',
              minHeight: 500,
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}>
                <h3 style={{ color: '#ffd700', fontFamily: "'Cinzel', serif", fontSize: 15, margin: 0 }}>Preview</h3>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#c4b998' }}>
                  <input type="checkbox" checked={showMarkers} onChange={e => setShowMarkers(e.target.checked)} />
                  Show Layout Markers
                </label>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: 420,
                background: 'radial-gradient(ellipse at center, rgba(30,25,40,0.8) 0%, rgba(10,10,20,1) 80%)',
                borderRadius: 6,
                border: '1px solid rgba(74,60,40,0.3)',
                position: 'relative',
                overflow: 'hidden',
              }} ref={previewRef}>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  {activeSpriteData && (
                    <div style={{ position: 'relative' }}>
                      <SpriteAnimation
                        spriteData={activeSpriteData}
                        animation={animation}
                        scale={scale}
                        flip={flip}
                        loop={true}
                        speed={speed}
                      />

                      {showMarkers && (
                        <>
                          <div style={{
                            position: 'absolute',
                            left: spriteCenter.x + layout.shadowOffsetX - layout.shadowWidth / 2,
                            top: spriteCenter.y + layout.shadowOffsetY,
                            width: layout.shadowWidth,
                            height: layout.shadowHeight,
                            borderRadius: '50%',
                            background: 'rgba(0,0,0,0.5)',
                            pointerEvents: 'none',
                            border: '1px dashed rgba(255,255,255,0.3)',
                          }} />
                          <DraggableMarker
                            label="Shadow"
                            color="#666"
                            x={spriteCenter.x + layout.shadowOffsetX}
                            y={spriteCenter.y + layout.shadowOffsetY}
                            onChange={(x, y) => {
                              updateLayout('shadowOffsetX', Math.round(x - spriteCenter.x));
                              updateLayout('shadowOffsetY', Math.round(y - spriteCenter.y));
                            }}
                          />

                          <DraggableMarker
                            label="Name"
                            color="#ffd700"
                            x={spriteCenter.x + layout.nameOffsetX}
                            y={layout.nameOffsetY + 20}
                            onChange={(x, y) => {
                              updateLayout('nameOffsetX', Math.round(x - spriteCenter.x));
                              updateLayout('nameOffsetY', Math.round(y - 20));
                            }}
                          />

                          <DraggableMarker
                            label="Hit Point"
                            color="#ef4444"
                            x={spriteCenter.x + layout.hitLocationX}
                            y={spriteCenter.y + layout.hitLocationY}
                            onChange={(x, y) => {
                              updateLayout('hitLocationX', Math.round(x - spriteCenter.x));
                              updateLayout('hitLocationY', Math.round(y - spriteCenter.y));
                            }}
                          />
                          <div style={{
                            position: 'absolute',
                            left: spriteCenter.x + layout.hitLocationX - 8,
                            top: spriteCenter.y + layout.hitLocationY - 8,
                            width: 16,
                            height: 16,
                            border: '2px solid rgba(239,68,68,0.6)',
                            borderRadius: '50%',
                            pointerEvents: 'none',
                          }} />

                          <DraggableMarker
                            label="Spell Play"
                            color="#8b5cf6"
                            x={spriteCenter.x + layout.spellPlayX}
                            y={spriteCenter.y + layout.spellPlayY}
                            onChange={(x, y) => {
                              updateLayout('spellPlayX', Math.round(x - spriteCenter.x));
                              updateLayout('spellPlayY', Math.round(y - spriteCenter.y));
                            }}
                          />
                          <div style={{
                            position: 'absolute',
                            left: spriteCenter.x + layout.spellPlayX - 12,
                            top: spriteCenter.y + layout.spellPlayY - 12,
                            width: 24,
                            height: 24,
                            border: '2px dashed rgba(139,92,246,0.5)',
                            borderRadius: 4,
                            pointerEvents: 'none',
                          }} />

                          <DraggableMarker
                            label="Effect"
                            color="#22c55e"
                            x={spriteCenter.x + layout.effectOffsetX}
                            y={spriteCenter.y + layout.effectOffsetY}
                            onChange={(x, y) => {
                              updateLayout('effectOffsetX', Math.round(x - spriteCenter.x));
                              updateLayout('effectOffsetY', Math.round(y - spriteCenter.y));
                            }}
                          />
                        </>
                      )}

                      {showEffect && (
                        <div style={{
                          position: 'absolute',
                          left: spriteCenter.x + layout.effectOffsetX,
                          top: spriteCenter.y + layout.effectOffsetY,
                          transform: 'translate(-50%, -50%)',
                          pointerEvents: 'none',
                          zIndex: 50,
                        }}>
                          <EffectSpritePreview
                            effectKey={effectKey}
                            scale={effectScale}
                            speed={effectSpeed}
                            filter={effectFilter}
                          />
                        </div>
                      )}

                      {showEffect && beamKey !== 'none' && beamTrails[beamKey] && (
                        <div style={{
                          position: 'absolute',
                          left: spriteCenter.x + 50,
                          top: spriteCenter.y - 2,
                          width: 120,
                          height: 12,
                          zIndex: 45,
                          pointerEvents: 'none',
                        }}>
                          <img
                            src={beamTrails[beamKey]}
                            alt="beam"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'fill',
                              imageRendering: 'pixelated',
                              opacity: 0.9,
                            }}
                          />
                        </div>
                      )}

                      {showMarkers && (
                        <div style={{
                          position: 'absolute',
                          left: spriteCenter.x + layout.nameOffsetX,
                          top: layout.nameOffsetY + 20,
                          transform: 'translateX(-50%)',
                          pointerEvents: 'none',
                          zIndex: 60,
                        }}>
                          <div style={{
                            color: '#ffd700',
                            fontSize: 11,
                            fontFamily: "'Cinzel', serif",
                            textShadow: '0 0 4px rgba(0,0,0,0.8)',
                            whiteSpace: 'nowrap',
                            padding: '1px 6px',
                            background: 'rgba(0,0,0,0.4)',
                            borderRadius: 3,
                          }}>{race} {cls}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginTop: 12, fontSize: 11, color: '#8a7d65' }}>
                <strong>Sprite:</strong> {activeSpriteData?.folder || 'none'} |{' '}
                <strong>Frame:</strong> {(activeSpriteData?.frameWidth || 100)}x{(activeSpriteData?.frameHeight || 100)}px |{' '}
                <strong>Anim Frames:</strong> {activeSpriteData?.[animation]?.frames || 0}
              </div>
            </div>

            <div style={{
              background: 'rgba(20,15,30,0.9)',
              border: '1px solid #4a3c28',
              borderRadius: 8,
              padding: 16,
              marginTop: 12,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h3 style={{ color: '#ffd700', fontFamily: "'Cinzel', serif", fontSize: 15, margin: 0 }}>Layout Offsets (drag markers or use sliders)</h3>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={saveLayout} style={{ background: '#22c55e', color: '#000', border: 'none', borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>Save</button>
                  <button onClick={copyLayoutJSON} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>Copy JSON</button>
                  <button onClick={copyEffectConfig} style={{ background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>Copy Effect</button>
                  <button onClick={resetLayout} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>Reset</button>
                  {copied && <span style={{ color: '#22c55e', fontSize: 11, alignSelf: 'center' }}>{copied}</span>}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
                {[
                  ['shadowOffsetX', 'Shadow X', -100, 100],
                  ['shadowOffsetY', 'Shadow Y', -50, 100],
                  ['shadowWidth', 'Shadow W', 10, 120],
                  ['shadowHeight', 'Shadow H', 2, 30],
                  ['nameOffsetX', 'Name X', -100, 100],
                  ['nameOffsetY', 'Name Y', -60, 60],
                  ['hitLocationX', 'Hit X', -80, 80],
                  ['hitLocationY', 'Hit Y', -80, 80],
                  ['spellPlayX', 'Spell X', -80, 80],
                  ['spellPlayY', 'Spell Y', -80, 80],
                  ['effectOffsetX', 'Effect X', -100, 100],
                  ['effectOffsetY', 'Effect Y', -100, 100],
                ].map(([key, label, min, max]) => (
                  <div key={key} style={sliderRow}>
                    <span style={{ ...labelStyle, minWidth: 70 }}>{label}</span>
                    <input type="range" min={min} max={max} value={layout[key]} onChange={e => updateLayout(key, Number(e.target.value))} style={{ flex: 1 }} />
                    <span style={valStyle}>{layout[key]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              background: 'rgba(20,15,30,0.9)',
              border: '1px solid #4a3c28',
              borderRadius: 8,
              padding: 16,
              marginTop: 12,
            }}>
              <h3 style={{ color: '#ffd700', fontFamily: "'Cinzel', serif", fontSize: 15, marginBottom: 10 }}>All Available Effects</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8, maxHeight: 400, overflow: 'auto' }}>
                {allEffectKeys.map(key => (
                  <div
                    key={key}
                    onClick={() => { setEffectKey(key); setShowEffect(true); }}
                    style={{
                      background: effectKey === key ? 'rgba(139,92,246,0.3)' : 'rgba(0,0,0,0.3)',
                      border: effectKey === key ? '1px solid #8b5cf6' : '1px solid rgba(74,60,40,0.3)',
                      borderRadius: 6,
                      padding: 6,
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'center', height: 50 }}>
                      <EffectSpritePreview effectKey={key} scale={0.8} speed={100} />
                    </div>
                    <div style={{ fontSize: 9, color: '#c4b998', marginTop: 4, wordBreak: 'break-all' }}>{key}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              background: 'rgba(20,15,30,0.9)',
              border: '1px solid #4a3c28',
              borderRadius: 8,
              padding: 16,
              marginTop: 12,
            }}>
              <h3 style={{ color: '#ffd700', fontFamily: "'Cinzel', serif", fontSize: 15, marginBottom: 10 }}>Beam Trails</h3>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {Object.entries(beamTrails).map(([key, src]) => (
                  <div
                    key={key}
                    onClick={() => { setBeamKey(key); setShowEffect(true); }}
                    style={{
                      background: beamKey === key ? 'rgba(139,92,246,0.3)' : 'rgba(0,0,0,0.3)',
                      border: beamKey === key ? '1px solid #8b5cf6' : '1px solid rgba(74,60,40,0.3)',
                      borderRadius: 6,
                      padding: 8,
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    <img src={src} alt={key} style={{ width: 80, height: 16, imageRendering: 'pixelated', objectFit: 'fill' }} />
                    <div style={{ fontSize: 10, color: '#c4b998', marginTop: 4 }}>{key}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
