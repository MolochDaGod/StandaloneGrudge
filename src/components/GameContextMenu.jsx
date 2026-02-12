import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import useGameStore from '../stores/gameStore';
import { InlineIcon } from '../data/uiSprites.jsx';
import { CONTEXT_MENU } from '../constants/layers';

const MENU_ITEMS = {
  world: [
    { id: 'camp', label: 'Visit Camp', icon: 'campfire', action: (store) => store.enterScene('camp', 'world') },
    { id: 'character', label: 'Character Sheet', icon: 'chart', action: (store) => store.setScreen('character') },
    { id: 'skills', label: 'Skill Tree', icon: 'sparkle', action: (store) => store.setScreen('skills') },
    { id: 'account', label: 'Account', icon: 'scroll', action: (store) => store.setScreen('account') },
    { divider: true },
    { id: 'save', label: 'Quick Save', icon: 'shield', action: () => {
      try { localStorage.setItem('grudge-quicksave', Date.now().toString()); } catch(e) {}
    }},
  ],
  battle: [
    { id: 'battleLog', label: 'Battle Log', icon: 'scroll', action: () => {} },
    { id: 'abilities', label: 'View Abilities', icon: 'energy', action: () => {} },
    { divider: true },
    { id: 'retreat', label: 'Retreat', icon: 'skull', color: '#ef4444', action: (store) => store.returnToWorld() },
  ],
  location: [
    { id: 'explore', label: 'Explore Area', icon: 'compass', action: () => {} },
    { id: 'character', label: 'Character Sheet', icon: 'chart', action: (store) => store.setScreen('character') },
    { id: 'returnMap', label: 'Return to Map', icon: 'compass', action: (store) => store.setScreen('world') },
  ],
  scene: [
    { id: 'character', label: 'Character Sheet', icon: 'chart', action: (store) => store.setScreen('character') },
    { id: 'skills', label: 'Skill Tree', icon: 'sparkle', action: (store) => store.setScreen('skills') },
    { divider: true },
    { id: 'exitScene', label: 'Leave Scene', icon: 'compass', action: (store) => store.exitScene() },
  ],
  title: [],
  lobby: [],
  intro: [],
  create: [],
  heroCreate: [],
  training: [
    { id: 'skip', label: 'Continue Training', icon: 'sword', action: () => {} },
  ],
  account: [
    { id: 'returnMap', label: 'Return to Map', icon: 'compass', action: (store) => store.setScreen('world') },
  ],
  character: [
    { id: 'returnMap', label: 'Return to Map', icon: 'compass', action: (store) => store.setScreen('world') },
    { id: 'skills', label: 'Skill Tree', icon: 'sparkle', action: (store) => store.setScreen('skills') },
  ],
  skills: [
    { id: 'returnMap', label: 'Return to Map', icon: 'compass', action: (store) => store.setScreen('world') },
    { id: 'character', label: 'Character Sheet', icon: 'chart', action: (store) => store.setScreen('character') },
  ],
};

let contextMenuState = {
  visible: false,
  x: 0,
  y: 0,
  items: [],
  listeners: new Set(),
};

function notifyContextMenu() {
  contextMenuState.listeners.forEach(fn => fn({ ...contextMenuState }));
}

export function showContextMenu(x, y, items) {
  contextMenuState.visible = true;
  contextMenuState.x = x;
  contextMenuState.y = y;
  contextMenuState.items = items;
  notifyContextMenu();
}

export function hideContextMenu() {
  contextMenuState.visible = false;
  contextMenuState.items = [];
  notifyContextMenu();
}

export default function GameContextMenuRenderer() {
  const [state, setState] = useState({ visible: false, x: 0, y: 0, items: [] });
  const menuRef = useRef(null);
  const [pos, setPos] = useState({ left: 0, top: 0 });
  const screen = useGameStore(s => s.screen);
  const store = useGameStore.getState;

  useEffect(() => {
    const handler = (s) => setState(s);
    contextMenuState.listeners.add(handler);
    return () => contextMenuState.listeners.delete(handler);
  }, []);

  const handleContextMenu = useCallback((e) => {
    e.preventDefault();

    if (e.target.closest('input, textarea, select')) return;
    if (e.__nodeHandled) return;

    const currentScreen = useGameStore.getState().screen;
    const items = MENU_ITEMS[currentScreen] || [];
    if (items.length === 0) return;

    showContextMenu(e.clientX, e.clientY, items);
  }, []);

  useEffect(() => {
    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, [handleContextMenu]);

  useEffect(() => {
    if (!state.visible) return;
    const handleClose = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        hideContextMenu();
      }
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') hideContextMenu();
    };
    const handleScroll = () => hideContextMenu();

    document.addEventListener('mousedown', handleClose);
    document.addEventListener('keydown', handleEsc);
    document.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClose);
      document.removeEventListener('keydown', handleEsc);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [state.visible]);

  useEffect(() => {
    if (!state.visible || !menuRef.current) return;
    const el = menuRef.current;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const pad = 8;

    let left = state.x;
    let top = state.y;

    if (left + rect.width + pad > vw) left = vw - rect.width - pad;
    if (left < pad) left = pad;
    if (top + rect.height + pad > vh) top = vh - rect.height - pad;
    if (top < pad) top = pad;

    setPos({ left, top });
  }, [state]);

  useEffect(() => {
    if (state.visible) hideContextMenu();
  }, [screen]);

  if (!state.visible || state.items.length === 0) return null;

  const handleItemClick = (item) => {
    if (item.divider) return;
    hideContextMenu();
    if (item.action) item.action(useGameStore.getState());
  };

  return createPortal(
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: pos.left,
        top: pos.top,
        zIndex: CONTEXT_MENU,
        minWidth: 180,
        background: 'linear-gradient(160deg, rgba(18,14,10,0.97) 0%, rgba(28,22,16,0.97) 40%, rgba(20,16,12,0.97) 100%)',
        border: '1px solid rgba(180,150,90,0.45)',
        borderRadius: 6,
        padding: '4px 0',
        boxShadow: '0 8px 32px rgba(0,0,0,0.9), 0 0 1px rgba(180,150,90,0.4), inset 0 1px 0 rgba(255,215,0,0.06)',
        fontFamily: "'Jost', sans-serif",
        backdropFilter: 'blur(12px)',
        animation: 'fadeIn 0.12s ease-out',
        userSelect: 'none',
      }}
    >
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, height: 1,
        background: 'linear-gradient(90deg, transparent 5%, rgba(255,215,0,0.25) 50%, transparent 95%)',
      }} />
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0, height: 1,
        background: 'linear-gradient(90deg, transparent 10%, rgba(180,150,90,0.15) 50%, transparent 90%)',
      }} />

      {state.items.map((item, i) => {
        if (item.divider) {
          return (
            <div key={`div_${i}`} style={{
              height: 1,
              margin: '4px 12px',
              background: 'linear-gradient(90deg, transparent, rgba(180,150,90,0.25), transparent)',
            }} />
          );
        }

        return (
          <div
            key={item.id}
            onClick={() => handleItemClick(item)}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,215,0,0.08)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
            }}
            onMouseDown={e => {
              e.currentTarget.style.background = 'rgba(255,215,0,0.15)';
              e.currentTarget.style.transform = 'scale(0.98)';
            }}
            onMouseUp={e => {
              e.currentTarget.style.background = 'rgba(255,215,0,0.08)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '7px 16px',
              cursor: 'pointer',
              transition: 'background 0.1s, transform 0.08s',
              color: item.color || '#d4cfc4',
            }}
          >
            <span style={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <InlineIcon name={item.icon} size={16} />
            </span>
            <span style={{
              fontSize: '0.78rem',
              fontWeight: 500,
              letterSpacing: '0.01em',
              fontFamily: "'Cinzel', serif",
            }}>
              {item.label}
            </span>
          </div>
        );
      })}
    </div>,
    document.body
  );
}
