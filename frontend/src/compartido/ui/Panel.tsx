type Props = {
  children: React.ReactNode;
  className?: string;
  /** Conservado por compatibilidad; el estilo es el mismo (sc-card). */
  strong?: boolean;
};

export function Panel({ children, className = '' }: Props) {
  return <section className={`sc-card rounded-[1.75rem] p-5 md:p-6 ${className}`}>{children}</section>;
}
