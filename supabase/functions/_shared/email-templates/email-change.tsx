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
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface EmailChangeEmailProps {
  siteName: string
  oldEmail: string
  email: string
  newEmail: string
  confirmationUrl: string
}

const LOGO_URL = "https://institutointegra.lovable.app/__l5e/assets-v1/afafc8be-e750-4075-b440-3674a754d2bb/logo-integra.png";

export const EmailChangeEmail = ({
  siteName,
  oldEmail,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Confirme a alteração de seu e-mail para {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoContainer}>
          <Img src={LOGO_URL} width="150" height="auto" alt={siteName} style={logo} />
        </Section>
        <Heading style={h1}>Alteração de E-mail</Heading>
        <Text style={text}>
          Você solicitou a alteração do seu e-mail no {siteName} de{' '}
          <Link href={`mailto:${oldEmail}`} style={link}>
            {oldEmail}
          </Link>{' '}
          para{' '}
          <Link href={`mailto:${newEmail}`} style={link}>
            {newEmail}
          </Link>
          .
        </Text>
        <Text style={text}>
          Clique no botão abaixo para confirmar esta alteração:
        </Text>
        <Section style={buttonContainer}>
          <Button style={button} href={confirmationUrl}>
            Confirmar Alteração
          </Button>
        </Section>
        <Text style={footer}>
          Se você não solicitou esta alteração, proteja sua conta imediatamente.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

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
const link = { color: '#C9A96E', textDecoration: 'none' }
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