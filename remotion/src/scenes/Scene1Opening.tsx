import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { COLORS } from '../styles';

export const Scene1Opening: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bgScale = interpolate(frame, [0, 120], [1.05, 1], { extrapolateRight: 'clamp' });
  const titleY = interpolate(spring({ frame: frame - 10, fps, config: { damping: 20 } }), [0, 1], [60, 0]);
  const titleOp = interpolate(frame, [10, 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const subtitleOp = interpolate(frame, [30, 50], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const subtitleY = interpolate(spring({ frame: frame - 30, fps, config: { damping: 20 } }), [0, 1], [40, 0]);
  const badgeOp = interpolate(frame, [50, 70], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const badgeScale = interpolate(spring({ frame: frame - 50, fps, config: { damping: 15 } }), [0, 1], [0.8, 1]);

  // Animated dashboard mockup
  const dashOp = interpolate(frame, [20, 50], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const dashY = interpolate(spring({ frame: frame - 20, fps, config: { damping: 25 } }), [0, 1], [80, 0]);

  return (
    <AbsoluteFill style={{ background: `linear-gradient(135deg, ${COLORS.primaryDark} 0%, ${COLORS.primary} 50%, ${COLORS.primaryLight} 100%)`, transform: `scale(${bgScale})` }}>
      {/* Decorative circles */}
      <div style={{ position: 'absolute', top: -100, right: -100, width: 500, height: 500, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
      <div style={{ position: 'absolute', bottom: -150, left: -150, width: 600, height: 600, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />

      {/* Left side - Text */}
      <div style={{ position: 'absolute', left: 100, top: '50%', transform: 'translateY(-50%)', width: 700 }}>
        <div style={{ opacity: titleOp, transform: `translateY(${titleY}px)` }}>
          <div style={{ fontSize: 18, color: COLORS.accentLight, letterSpacing: 4, marginBottom: 16, fontFamily: 'sans-serif', fontWeight: 600 }}>INSTITUTO INTEGRA</div>
          <div style={{ fontSize: 52, color: COLORS.white, fontWeight: 800, lineHeight: 1.15, fontFamily: 'sans-serif' }}>
            Sistema completo para<br />
            <span style={{ color: COLORS.accentLight }}>clínicas</span> e <span style={{ color: COLORS.accentLight }}>coworking</span>
          </div>
        </div>
        <div style={{ opacity: subtitleOp, transform: `translateY(${subtitleY}px)`, marginTop: 24 }}>
          <div style={{ fontSize: 20, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, fontFamily: 'sans-serif' }}>
            Gestão clínica, agenda inteligente, prontuário eletrônico,<br />reservas de salas e muito mais.
          </div>
        </div>
        <div style={{ opacity: badgeOp, transform: `scale(${badgeScale})`, marginTop: 32, display: 'flex', gap: 16 }}>
          {['Agenda IA', 'Prontuário', 'Reservas', 'WhatsApp'].map((t, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 24, padding: '8px 20px', color: COLORS.white, fontSize: 14, fontFamily: 'sans-serif', fontWeight: 500, backdropFilter: 'none' }}>{t}</div>
          ))}
        </div>
      </div>

      {/* Right side - Dashboard mockup */}
      <div style={{ position: 'absolute', right: 60, top: '50%', transform: `translateY(-50%) translateY(${dashY}px)`, opacity: dashOp, width: 850, height: 550, background: COLORS.white, borderRadius: 16, boxShadow: '0 40px 80px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
        {/* Top bar */}
        <div style={{ height: 48, background: COLORS.warm, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 8 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#EF4444' }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#F59E0B' }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#22C55E' }} />
          <div style={{ marginLeft: 20, fontSize: 13, color: COLORS.textMuted, fontFamily: 'sans-serif' }}>Instituto Integra — Dashboard</div>
        </div>
        {/* Sidebar */}
        <div style={{ position: 'absolute', left: 0, top: 48, width: 200, height: 502, background: COLORS.primaryDark, padding: '20px 0' }}>
          {['Dashboard', 'Agenda', 'Pacientes', 'Prontuário', 'Reservas', 'Financeiro', 'WhatsApp'].map((item, i) => {
            const itemOp = interpolate(frame, [40 + i * 5, 50 + i * 5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
            return (
              <div key={i} style={{ opacity: itemOp, padding: '10px 24px', color: i === 0 ? COLORS.white : 'rgba(255,255,255,0.6)', fontSize: 13, fontFamily: 'sans-serif', background: i === 0 ? 'rgba(255,255,255,0.1)' : 'transparent', borderLeft: i === 0 ? `3px solid ${COLORS.accentLight}` : '3px solid transparent' }}>{item}</div>
            );
          })}
        </div>
        {/* Content - KPI cards */}
        <div style={{ marginLeft: 200, padding: 24, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {[
            { label: 'Receita Total', value: 'R$ 45.800', color: COLORS.success },
            { label: 'Pacientes', value: '128', color: COLORS.blue },
            { label: 'Ocupação', value: '87%', color: COLORS.warning },
            { label: 'Consultas Hoje', value: '12', color: COLORS.purple },
          ].map((kpi, i) => {
            const cardOp = interpolate(frame, [55 + i * 8, 70 + i * 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
            const cardY = interpolate(spring({ frame: frame - 55 - i * 8, fps, config: { damping: 18 } }), [0, 1], [30, 0]);
            return (
              <div key={i} style={{ opacity: cardOp, transform: `translateY(${cardY}px)`, width: 145, background: COLORS.warm, borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 11, color: COLORS.textMuted, fontFamily: 'sans-serif', marginBottom: 6 }}>{kpi.label}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: kpi.color, fontFamily: 'sans-serif' }}>{kpi.value}</div>
              </div>
            );
          })}
        </div>
        {/* Chart placeholder */}
        <div style={{ marginLeft: 200, padding: '0 24px' }}>
          <div style={{ background: COLORS.warm, borderRadius: 12, height: 200, padding: 20 }}>
            <div style={{ fontSize: 13, color: COLORS.textMuted, fontFamily: 'sans-serif', marginBottom: 16 }}>Receita Mensal</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 140 }}>
              {[60, 80, 45, 90, 70, 95, 85, 100, 75, 88, 92, 78].map((h, i) => {
                const barH = interpolate(frame, [70 + i * 3, 90 + i * 3], [0, h * 1.2], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
                return <div key={i} style={{ width: 36, height: barH, background: `linear-gradient(to top, ${COLORS.primary}, ${COLORS.primaryLight})`, borderRadius: 4 }} />;
              })}
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
