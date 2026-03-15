import React, { useState } from 'react';

const LINKS = [
  { label: 'Character Builder', desc: 'Create & manage characters', href: 'https://grudge-builder.vercel.app/character', color: '#DB6331' },
  { label: 'Crafting Suite', desc: 'Forge weapons & armor', href: 'https://warlord-crafting-suite.vercel.app', color: '#FAAC47' },
  { label: 'Object Store', desc: 'Game assets & sprites', href: 'https://molochdagod.github.io/ObjectStore/', color: '#6ee7b7' },
  { label: 'Arena', desc: 'Ranked PvP battles', href: '/play#arena', color: '#3b82f6' },
  { label: 'Compendium', desc: 'Game data reference', href: '/compendium.html', color: '#a78bfa' },
  { label: 'Hero Codex', desc: 'All 26 playable heroes', href: '/hero-codex.html', color: '#f97316' },
  { label: 'Discord', desc: 'Join the community', href: 'https://discord.gg/KmAC5aXs84', color: '#5865F2', external: true },
];

function LinkCard({ link }) {
  const [hovered, setHovered] = useState(false);
  const isExternal = link.external || link.href.startsWith('http');

  return (
    <a
      href={link.href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      style={{
        textDecoration: 'none',
        background: hovered ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${hovered ? link.color + '55' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 10, padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
        transition: 'all 0.2s', cursor: 'pointer',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        width: 8, height: 8, borderRadius: '50%',
        background: link.color, flexShrink: 0,
        boxShadow: hovered ? `0 0 10px ${link.color}66` : 'none',
        transition: 'box-shadow 0.2s',
      }} />
      <div>
        <div style={{
          fontFamily: "'Cinzel', serif", fontSize: '0.8rem',
          color: hovered ? link.color : '#e8dcc8', fontWeight: 600,
          transition: 'color 0.2s',
        }}>
          {link.label}
        </div>
        <div style={{
          fontFamily: "'Jost', sans-serif", fontSize: '0.65rem',
          color: 'rgba(255,255,255,0.35)', marginTop: 1,
        }}>
          {link.desc}
        </div>
      </div>
    </a>
  );
}

export default function QuickLinks() {
  return (
    <div>
      <div style={{
        fontFamily: "'Cinzel', serif", fontSize: '0.85rem',
        color: '#d4a96a', fontWeight: 600, letterSpacing: 2,
        marginBottom: 12, textTransform: 'uppercase',
      }}>
        Grudge Studio
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: 8,
      }}>
        {LINKS.map(link => <LinkCard key={link.label} link={link} />)}
      </div>
    </div>
  );
}
