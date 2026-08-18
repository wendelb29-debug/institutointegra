# Plano para Correção de Falhas no Login

Usuários cadastrados estão relatando dificuldades para logar. Como o erro "Invalid login credentials" foi confirmado para credenciais inexistentes, o problema real provavelmente reside na **confirmação de e-mail** (muitos usuários não confirmam e o Supabase bloqueia o login) ou em **permissões de banco de dados** que impedem o carregamento do sistema após a autenticação.

## Melhorias Técnicas

- **Persistência de Sessão**: Corrigir a lógica no `AuthProvider` que pode estar deslogando usuários de desktop prematuramente se o "Lembrar-me" não estiver marcado.
- **Feedback de E-mail não Confirmado**: Melhorar o tratamento de erro no login para avisar explicitamente se o e-mail ainda precisa ser confirmado.
- **Robustez no Carregamento de Perfil**: Adicionar proteções no `TenantContext` e `GestaoLayout` para garantir que falhas ao buscar o perfil não quebrem a interface inteira.
- **Redirecionamento Pós-Login**: Garantir que o redirecionamento para `/gestao` ocorra de forma fluida após a confirmação do e-mail.

## Detalhes Técnicos

- Alterar `src/contexts/AuthContext.tsx` para remover o `signOut` automático agressivo que ocorre antes da hidratação da sessão.
- Atualizar `src/pages/Auth.tsx` para tratar erros específicos do Supabase como `email_not_confirmed`.
- Verificar e garantir que a função `handle_new_user` no Postgres tenha permissões de execução para o papel `authenticated` (necessário para alguns fluxos de trigger).
