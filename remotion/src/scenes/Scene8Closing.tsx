import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { COLORS } from '../styles';

export const Scene8Closing: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bgScale = interpolate(frame, [0, 120], [1.1, 1], { extrapolateRight: 'clamp' });

  const titleOp = interpolate(frame, [10, 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const titleY = interpolate(spring({ frame: frame - 10, fps, config: { damping: 20 } }), [0, 1], [50, 0]);

  const subtitleOp = interpolate(frame, [35, 55], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const subtitleY = interpolate(spring({ frame: frame - 35, fps, config: { damping: 20 } }), [0, 1], [30, 0]);

  const badgesOp = interpolate(frame, [55, 75], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const igOp = interpolate(frame, [80, 100], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Floating particles
  const particles = Array.from({ length: 12 }, (_, i) => ({
    x: (i * 170) % 1920,
    y: 200 + (i * 130) % 700,
    size: 4 + (i % 3) * 3,
    speed: 0.5 + (i % 4) * 0.3,
  }));

  return (
    <AbsoluteFill style={{ background: `linear-gradient(135deg, ${COLORS.primaryDark} 0%, ${COLORS.primary} 40%, ${COLORS.primaryLight} 100%)`, transform: `scale(${bgScale})` }}>
      {/* Floating particles */}
      {particles.map((p, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: p.x + Math.sin(frame * 0.02 * p.speed + i) * 30,
          top: p.y + Math.cos(frame * 0.015 * p.speed + i) * 20,
          width: p.size, height: p.size,
          borderRadius: '50%', background: 'rgba(255,255,255,0.08)',
        }} />
      ))}

      {/* Decorative circles */}
      <div style={{ position: 'absolute', top: -200, right: -200, width: 600, height: 600, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
      <div style={{ position: 'absolute', bottom: -200, left: -200, width: 700, height: 700, borderRadius: '50%', background: 'rgba(255,255,255,0.02)' }} />

      {/* Center content */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        {/* Logo text */}
        <div style={{ opacity: titleOp, transform: `translateY(${titleY}px)`, textAlign: 'center' }}>
          <div style={{ fontSize: 20, color: COLORS.accentLight, letterSpacing: 6, fontFamily: 'sans-serif', fontWeight: 600, marginBottom: 16 }}>INSTITUTO INTEGRA</div>
          <div style={{ fontSize: 56, color: COLORS.white, fontWeight: 800, fontFamily: 'sans-serif', lineHeight: 1.2 }}>
            Tudo em um só lugar<br />
            <span style={{ color: COLORS.accentLight }}>para sua gestão</span>
          </div>
        </div>

        <div style={{ opacity: subtitleOp, transform: `translateY(${subtitleY}px)`, marginTop: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)', fontFamily: 'sans-serif', lineHeight: 1.6 }}>
            Neuropsicologia • Saúde Emocional • Coworking
          </div>
        </div>

        {/* Feature badges */}
        <div style={{ opacity: badgesOp, marginTop: 40, display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          {['Agenda IA', 'Prontuário', 'Diagnóstico', 'Reservas', 'WhatsApp', 'Helena IA'].map((f, i) => {
            const bScale = interpolate(spring({ frame: frame - 58 - i * 3, fps, config: { damping: 14 } }), [0, 1], [0.8, 1]);
            return (
              <div key={i} style={{ transform: `scale(${bScale})`, background: 'rgba(255,255,255,0.12)', borderRadius: 24, padding: '10px 24px', color: COLORS.white, fontSize: 14, fontFamily: 'sans-serif', fontWeight: 500, border: '1px solid rgba(255,255,255,0.1)' }}>{f}</div>
            );
          })}
        </div>

        {/* Instagram */}
        <div style={{ opacity: igOp, marginTop: 48, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', fontFamily: 'sans-serif' }}>@institutointegra</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
