const { SlashCommandBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ship')
    .setDescription('İki kişiyi eşleştirir.')
    .addUserOption(option =>
      option.setName('kişi')
        .setDescription('Eşleştirmek istediğin kişiyi seç.')
        .setRequired(false)),

  async execute(interaction) {
    const member1 = interaction.options.getUser('kişi') || interaction.user;
    const guild = interaction.guild;
    const allMembers = await guild.members.fetch();
    const filtered = allMembers.filter(m => m.user.id !== member1.id && !m.user.bot);
    const member2 = interaction.options.getUser('kişi') ? interaction.user : filtered.random()?.user;

    if (!member2) return interaction.reply("<:carpi_arviis:1421401682348216340> Sunucuda eşleştirilecek başka kişi bulunamadı.");

    const score = Math.floor(Math.random() * 101);
    const heart = score > 75 ? "❤️" : score > 50 ? "✨" : score > 25 ? "😭" : "💢";
    const comment = getLoveComment(score);
    const shipName = generateShipName(member1.username, member2.username);

    await interaction.deferReply();

    const canvas = createCanvas(700, 250);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#333333';
    ctx.fillRect(0, 0, canvas.width, canvas.height); 

    const avatar1 = await loadImage(member1.displayAvatarURL({ extension: 'png', size: 128 }));
    const avatar2 = await loadImage(member2.displayAvatarURL({ extension: 'png', size: 128 }));

    function drawRoundedAvatar(ctx, image, x, y, size) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(image, x, y, size, size);
      ctx.restore();
    }

    drawRoundedAvatar(ctx, avatar1, 100, 60, 128);
    drawRoundedAvatar(ctx, avatar2, 470, 60, 128);

    ctx.font = 'bold 50px Arial';
    ctx.fillStyle = '#fff';
    ctx.fillText(heart, 310, 130);

    ctx.font = 'bold 28px Arial';
    ctx.fillText(`Uyum: %${score}`, 280, 200);

    const buffer = canvas.toBuffer('image/png');
    const attachment = new AttachmentBuilder(buffer, { name: 'ship.png' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('tanis')
        .setLabel('Tanış')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🤝')
    );

    const replyMessage = await interaction.editReply({
      content: `[ **・ <@${member1.id}>**  & **・<@${member2.id}>** ] \n*${comment}* \n\nBebeğinizin İsmi: **${shipName}**`,
      files: [attachment],
      components: [row]
    });

    const collector = replyMessage.createMessageComponentCollector({
      time: 60_000
    });

    collector.on('collect', async i => {
  if (i.customId === 'tanis') {
    if (i.user.id !== interaction.user.id) {
      return i.reply({ content: "<a:dikkat_arviis:1421402093876674641> **Bu butonu sadece komutu kullanan kişi kullanabilir.**", flags: 64 });
    }

    await i.deferUpdate();

    const disabledRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('tanis')
        .setLabel('Tanışma İsteği Gönderildi')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('<a:mutlupanda_arviis:1421409835160834098>')
        .setDisabled(true)
    );

    await replyMessage.edit({ components: [disabledRow] });

    const actionRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('accept')
        .setLabel('Kabul Et')
        .setStyle(ButtonStyle.Success)
        .setEmoji('<:tik_arviis:1421412906435739698>'),
      new ButtonBuilder()
        .setCustomId('reject')
        .setLabel('Reddet')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('<:carpi_arviis:1421401682348216340>')
    );

    const followUpMessage = await i.followUp({
      content: `**<@${member2.id}>** seninle tanışmak istiyor **<@${member1.id}>**`,
      components: [actionRow],
      fetchReply: true
    });

    const followUpCollector = followUpMessage.createMessageComponentCollector({
      time: 60_000
    });

    followUpCollector.on('collect', async i2 => {
      if (i2.user.id !== member1.id) {
        return i2.reply({
          content: "<a:dikkat_arviis:1421402093876674641> **Bu butonu sadece tanışmak istenilen kişi kullanabilir.**",
          flags: 64
        });
      }

      if (i2.customId === 'accept') {
  await i2.user.send(`<@${member2.id}> ile tanışmayı **kabul ettin!**`);
  try {
    await interaction.user.send(`<@${member1.id}> tanışma isteğini **kabul etti!**`);
  } catch (err) {
    console.warn("Tanışma isteyen kişiye DM gönderilemedi.");
  }
  await i2.update({
    content: `<@${member1.id}> Tanışma isteğini **kabul etti.**`,
    components: []
  });
}

      if (i2.customId === 'reject') {
        await i2.update({
          content: `<@${member1.id}> Tanışma isteğini **reddetti.**`,
          components: []
        });
      }
    });

    

    collector.stop();
         }
    });
  }
};

function getLoveComment(score) {
  if (score > 90) return "Ruh eşleri gibiyiz! 💍";
  if (score > 75) return "Aramızda gerçek bir kıvılcım var! 🔥";
  if (score > 50) return "Belli ki bir şeyler olabilir 👀";
  if (score > 25) return "Yani... belki? 🤷‍♂️";
  return "Hmm... arkadaş kalsak daha iyi 😅";
}

function generateShipName(name1, name2) {
  const half1 = name1.slice(0, Math.floor(name1.length / 2));
  const half2 = name2.slice(Math.floor(name2.length / 2));
  return (half1 + half2).replace(/\s+/g, '');
}
