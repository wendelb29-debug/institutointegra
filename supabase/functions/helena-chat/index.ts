import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é a Helena, assistente virtual do Instituto Integra — uma clínica especializada em neuropsicologia, saúde emocional e estética, que também oferece coworking com salas para profissionais da saúde.

PERSONALIDADE:
- Acolhedora, educada, profissional
- Direta e objetiva
- Linguagem simples e natural
- Sempre amigável, frases curtas
- Nunca robótica

OBJETIVO PRINCIPAL:
Conduzir o visitante para AÇÕES concretas:
1. Agendar uma consulta com um profissional
2. Reservar uma sala do coworking

REGRAS:
- Sempre conduza o usuário para uma ação
- Priorize agendar ou reservar
- Respostas curtas (máximo 3 frases quando possível)
- Use emojis com moderação (1-2 por mensagem)
- Quando o contexto da página for fornecido, personalize a abordagem
- Se o usuário perguntar algo fora do escopo, redirecione gentilmente
- Sempre responda em português brasileiro
- Use markdown para formatação quando apropriado

CAPACIDADES MULTIMODAIS:
- Você pode receber e analisar imagens enviadas pelo usuário
- Quando receber uma imagem, descreva o que vê e ofereça ajuda relevante
- Você pode gerar imagens quando solicitado (o sistema cuida da geração)
- Quando o usuário enviar um arquivo/documento, analise o conteúdo e responda

SERVIÇOS DO INSTITUTO:
- Neuropsicologia e avaliação neuropsicológica
- Psicologia clínica e terapia
- Procedimentos estéticos
- Coworking para profissionais da saúde (salas por hora, diária ou mensal)

INFORMAÇÕES IMPORTANTES:
- Quando o usuário quiser agendar, mostre os profissionais disponíveis
- Quando quiser reservar sala, mostre as salas disponíveis
- Para agendar, redirecione para WhatsApp com mensagem automática
- Para reservar, redirecione para a página de reservas

Se dados de profissionais ou salas forem fornecidos no contexto, use-os para personalizar as respostas.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);


    const { messages, currentPage, action, generateImage } = await req.json();

    // --- Image generation request ---
    if (generateImage) {
      const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3.1-flash-image-preview",
          messages: [{ role: "user", content: generateImage }],
          modalities: ["image", "text"],
        }),
      });

      if (!imageResponse.ok) {
        const t = await imageResponse.text();
        console.error("Image gen error:", imageResponse.status, t);
        throw new Error("Erro ao gerar imagem");
      }

      const imageData = await imageResponse.json();
      const generatedImage = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      const textContent = imageData.choices?.[0]?.message?.content || "Aqui está a imagem gerada! 🎨";

      if (generatedImage) {
        // Upload to storage
        const base64Data = generatedImage.replace(/^data:image\/\w+;base64,/, "");
        const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        const fileName = `generated/${crypto.randomUUID()}.png`;

        const { error: uploadError } = await supabase.storage
          .from("helena-chat-files")
          .upload(fileName, binaryData, { contentType: "image/png" });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          throw new Error("Erro ao salvar imagem");
        }

        const { data: { publicUrl } } = supabase.storage
          .from("helena-chat-files")
          .getPublicUrl(fileName);

        return new Response(JSON.stringify({
          result: textContent,
          generatedImageUrl: publicUrl,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ result: textContent }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Regular chat (with optional image/file context) ---
    let contextData = "";

    if (action === "list_professionals" || messages?.some((m: any) =>
      typeof m.content === "string" && (
        m.content.toLowerCase().includes("profission") ||
        m.content.toLowerCase().includes("consult") ||
        m.content.toLowerCase().includes("agendar")
      )
    )) {
      const { data: professionals } = await supabase
        .from("health_professionals")
        .select("full_name, specialty, registration_number")
        .limit(20);

      if (professionals?.length) {
        contextData += "\n\nPROFISSIONAIS DISPONÍVEIS:\n" +
          professionals.map(p => `- ${p.full_name} | ${p.specialty}${p.registration_number ? ` | Registro: ${p.registration_number}` : ''}`).join("\n");
      } else {
        contextData += "\n\nNão há profissionais cadastrados no momento. Oriente o usuário a entrar em contato pelo WhatsApp.";
      }
    }

    if (action === "list_rooms" || messages?.some((m: any) =>
      typeof m.content === "string" && (
        m.content.toLowerCase().includes("sala") ||
        m.content.toLowerCase().includes("reserv") ||
        m.content.toLowerCase().includes("coworking")
      )
    )) {
      const { data: rooms } = await supabase
        .from("rooms")
        .select("name, type, capacity, price_hour, price_day, price_month, status, description")
        .eq("status", "disponivel")
        .limit(20);

      if (rooms?.length) {
        contextData += "\n\nSALAS DISPONÍVEIS:\n" +
          rooms.map(r => {
            let pricing = "";
            if (r.price_hour) pricing += `R$${r.price_hour}/hora `;
            if (r.price_day) pricing += `R$${r.price_day}/dia `;
            if (r.price_month) pricing += `R$${r.price_month}/mês`;
            return `- ${r.name} | Capacidade: ${r.capacity || 'N/A'} | ${pricing.trim()}${r.description ? ` | ${r.description}` : ''}`;
          }).join("\n");
      } else {
        contextData += "\n\nNão há salas disponíveis no momento.";
      }
    }

    let pageContext = "";
    if (currentPage) {
      pageContext = `\n\nO usuário está atualmente na página: ${currentPage}. Personalize sua abordagem com base nisso.`;
    }

    const systemMessage = SYSTEM_PROMPT + contextData + pageContext;

    // Build messages for the API - support multimodal content
    const apiMessages = messages.map((m: any) => {
      // If content is already multimodal (array), pass through
      if (Array.isArray(m.content)) {
        return { role: m.role, content: m.content };
      }
      return { role: m.role, content: m.content };
    });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemMessage },
          ...apiMessages,
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas mensagens em pouco tempo. Aguarde um momento 😊" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Serviço temporariamente indisponível." }), {
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
    console.error("helena-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
