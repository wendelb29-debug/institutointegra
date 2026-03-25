import { Conversation, ChatMessage } from './types';

export const mockConversations: Conversation[] = [
  { id: '1', name: 'Cliente João', phone: '5511999999999', lastMessage: 'Oi, gostaria de agendar uma consulta', lastMessageTime: '10:32', unread: 2, avatarInitial: 'J', isOnline: true },
  { id: '2', name: 'Maria Silva', phone: '5511888888888', lastMessage: 'Obrigado pelo atendimento!', lastMessageTime: '09:45', unread: 0, avatarInitial: 'M', isOnline: false },
  { id: '3', name: 'Carlos Souza', phone: '5511777777777', lastMessage: 'Qual o horário disponível?', lastMessageTime: 'Ontem', unread: 1, avatarInitial: 'C', isOnline: true },
  { id: '4', name: 'Ana Paula', phone: '5511666666666', lastMessage: 'Vou confirmar amanhã', lastMessageTime: 'Ontem', unread: 0, avatarInitial: 'A', isOnline: false },
  { id: '5', name: 'Roberto Lima', phone: '5511555555555', lastMessage: 'Pode me enviar o contrato?', lastMessageTime: 'Seg', unread: 3, avatarInitial: 'R', isOnline: false },
];

export const mockMessages: Record<string, ChatMessage[]> = {
  '1': [
    { id: '1', type: 'received', text: 'Bom dia!', time: '10:00', },
    { id: '2', type: 'sent', text: 'Bom dia! Como posso ajudar?', time: '10:01', status: 'read' },
    { id: '3', type: 'received', text: 'Gostaria de saber sobre os horários disponíveis para consulta', time: '10:15' },
    { id: '4', type: 'sent', text: 'Claro! Temos horários disponíveis nas terças e quintas, das 9h às 17h. Qual horário seria melhor para você?', time: '10:18', status: 'read' },
    { id: '5', type: 'received', text: 'Terça às 14h seria perfeito!', time: '10:25' },
    { id: '6', type: 'sent', text: 'Ótimo! Vou verificar a disponibilidade e já confirmo.', time: '10:27', status: 'delivered' },
    { id: '7', type: 'received', text: 'Oi, gostaria de agendar uma consulta', time: '10:32' },
  ],
  '2': [
    { id: '1', type: 'sent', text: 'Olá Maria, sua consulta está confirmada para amanhã às 10h.', time: '09:30', status: 'read' },
    { id: '2', type: 'received', text: 'Obrigado pelo atendimento!', time: '09:45' },
  ],
  '3': [
    { id: '1', type: 'received', text: 'Olá, boa tarde!', time: '14:00' },
    { id: '2', type: 'sent', text: 'Boa tarde, Carlos! Em que posso ajudar?', time: '14:02', status: 'read' },
    { id: '3', type: 'received', text: 'Qual o horário disponível?', time: '14:05' },
  ],
  '4': [
    { id: '1', type: 'received', text: 'Oi, preciso remarcar minha consulta', time: '16:00' },
    { id: '2', type: 'sent', text: 'Sem problema! Qual data seria melhor?', time: '16:05', status: 'read' },
    { id: '3', type: 'received', text: 'Vou confirmar amanhã', time: '16:10' },
  ],
  '5': [
    { id: '1', type: 'received', text: 'Boa tarde!', time: '11:00' },
    { id: '2', type: 'sent', text: 'Boa tarde, Roberto!', time: '11:02', status: 'read' },
    { id: '3', type: 'received', text: 'Pode me enviar o contrato?', time: '11:05' },
  ],
};
