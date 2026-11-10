const trazo = 1.75;

export function IconoUsuario({ tamano = 20 }: { tamano?: number }) {
  return (
    <svg width={tamano} height={tamano} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="9" r="3.35" stroke="currentColor" strokeWidth={trazo} />
      <path
        d="M5.5 19.25c1.4-2.8 3.7-4.25 6.5-4.25s5.1 1.45 6.5 4.25"
        stroke="currentColor"
        strokeWidth={trazo}
        strokeLinecap="round"
      />
    </svg>
  );
}
