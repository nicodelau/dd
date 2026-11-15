import {
  Client,
  GatewayIntentBits,
  Message,
  VoiceBasedChannel,
  REST,
  Routes,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from 'discord.js';
import {
  joinVoiceChannel,
  getVoiceConnection,
  VoiceConnectionStatus,
  entersState,
} from '@discordjs/voice';
import { loadConfig } from './config.js';
import { TranscriptBuffer } from './application/TranscriptBuffer.js';
import { VoiceTranscriptionManager } from './application/VoiceTranscriptionManager.js';
import { SceneGenerationUseCase } from './application/SceneGenerationUseCase.js';
import { AutoSceneScheduler } from './application/AutoSceneScheduler.js';
import { ITranscriptionService } from './core/interfaces/ITranscriptionService.js';
import { GroqWhisperService } from './infrastructure/transcription/GroqWhisperService.js';
import { OpenAIWhisperService } from './infrastructure/transcription/OpenAIWhisperService.js';
import { LlmPromptSynthesizer, EmptyContextError } from './infrastructure/llm/LlmPromptSynthesizer.js';
import { WorldLoreRegistry } from './infrastructure/lore/WorldLoreRegistry.js';
import { IPromptSynthesizer } from './core/interfaces/IPromptSynthesizer.js';
import { IImageGenerator } from './core/interfaces/IImageGenerator.js';
import { PollinationsImageService } from './infrastructure/image/PollinationsImageService.js';
import { Dalle3ImageService } from './infrastructure/image/Dalle3ImageService.js';
import { DiscordWebhookNotifier } from './infrastructure/webhook/DiscordWebhookNotifier.js';

export async function bootstrapBot(): Promise<Client> {
  const config = loadConfig();

  // 1. Core State, Buffer & Lore Registry
  const transcriptBuffer = new TranscriptBuffer(300);
  const worldLoreRegistry = new WorldLoreRegistry();

  // 2. Transcription Service Adapter
  let transcriptionService: ITranscriptionService;
  if (config.sttProvider === 'openai') {
    transcriptionService = new OpenAIWhisperService(config.openaiApiKey!);
  } else {
    transcriptionService = new GroqWhisperService(config.groqApiKey!);
  }

  // 3. LLM Prompt Synthesizer Adapter con Lore
  let promptSynthesizer: IPromptSynthesizer;
  if (config.llmProvider === 'openai') {
    promptSynthesizer = new LlmPromptSynthesizer({
      apiKey: config.openaiApiKey!,
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o-mini',
      worldLoreRegistry,
    });
  } else {
    promptSynthesizer = new LlmPromptSynthesizer({
      apiKey: config.groqApiKey!,
      baseUrl: 'https://api.groq.com/openai/v1',
      model: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
      worldLoreRegistry,
    });
  }

  // 4. Image Generator Adapter
  let imageGenerator: IImageGenerator;
  if (config.imageProvider === 'dalle3') {
    imageGenerator = new Dalle3ImageService(config.openaiApiKey!);
  } else {
    imageGenerator = new PollinationsImageService({
      model: 'flux',
      width: 1024,
      height: 1024,
    });
  }

  // 5. Webhook Notifier Adapter & Use Case
  const webhookNotifier = new DiscordWebhookNotifier();
  const sceneGeneratorUseCase = new SceneGenerationUseCase(
    promptSynthesizer,
    imageGenerator,
    webhookNotifier
  );

  // 6. Auto-Scene Scheduler Setup (Cada 5 minutos)
  const autoScheduler = new AutoSceneScheduler({
    transcriptBuffer,
    sceneGeneratorUseCase,
    webhookUrl: config.destinationWebhookUrl,
    intervalSeconds: config.autoGenerateIntervalSeconds,
    onSceneGenerated: (result) => {
      console.log(`[Auto-Generador] ✨ Escena automática enviada al Webhook: ${result.summary}`);
    },
    onError: (err) => {
      console.error('[Auto-Generador] Error en ciclo automático:', err);
    },
  });

  // 7. Discord Client Setup
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  client.on('raw', (packet: any) => {
    if (packet.t === 'VOICE_SERVER_UPDATE' || packet.t === 'VOICE_STATE_UPDATE') {
      console.log(`[GATEWAY VOICE EVENT] ${packet.t} guild=${packet.d?.guild_id} user=${packet.d?.user_id || 'N/A'}`);
    }
  });

  // 8. Voice Transcription Manager Setup
  const transcriptionManager = new VoiceTranscriptionManager({
    transcriptBuffer,
    transcriptionService,
    getUsername: (userId: string) => {
      const user = client.users.cache.get(userId);
      return user?.displayName || user?.username || `Usuario(${userId})`;
    },
    onTranscription: (username: string, text: string) => {
      console.log(`[🎙️ Transcripción][${username}]: ${text}`);
    },
  });

  client.once('clientReady', async () => {
    console.log(`✅ Bot conectado exitosamente como ${client.user?.tag}`);
    const guildList = client.guilds.cache.map((g) => `"${g.name}" (ID: ${g.id})`).join(', ');
    console.log(`📡 Servidores conectados (${client.guilds.cache.size}): ${guildList || '(Ninguno - el bot no ha sido invitado a ningún servidor)'}`);
    console.log(`⚙️ Configuración activa:`);
    console.log(`   - STT Provider: ${config.sttProvider}`);
    console.log(`   - LLM Provider: ${config.llmProvider}`);
    console.log(`   - Image Provider: ${config.imageProvider}`);
    console.log(`   - Lore Activo: Pilotes (${worldLoreRegistry.getAllCharacters().length} personajes, ${worldLoreRegistry.getAllLocations().length} locaciones)`);
    console.log(`   - Trigger Channel: ${config.triggerChannelId || '(Cualquier canal con !generate o /generate)'}`);
    console.log(`   - Auto-Generate: ${config.autoGenerateIntervalSeconds > 0 ? `Cada ${config.autoGenerateIntervalSeconds}s (${Math.round(config.autoGenerateIntervalSeconds / 60)} min)` : 'Desactivado'}`);
    console.log(`   - Webhook Destino: ${config.destinationWebhookUrl.slice(0, 45)}...`);

    // Register slash commands
    try {
      const rest = new REST({ version: '10' }).setToken(config.discordToken);
      const commands = [
        new SlashCommandBuilder().setName('join').setDescription('Une el bot al canal de voz actual para transcribir'),
        new SlashCommandBuilder().setName('leave').setDescription('Desconecta el bot del canal de voz'),
        new SlashCommandBuilder().setName('transcripts').setDescription('Muestra las últimas transcripciones de voz'),
        new SlashCommandBuilder().setName('characters').setDescription('Lista los personajes de la campaña registrados para las imágenes'),
        new SlashCommandBuilder().setName('locations').setDescription('Lista los lugares y distritos del mundo de Pilotes'),
        new SlashCommandBuilder()
          .setName('generate')
          .setDescription('Genera una imagen basada en la conversación de voz y una instrucción opcional')
          .addStringOption((opt) => opt.setName('prompt').setDescription('Instrucción adicional para la escena').setRequired(false)),
      ].map((cmd) => cmd.toJSON());

      if (client.user) {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('⚡ Comandos Slash (/join, /leave, /generate, /transcripts, /characters, /locations) registrados globalmente.');
      }
    } catch (cmdErr) {
      console.warn('Advertencia al registrar comandos slash:', cmdErr);
    }
  });

  client.on('messageCreate', async (message: Message) => {
    if (message.author.bot) return;

    const content = message.content.trim();
    console.log(`📩 Mensaje recibido en [${message.guild?.name || 'DM'} / #${(message.channel as any).name || message.channelId}] de ${message.author.tag}: "${content}"`);

    // Command: !join
    if (content === '!join') {
      let voiceChannel: VoiceBasedChannel | null = message.member?.voice.channel ?? null;

      if (!voiceChannel && message.guild) {
        try {
          const member = await message.guild.members.fetch(message.author.id);
          voiceChannel = member.voice.channel ?? null;
        } catch {
          // ignore fetch error
        }
        if (!voiceChannel) {
          voiceChannel = (message.guild.voiceStates.cache.get(message.author.id)?.channel as VoiceBasedChannel) ?? null;
        }
      }

      if (!voiceChannel) {
        console.warn(`[Join] Usuario ${message.author.tag} no está en un canal de voz detectable.`);
        await message.reply('❌ Debes estar conectado a un canal de voz para que me pueda unir.');
        return;
      }

      try {
        const perms = voiceChannel.permissionsFor(client.user!);
        console.log(`[Join] Uniendo bot al canal de voz: "${voiceChannel.name}" (ID: ${voiceChannel.id}). Permisos: View=${perms?.has('ViewChannel')}, Connect=${perms?.has('Connect')}, Speak=${perms?.has('Speak')}`);

        if (perms && !perms.has('Connect')) {
          await message.reply(`❌ No tengo permisos para conectarme al canal de voz **${voiceChannel.name}**. Por favor otorga el permiso "Conectar" al rol del bot.`);
          return;
        }

        const connection = joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: voiceChannel.guild.id,
          adapterCreator: voiceChannel.guild.voiceAdapterCreator as any,
          selfDeaf: false,
          selfMute: false,
          debug: true,
        });

        connection.on('stateChange', (oldState, newState) => {
          console.log(`[Voice State] ${oldState.status} ➡️ ${newState.status}`);
        });

        connection.on('debug', (msg) => {
          console.log(`[Voice Debug] ${msg}`);
        });

        console.log(`[Join] Estado inicial de la conexión: ${connection.state.status}`);
        await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
        transcriptionManager.listenToReceiver(connection.receiver);

        console.log(`[Join] Conectado exitosamente a ${voiceChannel.name}`);
        if (config.autoGenerateIntervalSeconds > 0) {
          autoScheduler.start();
          console.log(`[Auto-Generador] Programador activado (cada ${config.autoGenerateIntervalSeconds}s)`);
        }
        await message.reply(`🎙️ Conectado a **${voiceChannel.name}**. Escuchando voz y generando escenas automáticamente cada ${Math.round(config.autoGenerateIntervalSeconds / 60)} minutos.`);
      } catch (err) {
        console.error('Error al unirse al canal de voz:', err);
        if (message.guild) {
          const currentConn = getVoiceConnection(message.guild.id);
          if (currentConn) {
            console.error('[Join Error Debug] Estado final:', currentConn.state.status);
            console.error('[Join Error Debug] Packets recibidos:', (currentConn as any).packets);
          }
        }
        await message.reply('❌ Ocurrió un error al intentar conectarme al canal de voz.');
      }
      return;
    }

    // Command: !leave
    if (content === '!leave') {
      if (!message.guild) return;
      autoScheduler.stop();
      const connection = getVoiceConnection(message.guild.id);
      if (connection) {
        connection.destroy();
        await message.reply('👋 Me he desconectado del canal de voz.');
      } else {
        await message.reply('ℹ️ No estoy conectado a ningún canal de voz.');
      }
      return;
    }

    // Command: !autogen [on|off|status]
    if (content.startsWith('!autogen')) {
      const arg = content.replace(/^!autogen\s*/i, '').toLowerCase().trim();
      if (arg === 'on') {
        autoScheduler.start();
        await message.reply(`⏰ Generación automática **activada** (cada ${config.autoGenerateIntervalSeconds}s / ${Math.round(config.autoGenerateIntervalSeconds / 60)} min).`);
        return;
      }
      if (arg === 'off') {
        autoScheduler.stop();
        await message.reply('⏰ Generación automática **desactivada**.');
        return;
      }
      const status = autoScheduler.isActive() ? '🟢 Activada' : '🔴 Desactivada';
      await message.reply(`⏰ Generación automática: **${status}** (Intervalo: cada ${config.autoGenerateIntervalSeconds}s / ${Math.round(config.autoGenerateIntervalSeconds / 60)} min). Comandos: \`!autogen on\`, \`!autogen off\`.`);
      return;
    }

    // Command: !transcripts (ver las últimas transcripciones)
    if (content === '!transcripts') {
      const recent = transcriptBuffer.getRecent(config.retentionSeconds);
      if (recent.length === 0) {
        await message.reply('ℹ️ No hay transcripciones registradas en la ventana de tiempo reciente.');
        return;
      }
      const formatted = recent
        .slice(-10)
        .map((t) => `**${t.username}**: ${t.text}`)
        .join('\n');
      await message.reply(`📜 **Últimas transcripciones (últimos ${config.retentionSeconds}s):**\n${formatted}`);
      return;
    }

    // Command: !characters / !personajes
    if (content === '!characters' || content === '!personajes') {
      await message.reply(worldLoreRegistry.formatCharactersMessage());
      return;
    }

    // Command: !locations / !lugares
    if (content === '!locations' || content === '!lugares') {
      await message.reply(worldLoreRegistry.formatLocationsMessage());
      return;
    }

    // Trigger Image Generation: Either message in TRIGGER_CHANNEL_ID or !generate [prompt]
    const isTriggerChannel = config.triggerChannelId && message.channel.id === config.triggerChannelId;
    const isGenerateCommand = content.startsWith('!generate') || content.startsWith('!imagen');

    if (isTriggerChannel || isGenerateCommand) {
      let userPrompt = '';
      if (isGenerateCommand) {
        userPrompt = content.replace(/^!(generate|imagen)\s*/i, '').trim();
      } else {
        userPrompt = content;
      }

      const statusMsg = await message.reply('🎨 Analizando la conversación de voz y generando la imagen...');

      try {
        const recentTranscripts = transcriptBuffer.getRecent(config.retentionSeconds);

        const result = await sceneGeneratorUseCase.execute(
          {
            channelId: message.channel.id,
            requestedBy: message.member?.displayName || message.author.username,
            userPrompt: userPrompt.length > 0 ? userPrompt : undefined,
            recentTranscripts,
          },
          config.destinationWebhookUrl
        );

        await statusMsg.edit(
          `✨ **¡Escena generada exitosamente!**\n` +
          `🖼️ Enviada al canal de destino por Webhook.\n` +
          `📝 **Resumen:** ${result.summary}`
        );
      } catch (err) {
        if (err instanceof EmptyContextError) {
          await statusMsg.edit(
            '⚠️ No hay conversación registrada en el canal de voz recientemente ni proporcionaste una descripción. ' +
            'Habla en el canal de voz o escribe: `!generate <descripción de la escena>`'
          );
        } else {
          console.error('Error al generar escena:', err);
          const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
          await statusMsg.edit(`❌ Error al generar la imagen: ${errorMsg}`);
        }
      }
    }
  });

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'join') {
      let voiceChannel: VoiceBasedChannel | null = null;
      if (interaction.guild) {
        const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
        voiceChannel = member?.voice.channel ?? null;
      }

      if (!voiceChannel) {
        await interaction.reply({ content: '❌ Debes estar conectado a un canal de voz para que me pueda unir.', ephemeral: true });
        return;
      }

      try {
        console.log(`[Slash Join] Conectando a canal de voz: ${voiceChannel.name}...`);
        const connection = joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: voiceChannel.guild.id,
          adapterCreator: voiceChannel.guild.voiceAdapterCreator as any,
          selfDeaf: false,
          selfMute: false,
        });

        connection.on('stateChange', (oldState, newState) => {
          console.log(`[Voice State] ${oldState.status} ➡️ ${newState.status}`);
        });

        connection.on('debug', (msg) => {
          console.log(`[Voice Debug] ${msg}`);
        });

        await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
        transcriptionManager.listenToReceiver(connection.receiver);

        if (config.autoGenerateIntervalSeconds > 0) {
          autoScheduler.start();
        }

        await interaction.reply(`🎙️ Conectado a **${voiceChannel.name}**. Escuchando voz y generando escenas automáticamente cada ${Math.round(config.autoGenerateIntervalSeconds / 60)} minutos.`);
      } catch (err) {
        console.error('Error al unirse al canal de voz:', err);
        await interaction.reply({ content: '❌ Ocurrió un error al intentar conectarme al canal de voz.', ephemeral: true });
      }
      return;
    }

    if (commandName === 'leave') {
      if (!interaction.guild) return;
      autoScheduler.stop();
      const connection = getVoiceConnection(interaction.guild.id);
      if (connection) {
        connection.destroy();
        await interaction.reply('👋 Me he desconectado del canal de voz.');
      } else {
        await interaction.reply({ content: 'ℹ️ No estoy conectado a ningún canal de voz.', ephemeral: true });
      }
      return;
    }

    if (commandName === 'transcripts') {
      const recent = transcriptBuffer.getRecent(config.retentionSeconds);
      if (recent.length === 0) {
        await interaction.reply({ content: 'ℹ️ No hay transcripciones registradas en la ventana de tiempo reciente.', ephemeral: true });
        return;
      }
      const formatted = recent
        .slice(-10)
        .map((t) => `**${t.username}**: ${t.text}`)
        .join('\n');
      await interaction.reply(`📜 **Últimas transcripciones (últimos ${config.retentionSeconds}s):**\n${formatted}`);
      return;
    }

    if (commandName === 'characters') {
      await interaction.reply({ content: worldLoreRegistry.formatCharactersMessage(), ephemeral: false });
      return;
    }

    if (commandName === 'locations') {
      await interaction.reply({ content: worldLoreRegistry.formatLocationsMessage(), ephemeral: false });
      return;
    }

    if (commandName === 'generate') {
      const userPrompt = interaction.options.getString('prompt') || undefined;
      await interaction.deferReply();

      try {
        const recentTranscripts = transcriptBuffer.getRecent(config.retentionSeconds);

        const result = await sceneGeneratorUseCase.execute(
          {
            channelId: interaction.channelId,
            requestedBy: (interaction.member as any)?.displayName || interaction.user.username,
            userPrompt,
            recentTranscripts,
          },
          config.destinationWebhookUrl
        );

        await interaction.editReply(
          `✨ **¡Escena generada exitosamente!**\n` +
          `🖼️ Enviada al canal de destino por Webhook.\n` +
          `📝 **Resumen:** ${result.summary}`
        );
      } catch (err) {
        if (err instanceof EmptyContextError) {
          await interaction.editReply(
            '⚠️ No hay conversación registrada en el canal de voz recientemente ni proporcionaste una descripción. ' +
            'Habla en el canal de voz o incluye el parámetro `/generate prompt:<descripción>`'
          );
        } else {
          console.error('Error al generar escena:', err);
          const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
          await interaction.editReply(`❌ Error al generar la imagen: ${errorMsg}`);
        }
      }
    }
  });

  await client.login(config.discordToken);
  return client;
}

// Direct entry point if run via `npm start` / `npm run dev`
if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
  bootstrapBot().catch((err) => {
    console.error('Error fatal al iniciar el bot:', err);
    process.exit(1);
  });
}
