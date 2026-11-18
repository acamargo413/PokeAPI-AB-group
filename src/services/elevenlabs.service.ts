
import "dotenv/config";

interface ElevenLabsCallResponse {
  success: boolean;
  message?: string;
  conversation_id?: string;
  callSid?: string;
  [key: string]: unknown;
}

interface ElevenLabsAgentResponse {
  conversation_config?: {
    agent?: {
      prompt?: {
        prompt?: string;
      };
      first_message?: string;
    };
  };

  [key: string]: unknown;
}

const getConfig = () => {

  const apiKey =
    process.env.ELEVENLABS_API_KEY;

  const agentId =
    process.env.ELEVENLABS_AGENT_ID;

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

  return {
    apiKey,
    agentId,
    phoneNumberId
  };
};


// ============================================================
// OBTENER CONFIGURACIÓN COMPLETA DEL AGENTE
// ============================================================

export const getAgentConfiguration =
  async (): Promise<ElevenLabsAgentResponse> => {

    const {
      apiKey,
      agentId
    } = getConfig();

    const response =
      await fetch(
        `https://api.elevenlabs.io/v1/convai/agents/${agentId}`,
        {
          method: "GET",

          headers: {
            "xi-api-key":
              apiKey
          }
        }
      );

    const rawBody =
      await response.text();

    let data:
      ElevenLabsAgentResponse;

    try {

      data =
        JSON.parse(
          rawBody
        );

    } catch {

      throw new Error(
        `Respuesta inválida de ElevenLabs: ${rawBody}`
      );
    }

    if (!response.ok) {

      console.error(
        "Respuesta completa de ElevenLabs:",
        JSON.stringify(
          data,
          null,
          2
        )
      );

      throw new Error(
        JSON.stringify(
          data,
          null,
          2
        )
      );
    }

    return data;
  };


// ============================================================
// OBTENER PROMPT
// ============================================================

export const getAgentPrompt =
  async (): Promise<string> => {

    const data =
      await getAgentConfiguration();

    const prompt =
      data
        .conversation_config
        ?.agent
        ?.prompt
        ?.prompt;

    if (
      typeof prompt !== "string"
    ) {

      throw new Error(
        "No se encontró el prompt del agente en la configuración de ElevenLabs"
      );
    }

    return prompt;
  };


// ============================================================
// OBTENER PRIMER MENSAJE
// ============================================================

export const getAgentFirstMessage =
  async (): Promise<string> => {

    const data =
      await getAgentConfiguration();

    const firstMessage =
      data
        .conversation_config
        ?.agent
        ?.first_message;

    if (
      typeof firstMessage !== "string"
    ) {

      throw new Error(
        "No se encontró el mensaje inicial del agente en la configuración de ElevenLabs"
      );
    }

    return firstMessage;
  };


// ============================================================
// ACTUALIZAR PROMPT
// ============================================================

export const updateAgentPrompt =
  async (
    prompt: string
  ): Promise<ElevenLabsAgentResponse> => {

    const {
      apiKey,
      agentId
    } = getConfig();

    if (!prompt.trim()) {

      throw new Error(
        "El prompt no puede estar vacío"
      );
    }

    const response =
      await fetch(
        `https://api.elevenlabs.io/v1/convai/agents/${agentId}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",

            "xi-api-key":
              apiKey
          },

          body:
            JSON.stringify({
              conversation_config: {
                agent: {
                  prompt: {
                    prompt:
                      prompt.trim()
                  }
                }
              }
            })
        }
      );

    const rawBody =
      await response.text();

    let data:
      ElevenLabsAgentResponse;

    try {

      data =
        JSON.parse(
          rawBody
        );

    } catch {

      throw new Error(
        `Respuesta inválida de ElevenLabs: ${rawBody}`
      );
    }

    if (!response.ok) {

      console.error(
        "Respuesta completa de ElevenLabs:",
        JSON.stringify(
          data,
          null,
          2
        )
      );

      throw new Error(
        JSON.stringify(
          data,
          null,
          2
        )
      );
    }

    return data;
  };


// ============================================================
// ACTUALIZAR PRIMER MENSAJE
// ============================================================

export const updateAgentFirstMessage =
  async (
    firstMessage: string
  ): Promise<ElevenLabsAgentResponse> => {

    const {
      apiKey,
      agentId
    } = getConfig();

    if (!firstMessage.trim()) {

      throw new Error(
        "El mensaje inicial no puede estar vacío"
      );
    }

    const response =
      await fetch(
        `https://api.elevenlabs.io/v1/convai/agents/${agentId}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",

            "xi-api-key":
              apiKey
          },

          body:
            JSON.stringify({
              conversation_config: {
                agent: {
                  first_message:
                    firstMessage.trim()
                }
              }
            })
        }
      );

    const rawBody =
      await response.text();

    let data:
      ElevenLabsAgentResponse;

    try {

      data =
        JSON.parse(
          rawBody
        );

    } catch {

      throw new Error(
        `Respuesta inválida de ElevenLabs: ${rawBody}`
      );
    }

    if (!response.ok) {

      console.error(
        "Respuesta completa de ElevenLabs:",
        JSON.stringify(
          data,
          null,
          2
        )
      );

      throw new Error(
        JSON.stringify(
          data,
          null,
          2
        )
      );
    }

    return data;
  };


// ============================================================
// REALIZAR LLAMADA
// ============================================================

export const makeTestCall =
  async (
    toNumber: string,
    temporaryPrompt?: string,
    temporaryFirstMessage?: string
  ): Promise<ElevenLabsCallResponse> => {

    const {
      apiKey,
      agentId,
      phoneNumberId
    } = getConfig();

    if (!toNumber) {

      throw new Error(
        "El número de destino es obligatorio"
      );
    }

    const requestBody:
      Record<string, unknown> = {

      agent_id:
        agentId,

      agent_phone_number_id:
        phoneNumberId,

      to_number:
        toNumber
    };


    // ========================================================
    // CONFIGURACIÓN TEMPORAL
    // ========================================================

    if (
      (
        typeof temporaryPrompt ===
        "string"
      &&
        temporaryPrompt.trim()
      )
      ||
      (
        typeof temporaryFirstMessage ===
        "string"
        &&
        temporaryFirstMessage.trim()
      )
    ) {

      const agentOverride:
        Record<string, unknown> = {};

      if (
        typeof temporaryPrompt ===
        "string"
        &&
        temporaryPrompt.trim()
      ) {

        agentOverride.prompt = {
          prompt:
            temporaryPrompt.trim()
        };
      }

      if (
        typeof temporaryFirstMessage ===
        "string"
        &&
        temporaryFirstMessage.trim()
      ) {

        agentOverride.first_message =
          temporaryFirstMessage.trim();
      }

      requestBody.conversation_initiation_client_data = {

        type:
          "conversation_initiation_client_data",

        conversation_config_override: {

          agent:
            agentOverride
        }
      };
    }


    // ========================================================
    // PETICIÓN A ELEVENLABS
    // ========================================================

    const response =
      await fetch(
        "https://api.elevenlabs.io/v1/convai/sip-trunk/outbound-call",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            "xi-api-key":
              apiKey
          },

          body:
            JSON.stringify(
              requestBody
            )
        }
      );

    const rawBody =
      await response.text();

    let data:
      ElevenLabsCallResponse;

    try {

      data =
        JSON.parse(
          rawBody
        );

    } catch {

      data = {
        success: false,
        message:
          rawBody
      };
    }


    if (!response.ok) {

      console.error(
        "Respuesta completa de ElevenLabs:",
        JSON.stringify(
          data,
          null,
          2
        )
      );

      throw new Error(
        JSON.stringify(
          data,
          null,
          2
        )
      );
    }

    return data;
  };
