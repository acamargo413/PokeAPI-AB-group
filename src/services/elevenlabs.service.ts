import "dotenv/config";

// ============================================================
// INTERFACES
// ============================================================

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
        tool_ids?: string[];
      };
      first_message?: string;
    };
  };

  [key: string]: unknown;
}

interface ElevenLabsToolResponse {
  id?: string;

  tool_config?: {
    type?: string;
    name?: string;
    description?: string;
    [key: string]: unknown;
  };

  [key: string]: unknown;
}

interface ElevenLabsToolsListResponse {
  tools?: ElevenLabsToolResponse[];
  has_more?: boolean;
  next_cursor?: string | null;
  [key: string]: unknown;
}

// ============================================================
// CONFIGURACIÓN
// ============================================================

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
// OBTENER CONFIGURACIÓN DEL AGENTE
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
        "No se encontró el prompt del agente."
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
        "No se encontró el mensaje inicial del agente."
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
        "El prompt no puede estar vacío."
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
        "El mensaje inicial no puede estar vacío."
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
// REALIZAR LLAMADA DE PRUEBA
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
        "El número de destino es obligatorio."
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
// CREAR HERRAMIENTA RAG
// ============================================================

export const crearHerramientaRag =
  async (): Promise<ElevenLabsToolResponse> => {

    const {
      apiKey
    } = getConfig();

    const ragPublicUrl =
      process.env.RAG_PUBLIC_URL;

    if (!ragPublicUrl) {
      throw new Error(
        "RAG_PUBLIC_URL no está configurada en el archivo .env"
      );
    }

    const ragUrl =
      `${ragPublicUrl.replace(/\/$/, "")}/api/rag/query`;

    const response =
      await fetch(
        "https://api.elevenlabs.io/v1/convai/tools",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            "xi-api-key":
              apiKey
          },

          body:
            JSON.stringify({

              tool_config: {

                type:
                  "webhook",

                name:
                  "buscar_pokemon",

                description:
                  "Busca información de un Pokémon en tiempo real. " +
                  "Utilízala cuando el usuario pregunte por un Pokémon, " +
                  "sus tipos, estadísticas, habilidades o evolución.",

                execution_mode:
                  "immediate",

                response_timeout_secs:
                  20,

                pre_tool_speech:
                  "auto",

                api_schema: {

                  url:
                    ragUrl,

                  method:
                    "POST",

                  request_headers: {
                    "Content-Type":
                      "application/json"
                  },

                  request_body_schema: {

                    type:
                      "object",

                    required: [
                      "consulta"
                    ],

                    properties: {

                      consulta: {

                        type:
                          "string",

                        description:
                          "Nombre o ID del Pokémon que el usuario está preguntando."

                      }

                    }

                  }

                }

              }

            })

        }
      );

    const rawBody =
      await response.text();

    let data:
      ElevenLabsToolResponse;

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
      throw new Error(
        `Error creando herramienta RAG: ${response.status} ${JSON.stringify(data)}`
      );
    }

    console.log(
      "============================================================"
    );

    console.log(
      "HERRAMIENTA RAG CREADA CORRECTAMENTE"
    );

    console.log(
      JSON.stringify(
        data,
        null,
        2
      )
    );

    console.log(
      "============================================================"
    );

    return data;
  };

// ============================================================
// LISTAR / BUSCAR HERRAMIENTAS
// ============================================================

export const listarHerramientas =
  async (): Promise<ElevenLabsToolsListResponse> => {

    const {
      apiKey
    } = getConfig();

    const response =
      await fetch(
        "https://api.elevenlabs.io/v1/convai/tools?search=buscar_pokemon&page_size=100",
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
      ElevenLabsToolsListResponse;

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
      throw new Error(
        `Error buscando herramientas: ${response.status} ${JSON.stringify(data)}`
      );
    }

    return data;
  };

// ============================================================
// BUSCAR HERRAMIENTA RAG
// ============================================================

export const buscarHerramientaRag =
  async (): Promise<ElevenLabsToolResponse> => {

    const data =
      await listarHerramientas();

    const tools =
      data.tools ?? [];

    const herramienta =
      tools.find(
        (tool) =>
          tool.tool_config?.name ===
          "buscar_pokemon"
      );

    if (!herramienta) {
      throw new Error(
        "No se encontró la herramienta buscar_pokemon en ElevenLabs."
      );
    }

    if (!herramienta.id) {
      throw new Error(
        "La herramienta buscar_pokemon no tiene un ID válido."
      );
    }

    return herramienta;
  };

// ============================================================
// ACTUALIZAR HERRAMIENTA RAG EXISTENTE
// ============================================================

export const actualizarHerramientaRag =
  async (
    herramienta: ElevenLabsToolResponse
  ): Promise<ElevenLabsToolResponse> => {

    const {
      apiKey
    } = getConfig();

    if (!herramienta.id) {
      throw new Error(
        "La herramienta RAG no tiene un ID válido."
      );
    }

    const ragPublicUrl =
      process.env.RAG_PUBLIC_URL;

    if (!ragPublicUrl) {
      throw new Error(
        "RAG_PUBLIC_URL no está configurada en el archivo .env"
      );
    }

    const ragUrl =
      `${ragPublicUrl.replace(/\/$/, "")}/api/rag/query`;

    const currentToolConfig =
      herramienta.tool_config ?? {};

    const currentApiSchema =
      (
        currentToolConfig.api_schema ??
        {}
      ) as Record<string, unknown>;

    const updatedToolConfig = {
      ...currentToolConfig,

      type:
        "webhook",

      name:
        "buscar_pokemon",

      description:
        "Busca información de un Pokémon en tiempo real. " +
        "Utilízala cuando el usuario pregunte por un Pokémon, " +
        "sus tipos, estadísticas, habilidades o evolución.",

      execution_mode:
        "immediate",

      response_timeout_secs:
        20,

      pre_tool_speech:
        "auto",

      api_schema: {

        ...currentApiSchema,

        url:
          ragUrl,

        method:
          "POST",

        request_headers: {
          "Content-Type":
            "application/json"
        },

        request_body_schema: {

          type:
            "object",

          required: [
            "consulta"
          ],

          properties: {

            consulta: {

              type:
                "string",

              description:
                "Nombre o ID del Pokémon que el usuario está preguntando."

            }

          }

        }

      }

    };

    const response =
      await fetch(
        `https://api.elevenlabs.io/v1/convai/tools/${herramienta.id}`,
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
              tool_config:
                updatedToolConfig
            })

        }
      );

    const rawBody =
      await response.text();

    let data:
      ElevenLabsToolResponse;

    try {
      data =
        JSON.parse(
          rawBody
        );
    } catch {
      throw new Error(
        `Respuesta inválida de ElevenLabs al actualizar la herramienta: ${rawBody}`
      );
    }

    if (!response.ok) {
      throw new Error(
        `Error actualizando herramienta RAG: ${response.status} ${JSON.stringify(data)}`
      );
    }

    console.log(
      "============================================================"
    );

    console.log(
      "HERRAMIENTA RAG ACTUALIZADA CORRECTAMENTE"
    );

    console.log(
      `Tool ID: ${herramienta.id}`
    );

    console.log(
      `Webhook: ${ragUrl}`
    );

    console.log(
      "============================================================"
    );

    return data;
  };

// ============================================================
// CONFIGURAR HERRAMIENTA RAG
// ============================================================

export const configurarHerramientaRag =
  async (): Promise<{
    tool: ElevenLabsToolResponse;
    agent: ElevenLabsAgentResponse;
  }> => {

    let herramienta:
      ElevenLabsToolResponse;

    try {

      herramienta =
        await buscarHerramientaRag();

    } catch (error) {

      const message =
        error instanceof Error
          ? error.message
          : "";

      if (
        !message.includes(
          "No se encontró la herramienta buscar_pokemon"
        )
      ) {
        throw error;
      }

      herramienta =
        await crearHerramientaRag();

    }

    const herramientaActualizada =
      await actualizarHerramientaRag(
        herramienta
      );

    const agente =
      await asociarHerramientaRag(
        herramientaActualizada.id
      );

    return {
      tool:
        herramientaActualizada,

      agent:
        agente
    };
  };

// ============================================================
// VERIFICAR HERRAMIENTA RAG
// ============================================================

export const verificarHerramientaRag =
  async (
    toolId: string,
    environment = "production"
  ): Promise<ElevenLabsToolResponse> => {

    const {
      apiKey
    } = getConfig();

    if (!toolId.trim()) {
      throw new Error(
        "El toolId es obligatorio."
      );
    }

    const response =
      await fetch(
        `https://api.elevenlabs.io/v1/convai/tools/${toolId.trim()}?environment=${encodeURIComponent(environment)}`,
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
      ElevenLabsToolResponse;

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
      throw new Error(
        `Error verificando herramienta: ${response.status} ${JSON.stringify(data)}`
      );
    }

    return data;
  };

// ============================================================
// ASOCIAR HERRAMIENTA RAG AL AGENTE
// ============================================================

export const asociarHerramientaRag =
  async (
    toolId?: string
  ): Promise<ElevenLabsAgentResponse> => {

    const {
      apiKey,
      agentId
    } = getConfig();

    let id =
      toolId?.trim();

    // --------------------------------------------------------
    // SI NO RECIBIMOS ID:
    // BUSCAR AUTOMÁTICAMENTE buscar_pokemon
    // --------------------------------------------------------

    if (!id) {

      const herramienta =
        await buscarHerramientaRag();

      id =
        herramienta.id;

    }

    // --------------------------------------------------------
    // OBTENER CONFIGURACIÓN ACTUAL DEL AGENTE
    // --------------------------------------------------------

    const currentConfig =
      await getAgentConfiguration();

    const currentToolIds =
      currentConfig
        .conversation_config
        ?.agent
        ?.prompt
        ?.tool_ids ?? [];

    // --------------------------------------------------------
    // EVITAR DUPLICADOS
    // --------------------------------------------------------

    const toolIds =
      Array.from(
        new Set([
          ...currentToolIds,
          id
        ])
      );

    // --------------------------------------------------------
    // ACTUALIZAR AGENTE
    // --------------------------------------------------------

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

                    tool_ids:
                      toolIds

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

      throw new Error(
        `Error asociando herramienta RAG: ${response.status} ${JSON.stringify(data)}`
      );

    }

    console.log(
      "============================================================"
    );

    console.log(
      "RAG ASOCIADO CORRECTAMENTE"
    );

    console.log(
      `Herramienta: buscar_pokemon`
    );

    console.log(
      `Tool ID: ${id}`
    );

    console.log(
      JSON.stringify(
        data,
        null,
        2
      )
    );

    console.log(
      "============================================================"
    );

    return data;
  };