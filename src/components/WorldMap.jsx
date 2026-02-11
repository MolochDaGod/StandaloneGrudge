import React, { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import useGameStore, { getHeroStatsWithBonuses } from '../stores/gameStore';
import { locations } from '../data/enemies';
import { cities, cityPositions, cityConnections } from '../data/cities';
import { missionTemplates, arenaTemplates } from '../data/missions';
import { classDefinitions } from '../data/classes';
import { raceDefinitions } from '../data/races';
import SpriteAnimation, { buildEquipmentOverlays } from './SpriteAnimation';
import { getPlayerSprite, getEnemySprite } from '../data/spriteMap';
import { setBgm } from '../utils/audioManager';
import { TIERS, UPGRADE_COSTS, EQUIPMENT_SLOTS, WEAPON_TYPES, ARMOR_TYPES, getItemPrice, getSellPrice } from '../data/equipment';
import { generateDialogue } from '../data/dialogue';
import ChatBubbleSystem from './ChatBubble';
import { generateRandomEvent, getRewardDescription } from '../data/randomEvents';
import { encodeGrudaShare, generateShareUrl, generateShareCode } from '../utils/grudaShare';
import { MAP_LAYERS, svgOverlayProps, mapNodeStyle, mapCenterStyle, fullCoverStyle, nodeScale as calcNodeScale } from './mapConstants';
import { InlineIcon, getIconSrc } from '../data/uiSprites';

const bossMapSprites = {
  nature_elemental: { glow: 'rgba(0,255,80,0.5)', terrain: '/backgrounds/verdant_plains.png', shape: 'archway', effect: 'vines', color1: '#0f4', color2: '#084' },
  water_elemental: { glow: 'rgba(60,100,255,0.5)', terrain: '/backgrounds/storm_ruins.png', shape: 'rift', effect: 'waves', color1: '#48f', color2: '#026' },
  lich: { glow: 'rgba(130,50,255,0.6)', terrain: '/backgrounds/shadow_citadel.png', shape: 'archway', effect: 'souls', color1: '#a4f', color2: '#407' },
  demon_lord: { glow: 'rgba(255,30,30,0.6)', terrain: '/backgrounds/demon_gate.png', shape: 'volcano', effect: 'lava', color1: '#f42', color2: '#810' },
  void_king: { glow: 'rgba(200,100,255,0.7)', terrain: '/backgrounds/void_throne.png', shape: 'rift', effect: 'void', color1: '#c4f', color2: '#408' },
  grand_shaman: { glow: 'rgba(0,200,100,0.5)', terrain: '/backgrounds/dark_forest.png', shape: 'archway', effect: 'portal', color1: '#0c6', color2: '#063' },
  canyon_warlord: { glow: 'rgba(220,100,30,0.5)', terrain: '/backgrounds/blood_canyon.png', shape: 'volcano', effect: 'lava', color1: '#f80', color2: '#820' },
  frost_wyrm: { glow: 'rgba(100,180,255,0.5)', terrain: '/backgrounds/winter_arena.png', shape: 'rift', effect: 'frost', color1: '#8df', color2: '#248' },
  shadow_beast: { glow: 'rgba(100,50,200,0.6)', terrain: '/backgrounds/cursed_ruins.png', shape: 'archway', effect: 'souls', color1: '#84f', color2: '#306' },
  void_sentinel: { glow: 'rgba(180,80,255,0.6)', terrain: '/backgrounds/volcanic_field.png', shape: 'volcano', effect: 'void', color1: '#b5f', color2: '#508' },
  god_odin: { glow: 'rgba(251,191,36,0.8)', terrain: '/backgrounds/boss_mountain.png', shape: 'godgate', effect: 'lightning', color1: '#fb4', color2: '#a60' },
  god_madra: { glow: 'rgba(220,38,38,0.8)', terrain: '/backgrounds/demon_gate.png', shape: 'godgate', effect: 'lava', color1: '#f33', color2: '#800' },
  god_omni: { glow: 'rgba(167,139,250,0.8)', terrain: '/backgrounds/boss_blue.png', shape: 'godgate', effect: 'void', color1: '#a8f', color2: '#508' },
};


const locationPositions = {
  verdant_plains:     { x: 12, y: 85 },
  dark_forest:        { x: 22, y: 76 },
  mystic_grove:       { x: 12, y: 66 },
  whispering_caverns: { x: 28, y: 85 },
  haunted_marsh:      { x: 38, y: 76 },
  cursed_ruins:       { x: 35, y: 63 },
  crystal_caves:      { x: 20, y: 54 },
  thornwood_pass:     { x: 48, y: 70 },
  sunken_temple:      { x: 50, y: 82 },
  iron_peaks:         { x: 30, y: 44 },
  blood_canyon:       { x: 60, y: 63 },
  frozen_tundra:      { x: 42, y: 38 },
  dragon_peaks:       { x: 55, y: 50 },
  ashen_battlefield:  { x: 68, y: 73 },
  windswept_ridge:    { x: 45, y: 28 },
  molten_core:        { x: 72, y: 57 },
  shadow_forest:      { x: 25, y: 35 },
  obsidian_wastes:    { x: 78, y: 66 },
  ruins_of_ashenmoor: { x: 58, y: 38 },
  blight_hollow:      { x: 35, y: 22 },
  shadow_citadel:     { x: 65, y: 28 },
  stormspire_peak:    { x: 50, y: 16 },
  demon_gate:         { x: 80, y: 42 },
  abyssal_depths:     { x: 75, y: 30 },
  infernal_forge:     { x: 85, y: 52 },
  dreadmaw_canyon:    { x: 82, y: 38 },
  void_threshold:     { x: 72, y: 18 },
  corrupted_spire:    { x: 85, y: 22 },
  void_throne:        { x: 80, y: 12 },
  hall_of_odin:       { x: 65, y: 10 },
  maw_of_madra:       { x: 88, y: 10 },
  sanctum_of_omni:    { x: 76, y: 6 },
};

const pathConnections = [
  // === EARLY GAME: Starter Zones (Lv 1-6) ===
  ['verdant_plains', 'dark_forest'],
  ['verdant_plains', 'whispering_caverns'],
  ['dark_forest', 'mystic_grove'],
  ['dark_forest', 'haunted_marsh'],
  ['whispering_caverns', 'haunted_marsh'],

  // === MID GAME BRANCH: Crusade Arc (Lv 5-9) ===
  ['mystic_grove', 'crystal_caves'],
  ['haunted_marsh', 'cursed_ruins'],
  ['haunted_marsh', 'thornwood_pass'],
  ['cursed_ruins', 'sunken_temple'],
  ['cursed_ruins', 'thornwood_pass'],
  ['crystal_caves', 'iron_peaks'],
  ['thornwood_pass', 'sunken_temple'],

  // === MID GAME BRANCH: Legion Arc (Lv 8-13) ===
  ['iron_peaks', 'frozen_tundra'],
  ['iron_peaks', 'blood_canyon'],
  ['frozen_tundra', 'windswept_ridge'],
  ['blood_canyon', 'ashen_battlefield'],
  ['blood_canyon', 'molten_core'],
  ['blood_canyon', 'dragon_peaks'],

  // === MID GAME BRANCH: Fabled Arc (Lv 10-14) ===
  ['windswept_ridge', 'dragon_peaks'],
  ['dragon_peaks', 'ruins_of_ashenmoor'],
  ['molten_core', 'obsidian_wastes'],
  ['molten_core', 'ashen_battlefield'],

  // === LATE GAME: Shadow & Corruption (Lv 11-16) ===
  ['iron_peaks', 'shadow_forest'],
  ['shadow_forest', 'blight_hollow'],
  ['windswept_ridge', 'stormspire_peak'],
  ['ruins_of_ashenmoor', 'shadow_citadel'],
  ['obsidian_wastes', 'demon_gate'],
  ['blight_hollow', 'stormspire_peak'],

  // === ENDGAME: Convergence (Lv 15-18) ===
  ['shadow_citadel', 'abyssal_depths'],
  ['demon_gate', 'infernal_forge'],
  ['demon_gate', 'dreadmaw_canyon'],
  ['stormspire_peak', 'void_threshold'],
  ['abyssal_depths', 'dreadmaw_canyon'],
  ['infernal_forge', 'dreadmaw_canyon'],
  ['dreadmaw_canyon', 'corrupted_spire'],
  ['void_threshold', 'corrupted_spire'],

  // === FINAL: The Void Throne (Lv 18-20) ===
  ['corrupted_spire', 'void_throne'],

  // === GOD FIGHTS: Endgame (Lv 20) ===
  ['void_throne', 'hall_of_odin'],
  ['void_throne', 'maw_of_madra'],
  ['void_throne', 'sanctum_of_omni'],
];

const locationIcons = {
  verdant_plains:     { color: '#4ade80', glow: 'rgba(74,222,128,0.4)', img: '/map_nodes/verdant_plains.png' },
  dark_forest:        { color: '#22d3ee', glow: 'rgba(34,211,238,0.4)', img: '/map_nodes/dark_forest.png' },
  mystic_grove:       { color: '#a78bfa', glow: 'rgba(167,139,250,0.4)', img: '/map_nodes/mystic_grove.png' },
  whispering_caverns: { color: '#94a3b8', glow: 'rgba(148,163,184,0.4)', img: '/map_nodes/whispering_caverns.png' },
  haunted_marsh:      { color: '#86efac', glow: 'rgba(134,239,172,0.3)', img: '/map_nodes/haunted_marsh.png' },
  cursed_ruins:       { color: '#c084fc', glow: 'rgba(192,132,252,0.4)', img: '/map_nodes/cursed_ruins.png' },
  crystal_caves:      { color: '#67e8f9', glow: 'rgba(103,232,249,0.4)', img: '/map_nodes/crystal_caves.png' },
  thornwood_pass:     { color: '#6ee7b7', glow: 'rgba(110,231,183,0.3)', img: '/map_nodes/thornwood_pass.png' },
  sunken_temple:      { color: '#38bdf8', glow: 'rgba(56,189,248,0.4)', img: '/map_nodes/sunken_temple.png' },
  iron_peaks:         { color: '#9ca3af', glow: 'rgba(156,163,175,0.4)', img: '/map_nodes/iron_peaks.png' },
  blood_canyon:       { color: '#ef4444', glow: 'rgba(239,68,68,0.4)', img: '/map_nodes/blood_canyon.png' },
  frozen_tundra:      { color: '#7dd3fc', glow: 'rgba(125,211,252,0.4)', img: '/map_nodes/frozen_tundra.png' },
  dragon_peaks:       { color: '#f97316', glow: 'rgba(249,115,22,0.4)', img: '/map_nodes/dragon_peaks.png' },
  ashen_battlefield:  { color: '#a8a29e', glow: 'rgba(168,162,158,0.3)', img: '/map_nodes/ashen_battlefield.png' },
  windswept_ridge:    { color: '#93c5fd', glow: 'rgba(147,197,253,0.3)', img: '/map_nodes/windswept_ridge.png' },
  molten_core:        { color: '#fb923c', glow: 'rgba(251,146,60,0.4)', img: '/map_nodes/molten_core.png' },
  shadow_forest:      { color: '#818cf8', glow: 'rgba(129,140,248,0.4)', img: '/map_nodes/shadow_forest.png' },
  obsidian_wastes:    { color: '#f87171', glow: 'rgba(248,113,113,0.4)', img: '/map_nodes/obsidian_wastes.png' },
  ruins_of_ashenmoor: { color: '#d4d4d8', glow: 'rgba(212,212,216,0.3)', img: '/map_nodes/ruins_of_ashenmoor.png' },
  blight_hollow:      { color: '#a3e635', glow: 'rgba(163,230,53,0.3)', img: '/map_nodes/blight_hollow.png' },
  shadow_citadel:     { color: '#a78bfa', glow: 'rgba(167,139,250,0.4)', img: '/map_nodes/shadow_citadel.png' },
  stormspire_peak:    { color: '#fcd34d', glow: 'rgba(252,211,77,0.4)', img: '/map_nodes/stormspire_peak.png' },
  demon_gate:         { color: '#f43f5e', glow: 'rgba(244,63,94,0.4)', img: '/map_nodes/demon_gate.png' },
  abyssal_depths:     { color: '#6366f1', glow: 'rgba(99,102,241,0.4)', img: '/map_nodes/abyssal_depths.png' },
  infernal_forge:     { color: '#ef4444', glow: 'rgba(239,68,68,0.4)', img: '/map_nodes/infernal_forge.png' },
  dreadmaw_canyon:    { color: '#d946ef', glow: 'rgba(217,70,239,0.4)', img: '/map_nodes/dreadmaw_canyon.png' },
  void_threshold:     { color: '#c084fc', glow: 'rgba(192,132,252,0.5)', img: '/map_nodes/void_threshold.png' },
  corrupted_spire:    { color: '#e879f9', glow: 'rgba(232,121,249,0.4)', img: '/map_nodes/corrupted_spire.png' },
  void_throne:        { color: '#fbbf24', glow: 'rgba(251,191,36,0.5)', img: '/map_nodes/void_throne.png' },
  hall_of_odin:       { color: '#fbbf24', glow: 'rgba(251,191,36,0.6)', img: '/map_nodes/void_throne.png' },
  maw_of_madra:       { color: '#dc2626', glow: 'rgba(220,38,38,0.6)', img: '/map_nodes/void_throne.png' },
  sanctum_of_omni:    { color: '#a78bfa', glow: 'rgba(167,139,250,0.6)', img: '/map_nodes/void_throne.png' },
};

const terrainRegions = [
  {
    name: 'Verdant Wilds',
    fill: 'rgba(74,222,128,0.06)',
    stroke: 'rgba(74,222,128,0.2)',
    points: '8,64 32,16 52,68 54,89 26,92 6,92',
    labelX: 28, labelY: 72,
  },
  {
    name: 'Shadow Realm',
    fill: 'rgba(167,139,250,0.06)',
    stroke: 'rgba(167,139,250,0.2)',
    points: '82,4 92,20 89,42 38,69 21,32 69,14',
    labelX: 65, labelY: 28,
  },
  {
    name: 'Volcanic Wastes',
    fill: 'rgba(239,68,68,0.06)',
    stroke: 'rgba(239,68,68,0.2)',
    points: '52,47 83,38 92,50 82,72 65,79 56,68',
    labelX: 72, labelY: 60,
  },
  {
    name: 'Frozen Peaks',
    fill: 'rgba(125,211,252,0.06)',
    stroke: 'rgba(125,211,252,0.2)',
    points: '53,11 49,25 46,42 27,49 16,58 16,50 30,30',
    labelX: 36, labelY: 36,
  },
  {
    name: 'Ashenmoor',
    fill: 'rgba(251,191,36,0.06)',
    stroke: 'rgba(251,191,36,0.2)',
    points: '54,34 62,34 62,42 54,42',
    labelX: 58, labelY: 44,
  },
];

const portalLocations = ['shadow_citadel', 'demon_gate', 'void_throne'];

const zoneResourceMap = {
  verdant_plains:     { resource: 'wood', sprite: 'trees', count: 4 },
  dark_forest:        { resource: 'wood', sprite: 'pine_trees', count: 5 },
  mystic_grove:       { resource: 'herbs', sprite: 'trees', count: 3 },
  whispering_caverns: { resource: 'crystals', sprite: 'rocks', rockRow: 0, filter: 'hue-rotate(200deg) saturate(1.5)', count: 3 },
  haunted_marsh:      { resource: 'herbs', sprite: 'trees', count: 2 },
  cursed_ruins:       { resource: 'ore', sprite: 'rocks', rockRow: 1, count: 3 },
  crystal_caves:      { resource: 'crystals', sprite: 'rocks', rockRow: 2, filter: 'hue-rotate(200deg) saturate(1.5)', count: 5 },
  thornwood_pass:     { resource: 'wood', sprite: 'pine_trees', count: 4 },
  iron_peaks:         { resource: 'ore', sprite: 'rocks', rockRow: 0, count: 4 },
  blood_canyon:       { resource: 'ore', sprite: 'rocks', rockRow: 1, count: 3 },
  frozen_tundra:      { resource: 'ore', sprite: 'dead_trees', count: 3 },
  dragon_peaks:       { resource: 'gold', sprite: 'rocks', rockRow: 0, filter: 'hue-rotate(35deg) saturate(2) brightness(1.2)', count: 3 },
  ashen_battlefield:  { resource: 'ore', sprite: 'rocks', rockRow: 1, count: 3 },
  windswept_ridge:    { resource: 'ore', sprite: 'dead_trees', count: 3 },
  molten_core:        { resource: 'gold', sprite: 'rocks', rockRow: 0, filter: 'hue-rotate(35deg) saturate(2) brightness(1.2)', count: 4 },
  shadow_forest:      { resource: 'wood', sprite: 'trees', count: 5 },
  obsidian_wastes:    { resource: 'ore', sprite: 'rocks', rockRow: 0, count: 2 },
  ruins_of_ashenmoor: { resource: 'ore', sprite: 'rocks', rockRow: 1, count: 3 },
  blight_hollow:      { resource: 'herbs', sprite: 'trees', count: 3 },
  shadow_citadel:     { resource: 'crystals', sprite: 'rocks', rockRow: 2, filter: 'hue-rotate(200deg) saturate(1.5)', count: 2 },
  stormspire_peak:    { resource: 'crystals', sprite: 'dead_trees', filter: 'hue-rotate(200deg) saturate(1.5) brightness(1.3)', count: 4 },
  demon_gate:         { resource: 'gold', sprite: 'rocks', rockRow: 1, filter: 'hue-rotate(35deg) saturate(2) brightness(1.2)', count: 2 },
  abyssal_depths:     { resource: 'crystals', sprite: 'rocks', rockRow: 2, filter: 'hue-rotate(200deg) saturate(1.5)', count: 4 },
  infernal_forge:     { resource: 'gold', sprite: 'rocks', rockRow: 0, filter: 'hue-rotate(35deg) saturate(2) brightness(1.2)', count: 3 },
  dreadmaw_canyon:    { resource: 'ore', sprite: 'rocks', rockRow: 1, count: 3 },
  void_threshold:     { resource: 'crystals', sprite: 'rocks', rockRow: 2, filter: 'hue-rotate(260deg) saturate(2)', count: 2 },
  corrupted_spire:    { resource: 'crystals', sprite: 'rocks', rockRow: 0, filter: 'hue-rotate(260deg) saturate(2)', count: 3 },
};

const resourceToHarvestId = {
  wood: 'lumber_yard', ore: 'ore_vein', crystals: 'crystal_cave', gold: 'gold_mine', herbs: 'herb_garden',
};

const seededRng = (seed) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  return () => { h = (h * 1103515245 + 12345) & 0x7fffffff; return h / 0x7fffffff; };
};

const generateResourcePositions = (zoneId, count) => {
  const pos = locationPositions[zoneId];
  if (!pos) return [];
  const rng = seededRng(zoneId + '_res');
  const nodes = [];
  for (let i = 0; i < count; i++) {
    const angle = rng() * Math.PI * 2;
    const dist = 1.5 + rng() * 3;
    nodes.push({
      x: pos.x + Math.cos(angle) * dist,
      y: pos.y + Math.sin(angle) * dist,
      variant: Math.floor(rng() * 4),
    });
  }
  return nodes;
};

const SPRITE_INFO = {
  trees: { src: '/sprites/trees.png', frameW: 16, frameH: 16, cols: 4, rows: 1, fullFrame: 3, halfFrame: 2, lowFrame: 1, stumpFrame: 0 },
  pine_trees: { src: '/sprites/pine_trees.png', frameW: 16, frameH: 16, cols: 3, rows: 1, fullFrame: 2, halfFrame: 1, lowFrame: 0, stumpFrame: 0 },
  dead_trees: { src: '/sprites/dead_trees.png', frameW: 16, frameH: 16, cols: 4, rows: 1, fullFrame: 3, halfFrame: 2, lowFrame: 1, stumpFrame: 0 },
  rocks: { src: '/sprites/rocks.png', frameW: 16, frameH: 16, cols: 3, rows: 4, fullFrame: 2, halfFrame: 1, lowFrame: 0, stumpFrame: 0 },
  wheat: { src: '/sprites/wheat.png', frameW: 16, frameH: 16, cols: 4, rows: 1 },
};

const mergeRouteStrokes = (routes) => {
  if (!routes || routes.length < 2) return routes;
  const MERGE_DIST = 3.5;
  const dist = (a, b) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  const used = new Set();
  const merged = [];

  const findClosest = (pt, skipIdx) => {
    let bestIdx = -1, bestEnd = null, bestDist = Infinity;
    for (let i = 0; i < routes.length; i++) {
      if (used.has(i) || i === skipIdx) continue;
      const r = routes[i];
      if (!r.points || r.points.length < 2) continue;
      const dStart = dist(pt, r.points[0]);
      const dEnd = dist(pt, r.points[r.points.length - 1]);
      if (dStart < bestDist && dStart < MERGE_DIST) {
        bestDist = dStart; bestIdx = i; bestEnd = 'start';
      }
      if (dEnd < bestDist && dEnd < MERGE_DIST) {
        bestDist = dEnd; bestIdx = i; bestEnd = 'end';
      }
    }
    return bestIdx >= 0 ? { idx: bestIdx, end: bestEnd } : null;
  };

  for (let i = 0; i < routes.length; i++) {
    if (used.has(i)) continue;
    const r = routes[i];
    if (!r.points || r.points.length < 2) continue;
    used.add(i);
    let chain = [...r.points];
    const avgWidth = r.width || 2.5;
    let widthSum = avgWidth;
    let widthCount = 1;

    let changed = true;
    while (changed) {
      changed = false;
      const tailPt = chain[chain.length - 1];
      const match = findClosest(tailPt, -1);
      if (match) {
        used.add(match.idx);
        const mr = routes[match.idx];
        const pts = match.end === 'start' ? mr.points.slice(1) : [...mr.points].reverse().slice(1);
        chain = chain.concat(pts);
        widthSum += (mr.width || 2.5);
        widthCount++;
        changed = true;
        continue;
      }
      const headPt = chain[0];
      const matchHead = findClosest(headPt, -1);
      if (matchHead) {
        used.add(matchHead.idx);
        const mr = routes[matchHead.idx];
        const pts = matchHead.end === 'end' ? mr.points.slice(0, -1) : [...mr.points].reverse().slice(0, -1);
        chain = pts.concat(chain);
        widthSum += (mr.width || 2.5);
        widthCount++;
        changed = true;
      }
    }
    merged.push({ points: chain, width: widthSum / widthCount });
  }
  return merged;
};

const buildRouteNetwork = (routes, locPositions) => {
  if (!routes || routes.length === 0) return { getPathBetween: () => null };
  const allPoints = [];
  const segments = [];
  routes.forEach(road => {
    if (!road.points || road.points.length < 2) return;
    const startIdx = allPoints.length;
    road.points.forEach(p => allPoints.push({ x: p.x, y: p.y }));
    for (let i = startIdx; i < allPoints.length - 1; i++) {
      segments.push([i, i + 1]);
    }
  });
  const STITCH_DIST = 3.5;
  const routeStarts = [];
  let idx = 0;
  routes.forEach(road => {
    if (!road.points || road.points.length < 2) { return; }
    routeStarts.push({ start: idx, end: idx + road.points.length - 1 });
    idx += road.points.length;
  });
  for (let i = 0; i < routeStarts.length; i++) {
    for (let j = i + 1; j < routeStarts.length; j++) {
      const ends_i = [routeStarts[i].start, routeStarts[i].end];
      const ends_j = [routeStarts[j].start, routeStarts[j].end];
      for (const ei of ends_i) {
        for (const ej of ends_j) {
          const dx = allPoints[ei].x - allPoints[ej].x;
          const dy = allPoints[ei].y - allPoints[ej].y;
          if (Math.sqrt(dx * dx + dy * dy) < STITCH_DIST) {
            segments.push([ei, ej]);
          }
        }
      }
    }
  }
  const adj = {};
  segments.forEach(([a, b]) => {
    if (!adj[a]) adj[a] = [];
    if (!adj[b]) adj[b] = [];
    if (!adj[a].includes(b)) adj[a].push(b);
    if (!adj[b].includes(a)) adj[b].push(a);
  });
  const findNearest = (pos) => {
    let bestIdx = -1, bestDist = Infinity;
    for (let i = 0; i < allPoints.length; i++) {
      const dx = allPoints[i].x - pos.x;
      const dy = allPoints[i].y - pos.y;
      const d = dx * dx + dy * dy;
      if (d < bestDist) { bestDist = d; bestIdx = i; }
    }
    return bestIdx;
  };
  const bfsRoute = (startIdx, endIdx) => {
    if (startIdx === endIdx) return [startIdx];
    if (startIdx < 0 || endIdx < 0) return null;
    const queue = [[startIdx]];
    const visited = new Set([startIdx]);
    while (queue.length > 0) {
      const path = queue.shift();
      const node = path[path.length - 1];
      for (const next of (adj[node] || [])) {
        if (next === endIdx) return [...path, next];
        if (!visited.has(next)) {
          visited.add(next);
          queue.push([...path, next]);
        }
      }
    }
    return null;
  };
  const getPathBetween = (fromPos, toPos) => {
    const fromIdx = findNearest(fromPos);
    const toIdx = findNearest(toPos);
    if (fromIdx < 0 || toIdx < 0) return null;
    const route = bfsRoute(fromIdx, toIdx);
    if (!route) return null;
    const points = [{ x: fromPos.x, y: fromPos.y }];
    route.forEach(i => points.push({ x: allPoints[i].x, y: allPoints[i].y }));
    points.push({ x: toPos.x, y: toPos.y });
    return points;
  };
  return { getPathBetween, allPoints };
};

const generatePathGrass = () => {
  const grassNodes = [];
  const rng = seededRng('path_grass_global');
  const excludeZones = new Set(['void_throne', 'hall_of_odin', 'maw_of_madra', 'sanctum_of_omni',
    'molten_core', 'infernal_forge', 'obsidian_wastes', 'demon_gate', 'abyssal_depths',
    'void_threshold', 'corrupted_spire', 'dreadmaw_canyon']);
  pathConnections.forEach(([a, b]) => {
    if (excludeZones.has(a) || excludeZones.has(b)) return;
    const pA = locationPositions[a];
    const pB = locationPositions[b];
    if (!pA || !pB) return;
    const dx = pB.x - pA.x;
    const dy = pB.y - pA.y;
    const segLen = Math.sqrt(dx * dx + dy * dy);
    const count = Math.max(1, Math.floor(segLen / 5));
    for (let i = 0; i < count; i++) {
      const t = 0.15 + rng() * 0.7;
      const perpAngle = Math.atan2(dy, dx) + Math.PI / 2;
      const offset = (rng() - 0.5) * 3.5;
      grassNodes.push({
        x: pA.x + dx * t + Math.cos(perpAngle) * offset,
        y: pA.y + dy * t + Math.sin(perpAngle) * offset,
        frame: Math.floor(rng() * 4),
        opacity: 0.35 + rng() * 0.35,
        scale: 0.7 + rng() * 0.6,
      });
    }
  });
  return grassNodes;
};
const pathGrassPositions = generatePathGrass();

const MAP_GRID = { cols: 100, rows: 100 };

const samplePointsAlongPath = (points, spacing = 2.5) => {
  if (!points || points.length < 2) return [];
  const norm = points.map(p => Array.isArray(p) ? { x: p[0], y: p[1] } : p);
  const sampled = [];
  let dist = 0;
  let nextDist = spacing * 0.5;
  for (let i = 1; i < norm.length; i++) {
    const ax = norm[i - 1].x, ay = norm[i - 1].y;
    const bx = norm[i].x, by = norm[i].y;
    const segLen = Math.sqrt((bx - ax) ** 2 + (by - ay) ** 2);
    while (nextDist <= dist + segLen) {
      const t = (nextDist - dist) / segLen;
      sampled.push({ x: ax + (bx - ax) * t, y: ay + (by - ay) * t });
      nextDist += spacing;
    }
    dist += segLen;
  }
  return sampled;
};

const buildSmoothPath = (points) => {
  if (points.length < 2) return '';
  let d = `M ${points[0][0]},${points[0][1]}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cx = (prev[0] + curr[0]) / 2;
    const cy = (prev[1] + curr[1]) / 2;
    if (i === 1) {
      d += ` Q ${cx},${cy} ${curr[0]},${curr[1]}`;
    } else {
      d += ` T ${curr[0]},${curr[1]}`;
    }
  }
  return d;
};

const mapLandmarks = [];

const buildAdjacency = () => {
  const adj = {};
  const addEdge = (a, b) => {
    if (!adj[a]) adj[a] = [];
    if (!adj[b]) adj[b] = [];
    if (!adj[a].includes(b)) adj[a].push(b);
    if (!adj[b].includes(a)) adj[b].push(a);
  };
  pathConnections.forEach(([a, b]) => addEdge(a, b));
  cityConnections.forEach(([a, b]) => addEdge(a, b));
  return adj;
};
const adjacencyMap = buildAdjacency();

const findPath = (start, end) => {
  if (start === end) return [];
  const queue = [[start]];
  const visited = new Set([start]);
  while (queue.length > 0) {
    const path = queue.shift();
    const node = path[path.length - 1];
    const neighbors = adjacencyMap[node] || [];
    for (const next of neighbors) {
      if (next === end) return [...path, next];
      if (!visited.has(next)) {
        visited.add(next);
        queue.push([...path, next]);
      }
    }
  }
  return null;
};

export default function WorldMap() {
  const {
    level, xp, xpToNext, gold, playerName, playerClass, playerRace,
    playerHealth, playerMaxHealth, playerMana, playerMaxMana,
    setScreen, startBattle, startBossBattle, getUnlockedLocations, restAtInn,
    victories, unspentPoints, skillPoints, heroRoster, activeHeroIds, maxHeroSlots,
    setActiveHeroes, locationsCleared, bossesDefeated, zoneConquer,
    harvestNodes, activeHarvests, harvestResources, assignHarvest, recallHarvest, tickHarvests, setHeroStandingZone,
    startMissionBattle, startArenaBattle, completedMissions,
    upgradeEquipment,
    shopInventory, inventory, buyItem, sellItem, refreshShop,
    randomEvents, addRandomEvent, cleanExpiredEvents, startEventBattle, lastEventSpawn,
    enterScene,
  } = useGameStore();

  const enterLocation = useGameStore(s => s.enterLocation);
  const raceDef = playerRace ? raceDefinitions[playerRace] : null;
  const cls = classDefinitions[playerClass];
  const unlockedLocs = getUnlockedLocations();
  const canCreateNewHero = heroRoster.length < maxHeroSlots;

  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [citySubmenu, setCitySubmenu] = useState(null);
  const [showWarParty, setShowWarParty] = useState(false);
  const [showGruda, setShowGruda] = useState(false);
  const [grudaCopied, setGrudaCopied] = useState(null);
  const [upgradeHeroId, setUpgradeHeroId] = useState(null);
  const [upgradeMsg, setUpgradeMsg] = useState(null);
  const [tradeTab, setTradeTab] = useState('buy');
  const [heroPos, setHeroPos] = useState(locationPositions.verdant_plains);
  const [currentZone, setCurrentZone] = useState(() => {
    const zone = 'verdant_plains';
    useGameStore.getState().setHeroStandingZone?.(zone);
    return zone;
  });
  const [isMoving, setIsMoving] = useState(false);
  const [wanderOffsets, setWanderOffsets] = useState({});
  const mapRef = useRef(null);
  const outerRef = useRef(null);
  const menuRef = useRef(null);

  const [heroWalking, setHeroWalking] = useState({});
  const [hoveredNode, setHoveredNode] = useState(null);
  const [currentDialogue, setCurrentDialogue] = useState(null);
  const [dialoguePhase, setDialoguePhase] = useState(0);
  const [chatLog, setChatLog] = useState([]);
  const chatLogRef = useRef(null);
  const [bossWalkUp, setBossWalkUp] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventCountdown, setEventCountdown] = useState(0);
  const [movePath, setMovePath] = useState(null);
  const [moveStep, setMoveStep] = useState(0);
  const [isPathing, setIsPathing] = useState(false);
  const [walkPolyline, setWalkPolyline] = useState(null);
  const [walkProgress, setWalkProgress] = useState(0);
  const walkAnimRef = useRef(null);
  const routeNetworkRef = useRef(null);
  const [portalMenu, setPortalMenu] = useState(null);
  const [portalTransition, setPortalTransition] = useState(false);
  const [showDebugGrid, setShowDebugGrid] = useState(false);
  const [walkFootprints, setWalkFootprints] = useState([]);
  const footprintIdRef = useRef(0);
  const footprintCleanupRef = useRef([]);
  const [harvestTick, setHarvestTick] = useState(0);
  const [camZoom, setCamZoom] = useState(3);
  const [camPos, setCamPos] = useState({ x: 0, y: 0 });
  const [devUnlocked, setDevUnlocked] = useState({});
  const [devPositions, setDevPositions] = useState(() => {
    try { return JSON.parse(localStorage.getItem('devNodePositions') || '{}'); } catch { return {}; }
  });
  const [devDragging, setDevDragging] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const camInitRef = useRef(false);
  const [markerMode, setMarkerMode] = useState(false);
  const [devSubMode, setDevSubMode] = useState('marker');
  const [markerMenuNode, setMarkerMenuNode] = useState(null);
  const [drawingArea, setDrawingArea] = useState(null);
  const [drawingPoints, setDrawingPoints] = useState([]);
  const [movementAreas, setMovementAreas] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mapMovementAreas') || '{}'); } catch { return {}; }
  });
  const [drawingLandmark, setDrawingLandmark] = useState(null);
  const [landmarkPoints, setLandmarkPoints] = useState([]);
  const [editLandmarks, setEditLandmarks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mapEditLandmarks') || '[]'); } catch { return []; }
  });
  const [drawingRoute, setDrawingRoute] = useState(null);
  const [routePoints, setRoutePoints] = useState([]);
  const paintingRouteRef = useRef(false);
  const [roadWidth, setRoadWidth] = useState(2.5);
  const [editRoutes, setEditRoutes] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('mapEditRoutes') || '[]');
      if (Array.isArray(stored)) return stored;
      if (stored && typeof stored === 'object') {
        const migrated = Object.values(stored).filter(pts => Array.isArray(pts) && pts.length >= 2).map(points => ({ points }));
        localStorage.setItem('mapEditRoutes', JSON.stringify(migrated));
        return migrated;
      }
      return [];
    } catch { return []; }
  });
  const [editEffects, setEditEffects] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mapEditEffects') || '[]'); } catch { return []; }
  });
  const [placingEffect, setPlacingEffect] = useState(null);
  const [labelPositions, setLabelPositions] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mapLabelPositions') || '{}'); } catch { return {}; }
  });
  const [draggingLabel, setDraggingLabel] = useState(null);
  const dragLabelStart = useRef(null);

  useEffect(() => {
    if (camInitRef.current) return;
    const pos = locationPositions[currentZone] || locationPositions.verdant_plains;
    if (pos) {
      const initPos = { x: -(pos.x - 50), y: -(pos.y - 50) };
      const maxPan = Math.max(0, 50 - 50 / 3);
      setCamPos({
        x: Math.max(-maxPan, Math.min(maxPan, initPos.x)),
        y: Math.max(-maxPan, Math.min(maxPan, initPos.y)),
      });
      camInitRef.current = true;
    }
  }, [currentZone]);

  const clampCam = useCallback((pos, zoom) => {
    const maxPan = Math.max(0, 50 - 50 / zoom);
    return {
      x: Math.max(-maxPan, Math.min(maxPan, pos.x)),
      y: Math.max(-maxPan, Math.min(maxPan, pos.y)),
    };
  }, []);

  const handleMapWheel = useCallback((e) => {
    e.preventDefault();
    setCamZoom(z => {
      const newZ = Math.max(1, Math.min(5, z + (e.deltaY > 0 ? -0.25 : 0.25)));
      setCamPos(p => clampCam(p, newZ));
      return newZ;
    });
  }, [clampCam]);

  const screenToMapPercent = useCallback((clientX, clientY) => {
    const el = mapRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    return { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 };
  }, []);

  const handleMapMouseDown = useCallback((e) => {
    if (drawingArea && e.button === 0 && !e.target.closest('button') && !e.target.closest('[data-marker-menu]')) {
      e.preventDefault();
      e.stopPropagation();
      const pt = screenToMapPercent(e.clientX, e.clientY);
      if (pt) setDrawingPoints(prev => [...prev, pt]);
      return;
    }
    if (drawingLandmark && e.button === 0 && !e.target.closest('button') && !e.target.closest('[data-marker-menu]')) {
      e.preventDefault();
      e.stopPropagation();
      const pt = screenToMapPercent(e.clientX, e.clientY);
      if (pt) setLandmarkPoints(prev => [...prev, [pt.x, pt.y]]);
      return;
    }
    if (drawingRoute && e.button === 0 && !e.target.closest('button') && !e.target.closest('[data-marker-menu]')) {
      e.preventDefault();
      e.stopPropagation();
      const pt = screenToMapPercent(e.clientX, e.clientY);
      if (pt) {
        paintingRouteRef.current = true;
        setRoutePoints([{ x: pt.x, y: pt.y }]);
      }
      return;
    }
    if (placingEffect && e.button === 0 && !e.target.closest('button') && !e.target.closest('[data-marker-menu]')) {
      e.preventDefault();
      e.stopPropagation();
      const pt = screenToMapPercent(e.clientX, e.clientY);
      if (pt) {
        const newEffect = { ...placingEffect, x: pt.x, y: pt.y, id: Date.now() };
        setEditEffects(prev => {
          const next = [...prev, newEffect];
          localStorage.setItem('mapEditEffects', JSON.stringify(next));
          return next;
        });
        setPlacingEffect(null);
      }
      return;
    }
    if (markerMode && e.button === 0) return;
    if (e.button === 0 && !e.target.closest('button') && !e.target.closest('[data-node]')) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  }, [drawingArea, drawingLandmark, drawingRoute, placingEffect, screenToMapPercent, markerMode]);

  const handleMapMouseMove = useCallback((e) => {
    if (paintingRouteRef.current && drawingRoute) {
      e.preventDefault();
      const pt = screenToMapPercent(e.clientX, e.clientY);
      if (pt) {
        setRoutePoints(prev => {
          const last = prev[prev.length - 1];
          if (last) {
            const dist = Math.sqrt((pt.x - last.x) ** 2 + (pt.y - last.y) ** 2);
            if (dist < 0.3) return prev;
          }
          return [...prev, { x: pt.x, y: pt.y }];
        });
      }
      return;
    }
    if (!isDragging) return;
    const el = mapRef.current;
    const mapW = el ? el.offsetWidth : 1000;
    const mapH = el ? el.offsetHeight : 700;
    const dx = (e.clientX - dragStart.x) / (mapW * camZoom) * 100;
    const dy = (e.clientY - dragStart.y) / (mapH * camZoom) * 100;
    setCamPos(p => clampCam({ x: p.x + dx, y: p.y + dy }, camZoom));
    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, dragStart, camZoom, clampCam, drawingRoute, screenToMapPercent]);

  const handleMapMouseUp = useCallback(() => {
    if (paintingRouteRef.current) {
      paintingRouteRef.current = false;
      setRoutePoints(pts => {
        if (pts.length >= 2) {
          const newRoad = { points: pts, width: roadWidth };
          setEditRoutes(prev => {
            const next = [...prev, newRoad];
            localStorage.setItem('mapEditRoutes', JSON.stringify(next));
            return next;
          });
        }
        return [];
      });
      return;
    }
    setIsDragging(false);
  }, [roadWidth]);

  useEffect(() => {
    const el = mapRef.current?.parentElement;
    if (!el) return;
    const handler = (e) => {
      e.preventDefault();
      setCamZoom(z => {
        const newZ = Math.max(1, Math.min(5, z + (e.deltaY > 0 ? -0.25 : 0.25)));
        setCamPos(p => {
          const maxPan = Math.max(0, 50 - 50 / newZ);
          return { x: Math.max(-maxPan, Math.min(maxPan, p.x)), y: Math.max(-maxPan, Math.min(maxPan, p.y)) };
        });
        return newZ;
      });
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  const wanderTimersRef = useRef({});
  const wanderOffsetsRef = useRef(wanderOffsets);
  wanderOffsetsRef.current = wanderOffsets;

  useEffect(() => {
    const activeHeroes = heroRoster.filter(h => activeHeroIds.includes(h.id));
    const zonePos = getNodePos(currentZone) || locationPositions.verdant_plains;
    const area = movementAreas[currentZone];

    Object.values(wanderTimersRef.current).forEach(t => clearTimeout(t));
    wanderTimersRef.current = {};
    if (isPathing) return;

    const getRandomPoint = () => {
      if (area && area.length >= 3) {
        const el = mapRef.current;
        const mapW = el ? el.offsetWidth : 1000;
        const mapH = el ? el.offsetHeight : 700;
        const relPts = area.map(p => ({ x: p.x - zonePos.x, y: p.y - zonePos.y }));
        const minX = Math.min(...relPts.map(p => p.x));
        const maxX = Math.max(...relPts.map(p => p.x));
        const minY = Math.min(...relPts.map(p => p.y));
        const maxY = Math.max(...relPts.map(p => p.y));
        let pctX = 0, pctY = 0;
        for (let tries = 0; tries < 20; tries++) {
          const tx = minX + Math.random() * (maxX - minX);
          const ty = minY + Math.random() * (maxY - minY);
          let inside = false;
          for (let i = 0, j = relPts.length - 1; i < relPts.length; j = i++) {
            if ((relPts[i].y > ty) !== (relPts[j].y > ty) &&
              tx < (relPts[j].x - relPts[i].x) * (ty - relPts[i].y) / (relPts[j].y - relPts[i].y) + relPts[i].x) {
              inside = !inside;
            }
          }
          if (inside) { pctX = tx; pctY = ty; break; }
        }
        if (pctX === 0 && pctY === 0) {
          pctX = relPts.reduce((s, p) => s + p.x, 0) / relPts.length;
          pctY = relPts.reduce((s, p) => s + p.y, 0) / relPts.length;
        }
        return { x: (pctX * mapW) / (100 * 3), y: (pctY * mapH) / (100 * 2) };
      }
      return { x: (Math.random() - 0.5) * 3, y: (Math.random() - 0.5) * 1.5 };
    };

    const clearHeroTimers = (heroId) => {
      [heroId, `${heroId}_stop`, `${heroId}_init`].forEach(key => {
        if (wanderTimersRef.current[key]) {
          clearTimeout(wanderTimersRef.current[key]);
          delete wanderTimersRef.current[key];
        }
      });
    };

    const scheduleHero = (hero) => {
      clearHeroTimers(hero.id);
      const idleTime = 1500 + Math.random() * 3500;
      const moveTime = 1200 + Math.random() * 1600;

      wanderTimersRef.current[hero.id] = setTimeout(() => {
        const target = getRandomPoint();
        const jitterX = (Math.random() - 0.5) * 0.6;
        const jitterY = (Math.random() - 0.5) * 0.4;
        const newX = target.x + jitterX;

        setWanderOffsets(prev => {
          const prevX = prev[hero.id]?.x || 0;
          setHeroWalking(w => ({
            ...w,
            [hero.id]: { moving: true, flipX: newX < prevX },
          }));
          return { ...prev, [hero.id]: { x: newX, y: target.y + jitterY } };
        });

        wanderTimersRef.current[`${hero.id}_stop`] = setTimeout(() => {
          setHeroWalking(prev => {
            const next = { ...prev };
            delete next[hero.id];
            return next;
          });
          scheduleHero(hero);
        }, moveTime);
      }, idleTime);
    };

    activeHeroes.forEach((hero, idx) => {
      const startDelay = idx * 800 + Math.random() * 1200;
      const initPoint = getRandomPoint();
      setWanderOffsets(prev => ({
        ...prev,
        [hero.id]: { x: initPoint.x + (Math.random() - 0.5) * 0.5, y: initPoint.y + (Math.random() - 0.5) * 0.3 },
      }));
      wanderTimersRef.current[`${hero.id}_init`] = setTimeout(() => {
        scheduleHero(hero);
      }, startDelay);
    });

    return () => {
      Object.values(wanderTimersRef.current).forEach(t => clearTimeout(t));
      wanderTimersRef.current = {};
    };
  }, [heroRoster, activeHeroIds, currentZone, movementAreas, isPathing]);

  useEffect(() => {
    if (!movePath || movePath.length < 2 || moveStep >= movePath.length - 1) {
      if (movePath && moveStep >= movePath.length - 1) {
        const dest = movePath[movePath.length - 1];
        setCurrentZone(dest);
        setHeroStandingZone(dest);
        setIsPathing(false);
        setIsMoving(false);
        setMovePath(null);
        setMoveStep(0);
        setWalkPolyline(null);
        setWalkProgress(0);
        if (walkAnimRef.current) { cancelAnimationFrame(walkAnimRef.current); walkAnimRef.current = null; }
        heroRoster.filter(h => activeHeroIds.includes(h.id)).forEach(hero => {
          setHeroWalking(prev => { const next = { ...prev }; delete next[hero.id]; return next; });
        });
      }
      return;
    }
    setIsPathing(true);
    setHeroStandingZone(null);
    setIsMoving(true);
    const currentNode = movePath[moveStep];
    const nextNode = movePath[moveStep + 1];
    const from = getNodePos(currentNode);
    const to = getNodePos(nextNode);
    if (!from || !to) return;

    const network = routeNetworkRef.current;
    let polyline = network ? network.getPathBetween(from, to) : null;
    if (!polyline || polyline.length < 2) {
      polyline = [{ x: from.x, y: from.y }, { x: to.x, y: to.y }];
    }

    let totalDist = 0;
    const segDists = [];
    for (let i = 1; i < polyline.length; i++) {
      const dx = polyline[i].x - polyline[i - 1].x;
      const dy = polyline[i].y - polyline[i - 1].y;
      const d = Math.sqrt(dx * dx + dy * dy);
      segDists.push(d);
      totalDist += d;
    }

    const WALK_SPEED = 2.8;
    const duration = Math.max(1500, (totalDist / WALK_SPEED) * 1000);

    const getPolyPos = (t) => {
      const targetDist = t * totalDist;
      let accumulated = 0;
      for (let i = 0; i < segDists.length; i++) {
        if (accumulated + segDists[i] >= targetDist) {
          const segT = segDists[i] > 0 ? (targetDist - accumulated) / segDists[i] : 0;
          return {
            x: polyline[i].x + (polyline[i + 1].x - polyline[i].x) * segT,
            y: polyline[i].y + (polyline[i + 1].y - polyline[i].y) * segT,
            dx: polyline[i + 1].x - polyline[i].x,
            dy: polyline[i + 1].y - polyline[i].y,
          };
        }
        accumulated += segDists[i];
      }
      const last = polyline[polyline.length - 1];
      return { x: last.x, y: last.y, dx: 0, dy: 0 };
    };

    let startTime = null;
    let lastFpDist = 0;
    const FP_SPACING = 1.2;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const pos = getPolyPos(eased);

      setHeroPos({ x: pos.x, y: pos.y });
      heroRoster.filter(h => activeHeroIds.includes(h.id)).forEach(hero => {
        setHeroWalking(prev => ({ ...prev, [hero.id]: { moving: true, flipX: pos.dx < 0 } }));
      });

      const camTarget = { x: -(pos.x - 50), y: -(pos.y - 50) };
      const maxPan = Math.max(0, 50 - 50 / camZoom);
      setCamPos({
        x: Math.max(-maxPan, Math.min(maxPan, camTarget.x)),
        y: Math.max(-maxPan, Math.min(maxPan, camTarget.y)),
      });

      const currentDist = eased * totalDist;
      if (currentDist - lastFpDist >= FP_SPACING) {
        lastFpDist = currentDist;
        const angle = Math.atan2(pos.dy, pos.dx) * (180 / Math.PI);
        const isLeft = Math.round(currentDist / FP_SPACING) % 2 === 0;
        const perpX = -Math.sin(angle * Math.PI / 180) * 0.15;
        const perpY = Math.cos(angle * Math.PI / 180) * 0.15;
        const fpId = footprintIdRef.current++;
        setWalkFootprints(prev => [...prev, {
          id: fpId,
          x: pos.x + (isLeft ? perpX : -perpX),
          y: pos.y + (isLeft ? perpY : -perpY),
          angle: angle + (isLeft ? -15 : 15),
          born: Date.now(),
        }]);
        setTimeout(() => {
          setWalkFootprints(prev => prev.filter(fp => fp.id !== fpId));
        }, 3000);
      }

      if (t < 1) {
        walkAnimRef.current = requestAnimationFrame(animate);
      } else {
        setCurrentZone(nextNode);
        setMoveStep(prev => prev + 1);
      }
    };

    walkAnimRef.current = requestAnimationFrame(animate);

    return () => {
      if (walkAnimRef.current) {
        cancelAnimationFrame(walkAnimRef.current);
        walkAnimRef.current = null;
      }
    };
  }, [movePath, moveStep]);

  useEffect(() => { setBgm('ambient'); }, []);

  useEffect(() => {
    routeNetworkRef.current = buildRouteNetwork(editRoutes, locationPositions);
  }, [editRoutes]);

  useEffect(() => {
    const hasActive = Object.keys(activeHarvests).length > 0;
    if (!hasActive) return;
    const interval = setInterval(() => setHarvestTick(t => t + 1), 2000);
    return () => clearInterval(interval);
  }, [activeHarvests]);

  useEffect(() => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [chatLog]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.key === '#') || (e.code === 'Digit3' && e.shiftKey)) {
        e.preventDefault();
        setMarkerMode(m => !m);
        setDevSubMode('marker');
        setMarkerMenuNode(null);
        setDrawingArea(null);
        setDrawingPoints([]);
        setDrawingLandmark(null);
        setLandmarkPoints([]);
        setDrawingRoute(null);
        setRoutePoints([]);
        setPlacingEffect(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => { tickHarvests(); }, 2000);
    return () => clearInterval(interval);
  }, [tickHarvests]);

  useEffect(() => {
    const activeHeroes = heroRoster.filter(h => activeHeroIds.includes(h.id));
    if (activeHeroes.length < 2) return;
    const delay = 5000 + Math.random() * 3000;
    const timeout = setTimeout(() => {
      const gameState = { gold, level, currentZone, zoneConquer, bossesDefeated, locationsCleared, victories, locations };
      const dialogue = generateDialogue(activeHeroes, gameState);
      if (dialogue) {
        setCurrentDialogue(dialogue);
        setDialoguePhase(1);
        setChatLog(prev => {
          const entry = { id: Date.now(), speaker: dialogue.speaker1.name, line: dialogue.line1, color: 'var(--accent)' };
          return [...prev.slice(-49), entry];
        });
        setTimeout(() => {
          setDialoguePhase(2);
          setChatLog(prev => {
            const entry = { id: Date.now() + 1, speaker: dialogue.speaker2.name, line: dialogue.line2, color: 'var(--gold)' };
            return [...prev.slice(-49), entry];
          });
        }, 2500);
        
      }
    }, delay);
    return () => clearTimeout(timeout);
  }, [currentDialogue, heroRoster, activeHeroIds, gold, level, currentZone, zoneConquer, bossesDefeated, locationsCleared, victories]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (cleanExpiredEvents) cleanExpiredEvents();
    }, 5000);
    return () => clearInterval(interval);
  }, [cleanExpiredEvents]);

  useEffect(() => {
    const spawnDelay = 20000 + Math.random() * 20000;
    const timeout = setTimeout(() => {
      const currentEvents = randomEvents || [];
      if (currentEvents.length < 3) {
        const unlockedIds = (getUnlockedLocations() || []).map(l => l.id);
        const newEvent = generateRandomEvent(level, unlockedIds, currentEvents);
        if (newEvent && addRandomEvent) addRandomEvent(newEvent);
      }
    }, spawnDelay);
    return () => clearTimeout(timeout);
  }, [randomEvents, level, addRandomEvent, getUnlockedLocations]);

  useEffect(() => {
    const interval = setInterval(() => {
      setEventCountdown(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setSelectedLocation(null);
        setSelectedCity(null);
        setCitySubmenu(null);
        setSelectedEvent(null);
        setPortalMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNodePos = useCallback((id) => {
    return devPositions[id] || locationPositions[id] || cityPositions[id];
  }, [devPositions]);

  const handleNodeRightClick = useCallback((e, node) => {
    e.preventDefault();
    e.stopPropagation();
    const isUnlocked = node.unlocked || (node.unlockLevel && level >= node.unlockLevel) || devUnlocked[node.id];
    if (!isUnlocked) {
      setDevUnlocked(prev => ({ ...prev, [node.id]: true }));
      return;
    }
    setDevDragging(node.id);
    setSelectedLocation(null);
    setSelectedCity(null);
    setSelectedEvent(null);
  }, [level, devUnlocked]);

  useEffect(() => {
    if (!devDragging) return;
    const onMove = (e) => {
      if (!mapRef.current) return;
      const mapEl = mapRef.current;
      const rect = mapEl.getBoundingClientRect();
      const x = Math.round(Math.max(2, Math.min(98, ((e.clientX - rect.left) / rect.width) * 100)));
      const y = Math.round(Math.max(2, Math.min(98, ((e.clientY - rect.top) / rect.height) * 100)));
      setDevPositions(prev => {
        const next = { ...prev, [devDragging]: { x, y } };
        localStorage.setItem('devNodePositions', JSON.stringify(next));
        return next;
      });
    };
    const onUp = () => setDevDragging(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('contextmenu', (e) => e.preventDefault(), { once: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [devDragging]);

  const handleLocationClick = useCallback((e, loc) => {
    e.preventDefault();
    e.stopPropagation();

    if (markerMode) {
      if (devSubMode === 'marker') {
        setMarkerMenuNode(loc.id);
        setDrawingArea(null);
        setDrawingPoints([]);
      } else if (devSubMode === 'pathfinding') {
      }
      return;
    }

    const isUnlocked = loc.unlocked || (loc.unlockLevel && level >= loc.unlockLevel) || devUnlocked[loc.id];
    if (!isUnlocked) return;

    setSelectedLocation(loc.id);
    setSelectedCity(null);
    setCitySubmenu(null);
    setSelectedEvent(null);

    if (isPathing) return;
    
    if (portalLocations.includes(loc.id)) {
      setPortalMenu(loc.id);
      return;
    }

    if (currentZone === loc.id) {
      setSelectedLocation(loc.id);
      return;
    }
    const path = findPath(currentZone, loc.id);
    if (path && path.length >= 2) {
      setSelectedLocation(loc.id);
      setMovePath(path);
      setMoveStep(0);
    } else {
      setSelectedLocation(loc.id);
    }
  }, [level, heroPos, getNodePos, devUnlocked, markerMode, devSubMode, isPathing, currentZone]);

  const handleCityClick = useCallback((e, city) => {
    e.preventDefault();
    e.stopPropagation();
    const bossOk = !city.unlockBoss || bossesDefeated.includes(city.unlockBoss);
    const isCityUnlocked = city.unlocked || (bossOk && city.unlockLevel && level >= city.unlockLevel) || devUnlocked[city.id];
    if (!isCityUnlocked) return;

    setSelectedCity(city.id);
    setSelectedLocation(null);
    setCitySubmenu(null);
    setSelectedEvent(null);

    if (isPathing) return;
    const path = findPath(currentZone, city.id);
    if (path && path.length >= 2) {
      setMovePath(path);
      setMoveStep(0);
    }
  }, [level, heroPos, getNodePos, devUnlocked, isPathing, currentZone]);

  const handleBattle = (locId) => {
    useGameStore.setState({ currentLocation: locId });
    startBattle(locId);
    setSelectedLocation(null);
  };

  const handleBoss = (locId, bossId) => {
    const loc = locations.find(l => l.id === locId);
    const bs = bossMapSprites[bossId] || {};
    setSelectedLocation(null);
    setBossWalkUp({
      locId, bossId, phase: 'walk',
      terrain: bs.terrain,
      glow: bs.glow || 'rgba(255,0,0,0.5)',
      color1: bs.color1 || '#f44',
      bossName: loc?.boss ? (bossId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())) : 'Boss',
      isGodFight: loc?.isGodFight,
    });
    setTimeout(() => setBossWalkUp(prev => prev ? { ...prev, phase: 'confront' } : null), 1500);
    setTimeout(() => setBossWalkUp(prev => prev ? { ...prev, phase: 'flash' } : null), 3000);
    setTimeout(() => {
      setBossWalkUp(null);
      useGameStore.setState({ currentLocation: locId });
      startBossBattle(bossId);
    }, 3800);
  };

  const handleRest = () => {
    restAtInn();
    setSelectedLocation(null);
  };

  const toggleHeroActive = (heroId) => {
    if (activeHeroIds.includes(heroId)) {
      if (activeHeroIds.length <= 1) return;
      setActiveHeroes(activeHeroIds.filter(id => id !== heroId));
    } else {
      if (activeHeroIds.length >= 3) return;
      setActiveHeroes([...activeHeroIds, heroId]);
    }
  };

  const HealthBar = ({ current, max, color, label }) => (
    <div style={{ marginBottom: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--muted)', marginBottom: 1 }}>
        <span>{label}</span><span>{current}/{max}</span>
      </div>
      <div style={{ height: 5, background: 'var(--border)', borderRadius: 3 }}>
        <div style={{ height: '100%', width: `${(current/max)*100}%`, background: color, borderRadius: 3, transition: 'width 0.3s' }} />
      </div>
    </div>
  );

  const selectedLoc = selectedLocation ? locations.find(l => l.id === selectedLocation) : null;
  const bossDefeated = selectedLoc?.boss ? bossesDefeated.includes(selectedLoc.boss) : false;
  const isCleared = selectedLoc ? locationsCleared.includes(selectedLoc.id) : false;

  useEffect(() => {
    if (!selectedLoc) return;
    const menuActions = [];
    menuActions.push(() => handleBattle(selectedLoc.id));
    if (selectedLoc.boss && !bossDefeated) {
      menuActions.push(() => handleBoss(selectedLoc.id, selectedLoc.boss));
    }
    menuActions.push(() => handleRest());
    menuActions.push(() => { enterLocation(selectedLoc.id); setSelectedLocation(null); });
    menuActions.push(null);

    const handler = (e) => {
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      const num = parseInt(e.key);
      if (num >= 1 && num <= menuActions.length && menuActions[num - 1]) {
        e.preventDefault();
        e.stopPropagation();
        menuActions[num - 1]();
      }
      if (e.key === 'Escape') {
        setSelectedLocation(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedLoc, bossDefeated]);

  const getPopupSide = (nodeId) => {
    const pos = getNodePos(nodeId);
    if (!pos) return 'right';
    return pos.x > 50 ? 'left' : 'right';
  };

  const popupPositionStyle = (nodeId) => {
    const side = getPopupSide(nodeId);
    return side === 'left'
      ? { left: 16, right: 'auto', animation: 'slideInLeft 0.2s ease-out' }
      : { right: 16, left: 'auto', animation: 'slideInRight 0.2s ease-out' };
  };

  return (
    <div
      ref={outerRef}
      onMouseDown={handleMapMouseDown}
      onMouseMove={handleMapMouseMove}
      onMouseUp={handleMapMouseUp}
      onMouseLeave={handleMapMouseUp}
      style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative', background: '#0b1020', cursor: drawingRoute ? 'crosshair' : (isDragging ? 'grabbing' : 'grab'), border: '2px solid rgba(30,25,15,0.9)', boxShadow: 'inset 0 0 30px rgba(0,0,0,0.4), 0 0 1px rgba(139,109,56,0.3)' }}
    >
      <div ref={mapRef} style={{
        width: '100%', height: '100%', position: 'relative',
        backgroundImage: 'url(/backgrounds/world_map.png)',
        backgroundSize: '100% 100%', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
        transform: `scale(${camZoom}) translate(${camPos.x}%, ${camPos.y}%)`,
        transformOrigin: '50% 50%',
        transition: isDragging ? 'none' : 'transform 0.3s ease-out',
        boxShadow: 'none',
      }}>
        <div style={fullCoverStyle(MAP_LAYERS.TERRAIN_FILL, {
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.5) 100%)',
        })} />

        <div style={fullCoverStyle(MAP_LAYERS.DAY_NIGHT, {
          background: 'rgba(255,180,80,0.03)',
          animation: 'dayNightCycle 120s linear infinite',
        })} />

        {showDebugGrid && (
          <svg {...svgOverlayProps(MAP_LAYERS.DEBUG_GRID)}>
            {Array.from({ length: 11 }).map((_, i) => (
              <g key={`gridline_${i}`}>
                <line x1={i * 10} y1={0} x2={i * 10} y2={100} stroke="rgba(255,255,255,0.1)" strokeWidth="0.15" />
                <line x1={0} y1={i * 10} x2={100} y2={i * 10} stroke="rgba(255,255,255,0.1)" strokeWidth="0.15" />
                <text x={i * 10 + 0.5} y={2} fill="rgba(255,255,255,0.4)" fontSize="1.5">{i * 10}</text>
                <text x={0.5} y={i * 10 + 1.5} fill="rgba(255,255,255,0.4)" fontSize="1.5">{i * 10}</text>
              </g>
            ))}
            {Object.entries(locationPositions).map(([id, pos]) => (
              <circle key={`dbg_${id}`} cx={pos.x} cy={pos.y} r="0.8" fill="none" stroke="rgba(255,0,0,0.5)" strokeWidth="0.2" />
            ))}
          </svg>
        )}

        <svg {...svgOverlayProps(MAP_LAYERS.TERRAIN_SVG)}>
          {terrainRegions.map((region, idx) => (
            <polygon key={idx}
              points={region.points}
              fill={region.fill}
              stroke="none"
              strokeWidth="0"
            />
          ))}
        </svg>

        {terrainRegions.map((region, idx) => {
          const lp = labelPositions[idx];
          const lx = lp ? lp.x : region.labelX;
          const ly = lp ? lp.y : region.labelY;
          return (
            <div key={`rl_${idx}`} style={{
              position: 'absolute',
              left: `${lx}%`, top: `${ly}%`,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'auto', zIndex: MAP_LAYERS.REGION_LABELS,
              cursor: 'default',
              userSelect: 'none',
              fontFamily: "'MedievalSharp', cursive",
              fontSize: '0.9rem', fontWeight: 400,
              color: region.stroke.replace('0.2', '0.45'),
              letterSpacing: '0.12em',
              textShadow: `0 0 14px ${region.fill}, 0 0 6px ${region.fill}, 0 2px 8px rgba(0,0,0,0.9)`,
              opacity: draggingLabel === idx ? 0.9 : 0.55,
              whiteSpace: 'nowrap',
              transition: draggingLabel === idx ? 'none' : 'opacity 0.2s',
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDraggingLabel(idx);
              dragLabelStart.current = { x: e.clientX, y: e.clientY, origX: lx, origY: ly };
              const onMove = (me) => {
                me.preventDefault();
                if (!dragLabelStart.current || !mapRef.current) return;
                const rect = mapRef.current.getBoundingClientRect();
                const dx = ((me.clientX - dragLabelStart.current.x) / rect.width) * 100;
                const dy = ((me.clientY - dragLabelStart.current.y) / rect.height) * 100;
                const nx = Math.max(2, Math.min(98, dragLabelStart.current.origX + dx));
                const ny = Math.max(2, Math.min(98, dragLabelStart.current.origY + dy));
                setLabelPositions(prev => {
                  const next = { ...prev, [idx]: { x: Math.round(nx * 100) / 100, y: Math.round(ny * 100) / 100 } };
                  return next;
                });
              };
              const onUp = () => {
                window.removeEventListener('mousemove', onMove);
                window.removeEventListener('mouseup', onUp);
                window.removeEventListener('contextmenu', onCtx);
                setDraggingLabel(null);
                dragLabelStart.current = null;
                setLabelPositions(prev => {
                  localStorage.setItem('mapLabelPositions', JSON.stringify(prev));
                  return prev;
                });
              };
              const onCtx = (ce) => ce.preventDefault();
              window.addEventListener('mousemove', onMove);
              window.addEventListener('mouseup', onUp);
              window.addEventListener('contextmenu', onCtx);
            }}
            >
              {region.name}
            </div>
          );
        })}

        <svg {...svgOverlayProps(MAP_LAYERS.LANDMARKS)}>
          <defs>
            <pattern id="lavaTexture" patternUnits="userSpaceOnUse" width="8" height="8">
              <image href="/backgrounds/lava_texture.png" x="0" y="0" width="8" height="8" preserveAspectRatio="xMidYMid slice">
                <animate attributeName="y" from="0" to="-8" dur="12s" repeatCount="indefinite" />
              </image>
            </pattern>
            <filter id="lavaGlow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="0.4" result="blur" />
              <feColorMatrix in="blur" type="matrix" values="1.5 0 0 0 0.15  0 0.5 0 0 0  0 0 0.1 0 0  0 0 0 1 0" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="lavaSoft" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="0.15" result="softEdge" />
              <feComposite in="SourceGraphic" in2="softEdge" operator="in" />
            </filter>
          </defs>
          {mapLandmarks.filter(l => l.type === 'river').map((river, idx) => {
            const d = buildSmoothPath(river.points);
            return (
              <g key={`river_${idx}`}>
                <path d={d} fill="none" stroke="rgba(200,230,255,0.06)" strokeWidth={river.width + 1.2} strokeLinecap="round" strokeLinejoin="round" />
                <path d={d} fill="none" stroke={river.color} strokeWidth={river.width} strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 4px ${river.color})` }} />
              </g>
            );
          })}
          {mapLandmarks.filter(l => l.type === 'lava').map((lava, idx) => {
            const d = buildSmoothPath(lava.points);
            return (
              <g key={`lava_${idx}`} filter="url(#lavaGlow)">
                <path d={d} fill="none" stroke="rgba(180,40,0,0.7)" strokeWidth={lava.width + 0.4} strokeLinecap="round" strokeLinejoin="round" />
                <path d={d} fill="none" stroke="url(#lavaTexture)" strokeWidth={lava.width} strokeLinecap="round" strokeLinejoin="round" style={{ animation: `lavaPulse ${3 + idx}s ease-in-out infinite` }} />
                <path d={d} fill="none" stroke="rgba(255,160,30,0.5)" strokeWidth={lava.width * 0.5} strokeLinecap="round" strokeLinejoin="round" style={{ animation: `lavaPulse ${2 + idx * 0.5}s ease-in-out infinite alternate` }} />
                <path d={d} fill="none" stroke="rgba(255,230,80,0.25)" strokeWidth={lava.width * 0.2} strokeLinecap="round" strokeLinejoin="round" style={{ animation: `lavaPulse ${1.5 + idx * 0.3}s ease-in-out infinite` }} />
              </g>
            );
          })}
        </svg>

        {/* Water sprite animations along rivers */}
        {[...mapLandmarks.filter(l => l.type === 'river'), ...editLandmarks.filter(l => l.type === 'river')].map((river, rIdx) => {
          const pts = river.points || [];
          const sampled = samplePointsAlongPath(pts, 2.0);
          const spriteScale = Math.max(0.06, 0.1 / camZoom);
          return sampled.map((sp, si) => {
            const delay = ((rIdx * 7 + si * 3) % 16) * 0.12;
            return (
              <div key={`wsp_${rIdx}_${si}`} style={{
                position: 'absolute',
                left: `${sp.x}%`, top: `${sp.y}%`,
                width: 192, height: 192,
                transform: `translate(-50%, -50%) scale(${spriteScale})`,
                transformOrigin: 'center center',
                pointerEvents: 'none',
                zIndex: MAP_LAYERS.LANDMARKS + 1,
                backgroundImage: 'url(/sprites/water_sprite.png)',
                backgroundSize: '3072px 192px',
                backgroundRepeat: 'no-repeat',
                imageRendering: 'pixelated',
                opacity: 0.7,
                filter: 'drop-shadow(0 0 3px rgba(100,200,255,0.4))',
                animation: `waterSpriteAnim 1.6s steps(16) infinite ${delay}s`,
              }} />
            );
          });
        })}

        {/* Path grass decorations */}
        {pathGrassPositions.map((gp, gi) => {
          const wheatInfo = SPRITE_INFO.wheat;
          const grassScale = Math.max(0.06, 0.12 * gp.scale / camZoom);
          const bgX = -(gp.frame * wheatInfo.frameW);
          return (
            <div key={`grass_${gi}`} style={{
              position: 'absolute',
              left: `${gp.x}%`, top: `${gp.y}%`,
              width: wheatInfo.frameW, height: wheatInfo.frameH,
              transform: `translate(-50%, -50%) scale(${grassScale})`,
              transformOrigin: 'center center',
              pointerEvents: 'none',
              zIndex: MAP_LAYERS.LANDMARKS,
              backgroundImage: `url(${wheatInfo.src})`,
              backgroundSize: `${wheatInfo.cols * wheatInfo.frameW}px ${wheatInfo.frameH}px`,
              backgroundPosition: `${bgX}px 0px`,
              backgroundRepeat: 'no-repeat',
              imageRendering: 'pixelated',
              opacity: gp.opacity,
            }} />
          );
        })}

        {/* Harvestable resource nodes */}
        {Object.entries(zoneResourceMap).map(([zoneId, zoneRes]) => {
          const resPositions = generateResourcePositions(zoneId, zoneRes.count);
          const spriteInfo = SPRITE_INFO[zoneRes.sprite];
          if (!spriteInfo || resPositions.length === 0) return null;
          const harvestId = resourceToHarvestId[zoneRes.resource];
          const isBeingHarvested = Object.entries(activeHarvests).some(([nId]) => nId === harvestId);
          const resScale = Math.max(0.08, 0.14 / camZoom);
          return resPositions.map((rp, ri) => {
            let frameCol;
            if (isBeingHarvested) {
              const cycleLen = 4;
              const phase = ((harvestTick + ri) % cycleLen) / cycleLen;
              if (phase < 0.3) frameCol = spriteInfo.fullFrame;
              else if (phase < 0.6) frameCol = spriteInfo.halfFrame;
              else if (phase < 0.85) frameCol = spriteInfo.lowFrame;
              else frameCol = spriteInfo.stumpFrame;
            } else {
              frameCol = spriteInfo.fullFrame;
            }
            if (frameCol < 0) return null;
            const row = zoneRes.rockRow || 0;
            const bgX = -(frameCol * spriteInfo.frameW);
            const bgY = -(row * spriteInfo.frameH);
            const sheetW = spriteInfo.cols * spriteInfo.frameW;
            const sheetH = (spriteInfo.rows || 1) * spriteInfo.frameH;
            return (
              <div key={`res_${zoneId}_${ri}`} style={{
                position: 'absolute',
                left: `${rp.x}%`, top: `${rp.y}%`,
                width: spriteInfo.frameW, height: spriteInfo.frameH,
                transform: `translate(-50%, -50%) scale(${resScale})`,
                transformOrigin: 'center center',
                pointerEvents: 'none',
                zIndex: MAP_LAYERS.LANDMARKS + 2,
                backgroundImage: `url(${spriteInfo.src})`,
                backgroundSize: `${sheetW}px ${sheetH}px`,
                backgroundPosition: `${bgX}px ${bgY}px`,
                backgroundRepeat: 'no-repeat',
                imageRendering: 'pixelated',
                filter: zoneRes.filter || 'none',
              }} />
            );
          });
        })}

        {/* Footprints hidden for players */}
        {/*
        {walkFootprints.map(fp => {
          const dotScale = Math.max(0.4, 0.8 / camZoom);
          return (
            <div key={fp.id} style={{
              position: 'absolute',
              left: `${fp.x}%`, top: `${fp.y}%`,
              width: 8, height: 12,
              transform: `translate(-50%, -50%) rotate(${fp.angle + 90}deg) scale(${dotScale})`,
              pointerEvents: 'none',
              zIndex: MAP_LAYERS.HERO - 1,
              animation: 'footprintFade 3s ease-out forwards',
            }}>
              <div style={{
                width: 5, height: 7, borderRadius: '45% 45% 35% 35%',
                background: 'rgba(255,215,0,0.7)',
                boxShadow: '0 0 4px rgba(255,215,0,0.4)',
              }} />
            </div>
          );
        })}
        */}

        {markerMode && (
          <svg {...svgOverlayProps(MAP_LAYERS.LANDMARKS)}>
            {Object.entries(movementAreas).map(([nodeId, pts]) => {
              if (!pts || pts.length < 3) return null;
              const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + ' Z';
              return (
                <g key={`ma_${nodeId}`}>
                  <path d={d} fill="rgba(251,191,36,0.08)" stroke="rgba(251,191,36,0.5)" strokeWidth={0.3} strokeDasharray="1,0.5" />
                  <text x={pts[0].x} y={pts[0].y - 0.8} fill="rgba(251,191,36,0.7)" fontSize="1.2" textAnchor="middle">{nodeId}</text>
                </g>
              );
            })}
            {drawingPoints.length > 0 && (
              <g>
                <polyline
                  points={drawingPoints.map(p => `${p.x},${p.y}`).join(' ')}
                  fill="none" stroke="rgba(74,222,128,0.7)" strokeWidth={0.3}
                />
                {drawingPoints.length >= 3 && (
                  <polygon
                    points={drawingPoints.map(p => `${p.x},${p.y}`).join(' ')}
                    fill="rgba(74,222,128,0.1)" stroke="rgba(74,222,128,0.5)" strokeWidth={0.25} strokeDasharray="0.8,0.4"
                  />
                )}
                {drawingPoints.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r={0.5} fill="rgba(74,222,128,0.8)" stroke="#fff" strokeWidth={0.15} />
                ))}
              </g>
            )}
          </svg>
        )}

        {(editRoutes.length > 0 || editLandmarks.length > 0 || routePoints.length > 0 || landmarkPoints.length > 0) && (
          <svg {...svgOverlayProps(MAP_LAYERS.ROADS)}>
            <defs>
              <pattern id="lavaTextureEdit" patternUnits="userSpaceOnUse" width="8" height="8">
                <image href="/backgrounds/lava_texture.png" x="0" y="0" width="8" height="8" preserveAspectRatio="xMidYMid slice">
                  <animate attributeName="y" from="0" to="-8" dur="12s" repeatCount="indefinite" />
                </image>
              </pattern>
              <filter id="lavaGlowEdit" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="0.3" result="blur" />
                <feColorMatrix in="blur" type="matrix" values="1.2 0 0 0 0.1  0 0.3 0 0 0  0 0 0.1 0 0  0 0 0 0.9 0" result="glow" />
                <feMerge>
                  <feMergeNode in="glow" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="lavaSoftEdit" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="0.15" result="softEdge" />
                <feComposite in="SourceGraphic" in2="softEdge" operator="in" />
              </filter>
            </defs>
            {editLandmarks.map((lm, idx) => {
              if (!lm.points || lm.points.length < 2) return null;
              const d = lm.points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ');
              if (lm.type === 'lava') {
                const w = lm.width || 1;
                return (
                  <g key={`elm_${idx}`} filter="url(#lavaGlowEdit)">
                    <path d={d} fill="none" stroke="rgba(180,40,0,0.7)" strokeWidth={w + 0.4} strokeLinecap="round" strokeLinejoin="round" />
                    <path d={d} fill="none" stroke="url(#lavaTextureEdit)" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" style={{ animation: `lavaPulse ${3 + idx}s ease-in-out infinite` }} />
                    <path d={d} fill="none" stroke="rgba(255,160,30,0.5)" strokeWidth={w * 0.5} strokeLinecap="round" strokeLinejoin="round" style={{ animation: `lavaPulse ${2 + idx * 0.5}s ease-in-out infinite alternate` }} />
                    <path d={d} fill="none" stroke="rgba(255,230,80,0.25)" strokeWidth={w * 0.2} strokeLinecap="round" strokeLinejoin="round" style={{ animation: `lavaPulse ${1.5 + idx * 0.3}s ease-in-out infinite` }} />
                  </g>
                );
              }
              const w = lm.width || 1;
              const pts = lm.points || [];
              return (
                <g key={`elm_${idx}`}>
                  <path d={d} fill="none" stroke="rgba(200,230,255,0.06)" strokeWidth={w + 1.2} strokeLinecap="round" strokeLinejoin="round" />
                  <path d={d} fill="none" stroke={lm.color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 4px ${lm.color})` }} />
                </g>
              );
            })}
            {editRoutes.map((road, roadIdx) => {
              if (!road.points || road.points.length < 2) return null;
              const w = road.width || 2.5;
              const d = road.points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
              return (
                <g key={`road_${roadIdx}`}>
                  <path d={d} fill="none" stroke="rgba(160,140,100,0.08)" strokeWidth={w + 0.6} strokeLinecap="round" strokeLinejoin="round" />
                  <path d={d} fill="none" stroke="rgba(180,160,110,0.18)" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
                  <path d={d} fill="none" stroke="rgba(210,190,140,0.12)" strokeWidth={w * 0.4} strokeLinecap="round" strokeLinejoin="round" />
                  {markerMode && <text x={road.points[0].x} y={road.points[0].y - (w / 2 + 0.5)} fill="rgba(180,160,120,0.7)" fontSize="0.9" textAnchor="middle">{roadIdx + 1}</text>}
                </g>
              );
            })}
            {routePoints.length > 0 && (
              <g>
                <polyline points={routePoints.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="rgba(251,191,36,0.35)" strokeWidth={roadWidth} strokeLinecap="round" strokeLinejoin="round" />
                <polyline points={routePoints.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="rgba(251,191,36,0.15)" strokeWidth={roadWidth + 0.6} strokeLinecap="round" strokeLinejoin="round" />
              </g>
            )}
            {landmarkPoints.length > 0 && (
              <g>
                <polyline points={landmarkPoints.map(p => `${p[0]},${p[1]}`).join(' ')} fill="none"
                  stroke={drawingLandmark === 'river' ? 'rgba(56,189,248,0.7)' : 'rgba(251,146,60,0.7)'}
                  strokeWidth={0.4} strokeLinecap="round" />
                {landmarkPoints.map((p, i) => (
                  <circle key={i} cx={p[0]} cy={p[1]} r={0.5}
                    fill={drawingLandmark === 'river' ? 'rgba(56,189,248,0.8)' : 'rgba(251,146,60,0.8)'}
                    stroke="#fff" strokeWidth={0.15} />
                ))}
              </g>
            )}
          </svg>
        )}

        {editEffects.map(eff => {
          const effScale = Math.max(0.4, 1 / camZoom);
          return (
            <div key={eff.id} style={{
              position: 'absolute',
              left: `${eff.x}%`, top: `${eff.y}%`,
              transform: `translate(-50%, -50%) scale(${effScale})`,
              pointerEvents: 'none', zIndex: MAP_LAYERS.EFFECTS,
            }}>
              <div style={{
                width: eff.size * 10 || 30, height: eff.size * 10 || 30,
                borderRadius: '50%',
                background: eff.type === 'portal' ? `conic-gradient(from 0deg, ${eff.color}00, ${eff.color}88, ${eff.color}00, ${eff.color}44, ${eff.color}00)`
                  : eff.type === 'swirl' ? `radial-gradient(circle, ${eff.color}66, ${eff.color}00)`
                  : eff.type === 'fire' ? `radial-gradient(circle, ${eff.color}88, ${eff.color}44, transparent)`
                  : eff.type === 'sparkle' ? `radial-gradient(circle, ${eff.color}aa, ${eff.color}00)`
                  : eff.type === 'smoke' ? `radial-gradient(circle, ${eff.color}44, transparent)`
                  : `radial-gradient(circle, ${eff.color}66, ${eff.color}22, transparent)`,
                animation: eff.type === 'portal' ? 'portalSpin 3s linear infinite'
                  : eff.type === 'swirl' ? 'portalSpin 4s linear infinite'
                  : 'pulse 2s ease-in-out infinite',
                boxShadow: `0 0 12px ${eff.color}40`,
              }} />
              {markerMode && <div style={{
                position: 'absolute', bottom: -12, left: '50%', transform: 'translateX(-50%)',
                fontSize: '0.45rem', color: eff.color, whiteSpace: 'nowrap', fontWeight: 600, opacity: 0.7,
              }}>{eff.type}</div>}
            </div>
          );
        })}

        {locations.map((loc) => {
          const pos = getNodePos(loc.id);
          if (!pos) return null;
          const isUnlocked = loc.unlocked || (loc.unlockLevel && level >= loc.unlockLevel) || devUnlocked[loc.id];
          const cleared = locationsCleared.includes(loc.id);
          const icon = locationIcons[loc.id];
          const isSelected = selectedLocation === loc.id;
          const isDevDragging = devDragging === loc.id;
          const conquer = (zoneConquer || {})[loc.id] || 0;
          const isConquered = conquer >= 100;
          const circumference = 2 * Math.PI * 26;
          const strokeDash = (conquer / 100) * circumference;
          const ns = calcNodeScale(camZoom);

          return (
            <div key={loc.id}
              onClick={(e) => handleLocationClick(e, loc)}
              onContextMenu={(e) => handleNodeRightClick(e, loc)}
              onMouseEnter={() => { if (!selectedLocation && !selectedCity && !selectedEvent) setHoveredNode({ type: 'location', id: loc.id, x: pos.x, y: pos.y }); }}
              onMouseLeave={() => setHoveredNode(null)}
              style={mapNodeStyle(pos, ns, isSelected ? MAP_LAYERS.SELECTED : MAP_LAYERS.NODES, {
                cursor: isUnlocked ? 'pointer' : 'not-allowed',
                transition: 'transform 0.3s',
              })}
            >
              <div style={{ position: 'relative', width: 42, height: 42 }}>
                {isUnlocked && portalLocations.includes(loc.id) && (
                  <>
                    <div style={{
                      position: 'absolute', inset: -8,
                      borderRadius: '50%',
                      background: `conic-gradient(from 0deg, ${icon.color}00, ${icon.color}44, ${icon.color}00, ${icon.color}22, ${icon.color}00)`,
                      animation: 'portalSpin 4s linear infinite',
                      opacity: 0.6,
                      pointerEvents: 'none',
                    }} />
                    <div style={{
                      position: 'absolute', inset: -5,
                      borderRadius: '50%',
                      background: `conic-gradient(from 180deg, ${icon.color}00, ${icon.color}66, ${icon.color}00, ${icon.color}44, ${icon.color}00)`,
                      animation: 'portalSpin 3s linear infinite reverse',
                      opacity: 0.5,
                      pointerEvents: 'none',
                    }} />
                    <div style={{
                      position: 'absolute', inset: -3,
                      borderRadius: '50%',
                      border: `1.5px solid ${icon.color}88`,
                      boxShadow: `0 0 8px ${icon.color}44, inset 0 0 8px ${icon.color}22`,
                      pointerEvents: 'none',
                      animation: 'portalPulseGlow 2s ease-in-out infinite',
                    }} />
                    <div style={{
                      position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)',
                      fontSize: '0.5rem', fontWeight: 700, color: icon.color,
                      textShadow: `0 0 6px ${icon.color}`, whiteSpace: 'nowrap',
                      pointerEvents: 'none', opacity: 0.8,
                      letterSpacing: '0.05em',
                    }}>
                      PORTAL
                    </div>
                  </>
                )}
                {(() => {
                  const hasBossActive = isUnlocked && loc.boss && !bossesDefeated.includes(loc.boss);
                  const isHovered = hoveredNode?.type === 'location' && hoveredNode?.id === loc.id;
                  return (
                    <div style={{
                      width: 42, height: 42,
                      borderRadius: '50%',
                      overflow: 'hidden',
                      border: `2px solid ${isUnlocked ? (hasBossActive ? (isHovered ? icon.color + '80' : '#cc0000') : isConquered ? 'var(--gold)' : cleared ? 'var(--gold)' : isSelected ? '#fff' : icon.color + '80') : 'rgba(80,80,100,0.4)'}`,
                      opacity: isUnlocked ? 1 : 0.4,
                      boxShadow: isSelected
                        ? `0 0 20px ${icon.glow}, 0 0 40px ${icon.glow}`
                        : hasBossActive && !isHovered
                          ? '0 0 12px rgba(200,0,0,0.7), 0 0 24px rgba(200,0,0,0.4)'
                          : isUnlocked
                            ? `0 0 8px ${icon.glow}`
                            : 'none',
                      transition: 'all 0.3s',
                      animation: isSelected ? 'pulse 1.5s infinite' : hasBossActive && !isHovered ? 'bossNodePulse 2s ease-in-out infinite' : 'none',
                      position: 'relative',
                    }}>
                      {isUnlocked && icon.img ? (() => {
                        const showOverlay = hasBossActive || isConquered;
                        const overlayImg = hasBossActive ? '/images/bosslogo.png' : '/images/conquered_logo.png';
                        return (<>
                          <img src={showOverlay ? overlayImg : icon.img} alt={loc.name} style={{
                            width: '100%', height: '100%', objectFit: 'cover',
                            filter: !showOverlay && cleared ? 'saturate(0.7) brightness(0.8)' : 'none',
                            position: 'absolute', top: 0, left: 0,
                            opacity: showOverlay && isHovered ? 0 : 1,
                            transition: 'opacity 0.35s ease-in-out',
                          }} />
                          {showOverlay && (
                            <img src={icon.img} alt={loc.name} style={{
                              width: '100%', height: '100%', objectFit: 'cover',
                              position: 'absolute', top: 0, left: 0,
                              opacity: isHovered ? 1 : 0,
                              transition: 'opacity 0.35s ease-in-out',
                            }} />
                          )}
                        </>);
                      })() : (
                        <div style={{
                          width: '100%', height: '100%',
                          background: 'rgba(30,30,50,0.8)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '1.2rem',
                        }}><InlineIcon name="lock" size={12} /></div>
                      )}
                    </div>
                  );
                })()}
                {isUnlocked && conquer > 0 && (
                  <div style={{
                    position: 'absolute', bottom: -4, left: 4, right: 4,
                    height: 4, borderRadius: 2,
                    background: 'rgba(0,0,0,0.5)',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${conquer}%`, height: '100%',
                      background: isConquered ? 'var(--gold)' : icon.color,
                      borderRadius: 2,
                      boxShadow: isConquered ? '0 0 6px rgba(255,215,0,0.6)' : 'none',
                      transition: 'width 0.5s',
                    }} />
                  </div>
                )}
                {isUnlocked && conquer > 0 && (
                  <div style={{
                    position: 'absolute', top: -5, right: -5,
                    background: isConquered ? 'var(--gold)' : 'rgba(14,22,48,0.95)',
                    border: `1px solid ${isConquered ? 'var(--gold)' : icon.color}`,
                    borderRadius: 6, padding: '1px 4px',
                    fontSize: '0.5rem', fontWeight: 700,
                    color: isConquered ? '#000' : icon.color,
                    whiteSpace: 'nowrap',
                    boxShadow: isConquered ? '0 0 8px rgba(255,215,0,0.5)' : 'none',
                  }}>
                    {Math.floor(conquer)}%
                  </div>
                )}
              </div>
              {isConquered && (
                <div style={{
                  position: 'absolute', top: -2, right: -22,
                  width: 32, height: 32, overflow: 'hidden',
                  imageRendering: 'pixelated',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))',
                }}>
                  <div style={{
                    width: 256, height: 32,
                    backgroundImage: 'url(/sprites/idle_worker.png)',
                    backgroundSize: '256px 32px',
                    imageRendering: 'pixelated',
                    animation: 'workerIdle 1.6s steps(8) infinite',
                  }} />
                </div>
              )}
              <div style={{
                position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                marginTop: 4, whiteSpace: 'nowrap', textAlign: 'center',
              }}>
                <div className="font-cinzel" style={{
                  fontSize: '0.65rem', fontWeight: 700,
                  color: isUnlocked ? (isConquered ? 'var(--gold)' : cleared ? 'var(--gold)' : '#fff') : 'rgba(150,150,170,0.5)',
                  textShadow: '0 1px 4px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.7)',
                }}>
                  {loc.name}
                </div>
                {isUnlocked && (
                  <div style={{
                    fontSize: '0.55rem', color: icon.color,
                    textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                  }}>
                    Lv.{loc.levelRange[0]}-{loc.levelRange[1]}
                    {loc.boss && !bossesDefeated.includes(loc.boss) && ' ⚠'}
                    {cleared && ' ✓'}
                  </div>
                )}
                {!isUnlocked && loc.unlockLevel && (
                  <div style={{
                    fontSize: '0.5rem', color: 'rgba(150,150,170,0.4)',
                    textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                  }}>
                    Lv.{loc.unlockLevel}
                  </div>
                )}
              </div>
            </div>
          );
        })}


        {cities.map((city) => {
          const pos = getNodePos(city.id);
          if (!pos) return null;
          const bossOk = !city.unlockBoss || bossesDefeated.includes(city.unlockBoss);
          const isCityUnlocked = city.unlocked || (bossOk && city.unlockLevel && level >= city.unlockLevel) || devUnlocked[city.id];
          const isSelected = selectedCity === city.id;
          const cs = calcNodeScale(camZoom);
          const isCityDragging = devDragging === city.id;

          return (
            <div key={city.id}
              onClick={(e) => handleCityClick(e, city)}
              onContextMenu={(e) => handleNodeRightClick(e, city)}
              onMouseEnter={() => { if (!selectedLocation && !selectedCity && !selectedEvent) setHoveredNode({ type: 'city', id: city.id, x: pos.x, y: pos.y, name: city.name }); }}
              onMouseLeave={() => setHoveredNode(null)}
              style={mapNodeStyle(pos, cs, isCityDragging ? MAP_LAYERS.DEV_DRAGGING : isSelected ? MAP_LAYERS.SELECTED : MAP_LAYERS.CITIES, {
                cursor: isCityDragging ? 'grabbing' : isCityUnlocked ? 'pointer' : 'not-allowed',
                transition: isCityDragging ? 'none' : 'transform 0.3s',
              })}
            >
              <div style={{ position: 'relative', width: 44, height: 44 }}>
                <div style={{
                  width: 40, height: 40, margin: '2px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  background: isCityUnlocked
                    ? 'radial-gradient(circle, rgba(74,222,128,0.25), rgba(20,26,43,0.9))'
                    : 'rgba(30,30,50,0.8)',
                  border: `3px solid ${isCityUnlocked ? (isSelected ? '#fff' : '#4ade80') : 'rgba(80,80,100,0.4)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: isCityUnlocked ? '1.1rem' : '0.8rem',
                  opacity: isCityUnlocked ? 1 : 0.4,
                  boxShadow: isSelected
                    ? '0 0 20px rgba(74,222,128,0.5), 0 0 40px rgba(74,222,128,0.3)'
                    : isCityUnlocked
                      ? '0 0 10px rgba(74,222,128,0.3)'
                      : 'none',
                  transition: 'all 0.3s',
                  animation: isSelected ? 'pulse 1.5s infinite' : (isCityUnlocked ? 'glow 3s infinite' : 'none'),
                }}>
                  {isCityUnlocked ? (
                    <img src="/images/conquered_logo.png" alt={city.name} style={{
                      width: '100%', height: '100%', objectFit: 'cover',
                    }} />
                  ) : <InlineIcon name="lock" size={12} />}
                </div>
              </div>
              <div style={{
                position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                marginTop: 4, whiteSpace: 'nowrap', textAlign: 'center',
              }}>
                <div className="font-cinzel" style={{
                  fontSize: '0.65rem', fontWeight: 700,
                  color: isCityUnlocked ? '#4ade80' : 'rgba(150,150,170,0.5)',
                  textShadow: '0 1px 4px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.7)',
                }}>
                  {city.name}
                </div>
                {isCityUnlocked && (
                  <div style={{ fontSize: '0.5rem', color: 'rgba(74,222,128,0.7)', textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>
                    City
                  </div>
                )}
                {!isCityUnlocked && (city.unlockLevel || city.unlockBoss) && (
                  <div style={{ fontSize: '0.45rem', color: 'rgba(150,150,170,0.4)', textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>
                    {city.unlockBoss ? <><InlineIcon name="lock" size={12} /> Boss</> : `Lv.${city.unlockLevel}`}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {(() => {
          const baseZonePos = getNodePos(currentZone) || locationPositions.verdant_plains;
          const zonePos = isPathing ? heroPos : baseZonePos;
          const activeHeroes = heroRoster.filter(h => activeHeroIds.includes(h.id));
          const heroScale = calcNodeScale(camZoom, 0.35);
          const mapSpriteScale = 1.2;
          const baseFrame = 100;
          const spriteW = baseFrame * mapSpriteScale;
          const spriteH = baseFrame * mapSpriteScale;
          const footCrop = 0.82;
          const visibleH = Math.round(spriteH * footCrop);
          const heroCount = activeHeroes.length;
          const containerW = heroCount * (spriteW * 0.4) + spriteW * 0.6;
          const containerH = visibleH + 20;
          const hitOffsetX = 0;
          const hitOffsetY = -10 * mapSpriteScale;
          const hitAnchorX = containerW / 2 + hitOffsetX;
          const hitAnchorY = visibleH / 2 + hitOffsetY;
          return (
            <div style={{
              position: 'absolute',
              left: `${zonePos.x}%`,
              top: `${zonePos.y}%`,
              width: containerW,
              height: containerH,
              transform: `translate(-${hitAnchorX}px, -${hitAnchorY}px) scale(${heroScale})`,
              zIndex: MAP_LAYERS.HERO,
              transition: 'transform 0.3s',
              pointerEvents: 'none',
            }}>
              {activeHeroes.map((hero, idx) => {
                const walk = heroWalking[hero.id];
                const isWalking = walk?.moving;
                const flipX = walk?.flipX;
                const offset = wanderOffsets[hero.id] || { x: 0, y: 0 };
                const wanderX = offset.x * 3;
                const wanderY = offset.y * 2;
                const baseX = idx * (spriteW * 0.4);
                const heroSpriteData = getPlayerSprite(hero.classId, hero.raceId);
                const heroFrameW = (heroSpriteData?.frameWidth || 100) * mapSpriteScale;
                const heroFrameH = (heroSpriteData?.frameHeight || 100) * mapSpriteScale;
                const heroVisH = Math.round(heroFrameH * footCrop);
                return (
                  <div key={hero.id} style={{
                    position: 'absolute',
                    left: baseX + wanderX,
                    top: wanderY + (visibleH - heroVisH),
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    transition: isPathing ? 'none' : 'left 1.5s ease-in-out, top 1.5s ease-in-out',
                  }}>
                    <div style={{
                      position: 'relative',
                      width: heroFrameW, height: heroVisH,
                    }}>
                      <div style={{
                        position: 'absolute',
                        bottom: -1, left: '50%', transform: 'translateX(-50%)',
                        width: 30, height: 5, borderRadius: '50%',
                        background: 'radial-gradient(ellipse, rgba(0,0,0,0.55), transparent)',
                        zIndex: 1,
                      }} />
                      <div style={{ position: 'relative', zIndex: 2, width: heroFrameW, height: heroVisH, overflow: 'hidden' }}>
                        <SpriteAnimation
                          spriteData={heroSpriteData}
                          animation={isWalking ? 'walk' : 'idle'}
                          flip={isWalking && flipX}
                          scale={mapSpriteScale}
                          speed={isWalking ? 100 : (150 + idx * 30)}
                          equipmentOverlays={buildEquipmentOverlays(hero, TIERS)}
                        />
                      </div>
                    </div>
                    <div style={{
                      textAlign: 'center',
                      fontSize: '0.55rem', color: 'var(--accent)', fontWeight: 700, whiteSpace: 'nowrap',
                      textShadow: '0 1px 4px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.5)', marginTop: -2,
                    }}>{hero.name}</div>
                  </div>
                );
              })}

            </div>
          );
        })()}

        {currentDialogue && dialoguePhase > 0 && (() => {
          const baseZonePos2 = getNodePos(currentZone) || locationPositions.verdant_plains;
          const zonePos2 = isPathing ? heroPos : baseZonePos2;
          const activeHeroes2 = heroRoster.filter(h => activeHeroIds.includes(h.id));
          const heroSpriteMap = {};
          const speakerPositions = {};
          const mapSpriteScale2 = 1.2;
          const heroScale2 = calcNodeScale(camZoom, 0.35);
          const baseFrame2 = 100;
          const spriteW2 = baseFrame2 * mapSpriteScale2;
          const spriteH2 = baseFrame2 * mapSpriteScale2;
          const footCrop2 = 0.82;
          const visibleH2 = Math.round(spriteH2 * footCrop2);
          const heroCount2 = activeHeroes2.length;
          const containerW2 = heroCount2 * (spriteW2 * 0.4) + spriteW2 * 0.6;
          const hitOffsetX2 = 0;
          const hitOffsetY2 = -10 * mapSpriteScale2;
          const hitAnchorX2 = containerW2 / 2 + hitOffsetX2;
          const hitAnchorY2 = visibleH2 / 2 + hitOffsetY2;

          activeHeroes2.forEach((h, idx) => {
            heroSpriteMap[h.id] = getPlayerSprite(h.classId, h.raceId);
            const offset = wanderOffsets[h.id] || { x: 0, y: 0 };
            const heroSpriteData = getPlayerSprite(h.classId, h.raceId);
            const heroFrameW = (heroSpriteData?.frameWidth || 100) * mapSpriteScale2;
            speakerPositions[h.id] = {
              x: idx * (spriteW2 * 0.4) + offset.x * 3 + heroFrameW / 2,
              y: 0,
            };
          });

          return (
            <div style={{
              position: 'absolute',
              left: `${zonePos2.x}%`,
              top: `${zonePos2.y}%`,
              width: containerW2,
              height: 0,
              transform: `translate(-${hitAnchorX2}px, -${hitAnchorY2}px) scale(${heroScale2})`,
              zIndex: 9999,
              pointerEvents: 'none',
            }}>
              <ChatBubbleSystem
                dialogue={currentDialogue}
                phase={dialoguePhase}
                heroSprites={heroSpriteMap}
                speakerPositions={speakerPositions}
                onDismiss={() => { setDialoguePhase(0); setTimeout(() => setCurrentDialogue(null), 300); }}
                camZoom={camZoom}
              />
            </div>
          );
        })()}

        {hoveredNode && (() => {
          if (hoveredNode.type === 'location') {
            const loc = locations.find(l => l.id === hoveredNode.id);
            if (!loc) return null;
            const conquer = (zoneConquer || {})[loc.id] || 0;
            const hasBoss = loc.boss && !bossesDefeated.includes(loc.boss);
            const bossDown = loc.boss && bossesDefeated.includes(loc.boss);
            return (
              <div style={{
                position: 'absolute',
                left: `${hoveredNode.x}%`, top: `${hoveredNode.y}%`,
                transform: 'translate(-50%, -120%)',
                marginTop: -40,
                zIndex: MAP_LAYERS.HOVER_INFO, pointerEvents: 'none',
                background: 'rgba(8,12,28,0.95)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 8, padding: '8px 12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.7)',
                whiteSpace: 'nowrap',
                animation: 'fadeIn 0.1s ease-out',
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff', marginBottom: 2 }}>{loc.name}</div>
                <div style={{ fontSize: '0.6rem', color: 'var(--muted)' }}>
                  Lv.{loc.levelRange[0]}-{loc.levelRange[1]} · {Math.floor(conquer)}% conquered
                  {conquer >= 100 && <div style={{ color: 'var(--gold)', fontWeight: 700, marginTop: 2 }}>🏆 100% CONQUERED</div>}
                </div>
                {hasBoss && <div style={{ fontSize: '0.55rem', color: '#ef4444', marginTop: 2 }}>⚠ Boss Active</div>}
                {bossDown && <div style={{ fontSize: '0.55rem', color: '#22c55e', marginTop: 2 }}>✅ Boss Defeated</div>}
              </div>
            );
          }
          if (hoveredNode.type === 'city') {
            return (
              <div style={{
                position: 'absolute',
                left: `${hoveredNode.x}%`, top: `${hoveredNode.y}%`,
                transform: 'translate(-50%, -120%)',
                marginTop: -40,
                zIndex: MAP_LAYERS.HOVER_INFO, pointerEvents: 'none',
                background: 'rgba(8,12,28,0.95)',
                border: '1px solid rgba(74,222,128,0.3)',
                borderRadius: 8, padding: '8px 12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.7)',
                whiteSpace: 'nowrap',
                animation: 'fadeIn 0.1s ease-out',
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4ade80' }}>{hoveredNode.name}</div>
                <div style={{ fontSize: '0.6rem', color: 'var(--muted)' }}>City</div>
              </div>
            );
          }
          return null;
        })()}

        {/* Chat bubbles are now rendered inside the hero container below */}

        {(randomEvents || []).map(event => {
          const pos = locationPositions[event.locationId];
          if (!pos) return null;
          const timeLeft = Math.max(0, Math.floor((event.expiresAt - Date.now()) / 1000));
          const minutes = Math.floor(timeLeft / 60);
          const seconds = timeLeft % 60;
          const spriteData = getEnemySprite(event.mapSprite || 'skeleton');
          const count = event.enemyCount || 1;
          const eventScale = Math.max(0.3, 1 / camZoom);
          const evSpriteScale = 0.8;
          const evFrameW = (spriteData?.frameWidth || 100) * evSpriteScale;
          const evFrameH = (spriteData?.frameHeight || 100) * evSpriteScale;
          const spriteVisH = Math.round(evFrameH * 0.82);
          const spriteOffsets = count === 1
            ? [{ x: 0, y: 0 }]
            : count === 2
              ? [{ x: -14, y: 0 }, { x: 14, y: 4 }]
              : [{ x: -20, y: 0 }, { x: 0, y: -6 }, { x: 20, y: 4 }];

          return (
            <div key={event.id}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedEvent(event);
                setSelectedLocation(null);
                setSelectedCity(null);
                setCitySubmenu(null);
              }}
              style={{
                position: 'absolute',
                left: `${pos.x + 5}%`, top: `${pos.y - 2}%`,
                transform: `translate(-50%, -100%) scale(${eventScale})`,
                zIndex: MAP_LAYERS.EVENTS, cursor: 'pointer',
                transition: 'transform 0.3s',
              }}
            >
              <div style={{
                position: 'relative',
                width: count === 1 ? evFrameW : (count === 2 ? evFrameW + 28 : evFrameW + 40),
                height: spriteVisH + 10,
                display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
              }}>
                <div style={{
                  position: 'absolute', inset: -8,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${event.color}30, transparent 70%)`,
                  animation: 'eventPulse 1.5s ease-in-out infinite',
                  pointerEvents: 'none',
                }} />
                {spriteOffsets.map((off, i) => (
                  <div key={i} style={{
                    position: 'absolute',
                    left: '50%', bottom: 0,
                    transform: `translateX(calc(-50% + ${off.x}px)) translateY(${off.y}px)`,
                    width: evFrameW, height: spriteVisH,
                    overflow: 'hidden',
                    imageRendering: 'pixelated',
                    filter: `drop-shadow(0 2px 4px rgba(0,0,0,0.8)) hue-rotate(340deg) saturate(2) brightness(0.7)`,
                    zIndex: i,
                    pointerEvents: 'none',
                  }}>
                    <SpriteAnimation spriteData={spriteData} animation="idle" scale={evSpriteScale} speed={180 + i * 40} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
                <div style={{
                  width: 30 + count * 6, height: 6, borderRadius: '50%',
                  background: `radial-gradient(ellipse, ${event.color}50, transparent)`,
                }} />
                <div style={{
                  textAlign: 'center', whiteSpace: 'nowrap',
                }}>
                  <div style={{
                    fontSize: '0.5rem', fontWeight: 800, color: event.color,
                    textShadow: `0 1px 4px rgba(0,0,0,0.9), 0 0 8px ${event.color}60`,
                    letterSpacing: '0.1em',
                  }}>
                    {event.icon} {event.name}
                  </div>
                  <div style={{
                    fontSize: '0.48rem', color: 'rgba(255,255,255,0.7)',
                    textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {minutes}:{seconds.toString().padStart(2, '0')}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

        {selectedLoc && outerRef.current && createPortal(
          <div ref={menuRef} style={{
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: MAP_LAYERS.POPUPS,
            background: 'linear-gradient(135deg, rgba(14,22,48,0.97), rgba(20,26,43,0.97))',
            border: `2px solid ${locationIcons[selectedLoc.id]?.color || 'var(--accent)'}`,
            borderRadius: 14,
            padding: 0,
            width: 260,
            maxHeight: '70vh', overflowY: 'auto',
            boxShadow: `0 8px 40px rgba(0,0,0,0.8), 0 0 20px ${locationIcons[selectedLoc.id]?.glow || 'rgba(110,231,183,0.2)'}`,
            ...popupPositionStyle(selectedLoc.id),
          }}>
            <div style={{
              padding: '14px 16px 10px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              background: `linear-gradient(135deg, ${locationIcons[selectedLoc.id]?.glow || 'rgba(0,0,0,0.2)'}, transparent)`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <img src={locationIcons[selectedLoc.id]?.img} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: `1px solid ${locationIcons[selectedLoc.id]?.color || 'var(--accent)'}` }} />
                <div>
                  <div className="font-cinzel" style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 700 }}>
                    {selectedLoc.name}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>
                    Level {selectedLoc.levelRange[0]}-{selectedLoc.levelRange[1]}
                    {isCleared && <span style={{ color: 'var(--gold)', marginLeft: 6 }}>Cleared</span>}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--muted)', lineHeight: 1.4 }}>
                {selectedLoc.description}
              </div>
              {(() => {
                const selConquer = (zoneConquer || {})[selectedLoc.id] || 0;
                if (selConquer <= 0) return null;
                const xpMod = Math.floor(selConquer * 0.7);
                const harvestMod = Math.floor((selConquer / 100) * 300);
                return (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                      <span style={{ fontSize: '0.6rem', color: 'var(--muted)' }}>Conquered</span>
                      <span style={{ fontSize: '0.6rem', fontWeight: 700, color: selConquer >= 100 ? 'var(--gold)' : locationIcons[selectedLoc.id]?.color }}>{selConquer}%</span>
                    </div>
                  <div style={{ height: 6, background: 'rgba(0,0,0,0.4)', borderRadius: 3, overflow: 'visible', position: 'relative' }}>
                    <div style={{
                      height: '100%', width: `${selConquer}%`, borderRadius: 3,
                      background: selConquer >= 100
                        ? 'linear-gradient(90deg, var(--gold), #ffed4a)'
                        : `linear-gradient(90deg, ${locationIcons[selectedLoc.id]?.color}, ${locationIcons[selectedLoc.id]?.glow})`,
                      transition: 'width 0.3s',
                      boxShadow: selConquer >= 100 ? '0 0 8px rgba(255,215,0,0.5)' : 'none',
                    }} />
                    {selConquer >= 100 && (
                      <div style={{
                        position: 'absolute', right: -15, top: '50%', transform: 'translateY(-50%)',
                        fontSize: '1rem', animation: 'pulse 1.5s infinite', zIndex: 10
                      }}>✨</div>
                    )}
                  </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                      <span style={{ fontSize: '0.5rem', color: '#ef4444' }}>XP -{xpMod}%</span>
                      <span style={{ fontSize: '0.5rem', color: '#22c55e' }}>Harvest +{harvestMod}%</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div style={{ padding: '6px 8px' }}>
              {(() => {
                const menuItems = [];
                let idx = 1;
                const isConquered = ((zoneConquer || {})[selectedLoc.id] || 0) >= 100;

                menuItems.push({ key: idx++, props: {
                  iconSrc: '/sprites/ui/icons/icon_crossed_swords.png',
                  label: 'Hunt Monsters', sublabel: `Fight Lv.${selectedLoc.levelRange[0]}-${selectedLoc.levelRange[1]} enemies`,
                  color: 'var(--accent)', onClick: () => handleBattle(selectedLoc.id),
                }});

                if (selectedLoc.boss && !bossDefeated) {
                  menuItems.push({ key: idx++, props: {
                    iconSrc: locationIcons[selectedLoc.id]?.img,
                    label: 'Challenge Boss', sublabel: `Defeat the ${selectedLoc.boss.replace(/_/g, ' ')}`,
                    color: '#ef4444', onClick: () => handleBoss(selectedLoc.id, selectedLoc.boss), glow: true,
                  }});
                }

                menuItems.push({ key: idx++, props: {
                  iconSrc: '/backgrounds/trade_day.png',
                  label: 'Rest at Inn', sublabel: `Heal party (${level * 5}g)`,
                  color: '#60a5fa', onClick: handleRest,
                }});

                menuItems.push({ key: idx++, props: {
                  iconSrc: locationIcons[selectedLoc.id]?.img,
                  label: 'Visit Location', sublabel: 'Explore this area',
                  color: '#c084fc', onClick: () => { enterLocation(selectedLoc.id); setSelectedLocation(null); },
                }});

                if (selectedLoc.levelRange && selectedLoc.levelRange[0] >= 8) {
                  menuItems.push({ key: idx++, props: {
                    icon: 'castle', label: 'Enter Dungeon', sublabel: 'Multi-fight challenge',
                    color: '#f97316', onClick: () => {
                      setSelectedLocation(null);
                      useGameStore.getState().startDungeon(selectedLoc.id);
                    },
                  }});
                }

                if (!selectedLoc.isCity) {
                  menuItems.push({ key: idx++, props: {
                    icon: '🌾', label: 'Explore Field', sublabel: 'Roam the open terrain',
                    color: '#6ee7b3', onClick: () => {
                      setSelectedLocation(null);
                      enterScene('field', selectedLoc.id);
                    },
                  }});
                }

                if (isConquered) {
                  menuItems.push({ key: idx++, props: {
                    icon: 'gold', label: 'Trade Goods', sublabel: 'Buy/Sell items here',
                    color: '#fbbf24', onClick: () => setCitySubmenu('trade'),
                  }});
                  menuItems.push({ key: idx++, props: {
                    icon: 'scroll', label: 'Unlock Weapon', sublabel: 'Rare weapon master unlock',
                    color: '#f59e0b', onClick: () => {
                      setGameMessage(`The masters of ${selectedLoc.name} have unlocked a legendary weapon path for you!`);
                    },
                  }});
                }

                return (
                  <>
                    {selectedLoc.boss && bossDefeated && (
                      <div style={{
                        padding: '6px 10px', margin: '4px 0', borderRadius: 8,
                        background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
                        color: 'var(--success)', fontSize: '0.7rem', textAlign: 'center',
                        fontFamily: "'Cinzel', serif", fontWeight: 600,
                      }}>Boss Defeated</div>
                    )}
                    {menuItems.map(item => (
                      <MenuButton key={item.key} {...item.props} hotkey={item.key} />
                    ))}
                  </>
                );
              })()}
            </div>

            <div style={{
              padding: '5px 16px 8px', borderTop: '1px solid rgba(255,255,255,0.05)',
              textAlign: 'center',
            }}>
              <span style={{ fontSize: '0.5rem', color: 'rgba(150,150,170,0.3)', fontFamily: "'Cinzel', serif" }}>
                Press 1-{selectedLoc?.boss && !bossDefeated ? '4' : '3'} &bull; Esc to close
              </span>
            </div>
          </div>,
          outerRef.current
        )}

        {portalMenu && outerRef.current && createPortal(
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: MAP_LAYERS.POPUPS,
            background: 'linear-gradient(135deg, rgba(10,8,30,0.97), rgba(20,15,45,0.97))',
            border: '2px solid rgba(167,139,250,0.6)',
            borderRadius: 16,
            padding: 0, width: 300,
            boxShadow: '0 8px 40px rgba(0,0,0,0.9), 0 0 40px rgba(167,139,250,0.2)',
            animation: 'fadeIn 0.2s ease-out',
          }}>
            <div style={{
              padding: '16px 20px 12px',
              borderBottom: '1px solid rgba(167,139,250,0.2)',
              background: 'linear-gradient(135deg, rgba(167,139,250,0.1), transparent)',
              borderRadius: '16px 16px 0 0',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.2rem', marginBottom: 4 }}><InlineIcon name="portal" size={16} /></div>
              <div className="font-cinzel" style={{ color: '#a78bfa', fontSize: '1rem', fontWeight: 700 }}>
                Portal Network
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--muted)', marginTop: 2 }}>
                Fast travel to another portal
              </div>
            </div>
            <div style={{ padding: '8px 12px' }}>
              {portalLocations.filter(p => p !== portalMenu).map(destId => {
                const destLoc = locations.find(l => l.id === destId);
                const destUnlocked = destLoc && (destLoc.unlocked || (destLoc.unlockLevel && level >= destLoc.unlockLevel) || devUnlocked[destId]);
                const destIcon = locationIcons[destId];
                return (
                  <button key={destId} onClick={() => {
                    if (!destUnlocked) return;
                    setPortalTransition(true);
                    setPortalMenu(null);
                    setSelectedLocation(null);
                    setTimeout(() => {
                      const target = getNodePos(destId);
                      if (target) {
                        setHeroPos(target);
                        setCurrentZone(destId);
                        const camTarget = { x: -(target.x - 50), y: -(target.y - 50) };
                        const maxPan = Math.max(0, 50 - 50 / camZoom);
                        setCamPos({
                          x: Math.max(-maxPan, Math.min(maxPan, camTarget.x)),
                          y: Math.max(-maxPan, Math.min(maxPan, camTarget.y)),
                        });
                      }
                      setTimeout(() => setPortalTransition(false), 600);
                    }, 400);
                  }} disabled={!destUnlocked} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    width: '100%', padding: '10px 14px', margin: '4px 0',
                    background: destUnlocked ? 'rgba(167,139,250,0.06)' : 'rgba(40,40,60,0.3)',
                    border: `1px solid ${destUnlocked ? 'rgba(167,139,250,0.2)' : 'rgba(80,80,100,0.2)'}`,
                    borderRadius: 10, cursor: destUnlocked ? 'pointer' : 'not-allowed',
                    color: destUnlocked ? '#fff' : 'rgba(150,150,170,0.4)',
                    fontSize: '0.8rem', fontWeight: 600, textAlign: 'left',
                    transition: 'all 0.15s',
                    opacity: destUnlocked ? 1 : 0.5,
                  }}
                  onMouseEnter={e => { if (destUnlocked) { e.currentTarget.style.background = 'rgba(167,139,250,0.15)'; e.currentTarget.style.borderColor = '#a78bfa'; }}}
                  onMouseLeave={e => { if (destUnlocked) { e.currentTarget.style.background = 'rgba(167,139,250,0.06)'; e.currentTarget.style.borderColor = 'rgba(167,139,250,0.2)'; }}}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', overflow: 'hidden',
                      border: `2px solid ${destIcon?.color || '#a78bfa'}`,
                      boxShadow: `0 0 8px ${destIcon?.glow || 'rgba(167,139,250,0.3)'}`,
                      flexShrink: 0,
                    }}>
                      {destIcon?.img && <img src={destIcon.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </div>
                    <div>
                      <div style={{ color: destUnlocked ? (destIcon?.color || '#a78bfa') : 'rgba(150,150,170,0.4)' }}>
                        {destLoc?.name || destId.replace(/_/g, ' ')}
                      </div>
                      <div style={{ fontSize: '0.55rem', color: 'var(--muted)', fontWeight: 400 }}>
                        {destUnlocked ? `Lv.${destLoc?.levelRange?.[0]}-${destLoc?.levelRange?.[1]}` : <><InlineIcon name="lock" size={12} /> Locked</>}
                      </div>
                    </div>
                    {destUnlocked && <div style={{ marginLeft: 'auto', fontSize: '0.9rem', opacity: 0.6 }}><InlineIcon name="portal" size={16} /></div>}
                  </button>
                );
              })}
            </div>
            <div style={{
              padding: '8px 16px 12px', borderTop: '1px solid rgba(167,139,250,0.1)',
              textAlign: 'center',
            }}>
              <button onClick={() => setPortalMenu(null)} style={{
                padding: '6px 20px', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                color: 'var(--muted)', cursor: 'pointer', fontSize: '0.7rem',
              }}>Close</button>
            </div>
          </div>,
          outerRef.current
        )}

        {portalTransition && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: MAP_LAYERS.BATTLE_OVERLAY,
            background: 'radial-gradient(circle, rgba(167,139,250,0.3), rgba(0,0,0,0.95))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'portalTeleport 1s ease-in-out',
            pointerEvents: 'none',
          }}>
            <div style={{
              width: 120, height: 120, borderRadius: '50%',
              background: 'conic-gradient(from 0deg, #a78bfa00, #a78bfa88, #a78bfa00, #a78bfa44, #a78bfa00)',
              animation: 'portalSpin 0.5s linear infinite',
              boxShadow: '0 0 60px rgba(167,139,250,0.5), inset 0 0 40px rgba(167,139,250,0.3)',
            }} />
          </div>
        )}

        {selectedCity && outerRef.current && (() => {
          const city = cities.find(c => c.id === selectedCity);
          if (!city) return null;

          const cityMissions = missionTemplates.filter(m => m.cityId === city.id && level >= m.levelRange[0]);
          const cityArenas = arenaTemplates.filter(a => a.cityId === city.id && level >= a.levelRange[0]);

          return createPortal(
            <div ref={menuRef} style={{
              position: 'absolute',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: MAP_LAYERS.POPUPS,
              background: 'linear-gradient(135deg, rgba(14,22,48,0.97), rgba(20,26,43,0.97))',
              border: '2px solid #4ade80',
              borderRadius: 14,
              padding: 0,
              width: 280,
              maxHeight: '70vh', overflowY: 'auto',
              boxShadow: '0 8px 40px rgba(0,0,0,0.8), 0 0 20px rgba(74,222,128,0.3)',
              ...popupPositionStyle(city.id),
            }}>
              <div style={{
                padding: '14px 16px 10px',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                background: 'linear-gradient(135deg, rgba(74,222,128,0.15), transparent)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: '1.4rem' }}>{city.icon}</span>
                  <div>
                    <div className="font-cinzel" style={{ color: '#4ade80', fontSize: '0.95rem', fontWeight: 700 }}>
                      {city.name}
                    </div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--muted)' }}>City</div>
                  </div>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--muted)', lineHeight: 1.4 }}>
                  {city.description}
                </div>
              </div>

              {!citySubmenu && (
                <div style={{ padding: '8px' }}>
                  <MenuButton
                    icon="🏟️" label="Arena" sublabel={`${cityArenas.length} challenge${cityArenas.length !== 1 ? 's' : ''} available`}
                    color="#f97316" onClick={() => setCitySubmenu('arena')}
                    disabled={cityArenas.length === 0}
                  />
                  <MenuButton
                    icon="scroll" label="Missions" sublabel={`${cityMissions.length} mission${cityMissions.length !== 1 ? 's' : ''} available`}
                    color="#c084fc" onClick={() => setCitySubmenu('missions')}
                    disabled={cityMissions.length === 0}
                  />
                  <MenuButton
                    icon="gold" label="Trading Post" sublabel="Visit the marketplace"
                    color="var(--gold)" onClick={() => {
                      setSelectedCity(null);
                      setCitySubmenu(null);
                      enterScene('trading', 'world');
                    }}
                  />
                  <MenuButton
                    icon="🏨" label="Rest" sublabel={`Heal party (${city.innCost}g)`}
                    color="#60a5fa" onClick={() => {
                      restAtInn(city.innCost);
                      setSelectedCity(null);
                      setCitySubmenu(null);
                    }}
                  />
                  <MenuButton
                    icon="hammer" label="Upgrade" sublabel="Enhance equipment tiers"
                    color="#22d3ee" onClick={() => { setCitySubmenu('upgrade'); setUpgradeHeroId(null); setUpgradeMsg(null); }}
                  />
                </div>
              )}

              {citySubmenu === 'arena' && (
                <div style={{ padding: '8px' }}>
                  <button onClick={() => setCitySubmenu(null)} style={{
                    background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer',
                    fontSize: '0.65rem', padding: '4px 8px', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    ← Back
                  </button>
                  <div className="font-cinzel" style={{ color: '#f97316', fontSize: '0.8rem', fontWeight: 700, padding: '0 8px 6px' }}>
                    Arena Challenges
                  </div>
                  {cityArenas.length === 0 && (
                    <div style={{ padding: '12px', color: 'var(--muted)', fontSize: '0.7rem', textAlign: 'center', fontStyle: 'italic' }}>
                      No challenges available at your level.
                    </div>
                  )}
                  {cityArenas.map(arena => (
                    <div key={arena.id} style={{
                      background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.15)',
                      borderRadius: 8, padding: '10px 12px', marginBottom: 6, cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                      onClick={() => { startArenaBattle(arena.id); setSelectedCity(null); setCitySubmenu(null); }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(249,115,22,0.15)'; e.currentTarget.style.borderColor = '#f97316'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(249,115,22,0.06)'; e.currentTarget.style.borderColor = 'rgba(249,115,22,0.15)'; }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ color: '#f97316', fontWeight: 700, fontSize: '0.75rem' }}>🏟️ {arena.title}</span>
                        <span style={{ color: 'var(--muted)', fontSize: '0.55rem' }}>Lv.{arena.levelRange[0]}-{arena.levelRange[1]}</span>
                      </div>
                      <div style={{ color: 'var(--muted)', fontSize: '0.65rem', marginBottom: 6 }}>{arena.description}</div>
                      <div style={{ display: 'flex', gap: 8, fontSize: '0.55rem' }}>
                        <span style={{ color: 'var(--gold)' }}><InlineIcon name="gold" size={12} /> {arena.rewards.gold}g</span>
                        <span style={{ color: 'var(--accent)' }}><InlineIcon name="sparkle" size={12} /> {arena.rewards.xp} XP</span>
                        <span style={{ color: 'var(--muted)' }}>👹 {arena.enemies.length} enemies</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {citySubmenu === 'missions' && (
                <div style={{ padding: '8px' }}>
                  <button onClick={() => setCitySubmenu(null)} style={{
                    background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer',
                    fontSize: '0.65rem', padding: '4px 8px', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    ← Back
                  </button>
                  <div className="font-cinzel" style={{ color: '#c084fc', fontSize: '0.8rem', fontWeight: 700, padding: '0 8px 6px' }}>
                    Available Missions
                  </div>
                  {cityMissions.length === 0 && (
                    <div style={{ padding: '12px', color: 'var(--muted)', fontSize: '0.7rem', textAlign: 'center', fontStyle: 'italic' }}>
                      No missions available at your level.
                    </div>
                  )}
                  {cityMissions.map(mission => {
                    const isCompleted = (completedMissions || []).includes(mission.id);
                    return (
                      <div key={mission.id} style={{
                        background: isCompleted ? 'rgba(34,197,94,0.06)' : 'rgba(192,132,252,0.06)',
                        border: `1px solid ${isCompleted ? 'rgba(34,197,94,0.2)' : 'rgba(192,132,252,0.15)'}`,
                        borderRadius: 8, padding: '10px 12px', marginBottom: 6, cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                        onClick={() => { startMissionBattle(mission.id); setSelectedCity(null); setCitySubmenu(null); }}
                        onMouseEnter={e => { e.currentTarget.style.background = isCompleted ? 'rgba(34,197,94,0.12)' : 'rgba(192,132,252,0.15)'; e.currentTarget.style.borderColor = isCompleted ? '#22c55e' : '#c084fc'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = isCompleted ? 'rgba(34,197,94,0.06)' : 'rgba(192,132,252,0.06)'; e.currentTarget.style.borderColor = isCompleted ? 'rgba(34,197,94,0.2)' : 'rgba(192,132,252,0.15)'; }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ color: isCompleted ? '#22c55e' : '#c084fc', fontWeight: 700, fontSize: '0.75rem' }}>
                            <InlineIcon name="scroll" size={12} /> {mission.title}
                          </span>
                          {isCompleted && <span style={{ color: '#22c55e', fontSize: '0.55rem', fontWeight: 600 }}>✓ Done</span>}
                        </div>
                        <div style={{ color: 'var(--muted)', fontSize: '0.65rem', marginBottom: 6, lineHeight: 1.3 }}>{mission.description}</div>
                        <div style={{ display: 'flex', gap: 8, fontSize: '0.55rem', flexWrap: 'wrap' }}>
                          <span style={{ color: 'var(--gold)' }}><InlineIcon name="gold" size={12} /> {mission.rewards.gold}g</span>
                          <span style={{ color: 'var(--accent)' }}><InlineIcon name="sparkle" size={12} /> {mission.rewards.xp} XP</span>
                          <span style={{ color: 'var(--muted)' }}><InlineIcon name="battle" size={12} /> {mission.rounds.length} round{mission.rounds.length > 1 ? 's' : ''}</span>
                          <span style={{ color: 'var(--muted)' }}>Lv.{mission.levelRange[0]}-{mission.levelRange[1]}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {citySubmenu === 'upgrade' && (
                <div style={{ padding: '8px' }}>
                  <button onClick={() => { setCitySubmenu(null); setUpgradeHeroId(null); setUpgradeMsg(null); }} style={{
                    background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer',
                    fontSize: '0.65rem', padding: '4px 8px', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    ← Back
                  </button>
                  <div className="font-cinzel" style={{ color: '#22d3ee', fontSize: '0.8rem', fontWeight: 700, padding: '0 8px 6px' }}>
                    Equipment Upgrade
                  </div>

                  {!upgradeHeroId ? (
                    <div>
                      <div style={{ color: 'var(--muted)', fontSize: '0.65rem', padding: '0 8px 8px' }}>
                        Select a hero to upgrade their gear:
                      </div>
                      {heroRoster.map(hero => (
                        <div key={hero.id} style={{
                          background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.15)',
                          borderRadius: 8, padding: '8px 12px', marginBottom: 4, cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                          onClick={() => setUpgradeHeroId(hero.id)}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(34,211,238,0.15)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(34,211,238,0.06)'; }}
                        >
                          <span style={{ color: '#22d3ee', fontWeight: 700, fontSize: '0.75rem' }}>
                            {hero.name}
                          </span>
                          <span style={{ color: 'var(--muted)', fontSize: '0.6rem', marginLeft: 8 }}>
                            Lv.{hero.level} {classDefinitions[hero.classId]?.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div>
                      <button onClick={() => { setUpgradeHeroId(null); setUpgradeMsg(null); }} style={{
                        background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer',
                        fontSize: '0.6rem', padding: '2px 8px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4,
                      }}>
                        ← Heroes
                      </button>
                      {upgradeMsg && (
                        <div style={{
                          background: upgradeMsg.success ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                          border: `1px solid ${upgradeMsg.success ? '#22c55e' : '#ef4444'}`,
                          borderRadius: 6, padding: '6px 10px', marginBottom: 8,
                          color: upgradeMsg.success ? '#22c55e' : '#ef4444', fontSize: '0.65rem',
                        }}>
                          {upgradeMsg.text}
                        </div>
                      )}
                      <div style={{ color: 'var(--gold)', fontSize: '0.65rem', padding: '0 4px 6px' }}>
                        Gold: {gold}g
                      </div>
                      {(() => {
                        const upgradeHero = heroRoster.find(h => h.id === upgradeHeroId);
                        if (!upgradeHero) return null;
                        return EQUIPMENT_SLOTS.map(slot => {
                          const item = (upgradeHero.equipment || {})[slot];
                          if (!item) return (
                            <div key={slot} style={{
                              background: 'rgba(0,0,0,0.2)', borderRadius: 6, padding: '8px 10px', marginBottom: 4,
                              border: '1px solid rgba(255,255,255,0.05)', opacity: 0.5,
                            }}>
                              <span style={{ color: 'var(--muted)', fontSize: '0.65rem', textTransform: 'capitalize' }}>
                                {slot}: Empty
                              </span>
                            </div>
                          );
                          const tierDef = TIERS[item.tier] || TIERS[1];
                          const nextTier = item.tier < 8 ? TIERS[item.tier + 1] : null;
                          const cost = UPGRADE_COSTS[item.tier];
                          const canAfford = cost && gold >= cost;
                          const isMaxTier = item.tier >= 8;
                          return (
                            <div key={slot} style={{
                              background: 'rgba(0,0,0,0.25)', borderRadius: 6, padding: '8px 10px', marginBottom: 4,
                              border: `1px solid ${tierDef.color}30`,
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                <div>
                                  <InlineIcon name={item.icon} size={14} style={{ marginRight: 6 }} />
                                  <span style={{ color: tierDef.color, fontWeight: 700, fontSize: '0.72rem' }}>
                                    {item.name}
                                  </span>
                                  <span style={{
                                    fontSize: '0.6rem', marginLeft: 6, padding: '1px 5px',
                                    background: tierDef.color + '20', color: tierDef.color,
                                    borderRadius: 4, fontWeight: 600,
                                  }}>
                                    T{item.tier || 1}
                                  </span>
                                </div>
                              </div>
                              <div style={{ color: '#22c55e', fontSize: '0.6rem', marginBottom: 4 }}>
                                {Object.entries(item.stats || {}).slice(0, 3).map(([k, v]) => `+${v} ${k}`).join(', ')}
                              </div>
                              {isMaxTier ? (
                                <div style={{ color: '#f472b6', fontSize: '0.6rem', fontWeight: 600 }}>
                                  Max Tier Reached
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    const result = upgradeEquipment(upgradeHeroId, slot);
                                    if (result.success) {
                                      setUpgradeMsg({ success: true, text: `Upgraded to T${result.newTier}! (-${result.cost}g)` });
                                    } else {
                                      setUpgradeMsg({ success: false, text: result.reason });
                                    }
                                  }}
                                  disabled={!canAfford}
                                  style={{
                                    background: canAfford ? 'linear-gradient(135deg, #0891b2, #22d3ee)' : 'rgba(100,100,100,0.3)',
                                    color: canAfford ? '#000' : 'var(--muted)',
                                    border: 'none', borderRadius: 6, padding: '4px 12px',
                                    fontSize: '0.65rem', fontWeight: 700, cursor: canAfford ? 'pointer' : 'not-allowed',
                                    width: '100%',
                                  }}
                                >
                                  Upgrade to T{item.tier + 1} ({cost}g)
                                  {nextTier && <span style={{ opacity: 0.7, marginLeft: 4 }}>→ <span style={{ color: canAfford ? nextTier.color : 'inherit' }}>{nextTier.name}</span></span>}
                                </button>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
                </div>
              )}

              {citySubmenu === 'trade' && (
                <div style={{ padding: '8px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundImage: 'url(/backgrounds/camp_shop.png)',
                    backgroundSize: 'cover', backgroundPosition: 'center',
                    opacity: 0.2, pointerEvents: 'none',
                  }} />
                  <button onClick={() => { setCitySubmenu(null); setTradeTab('buy'); }} style={{
                    background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer',
                    fontSize: '0.65rem', padding: '4px 8px', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4,
                    position: 'relative', zIndex: 1,
                  }}>
                    ← Back
                  </button>
                  <div className="font-cinzel" style={{ color: 'var(--gold)', fontSize: '0.8rem', fontWeight: 700, padding: '0 8px 6px', position: 'relative', zIndex: 1 }}>
                    Merchant
                  </div>
                  <div style={{ color: 'var(--gold)', fontSize: '0.65rem', padding: '0 8px 6px' }}>
                    Gold: {gold}g
                  </div>

                  <div style={{ display: 'flex', gap: 4, padding: '0 8px 8px' }}>
                    <button onClick={() => setTradeTab('buy')} style={{
                      flex: 1, padding: '5px 0', border: 'none', borderRadius: 6, cursor: 'pointer',
                      fontSize: '0.7rem', fontWeight: 700,
                      background: tradeTab === 'buy' ? 'linear-gradient(135deg, #d97706, #f59e0b)' : 'rgba(255,255,255,0.06)',
                      color: tradeTab === 'buy' ? '#000' : 'var(--muted)',
                    }}>Buy</button>
                    <button onClick={() => setTradeTab('sell')} style={{
                      flex: 1, padding: '5px 0', border: 'none', borderRadius: 6, cursor: 'pointer',
                      fontSize: '0.7rem', fontWeight: 700,
                      background: tradeTab === 'sell' ? 'linear-gradient(135deg, #16a34a, #22c55e)' : 'rgba(255,255,255,0.06)',
                      color: tradeTab === 'sell' ? '#000' : 'var(--muted)',
                    }}>Sell</button>
                    <button onClick={() => refreshShop()} style={{
                      padding: '5px 10px', border: 'none', borderRadius: 6, cursor: 'pointer',
                      fontSize: '0.65rem', fontWeight: 600,
                      background: 'rgba(255,255,255,0.06)', color: 'var(--muted)',
                    }}>Refresh</button>
                  </div>

                  <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                    {tradeTab === 'buy' && (
                      <>
                        {shopInventory.length === 0 && (
                          <div style={{ padding: '12px', color: 'var(--muted)', fontSize: '0.7rem', textAlign: 'center', fontStyle: 'italic' }}>
                            The merchant has nothing for sale. Try refreshing.
                          </div>
                        )}
                        {shopInventory.map(item => {
                          const price = getItemPrice(item);
                          const canAfford = gold >= price;
                          const isConsumable = item.slot === 'consumable';
                          const tierDef = isConsumable ? { color: '#4ade80', name: 'Consumable' } : (TIERS[item.tier] || TIERS[1]);
                          return (
                            <div key={item.id} style={{
                              background: isConsumable ? 'rgba(74,222,128,0.06)' : 'rgba(217,119,6,0.06)',
                              border: `1px solid ${isConsumable ? 'rgba(74,222,128,0.15)' : 'rgba(217,119,6,0.15)'}`,
                              borderRadius: 8, padding: '8px 10px', marginBottom: 4,
                              transition: 'all 0.15s',
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: tierDef.color }}>
                                  <InlineIcon name={item.icon} size={12} /> {item.name}
                                </span>
                                {!isConsumable && (
                                  <span style={{ fontSize: '0.55rem', color: tierDef.color, fontWeight: 600 }}>
                                    T{item.tier} {tierDef.name}
                                  </span>
                                )}
                              </div>
                              {isConsumable ? (
                                <div style={{ fontSize: '0.58rem', color: '#86efac', marginBottom: 4 }}>
                                  {item.description}
                                </div>
                              ) : (
                                <>
                                  <div style={{ fontSize: '0.58rem', color: 'var(--muted)', marginBottom: 4, textTransform: 'capitalize' }}>
                                    {item.slot}{item.weaponType ? ` - ${item.weaponType}` : ''}{item.armorType ? ` - ${item.armorType}` : ''}
                                  </div>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 8px', fontSize: '0.55rem', color: '#a5b4fc', marginBottom: 6 }}>
                                    {item.stats && Object.entries(item.stats).map(([k, v]) => (
                                      <span key={k}>+{v} {k.replace(/([A-Z])/g, ' $1').trim()}</span>
                                    ))}
                                  </div>
                                </>
                              )}
                              <button
                                onClick={() => { if (canAfford) buyItem(item.id); }}
                                disabled={!canAfford}
                                style={{
                                  width: '100%', padding: '4px 0', border: 'none', borderRadius: 6, cursor: canAfford ? 'pointer' : 'not-allowed',
                                  fontSize: '0.65rem', fontWeight: 700,
                                  background: canAfford ? 'linear-gradient(135deg, #d97706, #f59e0b)' : 'rgba(100,100,100,0.3)',
                                  color: canAfford ? '#000' : 'var(--muted)',
                                }}
                              >
                                Buy - {price}g
                              </button>
                            </div>
                          );
                        })}
                      </>
                    )}

                    {tradeTab === 'sell' && (
                      <>
                        {inventory.length === 0 && (
                          <div style={{ padding: '12px', color: 'var(--muted)', fontSize: '0.7rem', textAlign: 'center', fontStyle: 'italic' }}>
                            Your inventory is empty.
                          </div>
                        )}
                        {inventory.map(item => {
                          const price = getSellPrice(item);
                          const isConsumable = item.slot === 'consumable';
                          const tierDef = isConsumable ? { color: '#4ade80', name: 'Consumable' } : (TIERS[item.tier] || TIERS[1]);
                          return (
                            <div key={item.id} style={{
                              background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.15)',
                              borderRadius: 8, padding: '8px 10px', marginBottom: 4,
                              transition: 'all 0.15s',
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: tierDef.color }}>
                                  <InlineIcon name={item.icon} size={12} /> {item.name}
                                </span>
                                {!isConsumable && (
                                  <span style={{ fontSize: '0.55rem', color: tierDef.color, fontWeight: 600 }}>
                                    T{item.tier} {tierDef.name}
                                  </span>
                                )}
                              </div>
                              {isConsumable ? (
                                <div style={{ fontSize: '0.58rem', color: '#86efac', marginBottom: 4 }}>
                                  {item.description}
                                </div>
                              ) : (
                                <>
                                  <div style={{ fontSize: '0.58rem', color: 'var(--muted)', marginBottom: 4, textTransform: 'capitalize' }}>
                                    {item.slot}{item.weaponType ? ` - ${item.weaponType}` : ''}{item.armorType ? ` - ${item.armorType}` : ''}
                                  </div>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 8px', fontSize: '0.55rem', color: '#a5b4fc', marginBottom: 6 }}>
                                    {item.stats && Object.entries(item.stats).map(([k, v]) => (
                                      <span key={k}>+{v} {k.replace(/([A-Z])/g, ' $1').trim()}</span>
                                    ))}
                                  </div>
                                </>
                              )}
                              <button
                                onClick={() => sellItem(item.id)}
                                style={{
                                  width: '100%', padding: '4px 0', border: 'none', borderRadius: 6, cursor: 'pointer',
                                  fontSize: '0.65rem', fontWeight: 700,
                                  background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                                  color: '#000',
                                }}
                              >
                                Sell - {price}g
                              </button>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                </div>
              )}

              <div style={{
                padding: '6px 16px 10px', borderTop: '1px solid rgba(255,255,255,0.05)',
                textAlign: 'center',
              }}>
                <span style={{ fontSize: '0.6rem', color: 'rgba(150,150,170,0.4)' }}>
                  Click anywhere to close
                </span>
              </div>
            </div>,
            outerRef.current
          );
        })()}

        {selectedEvent && outerRef.current && createPortal(
          <div ref={menuRef} style={{
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: MAP_LAYERS.POPUPS,
            background: 'linear-gradient(135deg, rgba(14,22,48,0.97), rgba(20,26,43,0.97))',
            border: `2px solid ${selectedEvent.color}`,
            borderRadius: 14, padding: 0,
            minWidth: 240, maxHeight: '60vh', overflowY: 'auto',
            boxShadow: `0 8px 40px rgba(0,0,0,0.8), 0 0 20px ${selectedEvent.color}40`,
            ...(() => {
              const evtPos = locationPositions[selectedEvent.locationId];
              const evtX = evtPos ? evtPos.x : 0;
              return evtX > 50
                ? { left: 16, right: 'auto', animation: 'slideInLeft 0.2s ease-out' }
                : { right: 16, left: 'auto', animation: 'slideInRight 0.2s ease-out' };
            })(),
          }}>
            <div style={{
              padding: '14px 16px 10px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              background: `linear-gradient(135deg, ${selectedEvent.color}20, transparent)`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: '1.4rem' }}>{selectedEvent.icon}</span>
                <div>
                  <div className="font-cinzel" style={{ color: selectedEvent.color, fontSize: '0.95rem', fontWeight: 700 }}>
                    {selectedEvent.name}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>
                    Level {selectedEvent.level} Event
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--muted)', lineHeight: 1.4 }}>
                {selectedEvent.description}
              </div>
              <div style={{
                marginTop: 8, fontSize: '0.65rem', color: '#a5b4fc',
                background: 'rgba(0,0,0,0.3)', borderRadius: 6, padding: '6px 10px',
              }}>
                <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--gold)' }}>Rewards:</div>
                {getRewardDescription(selectedEvent)}
              </div>
              <div style={{ marginTop: 6, fontSize: '0.55rem', color: 'var(--muted)' }}>
                <InlineIcon name="battle" size={12} /> {selectedEvent.enemyCount} enem{selectedEvent.enemyCount === 1 ? 'y' : 'ies'}
              </div>
            </div>
            <div style={{ padding: 8 }}>
              <MenuButton
                icon="battle" label="Challenge" sublabel={`Fight Lv.${selectedEvent.level} event`}
                color={selectedEvent.color}
                onClick={() => { startEventBattle(selectedEvent.id); setSelectedEvent(null); }}
                glow
              />
            </div>
            <div style={{
              padding: '6px 16px 10px', borderTop: '1px solid rgba(255,255,255,0.05)',
              textAlign: 'center',
            }}>
              <span style={{ fontSize: '0.6rem', color: 'rgba(150,150,170,0.4)' }}>
                Click anywhere to close
              </span>
            </div>
          </div>,
          outerRef.current
        )}

        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          background: 'linear-gradient(180deg, rgba(10,14,30,0.92) 0%, rgba(10,14,30,0.7) 70%, transparent 100%)',
          padding: '10px 16px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 8, zIndex: MAP_LAYERS.HUD_BUTTONS,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              onClick={() => setScreen('account')}
              title="War Council"
              style={{
                width: 44, height: 44, borderRadius: 10, cursor: 'pointer',
                background: 'rgba(0,0,0,0.4)',
                border: '2px solid rgba(255,215,0,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', flexShrink: 0,
                transition: 'all 0.2s',
                boxShadow: '0 0 12px rgba(255,215,0,0.1)',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.boxShadow = '0 0 18px rgba(255,215,0,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,215,0,0.4)'; e.currentTarget.style.boxShadow = '0 0 12px rgba(255,215,0,0.1)'; }}
            >
              <img src="/images/logo.png" alt="Grudge Warlords" style={{
                width: 36, height: 36, objectFit: 'contain',
                imageRendering: 'pixelated',
                filter: 'drop-shadow(0 0 4px rgba(255,215,0,0.3))',
              }} />
            </div>
            <div style={{ width: 48, height: 48, overflow: 'hidden', flexShrink: 0 }}>
              <SpriteAnimation spriteData={getPlayerSprite(playerClass, playerRace)} animation="idle" scale={1.5} speed={150} />
            </div>
            <div>
              <div className="font-cinzel" style={{ color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 700 }}>{playerName}</div>
              <div style={{ color: 'var(--muted)', fontSize: '0.6rem' }}>Lv.{level} {raceDef?.name} {cls?.name}</div>
            </div>
            <div style={{ minWidth: 100, marginLeft: 4 }}>
              <HealthBar current={playerHealth} max={playerMaxHealth} color="#22c55e" label="HP" />
              <HealthBar current={playerMana} max={playerMaxMana} color="#3b82f6" label="MP" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{
              background: 'rgba(0,0,0,0.4)', borderRadius: 8, padding: '4px 10px',
              border: '1px solid rgba(255,215,0,0.2)',
            }}>
              <span style={{ color: 'var(--gold)', fontWeight: 600, fontSize: '0.8rem' }}><InlineIcon name="gold" size={12} /> {gold}</span>
              <span style={{ color: 'var(--muted)', fontSize: '0.6rem', marginLeft: 8 }}>XP: {xp}/{xpToNext}</span>
            </div>

            <button onClick={() => enterScene('camp', 'world')} style={{
              background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.4)',
              borderRadius: 8, padding: '4px 10px', color: '#4ade80',
              cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600,
            }}>
              <InlineIcon name="camp" size={12} /> Camp
            </button>

            {level >= 15 && (
              <button onClick={() => enterScene('portal', 'world')} style={{
                background: 'rgba(192,38,211,0.15)', border: '1px solid rgba(192,38,211,0.4)',
                borderRadius: 8, padding: '4px 10px', color: '#c026d3',
                cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600,
              }}>
                <InlineIcon name="portal" size={12} /> Nexus
              </button>
            )}

            {(unspentPoints > 0 || skillPoints > 0 || heroRoster.some(h => (h.unspentPoints || 0) > 0 || (h.skillPoints || 0) > 0)) && (
              <button onClick={() => setScreen('account')} style={{
                background: 'rgba(239,68,68,0.2)', border: '1px solid var(--danger)',
                borderRadius: 8, padding: '4px 10px', color: 'var(--danger)',
                cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600, animation: 'glow 2s infinite'
              }}>
                Points!
              </button>
            )}

            <button onClick={() => setScreen('account')} style={{
              background: 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,215,0,0.05))',
              border: '1px solid var(--gold)', borderRadius: 8,
              padding: '4px 10px', color: 'var(--gold)', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600,
            }}><InlineIcon name="battle" size={12} /> Council</button>

            <button onClick={() => { setShowWarParty(!showWarParty); setShowGruda(false); }} style={{
              background: showWarParty ? 'rgba(110,231,183,0.2)' : 'rgba(110,231,183,0.08)',
              border: `1px solid ${showWarParty ? 'var(--accent)' : 'rgba(110,231,183,0.3)'}`,
              borderRadius: 8, padding: '4px 10px', color: 'var(--accent)',
              cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <InlineIcon name="shield" size={12} /> Party
              {Object.keys(activeHarvests).length > 0 && (
                <span style={{ background: 'rgba(251,191,36,0.3)', color: 'var(--gold)', borderRadius: 4, padding: '0 4px', fontSize: '0.5rem' }}>
                  <InlineIcon name="pickaxe" size={12} />{Object.keys(activeHarvests).length}
                </span>
              )}
            </button>

            <button onClick={() => { setShowGruda(!showGruda); setShowWarParty(false); setGrudaCopied(null); }} style={{
              background: showGruda ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${showGruda ? 'var(--danger)' : 'rgba(239,68,68,0.3)'}`,
              borderRadius: 8, padding: '4px 10px', color: showGruda ? '#f87171' : '#fca5a5',
              cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600,
            }}><InlineIcon name="skull" size={12} /> Gruda</button>
            <button onClick={() => {
              setMarkerMode(m => !m);
              setDevSubMode('marker');
              setMarkerMenuNode(null);
              setDrawingArea(null);
              setDrawingPoints([]);
              setDrawingLandmark(null);
              setLandmarkPoints([]);
              setDrawingRoute(null);
              setRoutePoints([]);
              setPlacingEffect(null);
            }} style={{
              background: markerMode ? 'rgba(251,191,36,0.25)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${markerMode ? 'rgba(251,191,36,0.6)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 8, padding: '4px 6px', color: markerMode ? 'var(--gold)' : 'rgba(255,255,255,0.3)',
              cursor: 'pointer', fontSize: '0.55rem', fontWeight: 600,
            }}>#</button>
          </div>
        </div>

        <div style={{
          position: 'absolute', top: 80, left: 12, zIndex: MAP_LAYERS.HUD_PANELS,
          background: 'rgba(8,12,28,0.85)',
          border: '1px solid rgba(110,231,183,0.15)',
          borderRadius: 10, padding: '10px 12px',
          backdropFilter: 'blur(4px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          minWidth: 160,
        }}>
          <div className="font-cinzel" style={{ fontSize: '0.6rem', color: 'var(--accent)', fontWeight: 700, marginBottom: 8, letterSpacing: '0.05em' }}>
            WAR PARTY
          </div>
          {heroRoster.filter(h => h.id === 'player' || activeHeroIds.includes(h.id)).map((hero) => {
            const heroCls = classDefinitions[hero.classId];
            const heroStats = heroCls ? getHeroStatsWithBonuses(hero) : null;
            const hpPercent = heroStats ? Math.round((hero.currentHealth / heroStats.health) * 100) : 100;
            return (
              <div key={`panel_${hero.id}`} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 40, height: 40, overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                  <SpriteAnimation spriteData={getPlayerSprite(hero.classId, hero.raceId)} animation="idle" scale={0.56} speed={180} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {hero.name}
                  </div>
                  <div style={{ fontSize: '0.5rem', color: 'var(--muted)' }}>
                    Lv.{hero.level} {heroCls?.name}
                  </div>
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, marginTop: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${hpPercent}%`, background: hpPercent > 50 ? '#22c55e' : hpPercent > 25 ? '#f59e0b' : '#ef4444', borderRadius: 2, transition: 'width 0.3s' }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {showWarParty && (() => {
          const harvestingHeroIds = Object.values(activeHarvests);
          const idleHeroes = heroRoster.filter(h =>
            !activeHeroIds.includes(h.id) && !harvestingHeroIds.includes(h.id)
          );
          const unlockedNodes = (harvestNodes || []).filter(n => level >= n.unlockLevel);
          const getHeroRole = (hero) => {
            if (activeHeroIds.includes(hero.id)) return 'active';
            const harvestEntry = Object.entries(activeHarvests).find(([, hId]) => hId === hero.id);
            if (harvestEntry) {
              const node = (harvestNodes || []).find(n => n.id === harvestEntry[0]);
              return node ? `harvesting:${node.name}:${node.icon}` : 'harvesting';
            }
            return 'idle';
          };
          return (
          <div style={{
            position: 'absolute', top: 70, right: 12, zIndex: MAP_LAYERS.HUD_SIDE,
            background: 'rgba(14,22,48,0.95)', border: '1px solid rgba(110,231,183,0.2)',
            borderRadius: 12, padding: 14, maxWidth: 380, width: 370,
            boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
            animation: 'fadeIn 0.15s ease-out',
            maxHeight: 'calc(100vh - 160px)', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h4 className="font-cinzel" style={{ color: 'var(--accent)', fontSize: '0.85rem', margin: 0 }}>
                War Party
              </h4>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {canCreateNewHero && (
                  <button onClick={() => setScreen('heroCreate')} style={{
                    background: 'linear-gradient(135deg, rgba(255,215,0,0.3), rgba(255,215,0,0.1))',
                    border: '1px solid var(--gold)', borderRadius: 6, padding: '3px 10px',
                    color: 'var(--gold)', cursor: 'pointer', fontSize: '0.6rem', fontWeight: 700,
                  }}>+ Recruit</button>
                )}
                <button onClick={() => setShowWarParty(false)} style={{
                  background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1rem',
                }}>×</button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.55rem', color: 'var(--accent)', background: 'rgba(110,231,183,0.1)', padding: '2px 6px', borderRadius: 4, border: '1px solid rgba(110,231,183,0.2)' }}>
                <InlineIcon name="battle" size={12} /> {activeHeroIds.length}/3 Active
              </span>
              <span style={{ fontSize: '0.55rem', color: 'var(--gold)', background: 'rgba(251,191,36,0.1)', padding: '2px 6px', borderRadius: 4, border: '1px solid rgba(251,191,36,0.2)' }}>
                <InlineIcon name="pickaxe" size={12} /> {harvestingHeroIds.length} Harvesting
              </span>
              <span style={{ fontSize: '0.55rem', color: 'var(--muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)' }}>
                <InlineIcon name="moon" size={12} /> {idleHeroes.length} Idle
              </span>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {heroRoster.map(hero => {
                const heroCls = classDefinitions[hero.classId];
                const heroRace = hero.raceId ? raceDefinitions[hero.raceId] : null;
                const heroStats = heroCls ? getHeroStatsWithBonuses(hero) : null;
                const role = getHeroRole(hero);
                const isActive = role === 'active';
                const isHarvesting = role.startsWith('harvesting');
                const harvestInfo = isHarvesting ? role.split(':') : null;

                const borderColor = isActive ? 'var(--accent)' : isHarvesting ? 'var(--gold)' : 'var(--border)';
                const bgColor = isActive
                  ? 'linear-gradient(135deg, rgba(110,231,183,0.15), rgba(110,231,183,0.05))'
                  : isHarvesting
                    ? 'linear-gradient(135deg, rgba(251,191,36,0.12), rgba(251,191,36,0.04))'
                    : 'rgba(42,49,80,0.3)';

                return (
                  <div key={hero.id} style={{
                    background: bgColor,
                    border: `2px solid ${borderColor}`,
                    borderRadius: 8, padding: '6px 8px', cursor: 'pointer',
                    transition: 'all 0.2s', minWidth: 90, textAlign: 'center',
                    opacity: isActive || isHarvesting ? 1 : 0.6,
                    position: 'relative',
                  }}
                    onClick={() => {
                      if (isHarvesting) {
                        const entry = Object.entries(activeHarvests).find(([, hId]) => hId === hero.id);
                        if (entry) recallHarvest(entry[0]);
                      } else {
                        toggleHeroActive(hero.id);
                      }
                    }}
                  >
                    <div style={{ width: 60, height: 60, margin: '0 auto', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <SpriteAnimation spriteData={getPlayerSprite(hero.classId, hero.raceId)} animation="idle" scale={0.7} speed={150} />
                    </div>
                    <div style={{ fontSize: '0.6rem', fontWeight: 700, color: isActive ? 'var(--accent)' : isHarvesting ? 'var(--gold)' : 'var(--muted)', marginTop: 2 }}>
                      {hero.name}
                    </div>
                    <div style={{ fontSize: '0.45rem', color: 'var(--muted)' }}>
                      Lv.{hero.level} {heroRace?.name} {heroCls?.name}
                    </div>
                    {heroStats && (
                      <div style={{ marginTop: 3, height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(hero.currentHealth / heroStats.health) * 100}%`, background: isActive ? '#22c55e' : isHarvesting ? 'var(--gold)' : '#64748b', borderRadius: 2 }} />
                      </div>
                    )}
                    <div style={{
                      fontSize: '0.45rem', marginTop: 2, fontWeight: 600,
                      color: isActive ? 'var(--accent)' : isHarvesting ? 'var(--gold)' : 'var(--muted)',
                    }}>
                      {isActive ? <><InlineIcon name="battle" size={12} /> ACTIVE</> : isHarvesting ? <>{harvestInfo?.[2] ? <InlineIcon name="pickaxe" size={12} /> : <InlineIcon name="pickaxe" size={12} />} {harvestInfo?.[1] || 'Harvesting'}</> : <><InlineIcon name="moon" size={12} /> IDLE</>}
                    </div>
                    {isHarvesting && (
                      <div style={{
                        position: 'absolute', top: 2, right: 2,
                        fontSize: '0.4rem', color: '#ef4444', cursor: 'pointer',
                        background: 'rgba(239,68,68,0.15)', borderRadius: 3, padding: '1px 3px',
                      }}>✕</div>
                    )}
                  </div>
                );
              })}
              {canCreateNewHero && (
                <div onClick={() => setScreen('heroCreate')} style={{
                  background: 'rgba(255,215,0,0.05)', border: '2px dashed var(--gold)',
                  borderRadius: 8, padding: '6px 8px', cursor: 'pointer',
                  minWidth: 90, textAlign: 'center', opacity: 0.6, minHeight: 70,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ fontSize: '1.2rem', color: 'var(--gold)' }}>+</div>
                  <div style={{ fontSize: '0.55rem', color: 'var(--gold)' }}>Recruit</div>
                  <div style={{ fontSize: '0.45rem', color: 'var(--muted)' }}>{heroRoster.length}/{maxHeroSlots}</div>
                </div>
              )}
            </div>

            {unlockedNodes.length > 0 && (
              <>
                <div style={{
                  height: 1, background: 'linear-gradient(90deg, transparent, rgba(251,191,36,0.3), transparent)',
                  marginBottom: 10,
                }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div className="font-cinzel" style={{ fontSize: '0.7rem', color: 'var(--gold)', fontWeight: 700 }}>
                    <InlineIcon name="pickaxe" size={12} /> Harvest Sites
                  </div>
                  <div style={{ display: 'flex', gap: 4, fontSize: '0.5rem', flexWrap: 'wrap' }}>
                    {Object.entries(harvestResources).filter(([, v]) => v > 0).map(([k, v]) => (
                      <span key={k} style={{ background: 'rgba(0,0,0,0.4)', padding: '1px 5px', borderRadius: 3, border: '1px solid rgba(251,191,36,0.15)', color: 'var(--gold)' }}>
                        {k === 'gold' ? <InlineIcon name="gold" size={12} /> : k === 'herbs' ? <InlineIcon name="nature" size={12} /> : k === 'wood' ? <InlineIcon name="wood" size={12} /> : k === 'ore' ? <InlineIcon name="ore" size={12} /> : <InlineIcon name="diamond" size={12} />} {Math.floor(v)}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'grid', gap: 5 }}>
                  {unlockedNodes.map(node => {
                    const assignedHeroId = activeHarvests[node.id];
                    const assignedHero = assignedHeroId ? heroRoster.find(h => h.id === assignedHeroId) : null;
                    return (
                      <div key={node.id} style={{
                        background: assignedHero ? 'rgba(251,191,36,0.06)' : 'rgba(42,49,80,0.2)',
                        border: `1px solid ${assignedHero ? 'rgba(251,191,36,0.25)' : 'var(--border)'}`,
                        borderRadius: 6, padding: '6px 10px',
                        display: 'flex', alignItems: 'center', gap: 8,
                      }}>
                        <span style={{ fontSize: '0.9rem' }}>{node.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ color: 'var(--text)', fontSize: '0.65rem', fontWeight: 600 }}>{node.name}</div>
                            <div style={{ color: 'var(--muted)', fontSize: '0.45rem' }}>+{node.baseRate} {node.resource}/s</div>
                          </div>
                          {assignedHero ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 3 }}>
                              <span style={{ color: 'var(--gold)', fontSize: '0.55rem', fontWeight: 600 }}>
                                {assignedHero.name} (Lv.{assignedHero.level})
                              </span>
                              <button onClick={(e) => { e.stopPropagation(); recallHarvest(node.id); }} style={{
                                background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)',
                                borderRadius: 4, padding: '1px 5px', color: '#ef4444', cursor: 'pointer', fontSize: '0.5rem',
                              }}>Recall</button>
                            </div>
                          ) : (
                            <div style={{ marginTop: 3 }}>
                              {idleHeroes.length > 0 ? (
                                <select
                                  onChange={(e) => { if (e.target.value) assignHarvest(node.id, e.target.value); e.target.value = ''; }}
                                  defaultValue=""
                                  style={{
                                    background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border)',
                                    borderRadius: 4, padding: '2px 5px', color: 'var(--text)',
                                    fontSize: '0.55rem', width: '100%', cursor: 'pointer',
                                  }}
                                >
                                  <option value="">Assign idle hero...</option>
                                  {idleHeroes.map(h => (
                                    <option key={h.id} value={h.id}>{h.name} (Lv.{h.level})</option>
                                  ))}
                                </select>
                              ) : (
                                <div style={{ color: 'var(--muted)', fontSize: '0.5rem', fontStyle: 'italic' }}>No idle heroes available</div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 6, color: 'var(--muted)', fontSize: '0.45rem', fontStyle: 'italic', textAlign: 'center' }}>
                  Idle heroes can be assigned to gather resources. Tap a harvesting hero to recall them.
                </div>
              </>
            )}
          </div>
          );
        })()}

        {showGruda && (
          <div style={{
            position: 'absolute', top: 70, right: 12, zIndex: MAP_LAYERS.HUD_SIDE,
            background: 'rgba(14,22,48,0.95)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 12, padding: 14, maxWidth: 380, width: 360,
            boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
            animation: 'fadeIn 0.15s ease-out',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h4 className="font-cinzel" style={{ color: '#f87171', fontSize: '0.85rem', margin: 0 }}>
                <InlineIcon name="skull" size={12} /> Gruda Arena
              </h4>
              <button onClick={() => setShowGruda(false)} style={{
                background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.9rem',
              }}>×</button>
            </div>
            <div style={{ color: 'var(--muted)', fontSize: '0.6rem', marginBottom: 10 }}>
              Challenge others by sharing your heroes. They'll fight arena enemies with your exact builds.
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ color: 'var(--text)', fontSize: '0.7rem', fontWeight: 600, marginBottom: 6 }}>Active Heroes ({activeHeroIds.length})</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {heroRoster.filter(h => activeHeroIds.includes(h.id)).map(hero => {
                  const heroCls = classDefinitions[hero.classId];
                  const heroRace = raceDefinitions[hero.raceId];
                  return (
                    <div key={hero.id} style={{
                      background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
                      borderRadius: 6, padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                      <span style={{ fontSize: '0.85rem' }}>{heroCls?.icon}</span>
                      <div>
                        <div style={{ fontSize: '0.6rem', fontWeight: 600, color: 'var(--text)' }}>{hero.name}</div>
                        <div style={{ fontSize: '0.45rem', color: 'var(--muted)' }}>Lv.{hero.level} {heroRace?.name} {heroCls?.name}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button onClick={async () => {
                const activeHeroes = heroRoster.filter(h => activeHeroIds.includes(h.id));
                const token = await encodeGrudaShare(activeHeroes);
                const url = generateShareUrl(token);
                navigator.clipboard.writeText(url).then(() => {
                  setGrudaCopied('link');
                  setTimeout(() => setGrudaCopied(null), 2000);
                });
              }} style={{
                background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 6, padding: '6px 12px', color: '#fca5a5',
                cursor: 'pointer', fontSize: '0.65rem', fontWeight: 600,
              }}>
                {grudaCopied === 'link' ? '✓ Link Copied!' : '🔗 Copy Share Link'}
              </button>

              <button onClick={async () => {
                const activeHeroes = heroRoster.filter(h => activeHeroIds.includes(h.id));
                const token = await encodeGrudaShare(activeHeroes);
                const code = generateShareCode(token);
                navigator.clipboard.writeText(code).then(() => {
                  setGrudaCopied('code');
                  setTimeout(() => setGrudaCopied(null), 2000);
                });
              }} style={{
                background: 'rgba(110,231,183,0.08)', border: '1px solid rgba(110,231,183,0.2)',
                borderRadius: 6, padding: '6px 12px', color: 'var(--accent)',
                cursor: 'pointer', fontSize: '0.65rem', fontWeight: 600,
              }}>
                {grudaCopied === 'code' ? '✓ Code Copied!' : '📋 Copy Share Code'}
              </button>

              <button onClick={async () => {
                const activeHeroes = heroRoster.filter(h => activeHeroIds.includes(h.id));
                const token = await encodeGrudaShare(activeHeroes);
                const url = `/api/play/gruda.html?s=${token}`;
                window.open(url, '_blank');
              }} style={{
                background: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(251,191,36,0.1))',
                border: '1px solid rgba(251,191,36,0.3)',
                borderRadius: 6, padding: '6px 12px', color: 'var(--gold)',
                cursor: 'pointer', fontSize: '0.65rem', fontWeight: 600,
              }}>
                <InlineIcon name="battle" size={12} /> Play Gruda
              </button>

              <button onClick={async () => {
                const activeHeroes = heroRoster.filter(h => activeHeroIds.includes(h.id));
                const token = await encodeGrudaShare(activeHeroes);
                const url = `https://grudgewarlords.com/arena?s=${token}`;
                window.open(url, '_blank');
              }} style={{
                background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(239,68,68,0.15))',
                border: '1px solid rgba(168,85,247,0.4)',
                borderRadius: 6, padding: '6px 12px', color: '#c084fc',
                cursor: 'pointer', fontSize: '0.65rem', fontWeight: 600,
              }}>
                🌐 Deploy to Arena
              </button>
            </div>

            <div style={{ marginTop: 10, padding: '6px 8px', background: 'rgba(0,0,0,0.2)', borderRadius: 6, fontSize: '0.5rem', color: 'var(--muted)' }}>
              Share the link or code with anyone. Full hero builds including equipment, skills, and loadouts are encoded. They can paste it into the Gruda Arena page to fight with your heroes against AI enemies.
            </div>
          </div>
        )}

        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(0deg, rgba(8,10,24,0.98) 0%, rgba(8,10,24,0.92) 60%, rgba(8,10,24,0.6) 85%, transparent 100%)',
          backdropFilter: 'blur(6px)',
          padding: '12px 16px 10px',
          borderTop: '1px solid rgba(255,215,0,0.12)',
          zIndex: MAP_LAYERS.HUD_BUTTONS,
        }}>
          <div style={{
            display: 'flex', alignItems: 'stretch', gap: 12,
          }}>
            <div style={{
              flex: '0 0 260px', minWidth: 0,
              background: 'rgba(10,14,32,0.8)',
              borderRadius: 10,
              border: '1px solid rgba(255,215,0,0.1)',
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '4px 10px 3px',
                background: 'rgba(255,215,0,0.06)',
                borderBottom: '1px solid rgba(255,215,0,0.08)',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <span style={{ fontSize: '0.55rem', opacity: 0.6 }}>💬</span>
                <span className="font-cinzel" style={{ fontSize: '0.5rem', color: 'rgba(255,215,0,0.5)', fontWeight: 700, letterSpacing: '0.08em' }}>PARTY LOG</span>
              </div>
              <div ref={chatLogRef} style={{
                flex: 1, overflowY: 'auto', padding: '5px 10px 5px',
                maxHeight: 64, minHeight: 40,
                fontSize: '0.55rem', lineHeight: 1.6,
                scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,215,0,0.15) transparent',
              }}>
                {chatLog.length > 0 ? chatLog.map(entry => (
                  <div key={entry.id} style={{
                    marginBottom: 3, padding: '1px 0',
                    animation: 'fadeIn 0.3s ease-out',
                  }}>
                    <span style={{
                      fontWeight: 700, color: entry.color, marginRight: 5,
                      fontSize: '0.52rem', textTransform: 'uppercase', letterSpacing: '0.03em',
                    }}>{entry.speaker}</span>
                    <span style={{ color: 'rgba(226,232,240,0.85)', fontWeight: 400 }}>{entry.line}</span>
                  </div>
                )) : (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    height: '100%', minHeight: 36,
                    fontSize: '0.5rem', color: 'rgba(148,163,184,0.35)', fontStyle: 'italic',
                  }}>Your party is quiet...</div>
                )}
              </div>
            </div>

            <div style={{
              flex: '1 1 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, minWidth: 0,
            }}>
              {selectedLoc ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: locationIcons[selectedLoc.id]?.color || 'var(--accent)', fontWeight: 700, fontSize: '0.75rem' }}>{selectedLoc.name}</div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.5rem' }}>Lv.{selectedLoc.levelRange[0]}-{selectedLoc.levelRange[1]}</div>
                  </div>
                  <button onClick={() => handleBattle(selectedLoc.id)} style={{
                    background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: 8,
                    color: '#f87171', fontWeight: 700, fontSize: '0.6rem', padding: '5px 12px', cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.25)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; }}
                  ><InlineIcon name="battle" size={12} /> Battle</button>
                  <button onClick={() => enterLocation(selectedLoc.id)} style={{
                    background: 'rgba(110,231,183,0.1)', border: '1px solid rgba(110,231,183,0.25)', borderRadius: 8,
                    color: '#6ee7b7', fontWeight: 700, fontSize: '0.6rem', padding: '5px 12px', cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(110,231,183,0.2)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(110,231,183,0.1)'; }}
                  ><InlineIcon name="world" size={12} /> Travel</button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ fontSize: '0.7rem' }}>📍</span>
                  <div style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '0.65rem' }}>
                    {locations.find(l => l.id === currentZone)?.name || cities.find(c => c.id === currentZone)?.name || 'Unknown'}
                  </div>
                </div>
              )}
            </div>

            <div style={{
              flex: '0 0 auto', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  background: 'rgba(110,231,183,0.06)', borderRadius: 8, padding: '4px 10px',
                  border: '1px solid rgba(110,231,183,0.15)',
                }}>
                  <span style={{ fontSize: '0.65rem' }}><InlineIcon name="trophy" size={12} /></span>
                  <div style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '0.7rem', fontFamily: 'monospace' }}>{victories}</div>
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  background: 'rgba(255,215,0,0.06)', borderRadius: 8, padding: '4px 10px',
                  border: '1px solid rgba(255,215,0,0.15)',
                }}>
                  <span style={{ fontSize: '0.65rem' }}><InlineIcon name="star" size={12} /></span>
                  <div style={{ color: 'var(--gold)', fontWeight: 700, fontSize: '0.7rem', fontFamily: 'monospace' }}>{level}</div>
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  background: 'rgba(255,215,0,0.06)', borderRadius: 8, padding: '4px 10px',
                  border: '1px solid rgba(255,215,0,0.15)',
                }}>
                  <span style={{ fontSize: '0.65rem' }}><InlineIcon name="gold" size={12} /></span>
                  <div style={{ color: 'var(--gold)', fontWeight: 700, fontSize: '0.7rem', fontFamily: 'monospace' }}>{gold}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes eventPulse {
            0%, 100% { transform: scale(1); opacity: 0.7; }
            50% { transform: scale(1.15); opacity: 1; }
          }
          @keyframes lavaPulse {
            0%, 100% { opacity: 0.75; filter: brightness(1.1); }
            50% { opacity: 0.95; filter: brightness(1.4); }
          }
          @keyframes emberRise {
            0% { opacity: 0.9; transform: translateY(0) scale(1); }
            50% { opacity: 0.6; }
            100% { opacity: 0; transform: translateY(-2px) scale(0.3); }
          }
          @keyframes waterSpriteAnim {
            from { background-position: 0 0; }
            to { background-position: -3072px 0; }
          }
          @keyframes portalPulseGlow {
            0%, 100% { opacity: 0.4; box-shadow: 0 0 6px currentColor; }
            50% { opacity: 0.8; box-shadow: 0 0 16px currentColor; }
          }
          @keyframes portalTeleport {
            0% { opacity: 0; }
            20% { opacity: 1; }
            80% { opacity: 1; }
            100% { opacity: 0; }
          }
          @keyframes steamRise {
            0% { opacity: 0; transform: translateY(0) scale(0.5); }
            20% { opacity: 0.15; }
            60% { opacity: 0.1; }
            100% { opacity: 0; transform: translateY(-30px) scale(1.5); }
          }
          @keyframes portalSpin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes bossPortalPulse {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 1; }
          }
          @keyframes bossLavaFlow {
            0%, 100% { transform: translateY(0); opacity: 0.7; }
            50% { transform: translateY(-8%); opacity: 1; }
          }
          @keyframes bossEmberRise {
            0% { transform: translateY(0) scale(1); opacity: 0.9; }
            100% { transform: translateY(-40px) scale(0.3); opacity: 0; }
          }
          @keyframes bossSoulFloat {
            0% { transform: translateY(0) scale(0.8); opacity: 0.3; }
            50% { transform: translateY(-25px) scale(1.2); opacity: 0.8; }
            100% { transform: translateY(-50px) scale(0.5); opacity: 0; }
          }
          @keyframes bossWaveFlow {
            0% { transform: translateX(-30%) scaleY(0.8); opacity: 0.3; }
            50% { transform: translateX(30%) scaleY(1.2); opacity: 0.7; }
            100% { transform: translateX(-30%) scaleY(0.8); opacity: 0.3; }
          }
          @keyframes bossFrostSparkle {
            0%, 100% { opacity: 0.2; transform: scale(0.5); }
            50% { opacity: 1; transform: scale(1.5); }
          }
          @keyframes bossVoidPulse {
            0%, 100% { transform: scale(0.8); opacity: 0.5; }
            50% { transform: scale(1.1); opacity: 0.9; }
          }
          @keyframes bossVoidRing {
            0% { transform: rotate(0deg) scale(1); opacity: 0.4; }
            50% { transform: rotate(180deg) scale(0.85); opacity: 0.8; }
            100% { transform: rotate(360deg) scale(1); opacity: 0.4; }
          }
          @keyframes bossVineGrow {
            0%, 100% { transform: scaleY(0.7); opacity: 0.4; }
            50% { transform: scaleY(1.1); opacity: 0.8; }
          }
          @keyframes bossLightningFlash {
            0%, 85%, 100% { opacity: 0.2; }
            88% { opacity: 1; }
            92% { opacity: 0.3; }
            95% { opacity: 0.9; }
          }
          @keyframes bossLightningBolt {
            0%, 70%, 100% { opacity: 0; }
            75% { opacity: 1; }
            80% { opacity: 0.2; }
            85% { opacity: 0.8; }
          }
          @keyframes dayNightCycle {
            0% { background: rgba(255,180,80,0.05); }
            25% { background: transparent; }
            50% { background: rgba(255,180,50,0.08); }
            75% { background: rgba(20,30,80,0.15); }
            100% { background: rgba(255,180,80,0.05); }
          }
          @keyframes regionPulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
          }
          @keyframes fadeIn {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }
          @keyframes slideInRight {
            0% { opacity: 0; transform: translateY(-50%) translateX(30px); }
            100% { opacity: 1; transform: translateY(-50%) translateX(0); }
          }
          @keyframes slideInLeft {
            0% { opacity: 0; transform: translateY(-50%) translateX(-30px); }
            100% { opacity: 1; transform: translateY(-50%) translateX(0); }
          }
          @keyframes bossAppear {
            0% { transform: scale(0.3); opacity: 0; }
            60% { transform: scale(1.15); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes bossNameReveal {
            0% { transform: translateY(20px); opacity: 0; }
            100% { transform: translateY(0); opacity: 1; }
          }
          @keyframes bossFlashIn {
            0% { opacity: 1; }
            100% { opacity: 0; }
          }
        `}</style>

      {bossWalkUp && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: MAP_LAYERS.BATTLE_OVERLAY,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.5s ease-out',
        }}>
          {bossWalkUp.terrain && (
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: `url(${bossWalkUp.terrain})`,
              backgroundSize: 'cover', backgroundPosition: 'center 70%',
              opacity: bossWalkUp.phase === 'flash' ? 0.1 : 0.25,
              transition: 'opacity 0.5s',
            }} />
          )}
          <div style={{
            position: 'absolute', inset: 0,
            background: `radial-gradient(ellipse at 50% 60%, ${bossWalkUp.glow.replace(/[\d.]+\)$/, '0.15)')} 0%, transparent 60%)`,
          }} />

          <div style={{
            position: 'absolute', bottom: '30%', left: '50%',
            transform: `translateX(${bossWalkUp.phase === 'walk' ? '-120px' : bossWalkUp.phase === 'confront' ? '-60px' : '-60px'})`,
            transition: 'transform 1.2s ease-out',
            zIndex: 2,
          }}>
            {(() => {
              const activeHeroes = heroRoster.filter(h => activeHeroIds.includes(h.id));
              const hero = activeHeroes[0];
              if (!hero) return null;
              const spriteData = getPlayerSprite(hero.classId, hero.raceId);
              return (
                <div style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.8))' }}>
                  <SpriteAnimation
                    spriteData={spriteData}
                    animation={bossWalkUp.phase === 'walk' ? 'walk' : 'idle'}
                    scale={2.5}
                    speed={150}
                  />
                </div>
              );
            })()}
          </div>

          <div style={{
            position: 'absolute', bottom: '30%', left: '50%',
            transform: `translateX(${bossWalkUp.phase === 'walk' ? '120px' : bossWalkUp.phase === 'confront' ? '60px' : '60px'})`,
            transition: 'transform 1.2s ease-out',
            opacity: bossWalkUp.phase === 'walk' ? 0 : 1,
            zIndex: 2,
          }}>
            {(() => {
              const spriteData = getEnemySprite(bossWalkUp.bossId);
              if (!spriteData) return null;
              return (
                <div style={{
                  filter: `drop-shadow(0 0 20px ${bossWalkUp.glow})`,
                  animation: bossWalkUp.phase === 'confront' ? 'bossAppear 0.6s ease-out' : 'none',
                }}>
                  <SpriteAnimation
                    spriteData={spriteData}
                    animation="idle"
                    scale={bossWalkUp.isGodFight ? 3.0 : 2.5}
                    flip={true}
                    speed={180}
                  />
                </div>
              );
            })()}
          </div>

          {bossWalkUp.phase === 'walk' && (
            <div className="font-cinzel" style={{
              position: 'absolute', top: '20%', textAlign: 'center', zIndex: 3,
              animation: 'fadeIn 0.8s ease-out',
            }}>
              <div style={{
                fontSize: '0.7rem', color: 'rgba(200,200,220,0.6)',
                letterSpacing: '0.3em', textTransform: 'uppercase',
              }}>Entering</div>
            </div>
          )}

          {(bossWalkUp.phase === 'confront' || bossWalkUp.phase === 'flash') && (
            <div className="font-cinzel" style={{
              position: 'absolute', top: '15%', textAlign: 'center', zIndex: 3,
              animation: 'bossNameReveal 0.8s ease-out',
            }}>
              <div style={{
                fontSize: bossWalkUp.isGodFight ? '0.65rem' : '0.55rem',
                color: bossWalkUp.glow.replace(/[\d.]+\)$/, '0.8)'),
                letterSpacing: '0.3em', textTransform: 'uppercase',
                marginBottom: 6,
              }}>{bossWalkUp.isGodFight ? 'GOD FIGHT' : 'BOSS ENCOUNTER'}</div>
              <div style={{
                fontSize: bossWalkUp.isGodFight ? '1.6rem' : '1.2rem', fontWeight: 700,
                color: bossWalkUp.glow.replace(/[\d.]+\)$/, '1)'),
                textShadow: `0 0 30px ${bossWalkUp.glow}, 0 2px 8px rgba(0,0,0,0.8)`,
              }}>{bossWalkUp.bossName}</div>
            </div>
          )}

          {bossWalkUp.phase === 'confront' && (
            <div style={{
              position: 'absolute', bottom: '28%', left: '50%', transform: 'translateX(-50%)',
              width: 200, height: 2,
              background: `linear-gradient(90deg, transparent, ${bossWalkUp.color1}, transparent)`,
              animation: 'bossPortalPulse 1s ease-in-out infinite',
              zIndex: 1,
            }} />
          )}

          {bossWalkUp.phase === 'flash' && (
            <div style={{
              position: 'absolute', inset: 0,
              background: `radial-gradient(circle, ${bossWalkUp.glow.replace(/[\d.]+\)$/, '0.6)')} 0%, transparent 70%)`,
              animation: 'bossFlashIn 0.8s ease-out',
              zIndex: 4,
            }} />
          )}
        </div>
      )}

      {markerMode && (
        <div style={{
          position: 'absolute', top: 75, left: '50%', transform: 'translateX(-50%)',
          zIndex: MAP_LAYERS.DEV_MENUS, background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.5)',
          borderRadius: 8, padding: '4px 10px', color: 'var(--gold)',
          fontSize: '0.65rem', fontWeight: 700, backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <select
            value={devSubMode}
            onChange={(e) => {
              setDevSubMode(e.target.value);
              setMarkerMenuNode(null);
              setDrawingArea(null);
              setDrawingPoints([]);
              setDrawingLandmark(null);
              setLandmarkPoints([]);
              setDrawingRoute(null);
              setRoutePoints([]);
              setPlacingEffect(null);
            }}
            style={{
              background: 'rgba(10,14,30,0.9)', color: 'var(--gold)', border: '1px solid rgba(251,191,36,0.4)',
              borderRadius: 6, padding: '3px 6px', fontSize: '0.6rem', fontWeight: 700,
              cursor: 'pointer', outline: 'none',
            }}
          >
            <option value="marker">Marker</option>
            <option value="pathfinding">Pathfinding</option>
            <option value="streams">Streams</option>
            <option value="lava">Lava</option>
            <option value="effects">Effects</option>
          </select>
          <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: '0.55rem' }}>
            {devSubMode === 'marker' && (drawingArea ? 'Click to place points, then Save' : 'Click a node to set movement area')}
            {devSubMode === 'pathfinding' && (drawingRoute ? 'Hold left-click and drag to paint a path' : 'Enable painting mode, then hold & drag to draw roads')}
            {devSubMode === 'streams' && (drawingLandmark === 'river' ? `Drawing river (${landmarkPoints.length} pts)` : 'Click Draw River to start')}
            {devSubMode === 'lava' && (drawingLandmark === 'lava' ? `Drawing lava (${landmarkPoints.length} pts)` : 'Click Draw Lava to start')}
            {devSubMode === 'effects' && (placingEffect ? `Click map to place ${placingEffect.type}` : 'Choose an effect type to place')}
          </span>
        </div>
      )}

      {markerMode && devSubMode === 'marker' && markerMenuNode && !drawingArea && (
        <div data-marker-menu style={{
          position: 'absolute', top: '50%',
          transform: 'translateY(-50%)',
          zIndex: MAP_LAYERS.POPUPS, background: 'rgba(10,14,30,0.95)', border: '1px solid rgba(251,191,36,0.4)',
          borderRadius: 12, padding: 16, minWidth: 220, backdropFilter: 'blur(8px)',
          ...popupPositionStyle(markerMenuNode),
        }}>
          <div style={{ color: 'var(--gold)', fontSize: '0.8rem', fontWeight: 700, marginBottom: 10, textAlign: 'center' }}>
            {markerMenuNode}
          </div>
          <button onClick={() => {
            setDrawingArea(markerMenuNode);
            setDrawingPoints([]);
            setMarkerMenuNode(null);
          }} style={{
            width: '100%', padding: '8px 12px', background: 'rgba(251,191,36,0.15)',
            border: '1px solid rgba(251,191,36,0.4)', borderRadius: 8,
            color: 'var(--gold)', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600,
            marginBottom: 6,
          }}>Create Movement Area</button>
          {movementAreas[markerMenuNode] && (
            <button onClick={() => {
              const next = { ...movementAreas };
              delete next[markerMenuNode];
              setMovementAreas(next);
              localStorage.setItem('mapMovementAreas', JSON.stringify(next));
              setMarkerMenuNode(null);
            }} style={{
              width: '100%', padding: '8px 12px', background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.4)', borderRadius: 8,
              color: '#f87171', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600,
              marginBottom: 6,
            }}>Clear Movement Area</button>
          )}
          <button onClick={() => setMarkerMenuNode(null)} style={{
            width: '100%', padding: '6px 12px', background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8,
            color: 'var(--muted)', cursor: 'pointer', fontSize: '0.65rem',
          }}>Cancel</button>
        </div>
      )}

      {markerMode && devSubMode === 'pathfinding' && !drawingRoute && (
        <div data-marker-menu style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          zIndex: MAP_LAYERS.POPUPS, background: 'linear-gradient(0deg, rgba(10,14,30,0.98) 0%, rgba(10,14,30,0.92) 80%, transparent 100%)',
          borderTop: '1px solid rgba(180,160,120,0.3)',
          padding: '14px 20px 12px',
          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12,
          backdropFilter: 'blur(10px)',
        }}>
          {editRoutes.length > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(180,160,120,0.08)', borderRadius: 8, padding: '4px 10px',
              border: '1px solid rgba(180,160,120,0.15)',
            }}>
              <span style={{ fontSize: '0.6rem', color: 'rgba(180,160,120,0.5)' }}>Strokes</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--gold)', fontWeight: 700, fontFamily: 'var(--font-cinzel)' }}>{editRoutes.length}</span>
              <span style={{ fontSize: '0.5rem', color: 'rgba(180,160,120,0.4)' }}>
                ({editRoutes.reduce((s, r) => s + (r.points?.length || 0), 0)} pts)
              </span>
            </div>
          )}
          <button onClick={() => {
            setDrawingRoute('road');
            setRoutePoints([]);
          }} style={{
            padding: '8px 18px', background: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(180,160,120,0.1))',
            border: '1px solid rgba(251,191,36,0.4)', borderRadius: 8,
            color: 'var(--gold)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700,
            fontFamily: 'var(--font-cinzel)', letterSpacing: '0.03em',
          }}>Paint Roads</button>
          {editRoutes.length > 1 && (
            <button onClick={() => {
              const merged = mergeRouteStrokes(editRoutes);
              setEditRoutes(merged);
              localStorage.setItem('mapEditRoutes', JSON.stringify(merged));
            }} style={{
              padding: '8px 18px', background: 'linear-gradient(135deg, rgba(74,222,128,0.2), rgba(74,222,128,0.08))',
              border: '1px solid rgba(74,222,128,0.4)', borderRadius: 8,
              color: '#4ade80', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700,
              fontFamily: 'var(--font-cinzel)', letterSpacing: '0.03em',
            }}>Merge All</button>
          )}
          {editRoutes.length > 0 && (
            <button onClick={() => {
              const next = editRoutes.slice(0, -1);
              setEditRoutes(next);
              localStorage.setItem('mapEditRoutes', JSON.stringify(next));
            }} style={{
              padding: '8px 14px', background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8,
              color: '#f87171', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600,
            }}>Undo</button>
          )}
          {editRoutes.length > 0 && (
            <button onClick={() => {
              if (confirm('Clear all road strokes?')) {
                setEditRoutes([]);
                localStorage.setItem('mapEditRoutes', '[]');
              }
            }} style={{
              padding: '8px 14px', background: 'rgba(239,68,68,0.05)',
              border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8,
              color: 'rgba(248,113,113,0.6)', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600,
            }}>Clear All</button>
          )}
        </div>
      )}

      {markerMode && drawingArea && (
        <div data-marker-menu style={{
          position: 'absolute', bottom: 60, left: '50%', transform: 'translateX(-50%)',
          zIndex: MAP_LAYERS.POPUPS, background: 'rgba(10,14,30,0.95)', border: '1px solid rgba(251,191,36,0.4)',
          borderRadius: 10, padding: '8px 14px', display: 'flex', gap: 8, alignItems: 'center',
          backdropFilter: 'blur(8px)',
        }}>
          <span style={{ color: 'var(--gold)', fontSize: '0.65rem', fontWeight: 700 }}>
            Drawing: {drawingArea} ({drawingPoints.length} pts)
          </span>
          <button onClick={() => setDrawingPoints(prev => prev.slice(0, -1))} disabled={drawingPoints.length === 0} style={{
            padding: '4px 10px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 6, color: '#ccc', cursor: 'pointer', fontSize: '0.6rem',
            opacity: drawingPoints.length === 0 ? 0.4 : 1,
          }}>Undo</button>
          <button onClick={() => {
            if (drawingPoints.length >= 3) {
              const next = { ...movementAreas, [drawingArea]: drawingPoints };
              setMovementAreas(next);
              localStorage.setItem('mapMovementAreas', JSON.stringify(next));
            }
            setDrawingArea(null);
            setDrawingPoints([]);
          }} disabled={drawingPoints.length < 3} style={{
            padding: '4px 10px', background: drawingPoints.length >= 3 ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${drawingPoints.length >= 3 ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 6, color: drawingPoints.length >= 3 ? '#4ade80' : '#666', cursor: 'pointer', fontSize: '0.6rem',
          }}>Save</button>
          <button onClick={() => { setDrawingArea(null); setDrawingPoints([]); }} style={{
            padding: '4px 10px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 6, color: '#f87171', cursor: 'pointer', fontSize: '0.6rem',
          }}>Cancel</button>
        </div>
      )}

      {markerMode && devSubMode === 'pathfinding' && drawingRoute && (
        <div data-marker-menu style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          zIndex: MAP_LAYERS.POPUPS, background: 'linear-gradient(0deg, rgba(10,14,30,0.98) 0%, rgba(10,14,30,0.92) 80%, transparent 100%)',
          borderTop: '1px solid rgba(251,191,36,0.3)',
          padding: '14px 20px 12px',
          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12,
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'rgba(251,191,36,0.1)', borderRadius: 8, padding: '5px 10px',
            border: '1px solid rgba(251,191,36,0.25)',
          }}>
            <span style={{ fontSize: '0.55rem', color: 'rgba(251,191,36,0.7)' }}>Painting</span>
            {editRoutes.length > 0 && (
              <span style={{ fontSize: '0.7rem', color: 'var(--gold)', fontWeight: 700, fontFamily: 'var(--font-cinzel)', marginLeft: 4 }}>{editRoutes.length}</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(180,160,120,0.06)', borderRadius: 8, padding: '4px 10px', border: '1px solid rgba(180,160,120,0.12)' }}>
            <span style={{ color: 'rgba(180,160,120,0.6)', fontSize: '0.6rem' }}>Width</span>
            <input type="range" min="1" max="6" step="0.5" value={roadWidth}
              onChange={e => setRoadWidth(parseFloat(e.target.value))}
              style={{ width: 70, accentColor: '#b4a078', cursor: 'pointer' }}
            />
            <span style={{ color: 'var(--gold)', fontSize: '0.7rem', fontWeight: 600, minWidth: 16, fontFamily: 'var(--font-cinzel)' }}>{roadWidth}</span>
          </div>
          {editRoutes.length > 1 && (
            <button onClick={() => {
              const merged = mergeRouteStrokes(editRoutes);
              setEditRoutes(merged);
              localStorage.setItem('mapEditRoutes', JSON.stringify(merged));
            }} style={{
              padding: '8px 16px', background: 'linear-gradient(135deg, rgba(74,222,128,0.2), rgba(74,222,128,0.08))',
              border: '1px solid rgba(74,222,128,0.4)', borderRadius: 8,
              color: '#4ade80', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700,
              fontFamily: 'var(--font-cinzel)',
            }}>Merge All</button>
          )}
          {editRoutes.length > 0 && (
            <button onClick={() => {
              const next = editRoutes.slice(0, -1);
              setEditRoutes(next);
              localStorage.setItem('mapEditRoutes', JSON.stringify(next));
            }} style={{
              padding: '8px 14px', background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8,
              color: '#f87171', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600,
            }}>Undo</button>
          )}
          <button onClick={() => { setDrawingRoute(null); setRoutePoints([]); }} style={{
            padding: '8px 18px', background: 'linear-gradient(135deg, rgba(180,160,120,0.2), rgba(180,160,120,0.08))',
            border: '1px solid rgba(180,160,120,0.4)', borderRadius: 8,
            color: 'rgb(180,160,120)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700,
            fontFamily: 'var(--font-cinzel)', letterSpacing: '0.03em',
          }}>Done</button>
        </div>
      )}

      {markerMode && (devSubMode === 'streams' || devSubMode === 'lava') && !drawingLandmark && (
        <div data-marker-menu style={{
          position: 'absolute', bottom: 60, left: '50%', transform: 'translateX(-50%)',
          zIndex: MAP_LAYERS.POPUPS, background: 'rgba(10,14,30,0.95)',
          border: `1px solid ${devSubMode === 'streams' ? 'rgba(56,189,248,0.4)' : 'rgba(251,146,60,0.4)'}`,
          borderRadius: 10, padding: '8px 14px', display: 'flex', gap: 8, alignItems: 'center',
          backdropFilter: 'blur(8px)',
        }}>
          <button onClick={() => {
            setDrawingLandmark(devSubMode === 'streams' ? 'river' : 'lava');
            setLandmarkPoints([]);
          }} style={{
            padding: '6px 14px',
            background: devSubMode === 'streams' ? 'rgba(56,189,248,0.15)' : 'rgba(251,146,60,0.15)',
            border: `1px solid ${devSubMode === 'streams' ? 'rgba(56,189,248,0.4)' : 'rgba(251,146,60,0.4)'}`,
            borderRadius: 8,
            color: devSubMode === 'streams' ? '#38bdf8' : '#fb923c',
            cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600,
          }}>Draw {devSubMode === 'streams' ? 'River' : 'Lava Flow'}</button>
          {editLandmarks.filter(l => l.type === (devSubMode === 'streams' ? 'river' : 'lava')).length > 0 && (
            <button onClick={() => {
              const type = devSubMode === 'streams' ? 'river' : 'lava';
              const next = editLandmarks.filter(l => l.type !== type);
              setEditLandmarks(next);
              localStorage.setItem('mapEditLandmarks', JSON.stringify(next));
            }} style={{
              padding: '6px 14px', background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.4)', borderRadius: 8,
              color: '#f87171', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600,
            }}>Clear All {devSubMode === 'streams' ? 'Rivers' : 'Lava'}</button>
          )}
          <span style={{ color: 'var(--muted)', fontSize: '0.55rem' }}>
            {editLandmarks.filter(l => l.type === (devSubMode === 'streams' ? 'river' : 'lava')).length} saved
          </span>
        </div>
      )}

      {markerMode && (devSubMode === 'streams' || devSubMode === 'lava') && drawingLandmark && (
        <div data-marker-menu style={{
          position: 'absolute', bottom: 60, left: '50%', transform: 'translateX(-50%)',
          zIndex: MAP_LAYERS.POPUPS, background: 'rgba(10,14,30,0.95)',
          border: `1px solid ${drawingLandmark === 'river' ? 'rgba(56,189,248,0.4)' : 'rgba(251,146,60,0.4)'}`,
          borderRadius: 10, padding: '8px 14px', display: 'flex', gap: 8, alignItems: 'center',
          backdropFilter: 'blur(8px)',
        }}>
          <span style={{ color: drawingLandmark === 'river' ? '#38bdf8' : '#fb923c', fontSize: '0.65rem', fontWeight: 700 }}>
            {drawingLandmark === 'river' ? 'River' : 'Lava'}: {landmarkPoints.length} pts
          </span>
          <button onClick={() => setLandmarkPoints(prev => prev.slice(0, -1))} disabled={landmarkPoints.length === 0} style={{
            padding: '4px 10px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 6, color: '#ccc', cursor: 'pointer', fontSize: '0.6rem',
            opacity: landmarkPoints.length === 0 ? 0.4 : 1,
          }}>Undo</button>
          <button onClick={() => {
            if (landmarkPoints.length >= 2) {
              const newLm = {
                type: drawingLandmark,
                points: landmarkPoints,
                color: drawingLandmark === 'river' ? 'rgba(56,189,248,0.25)' : 'rgba(251,146,60,0.35)',
                width: drawingLandmark === 'river' ? 1.0 : 1.1,
              };
              const next = [...editLandmarks, newLm];
              setEditLandmarks(next);
              localStorage.setItem('mapEditLandmarks', JSON.stringify(next));
            }
            setDrawingLandmark(null);
            setLandmarkPoints([]);
          }} disabled={landmarkPoints.length < 2} style={{
            padding: '4px 10px', background: landmarkPoints.length >= 2 ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${landmarkPoints.length >= 2 ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 6, color: landmarkPoints.length >= 2 ? '#4ade80' : '#666', cursor: 'pointer', fontSize: '0.6rem',
          }}>Save</button>
          <button onClick={() => { setDrawingLandmark(null); setLandmarkPoints([]); }} style={{
            padding: '4px 10px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 6, color: '#f87171', cursor: 'pointer', fontSize: '0.6rem',
          }}>Cancel</button>
        </div>
      )}

      {markerMode && devSubMode === 'effects' && !placingEffect && (
        <div data-marker-menu style={{
          position: 'absolute', bottom: 60, left: '50%', transform: 'translateX(-50%)',
          zIndex: MAP_LAYERS.POPUPS, background: 'rgba(10,14,30,0.95)', border: '1px solid rgba(167,139,250,0.4)',
          borderRadius: 10, padding: '8px 14px', display: 'flex', gap: 6, alignItems: 'center',
          flexWrap: 'wrap', justifyContent: 'center', maxWidth: 500,
          backdropFilter: 'blur(8px)',
        }}>
          {[
            { type: 'portal', label: 'Portal', color: '#a78bfa' },
            { type: 'swirl', label: 'Swirl', color: '#38bdf8' },
            { type: 'fire', label: 'Fire', color: '#f97316' },
            { type: 'sparkle', label: 'Sparkle', color: '#fbbf24' },
            { type: 'smoke', label: 'Smoke', color: '#9ca3af' },
            { type: 'void', label: 'Void', color: '#c084fc' },
          ].map(eff => (
            <button key={eff.type} onClick={() => setPlacingEffect({ type: eff.type, color: eff.color, size: 3 })} style={{
              padding: '5px 10px', background: `${eff.color}15`,
              border: `1px solid ${eff.color}60`, borderRadius: 6,
              color: eff.color, cursor: 'pointer', fontSize: '0.6rem', fontWeight: 600,
            }}>{eff.label}</button>
          ))}
          {editEffects.length > 0 && (
            <button onClick={() => {
              setEditEffects([]);
              localStorage.setItem('mapEditEffects', '[]');
            }} style={{
              padding: '5px 10px', background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.4)', borderRadius: 6,
              color: '#f87171', cursor: 'pointer', fontSize: '0.6rem', fontWeight: 600,
            }}>Clear All</button>
          )}
          <span style={{ color: 'var(--muted)', fontSize: '0.5rem', width: '100%', textAlign: 'center' }}>
            {editEffects.length} effect{editEffects.length !== 1 ? 's' : ''} placed
          </span>
        </div>
      )}

      <div style={{
        position: 'absolute', bottom: 60, right: 12, zIndex: MAP_LAYERS.DEV_TOOLBAR,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        background: 'rgba(0,0,0,0.7)', borderRadius: 8, padding: '6px 4px',
        backdropFilter: 'blur(4px)', border: '1px solid rgba(255,215,0,0.15)',
      }}>
        <button onClick={() => { setCamZoom(z => { const nz = Math.min(5, z + 0.5); setCamPos(p => clampCam(p, nz)); return nz; }); }} style={{
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#ccc', cursor: 'pointer',
          fontSize: '0.85rem', width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>+</button>
        <span style={{ color: 'var(--gold)', fontSize: '0.5rem', fontWeight: 700, textAlign: 'center' }}>
          {Math.round(camZoom * 100)}%
        </span>
        <button onClick={() => { setCamZoom(z => { const nz = Math.max(1, z - 0.5); setCamPos(p => clampCam(p, nz)); return nz; }); }} style={{
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#ccc', cursor: 'pointer',
          fontSize: '0.85rem', width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>-</button>
        <button onClick={() => { setCamZoom(1); setCamPos({ x: 0, y: 0 }); }} style={{
          background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.25)', color: 'var(--gold)', cursor: 'pointer',
          fontSize: '0.45rem', fontWeight: 700, width: 28, height: 20, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>FIT</button>
      </div>
    </div>
  );
}

function MenuButton({ icon, iconSrc, label, sublabel, color, onClick, glow, disabled, hotkey }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        width: '100%', padding: '8px 10px', margin: '4px 0',
        background: disabled ? 'rgba(40,40,60,0.3)' : 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.06))',
        border: `1.5px solid ${disabled ? 'rgba(80,80,100,0.2)' : `${color}33`}`,
        borderRadius: 10, cursor: disabled ? 'not-allowed' : 'pointer',
        color: disabled ? 'rgba(150,150,170,0.4)' : '#fff',
        fontSize: '0.85rem', fontWeight: 600, textAlign: 'left',
        transition: 'all 0.2s',
        animation: glow ? 'glow 2s infinite' : 'none',
        opacity: disabled ? 0.5 : 1,
        position: 'relative',
      }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.background = `linear-gradient(135deg, ${color}15, ${color}25)`; e.currentTarget.style.borderColor = color; e.currentTarget.style.boxShadow = `0 0 12px ${color}30, inset 0 0 20px ${color}08`; }}}
      onMouseLeave={e => { if (!disabled) { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.06))'; e.currentTarget.style.borderColor = `${color}33`; e.currentTarget.style.boxShadow = 'none'; }}}
    >
      {hotkey && (
        <div style={{
          position: 'absolute', top: -6, right: -4,
          width: 18, height: 18, borderRadius: 4,
          background: 'linear-gradient(135deg, #2a2040, #1a1530)',
          border: `1px solid ${color}66`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.55rem', fontWeight: 800, color: color,
          fontFamily: "'Cinzel', serif",
          boxShadow: `0 0 6px ${color}30`,
          zIndex: 2,
        }}>{hotkey}</div>
      )}
      {iconSrc ? (
        <div style={{
          width: 38, height: 38, borderRadius: 8, overflow: 'hidden', flexShrink: 0,
          border: `2px solid ${disabled ? 'rgba(80,80,100,0.3)' : `${color}88`}`,
          boxShadow: disabled ? 'none' : `0 0 8px ${color}30, inset 0 0 10px rgba(0,0,0,0.5)`,
          position: 'relative',
        }}>
          <img src={iconSrc} alt="" style={{
            width: '100%', height: '100%', objectFit: 'cover',
            filter: disabled ? 'grayscale(1) brightness(0.4)' : 'brightness(1.1) contrast(1.1)',
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(135deg, transparent 60%, ${color}30)`,
            borderRadius: 6,
          }} />
        </div>
      ) : (
        <span style={{ fontSize: '1.3rem', width: 38, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          color: disabled ? 'rgba(150,150,170,0.4)' : color,
          fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: '0.8rem',
          textShadow: disabled ? 'none' : `0 0 8px ${color}40`,
          letterSpacing: '0.02em',
        }}>{label}</div>
        {sublabel && <div style={{ fontSize: '0.58rem', color: 'var(--muted)', fontWeight: 400, lineHeight: 1.3 }}>
          {sublabel}{disabled ? ' (Coming soon)' : ''}
        </div>}
      </div>
    </button>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ color, fontWeight: 700, fontSize: '0.9rem' }}>{value}</div>
      <div style={{ color: 'var(--muted)', fontSize: '0.6rem' }}>{label}</div>
    </div>
  );
}
