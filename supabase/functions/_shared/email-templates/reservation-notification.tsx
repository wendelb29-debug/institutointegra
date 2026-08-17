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
} from 'npm:@react-email/components@0.0.22'

interface ReservationNotificationEmailProps {
  siteName: string
  clientName: string
  roomName: string
  date: string
  time: string
  status: string
}

const LOGO_URL = "https://institutointegra.lovable.app/__l5e/assets-v1/afafc8be-e750-4075-b440-3674a754d2bb/logo-integra.png";

export const ReservationNotificationEmail = ({
  siteName,
  clientName,
  roomName,
  date,
  time,
  status,
}: ReservationNotificationEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Nova reserva realizada: {roomName} - {date}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoContainer}>
          <Img src={LOGO_URL} width="150" height="auto" alt={siteName} style={logo} />
        </Section>
        <Heading style={h1}>Nova Reserva de Sala</Heading>
        <Text style={text}>
          Uma nova reserva foi registrada no sistema <strong>{siteName}</strong>.
        </Text>
        
        <Section style={detailsContainer}>
          <Text style={detailItem}>
            <strong>Cliente:</strong> {clientName}
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
            <strong>Status:</strong> <span style={statusStyle(status)}>{status.toUpperCase()}</span>
          </Text>
        </Section>

        <Hr style={hr} />
        
        <Text style={footer}>
          Este é um e-mail importante do sistema de gestão Instituto Integra.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReservationNotificationEmail

const main = { backgroundColor: '#0A0A0F', fontFamily: 'Arial, sans-serif', color: '#F5F5F7' }
const container = { padding: '40px 25px', backgroundColor: '#1A1A2E', borderRadius: '12px', border: '1px solid #C9A96E' }
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
  color: '#F5F5F7',
  lineHeight: '1.6',
  margin: '0 0 25px',
}
const detailsContainer = {
  backgroundColor: '#0A0A0F',
  padding: '20px',
  borderRadius: '8px',
  border: '1px solid #2A2A3E',
  marginBottom: '25px',
}
const detailItem = {
  fontSize: '16px',
  color: '#F5F5F7',
  margin: '5px 0',
}
const statusStyle = (status: string) => ({
  color: status === 'confirmada' ? '#4ADE80' : status === 'pendente' ? '#FACC15' : '#F87171',
  fontWeight: 'bold' as const,
})
const hr = { borderColor: '#2A2A3E', margin: '20px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '10px 0 0', textAlign: 'center' as const }
