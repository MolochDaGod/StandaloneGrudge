import React from 'react';
import { getAbilityIcon } from '../data/abilityIcons';
import { InlineIcon } from '../data/uiSprites';

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
          borderRadius: 2,
          objectFit: 'cover',
          imageRendering: 'auto',
          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.6))',
          ...style,
        }}
      />
    );
  }
  return <InlineIcon name={ability.icon} size={size * 0.7} style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.6))', ...style }} />;
}
