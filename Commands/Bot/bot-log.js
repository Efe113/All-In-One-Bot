const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dosyaYolu = path.join(__dirname, '../../Database/botLog.json');

function veriOku() {
  if (!fs.existsSync(dosyaYolu)) return {};
  try {
    return JSON.parse(fs.readFileSync(dosyaYolu, 'utf8'));
  } catch {
    return {};
  }
}

function veriYaz(data) {
  fs.writeFileSync(dosyaYolu, JSON.stringify(data, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bot-log')
    .setDescription('Bot loglarını göndereceği kanal ve webhook ayarlarını yapar.')
    .addChannelOption(option =>
      option.setName('kanal')
        .setDescription('Kanal seç.')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('webhook')
        .setDescription('Webhook URL\'si gir.')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('isim')
        .setDescription('İsim gir.'))
    .addStringOption(option =>
      option.setName('avatar')
        .setDescription('Avatar URL\'si gir.'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

   async execute(interaction) {
    const sahipID = "640056735700221953";
    if (interaction.user.id !== sahipID) {
      return interaction.reply({ content: "<a:dikkat_arviis:1421402093876674641> **Bu komutu sadece <@640056735700221953> kullanabilir.**", flags: 64 });
    }

    const kanal = interaction.options.getChannel('kanal');
    const webhook = interaction.options.getString('webhook');
    const username = interaction.options.getString('isim') || null;
    const avatarURL = interaction.options.getString('avatar') || null;

    const webhookRegex = /^https:\/\/(canary\.|ptb\.)?discord\.com\/api\/webhooks\/\d+\/[\w-]+$/;
    if (!webhookRegex.test(webhook)) {
      return interaction.reply({ content: '<a:dikkat_arviis:997074866371039322> **Geçerli bir Webhook URL\'si gir.**', flags: 64 });
    }

    const data = veriOku();

    for (const [guildId, config] of Object.entries(data)) {
      if (config.webhookURL === webhook) {
        delete data[guildId];
      }
    }

    data[interaction.guild.id] = {
      kanalId: kanal.id,
      webhookURL: webhook,
      username,
      avatarURL
    };
    veriYaz(data);

    await interaction.reply({
      content: `<:tik_arviis:1046067679884234863> Bot konsol logları <#${kanal.id}> kanalına **gönderilecek.**`,
      flags: 64
    });
  }
};
