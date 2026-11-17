import "dotenv/config";

interface ElevenLabsCallResponse {
  success: boolean;
  message?: string;
  conversation_id?: string;
  callSid?: string;
}

export const makeTestCall = async (
  toNumber: string
): Promise<ElevenLabsCallResponse> => {

  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;
  const phoneNumberId =
    process.env.ELEVENLABS_PHONE_NUMBER_ID;

  if (!apiKey) {
    throw new Error(
      "ELEVENLABS_API_KEY no está configurada"
    );
  }

  if (!agentId) {
    throw new Error(
      "ELEVENLABS_AGENT_ID no está configurado"
    );
  }

  if (!phoneNumberId) {
    throw new Error(
      "ELEVENLABS_PHONE_NUMBER_ID no está configurado"
    );
  }

  if (!toNumber) {
    throw new Error(
      "El número de destino es obligatorio"
    );
  }

  const response = await fetch(
    "https://api.elevenlabs.io/v1/convai/sip-trunk/outbound-call",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },

      body: JSON.stringify({
        agent_id: agentId,
        agent_phone_number_id: phoneNumberId,
        to_number: toNumber,
      }),
    }
  );

  const rawBody = await response.text();

  let data: any;

  try {
    data = JSON.parse(rawBody);
  } catch {
    data = {
      message: rawBody
    };
  }

  if (!response.ok) {
    console.error(
      "Respuesta completa de ElevenLabs:",
      JSON.stringify(data, null, 2)
    );

    throw new Error(
      typeof data === "object"
        ? JSON.stringify(data, null, 2)
        : String(data)
    );
  }

  return data;
};