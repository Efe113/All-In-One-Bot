const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const path = require('path');
const fs = require('fs').promises;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('Sunucu bilgilerini gösterir.'),

  async execute(interaction) {
    await interaction.deferReply();

    const guild = interaction.guild;
    const members = await guild.members.fetch();
    const channels = guild.channels.cache;

    const totalMembers = guild.memberCount;
    const channelCount = channels.size;
    const onlineCount = members.filter(m => ['online', 'idle', 'dnd'].includes(m.presence?.status)).size;
    const micCount = members.filter(m => m.voice.channel && !m.voice.mute).size;

    let totalMessages = 0;
    for (const [, channel] of channels) {
      if (channel.isTextBased() && channel.viewable) {
        try {
          const messages = await channel.messages.fetch({ limit: 100 });
          totalMessages += messages.size;
        } catch {}
      }
    }

    const formattedMessages = totalMessages >= 1000
      ? `${(totalMessages / 1000).toFixed(1)} Bin Mesaj`
      : `${totalMessages.toLocaleString('tr-TR')} Mesaj`;

let totalVoiceMs = 0;

try {
  const rawData = await fs.readFile(path.resolve(__dirname, '../../Database/sesVerileri.json'), 'utf-8');
  const data = JSON.parse(rawData);

  const guildData = data[guild.id];
  if (guildData) {
    for (const memberId in guildData) {
      const userData = guildData[memberId];
      if (userData && typeof userData.totalTime === 'number') {
        totalVoiceMs += userData.totalTime;
      }
    }
  }

} catch (err) {
  console.error('Ses verileri okunamadı:', err);
}

    const totalSeconds = Math.floor(totalVoiceMs / 1000);
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    const voiceFormatted = `${hours}:${minutes}:${seconds}`;

    const money = "1";
    const boost = guild.premiumSubscriptionCount || 0;
    const bans = await guild.bans.fetch();
    const banCount = bans.size;

    const canvas = createCanvas(1150, 1150);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0d0d0d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    function drawRoundedRect(ctx, x, y, width, height, radius, fillStyle) {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.fillStyle = fillStyle;
      ctx.fill();
    }

    const fields = [
      { icon: 'user.png', text: `${totalMembers.toLocaleString('tr-TR')} Üye`, color: '#fff' },
      { icon: 'boost.png', text: `${boost} Boost`, color: '#ff66cc' },
      { icon: 'channel.png', text: `${channelCount} Kanal`, color: '#ccc' },
      { icon: 'online.png', text: `${onlineCount} Aktif`, color: '#3fd587' },
      { icon: 'ban.png', text: `${banCount} Banlı`, color: '#ff5c5c' },
      { icon: 'mic.png', text: `${micCount} Seste`, color: '#ccc' },
      { icon: 'bank.png', text: `ArviS`, color: '#ffc300' },
      { icon: 'message.png', text: `${formattedMessages}`, color: '#fff' },
      { icon: 'sound.png', text: `${voiceFormatted}`, color: '#ccc' },
    ];

    const boxWidth = 330;
    const boxHeight = 300;
    const radius = 40;

    const positions = [
      { x: 50, y: 50 }, { x: 410, y: 50 }, { x: 770, y: 50 },
      { x: 50, y: 410 }, { x: 410, y: 410 }, { x: 770, y: 410 },
      { x: 50, y: 770 }, { x: 410, y: 770 }, { x: 770, y: 770 },
    ];

    for (let i = 0; i < fields.length; i++) {
      const f = fields[i];
      const pos = positions[i];

      drawRoundedRect(ctx, pos.x, pos.y, boxWidth, boxHeight, radius, '#1a1a1a');

      try {
        const iconPath = path.resolve(__dirname, `../../assets/Say/${f.icon}`);
        const data = await fs.readFile(iconPath);
        const icon = await loadImage(data);

        ctx.drawImage(icon, pos.x + (boxWidth / 2 - 80), pos.y + 30, 160, 160);
        ctx.fillStyle = f.color;
        ctx.font = 'bold 52px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(f.text, pos.x + boxWidth / 2, pos.y + 240);
      } catch (error) {
        console.error(`İkon yüklenirken hata oluştu: ${f.icon}`, error);
      }
    }

    const buffer = canvas.toBuffer('image/png');
    const attachment = new AttachmentBuilder(buffer, { name: 'say.png' });

    await interaction.editReply({ files: [attachment] });
  },
};
