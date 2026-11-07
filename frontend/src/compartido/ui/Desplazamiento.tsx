import { useEffect, useRef, useState } from 'react';

const MIN_PULGAR = 36;
const MARGEN_ARRIBA = 120;

function medidas() {
  const vista = window.innerHeight;
  const total = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
  const max = Math.max(0, total - vista);
  return { vista, total, max };
}

function IconoBajar() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6.5 10.5 12 16l5.5-5.5M12 16V5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Desplazamiento() {
  const pistaRef = useRef<HTMLDivElement>(null);
  const arrastre = useRef<{ inicioY: number; scrollInicio: number } | null>(null);
  const ocultarId = useRef<number | null>(null);

  const [activo, setActivo] = useState(false);
  const [hover, setHover] = useState(false);
  const [pulgar, setPulgar] = useState({ alto: MIN_PULGAR, top: 0, visible: false });
  const [mostrarBajar, setMostrarBajar] = useState(false);

  useEffect(() => {
    function sincronizar() {
      const { vista, total, max } = medidas();
      const necesita = max > 8;
      if (!necesita) {
        setPulgar((p) => ({ ...p, visible: false }));
        setMostrarBajar(false);
        return;
      }

      const pista = pistaRef.current?.clientHeight ?? vista - 32;
      const alto = Math.max(MIN_PULGAR, (vista / total) * pista);
      const top = max === 0 ? 0 : (window.scrollY / max) * (pista - alto);
      setPulgar({ alto, top, visible: true });
      setMostrarBajar(window.scrollY < MARGEN_ARRIBA && max > MARGEN_ARRIBA);
    }

    function alScroll() {
      sincronizar();
      setActivo(true);
      if (ocultarId.current) window.clearTimeout(ocultarId.current);
      ocultarId.current = window.setTimeout(() => setActivo(false), 900);
    }

    sincronizar();
    window.addEventListener('scroll', alScroll, { passive: true });
    window.addEventListener('resize', sincronizar);
    const ro = new ResizeObserver(sincronizar);
    ro.observe(document.documentElement);
    return () => {
      window.removeEventListener('scroll', alScroll);
      window.removeEventListener('resize', sincronizar);
      ro.disconnect();
      if (ocultarId.current) window.clearTimeout(ocultarId.current);
    };
  }, []);

  useEffect(() => {
    function alMover(evento: PointerEvent) {
      if (!arrastre.current || !pistaRef.current) return;
      const { vista, total, max } = medidas();
      if (max <= 0) return;
      const pista = pistaRef.current.clientHeight;
      const alto = Math.max(MIN_PULGAR, (vista / total) * pista);
      const recorrido = pista - alto;
      if (recorrido <= 0) return;
      const delta = evento.clientY - arrastre.current.inicioY;
      const siguiente = arrastre.current.scrollInicio + (delta / recorrido) * max;
      window.scrollTo({ top: Math.min(max, Math.max(0, siguiente)) });
    }

    function alSoltar() {
      arrastre.current = null;
      document.body.style.userSelect = '';
    }

    window.addEventListener('pointermove', alMover);
    window.addEventListener('pointerup', alSoltar);
    window.addEventListener('pointercancel', alSoltar);
    return () => {
      window.removeEventListener('pointermove', alMover);
      window.removeEventListener('pointerup', alSoltar);
      window.removeEventListener('pointercancel', alSoltar);
    };
  }, []);

  function alPista(evento: React.PointerEvent<HTMLDivElement>) {
    if (!pistaRef.current || (evento.target as HTMLElement).dataset.pulgar) return;
    const { vista, total, max } = medidas();
    if (max <= 0) return;
    const pista = pistaRef.current.clientHeight;
    const alto = Math.max(MIN_PULGAR, (vista / total) * pista);
    const rect = pistaRef.current.getBoundingClientRect();
    const y = evento.clientY - rect.top - alto / 2;
    const recorrido = pista - alto;
    const ratio = recorrido <= 0 ? 0 : Math.min(1, Math.max(0, y / recorrido));
    window.scrollTo({ top: ratio * max, behavior: 'smooth' });
  }

  function alPulgar(evento: React.PointerEvent<HTMLDivElement>) {
    evento.preventDefault();
    evento.stopPropagation();
    arrastre.current = { inicioY: evento.clientY, scrollInicio: window.scrollY };
    document.body.style.userSelect = 'none';
    setActivo(true);
  }

  const resaltado = activo || hover;

  return (
    <>
      {pulgar.visible && (
        <div
          className={`sc-scroll-rail ${resaltado ? 'sc-scroll-rail-activo' : ''}`}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          aria-hidden
        >
          <div ref={pistaRef} className="sc-scroll-pista" onPointerDown={alPista}>
            <div
              data-pulgar="1"
              className="sc-scroll-pulgar"
              style={{ height: pulgar.alto, transform: `translateY(${pulgar.top}px)` }}
              onPointerDown={alPulgar}
            />
          </div>
        </div>
      )}

      {mostrarBajar && (
        <button
          type="button"
          className="sc-scroll-bajar sc-glass-strong"
          aria-label="Ir al final"
          title="Ir al final"
          onClick={() => {
            const { max } = medidas();
            window.scrollTo({ top: max, behavior: 'smooth' });
          }}
        >
          <IconoBajar />
        </button>
      )}
    </>
  );
}
