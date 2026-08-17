# Configuração de Infraestrutura de Email

## Domínio e Envio
- **Domínio**: `notify.institutointegra.site` (Delegado e Verificado via NS).
- **Sender**: `noreply@institutointegra.site`.
- **Branding**: Logo oficial integrada via asset pointer.
- **Idioma**: Todos os templates traduzidos para Português (Brasil).

## Fluxo de Autenticação
- **Confirmação de Registro**: Envia email de boas-vindas com link de verificação.
- **Recuperação de Senha**: Envia link para redefinição.
- **Convite**: Suporte a convites de novos membros para o coworking.
- **Troca de Email**: Verificação dupla (antigo e novo).
- **Magic Link**: Login sem senha habilitado.

## Monitoramento
- Logs e status de entrega disponíveis em **Cloud → Emails**.
