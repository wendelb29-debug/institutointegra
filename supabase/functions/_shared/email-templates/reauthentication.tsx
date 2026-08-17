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
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

const LOGO_URL = "https://institutointegra.lovable.app/__l5e/assets-v1/afafc8be-e750-4075-b440-3674a754d2bb/logo-integra.png";

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seu código de verificação</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoContainer}>
          <Img src={LOGO_URL} width="150" height="auto" alt="Integra" style={logo} />
        </Section>
        <Heading style={h1}>Confirme sua Identidade</Heading>
        <Text style={text}>Use o código abaixo para confirmar sua identidade:</Text>
        <Section style={codeContainer}>
          <Text style={codeStyle}>{token}</Text>
        </Section>
        <Text style={footer}>
          Este código expira em breve. Se você não solicitou isso, pode ignorar este e-mail com segurança.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

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
  textAlign: 'center' as const,
}
const codeContainer = { textAlign: 'center' as const, margin: '30px 0' }
const codeStyle = {
  fontFamily: 'Courier, monospace',
  fontSize: '32px',
  fontWeight: 'bold' as const,
  color: '#C9A96E',
  letterSpacing: '5px',
  margin: '0',
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0', textAlign: 'center' as const }