'use client';

import { useEffect, useState } from 'react';

export default function CursorGlow() {
  const [position, setPosition] = useState({ x: 0, y: 0, visible: false });

  useEffect(() => {
    const handleMove = (event: PointerEvent) => {
      setPosition({
        x: event.clientX,
        y: event.clientY,
        visible: true,
      });
    };

    const handleLeave = () => setPosition((current) => ({ ...current, visible: false }));

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerleave', handleLeave);

    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerleave', handleLeave);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
      style={{
        opacity: position.visible ? 1 : 0,
        background: `radial-gradient(520px circle at ${position.x}px ${position.y}px, rgba(6, 182, 212, 0.16), transparent 36%)`,
      }}
    />
  );
}
