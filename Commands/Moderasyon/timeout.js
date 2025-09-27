const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");

const zamanKatsayilari = {
  saniye: 1000,
  dakika: 60 * 1000,
  saat: 60 * 60 * 1000,
  gün: 24 * 60 * 60 * 1000
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Timeout işlemleri.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ViewAuditLog)
    .addSubcommand(subcommand =>
      subcommand
        .setName("at")
        .setDescription("Belirtilen kişiye Timeout atar.")
        .addUserOption(option =>
          option.setName("kişi")
            .setDescription("Kişi seç.")
            .setRequired(true)
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
        )
        .addStringOption(option =>
          option.setName("sebep")
            .setDescription("Sebep gir.")
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName("kaldır")
        .setDescription("Belirtilen kişinin Timeoutunu kaldırır.")
        .addUserOption(option =>
          option.setName("kişi")
            .setDescription("Kişi seç.")
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const { guild, options, member: komutuKullanan } = interaction;
    const subcommand = options.getSubcommand();
    const user = options.getUser("kişi");
    const member = await guild.members.fetch(user.id).catch(() => null);
    const ikon = user.displayAvatarURL({ dynamic: true, size: 2048 });

    if (!member) {
      return interaction.reply({
        content: "<a:dikkat_arviis:1421402093876674641> **Belirtilen kişi bu sunucuda bulunamıyor.**",
        flags: 64
      });
    }

    if (member.id === komutuKullanan.id) {
      return interaction.reply({
        content: "<a:dikkat_arviis:1421402093876674641> **Kendine bu işlemi uygulayamazsın.**",
        flags: 64
      });
    }

    if (member.roles.highest.position >= komutuKullanan.roles.highest.position && komutuKullanan.id !== guild.ownerId) {
      return interaction.reply({
        content: "<a:dikkat_arviis:1421402093876674641> **Bu kişi seninle aynı veya daha yüksek bir role sahip.**",
        flags: 64
      });
    }

    if (!guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return interaction.reply({
        content: "<a:dikkat_arviis:1421402093876674641> **Bu işlem için yetkiye ihtiyacım var.**",
        flags: 64
      });
    }

    if (subcommand === "at") {
      const sureDeger = options.getInteger("sayı-gir");
      const birim = options.getString("zaman-birimi-seç");
      const reason = options.getString("sebep") || "Sebep belirtilmedi.";
      const sureMs = sureDeger * zamanKatsayilari[birim];

      if (sureDeger <= 0 || !sureMs || isNaN(sureMs)) {
        return interaction.reply({
          content: "<a:dikkat_arviis:1421402093876674641> **Geçerli bir pozitif süre gir.**",
          flags: 64
        });
      }

      if (sureMs > 2419200000) {//28 Gün - UNUTMArviS
        return interaction.reply({
          content: "<a:dikkat_arviis:1421402093876674641> **Timeout süresi maksimum __28 gün__ olabilir.**",
          flags: 64
        });
      }

      try {
        await member.timeout(sureMs, reason);

        const embed = new EmbedBuilder()
          .setAuthor({ name: "TIMEOUT UYGULANDI", iconURL: guild.iconURL({ dynamic: true }) })
          .setColor(0x337fb2)
          .setThumbnail(ikon)
          .addFields(
            { name: "<:timeout_arviis:1421412939415683092> Kişi", value: `${user}`, inline: true },
            { name: "<:hashtag_arviis:1421409016701128794> Sebep", value: reason, inline: true },
            { name: "<a:saat_arviis:1421412278544105542> Süre", value: `${sureDeger} ${birim}`, inline: true }
          );

        await interaction.reply({ embeds: [embed] });

      } catch (err) {
        console.error(err);
        return interaction.reply({
          content: "<a:dikkat_arviis:1421402093876674641> **Botun rolü bu kişiye işlem yapacak kadar yüksek olmayabilir.**",
          flags: 64
        });
      }

    } else if (subcommand === "kaldır") {
      if (!member.communicationDisabledUntilTimestamp || member.communicationDisabledUntilTimestamp < Date.now()) {
        return interaction.reply({
          content: "<a:dikkat_arviis:1421402093876674641> **Bu kişinin aktif bir Timeoutu yok.**",
          flags: 64
        });
      }

      try {
        await member.timeout(null);

        const embed = new EmbedBuilder()
          .setAuthor({ name: "TIMEOUT KALDIRILDI", iconURL: guild.iconURL({ dynamic: true }) })
          .setColor(0x57f287)
          .setThumbnail(ikon)
          .setDescription(`${user} **(** ${user.username} **)** adlı kişinin Timeoutu kaldırıldı.`);

        await interaction.reply({ embeds: [embed] });

      } catch (err) {
        console.error(err);
        return interaction.reply({
          content: "<a:dikkat_arviis:1421402093876674641> **Botun bu kişi üzerinde işlem yapacak yetkisi olmayabilir.**",
          flags: 64
        });
      }
    }
  }
};
