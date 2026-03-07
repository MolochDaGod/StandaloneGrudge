import { useState, useEffect, useRef, useCallback } from 'react';

const MOVE_SPEED = 1.2;
const TICK_MS = 30;
const INTERACT_RANGE = 12;

export default function useWASD(spawnPos, nodes = [], onInteract) {
  const [heroX, setHeroX] = useState(spawnPos.x);
  const [heroY, setHeroY] = useState(spawnPos.y);
  const [walking, setWalking] = useState(false);
  const [facingLeft, setFacingLeft] = useState(false);
  const [nearbyNode, setNearbyNode] = useState(null);
  const keysDown = useRef(new Set());
  const loopRef = useRef(null);
  const posRef = useRef({ x: spawnPos.x, y: spawnPos.y });
  const nodesRef = useRef(nodes);
  const onInteractRef = useRef(onInteract);

  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { onInteractRef.current = onInteract; }, [onInteract]);

  const findNearby = useCallback((px, py) => {
    let closest = null;
    let closestDist = INTERACT_RANGE;
    for (const n of nodesRef.current) {
      const dx = px - n.x;
      const dy = py - n.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < closestDist) {
        closestDist = dist;
        closest = n;
      }
    }
    return closest;
  }, []);

  useEffect(() => {
    const onDown = (e) => {
      const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
        e.preventDefault();
        keysDown.current.add(k);
      }
      if (k === 'e') {
        e.preventDefault();
        const near = findNearby(posRef.current.x, posRef.current.y);
        if (near && onInteractRef.current) {
          onInteractRef.current(near);
        }
      }
    };
    const onUp = (e) => {
      keysDown.current.delete(e.key.toLowerCase());
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [findNearby]);

  useEffect(() => {
    loopRef.current = setInterval(() => {
      const keys = keysDown.current;
      let dx = 0, dy = 0;
      if (keys.has('a') || keys.has('arrowleft')) dx -= MOVE_SPEED;
      if (keys.has('d') || keys.has('arrowright')) dx += MOVE_SPEED;
      if (keys.has('w') || keys.has('arrowup')) dy -= MOVE_SPEED;
      if (keys.has('s') || keys.has('arrowdown')) dy += MOVE_SPEED;

      if (dx !== 0 || dy !== 0) {
        const newX = Math.max(5, Math.min(95, posRef.current.x + dx));
        const newY = Math.max(10, Math.min(90, posRef.current.y + dy));
        posRef.current = { x: newX, y: newY };
        setHeroX(newX);
        setHeroY(newY);
        setWalking(true);
        if (dx < 0) setFacingLeft(true);
        else if (dx > 0) setFacingLeft(false);
      } else {
        setWalking(false);
      }

      const near = findNearby(posRef.current.x, posRef.current.y);
      setNearbyNode(near);
    }, TICK_MS);

    return () => clearInterval(loopRef.current);
  }, [findNearby]);

  const walkTo = useCallback((targetX, targetY, callback) => {
    setFacingLeft(targetX < posRef.current.x);
    posRef.current = { x: targetX, y: targetY };
    setHeroX(targetX);
    setHeroY(targetY);
    setWalking(true);
    setTimeout(() => {
      setWalking(false);
      if (callback) callback();
    }, 500);
  }, []);

  return { heroX, heroY, walking, facingLeft, nearbyNode, walkTo, setFacingLeft };
}
