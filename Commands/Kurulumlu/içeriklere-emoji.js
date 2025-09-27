const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require("discord.js");
const fs = require("fs");
const path = require("path");

const jsonPath = path.join(__dirname, "../../Database/iceriklereEmoji.json");

function loadData() {
  if (!fs.existsSync(jsonPath)) return {};
  return JSON.parse(fs.readFileSync(jsonPath, "utf8"));
}

function saveData(data) {
  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("içeriklere-emoji")
    .setDescription("Görsel veya video içeriklere emoji ekleme sistemini ayarla veya sıfırla.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommandGroup(group =>
      group.setName("görsel")
        .setDescription("Görsel içeriklere emoji sistemi")
        .addSubcommand(sub =>
          sub.setName("ayarla")
            .setDescription("Görsellere tepki ekleyen sistemi ayarlar.")
            .addChannelOption(option =>
              option.setName("kanal")
                .setDescription("Kanal seç.")
                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                .setRequired(true)
            )
        )
        .addSubcommand(sub =>
          sub.setName("sıfırla")
            .setDescription("Görsel emoji sistemini sıfırlar.")
            .addChannelOption(option =>
              option.setName("kanal")
                .setDescription("Kanal seç.")
                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                .setRequired(true)
            )
        )
    )
    .addSubcommandGroup(group =>
      group.setName("video")
        .setDescription("Video içeriklere emoji sistemi")
        .addSubcommand(sub =>
          sub.setName("ayarla")
            .setDescription("Videolara tepki ekleyen sistemi ayarlar.")
            .addChannelOption(option =>
              option.setName("kanal")
                .setDescription("Kanal seç.")
                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                .setRequired(true)
            )
        )
        .addSubcommand(sub =>
          sub.setName("sıfırla")
            .setDescription("Video emoji sistemini sıfırlar.")
            .addChannelOption(option =>
              option.setName("kanal")
                .setDescription("Kanal seç.")
                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                .setRequired(true)
            )
        )
    ),

  async execute(interaction) {
    const group = interaction.options.getSubcommandGroup();
    const subcommand = interaction.options.getSubcommand();
    const kanal = interaction.options.getChannel("kanal");

    const key = `${group}_${kanal.id}`;
    const içerikTürü = group === "görsel" ? "görsel" : "video";

    let data = loadData();

    if (subcommand === "ayarla") {
      data[key] = true;
      saveData(data);

      return interaction.reply({
        content: `<:tik_arviis:1421412906435739698> <#${kanal.id}> kanalında **${içerikTürü} içeriklere** emoji **eklenecek.**`,
        flags: 64
      });
    }

    if (subcommand === "sıfırla") {
      if (!data[key]) {
        return interaction.reply({
          content: `<a:dikkat_arviis:1421402093876674641> **Bu kanalda ${içerikTürü} emoji sistemi ayarlı değil.**`,
          flags: 64
        });
      }

      delete data[key];
      saveData(data);

      return interaction.reply({
        content: `<:tik_arviis:1421412906435739698> <#${kanal.id}> kanalındaki ${içerikTürü} emoji sistemi **sıfırlandı.**`,
        flags: 64
      });
    }
  }
};