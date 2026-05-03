interface HeroSectionProps {
  title: string;
  subtitle: string;
}

export default function HeroSection({ title, subtitle }: HeroSectionProps) {
  return (
    <section style={{ marginBottom: '18px' }}>
      <h1
        style={{
          margin: '0 0 11px',
          fontSize: '46px',
          lineHeight: '1.02',
          fontWeight: 400,
          letterSpacing: '9px',
          color: '#221d18',
        }}
      >
        {title}
      </h1>
      <p
        style={{
          margin: 0,
          color: '#948879',
          fontSize: '14px',
          letterSpacing: '4px',
        }}
      >
        {subtitle}
      </p>
    </section>
  );
}
