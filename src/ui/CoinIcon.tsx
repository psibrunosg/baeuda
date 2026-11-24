export function CoinIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      <circle cx="12" cy="12" r="10" fill="#F59E0B" stroke="#B45309" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="7.2" fill="#FCD34D" />
      <path
        d="M12 6.8L13.55 10.05L17.1 10.5L14.5 12.95L15.15 16.45L12 14.75L8.85 16.45L9.5 12.95L6.9 10.5L10.45 10.05L12 6.8Z"
        fill="#D97706"
      />
    </svg>
  );
}
