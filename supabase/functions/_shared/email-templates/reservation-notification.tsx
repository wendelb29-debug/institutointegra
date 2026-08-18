/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Hr,
  Link,
} from 'npm:@react-email/components@0.0.22'

interface ReservationNotificationEmailProps {
  siteName: string
  clientName: string
  roomName: string
  date: string
  time: string
  status: string
  eventType?: 'INSERT' | 'UPDATE' | 'MANUAL_RESEND'
  userName?: string
}

const LOGO_URL = "https://institutointegra.lovable.app/__l5e/assets-v1/afafc8be-e750-4075-b440-3674a754d2bb/logo-integra.png";

export const ReservationNotificationEmail = ({
  siteName,
  clientName,
  roomName,
  date,
  time,
  status,
  eventType,
  userName,
}: ReservationNotificationEmailProps) => {
  const getStatusLabel = (s: string) => {
    const map: any = { confirmada: 'Confirmada', pendente: 'Pendente', cancelada: 'Cancelada' };
    return map[s] || s;
  };

  const getTitle = () => {
    if (status === 'confirmada') return 'Reserva Confirmada';
    if (status === 'cancelada') return 'Reserva Cancelada';
    if (eventType === 'UPDATE') return 'Reserva Atualizada';
    return 'Nova Reserva de Sala';
  };

  return (
    <Html lang="pt-BR" dir="ltr">
      <Head />
      <Preview>{getTitle()}: {roomName} - {date}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoContainer}>
            <Img src={LOGO_URL} width="150" height="auto" alt={siteName} style={logo} />
          </Section>
          <Heading style={h1}>{getTitle()}</Heading>
          
          <Text style={text}>
            {status === 'confirmada' ? (
              <>Olá! Temos o prazer de informar que sua reserva no <strong>{siteName}</strong> foi confirmada com sucesso.</>
            ) : status === 'cancelada' ? (
              <>Informamos que a reserva abaixo no sistema <strong>{siteName}</strong> foi cancelada.</>
            ) : eventType === 'UPDATE' ? (
              <>Houve uma atualização nos detalhes da reserva no sistema <strong>{siteName}</strong>.</>
            ) : (
              <>Uma nova solicitação de reserva foi registrada no sistema <strong>{siteName}</strong>.</>
            )}
          </Text>
          
          <Section style={detailsContainer}>
            <Text style={detailItem}>
              <strong>Cliente/Responsável:</strong> {clientName}
            </Text>
            <Text style={detailItem}>
              <strong>Sala:</strong> {roomName}
            </Text>
            <Text style={detailItem}>
              <strong>Data:</strong> {date}
            </Text>
            <Text style={detailItem}>
              <strong>Horário:</strong> {time}
            </Text>
            <Text style={detailItem}>
              <strong>Status Atual:</strong> <span style={statusStyle(status)}>{getStatusLabel(status).toUpperCase()}</span>
            </Text>
            {userName && (
              <Text style={detailItem}>
                <strong>Realizada por:</strong> {userName}
              </Text>
            )}
          </Section>

          <Text style={text}>
            Para mais detalhes, acesse o painel de gestão do Instituto Integra.
          </Text>

          <Section style={buttonContainer}>
            <Link href="https://institutointegra.site/gestao" style={button}>
              Acessar Sistema
            </Link>
          </Section>

          <Hr style={hr} />
          
          <Text style={footer}>
            <strong>Instituto Integra</strong><br />
            Gestão Inteligente de Coworking e Saúde<br />
            Este é um e-mail transacional prioritário.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default ReservationNotificationEmail

const main = { backgroundColor: '#F5F5F7', fontFamily: 'Arial, sans-serif', color: '#1A1A2E', padding: '20px 0' }
const container = { margin: '0 auto', padding: '40px 25px', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', maxWidth: '600px' }
const logoContainer = { textAlign: 'center' as const, marginBottom: '30px' }
const logo = { margin: '0 auto' }
const h1 = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  color: '#C9A96E',
  margin: '0 0 20px',
  textAlign: 'center' as const,
}
const text = {
  fontSize: '16px',
  color: '#4A5568',
  lineHeight: '1.6',
  margin: '0 0 20px',
}
const detailsContainer = {
  backgroundColor: '#F8FAFC',
  padding: '20px',
  borderRadius: '8px',
  border: '1px solid #E2E8F0',
  marginBottom: '25px',
}
const detailItem = {
  fontSize: '15px',
  color: '#1A1A2E',
  margin: '8px 0',
}
const statusStyle = (status: string) => ({
  color: status === 'confirmada' ? '#10B981' : status === 'pendente' ? '#F59E0B' : '#EF4444',
  fontWeight: 'bold' as const,
})
const buttonContainer = { textAlign: 'center' as const, margin: '30px 0' }
const button = {
  backgroundColor: '#C9A96E',
  borderRadius: '6px',
  color: '#FFFFFF',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
}
const hr = { borderColor: '#E2E8F0', margin: '30px 0' }
const footer = { fontSize: '12px', color: '#718096', margin: '0', textAlign: 'center' as const, lineHeight: '1.5' }
