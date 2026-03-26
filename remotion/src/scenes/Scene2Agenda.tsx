import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { COLORS } from '../styles';

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const CALENDAR_DATA = [
  [null, null, null, null, null, null, 1],
  [2, 3, 4, 5, 6, 7, 8],
  [9, 10, 11, 12, 13, 14, 15],
  [16, 17, 18, 19, 20, 21, 22],
  [23, 24, 25, 26, 27, 28, 29],
  [30, 31, null, null, null, null, null],
];

const BUSY_DAYS = [3, 5, 7, 10, 12, 14, 17, 19, 21, 24, 26, 28];
const BLOCKED_DAYS = [8, 15, 22, 29];

export const Scene2Agenda: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const screenOp = interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const screenY = interpolate(spring({ frame, fps, config: { damping: 25 } }), [0, 1], [40, 0]);

  // Click animation on day 12
  const clickFrame = 80;
  const clickScale = frame >= clickFrame && frame < clickFrame + 15 ? interpolate(frame, [clickFrame, clickFrame + 7, clickFrame + 15], [1, 1.2, 1], { extrapolateRight: 'clamp' }) : 1;
  const panelOp = interpolate(frame, [clickFrame + 10, clickFrame + 25], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const panelX = interpolate(spring({ frame: frame - clickFrame - 10, fps, config: { damping: 20 } }), [0, 1], [100, 0]);

  // Label
  const labelOp = interpolate(frame, [5, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: `linear-gradient(135deg, #F8FAF9 0%, ${COLORS.warm} 100%)` }}>
      {/* Section label */}
      <div style={{ position: 'absolute', top: 40, left: 80, opacity: labelOp }}>
        <div style={{ fontSize: 14, color: COLORS.primary, fontWeight: 600, letterSpacing: 3, fontFamily: 'sans-serif', marginBottom: 8 }}>AGENDA INTELIGENTE</div>
        <div style={{ fontSize: 36, color: COLORS.text, fontWeight: 800, fontFamily: 'sans-serif' }}>Calendário de Consultas</div>
      </div>

      {/* Calendar */}
      <div style={{ position: 'absolute', left: 80, top: 140, opacity: screenOp, transform: `translateY(${screenY}px)`, width: 900, background: COLORS.white, borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.08)', padding: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.text, fontFamily: 'sans-serif' }}>Março 2026</div>
          <div style={{ display: 'flex', gap: 16 }}>
            {[{ label: 'Livre', color: COLORS.success }, { label: 'Ocupado', color: COLORS.warning }, { label: 'Bloqueado', color: COLORS.danger }].map((l, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: COLORS.textMuted, fontFamily: 'sans-serif' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: l.color }} />{l.label}
              </div>
            ))}
          </div>
        </div>
        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginBottom: 8 }}>
          {DAYS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 13, color: COLORS.textMuted, fontWeight: 600, fontFamily: 'sans-serif', padding: 8 }}>{d}</div>)}
        </div>
        {/* Calendar grid */}
        {CALENDAR_DATA.map((week, wi) => (
          <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginBottom: 4 }}>
            {week.map((day, di) => {
              if (!day) return <div key={di} />;
              const isBusy = BUSY_DAYS.includes(day);
              const isBlocked = BLOCKED_DAYS.includes(day);
              const isSelected = day === 12;
              const cellOp = interpolate(frame, [15 + wi * 6 + di * 2, 30 + wi * 6 + di * 2], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
              const bg = isSelected ? COLORS.primary : isBlocked ? '#FEE2E2' : isBusy ? '#FEF3C7' : '#F0FFF4';
              const color = isSelected ? COLORS.white : isBlocked ? COLORS.danger : isBusy ? '#92400E' : COLORS.primaryDark;
              return (
                <div key={di} style={{
                  opacity: cellOp, textAlign: 'center', padding: 12, borderRadius: 10,
                  background: bg, color, fontSize: 15, fontWeight: 600, fontFamily: 'sans-serif',
                  transform: isSelected ? `scale(${clickScale})` : 'scale(1)',
                  boxShadow: isSelected ? `0 4px 12px ${COLORS.primary}40` : 'none',
                }}>
                  {day}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Side panel */}
      <div style={{ position: 'absolute', right: 60, top: 140, opacity: panelOp, transform: `translateX(${panelX}px)`, width: 420, background: COLORS.white, borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.08)', padding: 28 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, fontFamily: 'sans-serif', marginBottom: 20 }}>12 de Março — Quinta</div>
        {[
          { time: '08:00', patient: 'Maria Silva', status: 'Confirmado', color: COLORS.success },
          { time: '09:30', patient: 'João Santos', status: 'Agendado', color: COLORS.blue },
          { time: '11:00', patient: 'Ana Oliveira', status: 'Confirmado', color: COLORS.success },
          { time: '14:00', patient: 'Carlos Lima', status: 'Pendente', color: COLORS.warning },
          { time: '15:30', patient: 'Beatriz Costa', status: 'Agendado', color: COLORS.blue },
        ].map((apt, i) => {
          const aptOp = interpolate(frame, [clickFrame + 20 + i * 6, clickFrame + 32 + i * 6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          return (
            <div key={i} style={{ opacity: aptOp, display: 'flex', alignItems: 'center', gap: 16, padding: '12px 0', borderBottom: `1px solid ${COLORS.warm}` }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.primary, fontFamily: 'sans-serif', width: 50 }}>{apt.time}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, fontFamily: 'sans-serif' }}>{apt.patient}</div>
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: apt.color, background: `${apt.color}15`, padding: '4px 12px', borderRadius: 12, fontFamily: 'sans-serif' }}>{apt.status}</div>
            </div>
          );
        })}
      </div>

      {/* Cursor animation */}
      {frame >= clickFrame - 15 && frame < clickFrame + 10 && (
        <div style={{
          position: 'absolute',
          left: interpolate(frame, [clickFrame - 15, clickFrame], [500, 380], { extrapolateRight: 'clamp' }),
          top: interpolate(frame, [clickFrame - 15, clickFrame], [300, 420], { extrapolateRight: 'clamp' }),
          width: 20, height: 20, borderRadius: '50%',
          background: COLORS.primary, opacity: 0.6,
          transform: `scale(${frame >= clickFrame ? interpolate(frame, [clickFrame, clickFrame + 10], [1, 2], { extrapolateRight: 'clamp' }) : 1})`,
        }} />
      )}
    </AbsoluteFill>
  );
};
