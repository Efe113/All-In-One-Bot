const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const aboneDBPath = path.join(__dirname, '../../Database/aboneSetup.json');

function readAboneData() {
  if (!fs.existsSync(aboneDBPath)) return {};
  return JSON.parse(fs.readFileSync(aboneDBPath, 'utf-8'));
}

function writeAboneData(data) {
  fs.writeFileSync(aboneDBPath, JSON.stringify(data, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('abone-setup')
    .setDescription('Abone rol sistemini kurar.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(opt => opt.setName('kanal').setDescription('Kanal seç.').setRequired(true))
    .addRoleOption(opt => opt.setName('yetkili').setDescription('Rol seç.').setRequired(true))
    .addRoleOption(opt => opt.setName('rol').setDescription('Rol seç.').setRequired(true))
    .addStringOption(opt => opt.setName('kontrol-link').setDescription('Mesaj linkini gir.').setRequired(true)),

  async execute(interaction, client) {
    const kanal = interaction.options.getChannel('kanal');
    const yetkili = interaction.options.getRole('yetkili');
    const rol = interaction.options.getRole('rol');
    const kontrollink = interaction.options.getString('kontrol-link');

    const data = readAboneData();
    data[interaction.guild.id] = {
      kanal: kanal.id,
      yetkili: yetkili.id,
      rol: rol.id,
      kontrolMesaj: kontrollink
    };
    writeAboneData(data);

    await interaction.reply({ content: '<:tik_arviis:1421412906435739698> Abone sistemi **ayarlandı.**', flags: 64 });
  }
};