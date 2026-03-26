import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { COLORS } from '../styles';

export const Scene3Cadastro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const formOp = interpolate(frame, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const formY = interpolate(spring({ frame, fps, config: { damping: 22 } }), [0, 1], [50, 0]);

  const fields = [
    { label: 'Nome Completo', value: 'Maria Silva dos Santos', delay: 20 },
    { label: 'CPF', value: '123.456.789-00', delay: 35 },
    { label: 'Data de Nascimento', value: '15/03/1985', delay: 45 },
    { label: 'Telefone', value: '(34) 99999-1234', delay: 55 },
    { label: 'E-mail', value: 'maria.silva@email.com', delay: 65 },
    { label: 'Convênio', value: 'Unimed', delay: 75 },
  ];

  return (
    <AbsoluteFill style={{ background: `linear-gradient(135deg, ${COLORS.warm} 0%, #F0F7F4 100%)` }}>
      <div style={{ position: 'absolute', top: 40, left: 80 }}>
        <div style={{ fontSize: 14, color: COLORS.primary, fontWeight: 600, letterSpacing: 3, fontFamily: 'sans-serif', marginBottom: 8, opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>CADASTRO</div>
        <div style={{ fontSize: 36, color: COLORS.text, fontWeight: 800, fontFamily: 'sans-serif', opacity: interpolate(frame, [5, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>Novo Paciente</div>
      </div>

      <div style={{ position: 'absolute', left: '50%', top: '55%', transform: `translate(-50%, -50%) translateY(${formY}px)`, opacity: formOp, width: 1000, background: COLORS.white, borderRadius: 20, boxShadow: '0 30px 80px rgba(0,0,0,0.08)', padding: 48 }}>
        {/* Avatar placeholder */}
        <div style={{ display: 'flex', gap: 40, marginBottom: 32 }}>
          <div style={{ width: 100, height: 100, borderRadius: '50%', background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 36, color: COLORS.white, fontFamily: 'sans-serif', fontWeight: 700 }}>MS</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {fields.map((f, i) => {
                const typingProgress = interpolate(frame, [f.delay, f.delay + 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
                const visibleChars = Math.floor(typingProgress * f.value.length);
                const fieldOp = interpolate(frame, [f.delay - 5, f.delay + 5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
                return (
                  <div key={i} style={{ opacity: fieldOp }}>
                    <div style={{ fontSize: 12, color: COLORS.textMuted, fontFamily: 'sans-serif', marginBottom: 6, fontWeight: 500 }}>{f.label}</div>
                    <div style={{ padding: '12px 16px', background: COLORS.warm, borderRadius: 10, fontSize: 15, color: COLORS.text, fontFamily: 'sans-serif', fontWeight: 500, minHeight: 20, borderLeft: `3px solid ${COLORS.primary}` }}>
                      {f.value.substring(0, visibleChars)}
                      {typingProgress < 1 && typingProgress > 0 && <span style={{ borderRight: `2px solid ${COLORS.primary}`, marginLeft: 1 }}>&nbsp;</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Save button */}
        {(() => {
          const btnOp = interpolate(frame, [90, 105], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const btnScale = interpolate(spring({ frame: frame - 90, fps, config: { damping: 12 } }), [0, 1], [0.8, 1]);
          return (
            <div style={{ opacity: btnOp, transform: `scale(${btnScale})`, display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryLight})`, color: COLORS.white, padding: '14px 40px', borderRadius: 12, fontSize: 15, fontWeight: 600, fontFamily: 'sans-serif', boxShadow: `0 8px 20px ${COLORS.primary}40` }}>
                ✓ Salvar Paciente
              </div>
            </div>
          );
        })()}
      </div>
    </AbsoluteFill>
  );
};
