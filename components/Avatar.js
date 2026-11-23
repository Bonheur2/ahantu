export function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join("").toUpperCase();
}

export default function Avatar({ name, size }) {
  return <span className="avatar" style={size ? { width: size, height: size } : undefined}>{initials(name)}</span>;
}
