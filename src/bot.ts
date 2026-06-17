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

const TICKET_CATEGORIES = [
  { id: "gradi_alti", label: "Assistenza Gradi Alti", emoji: "🏅", description: "Apri questa categoria di ticket, per informazioni o proposte dirette alla Fondazione." },
  { id: "segnalazione_utente", label: "Segnalazione Utente", emoji: "🚨", description: "Apri questa categoria di ticket, se vuoi segnalare un utente con l'utilizzo di prove." },
  { id: "segnalazione_bug", label: "Segnalazione Bug", emoji: "🐛", description: "Apri questa categoria di ticket, per segnalare un bug nel nostro server." },
  { id: "assistenza_discord", label: "Assistenza Discord", emoji: "💬", description: "Apri questa categoria di ticket, per ricevere assistenza sul server Discord." },
  { id: "assistenza_game", label: "Assistenza Game", emoji: "🎮", description: "Apri questa categoria di ticket, per avere aiuto nella parte di gioco." },
  { id: "partnership", label: "Richiesta Patnership", emoji: "🤝", description: "Apri questa categoria di ticket, per richiedere una patnership o collaborazione tra server." },
] as const;

const commands = [
  new SlashCommandBuilder().setName("ssu").setDescription("Server Start UP").toJSON(),
  new SlashCommandBuilder().setName("ssd").setDescription("Server Shut Down").toJSON(),
  new SlashCommandBuilder().setName("setup-ticket").setDescription("Invia il pannello ticket").setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild).toJSON(),
];

function buildTicketPanel() {
  const embed = new EmbedBuilder().setTitle("🎫 Sistema Ticket PLRP").setColor(0xb71c1c);
  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(...TICKET_CATEGORIES.slice(0, 3).map(cat => new ButtonBuilder().setCustomId(`ticket_${cat.id}`).setLabel(cat.label).setEmoji(cat.emoji).setStyle(ButtonStyle.Secondary)));
  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(...TICKET_CATEGORIES.slice(3).map(cat => new ButtonBuilder().setCustomId(`ticket_${cat.id}`).setLabel(cat.label).setEmoji(cat.emoji).setStyle(ButtonStyle.Secondary)));
  return { embed, row1, row2 };
}

export function startBot(): void {
  const token = process.env["DISCORD_BOT_TOKEN"];
  if (!token) return;

  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.once(Events.ClientReady, async (c) => {
    logger.info(`Bot connesso come ${c.user.tag}`);
    const rest = new REST().setToken(token);
    await rest.put(Routes.applicationCommands(c.user.id), { body: commands });
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "ssu") {
        await interaction.reply({ content: `${ROLE_PING} | Server ONLINE!`, allowedMentions: { roles: [ROLE_ID] } });
      } else if (interaction.commandName === "setup-ticket") {
        const { embed, row1, row2 } = buildTicketPanel();
        await interaction.reply({ embeds: [embed], components: [row1, row2] });
      }
    } else if (interaction.isButton() && interaction.customId.startsWith("ticket_")) {
      await interaction.deferReply({ ephemeral: true });
      const channel = await interaction.guild!.channels.create({
        name: `ticket-${interaction.user.username}`,
        type: ChannelType.GuildText,
        parent: null,
        permissionOverwrites: [
          { id: interaction.guild!.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
        ]
      });
      await interaction.editReply(`✅ Ticket aperto: ${channel}`);
    }
  });

  client.login(token);
}

// QUESTA È LA RIGA CHE MANCAVA:
startBot();
