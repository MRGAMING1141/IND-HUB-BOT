const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
} = require("discord.js");

const TOKEN = process.env.TOKEN || "c390d6104e7182ebb0e02c0ace0ba56d1abfeadd7c6fa28ce203853893a584b9";

const SCRIPT = `loadstring(game:HttpGet("https://raw.githubusercontent.com/MRGAMING1141/Mrisreal/refs/heads/main/IND%20HUB%20LOADER"))()`;

const KEY = "INDONTOP";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  await client.application.commands.create(
    new SlashCommandBuilder()
      .setName("panel")
      .setDescription("Post the IND Hub Access Portal")
      .toJSON()
  );
  console.log("✅ /panel command registered");
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.isChatInputCommand() && interaction.commandName === "panel") {
    const embed = new EmbedBuilder()
      .setTitle("⚡ IND Hub | Access Portal")
      .setDescription("Get script using the buttons below!")
      .addFields(
        { name: "• Status", value: "🟢 Working / Undetected" },
        { name: "• Executor", value: "PC & Mobile Supported" },
        { name: "• Key System", value: "Key Available Below" }
      )
      .setColor(0x5865f2)
      .setFooter({ text: "IND Hub" });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("get_script")
        .setLabel("Get Script")
        .setEmoji("📋")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("get_key")
        .setLabel("Get Key")
        .setEmoji("🔑")
        .setStyle(ButtonStyle.Success)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  }

  if (interaction.isButton()) {
    if (interaction.customId === "get_script") {
      await interaction.reply({
        content: `📋 **Your Script:**\n\`\`\`lua\n${SCRIPT}\n\`\`\``,
        ephemeral: true,
      });
    }
    if (interaction.customId === "get_key") {
      await interaction.reply({
        content: `🔑 **Your Key:**\n\`\`\`\n${KEY}\n\`\`\``,
        ephemeral: true,
      });
    }
  }
});

client.login(TOKEN);
