import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  Client,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  PermissionFlagsBits,
  REST,
  Routes,
  SlashCommandBuilder,
  type TextChannel,
} from "discord.js";
import path from "node:path";
import { logger } from "./lib/logger";

const SEPARATOR = "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━";
const SERVER_NAME = "Puglia RP";
const SERVER_CODE = "gm7ja8ct";
const ROLE_PING = "<@&1502916988694040647>";
const ROLE_ID = "1502916988694040647";

const TICKET_STAFF_ROLES = ["1504460729598873751", "1502644138170912860"];
const TICKET_LOG_CHANNEL = "1515605446856016023";

const TICKET_CATEGORIES = [
  {
    id: "gradi_alti",
    label: "Assistenza Gradi Alti",
    emoji: "🏅",
    description:
      "Apri questa categoria di ticket, per informazioni o proposte dirette alla Fondazione.",
  },
  {
    id: "segnalazione_utente",
    label: "Segnalazione Utente",
    emoji: "🚨",
    description:
      "Apri questa categoria di ticket, se vuoi segnalare un utente con l'utilizzo di prove.",
  },
  {
    id: "segnalazione_bug",
    label: "Segnalazione Bug",
    emoji: "🐛",
    description:
      "Apri questa categoria di ticket, per segnalare un bug nel nostro server, in modo che il nostro team riesca a risolverlo.",
  },
  {
    id: "assistenza_discord",
    label: "Assistenza Discord",
    emoji: "💬",
    description:
      "Apri questa categoria di ticket, per ricevere assistenza sul server Discord.",
  },
  {
    id: "assistenza_game",
    label: "Assistenza Game",
    emoji: "🎮",
    description:
      "Apri questa categoria di ticket, per avere aiuto nella parte di gioco.",
  },
  {
    id: "partnership",
    label: "Richiesta Patnership",
    emoji: "🤝",
    description:
      "Apri questa categoria di ticket, per richiedere una patnership o collaborazione tra server.",
  },
] as const;

type TicketCategoryId = (typeof TICKET_CATEGORIES)[number]["id"];

const commands = [
  new SlashCommandBuilder()
    .setName("ssu")
    .setDescription("Server Start UP — Annuncia l'apertura del server")
    .toJSON(),
  new SlashCommandBuilder()
    .setName("ssd")
    .setDescription("Server Shut Down — Annuncia la chiusura del server")
    .toJSON(),
  new SlashCommandBuilder()
    .setName("setup-ticket")
    .setDescription("Invia il pannello ticket in questo canale")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .toJSON(),
];

function buildTicketPanel() {
  const logoPath = path.join(__dirname, "..", "assets", "logo.png");
  const gifPath = path.join(__dirname, "..", "assets", "logo_animated.gif");

  const logoAttachment = new AttachmentBuilder(logoPath, { name: "logo.png" });
  const gifAttachment = new AttachmentBuilder(gifPath, {
    name: "logo_animated.gif",
  });

  const descLines: string[] = [
    `Apri la categoria di ticket che ti sembra più adatta alla tua esigenza`,
    ``,
  ];

  for (const cat of TICKET_CATEGORIES) {
    descLines.push(`${SEPARATOR}`);
    descLines.push(`**${cat.emoji} ${cat.label}**`);
    descLines.push(cat.description);
    descLines.push(``);
  }
  descLines.push(SEPARATOR);

  const embed = new EmbedBuilder()
    .setAuthor({ name: "Puglia RP", iconURL: "attachment://logo.png" })
    .setTitle("🎫 Sistema Ticket PLRP")
    .setDescription(descLines.join("\n"))
    .setThumbnail("attachment://logo.png")
    .setImage("attachment://logo_animated.gif")
    .setColor(0xb71c1c);

  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    ...TICKET_CATEGORIES.slice(0, 3).map((cat) =>
      new ButtonBuilder()
        .setCustomId(`ticket_${cat.id}`)
        .setLabel(cat.label)
        .setEmoji(cat.emoji)
        .setStyle(ButtonStyle.Secondary),
    ),
  );

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    ...TICKET_CATEGORIES.slice(3).map((cat) =>
      new ButtonBuilder()
        .setCustomId(`ticket_${cat.id}`)
        .setLabel(cat.label)
        .setEmoji(cat.emoji)
        .setStyle(ButtonStyle.Secondary),
    ),
  );

  return { embed, row1, row2, logoAttachment, gifAttachment };
}

function buildInitialTicketRow() {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket_claim")
      .setLabel("Claim Ticket")
      .setEmoji({ id: "1514924637857775739" })
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("ticket_close")
      .setLabel("Chiudi Ticket")
      .setEmoji({ id: "1514923771033817210" })
      .setStyle(ButtonStyle.Danger),
  );
}

function buildClaimedTicketRow(_claimerUsername: string) {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket_release")
      .setLabel(`Rilascia`)
      .setEmoji({ id: "1514923771033817210" })
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("ticket_force_claim")
      .setLabel("Forza Claim")
      .setEmoji({ id: "1514926549403570207" })
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("ticket_close")
      .setLabel("Chiudi Ticket")
      .setEmoji({ id: "1514923771033817210" })
      .setStyle(ButtonStyle.Danger),
  );
}

export function startBot(): void {
  const token = process.env["DISCORD_BOT_TOKEN"];
  if (!token) {
    logger.warn("DISCORD_BOT_TOKEN non trovato, bot non avviato");
    return;
  }

  const client = new Client({
    intents: [GatewayIntentBits.Guilds],
  });

  client.once(Events.ClientReady, async (readyClient) => {
    logger.info({ tag: readyClient.user.tag }, "Bot Discord connesso");

    const rest = new REST().setToken(token);
    try {
      await rest.put(Routes.applicationCommands(readyClient.user.id), {
        body: commands,
      });
      logger.info("Comandi slash registrati con successo");
    } catch (err) {
      logger.error({ err }, "Errore nella registrazione dei comandi slash");
    }
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isChatInputCommand()) {
      const mention = `<@${interaction.user.id}>`;

      if (interaction.commandName === "ssu") {
        const gifPath = path.join(__dirname, "..", "assets", "ssu_bg.gif");
        const attachment = new AttachmentBuilder(gifPath, {
          name: "ssu_bg.gif",
        });

        const description = [
          `┌ Stato`,
          `╰ ONLINE ✅`,
          ``,
          `┌ Moderazione`,
          `╰ Garantita 🛡️`,
          ``,
          SEPARATOR,
          ``,
          `Nome server : **${SERVER_NAME}**`,
          ``,
          `Codice in Game : **${SERVER_CODE}**`,
          ``,
          SEPARATOR,
          ``,
          `Il membro staff vi aspetta in Game ! 📢`,
          ``,
          SEPARATOR,
          ``,
          `┌ Gestito da`,
          `╰ ${mention}`,
        ].join("\n");

        const embed = new EmbedBuilder()
          .setTitle("SSU — Server Start UP")
          .setDescription(description)
          .setImage("attachment://ssu_bg.gif")
          .setColor(0x00c853);

        await interaction.reply({
          content: ROLE_PING,
          embeds: [embed],
          files: [attachment],
          allowedMentions: { roles: [ROLE_ID] },
        });
      } else if (interaction.commandName === "ssd") {
        const lines = [
          `**SSD — Server Shut Down**`,
          `┌ Stato`,
          `╰ OFFLINE ❌`,
          ``,
          `┌ Moderazione`,
          `╰ Sospesa 🔴`,
          ``,
          SEPARATOR,
          ``,
          `Nome server : **${SERVER_NAME}**`,
          ``,
          `Codice in Game : **${SERVER_CODE}**`,
          ``,
          SEPARATOR,
          ``,
          `Il server è temporaneamente offline. 📢`,
          ``,
          SEPARATOR,
          ``,
          `┌ Gestito da`,
          `╰ ${mention}`,
        ];

        await interaction.reply({
          content: `${ROLE_PING}\n${lines.join("\n")}`,
          allowedMentions: { roles: [ROLE_ID] },
        });
      } else if (interaction.commandName === "setup-ticket") {
        const { embed, row1, row2, logoAttachment, gifAttachment } =
          buildTicketPanel();

        await interaction.reply({
          embeds: [embed],
          components: [row1, row2],
          files: [logoAttachment, gifAttachment],
        });
      }
    } else if (interaction.isButton()) {
      const { customId, guild, user } = interaction;

      if (customId.startsWith("ticket_") && customId !== "ticket_close") {
        await interaction.deferReply({ ephemeral: true });

        const categoryId = customId.replace("ticket_", "") as TicketCategoryId;
        const categoryInfo = TICKET_CATEGORIES.find(
          (c) => c.id === categoryId,
        );
        if (!categoryInfo || !guild) {
          await interaction.editReply({
            content: "❌ Errore: categoria non trovata.",
          });
          return;
        }

        const channelName = `ticket-${user.username.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
        const existing = guild.channels.cache.find(
          (ch) => ch.name === channelName,
        );
        if (existing) {
          await interaction.editReply({
            content: `❌ Hai già un ticket aperto: <#${existing.id}>`,
          });
          return;
        }

        const ticketCategory = guild.channels.cache.find(
          (ch) =>
            ch.type === ChannelType.GuildCategory &&
            ch.name.toLowerCase().includes("ticket"),
        );

        try {
          const channel = await guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            parent: ticketCategory?.id,
            permissionOverwrites: [
              {
                id: guild.roles.everyone.id,
                deny: [PermissionFlagsBits.ViewChannel],
              },
              {
                id: user.id,
                allow: [
                  PermissionFlagsBits.ViewChannel,
                  PermissionFlagsBits.SendMessages,
                  PermissionFlagsBits.ReadMessageHistory,
                ],
              },
              ...TICKET_STAFF_ROLES.map((roleId) => ({
                id: roleId,
                allow: [
                  PermissionFlagsBits.ViewChannel,
                  PermissionFlagsBits.SendMessages,
                  PermissionFlagsBits.ReadMessageHistory,
                  PermissionFlagsBits.ManageMessages,
                ],
              })),
            ],
          });

          const ticketButtons = buildInitialTicketRow();

          const ticketEmbed = new EmbedBuilder()
            .setTitle(`${categoryInfo.emoji} ${categoryInfo.label}`)
            .setDescription(
              [
                `Benvenuto <@${user.id}>!`,
                ``,
                `${categoryInfo.description}`,
                ``,
                SEPARATOR,
                ``,
                `Lo staff ti risponderà il prima possibile.`,
                `Quando hai finito premi **Chiudi Ticket**.`,
              ].join("\n"),
            )
            .setColor(0xb71c1c)
            .setTimestamp();

          const staffPings = TICKET_STAFF_ROLES.map((r) => `<@&${r}>`).join(" ");
          await (channel as TextChannel).send({
            content: `<@${user.id}> | ${staffPings}`,
            embeds: [ticketEmbed],
            components: [ticketButtons],
            allowedMentions: { users: [user.id], roles: TICKET_STAFF_ROLES },
          });

          await interaction.editReply({
            content: `✅ Ticket aperto: <#${channel.id}>`,
          });

          logger.info(
            { user: user.tag, category: categoryId, channel: channel.name },
            "Ticket aperto",
          );
        } catch (err) {
          logger.error({ err }, "Errore nella creazione del ticket");
          await interaction.editReply({
            content:
              "❌ Errore nella creazione del ticket. Assicurati che il bot abbia i permessi **Gestisci Canali**.",
          });
        }
      } else if (customId === "ticket_claim" || customId === "ticket_force_claim") {
        const memberRoles = interaction.member?.roles;
        const hasStaffRole =
          memberRoles &&
          "cache" in memberRoles &&
          TICKET_STAFF_ROLES.some((r) => memberRoles.cache.has(r));

        if (!hasStaffRole) {
          await interaction.reply({
            content: "❌ Solo lo staff può prendere in carico un ticket.",
            ephemeral: true,
          });
          return;
        }

        const originalMsg = interaction.message;
        await originalMsg.edit({ components: [buildClaimedTicketRow(user.username)] });

        const isForce = customId === "ticket_force_claim";
        const claimEmbed = new EmbedBuilder()
          .setDescription(
            isForce
              ? `🔀 Ticket forzato in carico da <@${user.id}>!`
              : `🙋 Ticket preso in carico da <@${user.id}>!`
          )
          .setColor(0x00c853)
          .setTimestamp();

        await interaction.reply({ embeds: [claimEmbed] });

        logger.info(
          { staff: user.tag, channel: interaction.channel?.id, forced: isForce },
          "Ticket claimed",
        );
      } else if (customId === "ticket_release") {
        const memberRoles = interaction.member?.roles;
        const hasStaffRole =
          memberRoles &&
          "cache" in memberRoles &&
          TICKET_STAFF_ROLES.some((r) => memberRoles.cache.has(r));

        if (!hasStaffRole) {
          await interaction.reply({
            content: "❌ Solo lo staff può rilasciare un ticket.",
            ephemeral: true,
          });
          return;
        }

        await interaction.message.edit({ components: [buildInitialTicketRow()] });
        await interaction.reply({
          content: `↩️ Ticket rilasciato da <@${user.id}>. Disponibile per essere claimato.`,
        });

        logger.info(
          { staff: user.tag, channel: interaction.channel?.id },
          "Ticket released",
        );
      } else if (customId === "ticket_close") {
        if (!interaction.channel || !guild) return;

        await interaction.reply({
          content: "🔒 Ticket in chiusura, generazione transcript...",
          ephemeral: true,
        });

        const channel = interaction.channel as TextChannel;

        const allMessages = [];
        let lastId: string | undefined;

        while (true) {
          const fetched = await channel.messages.fetch({
            limit: 100,
            ...(lastId ? { before: lastId } : {}),
          });
          if (fetched.size === 0) break;
          allMessages.push(...fetched.values());
          lastId = fetched.last()?.id;
          if (fetched.size < 100) break;
        }

        allMessages.reverse();

        const lines = allMessages
          .filter((m) => !m.author.bot || m.embeds.length > 0)
          .map((m) => {
            const ts = m.createdAt.toLocaleString("it-IT", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });
            const embedText =
              m.embeds.length > 0
                ? m.embeds
                    .map((e) => [e.title, e.description].filter(Boolean).join("\n"))
                    .join("\n")
                : "";
            const content = m.content || embedText;
            return `[${ts}] ${m.author.tag}: ${content}`;
          });

        const transcriptText = [
          `═══════════════════════════════════`,
          `  TRANSCRIPT — ${channel.name}`,
          `  Chiuso da: ${user.tag}`,
          `  Data: ${new Date().toLocaleString("it-IT")}`,
          `═══════════════════════════════════`,
          ``,
          ...lines,
        ].join("\n");

        const transcriptBuffer = Buffer.from(transcriptText, "utf-8");
        const transcriptFile = new AttachmentBuilder(transcriptBuffer, {
          name: `transcript-${channel.name}.txt`,
        });

        try {
          const logChannel = await guild.channels.fetch(TICKET_LOG_CHANNEL);
          if (logChannel && logChannel.isTextBased()) {
            const logEmbed = new EmbedBuilder()
              .setTitle("📋 Transcript Ticket")
              .setDescription(
                [
                  `**Canale:** ${channel.name}`,
                  `**Chiuso da:** <@${user.id}>`,
                  `**Messaggi:** ${lines.length}`,
                ].join("\n"),
              )
              .setColor(0x607d8b)
              .setTimestamp();

            await (logChannel as TextChannel).send({
              embeds: [logEmbed],
              files: [transcriptFile],
            });
          }
        } catch (err) {
          logger.error({ err }, "Errore invio transcript nel canale log");
        }

        const closeEmbed = new EmbedBuilder()
          .setDescription(
            `Ticket chiuso da <@${user.id}>.
Il canale verrà eliminato tra 5 secondi.`,
          )
          .setColor(0x607d8b)
          .setTimestamp();

        await channel.send({ embeds: [closeEmbed] });

        setTimeout(() => {
          channel.delete("Ticket chiuso").catch((err) => {
            logger.error({ err }, "Errore nell'eliminazione del canale ticket");
          });
        }, 5000);

        logger.info({ user: user.tag, channel: channel.name }, "Ticket chiuso");
      }
    }
  });

  client.login(token).catch((err) => {
    logger.error({ err }, "Errore nel login del bot Discord");
  });
}
