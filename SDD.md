# Software Design Document (SDD) - Discord Voice Transcriber & Scene Image Generator

## 1. Objetivo y Planteamiento del Problema
- **Problema:** En sesiones de rol (D&D) o conversaciones en canales de voz de Discord, las descripciones verbales y momentos épicos ocurren de forma efímera. No existe un registro estructurado por hablante ni una forma inmediata y visual de plasmar lo que los participantes están imaginando y describiendo en tiempo real sin salir de Discord o pausar la partida.
- **Objetivo:** Desarrollar un bot de Discord en TypeScript/Node.js capaz de:
  1. Conectarse al canal de voz y transcribir de forma individualizada el audio de cada participante (`speaker diarization` nativa por SSRC de Discord).
  2. Almacenar temporalmente las transcripciones con identificación de usuario y marca de tiempo en un buffer en memoria (`TranscriptBuffer`).
  3. Detectar comandos o mensajes en un canal de texto disparador (`TRIGGER_CHANNEL_ID`).
  4. Sintetizar un prompt visual mediante un LLM combinando la conversación reciente y la instrucción del usuario.
  5. Generar una imagen (compatible con proveedores gratuitos como Pollinations/Groq y de alta fidelidad como DALL-E 3).
  6. Publicar la imagen generada en un canal de destino específico mediante un Discord Webhook.

---

## 2. Propuesta de Arquitectura y Flujo de Datos

### Arquitectura (Hexagonal / Modular)
El bot se ubicará en la carpeta `discord-bot/` dentro del repositorio para mantener una estricta separación de responsabilidades y modularidad:

```
discord-bot/
├── src/
│   ├── core/                      # Dominio e Interfaces
│   │   ├── interfaces/
│   │   │   ├── ITranscriptionService.ts
│   │   │   ├── IPromptSynthesizer.ts
│   │   │   ├── IImageGenerator.ts
│   │   │   └── IWebhookNotifier.ts
│   │   └── models/
│   │       ├── TranscriptEntry.ts
│   │       └── GenerationRequest.ts
│   ├── infrastructure/           # Adaptadores y Servicios Externos
│   │   ├── audio/
│   │   │   ├── OpusDecoderStream.ts
│   │   │   └── SilenceDetector.ts
│   │   ├── transcription/
│   │   │   ├── GroqWhisperService.ts     # Opción Gratuita (Groq API)
│   │   │   └── OpenAIWhisperService.ts   # Opción OpenAI
│   │   ├── llm/
│   │   │   └── LlmPromptSynthesizer.ts   # Groq LLaMA 3.3 / OpenAI GPT-4o-mini
│   │   ├── image/
│   │   │   ├── PollinationsImageService.ts # Opción 100% Gratuita (Flux/SD)
│   │   │   └── Dalle3ImageService.ts       # Opción DALL-E 3
│   │   └── webhook/
│   │       └── DiscordWebhookNotifier.ts
│   ├── application/              # Casos de uso y orquestadores
│   │   ├── VoiceTranscriptionManager.ts  # Captura audio por usuario y bufferiza
│   │   ├── SceneGenerationUseCase.ts     # Orquesta LLM + Generación + Webhook
│   │   └── TranscriptBuffer.ts           # Rolling buffer en memoria
│   ├── bot.ts                    # Cliente Discord.js y eventos
│   └── config.ts                 # Variables de entorno y configuración
└── tests/
    ├── TranscriptBuffer.test.ts
    ├── SceneGenerationUseCase.test.ts
    ├── LlmPromptSynthesizer.test.ts
    └── DiscordWebhookNotifier.test.ts
```

### Flujo de Datos
1. **Audio a Texto (Por Hablante):**
   - El bot se conecta al canal de voz (`@discordjs/voice`).
   - Cuando un usuario habla, el `AudioReceiveStream` de `@discordjs/voice` emite paquetes Opus asociados al `userId`.
   - Se detecta fin de habla tras ~1 segundo de silencio (`EndBehaviorType.AfterSilence`).
   - El audio Opus se decodifica a PCM/WAV en memoria (sin escribir a disco innecesariamente).
   - Se envía el buffer de audio a `ITranscriptionService` (Groq Whisper / OpenAI Whisper).
   - Se guarda la entrada en `TranscriptBuffer`: `{ userId, username, text, timestamp }`.

2. **Disparo de Generación:**
   - Un usuario escribe en el canal disparador (ej: `#generar-escena`) o usa `/generate [instrucción]`.
   - `SceneGenerationUseCase` extrae los últimos $N$ minutos de transcripción del `TranscriptBuffer`.
   - `IPromptSynthesizer` construye un prompt artístico en inglés enfocado en estilo visual (fantasía/realista) a partir de la conversación y la instrucción adicional.
   - `IImageGenerator` produce la imagen (URL o Buffer).
   - `IWebhookNotifier` envía la imagen al canal de destino configurado mediante `Discord Webhook` con un embed que incluye el autor, la descripción y un resumen de la escena.

### Modelos de Datos / Interfaces
```typescript
export interface TranscriptEntry {
  userId: string;
  username: string;
  text: string;
  timestamp: Date;
}

export interface GenerationRequest {
  channelId: string;
  requestedBy: string;
  userPrompt?: string;
  recentTranscripts: TranscriptEntry[];
}

export interface GeneratedSceneResult {
  imageUrl: string;
  revisedPrompt: string;
  summary: string;
  requestedBy: string;
  timestamp: Date;
}
```

---

## 3. Cambios en APIs e Interfaces

### Nuevos Métodos / Contratos
- `ITranscriptionService.transcribeAudio(pcmWavBuffer: Buffer): Promise<string>`
  - Entrada: Buffer de audio WAV/PCM mono 16kHz / 48kHz.
  - Salida: Texto transcrito.
- `IPromptSynthesizer.synthesizePrompt(context: GenerationRequest): Promise<{ prompt: string; summary: string }>`
  - Entrada: Transcripciones recientes + instrucción del usuario.
  - Salida: Prompt visual enriquecido en inglés y resumen en español.
- `IImageGenerator.generateImage(prompt: string): Promise<string>`
  - Entrada: Prompt de imagen.
  - Salida: URL de la imagen generada o buffer.
- `IWebhookNotifier.sendScene(webhookUrl: string, result: GeneratedSceneResult): Promise<void>`
  - Entrada: Webhook URL y resultado de la escena.
  - Salida: Envío a Discord con embed y adjunto de imagen.
- `TranscriptBuffer`:
  - `add(entry: TranscriptEntry): void`
  - `getRecent(durationSeconds: number): TranscriptEntry[]`
  - `clear(): void`

---

## 4. Plan de Pruebas (TDD)

### A. Casos de Éxito (Happy Paths)
1. **`TranscriptBuffer` - Almacenamiento y Recuperación:**
   - Input: Se añaden 5 entradas en diferentes timestamps.
   - Expected Output: `getRecent(300)` devuelve solo las entradas dentro de la ventana de 5 minutos, ordenadas cronológicamente.
2. **`LlmPromptSynthesizer` - Generación de Prompt:**
   - Input: Transcripciones de dos jugadores describiendo una taberna y un ogro, con instrucción de usuario "hazlo épico".
   - Expected Output: Retorna un objeto con un `prompt` artístico en inglés no vacío y un `summary` conciso en español.
3. **`SceneGenerationUseCase` - Flujo Completo Integrado (Mocks):**
   - Input: Petición con 3 entradas de transcripción recientes.
   - Expected Output: Se llama al sintetizador, luego al generador de imágenes, y finalmente al webhook notifier con los datos correctos.
4. **`DiscordWebhookNotifier` - Envío a Discord:**
   - Input: Objeto `GeneratedSceneResult` y Webhook URL válida.
   - Expected Output: Petición HTTP POST enviada con payload estructurado de Discord (Embed con imagen y autor).

### B. Casos de Fallo y Errores (Edge Cases)
1. **Buffer Vacío al Generar Escena:**
   - Input: El usuario pide generar imagen sin que nadie haya hablado ni aportado un prompt textual.
   - Expected Output: Lanza error descriptivo `EmptyContextError` sin llamar al generador de imágenes ni gastar cuota.
2. **Fallo en Servicio de Transcripción:**
   - Input: Audio inaudible, silencio absoluto o error 429/500 de la API de Whisper.
   - Expected Output: Se captura la excepción, se descarta silenciosamente el chunk sin romper el stream de voz ni la estabilidad del bot.
3. **Fallo en API de Imagen / Webhook Inválido:**
   - Input: Error de red o Webhook URL mal configurada.
   - Expected Output: El caso de uso notifica un mensaje de error limpio al canal de origen para informar al usuario ("No se pudo generar la imagen: [motivo]"), registrando el log técnico.

---

## 5. Plan de Implementación (Paso a Paso)

1. [x] **Configuración del Módulo `discord-bot`:**
   - Crear `discord-bot/package.json` con dependencias (`discord.js`, `@discordjs/voice`, `prism-media`, `@discordjs/opus`, etc.) y `tsconfig.json`.
   - Configurar scripts de test con Vitest.
2. [x] **Fase Roja & Verde: `TranscriptBuffer`:**
   - Test unitario de buffer temporal rodante con límite de tiempo y tamaño.
   - Implementación de `TranscriptBuffer`.
3. [x] **Fase Roja & Verde: `PromptSynthesizer`:**
   - Test unitario con mock de LLM (Groq / OpenAI).
   - Implementación de `LlmPromptSynthesizer`.
4. [x] **Fase Roja & Verde: Proveedores de Imagen y Notificador:**
   - Test unitario de `PollinationsImageService` (gratis) y `Dalle3ImageService`.
   - Test unitario de `DiscordWebhookNotifier`.
   - Implementación de los servicios.
5. [x] **Fase Roja & Verde: `SceneGenerationUseCase`:**
   - Test unitario orquestando transcripciones -> prompt -> imagen -> webhook.
   - Implementación de `SceneGenerationUseCase`.
6. [x] **Integración de Voz de Discord (`VoiceTranscriptionManager`):**
   - Implementar receptor de streams Opus por SSRC / User ID y decodificación a PCM/WAV.
   - Integración con servicio de transcripción (Groq Whisper gratis / OpenAI Whisper).
7. [x] **Cliente Discord (`bot.ts`):**
   - Comandos de voz: `/join`, `/leave`.
   - Escucha de canal disparador y comando `/generate`.
   - Dispatcher a Webhook.

---

## 6. Extensión: Generación Automática Periódica (Auto-Generate)

### A. Objetivo
Generar automáticamente una imagen de escena cada intervalo configurable (ej. 300 segundos / 5 minutos) mientras el bot esté en un canal de voz, sin requerir que los usuarios escriban `!generate` manualmente.

### B. Reglas de Negocio y Flujo
1. **Detección de Nuevas Transcripciones:** Cada vez que el temporizador venza (ej. cada 5 min), el programador comprueba si hubo nuevas transcripciones de voz desde la última generación exitosa.
2. **Defensa contra Silencio:** Si ningún usuario habló durante ese intervalo o el buffer está vacío, se omite silenciosamente el ciclo para no generar imágenes duplicadas ni gastar cuotas innecesarias.
3. **Ciclo de Vida:**
   - Se activa automáticamente al conectarse con `!join` o `/join`.
   - Se detiene automáticamente al desconectarse con `!leave` o `/leave`.
   - Permite comandos manuales `!autogen on`, `!autogen off` y `!autogen status`.

### C. Plan de Pruebas (TDD)
1. [x] **Happy Path:**
   - Intervalo vence, existen 3 transcripciones nuevas -> `AutoSceneScheduler` invoca a `SceneGenerationUseCase` y actualiza la marca de agua de tiempo.
2. [x] **Edge Case (Sin actividad):**
   - Intervalo vence, pero no hay transcripciones nuevas desde la última ejecución -> `SceneGenerationUseCase` NO es invocado.
3. [x] **Lifecycle:**
   - Llamar a `start()` activa el intervalo; llamar a `stop()` lo cancela limpiamente sin fugas de memoria.

---

## 7. Extensión: Catálogo de Personajes, Mundo (Pilotes) y Consistencia Visual

### A. Objetivo y Planteamiento
- **Problema:** Las imágenes generadas por modelos de difusión (FLUX, DALL-E) varían aleatoriamente en el aspecto físico de los personajes recurrentes y la ambientación estética del mundo si no se les inyectan descriptores visuales idénticos y fijos.
- **Objetivo:**
  1. Registrar perfiles visuales enriquecidos para los personajes de la campaña (**Siegarth, Velyra, Olivar, Timor, Chiflo**) y las locaciones del mundo de **Pilotes** (distritos: *Palermo, Opus, Puerto, Lafe*).
  2. Implementar un `WorldLoreRegistry` desacoplado y extensible mediante JSON o TypeScript.
  3. Inyectar automáticamente las descripciones físicas precisas en inglés y el preset de estilo maestro (*Dark fantasy chiaroscuro cinematic digital painting*) en el `LlmPromptSynthesizer`.
  4. Proveer comandos de consulta en Discord (`!characters`, `!locations`).

### B. Mapeo de Personajes y Locaciones
1. **Personajes:**
   - **Siegarth:** Esqueleto no-muerto con capucha marrón andrajosa, túnica rota, vendajes en muñecas, correajes cruzados de cuero con pequeña poción roja en el cinto.
   - **Velyra:** Tiefling melancólico de cuernos oscuros anillados curvados, orejas puntiagudas, capa negra con broche de pentagrama, y relicario resplandeciente en el pecho con el retrato de un niño sonriente.
   - **Olivar:** Guerrero humano de barba y cabello oscuro corto, cota de malla y armadura de placas con una perforación herida en el pecho sobre el corazón, empuñando espada larga y daga.
   - **Timor:** Dracónido (dragonborn) de escamas doradas, armadura pesada dorada/bronce con cruz pectoral, faldón y capa roja, empuñando maza de guerra y escudo.
   - **Chiflo (Alias: "Malaspulgas"):** Gnomo rústico y pícaro con sombrero cónico muy alto, barba tupida, sonrisa cómplice y gran nariz, sosteniendo una jarra de cerveza en la taberna (asociado al cartel *Wanted: Malaspulgas*).
2. **Mundo / Locaciones (Pilotes):**
   - **Pilotes:** Ciudad amurallada costera medieval dividida en distritos con castillo superior.
   - **Palermo:** Distrito residencial/aristocrático superior junto al castillo fortificado.
   - **Opus:** Distrito central comercial y artesanal con plaza y escudo emblemático.
   - **Puerto:** Distrito marítimo con muelles de madera, barcos amarrados y salida al mar.
   - **Lafe:** Distrito extramuros o rural con granjas, campos verdes y casas rústicas.
3. **Master Art Preset (Ambientación & Iluminación):**
   - Estilo: *Dark fantasy cinematic digital painting, chiaroscuro dramatic lighting, high contrast deep shadows with warm golden lantern/candle/magic light, rustic textures (weathered leather, rusted mail, aged oak, wet cobblestone), 8k resolution, atmospheric fantasy realism*.

### C. Propuesta de Arquitectura y Flujo de Datos
```
discord-bot/src/
├── core/
│   └── models/
│       └── WorldLore.ts              # Interfaces CharacterProfile, LocationProfile
└── infrastructure/
    └── lore/
        ├── WorldLoreRegistry.ts      # Registro y búsqueda de entidades
        └── worldLore.json            # Base de datos de personajes y lugares
```

### D. Plan de Pruebas (TDD)
1. **`WorldLoreRegistry` - Carga y Búsqueda de Entidades:**
   - Input: Texto `"Timor y Siegarth caminan por el distrito de Puerto"`.
   - Expected Output: Encuentra `[Timor, Siegarth]` en personajes y `[Puerto, Pilotes]` en locaciones.
2. **`LlmPromptSynthesizer` con Contexto de Lore:**
   - Input: Transcripción con mención a "Velyra" y "Chiflo".
   - Expected Output: El prompt generado contiene los descriptores visuales fijos de ambos personajes y la ambientación chiaroscuro.
3. **Comando `!characters` / `!locations` en Discord:**
   - Input: Mensaje `!characters`.
   - Expected Output: Envía mensaje formateado con los personajes registrados y sus alias.

### E. Plan de Implementación
1. [ ] Crear tests unitarios en `tests/WorldLoreRegistry.test.ts`.
2. [ ] Implementar `WorldLoreRegistry` y `worldLore.json` con los 5 personajes y distritos de Pilotes.
3. [ ] Integrar `WorldLoreRegistry` en `LlmPromptSynthesizer` y actualizar sus tests.
4. [ ] Integrar en `bot.ts` con comandos `!characters`, `!locations` y slash commands.


