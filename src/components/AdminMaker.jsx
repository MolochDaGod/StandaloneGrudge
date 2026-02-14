import React, { useState, useMemo } from 'react';
import SpriteAnimation from './SpriteAnimation';
import { spriteSheets, raceClassSpriteMap, getPlayerSprite, namedHeroes } from '../data/spriteMap';

const SECTIONS = [
  { id: 'overview', label: 'Sprite Forge', color: '#ffd700' },
  { id: 'architecture', label: 'Architecture', color: '#3b82f6' },
  { id: 'anatomy', label: 'Sheet Anatomy', color: '#a855f7' },
  { id: 'animations', label: 'Animation Gallery', color: '#ef4444' },
  { id: 'skeleton', label: 'Skeleton Rigging', color: '#22c55e' },
  { id: 'filters', label: 'Filters & Tints', color: '#f59e0b' },
  { id: 'ai', label: 'AI Creation', color: '#ec4899' },
  { id: 'rules', label: 'Golden Rules', color: '#06b6d4' },
];

const ANIMATION_TYPES = [
  { name: 'idle', desc: 'Standing still, breathing, weapon sway. 4-10 frames. Always looping.', frames: '4-10', fps: 8 },
  { name: 'walk/run', desc: 'Locomotion cycle. 6-8 frames. Must loop seamlessly at frame 0.', frames: '6-8', fps: 10 },
  { name: 'attack1', desc: 'Primary attack — fast strike. 6-9 frames. Anticipation → strike → recovery.', frames: '6-9', fps: 12 },
  { name: 'attack2', desc: 'Heavy/special attack. 8-12 frames. Wider arc, more anticipation.', frames: '8-12', fps: 10 },
  { name: 'attack3', desc: 'Ultimate attack. 10-13 frames. Can include effect layer.', frames: '10-13', fps: 10 },
  { name: 'cast', desc: 'Spell casting. 9-11 frames. Charge-up → release pose.', frames: '9-11', fps: 10 },
  { name: 'hurt', desc: 'Taking damage. 2-4 frames. Quick recoil, head snap back.', frames: '2-4', fps: 8 },
  { name: 'death', desc: 'Death sequence. 4-18 frames. Non-looping. Final frame persists.', frames: '4-18', fps: 8 },
  { name: 'block', desc: 'Shield raise. 3-4 frames. Defensive crouch.', frames: '3-4', fps: 8 },
  { name: 'jump', desc: 'Vertical leap. 2-3 frames. Used in scene movement.', frames: '2-3', fps: 10 },
];

const SKELETON_BONES = [
  { name: 'spine', parent: 'hip', child: 'neck', color: '#00CCFF', desc: 'Core torso support' },
  { name: 'neck', parent: 'neck', child: 'head', color: '#FF4444', desc: 'Head attachment' },
  { name: 'shoulderL/R', parent: 'neck', child: 'shoulder', color: '#FF8800', desc: 'Arm root joints' },
  { name: 'upperArmL/R', parent: 'shoulder', child: 'elbow', color: '#FFCC00', desc: 'Upper arm swing' },
  { name: 'forearmL/R', parent: 'elbow', child: 'wrist', color: '#88FF00', desc: 'Forearm rotation' },
  { name: 'thighL/R', parent: 'hipL/R', child: 'knee', color: '#8844FF', desc: 'Upper leg, walk driver' },
  { name: 'shinL/R', parent: 'knee', child: 'ankle', color: '#FF44CC', desc: 'Lower leg follow-through' },
  { name: 'weapon', parent: 'wristR', child: 'weaponTip', color: '#FF0000', desc: 'Weapon attachment bone' },
];

const MATERIAL_LABELS = [
  { name: 'skin', color: '#FFB07C', desc: 'Skin/flesh tones — deforms naturally' },
  { name: 'hair', color: '#8B4513', desc: 'Hair — secondary motion, trail effect' },
  { name: 'fabric', color: '#4169E1', desc: 'Cloth/cape — 35% dampened rotation for soft billowing' },
  { name: 'leather', color: '#8B6914', desc: 'Leather armor — moderate flexibility' },
  { name: 'metal', color: '#C0C0C0', desc: 'Metal plate — rigid, no deformation' },
  { name: 'wood', color: '#966F33', desc: 'Wooden shields, handles — moderate rigidity' },
  { name: 'gem', color: '#00CED1', desc: 'Crystals, gems — glow-eligible' },
  { name: 'magic', color: '#FF00FF', desc: 'Magical aura — particle-eligible, can glow/pulse' },
];

const FILTER_EXAMPLES = [
  { label: 'Orc Green Skin', filter: 'hue-rotate(90deg) saturate(1.4) brightness(1.05)', desc: 'Turns human skin tones into orcish green' },
  { label: 'Elf Mystical', filter: 'hue-rotate(90deg) saturate(1.3) brightness(1.1)', desc: 'Cool ethereal coloring for elven worge' },
  { label: 'Undead Ghastly', filter: 'hue-rotate(180deg) saturate(0.6) brightness(0.7)', desc: 'Desaturated blueish tones for undead' },
  { label: 'Barbarian Weathered', filter: 'sepia(0.5) saturate(1.5) brightness(0.9)', desc: 'Warm earth tones for tribal warrior' },
  { label: 'Undead Inverted', filter: 'invert(0.85) hue-rotate(180deg) saturate(1.4)', desc: 'Ghostly negative effect' },
  { label: 'Dark Barbarian Mage', filter: 'sepia(0.6) saturate(1.3) hue-rotate(-10deg) brightness(0.85) contrast(1.1)', desc: 'Dark ritualistic feel' },
  { label: 'Grayscale Undead', filter: 'saturate(0) brightness(0.7) contrast(1.2)', desc: 'Pure bone/ash coloring' },
  { label: 'Dwarf Short & Wide', dwarfTransform: 'scaleX(1.3) scaleY(0.75)', filter: 'hue-rotate(30deg) saturate(1.4) brightness(1.05)', desc: 'CSS transform makes characters look stocky' },
];

const AI_PROMPTS = [
  {
    title: 'Sprite Sheet Generation Prompt',
    prompt: `Create a pixel art sprite sheet for a [RACE] [CLASS] character for a dark fantasy RPG game.

TECHNICAL REQUIREMENTS:
- Output: Single horizontal PNG strip (all frames in one row)
- Frame size: [WIDTH]x[HEIGHT] pixels per frame (common sizes: 100x100, 128x128, 231x190)
- Background: Fully transparent (PNG alpha)
- Style: Pixel art, consistent proportions across all frames
- Character faces RIGHT by default
- Bottom-aligned: Character feet touch the bottom edge of the frame
- Consistent silhouette: Character stays within frame bounds across all animations

ANIMATION SET (separate sheet per animation):
idle: [4-6 frames] subtle breathing, weapon idle sway
run: [6-8 frames] seamless looping locomotion cycle
attack1: [6-9 frames] fast primary strike with anticipation
attack2: [8-12 frames] heavy special attack, wide arc
hurt: [2-4 frames] damage recoil, head snap back
death: [4-7 frames] falling sequence, final frame = resting pose

VISUAL NOTES:
- Dark fantasy aesthetic (ornate armor, glowing runes, weathered gear)
- Clear silhouette readable at small sizes (50-100px display height)
- Equipment should have visible detail but not noise
- Color palette should support CSS filter recoloring for racial variants`,
  },
  {
    title: 'AI Auto-Rig Prompt (GPT-4o Vision)',
    prompt: `Analyze this character sprite image and provide skeleton joint positions.

Return a JSON object with normalized coordinates (0.0 to 1.0) for these 16 joints:
{
  "head": {"x": 0.50, "y": 0.08},
  "neck": {"x": 0.50, "y": 0.22},
  "shoulderL": {"x": 0.35, "y": 0.24},
  "shoulderR": {"x": 0.65, "y": 0.24},
  "elbowL": {"x": 0.28, "y": 0.40},
  "elbowR": {"x": 0.72, "y": 0.40},
  "wristL": {"x": 0.25, "y": 0.55},
  "wristR": {"x": 0.75, "y": 0.55},
  "hip": {"x": 0.50, "y": 0.52},
  "hipL": {"x": 0.42, "y": 0.54},
  "hipR": {"x": 0.58, "y": 0.54},
  "kneeL": {"x": 0.40, "y": 0.72},
  "kneeR": {"x": 0.60, "y": 0.72},
  "ankleL": {"x": 0.38, "y": 0.92},
  "ankleR": {"x": 0.62, "y": 0.92},
  "weaponTip": {"x": 0.83, "y": 0.40}
}

Also identify material zones: skin, hair, fabric, leather, metal, wood, gem, magic.
Assign body zones for animation: head, torso, armL, armR, legL, legR, weapon.`,
  },
  {
    title: 'Inpainting / Frame Repair Prompt',
    prompt: `Fix this sprite animation frame. The character is a [RACE] [CLASS] in a dark fantasy RPG.

CONTEXT:
- This is frame [N] of the [ANIMATION_TYPE] animation
- Previous frame shows: [describe previous pose]
- Next frame shows: [describe next pose]
- The masked/highlighted region needs to be repainted to smoothly interpolate between the previous and next poses

CONSTRAINTS:
- Maintain exact pixel art style (no anti-aliasing, hard pixel edges)
- Keep color palette consistent with the existing sprite
- Preserve transparent background
- Character proportions must match other frames exactly
- Equipment/weapon details must be consistent`,
  },
];

const GOLDEN_RULES = [
  { icon: '1', title: 'Containerless by Default', desc: 'Sprites render with width:0, height:0, overflow:visible. They NEVER push UI elements, map nodes, or containers around. Only admin/UI panels use containerless={false}.' },
  { icon: '2', title: 'Bottom-Center Anchor', desc: 'All sprites anchor at bottom-center (transformOrigin: "bottom center"). Characters "stand" on their anchor point. This ensures consistent ground-level alignment.' },
  { icon: '3', title: 'Uniform Scale by frameHeight', desc: 'All sprites scale to a uniform 200px display height based on frameHeight. No per-combo scale overrides for display — only data-level scale for gameplay balance.' },
  { icon: '4', title: 'Horizontal Strip Format', desc: 'Each animation is a single horizontal PNG strip. Frame 0 at left, frames arranged left-to-right. Background position animates via CSS: backgroundPosition = -frame * displayWidth.' },
  { icon: '5', title: 'Race Recoloring via CSS Filters', desc: 'One base sprite sheet can serve multiple races via CSS filter chains (hue-rotate, saturate, brightness, sepia). This saves massive sprite production effort.' },
  { icon: '6', title: 'facesLeft Flag', desc: 'Some sprite sheets face left by default (e.g., dwarf-worge). The facesLeft:true property tells the engine to flip them so all characters face right in battle.' },
  { icon: '7', title: 'Hitbox from Sprite Size', desc: 'BattleScreen calculates hitboxes from sprite display size: hitW = spriteSize * 0.5, hitH = spriteSize * 0.75. Consistent frame sizes = consistent gameplay.' },
  { icon: '8', title: 'Equipment Overlays on Top', desc: 'Equipment tier glow overlays render ON TOP of the sprite in defined zones (weapon: 45% top, helmet: 0-28%, armor: 28-63%, feet: 75-100%). Higher tiers pulse brighter.' },
  { icon: '9', title: 'Named Hero Override System', desc: 'Named heroes (like Racalvin) bypass the race/class sprite map entirely via namedHeroId. They get custom sprite sheets, avatars, card backgrounds, and unlock cinematics.' },
  { icon: '10', title: 'Effect Layers are Separate', desc: 'VFX (fire, ice, lightning, heal beams) are separate sprite sheets. They overlay above character sprites using the z-index layer system. Never bake effects into character sheets.' },
];

function SectionHeader({ title, color, subtitle }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{
        fontFamily: "'Cinzel', serif", fontSize: '1.4rem', fontWeight: 700,
        color, margin: 0, textShadow: `0 0 20px ${color}40`,
      }}>{title}</h2>
      {subtitle && <p style={{ color: '#8a8d94', fontSize: '0.75rem', marginTop: 4 }}>{subtitle}</p>}
      <div style={{ height: 2, background: `linear-gradient(90deg, ${color}, transparent)`, marginTop: 8 }} />
    </div>
  );
}

function CodeBlock({ code, title }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{
      background: 'rgba(0,0,0,0.5)', borderRadius: 8, overflow: 'hidden',
      border: '1px solid rgba(255,215,0,0.1)', marginBottom: 12,
    }}>
      {title && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '6px 12px', background: 'rgba(255,215,0,0.05)',
          borderBottom: '1px solid rgba(255,215,0,0.1)',
        }}>
          <span style={{ fontSize: '0.65rem', color: '#b4966a', fontWeight: 600 }}>{title}</span>
          <button
            onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            style={{
              background: 'none', border: '1px solid rgba(255,215,0,0.2)', borderRadius: 4,
              color: copied ? '#22c55e' : '#8a8d94', cursor: 'pointer', fontSize: '0.6rem', padding: '2px 8px',
            }}
          >{copied ? 'Copied!' : 'Copy'}</button>
        </div>
      )}
      <pre style={{
        padding: 12, margin: 0, fontSize: '0.65rem', lineHeight: 1.5,
        color: '#a0e8b0', overflow: 'auto', maxHeight: 400,
        fontFamily: "'Fira Code', 'Consolas', monospace",
      }}>{code}</pre>
    </div>
  );
}

function InfoCard({ title, value, detail, color = '#ffd700' }) {
  return (
    <div style={{
      background: 'rgba(20,15,30,0.6)', border: `1px solid ${color}20`,
      borderRadius: 8, padding: 12, minWidth: 120,
    }}>
      <div style={{ fontSize: '1.2rem', fontWeight: 700, color, fontFamily: "'Cinzel', serif" }}>{value}</div>
      <div style={{ fontSize: '0.7rem', color: '#e2e8f0', fontWeight: 600, marginTop: 2 }}>{title}</div>
      {detail && <div style={{ fontSize: '0.6rem', color: '#8a8d94', marginTop: 4 }}>{detail}</div>}
    </div>
  );
}

export default function AdminMaker() {
  const [activeSection, setActiveSection] = useState('overview');
  const [previewAnim, setPreviewAnim] = useState('idle');
  const [previewSpeed, setPreviewSpeed] = useState(120);
  const [expandedPrompt, setExpandedPrompt] = useState(null);

  const allSpriteKeys = useMemo(() => Object.keys(spriteSheets), []);
  const [selectedSprite, setSelectedSprite] = useState('knight');

  const currentSpriteData = spriteSheets[selectedSprite];
  const availableAnims = currentSpriteData
    ? Object.keys(currentSpriteData).filter(k => typeof currentSpriteData[k] === 'object' && currentSpriteData[k]?.src)
    : [];

  const spriteStats = useMemo(() => {
    const sheets = Object.keys(spriteSheets).length;
    let totalAnims = 0;
    let totalFrames = 0;
    const frameSizes = new Set();
    Object.values(spriteSheets).forEach(s => {
      Object.values(s).forEach(v => {
        if (v && typeof v === 'object' && v.src) {
          totalAnims++;
          totalFrames += v.frames || 0;
        }
      });
      const fw = s.frameWidth || 100;
      const fh = s.frameHeight || 100;
      frameSizes.add(`${fw}x${fh}`);
    });
    return { sheets, totalAnims, totalFrames, frameSizes: [...frameSizes] };
  }, []);

  const renderOverview = () => (
    <div>
      <SectionHeader title="Sprite Forge — Knowledge Base" color="#ffd700" subtitle="Everything learned from building Grudge Warlords sprites + Sprite Animator Pro insights" />

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <InfoCard title="Sprite Sheets" value={spriteStats.sheets} detail="Unique sprite definitions" color="#a855f7" />
        <InfoCard title="Total Animations" value={spriteStats.totalAnims} detail="Across all sheets" color="#3b82f6" />
        <InfoCard title="Total Frames" value={spriteStats.totalFrames} detail="Individual animation frames" color="#22c55e" />
        <InfoCard title="Race/Class Combos" value="24" detail="6 races x 4 classes" color="#ffd700" />
        <InfoCard title="Frame Sizes" value={spriteStats.frameSizes.length} detail={spriteStats.frameSizes.slice(0, 4).join(', ')} color="#f59e0b" />
        <InfoCard title="Named Heroes" value={Object.keys(namedHeroes || {}).length || 1} detail="Secret unlockable characters" color="#ec4899" />
      </div>

      <div style={{
        background: 'rgba(20,15,30,0.5)', border: '1px solid rgba(255,215,0,0.12)',
        borderRadius: 10, padding: 16, marginBottom: 20,
      }}>
        <h3 style={{ fontFamily: "'Cinzel', serif", color: '#ffd700', fontSize: '1rem', margin: '0 0 10px' }}>
          What Is This Page?
        </h3>
        <p style={{ fontSize: '0.75rem', color: '#c0c0c8', lineHeight: 1.6 }}>
          This is the <strong style={{ color: '#ffd700' }}>Sprite Maker Knowledge Base</strong> — a living document of everything
          we've learned about creating, rigging, animating, and integrating 2D sprite sheets for Grudge Warlords.
          It combines insights from building our own sprite system with analysis of the Sprite Animator Pro tool
          (skeleton rigging, AI auto-rig, canvas-based frame generation, material labeling).
        </p>
        <p style={{ fontSize: '0.75rem', color: '#c0c0c8', lineHeight: 1.6, marginTop: 8 }}>
          Use this as a reference for creating new sprites, training AI to generate sprite sheets,
          understanding the animation pipeline, and maintaining consistency across the project's 24+ character combinations.
        </p>
      </div>

      <div style={{
        background: 'rgba(20,15,30,0.5)', border: '1px solid rgba(168,85,247,0.15)',
        borderRadius: 10, padding: 16,
      }}>
        <h3 style={{ fontFamily: "'Cinzel', serif", color: '#a855f7', fontSize: '1rem', margin: '0 0 10px' }}>
          Sprite Animator Pro — Key Takeaways
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
          {[
            { t: '16-Bone Skeleton Hierarchy', d: 'Head, neck, 2 shoulders, 2 elbows, 2 wrists, hip, 2 hip joints, 2 knees, 2 ankles, weaponTip. Normalized 0-1 coordinates.' },
            { t: 'AI Auto-Rig via GPT-4o Vision', d: 'Sends character image to GPT-4o, receives back joint positions + material zones + body part assignments automatically.' },
            { t: 'Canvas-Based Sprite Engine', d: 'Client-side frame generation. Extracts character parts, applies bone transforms per frame, interpolates between keyframe poses.' },
            { t: 'Material-Aware Animation', d: 'Labels parts as skin/hair/fabric/leather/metal/wood/gem/magic. Fabric gets 35% dampened rotation for natural cloth billow.' },
            { t: 'BFS Background Removal', d: 'Flood-fill from edges to remove solid backgrounds. Tolerance-based color matching with alpha feathering at edges.' },
            { t: 'Frame-Level Editing', d: 'Per-frame skeleton adjustment, stretch/scale tool for regions, and AI inpainting (brush mask → GPT generates fill).' },
          ].map(item => (
            <div key={item.t} style={{
              background: 'rgba(168,85,247,0.08)', borderRadius: 6, padding: 10,
              border: '1px solid rgba(168,85,247,0.12)',
            }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#c4b5fd', marginBottom: 4 }}>{item.t}</div>
              <div style={{ fontSize: '0.6rem', color: '#9ca3af', lineHeight: 1.5 }}>{item.d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderArchitecture = () => (
    <div>
      <SectionHeader title="Sprite Architecture" color="#3b82f6" subtitle="How the containerless sprite system works from data to render" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div>
          <h4 style={{ color: '#3b82f6', fontSize: '0.8rem', fontWeight: 700, marginBottom: 8 }}>Data Flow</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { step: '1', label: 'spriteMap.js', desc: 'Defines all sprite sheets, frame sizes, animation sources' },
              { step: '2', label: 'raceClassSpriteMap', desc: 'Maps race+class combos to sprite sheets with optional filters' },
              { step: '3', label: 'getPlayerSprite()', desc: 'Resolves named hero overrides, then falls back to race/class map' },
              { step: '4', label: 'SpriteAnimation', desc: 'Renders the sprite with CSS background-position animation' },
              { step: '5', label: 'Equipment Overlays', desc: 'Tier-based glow overlays rendered on top of the sprite' },
            ].map(s => (
              <div key={s.step} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', background: '#3b82f6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.65rem', fontWeight: 700, color: '#fff', flexShrink: 0,
                }}>{s.step}</div>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#93c5fd' }}>{s.label}</div>
                  <div style={{ fontSize: '0.6rem', color: '#8a8d94' }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 style={{ color: '#3b82f6', fontSize: '0.8rem', fontWeight: 700, marginBottom: 8 }}>Layer System (Z-Index)</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { z: '10501+', label: 'MODALS / TOOLTIPS', color: '#ef4444' },
              { z: '10500', label: 'UI OVERLAY (panels, hotbar)', color: '#f59e0b' },
              { z: '200-300', label: 'VFX / EFFECTS', color: '#a855f7' },
              { z: '100-199', label: 'CHARACTER SPRITES', color: '#3b82f6' },
              { z: '50-99', label: 'MAP NODES / TERRAIN', color: '#22c55e' },
              { z: '1-49', label: 'BACKGROUND', color: '#6b7280' },
            ].map(l => (
              <div key={l.z} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '4px 8px', borderRadius: 4,
                background: `${l.color}10`, borderLeft: `3px solid ${l.color}`,
              }}>
                <span style={{ fontSize: '0.6rem', color: l.color, fontFamily: 'monospace', width: 60, fontWeight: 700 }}>{l.z}</span>
                <span style={{ fontSize: '0.65rem', color: '#c0c0c8' }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <CodeBlock title="Containerless Sprite Rendering (width:0, height:0)" code={`// SpriteAnimation.jsx — containerless mode (default)
<div style={{
  position: 'relative',
  width: 0,          // ← ZERO width
  height: 0,         // ← ZERO height
  overflow: 'visible', // ← content paints outside
  imageRendering: 'pixelated',
}}>
  <div style={{
    position: 'absolute',
    bottom: 0,        // ← anchored at bottom
    left: '50%',      // ← centered horizontally
    transform: 'translateX(-50%)',
    transformOrigin: 'bottom center',
    width: displayWidth,   // frameWidth * scale
    height: displayHeight, // frameHeight * scale
    overflow: 'hidden',
    pointerEvents: 'none',
  }}>
    {/* Sprite image via CSS background */}
  </div>
</div>

// KEY: The 0x0 parent means the sprite has NO layout impact.
// It can be scaled to any size without pushing siblings around.
// Used in BattleScreen, world map, scene views.
// Admin panels use containerless={false} for grid/flex layouts.`} />

      <CodeBlock title="Sprite Data Structure" code={`// Each sprite sheet in spriteMap.js follows this pattern:
const spriteSheet = {
  folder: 'knight',            // Asset folder under /sprites/
  frameWidth: 100,             // Width of one frame in pixels (default: 100)
  frameHeight: 100,            // Height of one frame in pixels (default: 100)
  facesLeft: false,            // If true, engine flips sprite to face right
  filter: '',                  // CSS filter string for racial recoloring
  scale: 1,                    // Data-level scale modifier
  dwarfTransform: '',          // CSS transform for body proportions

  // Animations — each is a horizontal PNG strip:
  idle:    { src: '/sprites/knight/idle.png',    frames: 6 },
  attack1: { src: '/sprites/knight/attack1.png', frames: 7 },
  attack2: { src: '/sprites/knight/attack2.png', frames: 10 },
  hurt:    { src: '/sprites/knight/hurt.png',    frames: 4 },
  death:   { src: '/sprites/knight/death.png',   frames: 4 },
  walk:    { src: '/sprites/knight/walk.png',    frames: 8 },

  // Optional: effect layers
  attack3_effect: { src: '/sprites/knight/attack3_effect.png', frames: 11 },
};`} />

      <CodeBlock title="Race/Class → Sprite Mapping" code={`// raceClassSpriteMap in spriteMap.js
export const raceClassSpriteMap = {
  human: {
    warrior: spriteSheets.knight,
    mage:    spriteSheets.wizard,
    worge:   spriteSheets.priest,
    ranger:  spriteSheets['human-ranger'],
  },
  orc: {
    warrior: spriteSheets['elite-orc'],
    // CSS filter transforms human sprite → orc coloring:
    mage: {
      ...spriteSheets['wizard-pack'],
      filter: 'hue-rotate(90deg) saturate(1.4) brightness(1.05)',
      scale: 0.7,
    },
    worge: spriteSheets.orc,
    ranger: spriteSheets['armored-orc'],
  },
  dwarf: {
    // dwarfTransform squashes proportions:
    mage: {
      ...spriteSheets['fire-wizard'],
      filter: 'hue-rotate(30deg) saturate(1.4) brightness(1.05)',
      scale: 0.7,
      dwarfTransform: 'scaleX(1.3) scaleY(0.75)',
    },
  },
};`} />
    </div>
  );

  const renderAnatomy = () => (
    <div>
      <SectionHeader title="Sprite Sheet Anatomy" color="#a855f7" subtitle="Frame structure, sizing conventions, and animation strip format" />

      <div style={{
        background: 'rgba(20,15,30,0.5)', border: '1px solid rgba(168,85,247,0.15)',
        borderRadius: 10, padding: 16, marginBottom: 20,
      }}>
        <h4 style={{ color: '#c4b5fd', fontSize: '0.8rem', marginBottom: 12 }}>Horizontal Strip Format</h4>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 2, padding: 12,
          background: 'repeating-conic-gradient(rgba(100,100,100,0.15) 0% 25%, transparent 0% 50%) 50% / 16px 16px',
          borderRadius: 6, overflow: 'auto',
        }}>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} style={{
              width: 60, height: 60, border: '1px dashed rgba(168,85,247,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.55rem', color: '#a855f7', flexShrink: 0,
              background: i === 0 ? 'rgba(168,85,247,0.1)' : 'transparent',
            }}>
              Frame {i}
            </div>
          ))}
          <div style={{ fontSize: '0.6rem', color: '#8a8d94', padding: '0 8px' }}>→ PNG</div>
        </div>
        <p style={{ fontSize: '0.6rem', color: '#8a8d94', marginTop: 8 }}>
          Each animation is saved as a single horizontal strip PNG. The engine reads frames left-to-right
          using CSS <code style={{ color: '#a0e8b0' }}>backgroundPosition: -frame * displayWidth</code>.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10, marginBottom: 20 }}>
        {ANIMATION_TYPES.map(a => (
          <div key={a.name} style={{
            background: 'rgba(20,15,30,0.5)', border: '1px solid rgba(168,85,247,0.1)',
            borderRadius: 8, padding: 10,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#e2e8f0' }}>{a.name}</span>
              <span style={{ fontSize: '0.55rem', color: '#a855f7', background: 'rgba(168,85,247,0.15)', padding: '1px 6px', borderRadius: 4 }}>{a.frames}f</span>
            </div>
            <p style={{ fontSize: '0.55rem', color: '#8a8d94', margin: 0, lineHeight: 1.4 }}>{a.desc}</p>
          </div>
        ))}
      </div>

      <CodeBlock title="Frame Size Standards Used in Grudge Warlords" code={`Common frame dimensions across our sprite sheets:

100 x 100  — Default for most character sprites (knight, priest, wizard)
128 x 128  — Mid-size characters (necromancer, some boss sprites)
231 x 190  — Large sprites (wizard-pack, elf-mage) — higher detail
175 x 100  — Wide sprites (barbarian-warrior) — extra attack reach
140 x 140  — Boss sprites (evil-wizard-3)
119 x 124  — Custom proportions (stormhead)
 48 x  48  — Compact sprites (viking) — pixel art style
100 x  82  — Short/wide (dwarf-worge)

RULE: All sprites render at uniform 200px display height via:
  scale = 200 / frameHeight
No per-combo scale overrides for visual display.
This keeps all characters the same screen height.`} />
    </div>
  );

  const renderAnimations = () => (
    <div>
      <SectionHeader title="Live Animation Gallery" color="#ef4444" subtitle="Browse all sprite sheets and preview animations in real time" />

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={{ fontSize: '0.6rem', color: '#8a8d94', display: 'block', marginBottom: 4 }}>Sprite Sheet</label>
          <select
            value={selectedSprite}
            onChange={e => { setSelectedSprite(e.target.value); setPreviewAnim('idle'); }}
            style={{
              background: 'rgba(20,15,30,0.8)', border: '1px solid rgba(255,215,0,0.2)',
              borderRadius: 6, color: '#e2e8f0', padding: '6px 10px', fontSize: '0.7rem',
              minWidth: 200,
            }}
          >
            {allSpriteKeys.map(k => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: '0.6rem', color: '#8a8d94', display: 'block', marginBottom: 4 }}>Animation</label>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {availableAnims.map(a => (
              <button
                key={a}
                onClick={() => setPreviewAnim(a)}
                style={{
                  background: previewAnim === a ? 'rgba(239,68,68,0.3)' : 'rgba(20,15,30,0.6)',
                  border: `1px solid ${previewAnim === a ? '#ef4444' : 'rgba(255,215,0,0.1)'}`,
                  borderRadius: 4, color: previewAnim === a ? '#fca5a5' : '#8a8d94',
                  padding: '4px 8px', fontSize: '0.6rem', cursor: 'pointer',
                }}
              >{a} ({currentSpriteData[a]?.frames || '?'}f)</button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ fontSize: '0.6rem', color: '#8a8d94', display: 'block', marginBottom: 4 }}>Speed: {previewSpeed}ms</label>
          <input
            type="range" min={40} max={300} step={10} value={previewSpeed}
            onChange={e => setPreviewSpeed(Number(e.target.value))}
            style={{ width: 120 }}
          />
        </div>
      </div>

      <div style={{
        background: 'rgba(20,15,30,0.5)', border: '1px solid rgba(239,68,68,0.15)',
        borderRadius: 10, padding: 20, marginBottom: 20,
        display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
        minHeight: 250,
        backgroundImage: 'repeating-conic-gradient(rgba(100,100,100,0.08) 0% 25%, transparent 0% 50%) 50% / 20px 20px',
      }}>
        {currentSpriteData && currentSpriteData[previewAnim] ? (
          <div style={{ position: 'relative', width: 200, height: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <SpriteAnimation
              spriteData={currentSpriteData}
              animation={previewAnim}
              scale={200 / (currentSpriteData.frameHeight || 100)}
              speed={previewSpeed}
              containerless={false}
            />
          </div>
        ) : (
          <div style={{ color: '#8a8d94', fontSize: '0.7rem' }}>No animation data for "{previewAnim}"</div>
        )}
      </div>

      {currentSpriteData && (
        <div style={{
          background: 'rgba(20,15,30,0.5)', border: '1px solid rgba(239,68,68,0.1)',
          borderRadius: 8, padding: 12,
        }}>
          <div style={{ fontSize: '0.65rem', color: '#b4966a', fontWeight: 600, marginBottom: 8 }}>Sheet Info</div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.6rem', color: '#8a8d94' }}>
            <span>Folder: <strong style={{ color: '#e2e8f0' }}>{currentSpriteData.folder || 'n/a'}</strong></span>
            <span>Frame: <strong style={{ color: '#e2e8f0' }}>{currentSpriteData.frameWidth || 100}x{currentSpriteData.frameHeight || 100}</strong></span>
            <span>Animations: <strong style={{ color: '#e2e8f0' }}>{availableAnims.length}</strong></span>
            <span>facesLeft: <strong style={{ color: currentSpriteData.facesLeft ? '#22c55e' : '#8a8d94' }}>{String(!!currentSpriteData.facesLeft)}</strong></span>
            {currentSpriteData.filter && <span>Filter: <strong style={{ color: '#f59e0b' }}>{currentSpriteData.filter}</strong></span>}
            {currentSpriteData.dwarfTransform && <span>Transform: <strong style={{ color: '#f59e0b' }}>{currentSpriteData.dwarfTransform}</strong></span>}
          </div>
        </div>
      )}
    </div>
  );

  const renderSkeleton = () => (
    <div>
      <SectionHeader title="Skeleton Rigging System" color="#22c55e" subtitle="16-bone hierarchy from Sprite Animator Pro — applicable to procedural animation" />

      <div style={{
        background: 'rgba(20,15,30,0.5)', border: '1px solid rgba(34,197,94,0.15)',
        borderRadius: 10, padding: 16, marginBottom: 20,
      }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 8,
        }}>
          {SKELETON_BONES.map(b => (
            <div key={b.name} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
              background: 'rgba(34,197,94,0.05)', borderRadius: 6,
              borderLeft: `3px solid ${b.color}`,
            }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: b.color, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#e2e8f0' }}>{b.name}</div>
                <div style={{ fontSize: '0.55rem', color: '#8a8d94' }}>{b.parent} → {b.child} | {b.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <CodeBlock title="Rest Pose (Normalized 0-1 Coordinates)" code={`// From skeleton.ts — the T-pose / rest position
export const restPose = {
  head:      { x: 0.50, y: 0.08 },   // Top center
  neck:      { x: 0.50, y: 0.22 },
  shoulderL: { x: 0.35, y: 0.24 },
  shoulderR: { x: 0.65, y: 0.24 },
  elbowL:    { x: 0.28, y: 0.40 },
  elbowR:    { x: 0.72, y: 0.40 },
  wristL:    { x: 0.25, y: 0.55 },
  wristR:    { x: 0.75, y: 0.55 },
  hip:       { x: 0.50, y: 0.52 },   // Center mass
  hipL:      { x: 0.42, y: 0.54 },
  hipR:      { x: 0.58, y: 0.54 },
  kneeL:     { x: 0.40, y: 0.72 },
  kneeR:     { x: 0.60, y: 0.72 },
  ankleL:    { x: 0.38, y: 0.92 },   // Near bottom
  ankleR:    { x: 0.62, y: 0.92 },
  weaponTip: { x: 0.83, y: 0.40 },   // Extended from wristR
};

// Coordinates are fractions of frame width/height.
// x=0.5 means center, y=0.0 means top, y=1.0 means bottom.
// The weapon bone extends from wristR to weaponTip.`} />

      <div style={{ marginTop: 16 }}>
        <h4 style={{ color: '#22c55e', fontSize: '0.8rem', fontWeight: 700, marginBottom: 10 }}>Material Labels</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
          {MATERIAL_LABELS.map(m => (
            <div key={m.name} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
              background: 'rgba(34,197,94,0.05)', borderRadius: 6,
            }}>
              <div style={{ width: 16, height: 16, borderRadius: 3, background: m.color, flexShrink: 0, border: '1px solid rgba(255,255,255,0.2)' }} />
              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#e2e8f0' }}>{m.name}</div>
                <div style={{ fontSize: '0.55rem', color: '#8a8d94' }}>{m.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <CodeBlock title="Animation Keyframe Interpolation" code={`// From skeleton.ts — how frames are generated procedurally:

// 1. Define keyframe poses per animation type
animationKeyframes: {
  idle:    [pose0, pose1, pose2, ...],  // 3-4 keyframes
  run:     [pose0, pose1, pose2, ...],  // 6-8 keyframes
  attack1: [pose0, pose1, pose2, ...],  // anticipation → strike → recovery
}

// 2. For each output frame, interpolate between nearest keyframes:
function getSkeletonForFrame(animType, frameIndex, equipmentType) {
  const t = frameIndex / (totalFrames - 1);     // 0.0 to 1.0
  const scaledIndex = t * (keyframes.length - 1);
  const lower = Math.floor(scaledIndex);
  const upper = Math.min(lower + 1, keyframes.length - 1);
  const frac = scaledIndex - lower;
  return interpolateSkeleton(keyframes[lower], keyframes[upper], frac);
}

// 3. Each joint position is linearly interpolated:
function interpolateSkeleton(a, b, t) {
  const result = {};
  for (const joint of jointNames) {
    result[joint] = {
      x: a[joint].x + (b[joint].x - a[joint].x) * t,
      y: a[joint].y + (b[joint].y - a[joint].y) * t,
    };
  }
  return result;
}

// 4. Fabric materials get dampened rotation (35%) for soft cloth motion
// This prevents capes/robes from being too jerky.`} />
    </div>
  );

  const renderFilters = () => (
    <div>
      <SectionHeader title="CSS Filters & Transforms" color="#f59e0b" subtitle="How one sprite sheet becomes many races via CSS recoloring" />

      <p style={{ fontSize: '0.7rem', color: '#c0c0c8', lineHeight: 1.6, marginBottom: 16 }}>
        Instead of creating unique sprite art for every race/class combo, we use CSS filter chains to
        recolor base sprites. This is our biggest efficiency win — one sprite sheet can represent 3-4 races
        with different filter combinations.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 10, marginBottom: 20 }}>
        {FILTER_EXAMPLES.map(f => (
          <div key={f.label} style={{
            background: 'rgba(20,15,30,0.5)', border: '1px solid rgba(245,158,11,0.1)',
            borderRadius: 8, padding: 12,
          }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#fbbf24', marginBottom: 4 }}>{f.label}</div>
            <code style={{
              display: 'block', fontSize: '0.55rem', color: '#a0e8b0',
              background: 'rgba(0,0,0,0.3)', padding: '4px 8px', borderRadius: 4, marginBottom: 6,
              wordBreak: 'break-all',
            }}>
              {f.filter && `filter: ${f.filter}`}
              {f.dwarfTransform && `\ntransform: ${f.dwarfTransform}`}
            </code>
            <div style={{ fontSize: '0.55rem', color: '#8a8d94' }}>{f.desc}</div>
          </div>
        ))}
      </div>

      <CodeBlock title="Filter Chaining Reference" code={`CSS Filter Functions (applied in order, left to right):

hue-rotate(Xdeg)   — Rotates the color wheel. 90deg = warm→green, 180deg = full invert
saturate(X)         — 0 = grayscale, 1 = normal, >1 = vivid
brightness(X)       — 0 = black, 1 = normal, >1 = brighter
sepia(X)            — 0 = none, 1 = full sepia (warm brown tones)
contrast(X)         — <1 = washed out, 1 = normal, >1 = harsh
invert(X)           — 0 = normal, 1 = full negative
grayscale(X)        — 0 = normal, 1 = full grayscale

COMBINATION RECIPES:
Orc:     hue-rotate(90deg) saturate(1.4) brightness(1.05)
Undead:  hue-rotate(180deg) saturate(0.6) brightness(0.7)
Elf:     hue-rotate(90deg) saturate(1.3) brightness(1.1)
Ghost:   invert(0.85) hue-rotate(180deg) saturate(1.4)
Tribal:  sepia(0.5) saturate(1.5) brightness(0.9)

BODY TRANSFORM (dwarfTransform):
Dwarf:   scaleX(1.3) scaleY(0.75)  — wider + shorter = stocky
Giant:   scaleX(0.9) scaleY(1.2)   — thinner + taller = imposing
  
TIP: Apply filters on the spriteData object, not CSS directly.
The SpriteAnimation component reads spriteData.filter automatically.`} />
    </div>
  );

  const renderAI = () => (
    <div>
      <SectionHeader title="AI Sprite Creation" color="#ec4899" subtitle="Prompts, techniques, and pipeline for AI-generated sprite sheets" />

      <div style={{
        background: 'rgba(20,15,30,0.5)', border: '1px solid rgba(236,72,153,0.15)',
        borderRadius: 10, padding: 16, marginBottom: 20,
      }}>
        <h4 style={{ color: '#f9a8d4', fontSize: '0.8rem', marginBottom: 8 }}>AI Sprite Pipeline</h4>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { step: '1', label: 'Generate Base Art', desc: 'Use image AI to create a single-frame character in the correct style and proportions' },
            { step: '2', label: 'Auto-Rig Skeleton', desc: 'Send to GPT-4o Vision to detect joint positions, body zones, and material labels' },
            { step: '3', label: 'Generate Keyframes', desc: 'Use skeleton poses to generate animation keyframes via canvas bone transforms' },
            { step: '4', label: 'Frame Refinement', desc: 'Per-frame editing: adjust skeleton, stretch regions, AI inpaint damaged areas' },
            { step: '5', label: 'Export Strip PNGs', desc: 'Render final horizontal strips per animation. Remove backgrounds. Save to /sprites/' },
            { step: '6', label: 'Register in spriteMap', desc: 'Add entry to spriteSheets{} and map in raceClassSpriteMap{}' },
          ].map(s => (
            <div key={s.step} style={{
              flex: '1 1 140px', background: 'rgba(236,72,153,0.08)', borderRadius: 6, padding: 10,
              border: '1px solid rgba(236,72,153,0.1)', textAlign: 'center',
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', background: '#ec4899',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem', fontWeight: 700, color: '#fff', margin: '0 auto 6px',
              }}>{s.step}</div>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#f9a8d4', marginBottom: 2 }}>{s.label}</div>
              <div style={{ fontSize: '0.5rem', color: '#8a8d94', lineHeight: 1.4 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {AI_PROMPTS.map((p, i) => (
        <div key={p.title} style={{
          background: 'rgba(20,15,30,0.5)', border: '1px solid rgba(236,72,153,0.1)',
          borderRadius: 10, marginBottom: 12, overflow: 'hidden',
        }}>
          <button
            onClick={() => setExpandedPrompt(expandedPrompt === i ? null : i)}
            style={{
              width: '100%', textAlign: 'left', background: 'none', border: 'none',
              color: '#f9a8d4', padding: '12px 16px', cursor: 'pointer',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              fontSize: '0.75rem', fontWeight: 700,
            }}
          >
            {p.title}
            <span style={{ color: '#8a8d94', fontSize: '0.7rem' }}>{expandedPrompt === i ? '−' : '+'}</span>
          </button>
          {expandedPrompt === i && (
            <div style={{ padding: '0 16px 16px' }}>
              <CodeBlock code={p.prompt} title="Prompt Template (click Copy to use)" />
            </div>
          )}
        </div>
      ))}

      <div style={{
        background: 'rgba(20,15,30,0.5)', border: '1px solid rgba(236,72,153,0.15)',
        borderRadius: 10, padding: 16, marginTop: 16,
      }}>
        <h4 style={{ color: '#f9a8d4', fontSize: '0.8rem', marginBottom: 10 }}>AI Creation Tips</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { title: 'Consistency is King', desc: 'AI generates each frame independently. Describe the EXACT same character, clothing, and proportions in every prompt. Reference the idle frame as the canonical look.' },
            { title: 'Transparent Backgrounds', desc: 'Always specify "fully transparent PNG background" or use BFS flood-fill removal after generation. Edge feathering prevents halo artifacts.' },
            { title: 'Frame-by-Frame Approach', desc: 'Generate each animation frame as a separate image with the same character in different poses. Then assemble into horizontal strips manually or with a tool.' },
            { title: 'Silhouette Check', desc: 'Good sprites read clearly at 50px height. If the character becomes a blob at small sizes, simplify the design. Less detail = better game sprites.' },
            { title: 'Color Palette Planning', desc: 'Design base sprites in neutral human skin tones. This gives CSS filters the most room to recolor for other races. Avoid pure red/blue — they shift unpredictably.' },
            { title: 'Bottom Alignment', desc: 'Every frame must have the character feet touching the same Y position at the bottom. Misaligned feet cause "bouncing" during animation playback.' },
          ].map(tip => (
            <div key={tip.title} style={{
              background: 'rgba(236,72,153,0.05)', borderRadius: 6, padding: 10,
              border: '1px solid rgba(236,72,153,0.08)',
            }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#f9a8d4', marginBottom: 4 }}>{tip.title}</div>
              <div style={{ fontSize: '0.55rem', color: '#9ca3af', lineHeight: 1.5 }}>{tip.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderRules = () => (
    <div>
      <SectionHeader title="The 10 Golden Rules" color="#06b6d4" subtitle="Non-negotiable sprite system rules for Grudge Warlords" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {GOLDEN_RULES.map(r => (
          <div key={r.icon} style={{
            display: 'flex', gap: 14, alignItems: 'flex-start',
            background: 'rgba(20,15,30,0.5)', border: '1px solid rgba(6,182,212,0.12)',
            borderRadius: 10, padding: 14,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, #06b6d4, #0284c7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.8rem', fontWeight: 900, color: '#fff', flexShrink: 0,
              boxShadow: '0 0 12px rgba(6,182,212,0.3)',
            }}>{r.icon}</div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#67e8f9', marginBottom: 3 }}>{r.title}</div>
              <div style={{ fontSize: '0.6rem', color: '#9ca3af', lineHeight: 1.6 }}>{r.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 20, background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)',
        borderRadius: 10, padding: 16,
      }}>
        <h4 style={{ color: '#67e8f9', fontSize: '0.8rem', marginBottom: 8 }}>Quick Checklist for New Sprites</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          {[
            'Transparent PNG background',
            'Consistent frame dimensions',
            'Character faces RIGHT',
            'Feet aligned at bottom edge',
            'At least idle + attack1 + hurt + death',
            'Readable silhouette at 50px height',
            'Neutral base colors for filter recoloring',
            'Registered in spriteSheets{}',
            'Mapped in raceClassSpriteMap{}',
            'Tested in Animation Gallery above',
          ].map(item => (
            <div key={item} style={{
              fontSize: '0.6rem', color: '#c0c0c8', padding: '3px 0',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ color: '#06b6d4', fontSize: '0.7rem' }}>&#x2610;</span>
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'overview': return renderOverview();
      case 'architecture': return renderArchitecture();
      case 'anatomy': return renderAnatomy();
      case 'animations': return renderAnimations();
      case 'skeleton': return renderSkeleton();
      case 'filters': return renderFilters();
      case 'ai': return renderAI();
      case 'rules': return renderRules();
      default: return null;
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(180deg, #0a0a14 0%, #141428 50%, #0a0e1a 100%)',
      color: '#e2e8f0', fontFamily: "'Jost', sans-serif",
    }}>
      <div style={{
        display: 'flex', gap: 4, padding: '10px 16px', flexWrap: 'wrap',
        borderBottom: '1px solid rgba(255,215,0,0.1)',
        background: 'rgba(20,15,30,0.6)',
      }}>
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            style={{
              background: activeSection === s.id ? `${s.color}20` : 'transparent',
              border: `1px solid ${activeSection === s.id ? s.color : 'rgba(255,215,0,0.08)'}`,
              borderRadius: 6, color: activeSection === s.id ? s.color : '#6b7280',
              padding: '5px 12px', fontSize: '0.65rem', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >{s.label}</button>
        ))}
      </div>

      <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto' }}>
        {renderContent()}
      </div>
    </div>
  );
}
