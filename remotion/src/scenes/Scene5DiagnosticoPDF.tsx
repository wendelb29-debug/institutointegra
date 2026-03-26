import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { COLORS } from '../styles';

export const Scene5DiagnosticoPDF: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const screenOp = interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // PDF generation
  const pdfClick = 80;
  const pdfOp = interpolate(frame, [pdfClick, pdfClick + 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const pdfScale = interpolate(spring({ frame: frame - pdfClick, fps, config: { damping: 18 } }), [0, 1], [0.85, 1]);

  return (
    <AbsoluteFill style={{ background: `linear-gradient(135deg, ${COLORS.warm} 0%, #F0F7F4 100%)` }}>
      <div style={{ position: 'absolute', top: 40, left: 80, opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>
        <div style={{ fontSize: 14, color: COLORS.primary, fontWeight: 600, letterSpacing: 3, fontFamily: 'sans-serif', marginBottom: 8 }}>DIAGNÓSTICO + PDF</div>
        <div style={{ fontSize: 36, color: COLORS.text, fontWeight: 800, fontFamily: 'sans-serif' }}>Geração com Assinatura Digital</div>
      </div>

      <div style={{ position: 'absolute', left: 80, top: 140, display: 'flex', gap: 32, opacity: screenOp }}>
        {/* Diagnosis form */}
        <div style={{ width: 700, background: COLORS.white, borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.06)', padding: 32 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, fontFamily: 'sans-serif', marginBottom: 20 }}>Diagnóstico — Maria Silva</div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: COLORS.textMuted, fontFamily: 'sans-serif', marginBottom: 6 }}>Código CID</div>
            <div style={{ padding: '12px 16px', background: COLORS.warm, borderRadius: 10, fontSize: 14, color: COLORS.text, fontFamily: 'sans-serif', borderLeft: `3px solid ${COLORS.primary}`, opacity: interpolate(frame, [15, 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>
              F41.1 — Transtorno de Ansiedade Generalizada
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: COLORS.textMuted, fontFamily: 'sans-serif', marginBottom: 6 }}>Descrição Detalhada</div>
            <div style={{ padding: '16px', background: COLORS.warm, borderRadius: 10, fontSize: 13, color: COLORS.text, fontFamily: 'sans-serif', lineHeight: 1.7, borderLeft: `3px solid ${COLORS.primary}`, minHeight: 120, opacity: interpolate(frame, [25, 45], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>
              Paciente apresenta quadro de ansiedade generalizada com duração superior a 6 meses, caracterizado por preocupação excessiva, dificuldade de concentração, tensão muscular e distúrbios do sono. Sintomas impactam atividades diárias e qualidade de vida.
            </div>
          </div>

          {/* AI suggestion */}
          <div style={{ opacity: interpolate(frame, [50, 65], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }), background: `${COLORS.primary}08`, borderRadius: 12, padding: 16, marginBottom: 16, border: `1px solid ${COLORS.accent}` }}>
            <div style={{ fontSize: 12, color: COLORS.primary, fontWeight: 600, fontFamily: 'sans-serif', marginBottom: 8 }}>🤖 Sugestão IA — Diagnóstico Diferencial</div>
            <div style={{ fontSize: 12, color: COLORS.textMuted, fontFamily: 'sans-serif', lineHeight: 1.6 }}>
              Considerar: F32.0 (Episódio depressivo leve), F51.0 (Insônia não orgânica). Recomenda-se avaliação complementar para descartar comorbidades.
            </div>
          </div>

          {/* Generate PDF button */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{
              opacity: interpolate(frame, [65, 78], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
              background: frame >= pdfClick ? `linear-gradient(135deg, ${COLORS.success}, #16A34A)` : `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryLight})`,
              color: COLORS.white, padding: '14px 32px', borderRadius: 12, fontSize: 14, fontWeight: 600, fontFamily: 'sans-serif',
              boxShadow: `0 8px 20px ${frame >= pdfClick ? COLORS.success : COLORS.primary}40`,
              transform: `scale(${frame >= pdfClick ? interpolate(frame, [pdfClick, pdfClick + 8, pdfClick + 15], [1, 1.1, 1], { extrapolateRight: 'clamp' }) : 1})`
            }}>
              {frame >= pdfClick ? '✓ PDF Gerado!' : '📄 Gerar PDF'}
            </div>
          </div>
        </div>

        {/* PDF Preview */}
        {pdfOp > 0 && (
          <div style={{ opacity: pdfOp, transform: `scale(${pdfScale})`, width: 500, background: COLORS.white, borderRadius: 16, boxShadow: '0 30px 80px rgba(0,0,0,0.12)', padding: 4 }}>
            <div style={{ background: '#FAFAFA', borderRadius: 12, padding: 40, border: '1px solid #E5E7EB', minHeight: 500 }}>
              {/* PDF Header */}
              <div style={{ textAlign: 'center', borderBottom: `2px solid ${COLORS.primary}`, paddingBottom: 16, marginBottom: 20 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.primary, fontFamily: 'sans-serif' }}>INSTITUTO INTEGRA</div>
                <div style={{ fontSize: 10, color: COLORS.textMuted, fontFamily: 'sans-serif' }}>Neuropsicologia e Saúde Emocional</div>
                <div style={{ fontSize: 9, color: COLORS.textMuted, fontFamily: 'sans-serif' }}>Uberlândia — MG</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, fontFamily: 'sans-serif', marginBottom: 12 }}>LAUDO DIAGNÓSTICO</div>
              <div style={{ fontSize: 10, color: COLORS.textMuted, fontFamily: 'sans-serif', marginBottom: 16 }}>
                <strong>Paciente:</strong> Maria Silva dos Santos<br />
                <strong>Data:</strong> 12/03/2026<br />
                <strong>CID:</strong> F41.1 — Transtorno de Ansiedade Generalizada
              </div>
              <div style={{ fontSize: 10, color: COLORS.text, fontFamily: 'sans-serif', lineHeight: 1.6, marginBottom: 24 }}>
                Paciente apresenta quadro de ansiedade generalizada com duração superior a 6 meses...
              </div>
              {/* Signature */}
              <div style={{ borderTop: `1px solid #E5E7EB`, paddingTop: 16, textAlign: 'center' }}>
                <div style={{ fontFamily: 'cursive', fontSize: 22, color: COLORS.primaryDark, marginBottom: 4 }}>Dr. Ana Costa</div>
                <div style={{ width: 150, height: 1, background: COLORS.text, margin: '0 auto 8px' }} />
                <div style={{ fontSize: 9, color: COLORS.textMuted, fontFamily: 'sans-serif' }}>Dra. Ana Costa — CRP 04/12345</div>
                <div style={{ fontSize: 9, color: COLORS.textMuted, fontFamily: 'sans-serif' }}>Neuropsicóloga</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
