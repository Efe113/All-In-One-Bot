const { SlashCommandBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const QRCode = require('qrcode');
const { Buffer } = require('node:buffer');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('qr-oluştur')
    .setDescription('Metinden QR kodu oluşturur.')
    .addStringOption(option =>
      option.setName('metin')
        .setDescription('Metin gir.')
        .setRequired(true)
    ),

  async execute(interaction) {
    const metin = interaction.options.getString('metin');

    try {
      const qrBuffer = await QRCode.toBuffer(metin, { type: 'png' });
      const attachment = new AttachmentBuilder(qrBuffer, { name: 'qr.png' });

      await interaction.reply({ files: [attachment] });
      const sent = await interaction.fetchReply();

      const fileUrl = sent.attachments.first().url;

      const button = new ButtonBuilder()
        .setLabel('QR\'ı İndir')
        .setStyle(ButtonStyle.Link)
        .setURL(fileUrl);

      const row = new ActionRowBuilder().addComponents(button);

      await interaction.editReply({
        components: [row],
      });

    } catch (error) {
      console.error('QR kod oluşturulurken hata oluştu:', error);
      await interaction.reply({
        content: '<a:dikkat_arviis:1421402093876674641> QR kod oluşturulurken hata oluştu.',
        flags: 64,
      });
    }
  }
};
