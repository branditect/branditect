import Icon, { type IconName } from "@/components/icon";

const TINTS = {
  1: "bg-tint-1",
  2: "bg-tint-2",
  3: "bg-tint-3",
  4: "bg-tint-4",
  5: "bg-tint-5",
  neutral: "bg-tile",
} as const;

interface IconTileProps {
  icon: IconName;
  size?: 28 | 30 | 36;
  /**
   * Step down the ladder in order within a list — that's what makes a column
   * of these read as a set rather than a stripe of identical squares.
   */
  tint?: keyof typeof TINTS;
}

export default function IconTile({ icon, size = 30, tint = 1 }: IconTileProps) {
  return (
    <span
      className={`${TINTS[tint]} grid shrink-0 place-items-center rounded-[9px] text-accent`}
      style={{ width: size, height: size }}
    >
      <Icon name={icon} size={Math.round(size * 0.57)} />
    </span>
  );
}
