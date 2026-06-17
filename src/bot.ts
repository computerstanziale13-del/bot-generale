import {
  ActionRowBuilder,
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
} from "discord.js";

const TICKET_CATEGORIES = [
  { id: "gradi_alti", label: "Assistenza Gradi Alti", emoji: "🏅" },
  { id: "segnalazione_utente", label: "Segnalazione Utente", emoji: "🚨" },
  { id: "segnalazione_bug", label: "Segnalazione Bug", emoji: "🐛" },
  { id: "assistenza_discord", label: "Assistenza Discord", emoji: "💬" },
  { id: "assistenza_game", label: "Assistenza Game", emoji: "🎮" },
  { id: "partnership", label: "Partnership", emoji: "🤝" },
] as const;

const commands = [
  new SlashCommandBuilder().setName("setup-ticket").setDescription("Invia pannello ticket").setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild).toJSON(),
];

export function startBot() {
  const token = process.env["DISCORD_BOT_TOKEN"];
  if (!token) {
    console.error("ERRORE: DISCORD_BOT_TOKEN non trovato!");
    return;
  }

  const client = new Client({ 
    intents: [
      GatewayIntentBits.Guilds, 
      GatewayIntentBits.GuildMessages, 
      GatewayIntentBits.MessageContent 
    ] 
  });

  client.once(Events.ClientReady, async (c) => {
    console.log(`LOG: Bot connesso come ${c.user.tag}`);
    const rest = new REST().setToken(token);
    await rest.put(Routes.applicationCommands(c.user.id), { body: commands });
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "setup-ticket") {
        const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(...TICKET_CATEGORIES.slice(0, 3).map(c => new ButtonBuilder().setCustomId(`ticket_${c.id}`).setLabel(c.label).setEmoji(c.emoji).setStyle(ButtonStyle.Secondary)));
        const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(...TICKET_CATEGORIES.slice(3).map(c => new ButtonBuilder().setCustomId(`ticket_${c.id}`).setLabel(c.label).setEmoji(c.emoji).setStyle(ButtonStyle.Secondary)));
        const embed = new EmbedBuilder().setTitle("🎫 Sistema Ticket").setColor(0xb71c1c);
        await interaction.reply({ embeds: [embed], components: [row1, row2] });
      }
    } else if (interaction.isButton() && interaction.customId.startsWith("ticket_")) {
      await interaction.deferReply({ ephemeral: true });
      try {
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
      } catch (e) {
        console.error("ERRORE CREAZIONE CANALE:", e);
        await interaction.editReply("❌ Errore durante la creazione del canale.");
      }
    }
  });

  client.login(token).catch(e => console.error("ERRORE LOGIN DISCORD:", e));
}
