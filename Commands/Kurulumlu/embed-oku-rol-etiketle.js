const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../../Database/embedOkuRolEtiket.json');

function veriOku() {
  if (!fs.existsSync(filePath)) return {};
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function veriYaz(data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('embed-oku-rol-etiketle')
    .setDescription('Embed mesajlarda anahtar kelimeye göre rol etiketleme sistemini ayarla.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('ayarla')
        .setDescription('Embed mesajlarda rol etiketleme sistemini ayarlar.')
        .addChannelOption(option =>
          option.setName('kanal')
            .setDescription('Kanal seç.')
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            .setRequired(true))
        .addRoleOption(opt => opt.setName('experiments').setDescription('Rol: Experiments').setRequired(true))
        .addRoleOption(opt => opt.setName('strings').setDescription('Rol: Strings').setRequired(true))
        .addRoleOption(opt => opt.setName('endpoints').setDescription('Rol: Endpoints').setRequired(true))
        .addRoleOption(opt => opt.setName('rollout').setDescription('Rol: Rollout').setRequired(true))
        .addRoleOption(opt => opt.setName('unlem').setDescription('Rol: !').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('sıfırla')
        .setDescription('Embed mesajlardaki rol etiketleme sistemini sıfırlar.')
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const data = veriOku();

    if (subcommand === 'ayarla') {
  const kanal = interaction.options.getChannel('kanal');
  const guildId = interaction.guild.id;

  const roleMap = {
    "Experiments": interaction.options.getRole('experiments').id,
    "Strings": interaction.options.getRole('strings').id,
    "Endpoints": interaction.options.getRole('endpoints').id,
    "Rollout": interaction.options.getRole('rollout').id,
    "!": interaction.options.getRole('unlem').id
  };

  if (!data[guildId]) {
    data[guildId] = {
      kanallar: [kanal.id],
      roller: roleMap
    };
  } else {
    if (!Array.isArray(data[guildId].kanallar)) {
      data[guildId].kanallar = [];
    }
    if (!data[guildId].kanallar.includes(kanal.id)) {
      data[guildId].kanallar.push(kanal.id);
    }
    data[guildId].roller = roleMap;
  }

  veriYaz(data);

  return interaction.reply({
    content: `<:tik_arviis:1421412906435739698> **${kanal}** kanalı eklendi ve roller güncellendi.`,
    flags: 64
  });
}

if (subcommand === 'sıfırla') {
  const guildId = interaction.guild.id;

  if (data[guildId]) {
    delete data[guildId];
    veriYaz(data);

    return interaction.reply({
      content: '<:tik_arviis:1421412906435739698> Sistem **sıfırlandı.**',
      flags: 64
    });
  } else {
    return interaction.reply({
      content: '<a:dikkat_arviis:1421402093876674641> **Zaten ayarlı bir sistem yok.**',
      flags: 64
    });
  }
}

  }
};
