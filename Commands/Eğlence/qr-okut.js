const { SlashCommandBuilder } = require('discord.js');
const QrCode = require('qrcode-reader');
const Jimp = require('jimp');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('qr-okut')
    .setDescription('QR kod resmini okur.')
    .addAttachmentOption(option =>
      option.setName('resim')
        .setDescription('QR kod içeren resim.')
        .setRequired(true)
    ),

  async execute(interaction) {
    const attachment = interaction.options.getAttachment('resim');

    if (!attachment.contentType?.startsWith('image/')) {
      return interaction.reply({ content: '<a:dikkat_arviis:1421402093876674641> **Geçerli bir görsel yükle.**', flags: 64 });
    }

    try {
      const image = await Jimp.read(attachment.url);

      const qr = new QrCode();

      qr.callback = async function (err, result) {
        if (err || !result) {
          return interaction.reply({
            content: '<a:dikkat_arviis:1421402093876674641> **Çok fazla veri karmaşası olduğu için QR kod okunamadı. Lütfen daha az karmaşık bir şeyler dene.**',
            flags: 64
          });
        }

        await interaction.reply(`\`\`\`${result.result}\`\`\``);
      };

      qr.decode(image.bitmap);

    } catch (err) {
      console.error('Genel QR hata:', err);
      await interaction.reply({ content: '<a:dikkat_arviis:1421402093876674641> **Bir hata oluştu.**', flags: 64 });
    }
  }
};