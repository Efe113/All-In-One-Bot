const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const fs = require("fs");
const path = require("path");


module.exports = {
  data: new SlashCommandBuilder()
    .setName("kişi-bilgi")
    .setDescription("Kişinin ID'si girilince hesabı hakkında bilgi verir.")
    .addUserOption(option =>
      option.setName("id-yada-kişi")
        .setDescription("Kişi ID'si gir veya kişi seç.")
        .setRequired(true)
    ),

  async execute(interaction) {
    const { guild } = interaction;
    const user = interaction.options.getUser("id-yada-kişi") || interaction.user;
    const fetchedUser = await user.fetch();
  
    let member;
try {
    member = await guild.members.fetch(user.id);
} catch (err) {
    console.warn("Üye fetch sırasında hata:", err.message);
    member = null; 
}

        const sonGorulmePath = path.join(__dirname, "../../Database/sonGorulme.json");
        let sonGorulme = null;
        if (fs.existsSync(sonGorulmePath)) {
            try {
                const json = JSON.parse(fs.readFileSync(sonGorulmePath, "utf8"));
                if (json[user.id] && json[user.id].SonGorulme) {
                    sonGorulme = json[user.id].SonGorulme;
                }
            } catch (err) {
                console.error("Son görülme verisi okunamadı:", err);
            }
        }

      const presence = member?.presence ?? null;
        const sonGorulmeMetni = !presence || presence.status === "offline"
            ? (sonGorulme ? `<t:${parseInt(sonGorulme / 1000)}:R>` : "<:carpi_arviis:1421401682348216340> Veri yok.")
            : "<:online_arviis:1421410143484117093> Şu an aktif.";

    const avatarExtension = user.avatar?.startsWith("a_") ? "gif" : "png";
    const avatarURL = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${avatarExtension}?size=2048`;

    let bannerURL = null;
    if (fetchedUser.banner) {
      const bannerExtension = fetchedUser.banner.startsWith("a_") ? "gif" : "png";
      bannerURL = `https://cdn.discordapp.com/banners/${user.id}/${fetchedUser.banner}.${bannerExtension}?size=2048`;
    }

    const embed = new EmbedBuilder()
      .setColor(0x664dd6)
      .setAuthor({
        name: `${user.username} | Hesap Bilgileri`,
        iconURL: interaction.guild.iconURL({ dynamic: true }),
      })
      .addFields(
        { name: "Hesap Sahibi", value: `${user}`, inline: true },
        { name: "Hesap ID", value: `${user.id}`, inline: true },
        {
          name: "Hesap Oluşturma Tarihi",
          value: `<t:${Math.floor(user.createdAt / 1000)}:D> \n**(** <t:${Math.floor(user.createdAt / 1000)}:R> **)**`,
          inline: true,
        },
        { name: "Son Görülme", value: sonGorulmeMetni, inline: true },
      )
      .setThumbnail(avatarURL);

    let bannerButton;
    if (bannerURL) {
      embed.setImage(bannerURL);
      bannerButton = new ButtonBuilder()
        .setLabel("Banner Link")
        .setStyle(ButtonStyle.Link)
        .setURL(bannerURL)
    } else {
      embed.setImage("https://dummyimage.com/800x200/2b2d31/ffffff&text=Bu+kişinin+banner%C4%B1+yok.");
      bannerButton = new ButtonBuilder()
        .setLabel("Banner Yok")
        .setStyle(ButtonStyle.Danger)
        .setDisabled(true)
        .setCustomId("no_banner_button");
    }

    const avatarButton = new ButtonBuilder()
      .setLabel("Avatar Link")
      .setStyle(ButtonStyle.Link)
      .setURL(avatarURL)

    const buttons = new ActionRowBuilder().addComponents(avatarButton, bannerButton);

    await interaction.reply({
      embeds: [embed],
      components: [buttons],
    });
  }
};
