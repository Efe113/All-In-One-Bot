const { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder, ChannelType } = require("discord.js");

const zamanKatsayilari = {
  saniye: 1,
  dakika: 60,
  saat: 3600,
  gün: 86400
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("yavaşmod")
    .setDescription("Yavaş modu ayarlar.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption(option =>
      option.setName("kanal")
        .setDescription("Kanal seç.")
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
    )
    .addIntegerOption(option =>
      option.setName("sayı-gir")
        .setDescription("SADECE sayı gir.")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("zaman-birimi-seç")
        .setDescription("Seç.")
        .setRequired(true)
        .addChoices(
          { name: "Saniye", value: "saniye" },
          { name: "Dakika", value: "dakika" },
          { name: "Saat", value: "saat" },
          { name: "Gün", value: "gün" }
        )
    ),

  async execute(interaction) {
    const kanal = interaction.options.getChannel('kanal');
    const miktar = interaction.options.getInteger('sayı-gir');
    const birim = interaction.options.getString('zaman-birimi-seç');
    const ikon = interaction.guild.iconURL({ dynamic: true, size: 2048 });

    const saniye = miktar * zamanKatsayilari[birim];

    if (miktar < 0 || isNaN(saniye)) {
      return interaction.reply({
        content: "<a:dikkat_arviis:1421402093876674641> **Geçerli bir pozitif sayı gir.**",
        flags: 64
      });
    }

    if (saniye > 21600) {
      return interaction.reply({
        content: "<a:dikkat_arviis:1421402093876674641> **Yavaş mod süresi maksimum __6 saat (21600 saniye)__ olabilir.**",
        flags: 64
      });
    }

    try {
      await kanal.setRateLimitPerUser(saniye);

      const embed = new EmbedBuilder()
        .setAuthor({ name: 'YAVAŞMOD AYARLANDI', iconURL: ikon })
        .setDescription(`**(** ${kanal} **)** kanalı için yavaşmod **${miktar} ${birim}** olarak ayarlandı.`)
        .setColor(0x57F287)
        .setThumbnail(ikon);

      await interaction.reply({ embeds: [embed] });

    } catch (error) {
      console.error(error);
      return interaction.reply({
        content: "<a:dikkat_arviis:1421402093876674641> **Botun yeterli izni olmayabilir.**",
        flags: 64
      });
    }
  }
};
