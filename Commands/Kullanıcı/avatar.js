const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require("discord.js");
const axios = require("axios");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("Kişinin avatarını verir.")
    .addUserOption(option =>
      option.setName("kişi").setDescription("Kişi seç.").setRequired(false)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser("kişi") || interaction.user;
    const avatarURL = user.displayAvatarURL({ format: "png", size: 4096, dynamic: true });
    const extension = avatarURL.includes(".gif") ? "gif" : "png";

    await interaction.deferReply(); 

try {
  const response = await axios.get(avatarURL, { responseType: "arraybuffer" });
  const buffer = Buffer.from(response.data, "utf-8");

  const attachment = new AttachmentBuilder(buffer, { name: `avatar.${extension}` });

  const AvatarLink = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("Avatar Link")
      .setStyle(ButtonStyle.Link)
      .setURL(avatarURL)
  );

  await interaction.editReply({
    files: [attachment],
    components: [AvatarLink],
    content: `<@${user.id}> **(** ${user.username} **)**`
  });
} catch (err) {
  console.error(err);
  await interaction.editReply({
    content: "<a:dikkat_arviis:1421402093876674641> **Avatar alınırken hata oluştu.**"
  });
}
  }
};
