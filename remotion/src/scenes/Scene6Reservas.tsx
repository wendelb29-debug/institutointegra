import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { COLORS } from '../styles';

const HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

const RESERVATIONS = [
  { room: 'Sala Serenidade', start: 0, duration: 2, color: '#22C55E', client: 'Dr. Carlos' },
  { room: 'Sala Serenidade', start: 4, duration: 3, color: '#F59E0B', client: 'Dra. Ana' },
  { room: 'Sala Harmonia', start: 1, duration: 2, color: '#3B82F6', client: 'Dr. Paulo' },
  { room: 'Sala Harmonia', start: 5, duration: 2, color: '#22C55E', client: 'Dra. Lucia' },
  { room: 'Sala Equilíbrio', start: 0, duration: 4, color: '#8B5CF6', client: 'Workshop' },
  { room: 'Sala Equilíbrio', start: 6, duration: 3, color: '#F59E0B', client: 'Dr. Marcos' },
];

export const Scene6Reservas: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const screenOp = interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // New reservation popup
  const newResFrame = 80;
  const popupOp = interpolate(frame, [newResFrame, newResFrame + 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const popupScale = interpolate(spring({ frame: frame - newResFrame, fps, config: { damping: 16 } }), [0, 1], [0.8, 1]);

  return (
    <AbsoluteFill style={{ background: `linear-gradient(135deg, ${COLORS.warm} 0%, #F0F7F4 100%)` }}>
      <div style={{ position: 'absolute', top: 40, left: 80, opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>
        <div style={{ fontSize: 14, color: COLORS.primary, fontWeight: 600, letterSpacing: 3, fontFamily: 'sans-serif', marginBottom: 8 }}>COWORKING</div>
        <div style={{ fontSize: 36, color: COLORS.text, fontWeight: 800, fontFamily: 'sans-serif' }}>Reservas de Salas</div>
      </div>

      {/* Room filter */}
      <div style={{ position: 'absolute', top: 130, left: 80, display: 'flex', gap: 12, opacity: interpolate(frame, [10, 25], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>
        {['Todas', 'Sala Serenidade', 'Sala Harmonia', 'Sala Equilíbrio'].map((r, i) => (
          <div key={i} style={{ padding: '8px 20px', borderRadius: 20, fontSize: 13, fontFamily: 'sans-serif', fontWeight: i === 0 ? 600 : 400, background: i === 0 ? COLORS.primary : COLORS.white, color: i === 0 ? COLORS.white : COLORS.text, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>{r}</div>
        ))}
      </div>

      {/* Timeline grid */}
      <div style={{ position: 'absolute', left: 80, top: 190, right: 80, bottom: 60, background: COLORS.white, borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.06)', padding: 24, opacity: screenOp, overflow: 'hidden' }}>
        <div style={{ display: 'flex', fontSize: 14, fontWeight: 700, color: COLORS.text, fontFamily: 'sans-serif', marginBottom: 16 }}>
          <div style={{ width: 140 }}>Sala</div>
          <div style={{ flex: 1, display: 'flex' }}>
            {HOURS.map(h => <div key={h} style={{ flex: 1, fontSize: 11, color: COLORS.textMuted, fontWeight: 500 }}>{h}</div>)}
          </div>
        </div>

        {['Sala Serenidade', 'Sala Harmonia', 'Sala Equilíbrio'].map((room, ri) => {
          const roomRes = RESERVATIONS.filter(r => r.room === room);
          const rowOp = interpolate(frame, [20 + ri * 8, 35 + ri * 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          return (
            <div key={ri} style={{ opacity: rowOp, display: 'flex', alignItems: 'center', height: 70, borderBottom: `1px solid ${COLORS.warm}`, marginBottom: 8 }}>
              <div style={{ width: 140, fontSize: 13, fontWeight: 600, color: COLORS.text, fontFamily: 'sans-serif' }}>{room}</div>
              <div style={{ flex: 1, position: 'relative', height: 50 }}>
                {/* Grid lines */}
                {HOURS.map((_, i) => <div key={i} style={{ position: 'absolute', left: `${i * 10}%`, top: 0, bottom: 0, width: 1, background: '#F3F4F6' }} />)}
                {/* Reservations */}
                {roomRes.map((res, i) => {
                  const resOp = interpolate(frame, [30 + ri * 8 + i * 5, 45 + ri * 8 + i * 5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
                  return (
                    <div key={i} style={{
                      opacity: resOp, position: 'absolute',
                      left: `${res.start * 10}%`, width: `${res.duration * 10}%`,
                      top: 4, bottom: 4,
                      background: `${res.color}20`, borderLeft: `3px solid ${res.color}`,
                      borderRadius: 8, padding: '6px 10px',
                      display: 'flex', flexDirection: 'column', justifyContent: 'center',
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: res.color, fontFamily: 'sans-serif' }}>{res.client}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* New reservation button */}
        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', opacity: interpolate(frame, [60, 75], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>
          <div style={{
            background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryLight})`,
            color: COLORS.white, padding: '12px 28px', borderRadius: 12, fontSize: 14, fontWeight: 600, fontFamily: 'sans-serif',
            transform: `scale(${frame >= newResFrame - 5 && frame < newResFrame + 5 ? interpolate(frame, [newResFrame - 5, newResFrame, newResFrame + 5], [1, 1.1, 1], { extrapolateRight: 'clamp' }) : 1})`,
          }}>
            + Nova Reserva
          </div>
        </div>
      </div>

      {/* New reservation popup */}
      {popupOp > 0 && (
        <>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', opacity: popupOp }} />
          <div style={{ position: 'absolute', left: '50%', top: '50%', transform: `translate(-50%, -50%) scale(${popupScale})`, opacity: popupOp, width: 500, background: COLORS.white, borderRadius: 20, boxShadow: '0 40px 80px rgba(0,0,0,0.2)', padding: 36 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.text, fontFamily: 'sans-serif', marginBottom: 24 }}>Nova Reserva</div>
            {[{ l: 'Sala', v: 'Sala Serenidade' }, { l: 'Data', v: '15/03/2026' }, { l: 'Horário', v: '10:00 — 12:00' }, { l: 'Cliente', v: 'Dr. Roberto Alves' }].map((f, i) => (
              <div key={i} style={{ marginBottom: 16, opacity: interpolate(frame, [newResFrame + 15 + i * 5, newResFrame + 25 + i * 5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>
                <div style={{ fontSize: 12, color: COLORS.textMuted, fontFamily: 'sans-serif', marginBottom: 4 }}>{f.l}</div>
                <div style={{ padding: '10px 14px', background: COLORS.warm, borderRadius: 8, fontSize: 14, color: COLORS.text, fontFamily: 'sans-serif' }}>{f.v}</div>
              </div>
            ))}
            <div style={{ opacity: interpolate(frame, [newResFrame + 40, newResFrame + 50], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }), background: `linear-gradient(135deg, ${COLORS.success}, #16A34A)`, color: COLORS.white, padding: '14px 0', borderRadius: 12, fontSize: 15, fontWeight: 600, fontFamily: 'sans-serif', textAlign: 'center' }}>✓ Confirmar Reserva</div>
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};
