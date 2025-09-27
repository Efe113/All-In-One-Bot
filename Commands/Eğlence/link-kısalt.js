const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('link-kısalt')
    .setDescription('URL kısaltır.')
    .addStringOption(option =>
      option.setName('url')
        .setDescription('Kısaltmak istediğin URL\'yi gir.')
        .setRequired(true)
    ),

  async execute(interaction) {
    const url = interaction.options.getString('url');

    try {
      new URL(url);
    } catch {
      return interaction.reply({ content: '<a:dikkat_arviis:1421402093876674641> **Geçerli bir URL girmelisin.**', flags: 64 });
    }

    const knownShorteners = ['tinyurl.com', 'bit.ly', 't.co', 'is.gd', 'cutt.ly', 'rb.gy', 'soo.gd', 'buff.ly', 'rebrand.ly', 'shorturl.at',];
    const parsed = new URL(url);
    if (knownShorteners.includes(parsed.hostname.replace('www.', ''))) {
     return interaction.reply({ content: '<a:dikkat_arviis:1421402093876674641> **Bu bağlantı zaten kısaltılmış.**', flags: 64 });
}

    try {
      const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
      const shortUrl = await response.text();

      const button = new ButtonBuilder()
        .setLabel('🔗 Linke Git')
        .setStyle(ButtonStyle.Link)
        .setURL(shortUrl);

      const row = new ActionRowBuilder().addComponents(button);

      return interaction.reply({
        content: `\`\`\`${shortUrl}\`\`\``,
        components: [row],
        flags: 64
      });
    } catch (err) {
      console.error('Link kısaltma hatası:', err);
      return interaction.reply({ content: '<a:dikkat_arviis:1421402093876674641> **Link kısaltma sırasında bir hata oluştu.**', flags: 64 });
    }
  }
};
