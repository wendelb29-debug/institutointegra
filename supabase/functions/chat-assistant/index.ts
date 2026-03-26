import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é o assistente inteligente do sistema Integra Gestão — um sistema de gestão para clínicas (terapia e estética) e coworking.

Suas responsabilidades:
- Responder dúvidas sobre como usar o sistema
- Orientar o usuário em ações (agendar, cadastrar paciente, gerar diagnóstico, lançar custos, etc.)
- Ser conciso, amigável e profissional
- Quando o usuário perguntar como fazer algo, explique passo a passo e mencione em qual módulo do sistema ele encontra a funcionalidade

Módulos do sistema:
- **Dashboard** (/gestao): visão geral com indicadores
- **Agenda** (/gestao/agenda): agendamentos de consultas com visão diária/semanal/mensal
- **Pacientes** (/gestao/cadastros/pacientes): cadastro completo de pacientes
- **Instituto Gestão** (/gestao/instituto-gestao): módulo clínico com prontuário, diagnóstico com IA, evolução, anamnese, pacotes de sessões, controle de faltas
- **Salas** (/gestao/salas): gestão de salas do coworking
- **Reservas** (/gestao/reservas): calendário de reservas de salas
- **Sócios e Rateio** (/gestao/socios): gestão de sócios, custos mensais e rateio automático
- **Financeiro** (/gestao/financeiro): contas a pagar/receber, caixa clínica, caixa profissionais, orçamentos, vendas, NFS-e
- **Contratos** (/gestao/contratos): gestão de contratos com assinatura digital
- **WhatsApp** (/gestao/whatsapp): comunicação via WhatsApp integrada (Orbit Inbox)
- **Manutenção** (/gestao/manutencao): solicitações de manutenção
- **Almoxarifado**: controle de estoque, entradas, saídas e pedidos
- **Usuários** (/gestao/usuarios): gestão de usuários e perfis de acesso (somente admin)
- **Cadastros**: documentos modelo, contas, convênios, formas de pagamento, fornecedores, materiais, procedimentos, profissionais de saúde, secretárias, status de agenda

Funcionalidades de IA:
- Assistente IA no prontuário: organiza, corrige, resume e reestrutura anotações
- Diagnóstico assistido: a IA sugere diagnósticos estruturados
- Templates: modelos pré-prontos para sessões de terapia, procedimentos estéticos e diagnósticos

Responda sempre em português brasileiro. Seja breve e direto. Use markdown para formatação quando apropriado.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { messages } = await req.json();

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages.map((m: any) => ({ role: m.role, content: m.content })),
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos nas configurações." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("Erro ao processar com IA");
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("chat-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
