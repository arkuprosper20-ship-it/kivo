import { config } from '../../config';

/** Isolated OpenAI-compatible chat provider. Only place that touches the network for AI. */
export async function chatJson(systemPrompt: string, userPrompt: string): Promise<string> {
  const res = await fetch(`${config.openaiBaseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.openaiApiKey}`,
    },
    body: JSON.stringify({
      model: config.openaiModel,
      temperature: 0.7,
      max_tokens: 700,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });
  if (!res.ok) throw new Error(`llm http ${res.status}`);
  const data = (await res.json()) as any;
  const text = data?.choices?.[0]?.message?.content;
  if (!text || typeof text !== 'string') throw new Error('llm empty response');
  return text;
}
