import React from "react";

interface SelectionBoxProps {
  start: { x: number; y: number } | null;
  end: { x: number; y: number } | null;
}

const SelectionBox: React.FC<SelectionBoxProps> = ({ start, end }) => {
  if (!start || !end) return null;

  const left = Math.min(start.x, end.x);
  const top = Math.min(start.y, end.y);
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);

  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width,
        height,
        backgroundColor: "rgba(59, 130, 246, 0.2)", // tailwind's blue-500 @ 20%
        border: "1px solid rgba(59, 130, 246, 0.6)",
        pointerEvents: "none",
        zIndex: 50,
      }}
    />
  );
};

export default SelectionBox;
