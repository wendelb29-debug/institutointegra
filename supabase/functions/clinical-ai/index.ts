import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { action, text, patientData, context } = await req.json();

    let systemPrompt = "";
    let userPrompt = "";

    switch (action) {
      case "organize":
        systemPrompt = "Você é um assistente clínico. Organize as anotações de forma profissional, estruturada e clara. Mantenha todas as informações, apenas melhore a organização e clareza. Responda apenas com o texto organizado, sem comentários adicionais.";
        userPrompt = `Organize estas anotações clínicas:\n\n${text}`;
        break;

      case "correct":
        systemPrompt = "Você é um assistente de escrita clínica. Corrija erros de ortografia, gramática e pontuação. Torne o texto mais profissional mantendo o significado original. Responda apenas com o texto corrigido.";
        userPrompt = `Corrija e melhore este texto clínico:\n\n${text}`;
        break;

      case "summarize":
        systemPrompt = "Você é um assistente clínico. Resuma as informações de forma concisa e objetiva, mantendo os pontos mais importantes. Responda apenas com o resumo.";
        userPrompt = `Resuma estas informações clínicas:\n\n${text}`;
        break;

      case "restructure":
        systemPrompt = "Você é um assistente clínico. Reestruture o conteúdo em formato clínico profissional com seções claras (Queixa Principal, Observações, Conduta, etc). Responda apenas com o texto reestruturado.";
        userPrompt = `Reestruture este conteúdo clínico:\n\n${text}`;
        break;

      case "generate_diagnosis":
        systemPrompt = "Você é um assistente clínico especializado. Com base nos dados fornecidos, sugira um diagnóstico estruturado com: 1) Descrição do Quadro, 2) Análise, 3) Plano de Tratamento. IMPORTANTE: Sempre inclua o aviso: 'Sugestão gerada por IA. Revisão profissional obrigatória.' Não tome decisões definitivas.";
        userPrompt = `Dados do paciente: ${patientData ? JSON.stringify(patientData) : 'Não disponível'}\n\nInformações clínicas:\n${text}\n\nGere uma sugestão de diagnóstico estruturado.`;
        break;

      case "format_pdf":
        systemPrompt = "Você é um assistente de formatação clínica. Formate o conteúdo com linguagem formal e profissional, adequada para documentação clínica oficial. Estruture em seções claras. Responda apenas com o texto formatado.";
        userPrompt = `Formate este diagnóstico para documento oficial:\n\n${text}`;
        break;

      case "suggest_message":
        systemPrompt = "Você é um assistente de comunicação clínica. Gere mensagens profissionais e cordiais para comunicação com pacientes. Responda apenas com a mensagem sugerida.";
        const messageType = context?.messageType || "confirmacao";
        const templates: Record<string, string> = {
          confirmacao: `Gere uma mensagem de confirmação de consulta para o paciente ${patientData?.name || ''}. Inclua data e horário se disponíveis.`,
          reagendamento: `Gere uma mensagem de reagendamento de consulta para o paciente ${patientData?.name || ''}.`,
          pos_atendimento: `Gere uma mensagem de acompanhamento pós-atendimento para o paciente ${patientData?.name || ''}.`,
        };
        userPrompt = templates[messageType] || templates.confirmacao;
        break;

      case "analyze_patient":
        systemPrompt = "Você é um assistente de análise clínica. Analise o histórico do paciente e identifique: frequência irregular, possível abandono de tratamento, necessidade de retorno. Seja objetivo e baseie-se nos dados. Inclua o aviso: 'Análise gerada por IA. Revisão profissional obrigatória.'";
        userPrompt = `Analise o histórico deste paciente:\n${JSON.stringify(patientData)}\n\nHistórico de atendimentos e registros:\n${text}`;
        break;

      case "suggest_protocol":
        systemPrompt = "Você é um assistente especializado em estética. Sugira protocolos de tratamento, quantidade de sessões e auxilie na criação de pacotes. Inclua o aviso: 'Sugestão gerada por IA. Revisão profissional obrigatória.'";
        userPrompt = `Com base nas informações:\n${text}\n\nSugira um protocolo de tratamento estético.`;
        break;

      case "improve":
        systemPrompt = "Você é um assistente clínico. Melhore e refine o conteúdo clínico: ajuste a linguagem para tom profissional, complete informações que pareçam incompletas, e estruture melhor o texto. Responda apenas com o texto melhorado.";
        userPrompt = `Melhore este conteúdo clínico:\n\n${text}`;
        break;

      default:
        throw new Error(`Ação desconhecida: ${action}`);
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
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
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos em Configurações." }), {
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
    console.error("clinical-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
