type Props = {
  children: React.ReactNode;
  className?: string;
  strong?: boolean;
};

export function Panel({ children, className = '', strong }: Props) {
  return (
    <section
      className={`${strong ? 'sc-glass-strong' : 'sc-glass'} rounded-[1.75rem] p-5 md:p-6 ${className}`}
    >
      {children}
    </section>
  );
}
