const { SlashCommandBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rip')
    .setDescription('Etiketlenen kişiye R.I.P efekti verir.')
    .addUserOption(option =>
      option.setName('kişi')
        .setDescription('Kişi seç.')
        .setRequired(true)
    ),

  async execute(interaction) {
    const hedef = interaction.options.getUser('kişi');
    const avatarURL = hedef.displayAvatarURL({ extension: 'png', size: 512 });

    const response = await fetch(avatarURL);
    const buffer = await response.arrayBuffer()
    const avatar = await loadImage(buffer);

    const canvas = createCanvas(512, 512);
    const ctx = canvas.getContext('2d');

    ctx.drawImage(avatar, 0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 80px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('R.I.P', canvas.width / 2, canvas.height / 2 + 25);

    const attachment = {
      attachment: canvas.toBuffer('image/png'),
      name: 'rip.png'
    };

    await interaction.reply({
      content: `🪦 <@${hedef.id}> anısına...`,
      files: [attachment]
    });
  }
};
