const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require("discord.js");
const { DiscordBanners } = require("discord-banners");
const axios = require("axios");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("banner")
    .setDescription("Kişinin bannerını verir.")
    .addUserOption(option =>
      option.setName("kişi").setDescription("Kişi seç.").setRequired(false)
    ),

  async execute(interaction, client) {
  await interaction.deferReply(); 

  const user = interaction.options.getUser("kişi") || interaction.user;
  const discordBanners = new DiscordBanners(client);

  let bannerURL;

  try {
    bannerURL = await discordBanners.getBanner(user.id, {
      size: 4096,
      format: "png",
      dynamic: true
    });
  } catch (err) {
    if (err.message === "An unexpected error occurred.") {
      bannerURL = null;
    } else {
      console.error("Banner alınamadı:", err);
      return await interaction.editReply({ 
        content: "<a:dikkat_arviis:1421402093876674641> **Banner alınırken beklenmedik bir hata oluştu.**"
      });
    }
  }

  if (!bannerURL) {
    return await interaction.editReply({
      content: `<a:dikkat_arviis:1421402093876674641> **(** ${user.username} **)** **kullanıcısının bannerı yok.**`
    });
  }

  const extension = bannerURL.includes(".gif") ? "gif" : "png";

  try {
    const response = await axios.get(bannerURL, {
      responseType: "arraybuffer",
      timeout: 5000
    });

    const buffer = Buffer.from(response.data, "utf-8");

    const attachment = new AttachmentBuilder(buffer, { name: `banner.${extension}` });

    const BannerLink = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("Banner Link")
        .setStyle(ButtonStyle.Link)
        .setURL(bannerURL)
    );

    await interaction.editReply({
      files: [attachment],
      components: [BannerLink],
      content: `<@${user.id}> **(** ${user.username} **)**`
    });

  } catch (err) {
    console.error("Banner dosyası alınamadı:", err.message);
    return await interaction.editReply({
      content: "<a:dikkat_arviis:1421402093876674641> **Banner dosyası alınırken hata oluştu.**"
    });
  }
}
};
