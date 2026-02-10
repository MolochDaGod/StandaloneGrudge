import React, { useEffect, useState, useRef, useCallback } from 'react';
import useGameStore, { getHeroStatsWithBonuses } from '../stores/gameStore';
import { locations } from '../data/enemies';
import { cities, cityPositions, cityConnections } from '../data/cities';
import { missionTemplates, arenaTemplates } from '../data/missions';
import { classDefinitions } from '../data/classes';
import { raceDefinitions } from '../data/races';
import SpriteAnimation from './SpriteAnimation';
import { getPlayerSprite, getEnemySprite } from '../data/spriteMap';
import { setBgm } from '../utils/audioManager';
import { TIERS, UPGRADE_COSTS, EQUIPMENT_SLOTS, WEAPON_TYPES, ARMOR_TYPES, getItemPrice, getSellPrice } from '../data/equipment';
import { generateDialogue } from '../data/dialogue';
import { generateRandomEvent, getRewardDescription } from '../data/randomEvents';
import { encodeGrudaShare, generateShareUrl, generateShareCode } from '../utils/grudaShare';

const bossMapSprites = {
  nature_elemental: { filter: 'hue-rotate(80deg) saturate(2.5) brightness(0.7) contrast(1.3)', glow: 'rgba(0,255,80,0.5)', portal: '/backgrounds/boss_green.png' },
  water_elemental: { filter: 'hue-rotate(200deg) saturate(2.0) brightness(0.6) contrast(1.4)', glow: 'rgba(60,100,255,0.5)', portal: '/backgrounds/boss_autumn.png' },
  lich: { filter: 'hue-rotate(270deg) saturate(2.5) brightness(0.5) contrast(1.5)', glow: 'rgba(130,50,255,0.6)', portal: '/backgrounds/boss_blue.png' },
  demon_lord: { filter: 'hue-rotate(340deg) saturate(3.0) brightness(0.5) contrast(1.6)', glow: 'rgba(255,30,30,0.6)', portal: '/backgrounds/boss_red.png' },
  void_king: { filter: 'hue-rotate(280deg) saturate(2.0) brightness(0.4) contrast(1.8) drop-shadow(0 0 8px rgba(200,100,255,0.8))', glow: 'rgba(200,100,255,0.7)', portal: '/backgrounds/boss_blue.png' },
  grand_shaman: { filter: 'hue-rotate(120deg) saturate(2.0) brightness(0.65) contrast(1.3)', glow: 'rgba(0,200,100,0.5)', portal: '/backgrounds/boss_green.png' },
  canyon_warlord: { filter: 'hue-rotate(15deg) saturate(2.5) brightness(0.6) contrast(1.4)', glow: 'rgba(220,100,30,0.5)', portal: '/backgrounds/boss_red.png' },
  frost_wyrm: { filter: 'hue-rotate(190deg) saturate(2.2) brightness(0.55) contrast(1.4)', glow: 'rgba(100,180,255,0.5)', portal: '/backgrounds/boss_blue.png' },
  shadow_beast: { filter: 'hue-rotate(260deg) saturate(2.0) brightness(0.45) contrast(1.5)', glow: 'rgba(100,50,200,0.6)', portal: '/backgrounds/boss_blue.png' },
  void_sentinel: { filter: 'hue-rotate(290deg) saturate(2.5) brightness(0.4) contrast(1.7) drop-shadow(0 0 6px rgba(180,80,255,0.7))', glow: 'rgba(180,80,255,0.6)', portal: '/backgrounds/boss_blue.png' },
};

const locationPositions = {
  verdant_plains:     { x: 10, y: 88 },
  dark_forest:        { x: 22, y: 78 },
  mystic_grove:       { x: 12, y: 68 },
  whispering_caverns: { x: 28, y: 88 },
  haunted_marsh:      { x: 38, y: 78 },
  cursed_ruins:       { x: 35, y: 65 },
  crystal_caves:      { x: 20, y: 55 },
  thornwood_pass:     { x: 48, y: 72 },
  sunken_temple:      { x: 50, y: 85 },
  iron_peaks:         { x: 30, y: 45 },
  blood_canyon:       { x: 60, y: 65 },
  frozen_tundra:      { x: 42, y: 38 },
  dragon_peaks:       { x: 55, y: 50 },
  ashen_battlefield:  { x: 68, y: 75 },
  windswept_ridge:    { x: 45, y: 28 },
  molten_core:        { x: 72, y: 58 },
  shadow_forest:      { x: 25, y: 35 },
  obsidian_wastes:    { x: 78, y: 68 },
  ruins_of_ashenmoor: { x: 58, y: 38 },
  blight_hollow:      { x: 35, y: 22 },
  shadow_citadel:     { x: 65, y: 28 },
  stormspire_peak:    { x: 50, y: 15 },
  demon_gate:         { x: 80, y: 42 },
  abyssal_depths:     { x: 75, y: 30 },
  infernal_forge:     { x: 88, y: 52 },
  dreadmaw_canyon:    { x: 85, y: 38 },
  void_threshold:     { x: 72, y: 18 },
  corrupted_spire:    { x: 88, y: 22 },
  void_throne:        { x: 82, y: 8 },
};

const pathConnections = [
  ['verdant_plains', 'dark_forest'],
  ['verdant_plains', 'whispering_caverns'],
  ['dark_forest', 'mystic_grove'],
  ['dark_forest', 'haunted_marsh'],
  ['dark_forest', 'cursed_ruins'],
  ['mystic_grove', 'crystal_caves'],
  ['whispering_caverns', 'haunted_marsh'],
  ['whispering_caverns', 'sunken_temple'],
  ['haunted_marsh', 'cursed_ruins'],
  ['haunted_marsh', 'thornwood_pass'],
  ['cursed_ruins', 'crystal_caves'],
  ['cursed_ruins', 'thornwood_pass'],
  ['crystal_caves', 'iron_peaks'],
  ['thornwood_pass', 'blood_canyon'],
  ['thornwood_pass', 'sunken_temple'],
  ['sunken_temple', 'ashen_battlefield'],
  ['iron_peaks', 'frozen_tundra'],
  ['iron_peaks', 'shadow_forest'],
  ['blood_canyon', 'dragon_peaks'],
  ['blood_canyon', 'ashen_battlefield'],
  ['blood_canyon', 'molten_core'],
  ['frozen_tundra', 'windswept_ridge'],
  ['frozen_tundra', 'dragon_peaks'],
  ['dragon_peaks', 'ruins_of_ashenmoor'],
  ['dragon_peaks', 'molten_core'],
  ['ashen_battlefield', 'obsidian_wastes'],
  ['windswept_ridge', 'blight_hollow'],
  ['windswept_ridge', 'shadow_citadel'],
  ['molten_core', 'obsidian_wastes'],
  ['molten_core', 'demon_gate'],
  ['shadow_forest', 'blight_hollow'],
  ['obsidian_wastes', 'demon_gate'],
  ['ruins_of_ashenmoor', 'shadow_citadel'],
  ['blight_hollow', 'stormspire_peak'],
  ['shadow_citadel', 'abyssal_depths'],
  ['shadow_citadel', 'void_threshold'],
  ['stormspire_peak', 'void_threshold'],
  ['demon_gate', 'infernal_forge'],
  ['demon_gate', 'dreadmaw_canyon'],
  ['abyssal_depths', 'dreadmaw_canyon'],
  ['abyssal_depths', 'void_threshold'],
  ['infernal_forge', 'dreadmaw_canyon'],
  ['dreadmaw_canyon', 'corrupted_spire'],
  ['void_threshold', 'corrupted_spire'],
  ['void_threshold', 'void_throne'],
  ['corrupted_spire', 'void_throne'],
];

const locationIcons = {
  verdant_plains:     { symbol: '🌿', color: '#4ade80', glow: 'rgba(74,222,128,0.4)', shape: 'forest', w: 58, h: 42, clip: 'polygon(20% 0%, 50% 5%, 80% 0%, 100% 60%, 85% 100%, 15% 100%, 0% 60%)', bg: 'linear-gradient(180deg, #1a3a1a, #0d2a0d 60%, #0a1e0a)' },
  dark_forest:        { symbol: '🌲', color: '#22d3ee', glow: 'rgba(34,211,238,0.4)', shape: 'forest', w: 54, h: 44, clip: 'polygon(15% 0%, 50% 8%, 85% 0%, 95% 55%, 80% 100%, 20% 100%, 5% 55%)', bg: 'linear-gradient(180deg, #0a2020, #082828 60%, #061e1e)' },
  mystic_grove:       { symbol: '✨', color: '#a78bfa', glow: 'rgba(167,139,250,0.4)', shape: 'grove', w: 50, h: 46, clip: 'polygon(30% 0%, 70% 0%, 95% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 5% 30%)', bg: 'linear-gradient(135deg, #1a1030, #2a1850 50%, #1a1030)' },
  whispering_caverns: { symbol: '🕳️', color: '#94a3b8', glow: 'rgba(148,163,184,0.4)', shape: 'cave', w: 52, h: 40, clip: 'ellipse(50% 45% at 50% 55%)', bg: 'linear-gradient(180deg, #1a1a2a, #0e0e1e 70%, #080818)' },
  haunted_marsh:      { symbol: '💀', color: '#86efac', glow: 'rgba(134,239,172,0.3)', shape: 'marsh', w: 56, h: 36, clip: 'polygon(5% 20%, 20% 0%, 40% 15%, 60% 0%, 80% 10%, 95% 25%, 100% 70%, 80% 100%, 20% 100%, 0% 70%)', bg: 'linear-gradient(180deg, #0a1a10, #061810 70%, #041208)' },
  cursed_ruins:       { symbol: '🏚️', color: '#c084fc', glow: 'rgba(192,132,252,0.4)', shape: 'ruins', w: 50, h: 48, clip: 'polygon(10% 0%, 30% 5%, 45% 0%, 55% 8%, 70% 0%, 90% 5%, 100% 40%, 95% 100%, 5% 100%, 0% 40%)', bg: 'linear-gradient(180deg, #1e1028, #140a1e 60%, #0e0618)' },
  crystal_caves:      { symbol: '💎', color: '#67e8f9', glow: 'rgba(103,232,249,0.4)', shape: 'crystal', w: 44, h: 50, clip: 'polygon(50% 0%, 85% 25%, 100% 60%, 75% 100%, 25% 100%, 0% 60%, 15% 25%)', bg: 'linear-gradient(180deg, #0a2030, #082838 60%, #061e28)' },
  thornwood_pass:     { symbol: '🌳', color: '#6ee7b7', glow: 'rgba(110,231,183,0.3)', shape: 'forest', w: 60, h: 40, clip: 'polygon(10% 0%, 35% 10%, 50% 0%, 65% 10%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%)', bg: 'linear-gradient(180deg, #0e2418, #0a1e12 60%, #061a0e)' },
  sunken_temple:      { symbol: '🏛️', color: '#38bdf8', glow: 'rgba(56,189,248,0.4)', shape: 'temple', w: 48, h: 52, clip: 'polygon(25% 0%, 75% 0%, 100% 15%, 100% 100%, 0% 100%, 0% 15%)', bg: 'linear-gradient(180deg, #0e1828, #0a1420 60%, #060e18)' },
  iron_peaks:         { symbol: '⛰️', color: '#9ca3af', glow: 'rgba(156,163,175,0.4)', shape: 'mountain', w: 56, h: 48, clip: 'polygon(50% 0%, 80% 30%, 100% 80%, 90% 100%, 10% 100%, 0% 80%, 20% 30%)', bg: 'linear-gradient(180deg, #1e1e20, #141418 60%, #0e0e10)' },
  blood_canyon:       { symbol: '🏔️', color: '#ef4444', glow: 'rgba(239,68,68,0.4)', shape: 'canyon', w: 58, h: 40, clip: 'polygon(0% 30%, 15% 0%, 40% 20%, 60% 0%, 85% 15%, 100% 35%, 95% 100%, 5% 100%)', bg: 'linear-gradient(180deg, #2a0a0a, #1e0606 60%, #140404)' },
  frozen_tundra:      { symbol: '❄️', color: '#7dd3fc', glow: 'rgba(125,211,252,0.4)', shape: 'ice', w: 52, h: 44, clip: 'polygon(50% 0%, 90% 20%, 100% 60%, 80% 100%, 20% 100%, 0% 60%, 10% 20%)', bg: 'linear-gradient(180deg, #1a2838, #0e1e30 60%, #0a1828)' },
  dragon_peaks:       { symbol: '🐉', color: '#f97316', glow: 'rgba(249,115,22,0.4)', shape: 'volcano', w: 50, h: 50, clip: 'polygon(50% 0%, 75% 25%, 100% 50%, 90% 100%, 10% 100%, 0% 50%, 25% 25%)', bg: 'linear-gradient(180deg, #2a1a08, #1e1206 60%, #140e04)' },
  ashen_battlefield:  { symbol: '⚔️', color: '#a8a29e', glow: 'rgba(168,162,158,0.3)', shape: 'field', w: 60, h: 36, clip: 'polygon(5% 15%, 95% 15%, 100% 50%, 95% 85%, 5% 85%, 0% 50%)', bg: 'linear-gradient(180deg, #1a1816, #14120e 60%, #0e0c0a)' },
  windswept_ridge:    { symbol: '🌬️', color: '#93c5fd', glow: 'rgba(147,197,253,0.3)', shape: 'ridge', w: 56, h: 38, clip: 'polygon(0% 40%, 20% 0%, 50% 15%, 80% 0%, 100% 35%, 95% 90%, 5% 90%)', bg: 'linear-gradient(180deg, #141e2e, #0e1624 60%, #0a101e)' },
  molten_core:        { symbol: '🔥', color: '#fb923c', glow: 'rgba(251,146,60,0.4)', shape: 'lava', w: 52, h: 44, clip: 'polygon(15% 0%, 85% 0%, 100% 30%, 95% 70%, 80% 100%, 20% 100%, 5% 70%, 0% 30%)', bg: 'linear-gradient(180deg, #2a1208, #201006 50%, #180a04)' },
  shadow_forest:      { symbol: '🌑', color: '#818cf8', glow: 'rgba(129,140,248,0.4)', shape: 'forest', w: 54, h: 44, clip: 'polygon(15% 0%, 50% 5%, 85% 0%, 100% 55%, 80% 100%, 20% 100%, 0% 55%)', bg: 'linear-gradient(180deg, #10102a, #0a0a20 60%, #060618)' },
  obsidian_wastes:    { symbol: '🌋', color: '#f87171', glow: 'rgba(248,113,113,0.4)', shape: 'volcano', w: 48, h: 48, clip: 'polygon(50% 0%, 80% 30%, 100% 60%, 85% 100%, 15% 100%, 0% 60%, 20% 30%)', bg: 'linear-gradient(180deg, #1e0a0a, #180606 60%, #120404)' },
  ruins_of_ashenmoor: { symbol: '🏚️', color: '#d4d4d8', glow: 'rgba(212,212,216,0.3)', shape: 'ruins', w: 52, h: 46, clip: 'polygon(8% 0%, 25% 8%, 50% 0%, 75% 5%, 92% 0%, 100% 45%, 90% 100%, 10% 100%, 0% 45%)', bg: 'linear-gradient(180deg, #1a1a1e, #121216 60%, #0e0e10)' },
  blight_hollow:      { symbol: '☠️', color: '#a3e635', glow: 'rgba(163,230,53,0.3)', shape: 'marsh', w: 54, h: 38, clip: 'polygon(10% 15%, 30% 0%, 50% 10%, 70% 0%, 90% 15%, 100% 60%, 85% 100%, 15% 100%, 0% 60%)', bg: 'linear-gradient(180deg, #141e08, #0e1806 60%, #0a1204)' },
  shadow_citadel:     { symbol: '🏰', color: '#a78bfa', glow: 'rgba(167,139,250,0.4)', shape: 'gate', w: 44, h: 56, clip: 'polygon(15% 0%, 85% 0%, 100% 10%, 100% 100%, 0% 100%, 0% 10%)', bg: 'linear-gradient(180deg, #1e1040, #140a30 60%, #0e0620)' },
  stormspire_peak:    { symbol: '⚡', color: '#fcd34d', glow: 'rgba(252,211,77,0.4)', shape: 'mountain', w: 48, h: 50, clip: 'polygon(50% 0%, 80% 30%, 100% 75%, 85% 100%, 15% 100%, 0% 75%, 20% 30%)', bg: 'linear-gradient(180deg, #2a2208, #1e1a06 60%, #181404)' },
  demon_gate:         { symbol: '🌀', color: '#f43f5e', glow: 'rgba(244,63,94,0.4)', shape: 'gate', w: 44, h: 56, clip: 'polygon(15% 0%, 85% 0%, 100% 10%, 100% 100%, 0% 100%, 0% 10%)', bg: 'linear-gradient(180deg, #2e0810, #200610 60%, #180408)' },
  abyssal_depths:     { symbol: '🕳️', color: '#6366f1', glow: 'rgba(99,102,241,0.4)', shape: 'cave', w: 50, h: 42, clip: 'ellipse(50% 45% at 50% 55%)', bg: 'linear-gradient(180deg, #0e0e2a, #0a0a20 60%, #060618)' },
  infernal_forge:     { symbol: '🔨', color: '#ef4444', glow: 'rgba(239,68,68,0.4)', shape: 'lava', w: 50, h: 44, clip: 'polygon(10% 0%, 90% 0%, 100% 35%, 90% 75%, 75% 100%, 25% 100%, 10% 75%, 0% 35%)', bg: 'linear-gradient(180deg, #2a0808, #1e0606 50%, #140404)' },
  dreadmaw_canyon:    { symbol: '💀', color: '#d946ef', glow: 'rgba(217,70,239,0.4)', shape: 'canyon', w: 56, h: 40, clip: 'polygon(0% 25%, 20% 0%, 45% 20%, 55% 0%, 80% 15%, 100% 30%, 95% 100%, 5% 100%)', bg: 'linear-gradient(180deg, #1e0a20, #140618 60%, #0e0412)' },
  void_threshold:     { symbol: '🌌', color: '#c084fc', glow: 'rgba(192,132,252,0.5)', shape: 'crystal', w: 46, h: 48, clip: 'polygon(50% 0%, 85% 25%, 100% 60%, 75% 100%, 25% 100%, 0% 60%, 15% 25%)', bg: 'linear-gradient(180deg, #1a0a2a, #120820 60%, #0a0418)' },
  corrupted_spire:    { symbol: '🗼', color: '#e879f9', glow: 'rgba(232,121,249,0.4)', shape: 'mountain', w: 42, h: 52, clip: 'polygon(50% 0%, 75% 30%, 100% 70%, 85% 100%, 15% 100%, 0% 70%, 25% 30%)', bg: 'linear-gradient(180deg, #200a28, #180620 60%, #100418)' },
  void_throne:        { symbol: '👑', color: '#fbbf24', glow: 'rgba(251,191,36,0.5)', shape: 'gate', w: 48, h: 58, clip: 'polygon(15% 0%, 85% 0%, 100% 10%, 100% 100%, 0% 100%, 0% 10%)', bg: 'linear-gradient(180deg, #2a2008, #1e1806 60%, #141004)' },
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

const steamPositions = [
  { x: 42, y: 35, delay: 0 },
  { x: 44, y: 37, delay: 1.5 },
  { x: 20, y: 52, delay: 0.8 },
  { x: 22, y: 54, delay: 2.2 },
  { x: 38, y: 75, delay: 0.4 },
  { x: 40, y: 77, delay: 1.8 },
];

const MAP_GRID = { cols: 100, rows: 100 };

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

const mapLandmarks = [
  { type: 'river', points: [[14,72],[16,68],[14,64],[16,60],[18,56],[20,52]], color: 'rgba(56,189,248,0.25)', width: 1.2 },
  { type: 'river', points: [[32,90],[34,86],[36,82],[38,78],[40,75]], color: 'rgba(56,189,248,0.2)', width: 1 },
  { type: 'river', points: [[40,75],[44,72],[48,70],[50,68]], color: 'rgba(56,189,248,0.15)', width: 0.8 },
  { type: 'river', points: [[44,40],[42,44],[40,48],[38,52],[36,56]], color: 'rgba(125,211,252,0.2)', width: 0.9 },

  { type: 'lava', points: [[70,62],[72,58],[74,55],[76,52]], color: 'rgba(251,146,60,0.35)', width: 1.1 },
  { type: 'lava', points: [[78,70],[80,66],[82,62],[84,58],[86,54]], color: 'rgba(239,68,68,0.3)', width: 1.0 },
  { type: 'lava', points: [[86,54],[88,50],[90,48]], color: 'rgba(251,146,60,0.25)', width: 0.8 },

  { type: 'tower', x: 27, y: 33, label: 'Watchtower' },
  { type: 'tower', x: 63, y: 26, label: 'Dark Spire' },
  { type: 'tower', x: 49, y: 13, label: 'Storm Tower' },
  { type: 'tower', x: 90, y: 20, label: 'Void Beacon' },

  { type: 'gate', x: 65, y: 30, label: 'Shadow Gate' },
  { type: 'gate', x: 80, y: 44, label: 'Demon Gate' },
  { type: 'gate', x: 82, y: 10, label: 'Void Gate' },

  { type: 'monument', x: 15, y: 86, label: 'Waystone' },
  { type: 'monument', x: 56, y: 40, label: 'Ashenmoor Obelisk' },
  { type: 'monument', x: 37, y: 63, label: 'Cursed Pillar' },
  { type: 'monument', x: 73, y: 16, label: 'Void Marker' },

  { type: 'bridge', x: 16, y: 66, rot: 25 },
  { type: 'bridge', x: 37, y: 80, rot: -15 },
  { type: 'bridge', x: 42, y: 42, rot: 35 },

  { type: 'ruins', x: 33, y: 67, label: 'Broken Wall' },
  { type: 'ruins', x: 57, y: 36, label: 'Old Foundation' },
  { type: 'ruins', x: 85, y: 36, label: 'Shattered Arch' },

  { type: 'tree_cluster', x: 8, y: 75, count: 3 },
  { type: 'tree_cluster', x: 18, y: 82, count: 2 },
  { type: 'tree_cluster', x: 24, y: 72, count: 4 },
  { type: 'tree_cluster', x: 46, y: 74, count: 2 },
  { type: 'tree_cluster', x: 14, y: 62, count: 3 },

  { type: 'crystal', x: 21, y: 53, color: '#67e8f9' },
  { type: 'crystal', x: 18, y: 57, color: '#67e8f9' },

  { type: 'skull', x: 36, y: 20, color: '#a3e635' },
  { type: 'skull', x: 66, y: 72, color: '#a8a29e' },
];

export default function WorldMap() {
  const {
    level, xp, xpToNext, gold, playerName, playerClass, playerRace,
    playerHealth, playerMaxHealth, playerMana, playerMaxMana,
    setScreen, startBattle, startBossBattle, getUnlockedLocations, restAtInn,
    victories, unspentPoints, skillPoints, heroRoster, activeHeroIds, maxHeroSlots,
    setActiveHeroes, locationsCleared, bossesDefeated, zoneConquer,
    harvestNodes, activeHarvests, harvestResources, assignHarvest, recallHarvest, tickHarvests,
    startMissionBattle, startArenaBattle, completedMissions,
    upgradeEquipment,
    shopInventory, inventory, buyItem, sellItem, refreshShop,
    randomEvents, addRandomEvent, cleanExpiredEvents, startEventBattle, lastEventSpawn,
  } = useGameStore();

  const enterLocation = useGameStore(s => s.enterLocation);
  const raceDef = playerRace ? raceDefinitions[playerRace] : null;
  const cls = classDefinitions[playerClass];
  const unlockedLocs = getUnlockedLocations();
  const canCreateNewHero = heroRoster.length < maxHeroSlots;

  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [citySubmenu, setCitySubmenu] = useState(null);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [showWarParty, setShowWarParty] = useState(false);
  const [showHarvest, setShowHarvest] = useState(false);
  const [showGruda, setShowGruda] = useState(false);
  const [grudaCopied, setGrudaCopied] = useState(null);
  const [upgradeHeroId, setUpgradeHeroId] = useState(null);
  const [upgradeMsg, setUpgradeMsg] = useState(null);
  const [tradeTab, setTradeTab] = useState('buy');
  const [heroPos, setHeroPos] = useState(locationPositions.verdant_plains);
  const [currentZone, setCurrentZone] = useState('verdant_plains');
  const [isMoving, setIsMoving] = useState(false);
  const [wanderOffsets, setWanderOffsets] = useState({});
  const mapRef = useRef(null);
  const menuRef = useRef(null);

  const [heroWalking, setHeroWalking] = useState({});
  const [hoveredNode, setHoveredNode] = useState(null);
  const [currentDialogue, setCurrentDialogue] = useState(null);
  const [dialoguePhase, setDialoguePhase] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventCountdown, setEventCountdown] = useState(0);
  const [showDebugGrid, setShowDebugGrid] = useState(false);
  const [camZoom, setCamZoom] = useState(3);
  const [camPos, setCamPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const camInitRef = useRef(false);

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

  const handleMapMouseDown = useCallback((e) => {
    if (e.button === 0 && !e.target.closest('button') && !e.target.closest('[data-node]')) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  }, []);

  const handleMapMouseMove = useCallback((e) => {
    if (!isDragging) return;
    const dx = (e.clientX - dragStart.x) / camZoom * 0.12;
    const dy = (e.clientY - dragStart.y) / camZoom * 0.12;
    setCamPos(p => clampCam({ x: p.x + dx, y: p.y + dy }, camZoom));
    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, dragStart, camZoom, clampCam]);

  const handleMapMouseUp = useCallback(() => { setIsDragging(false); }, []);

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

  useEffect(() => {
    const interval = setInterval(() => {
      const activeHeroes = heroRoster.filter(h => activeHeroIds.includes(h.id));
      const newOffsets = {};
      const newWalking = {};
      activeHeroes.forEach(h => {
        const prevX = wanderOffsets[h.id]?.x || 0;
        const newX = (Math.random() - 0.5) * 4;
        newOffsets[h.id] = {
          x: newX,
          y: (Math.random() - 0.5) * 2,
        };
        newWalking[h.id] = { moving: true, flipX: newX < prevX };
      });
      setWanderOffsets(newOffsets);
      setHeroWalking(newWalking);
      setTimeout(() => {
        setHeroWalking({});
      }, 1800);
    }, 3000);
    return () => clearInterval(interval);
  }, [heroRoster, activeHeroIds, wanderOffsets]);

  useEffect(() => { setBgm('ambient'); }, []);

  useEffect(() => {
    const interval = setInterval(() => { tickHarvests(); }, 2000);
    return () => clearInterval(interval);
  }, [tickHarvests]);

  useEffect(() => {
    const activeHeroes = heroRoster.filter(h => activeHeroIds.includes(h.id));
    if (activeHeroes.length < 2) return;
    const delay = 12000 + Math.random() * 3000;
    const timeout = setTimeout(() => {
      const gameState = { gold, level, currentZone, zoneConquer, bossesDefeated, locationsCleared, victories, locations };
      const dialogue = generateDialogue(activeHeroes, gameState);
      if (dialogue) {
        setCurrentDialogue(dialogue);
        setDialoguePhase(1);
        setTimeout(() => setDialoguePhase(2), 4000);
        setTimeout(() => {
          setDialoguePhase(0);
          setTimeout(() => setCurrentDialogue(null), 600);
        }, 8000);
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
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLocationClick = useCallback((e, loc) => {
    e.preventDefault();
    e.stopPropagation();
    const isUnlocked = loc.unlocked || (loc.unlockLevel && level >= loc.unlockLevel);
    if (!isUnlocked) return;

    const rect = mapRef.current?.getBoundingClientRect();
    if (!rect) return;

    const pos = locationPositions[loc.id];
    const nodeXPx = (pos.x / 100) * rect.width;
    const nodeYPx = (pos.y / 100) * rect.height;
    const menuWidth = 240;
    const menuHeight = 350;
    const viewportFraction = nodeYPx / rect.height;

    let menuX = nodeXPx + 35;
    let menuY;

    if (viewportFraction > 0.4) {
      menuY = nodeYPx - menuHeight - 10;
    } else {
      menuY = nodeYPx + 35;
    }

    if (menuX + menuWidth > rect.width) menuX = nodeXPx - menuWidth - 10;
    if (menuX < 10) menuX = 10;
    if (menuY < 10) menuY = 10;
    if (menuY + menuHeight > rect.height) menuY = rect.height - menuHeight - 60;

    setMenuPos({ x: menuX, y: menuY });
    setSelectedLocation(loc.id);
    setSelectedCity(null);
    setCitySubmenu(null);
    setSelectedEvent(null);

    const target = locationPositions[loc.id];
    if (target && (target.x !== heroPos.x || target.y !== heroPos.y)) {
      setIsMoving(true);
      setHeroPos(target);
      setCurrentZone(loc.id);
      setTimeout(() => setIsMoving(false), 600);
    }
  }, [level, heroPos]);

  const handleCityClick = useCallback((e, city) => {
    e.preventDefault();
    e.stopPropagation();
    const isCityUnlocked = city.unlocked || (city.unlockLevel && level >= city.unlockLevel);
    if (!isCityUnlocked) return;

    const rect = mapRef.current?.getBoundingClientRect();
    if (!rect) return;

    const pos = cityPositions[city.id];
    const nodeXPx = (pos.x / 100) * rect.width;
    const nodeYPx = (pos.y / 100) * rect.height;
    const menuWidth = 300;
    const menuHeight = 420;
    const viewportFraction = nodeYPx / rect.height;

    let menuX = nodeXPx + 35;
    let menuY;

    if (viewportFraction > 0.4) {
      menuY = nodeYPx - menuHeight - 10;
    } else {
      menuY = nodeYPx + 35;
    }

    if (menuX + menuWidth > rect.width) menuX = nodeXPx - menuWidth - 10;
    if (menuX < 10) menuX = 10;
    if (menuY < 10) menuY = 10;
    if (menuY + menuHeight > rect.height) menuY = rect.height - menuHeight - 60;

    setMenuPos({ x: menuX, y: menuY });
    setSelectedCity(city.id);
    setSelectedLocation(null);
    setCitySubmenu(null);
    setSelectedEvent(null);

    const target = cityPositions[city.id];
    if (target && (target.x !== heroPos.x || target.y !== heroPos.y)) {
      setIsMoving(true);
      setHeroPos(target);
      setTimeout(() => setIsMoving(false), 600);
    }
  }, [level, heroPos]);

  const handleBattle = (locId) => {
    useGameStore.setState({ currentLocation: locId });
    startBattle(locId);
    setSelectedLocation(null);
  };

  const handleBoss = (locId, bossId) => {
    useGameStore.setState({ currentLocation: locId });
    startBossBattle(bossId);
    setSelectedLocation(null);
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

  return (
    <div
      onMouseDown={handleMapMouseDown}
      onMouseMove={handleMapMouseMove}
      onMouseUp={handleMapMouseUp}
      onMouseLeave={handleMapMouseUp}
      style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative', background: '#0b1020', cursor: isDragging ? 'grabbing' : 'grab', border: '2px solid rgba(30,25,15,0.9)', boxShadow: 'inset 0 0 30px rgba(0,0,0,0.4), 0 0 1px rgba(139,109,56,0.3)' }}
    >
      <div ref={mapRef} style={{
        width: '100%', height: '100%', position: 'relative',
        backgroundImage: 'url(/backgrounds/world_map.png)',
        backgroundSize: 'cover', backgroundPosition: 'center',
        transform: `scale(${camZoom}) translate(${camPos.x}%, ${camPos.y}%)`,
        transformOrigin: '50% 50%',
        transition: isDragging ? 'none' : 'transform 0.3s ease-out',
        boxShadow: 'inset 0 0 0 4px rgba(45,35,18,0.85), inset 0 0 0 5px rgba(139,109,56,0.5), inset 0 0 0 6px rgba(30,22,10,0.9), inset 0 0 20px rgba(0,0,0,0.6), inset 0 0 4px rgba(180,140,60,0.15)',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.5) 100%)',
          pointerEvents: 'none',
        }} />

        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          pointerEvents: 'none', zIndex: 1,
          background: 'rgba(255,180,80,0.03)',
          animation: 'dayNightCycle 120s linear infinite',
        }} />

        {showDebugGrid && (
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 999 }}>
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

        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
          {terrainRegions.map((region, idx) => (
            <polygon key={idx}
              points={region.points}
              fill={region.fill}
              stroke={region.stroke}
              strokeWidth="0.3"
              style={{ filter: `drop-shadow(0 0 2px ${region.stroke})`, animation: 'regionPulse 6s ease-in-out infinite' }}
            />
          ))}
        </svg>

        {terrainRegions.map((region, idx) => (
          <div key={`rl_${idx}`} className="font-cinzel" style={{
            position: 'absolute',
            left: `${region.labelX}%`, top: `${region.labelY}%`,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none', zIndex: 1,
            fontSize: '0.75rem', fontWeight: 700,
            color: region.stroke.replace('0.2', '0.35'),
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            textShadow: `0 0 10px ${region.fill}, 0 2px 6px rgba(0,0,0,0.8)`,
            opacity: 0.6,
          }}>
            {region.name}
          </div>
        ))}

        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
          {mapLandmarks.filter(l => l.type === 'river').map((river, idx) => {
            const d = buildSmoothPath(river.points);
            return (
              <g key={`river_${idx}`}>
                <path d={d} fill="none" stroke="rgba(200,230,255,0.08)" strokeWidth={river.width + 0.8} strokeLinecap="round" strokeLinejoin="round" />
                <path d={d} fill="none" stroke={river.color} strokeWidth={river.width} strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 3px ${river.color})` }} />
              </g>
            );
          })}
          {mapLandmarks.filter(l => l.type === 'lava').map((lava, idx) => {
            const d = buildSmoothPath(lava.points);
            return (
              <g key={`lava_${idx}`}>
                <path d={d} fill="none" stroke="rgba(50,10,0,0.4)" strokeWidth={lava.width + 1.5} strokeLinecap="round" strokeLinejoin="round" />
                <path d={d} fill="none" stroke={lava.color} strokeWidth={lava.width} strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 4px rgba(255,100,0,0.6))', animation: `lavaPulse ${3 + idx}s ease-in-out infinite` }} />
                <path d={d} fill="none" stroke="rgba(255,200,50,0.2)" strokeWidth={lava.width * 0.4} strokeLinecap="round" strokeLinejoin="round" style={{ animation: `lavaPulse ${2 + idx * 0.5}s ease-in-out infinite alternate` }} />
              </g>
            );
          })}
        </svg>

        {mapLandmarks.filter(l => l.type === 'tower').map((t, idx) => (
          <div key={`tower_${idx}`} title={t.label} style={{
            position: 'absolute', left: `${t.x}%`, top: `${t.y}%`,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none', zIndex: 2,
          }}>
            <div style={{
              width: 8, height: 16, position: 'relative',
              background: 'linear-gradient(180deg, #3a3a4a, #1e1e28)',
              border: '1px solid rgba(150,150,170,0.3)', borderRadius: '2px 2px 0 0',
              boxShadow: '0 0 6px rgba(100,100,150,0.2)',
            }}>
              <div style={{
                position: 'absolute', top: -4, left: '50%', transform: 'translateX(-50%)',
                width: 0, height: 0,
                borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
                borderBottom: '5px solid #4a4a5a',
              }} />
              <div style={{
                position: 'absolute', top: 2, left: '50%', transform: 'translateX(-50%)',
                width: 3, height: 3, borderRadius: '50%',
                background: 'rgba(251,191,36,0.6)',
                boxShadow: '0 0 4px rgba(251,191,36,0.4)',
                animation: 'lavaPulse 3s ease-in-out infinite',
              }} />
            </div>
          </div>
        ))}

        {mapLandmarks.filter(l => l.type === 'gate').map((g, idx) => (
          <div key={`gate_${idx}`} title={g.label} style={{
            position: 'absolute', left: `${g.x}%`, top: `${g.y}%`,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none', zIndex: 2,
          }}>
            <div style={{
              width: 14, height: 18, position: 'relative',
              display: 'flex', justifyContent: 'center',
            }}>
              <div style={{ width: 3, height: 16, background: 'linear-gradient(180deg, #4a3a2a, #2a1e14)', borderRadius: '1px 1px 0 0', position: 'absolute', left: 0, bottom: 0 }} />
              <div style={{ width: 3, height: 16, background: 'linear-gradient(180deg, #4a3a2a, #2a1e14)', borderRadius: '1px 1px 0 0', position: 'absolute', right: 0, bottom: 0 }} />
              <div style={{
                position: 'absolute', top: 0, width: 14, height: 6,
                borderRadius: '7px 7px 0 0',
                background: 'linear-gradient(180deg, #5a4a3a, #3a2e20)',
                border: '1px solid rgba(180,140,100,0.3)', borderBottom: 'none',
              }} />
              <div style={{
                position: 'absolute', top: 5, left: '50%', transform: 'translateX(-50%)',
                width: 6, height: 10, borderRadius: '3px 3px 0 0',
                background: 'rgba(0,0,0,0.6)',
                boxShadow: 'inset 0 0 3px rgba(200,100,255,0.3)',
              }} />
            </div>
          </div>
        ))}

        {mapLandmarks.filter(l => l.type === 'monument').map((m, idx) => (
          <div key={`mon_${idx}`} title={m.label} style={{
            position: 'absolute', left: `${m.x}%`, top: `${m.y}%`,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none', zIndex: 2,
          }}>
            <div style={{
              width: 4, height: 14,
              background: 'linear-gradient(180deg, #8a8a9a, #4a4a5a)',
              borderRadius: '1px',
              boxShadow: '0 0 4px rgba(150,150,200,0.15)',
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute', top: -2, left: '50%', transform: 'translateX(-50%)',
                width: 6, height: 3,
                background: 'linear-gradient(180deg, #a0a0b0, #6a6a7a)',
                borderRadius: '1px',
              }} />
            </div>
          </div>
        ))}

        {mapLandmarks.filter(l => l.type === 'bridge').map((b, idx) => (
          <div key={`bridge_${idx}`} style={{
            position: 'absolute', left: `${b.x}%`, top: `${b.y}%`,
            transform: `translate(-50%, -50%) rotate(${b.rot}deg)`,
            pointerEvents: 'none', zIndex: 3,
          }}>
            <div style={{
              width: 18, height: 6,
              background: 'linear-gradient(180deg, #5a4a30, #3a2e1a)',
              border: '1px solid rgba(140,110,70,0.3)',
              borderRadius: 1,
              position: 'relative',
            }}>
              <div style={{ position: 'absolute', left: 2, top: -2, width: 2, height: 2, background: '#6a5a3a', borderRadius: 1 }} />
              <div style={{ position: 'absolute', right: 2, top: -2, width: 2, height: 2, background: '#6a5a3a', borderRadius: 1 }} />
              <div style={{ position: 'absolute', left: '50%', top: -2, transform: 'translateX(-50%)', width: 2, height: 2, background: '#6a5a3a', borderRadius: 1 }} />
            </div>
          </div>
        ))}

        {mapLandmarks.filter(l => l.type === 'ruins').map((r, idx) => (
          <div key={`ruins_${idx}`} title={r.label} style={{
            position: 'absolute', left: `${r.x}%`, top: `${r.y}%`,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none', zIndex: 2,
          }}>
            <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
              <div style={{ width: 3, height: 8, background: 'linear-gradient(180deg, #6a6a6a, #3a3a3a)', borderRadius: '1px 1px 0 0', transform: 'rotate(-5deg)' }} />
              <div style={{ width: 3, height: 5, background: 'linear-gradient(180deg, #5a5a5a, #2a2a2a)', borderRadius: '1px 1px 0 0', transform: 'rotate(3deg)' }} />
              <div style={{ width: 3, height: 10, background: 'linear-gradient(180deg, #7a7a7a, #4a4a4a)', borderRadius: '1px 1px 0 0', transform: 'rotate(-2deg)' }} />
            </div>
          </div>
        ))}

        {mapLandmarks.filter(l => l.type === 'tree_cluster').map((tc, idx) => (
          <div key={`trees_${idx}`} style={{
            position: 'absolute', left: `${tc.x}%`, top: `${tc.y}%`,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none', zIndex: 1,
            display: 'flex', gap: 2,
          }}>
            {Array.from({ length: tc.count }).map((_, i) => (
              <div key={i} style={{
                width: 6, height: 8,
                position: 'relative', marginTop: i % 2 === 0 ? 0 : 2,
              }}>
                <div style={{
                  width: 0, height: 0,
                  borderLeft: '3px solid transparent', borderRight: '3px solid transparent',
                  borderBottom: `6px solid rgba(34,${140 + i * 20},70,0.35)`,
                  position: 'absolute', top: 0,
                }} />
                <div style={{
                  width: 1, height: 3,
                  background: 'rgba(90,60,30,0.4)',
                  position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
                }} />
              </div>
            ))}
          </div>
        ))}

        {mapLandmarks.filter(l => l.type === 'crystal').map((c, idx) => (
          <div key={`crystal_${idx}`} style={{
            position: 'absolute', left: `${c.x}%`, top: `${c.y}%`,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none', zIndex: 2,
          }}>
            <div style={{
              width: 0, height: 0,
              borderLeft: '3px solid transparent', borderRight: '3px solid transparent',
              borderBottom: `8px solid ${c.color}`,
              opacity: 0.5,
              filter: `drop-shadow(0 0 3px ${c.color})`,
              animation: 'lavaPulse 4s ease-in-out infinite',
            }} />
          </div>
        ))}

        {mapLandmarks.filter(l => l.type === 'skull').map((s, idx) => (
          <div key={`skull_${idx}`} style={{
            position: 'absolute', left: `${s.x}%`, top: `${s.y}%`,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none', zIndex: 2,
            fontSize: '0.5rem', opacity: 0.4,
            filter: `drop-shadow(0 0 2px ${s.color})`,
          }}>💀</div>
        ))}

        {steamPositions.map((sp, idx) => (
          <div key={`steam_${idx}`} style={{
            position: 'absolute',
            left: `${sp.x}%`, top: `${sp.y}%`,
            width: 8, height: 8,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(200,220,255,0.15), transparent)',
            pointerEvents: 'none', zIndex: 2,
            animation: `steamRise 4s ease-out infinite`,
            animationDelay: `${sp.delay}s`,
          }} />
        ))}

        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
          {pathConnections.map(([from, to], idx) => {
            const a = locationPositions[from];
            const b = locationPositions[to];
            const fromUnlocked = unlockedLocs.some(l => l.id === from);
            const toUnlocked = unlockedLocs.some(l => l.id === to);
            const bothUnlocked = fromUnlocked && toUnlocked;
            return (
              <line key={idx}
                x1={`${a.x}%`} y1={`${a.y}%`}
                x2={`${b.x}%`} y2={`${b.y}%`}
                stroke={bothUnlocked ? 'rgba(255,215,0,0.35)' : 'rgba(100,100,120,0.2)'}
                strokeWidth={bothUnlocked ? 2.5 : 1.5}
                strokeDasharray={bothUnlocked ? 'none' : '6 4'}
                style={{ filter: bothUnlocked ? 'drop-shadow(0 0 3px rgba(255,215,0,0.3))' : 'none' }}
              />
            );
          })}
          {cityConnections.map(([cityId, locId], idx) => {
            const cityPos = cityPositions[cityId];
            const locPos = locationPositions[locId];
            if (!cityPos || !locPos) return null;
            const city = cities.find(c => c.id === cityId);
            const isCityUnlocked = city && (city.unlocked || (city.unlockLevel && level >= city.unlockLevel));
            const isLocUnlocked = unlockedLocs.some(l => l.id === locId);
            const bothOk = isCityUnlocked && isLocUnlocked;
            return (
              <line key={`cc_${idx}`}
                x1={`${cityPos.x}%`} y1={`${cityPos.y}%`}
                x2={`${locPos.x}%`} y2={`${locPos.y}%`}
                stroke={bothOk ? 'rgba(74,222,128,0.3)' : 'rgba(100,100,120,0.15)'}
                strokeWidth={bothOk ? 2 : 1}
                strokeDasharray={bothOk ? '6 3' : '4 4'}
                style={{ filter: bothOk ? 'drop-shadow(0 0 2px rgba(74,222,128,0.2))' : 'none' }}
              />
            );
          })}
        </svg>

        {locations.map((loc) => {
          const pos = locationPositions[loc.id];
          if (!pos) return null;
          const isUnlocked = loc.unlocked || (loc.unlockLevel && level >= loc.unlockLevel);
          const cleared = locationsCleared.includes(loc.id);
          const icon = locationIcons[loc.id];
          const isSelected = selectedLocation === loc.id;
          const conquer = (zoneConquer || {})[loc.id] || 0;
          const isConquered = conquer >= 100;
          const circumference = 2 * Math.PI * 26;
          const strokeDash = (conquer / 100) * circumference;

          return (
            <div key={loc.id}
              onClick={(e) => handleLocationClick(e, loc)}
              onContextMenu={(e) => handleLocationClick(e, loc)}
              onMouseEnter={() => { if (!selectedLocation && !selectedCity && !selectedEvent) setHoveredNode({ type: 'location', id: loc.id, x: pos.x, y: pos.y }); }}
              onMouseLeave={() => setHoveredNode(null)}
              style={{
                position: 'absolute',
                left: `${pos.x}%`, top: `${pos.y}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: isSelected ? 10 : 3,
                cursor: isUnlocked ? 'pointer' : 'not-allowed',
                transition: 'transform 0.2s',
              }}
            >
              <div style={{ position: 'relative', width: (icon.w || 56) + 6, height: (icon.h || 56) + 6 }}>
                {isUnlocked && conquer > 0 && (
                  <div style={{
                    position: 'absolute', top: -3, left: -3,
                    width: (icon.w || 56) + 12, height: 4, borderRadius: 2,
                    background: 'rgba(255,255,255,0.08)',
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
                {isUnlocked && portalLocations.includes(loc.id) && (
                  <>
                    <div style={{
                      position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
                      width: (icon.w || 44) - 8, height: (icon.h || 56) - 14,
                      borderRadius: '50% 50% 40% 40%',
                      background: `conic-gradient(from 0deg, ${icon.color}00, ${icon.color}88, ${icon.color}00, ${icon.color}66, ${icon.color}00)`,
                      animation: 'portalSpin 3s linear infinite',
                      opacity: 0.6,
                      filter: `blur(2px)`,
                      pointerEvents: 'none',
                    }} />
                    <div style={{
                      position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
                      width: (icon.w || 44) - 14, height: (icon.h || 56) - 20,
                      borderRadius: '50% 50% 40% 40%',
                      background: `radial-gradient(ellipse, ${icon.glow}, transparent 70%)`,
                      animation: 'portalSpin 2s linear infinite reverse',
                      opacity: 0.5,
                      pointerEvents: 'none',
                    }} />
                    <div style={{
                      position: 'absolute', top: -2, left: -2,
                      width: (icon.w || 44) + 10, height: (icon.h || 56) + 10,
                      boxShadow: `0 0 16px ${icon.glow}, 0 0 32px ${icon.glow}`,
                      borderRadius: 4,
                      opacity: 0.4,
                      animation: 'glow 2s infinite',
                      pointerEvents: 'none',
                    }} />
                  </>
                )}
              <div style={{
                  position: 'absolute', top: 3, left: 3,
                  width: icon.w || 56, height: icon.h || 56,
                  clipPath: icon.clip || 'none',
                  background: isUnlocked
                    ? (icon.bg || `radial-gradient(circle, ${icon.glow}, rgba(20,26,43,0.9))`)
                    : 'rgba(30,30,50,0.8)',
                  border: `2px solid ${isUnlocked ? (isConquered ? 'var(--gold)' : cleared ? 'var(--gold)' : isSelected ? '#fff' : icon.color + '80') : 'rgba(80,80,100,0.4)'}`,
                  borderRadius: icon.clip ? 4 : '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: isUnlocked ? '1.4rem' : '1rem',
                  opacity: isUnlocked ? 1 : 0.4,
                  boxShadow: isSelected
                    ? `0 0 20px ${icon.glow}, 0 0 40px ${icon.glow}, inset 0 0 10px ${icon.glow}`
                    : isUnlocked
                      ? `0 0 8px ${icon.glow}, inset 0 0 6px rgba(0,0,0,0.5)`
                      : 'none',
                  transition: 'all 0.3s',
                  animation: isSelected ? 'pulse 1.5s infinite' : (cleared ? 'none' : (isUnlocked ? 'glow 3s infinite' : 'none')),
                  overflow: 'hidden',
                }}>
                  <span style={{
                    filter: isUnlocked ? `drop-shadow(0 0 4px ${icon.glow})` : 'none',
                    position: 'relative', zIndex: 1,
                  }}>
                    {isUnlocked ? icon.symbol : '🔒'}
                  </span>
                  {isUnlocked && (
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%',
                      background: `linear-gradient(transparent, ${icon.color}15)`,
                      pointerEvents: 'none',
                    }} />
                  )}
                </div>
                {isUnlocked && conquer > 0 && (
                  <div style={{
                    position: 'absolute', top: -8, right: -8,
                    background: isConquered ? 'var(--gold)' : 'rgba(14,22,48,0.95)',
                    border: `1px solid ${isConquered ? 'var(--gold)' : icon.color}`,
                    borderRadius: 6, padding: '1px 4px',
                    fontSize: '0.5rem', fontWeight: 700,
                    color: isConquered ? '#000' : icon.color,
                    whiteSpace: 'nowrap',
                    boxShadow: isConquered ? '0 0 8px rgba(255,215,0,0.5)' : 'none',
                  }}>
                    {conquer}%
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

        {locations.filter(loc => loc.boss && !bossesDefeated.includes(loc.boss)).map(loc => {
          const pos = locationPositions[loc.id];
          if (!pos) return null;
          const isLocUnlocked = loc.unlocked || (loc.unlockLevel && level >= loc.unlockLevel);
          if (!isLocUnlocked) return null;
          const bossStyle = bossMapSprites[loc.boss] || {};
          const spriteData = getEnemySprite(loc.boss);
          const corruptedSprite = { ...spriteData, filter: bossStyle.filter || 'hue-rotate(180deg) saturate(2) brightness(0.5)' };
          const bossX = pos.x + 3.5;
          const bossY = pos.y - 4.5;

          return (
            <div key={`boss_${loc.boss}`} style={{
              position: 'absolute',
              left: `${Math.max(4, Math.min(96, bossX))}%`,
              top: `${Math.max(4, Math.min(96, bossY))}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: 4,
              pointerEvents: 'none',
            }}>
              {bossStyle.portal && (
                <div style={{
                  position: 'absolute', top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 100, height: 100, borderRadius: '50%',
                  backgroundImage: `url(${bossStyle.portal})`,
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  opacity: 0.6,
                  filter: `drop-shadow(0 0 16px ${bossStyle.glow || 'rgba(255,0,0,0.5)'})`,
                  animation: 'glow 2s infinite',
                  zIndex: -1,
                }} />
              )}
              <div style={{
                position: 'relative',
                width: 80, height: 80,
                overflow: 'hidden',
                display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                filter: `drop-shadow(0 0 12px ${bossStyle.glow || 'rgba(255,0,0,0.5)'})`,
                animation: 'glow 2s infinite',
              }}>
                <SpriteAnimation
                  spriteData={corruptedSprite}
                  animation="idle"
                  scale={2.0}
                  flip={true}
                  speed={180}
                />
              </div>
              <div style={{
                width: 30, height: 6, borderRadius: '50%', margin: '-2px auto 0',
                background: `radial-gradient(ellipse, ${bossStyle.glow || 'rgba(255,0,0,0.4)'}, transparent)`,
              }} />
              <div className="font-cinzel" style={{
                textAlign: 'center',
                fontSize: '0.5rem', fontWeight: 700,
                color: bossStyle.glow ? bossStyle.glow.replace('0.5', '1').replace('0.6', '1').replace('0.7', '1') : '#ff4444',
                textShadow: '0 1px 4px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.7)',
                whiteSpace: 'nowrap', marginTop: 2,
              }}>
                BOSS
              </div>
            </div>
          );
        })}

        {cities.map((city) => {
          const pos = cityPositions[city.id];
          if (!pos) return null;
          const isCityUnlocked = city.unlocked || (city.unlockLevel && level >= city.unlockLevel);
          const isSelected = selectedCity === city.id;

          return (
            <div key={city.id}
              onClick={(e) => handleCityClick(e, city)}
              onMouseEnter={() => { if (!selectedLocation && !selectedCity && !selectedEvent) setHoveredNode({ type: 'city', id: city.id, x: pos.x, y: pos.y, name: city.name }); }}
              onMouseLeave={() => setHoveredNode(null)}
              style={{
                position: 'absolute',
                left: `${pos.x}%`, top: `${pos.y}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: isSelected ? 10 : 3,
                cursor: isCityUnlocked ? 'pointer' : 'not-allowed',
              }}
            >
              <div style={{ position: 'relative', width: 58, height: 58 }}>
                <div style={{
                  width: 52, height: 52, margin: '3px',
                  borderRadius: '50%',
                  background: isCityUnlocked
                    ? 'radial-gradient(circle, rgba(74,222,128,0.25), rgba(20,26,43,0.9))'
                    : 'rgba(30,30,50,0.8)',
                  border: `3px solid ${isCityUnlocked ? (isSelected ? '#fff' : '#4ade80') : 'rgba(80,80,100,0.4)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: isCityUnlocked ? '1.4rem' : '1rem',
                  opacity: isCityUnlocked ? 1 : 0.4,
                  boxShadow: isSelected
                    ? '0 0 20px rgba(74,222,128,0.5), 0 0 40px rgba(74,222,128,0.3)'
                    : isCityUnlocked
                      ? '0 0 10px rgba(74,222,128,0.3)'
                      : 'none',
                  transition: 'all 0.3s',
                  animation: isSelected ? 'pulse 1.5s infinite' : (isCityUnlocked ? 'glow 3s infinite' : 'none'),
                }}>
                  {isCityUnlocked ? city.icon : '🔒'}
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
                {!isCityUnlocked && city.unlockLevel && (
                  <div style={{ fontSize: '0.5rem', color: 'rgba(150,150,170,0.4)', textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>
                    Lv.{city.unlockLevel}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {heroRoster.filter(h => activeHeroIds.includes(h.id)).map((hero, idx) => {
          const zonePos = cityPositions[currentZone] || locationPositions[currentZone] || locationPositions.verdant_plains;
          const offset = wanderOffsets[hero.id] || { x: 0, y: 0 };
          const baseOffsetX = (idx - 1) * 1.8;
          const baseOffsetY = -2.5 - idx * 1;
          const clampedX = Math.max(4, Math.min(96, zonePos.x + baseOffsetX + offset.x));
          const clampedY = Math.max(8, Math.min(92, zonePos.y + baseOffsetY + offset.y));
          const walk = heroWalking[hero.id];
          const isWalking = walk?.moving;
          const flipX = walk?.flipX;
          return (
            <div key={hero.id} style={{
              position: 'absolute',
              left: `${clampedX}%`,
              top: `${clampedY}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: 5,
              transition: 'left 1.8s ease-in-out, top 1.8s ease-in-out',
            }}>
              <div style={{
                width: 100, height: 100, overflow: 'hidden',
                display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.8))',
              }}>
                <SpriteAnimation
                  spriteData={getPlayerSprite(hero.classId, hero.raceId)}
                  animation={isWalking ? 'walk' : 'idle'}
                  flip={isWalking && flipX}
                  scale={1}
                  speed={isWalking ? 100 : (150 + idx * 30)}
                />
              </div>
              <div style={{
                width: 30, height: 6, borderRadius: '50%', margin: '-2px auto 0',
                background: 'radial-gradient(ellipse, rgba(0,0,0,0.5), transparent)',
              }} />
              <div style={{
                textAlign: 'center',
                fontSize: '0.55rem', color: 'var(--accent)', fontWeight: 700, whiteSpace: 'nowrap',
                textShadow: '0 1px 3px rgba(0,0,0,0.9)', marginTop: 1,
              }}>{hero.name}</div>
            </div>
          );
        })}

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
                zIndex: 25, pointerEvents: 'none',
                background: 'rgba(8,12,28,0.95)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 8, padding: '8px 12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.7)',
                whiteSpace: 'nowrap',
                animation: 'fadeIn 0.1s ease-out',
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff', marginBottom: 2 }}>{loc.name}</div>
                <div style={{ fontSize: '0.6rem', color: 'var(--muted)' }}>
                  Lv.{loc.levelRange[0]}-{loc.levelRange[1]} · {conquer}% conquered
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
                zIndex: 25, pointerEvents: 'none',
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

        {currentDialogue && dialoguePhase > 0 && (() => {
          const activeHeroes = heroRoster.filter(h => activeHeroIds.includes(h.id));
          const speaker1Idx = activeHeroes.findIndex(h => h.id === currentDialogue.speaker1?.id);
          const speaker2Idx = activeHeroes.findIndex(h => h.id === currentDialogue.speaker2?.id);
          const zonePos = cityPositions[currentZone] || locationPositions[currentZone] || locationPositions.verdant_plains;

          const getHeroMapPos = (idx) => {
            const hero = activeHeroes[idx];
            const offset = hero ? (wanderOffsets[hero.id] || { x: 0, y: 0 }) : { x: 0, y: 0 };
            const baseOffsetX = (idx - 1) * 1.8;
            const baseOffsetY = -2.5 - idx * 1;
            return {
              x: Math.max(4, Math.min(96, zonePos.x + baseOffsetX + offset.x)),
              y: Math.max(8, Math.min(92, zonePos.y + baseOffsetY + offset.y)),
            };
          };

          return (
            <>
              {dialoguePhase >= 1 && speaker1Idx >= 0 && (() => {
                const pos = getHeroMapPos(speaker1Idx);
                return (
                  <div style={{
                    position: 'absolute',
                    left: `${Math.max(4, Math.min(82, pos.x))}%`,
                    top: `${Math.max(2, pos.y - 6)}%`,
                    zIndex: 12, pointerEvents: 'none', maxWidth: 160,
                    animation: 'fadeIn 0.4s ease-out',
                    transition: 'left 1.8s ease-in-out, top 1.8s ease-in-out, opacity 0.5s',
                  }}>
                    <div style={{
                      background: 'rgba(14,22,48,0.92)', border: '1px solid rgba(110,231,183,0.3)',
                      borderRadius: 10, padding: '5px 8px',
                      fontSize: '0.5rem', color: '#e2e8f0', lineHeight: 1.4,
                      boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                    }}>
                      <div style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '0.45rem', marginBottom: 2 }}>
                        {currentDialogue.speaker1?.name}
                      </div>
                      {currentDialogue.line1}
                    </div>
                    <div style={{
                      width: 0, height: 0,
                      borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
                      borderTop: '5px solid rgba(14,22,48,0.92)',
                      marginLeft: 12,
                    }} />
                  </div>
                );
              })()}
              {dialoguePhase >= 2 && speaker2Idx >= 0 && (() => {
                const pos = getHeroMapPos(speaker2Idx);
                return (
                  <div style={{
                    position: 'absolute',
                    left: `${Math.max(4, Math.min(82, pos.x + 3))}%`,
                    top: `${Math.max(2, pos.y - 6)}%`,
                    zIndex: 12, pointerEvents: 'none', maxWidth: 160,
                    animation: 'fadeIn 0.4s ease-out',
                    transition: 'left 1.8s ease-in-out, top 1.8s ease-in-out',
                  }}>
                    <div style={{
                      background: 'rgba(14,22,48,0.92)', border: '1px solid rgba(251,191,36,0.3)',
                      borderRadius: 10, padding: '5px 8px',
                      fontSize: '0.5rem', color: '#e2e8f0', lineHeight: 1.4,
                      boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                    }}>
                      <div style={{ fontWeight: 700, color: 'var(--gold)', fontSize: '0.45rem', marginBottom: 2 }}>
                        {currentDialogue.speaker2?.name}
                      </div>
                      {currentDialogue.line2}
                    </div>
                    <div style={{
                      width: 0, height: 0,
                      borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
                      borderTop: '5px solid rgba(14,22,48,0.92)',
                      marginLeft: 12,
                    }} />
                  </div>
                );
              })()}
            </>
          );
        })()}

        {(randomEvents || []).map(event => {
          const pos = locationPositions[event.locationId];
          if (!pos) return null;
          const timeLeft = Math.max(0, Math.floor((event.expiresAt - Date.now()) / 1000));
          const minutes = Math.floor(timeLeft / 60);
          const seconds = timeLeft % 60;
          const spriteData = getEnemySprite('skeleton');

          return (
            <div key={event.id}
              onClick={(e) => {
                e.stopPropagation();
                const rect = mapRef.current?.getBoundingClientRect();
                if (!rect) return;
                const nodeXPx = (pos.x / 100) * rect.width;
                const nodeYPx = (pos.y / 100) * rect.height;
                let mx = nodeXPx + 40;
                let my = pos.y > 40 ? nodeYPx - 280 : nodeYPx + 40;
                if (mx + 260 > rect.width) mx = nodeXPx - 270;
                if (mx < 10) mx = 10;
                if (my < 10) my = 10;
                setMenuPos({ x: mx, y: my });
                setSelectedEvent(event);
                setSelectedLocation(null);
                setSelectedCity(null);
                setCitySubmenu(null);
              }}
              style={{
                position: 'absolute',
                left: `${pos.x + 5}%`, top: `${pos.y - 2}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: 6, cursor: 'pointer',
              }}
            >
              <div style={{
                position: 'relative', width: 56, height: 56,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{
                  position: 'absolute', inset: -6,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${event.color}40, transparent 70%)`,
                  animation: 'eventPulse 1.5s ease-in-out infinite',
                }} />
                <div style={{
                  width: 46, height: 46, borderRadius: '50%',
                  background: `radial-gradient(circle, ${event.color}30, rgba(20,20,40,0.9))`,
                  border: `2px solid ${event.color}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.4rem',
                  boxShadow: `0 0 12px ${event.color}60, 0 0 24px ${event.color}30`,
                  animation: 'eventPulse 1.5s ease-in-out infinite',
                }}>
                  {event.icon}
                </div>
                <div style={{
                  position: 'absolute', right: -16, bottom: -4,
                  width: 32, height: 32, overflow: 'hidden',
                  imageRendering: 'pixelated',
                  filter: `drop-shadow(0 2px 4px rgba(0,0,0,0.8)) hue-rotate(340deg) saturate(2) brightness(0.7)`,
                }}>
                  <SpriteAnimation spriteData={spriteData} animation="idle" scale={0.4} speed={180} />
                </div>
              </div>
              <div style={{
                textAlign: 'center', marginTop: 2, whiteSpace: 'nowrap',
              }}>
                <div style={{
                  fontSize: '0.5rem', fontWeight: 800, color: event.color,
                  textShadow: `0 1px 4px rgba(0,0,0,0.9), 0 0 8px ${event.color}60`,
                  letterSpacing: '0.1em',
                }}>
                  EVENT
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
          );
        })}
      </div>

        {selectedLoc && (
          <div ref={menuRef} style={{
            position: 'absolute',
            left: menuPos.x, top: menuPos.y,
            zIndex: 20,
            background: 'linear-gradient(135deg, rgba(14,22,48,0.97), rgba(20,26,43,0.97))',
            border: `2px solid ${locationIcons[selectedLoc.id]?.color || 'var(--accent)'}`,
            borderRadius: 14,
            padding: 0,
            minWidth: 220,
            maxHeight: '60vh', overflowY: 'auto',
            boxShadow: `0 8px 40px rgba(0,0,0,0.8), 0 0 20px ${locationIcons[selectedLoc.id]?.glow || 'rgba(110,231,183,0.2)'}`,
            animation: 'fadeIn 0.15s ease-out',
          }}>
            <div style={{
              padding: '14px 16px 10px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              background: `linear-gradient(135deg, ${locationIcons[selectedLoc.id]?.glow || 'rgba(0,0,0,0.2)'}, transparent)`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: '1.4rem' }}>{selectedLoc.icon}</span>
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
                    <div style={{ height: 6, background: 'rgba(0,0,0,0.4)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${selConquer}%`, borderRadius: 3,
                        background: selConquer >= 100
                          ? 'linear-gradient(90deg, var(--gold), #ffed4a)'
                          : `linear-gradient(90deg, ${locationIcons[selectedLoc.id]?.color}, ${locationIcons[selectedLoc.id]?.glow})`,
                        transition: 'width 0.3s',
                        boxShadow: selConquer >= 100 ? '0 0 8px rgba(255,215,0,0.5)' : 'none',
                      }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                      <span style={{ fontSize: '0.5rem', color: '#ef4444' }}>XP -{xpMod}%</span>
                      <span style={{ fontSize: '0.5rem', color: '#22c55e' }}>Harvest +{harvestMod}%</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div style={{ padding: '8px' }}>
              <MenuButton
                icon="⚔️" label="Hunt Monsters" sublabel={`Fight Lv.${selectedLoc.levelRange[0]}-${selectedLoc.levelRange[1]} enemies`}
                color="var(--accent)" onClick={() => handleBattle(selectedLoc.id)}
              />

              {selectedLoc.boss && !bossDefeated && (
                <MenuButton
                  icon="👑" label="Challenge Boss" sublabel={`Defeat the ${selectedLoc.boss.replace('_', ' ')}`}
                  color="#ef4444" onClick={() => handleBoss(selectedLoc.id, selectedLoc.boss)}
                  glow
                />
              )}

              {selectedLoc.boss && bossDefeated && (
                <div style={{
                  padding: '8px 12px', margin: '4px 0', borderRadius: 8,
                  background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
                  color: 'var(--success)', fontSize: '0.75rem', textAlign: 'center',
                }}>
                  ✅ Boss Defeated
                </div>
              )}

              <MenuButton
                icon="🏨" label="Rest at Inn" sublabel={`Heal party (${level * 5}g)`}
                color="#60a5fa" onClick={handleRest}
              />

              <MenuButton
                icon="🏕️" label="Visit Location" sublabel="Explore this area"
                color="#c084fc" onClick={() => {
                  enterLocation(selectedLoc.id);
                  setSelectedLocation(null);
                }}
              />

              <MenuButton
                icon="🛒" label="Trade" sublabel="Buy supplies & sell loot"
                color="var(--gold)" onClick={() => {
                  setSelectedLocation(null);
                }}
                disabled
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
          </div>
        )}

        {selectedCity && (() => {
          const city = cities.find(c => c.id === selectedCity);
          if (!city) return null;

          const cityMissions = missionTemplates.filter(m => m.cityId === city.id && level >= m.levelRange[0]);
          const cityArenas = arenaTemplates.filter(a => a.cityId === city.id && level >= a.levelRange[0]);

          return (
            <div ref={menuRef} style={{
              position: 'absolute',
              left: menuPos.x, top: menuPos.y,
              zIndex: 20,
              background: 'linear-gradient(135deg, rgba(14,22,48,0.97), rgba(20,26,43,0.97))',
              border: '2px solid #4ade80',
              borderRadius: 14,
              padding: 0,
              minWidth: 260, maxWidth: 320,
              maxHeight: '60vh', overflowY: 'auto',
              boxShadow: '0 8px 40px rgba(0,0,0,0.8), 0 0 20px rgba(74,222,128,0.3)',
              animation: 'fadeIn 0.15s ease-out',
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
                    icon="📜" label="Missions" sublabel={`${cityMissions.length} mission${cityMissions.length !== 1 ? 's' : ''} available`}
                    color="#c084fc" onClick={() => setCitySubmenu('missions')}
                    disabled={cityMissions.length === 0}
                  />
                  <MenuButton
                    icon="🛒" label="Trade" sublabel="Buy supplies & sell loot"
                    color="var(--gold)" onClick={() => {
                      setCitySubmenu('trade');
                      setTradeTab('buy');
                      if (shopInventory.length === 0) refreshShop();
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
                    icon="🔧" label="Upgrade" sublabel="Enhance equipment tiers"
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
                        <span style={{ color: 'var(--gold)' }}>💰 {arena.rewards.gold}g</span>
                        <span style={{ color: 'var(--accent)' }}>✨ {arena.rewards.xp} XP</span>
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
                            📜 {mission.title}
                          </span>
                          {isCompleted && <span style={{ color: '#22c55e', fontSize: '0.55rem', fontWeight: 600 }}>✓ Done</span>}
                        </div>
                        <div style={{ color: 'var(--muted)', fontSize: '0.65rem', marginBottom: 6, lineHeight: 1.3 }}>{mission.description}</div>
                        <div style={{ display: 'flex', gap: 8, fontSize: '0.55rem', flexWrap: 'wrap' }}>
                          <span style={{ color: 'var(--gold)' }}>💰 {mission.rewards.gold}g</span>
                          <span style={{ color: 'var(--accent)' }}>✨ {mission.rewards.xp} XP</span>
                          <span style={{ color: 'var(--muted)' }}>⚔ {mission.rounds.length} round{mission.rounds.length > 1 ? 's' : ''}</span>
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
                                  <span style={{ fontSize: '1rem', marginRight: 6 }}>{item.icon}</span>
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
                                  {item.icon} {item.name}
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
                                  {item.icon} {item.name}
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
            </div>
          );
        })()}

        {selectedEvent && (
          <div ref={menuRef} style={{
            position: 'absolute',
            left: menuPos.x, top: menuPos.y,
            zIndex: 20,
            background: 'linear-gradient(135deg, rgba(14,22,48,0.97), rgba(20,26,43,0.97))',
            border: `2px solid ${selectedEvent.color}`,
            borderRadius: 14, padding: 0,
            minWidth: 240, maxHeight: '60vh', overflowY: 'auto',
            boxShadow: `0 8px 40px rgba(0,0,0,0.8), 0 0 20px ${selectedEvent.color}40`,
            animation: 'fadeIn 0.15s ease-out',
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
                ⚔ {selectedEvent.enemyCount} enem{selectedEvent.enemyCount === 1 ? 'y' : 'ies'}
              </div>
            </div>
            <div style={{ padding: 8 }}>
              <MenuButton
                icon="⚔️" label="Challenge" sublabel={`Fight Lv.${selectedEvent.level} event`}
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
          </div>
        )}

        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          background: 'linear-gradient(180deg, rgba(10,14,30,0.92) 0%, rgba(10,14,30,0.7) 70%, transparent 100%)',
          padding: '10px 16px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 8, zIndex: 15,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 60, height: 60, overflow: 'hidden' }}>
              <SpriteAnimation spriteData={getPlayerSprite(playerClass, playerRace)} animation="idle" scale={1.8} speed={150} />
            </div>
            <div>
              <div className="font-cinzel" style={{ color: 'var(--accent)', fontSize: '0.9rem', fontWeight: 700 }}>{playerName}</div>
              <div style={{ color: 'var(--muted)', fontSize: '0.65rem' }}>Lv.{level} {raceDef?.name} {cls?.name}</div>
            </div>
            <div style={{ minWidth: 100, marginLeft: 8 }}>
              <HealthBar current={playerHealth} max={playerMaxHealth} color="#22c55e" label="HP" />
              <HealthBar current={playerMana} max={playerMaxMana} color="#3b82f6" label="MP" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{
              background: 'rgba(0,0,0,0.4)', borderRadius: 8, padding: '4px 10px',
              border: '1px solid rgba(255,215,0,0.2)',
            }}>
              <span style={{ color: 'var(--gold)', fontWeight: 600, fontSize: '0.8rem' }}>💰 {gold}</span>
              <span style={{ color: 'var(--muted)', fontSize: '0.6rem', marginLeft: 8 }}>XP: {xp}/{xpToNext}</span>
            </div>

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
            }}>⚔ Council</button>

            <button onClick={() => setShowWarParty(!showWarParty)} style={{
              background: showWarParty ? 'rgba(110,231,183,0.2)' : 'rgba(110,231,183,0.08)',
              border: `1px solid ${showWarParty ? 'var(--accent)' : 'rgba(110,231,183,0.3)'}`,
              borderRadius: 8, padding: '4px 10px', color: 'var(--accent)',
              cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600,
            }}>🛡 Party ({activeHeroIds.length}/3)</button>

            {harvestNodes && harvestNodes.length > 0 && level >= 1 && (
              <button onClick={() => setShowHarvest(!showHarvest)} style={{
                background: showHarvest ? 'rgba(251,191,36,0.2)' : 'rgba(251,191,36,0.08)',
                border: `1px solid ${showHarvest ? 'var(--gold)' : 'rgba(251,191,36,0.3)'}`,
                borderRadius: 8, padding: '4px 10px', color: 'var(--gold)',
                cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600,
              }}>⛏ Harvest</button>
            )}

            <button onClick={() => { setShowGruda(!showGruda); setShowWarParty(false); setShowHarvest(false); setGrudaCopied(null); }} style={{
              background: showGruda ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${showGruda ? 'var(--danger)' : 'rgba(239,68,68,0.3)'}`,
              borderRadius: 8, padding: '4px 10px', color: showGruda ? '#f87171' : '#fca5a5',
              cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600,
            }}>💀 Gruda</button>
            <button onClick={() => setShowDebugGrid(!showDebugGrid)} style={{
              background: showDebugGrid ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${showDebugGrid ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 8, padding: '4px 6px', color: showDebugGrid ? '#fff' : 'rgba(255,255,255,0.3)',
              cursor: 'pointer', fontSize: '0.55rem', fontWeight: 600,
            }}>#</button>
          </div>
        </div>

        <div style={{
          position: 'absolute', top: 80, left: 12, zIndex: 14,
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
                <div style={{ width: 48, height: 48, overflow: 'hidden', flexShrink: 0 }}>
                  <SpriteAnimation spriteData={getPlayerSprite(hero.classId, hero.raceId)} animation="idle" scale={1} speed={180} />
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

        {showWarParty && (
          <div style={{
            position: 'absolute', top: 70, right: 12, zIndex: 16,
            background: 'rgba(14,22,48,0.95)', border: '1px solid var(--border)',
            borderRadius: 12, padding: 14, maxWidth: 340,
            boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
            animation: 'fadeIn 0.15s ease-out',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h4 className="font-cinzel" style={{ color: 'var(--accent)', fontSize: '0.85rem', margin: 0 }}>
                War Party ({activeHeroIds.length}/3)
              </h4>
              {canCreateNewHero && (
                <button onClick={() => setScreen('heroCreate')} style={{
                  background: 'linear-gradient(135deg, rgba(255,215,0,0.3), rgba(255,215,0,0.1))',
                  border: '1px solid var(--gold)', borderRadius: 6, padding: '3px 10px',
                  color: 'var(--gold)', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 700,
                }}>+ Recruit</button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {heroRoster.map(hero => {
                const heroCls = classDefinitions[hero.classId];
                const heroRace = hero.raceId ? raceDefinitions[hero.raceId] : null;
                const isActive = activeHeroIds.includes(hero.id);
                const heroStats = heroCls ? getHeroStatsWithBonuses(hero) : null;
                return (
                  <div key={hero.id} onClick={() => toggleHeroActive(hero.id)} style={{
                    background: isActive
                      ? 'linear-gradient(135deg, rgba(110,231,183,0.15), rgba(110,231,183,0.05))'
                      : 'rgba(42,49,80,0.3)',
                    border: `2px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 8, padding: '6px 8px', cursor: 'pointer',
                    transition: 'all 0.2s', minWidth: 90, textAlign: 'center',
                    opacity: isActive ? 1 : 0.6,
                  }}>
                    <SpriteAnimation spriteData={getPlayerSprite(hero.classId, hero.raceId)} animation="idle" scale={1.4} speed={150} />
                    <div style={{ fontSize: '0.6rem', fontWeight: 700, color: isActive ? 'var(--accent)' : 'var(--muted)', marginTop: 2 }}>
                      {hero.name}
                    </div>
                    <div style={{ fontSize: '0.5rem', color: 'var(--muted)' }}>
                      Lv.{hero.level} {heroRace?.name} {heroCls?.name}
                    </div>
                    {heroStats && (
                      <div style={{ marginTop: 3, height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(hero.currentHealth / heroStats.health) * 100}%`, background: '#22c55e', borderRadius: 2 }} />
                      </div>
                    )}
                    <div style={{ fontSize: '0.45rem', marginTop: 2, color: isActive ? 'var(--accent)' : 'var(--muted)', fontWeight: 600 }}>
                      {isActive ? 'ACTIVE' : 'RESERVE'}
                    </div>
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
          </div>
        )}

        {showHarvest && harvestNodes && (
          <div style={{
            position: 'absolute', top: 70, right: 12, zIndex: 16,
            background: 'rgba(14,22,48,0.95)', border: '1px solid var(--border)',
            borderRadius: 12, padding: 14, maxWidth: 360,
            boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
            animation: 'fadeIn 0.15s ease-out',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h4 className="font-cinzel" style={{ color: 'var(--gold)', fontSize: '0.85rem', margin: 0 }}>Auto Harvest</h4>
              <div style={{ display: 'flex', gap: 6, fontSize: '0.6rem' }}>
                {Object.entries(harvestResources).filter(([k, v]) => v > 0 || k === 'gold').map(([k, v]) => (
                  <span key={k} style={{ background: 'rgba(0,0,0,0.4)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)', color: 'var(--muted)' }}>
                    {k === 'gold' ? '💰' : k === 'herbs' ? '🌿' : k === 'wood' ? '🪵' : k === 'ore' ? '🪨' : '💎'} {Math.floor(v)}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              {harvestNodes.filter(n => level >= n.unlockLevel).map(node => {
                const assignedHeroId = activeHarvests[node.id];
                const assignedHero = assignedHeroId ? heroRoster.find(h => h.id === assignedHeroId) : null;
                const availableHeroes = heroRoster.filter(h =>
                  !activeHeroIds.includes(h.id) && !Object.values(activeHarvests).includes(h.id)
                );
                return (
                  <div key={node.id} style={{
                    background: assignedHero ? 'rgba(34,197,94,0.08)' : 'rgba(42,49,80,0.3)',
                    border: `1px solid ${assignedHero ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`,
                    borderRadius: 6, padding: '8px 10px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: '1rem' }}>{node.icon}</span>
                      <div>
                        <div style={{ color: 'var(--text)', fontSize: '0.7rem', fontWeight: 600 }}>{node.name}</div>
                        <div style={{ color: 'var(--muted)', fontSize: '0.5rem' }}>+{node.baseRate} {node.resource}/s</div>
                      </div>
                    </div>
                    {assignedHero ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <SpriteAnimation spriteData={getPlayerSprite(assignedHero.classId, assignedHero.raceId)} animation="idle" scale={1.0} speed={200} />
                          <span style={{ color: 'var(--accent)', fontSize: '0.6rem', fontWeight: 600 }}>{assignedHero.name}</span>
                        </div>
                        <button onClick={() => recallHarvest(node.id)} style={{
                          background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                          borderRadius: 4, padding: '2px 6px', color: '#ef4444', cursor: 'pointer', fontSize: '0.55rem',
                        }}>Recall</button>
                      </div>
                    ) : (
                      <div>
                        {availableHeroes.length > 0 ? (
                          <select
                            onChange={(e) => { if (e.target.value) assignHarvest(node.id, e.target.value); e.target.value = ''; }}
                            defaultValue=""
                            style={{
                              background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border)',
                              borderRadius: 4, padding: '3px 6px', color: 'var(--text)',
                              fontSize: '0.6rem', width: '100%', cursor: 'pointer',
                            }}
                          >
                            <option value="">Assign hero...</option>
                            {availableHeroes.map(h => (
                              <option key={h.id} value={h.id}>{h.name} (Lv.{h.level})</option>
                            ))}
                          </select>
                        ) : (
                          <div style={{ color: 'var(--muted)', fontSize: '0.55rem', fontStyle: 'italic' }}>No idle heroes</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 6, color: 'var(--muted)', fontSize: '0.5rem', fontStyle: 'italic' }}>
              Assign reserve heroes to gather resources.
            </div>
          </div>
        )}

        {showGruda && (
          <div style={{
            position: 'absolute', top: 70, right: 12, zIndex: 16,
            background: 'rgba(14,22,48,0.95)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 12, padding: 14, maxWidth: 380, width: 360,
            boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
            animation: 'fadeIn 0.15s ease-out',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h4 className="font-cinzel" style={{ color: '#f87171', fontSize: '0.85rem', margin: 0 }}>
                💀 Gruda Arena
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
                ⚔ Play Gruda
              </button>
            </div>

            <div style={{ marginTop: 10, padding: '6px 8px', background: 'rgba(0,0,0,0.2)', borderRadius: 6, fontSize: '0.5rem', color: 'var(--muted)' }}>
              Share the link or code with anyone. Full hero builds including equipment, skills, and loadouts are encoded. They can paste it into the Gruda Arena page to fight with your heroes against AI enemies.
            </div>
          </div>
        )}

        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(0deg, rgba(8,10,24,0.95) 0%, rgba(8,10,24,0.85) 60%, rgba(8,10,24,0.4) 85%, transparent 100%)',
          backdropFilter: 'blur(4px)',
          padding: '16px 20px 10px',
          borderTop: '1px solid rgba(255,215,0,0.15)',
          zIndex: 15,
        }}>
          <div style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, flexWrap: 'wrap',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'rgba(255,215,0,0.08)', borderRadius: 8, padding: '4px 10px',
              border: '1px solid rgba(255,215,0,0.2)',
            }}>
              <span style={{ fontSize: '0.85rem' }}>🏆</span>
              <div>
                <div style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '0.8rem' }}>{victories}</div>
                <div style={{ color: 'var(--muted)', fontSize: '0.45rem', letterSpacing: '0.05em' }}>VICTORIES</div>
              </div>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'rgba(251,191,36,0.08)', borderRadius: 8, padding: '4px 10px',
              border: '1px solid rgba(251,191,36,0.2)',
            }}>
              <span style={{ fontSize: '0.85rem' }}>⭐</span>
              <div>
                <div style={{ color: 'var(--gold)', fontWeight: 700, fontSize: '0.8rem' }}>{level}</div>
                <div style={{ color: 'var(--muted)', fontSize: '0.45rem', letterSpacing: '0.05em' }}>LEVEL</div>
              </div>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'rgba(251,191,36,0.08)', borderRadius: 8, padding: '4px 10px',
              border: '1px solid rgba(251,191,36,0.2)',
            }}>
              <span style={{ fontSize: '0.85rem' }}>💰</span>
              <div>
                <div style={{ color: 'var(--gold)', fontWeight: 700, fontSize: '0.8rem' }}>{gold}</div>
                <div style={{ color: 'var(--muted)', fontSize: '0.45rem', letterSpacing: '0.05em' }}>GOLD</div>
              </div>
            </div>

            <div style={{ width: 1, height: 28, background: 'rgba(255,215,0,0.2)' }} />

            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'rgba(110,231,183,0.06)', borderRadius: 8, padding: '4px 10px',
              border: '1px solid rgba(110,231,183,0.15)',
            }}>
              <span style={{ fontSize: '0.7rem' }}>📍</span>
              <div>
                <div style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '0.65rem' }}>
                  {locations.find(l => l.id === currentZone)?.name || cities.find(c => c.id === currentZone)?.name || 'Unknown'}
                </div>
                <div style={{ color: 'var(--muted)', fontSize: '0.45rem', letterSpacing: '0.05em' }}>ZONE</div>
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
            0%, 100% { opacity: 0.4; }
            50% { opacity: 1; }
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
        `}</style>

      <div style={{
        position: 'absolute', bottom: 60, right: 12, zIndex: 30,
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

function MenuButton({ icon, label, sublabel, color, onClick, glow, disabled }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        width: '100%', padding: '10px 12px', margin: '3px 0',
        background: disabled ? 'rgba(40,40,60,0.3)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${disabled ? 'rgba(80,80,100,0.2)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 8, cursor: disabled ? 'not-allowed' : 'pointer',
        color: disabled ? 'rgba(150,150,170,0.4)' : '#fff',
        fontSize: '0.8rem', fontWeight: 600, textAlign: 'left',
        transition: 'all 0.15s',
        animation: glow ? 'glow 2s infinite' : 'none',
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.background = `${color}22`; e.currentTarget.style.borderColor = color; }}}
      onMouseLeave={e => { if (!disabled) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}}
    >
      <span style={{ fontSize: '1.1rem' }}>{icon}</span>
      <div>
        <div style={{ color: disabled ? 'rgba(150,150,170,0.4)' : color }}>{label}</div>
        {sublabel && <div style={{ fontSize: '0.6rem', color: 'var(--muted)', fontWeight: 400 }}>
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
