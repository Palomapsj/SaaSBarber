import { Icon, type IconProps } from "./Icon";

export function TagIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20.59 13.41L13.41 20.59a2 2 0 01-2.82 0l-8.18-8.18A2 2 0 012 11V4a2 2 0 012-2h7a2 2 0 011.41.59l8.18 8.18a2 2 0 010 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </Icon>
  );
}
