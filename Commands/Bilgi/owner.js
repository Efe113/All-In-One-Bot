const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
    .setName("owner")
    .setDescription("Sunucu sahibini gösterir."),

  async execute(interaction) {

    const { guild } = interaction;
    const user = interaction;
    const owner = await interaction.guild.fetchOwner();

    const KurucuEmbed = new EmbedBuilder()
    .setAuthor({ name: `${guild.name} | KURUCU BİLGİ`, iconURL: guild.iconURL({ dynamic: true }) })
    .setDescription(`Sunucu sahibi ${owner} **(** ${owner.user.username} **)**`)
    .setColor(0xffc403)
    .setThumbnail(owner.user.displayAvatarURL())

interaction.reply({ embeds: [KurucuEmbed] })
  }};