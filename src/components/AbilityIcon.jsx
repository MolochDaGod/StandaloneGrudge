import React from 'react';
import { getAbilityIcon } from '../data/abilityIcons';

export default function AbilityIcon({ ability, size = 24, style = {} }) {
  if (!ability) return null;
  const iconSrc = getAbilityIcon(ability.id);
  if (iconSrc) {
    return (
      <img
        src={iconSrc}
        alt={ability.name}
        style={{
          width: size,
          height: size,
          borderRadius: 4,
          objectFit: 'cover',
          imageRendering: 'auto',
          ...style,
        }}
      />
    );
  }
  return <span style={{ fontSize: size * 0.7, lineHeight: 1, ...style }}>{ability.icon}</span>;
}
