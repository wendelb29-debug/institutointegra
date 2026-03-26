import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { COLORS } from '../styles';

export const Scene7Helena: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Chat opens
  const chatOpen = 15;
  const chatOp = interpolate(frame, [chatOpen, chatOpen + 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const chatScale = interpolate(spring({ frame: frame - chatOpen, fps, config: { damping: 18 } }), [0, 1], [0.7, 1]);

  // Messages appear
  const msg1 = 35;
  const msg2 = 70; // user clicks agendar
  const msg3 = 90; // helena responds with professionals
  const msg4 = 120; // redirect to whatsapp

  const messages = [
    { frame: msg1, role: 'assistant', text: 'Olá 😊 eu sou a Helena, assistente do Instituto Integra.\nPosso te ajudar?\nVocê gostaria de agendar uma consulta ou reservar uma sala?' },
    { frame: msg2, role: 'user', text: 'Agendar consulta' },
    { frame: msg3, role: 'assistant', text: 'Ótimo! Nossos profissionais disponíveis:\n\n👩‍⚕️ Dra. Ana Costa — Neuropsicologia\n👨‍⚕️ Dr. Paulo Santos — Terapia Cognitiva\n👩‍⚕️ Dra. Lucia Ferreira — Psicologia Clínica\n\nCom qual profissional deseja agendar?' },
    { frame: msg4, role: 'user', text: 'Dra. Ana Costa' },
  ];

  // WhatsApp redirect
  const whatsappFrame = 140;
  const wpOp = interpolate(frame, [whatsappFrame, whatsappFrame + 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)` }}>
      {/* Background website mockup */}
      <div style={{ position: 'absolute', inset: 40, background: COLORS.warm, borderRadius: 16, opacity: 0.3 }}>
        <div style={{ height: 60, background: COLORS.white, borderRadius: '16px 16px 0 0' }} />
      </div>

      {/* Section label */}
      <div style={{ position: 'absolute', top: 60, left: 100, opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>
        <div style={{ fontSize: 14, color: COLORS.accentLight, fontWeight: 600, letterSpacing: 3, fontFamily: 'sans-serif', marginBottom: 8 }}>ASSISTENTE VIRTUAL</div>
        <div style={{ fontSize: 40, color: COLORS.white, fontWeight: 800, fontFamily: 'sans-serif' }}>Helena IA</div>
        <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', fontFamily: 'sans-serif', marginTop: 8 }}>Atendimento inteligente e multimodal</div>
      </div>

      {/* Chat widget */}
      <div style={{
        position: 'absolute', right: 80, bottom: 80,
        width: 420, opacity: chatOp, transform: `scale(${chatScale})`,
        background: COLORS.white, borderRadius: 20,
        boxShadow: '0 40px 80px rgba(0,0,0,0.3)',
        overflow: 'hidden',
      }}>
        {/* Chat header */}
        <div style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryLight})`, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>👩</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.white, fontFamily: 'sans-serif' }}>Helena</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontFamily: 'sans-serif' }}>Online agora</div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ padding: 16, minHeight: 380, maxHeight: 380, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {messages.map((msg, i) => {
            const msgOp = interpolate(frame, [msg.frame, msg.frame + 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
            const msgY = interpolate(spring({ frame: frame - msg.frame, fps, config: { damping: 20 } }), [0, 1], [20, 0]);
            if (msgOp <= 0) return null;
            return (
              <div key={i} style={{ opacity: msgOp, transform: `translateY(${msgY}px)`, alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                <div style={{
                  padding: '12px 16px', borderRadius: 16, fontSize: 13, fontFamily: 'sans-serif', lineHeight: 1.5, whiteSpace: 'pre-wrap',
                  background: msg.role === 'user' ? COLORS.primary : COLORS.warm,
                  color: msg.role === 'user' ? COLORS.white : COLORS.text,
                  borderBottomRightRadius: msg.role === 'user' ? 4 : 16,
                  borderBottomLeftRadius: msg.role === 'user' ? 16 : 4,
                }}>
                  {msg.text}
                </div>
              </div>
            );
          })}

          {/* Quick action buttons after first message */}
          {frame >= msg1 + 12 && frame < msg2 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 4, opacity: interpolate(frame, [msg1 + 12, msg1 + 22], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>
              {['Agendar consulta', 'Reservar sala'].map((btn, i) => (
                <div key={i} style={{ padding: '8px 16px', borderRadius: 16, fontSize: 12, fontFamily: 'sans-serif', fontWeight: 500, border: `1px solid ${COLORS.primary}`, color: COLORS.primary, background: `${COLORS.primary}08` }}>{btn}</div>
              ))}
            </div>
          )}

          {/* WhatsApp redirect notification */}
          {wpOp > 0 && (
            <div style={{ opacity: wpOp, alignSelf: 'flex-start', maxWidth: '85%' }}>
              <div style={{ padding: '14px 18px', borderRadius: 16, background: '#25D366', color: COLORS.white, fontSize: 13, fontFamily: 'sans-serif', display: 'flex', alignItems: 'center', gap: 8, borderBottomLeftRadius: 4 }}>
                <span style={{ fontSize: 18 }}>📱</span>
                Redirecionando para WhatsApp da Dra. Ana Costa...
              </div>
            </div>
          )}
        </div>

        {/* Input bar */}
        <div style={{ padding: '12px 16px', borderTop: `1px solid ${COLORS.warm}`, display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ fontSize: 18 }}>📎</div>
          <div style={{ flex: 1, padding: '10px 16px', background: COLORS.warm, borderRadius: 20, fontSize: 13, color: COLORS.textMuted, fontFamily: 'sans-serif' }}>Digite sua mensagem...</div>
          <div style={{ fontSize: 18 }}>🎤</div>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: COLORS.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ color: COLORS.white, fontSize: 14 }}>➤</div>
          </div>
        </div>
      </div>

      {/* Multimodal badges */}
      <div style={{ position: 'absolute', left: 100, bottom: 100, display: 'flex', gap: 12, opacity: interpolate(frame, [50, 70], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>
        {['📎 Arquivos', '🖼️ Imagens', '🎤 Áudio', '📄 PDF'].map((b, i) => {
          const bOp = interpolate(frame, [55 + i * 6, 68 + i * 6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          return <div key={i} style={{ opacity: bOp, background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '8px 18px', color: COLORS.white, fontSize: 13, fontFamily: 'sans-serif' }}>{b}</div>;
        })}
      </div>
    </AbsoluteFill>
  );
};
