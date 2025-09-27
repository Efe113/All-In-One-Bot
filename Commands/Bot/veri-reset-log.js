const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require("discord.js");
const db2 = require('../../Utils/jsonDB');

module.exports = {
  data: new SlashCommandBuilder()
    .setName("veri-reset-log")
    .setDescription("Veri sıfırlama kanalını ayarlar.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(option =>
      option
        .setName("kanal")
        .setDescription("Kanal seç.")
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(true)
    ),

  async execute(interaction) {
    const kanal = interaction.options.getChannel("kanal");
    db2.set("reset_log_channel", kanal.id);

    await interaction.reply({
      content: `<:tik_arviis:1046067679884234863> Veri sıfırlama kanalı **ayarlandı** \n\n<:hashtag_arviis:1051904217478070276> <#${kanal.id}>`,
      flags: 64,
    });
  },
};
