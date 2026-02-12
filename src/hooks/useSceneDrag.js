import { useState, useEffect, useRef } from 'react';

export function useAdminMode() {
  const [admin, setAdmin] = useState(!!window.__adminGizmoEnabled);
  useEffect(() => {
    const handler = () => setAdmin(!!window.__adminGizmoEnabled);
    window.addEventListener('adminModeChange', handler);
    return () => window.removeEventListener('adminModeChange', handler);
  }, []);
  return admin;
}

export function useDraggableNodes(initialPositions) {
  const adminMode = useAdminMode();
  const [positions, setPositions] = useState(() => {
    const map = {};
    initialPositions.forEach(n => { map[n.id] = { x: n.x, y: n.y }; });
    return map;
  });
  const dragging = useRef(null);
  const containerRef = useRef(null);

  const onMouseDown = (id, e) => {
    if (!adminMode) return;
    e.preventDefault();
    e.stopPropagation();
    dragging.current = id;
  };

  useEffect(() => {
    if (!adminMode) return;
    const onMove = (e) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setPositions(prev => ({ ...prev, [dragging.current]: { x: Math.round(x), y: Math.round(y) } }));
    };
    const onUp = () => {
      if (dragging.current) {
        const id = dragging.current;
        const pos = positions[id];
        if (pos) console.log(`[SceneNode] ${id}: x=${pos.x}, y=${pos.y}`);
      }
      dragging.current = null;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [adminMode, positions]);

  return { positions, onMouseDown, containerRef, adminMode };
}
