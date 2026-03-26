import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { COLORS } from '../styles';

export const Scene4Prontuario: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const screenOp = interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Template insertion animation
  const templateClick = 40;
  const templateOp = interpolate(frame, [templateClick, templateClick + 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // AI button click
  const aiClick = 100;
  const aiGlow = frame >= aiClick ? interpolate(frame, [aiClick, aiClick + 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 0;
  const aiTextOp = interpolate(frame, [aiClick + 20, aiClick + 40], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const rawText = `QUEIXA PRINCIPAL:
Paciente relata dificuldade de concentração e ansiedade constante há 3 meses.

EVOLUÇÃO:
Melhora parcial com técnicas de mindfulness. Mantém episódios de insônia.

CONDUTA:
Manter acompanhamento semanal. Orientação sobre higiene do sono.`;

  const organizedText = `QUEIXA PRINCIPAL:
• Dificuldade de concentração (3 meses)
• Ansiedade constante e persistente

EVOLUÇÃO CLÍNICA:
• Melhora parcial com mindfulness ✓
• Episódios de insônia mantidos
• Adesão ao tratamento: boa

CONDUTA E ORIENTAÇÕES:
• Manter acompanhamento semanal
• Higiene do sono — protocolo aplicado
• Reavaliação em 30 dias`;

  const displayText = frame < aiClick + 20 ? rawText : organizedText;

  return (
    <AbsoluteFill style={{ background: `linear-gradient(135deg, #F0F7F4 0%, ${COLORS.warm} 100%)` }}>
      <div style={{ position: 'absolute', top: 40, left: 80, opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>
        <div style={{ fontSize: 14, color: COLORS.primary, fontWeight: 600, letterSpacing: 3, fontFamily: 'sans-serif', marginBottom: 8 }}>PRONTUÁRIO ELETRÔNICO</div>
        <div style={{ fontSize: 36, color: COLORS.text, fontWeight: 800, fontFamily: 'sans-serif' }}>Registro de Sessão</div>
      </div>

      {/* Main content */}
      <div style={{ position: 'absolute', left: 80, top: 140, right: 80, bottom: 60, display: 'flex', gap: 24, opacity: screenOp }}>
        {/* Editor */}
        <div style={{ flex: 1, background: COLORS.white, borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.06)', padding: 32, position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, fontFamily: 'sans-serif' }}>Paciente: Maria Silva</div>
            <div style={{ fontSize: 12, color: COLORS.textMuted, fontFamily: 'sans-serif' }}>12/03/2026 — 08:00</div>
          </div>

          {/* Text area */}
          <div style={{ background: COLORS.warm, borderRadius: 12, padding: 24, minHeight: 400, fontFamily: 'monospace', fontSize: 13, color: COLORS.text, lineHeight: 1.8, whiteSpace: 'pre-wrap', borderLeft: `4px solid ${COLORS.primary}`, position: 'relative' }}>
            {displayText}
            {/* AI processing overlay */}
            {frame >= aiClick && frame < aiClick + 20 && (
              <div style={{ position: 'absolute', inset: 0, background: `${COLORS.primary}08`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ background: COLORS.white, borderRadius: 12, padding: '16px 32px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', border: `3px solid ${COLORS.primary}`, borderTopColor: 'transparent', transform: `rotate(${frame * 12}deg)` }} />
                  <div style={{ fontSize: 14, color: COLORS.primary, fontFamily: 'sans-serif', fontWeight: 600 }}>IA organizando...</div>
                </div>
              </div>
            )}
          </div>

          {/* AI organized badge */}
          {aiTextOp > 0 && (
            <div style={{ opacity: aiTextOp, position: 'absolute', bottom: 20, right: 20, background: `${COLORS.success}15`, color: COLORS.success, padding: '8px 16px', borderRadius: 10, fontSize: 12, fontFamily: 'sans-serif', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              ✓ Texto organizado pela IA
            </div>
          )}
        </div>

        {/* Right panel - Templates + AI */}
        <div style={{ width: 340, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Templates */}
          <div style={{ background: COLORS.white, borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.06)', padding: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, fontFamily: 'sans-serif', marginBottom: 16 }}>📋 Templates</div>
            {['Sessão Padrão — Terapia', 'Avaliação Neuropsicológica', 'Relatório de Evolução', 'Alta Terapêutica'].map((t, i) => {
              const tOp = interpolate(frame, [15 + i * 6, 25 + i * 6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
              const isSelected = i === 0 && frame >= templateClick;
              return (
                <div key={i} style={{ opacity: tOp, padding: '10px 14px', borderRadius: 10, marginBottom: 6, fontSize: 13, color: isSelected ? COLORS.white : COLORS.text, fontFamily: 'sans-serif', background: isSelected ? COLORS.primary : COLORS.warm, cursor: 'pointer', fontWeight: isSelected ? 600 : 400 }}>{t}</div>
              );
            })}
          </div>

          {/* AI Button */}
          <div style={{ background: COLORS.white, borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.06)', padding: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, fontFamily: 'sans-serif', marginBottom: 16 }}>🤖 Assistente IA</div>
            {['Organizar Texto', 'Corrigir Gramática', 'Resumir Sessão', 'Sugerir Hipótese'].map((a, i) => {
              const aOp = interpolate(frame, [30 + i * 5, 40 + i * 5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
              const isActive = i === 0 && frame >= aiClick;
              return (
                <div key={i} style={{
                  opacity: aOp, padding: '10px 14px', borderRadius: 10, marginBottom: 6, fontSize: 13,
                  fontFamily: 'sans-serif', fontWeight: 500,
                  background: isActive ? `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryLight})` : COLORS.warm,
                  color: isActive ? COLORS.white : COLORS.primary,
                  boxShadow: isActive ? `0 4px 15px ${COLORS.primary}40` : 'none',
                }}>{a}</div>
              );
            })}
            <div style={{ marginTop: 12, fontSize: 10, color: COLORS.textMuted, fontFamily: 'sans-serif', fontStyle: 'italic' }}>⚠ Sugestão gerada por IA. Revisão profissional obrigatória.</div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
