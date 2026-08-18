/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

const LOGO_URL = "https://institutointegra.lovable.app/__l5e/assets-v1/afafc8be-e750-4075-b440-3674a754d2bb/logo-integra.png";

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Recupere sua senha para {siteName}</Preview>
    <Body style={main}>
      <Section style={priorityHeader}>
        <Text style={priorityText}>IMPORTANTE: AÇÃO REQUERIDA</Text>
      </Section>
      <Container style={container}>
        <Section style={logoContainer}>
          <Img src={LOGO_URL} width="150" height="auto" alt={siteName} style={logo} />
        </Section>
        <Heading style={h1}>Recuperação de Senha</Heading>
        <Text style={text}>
          Recebemos uma solicitação para redefinir sua senha no {siteName}. 
          Clique no botão abaixo para escolher uma nova senha.
        </Text>
        <Section style={buttonContainer}>
          <Button style={button} href={confirmationUrl}>
            Redefinir Senha
          </Button>
        </Section>
        <Text style={footer}>
          Se você não solicitou a redefinição, pode ignorar este e-mail. 
          Sua senha atual permanecerá a mesma.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

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
const buttonContainer = { textAlign: 'center' as const, margin: '30px 0' }
const button = {
  backgroundColor: '#C9A96E',
  color: '#0A0A0F',
  fontSize: '16px',
  fontWeight: 'bold' as const,
  borderRadius: '8px',
  padding: '12px 24px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0', textAlign: 'center' as const }
const priorityHeader = { backgroundColor: '#C9A96E', padding: '10px', textAlign: 'center' as const }
const priorityText = { color: '#0A0A0F', fontSize: '12px', fontWeight: 'bold', margin: 0, textTransform: 'uppercase' as const }