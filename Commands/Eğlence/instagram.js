const { SlashCommandBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const { v4: uuidv4 } = require('uuid');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const fs = require('fs');
const path = require('path');

const veriYolu = path.join(__dirname, '../../Database/instagram.json');

function veriOku() {
  if (!fs.existsSync(veriYolu)) return {};
  try {
    return JSON.parse(fs.readFileSync(veriYolu, 'utf8'));
  } catch {
    return {};
  }
}

function veriYaz(data) {
  fs.writeFileSync(veriYolu, JSON.stringify(data, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('instagram')
    .setDescription('Sahte Instagram postu oluşturur.')
    .addUserOption(option =>
      option.setName('kişi')
        .setDescription('İsim yaz.')
        .setRequired(true)
    )
    .addAttachmentOption(option =>
      option.setName('resim')
        .setDescription('Görsel yükle.')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('açıklama')
        .setDescription('Açıklama gir.')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('instagram-hesap-url')
        .setDescription('Instagram hesap linki gir.')
        .setRequired(false)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('kişi');
    const resim = interaction.options.getAttachment('resim');
    const caption = interaction.options.getString('açıklama');
    const instagramUrl = interaction.options.getString('instagram-hesap-url');
    const imageUrl = resim.url;

    try {
      new URL(imageUrl);
    } catch {
      return interaction.reply({ content: '<a:dikkat_arviis:1421402093876674641> **Geçerli bir resim linki gir.**', flags: 64 });
    }

    const avatarUrl = user.displayAvatarURL({ extension: 'png', size: 256 });

    const canvas = createCanvas(800, 900);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const avatar = await loadImage(avatarUrl);
    ctx.save();
    ctx.beginPath();
    ctx.arc(70, 70, 40, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, 30, 30, 80, 80);
    ctx.restore();

    ctx.fillStyle = '#000';
    ctx.font = 'bold 30px Arial';
    ctx.fillText(`@${user.username}`, 130, 80);

    let postImage;
    try {
      postImage = await loadImage(imageUrl);
      ctx.drawImage(postImage, 0, 130, 800, 600);
    } catch {
      return interaction.reply({ content: '<a:dikkat_arviis:1421402093876674641> **Resim yüklenemedi. Geçerli bir link verdiğinden emin ol.**', flags: 64 });
    }

    ctx.font = '24px Arial';
    ctx.fillText(`${caption}`, 30, 810);

    const buffer = canvas.toBuffer('image/png');

    const instagramId = uuidv4();

    const data = veriOku();
    data[instagramId] = {
      likes: 0,
      comments: 0,
      yorumlar: [],
      users: {} 
    };
    veriYaz(data);

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`instagramlike_${instagramId}`)
        .setLabel(`❤️ Beğeni: 0`)
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`instagramcomment_${instagramId}`)
        .setLabel(`💬 Yorum: 0`)
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`instagramshowcomments_${instagramId}`)
        .setLabel('Yorumları Göster')
        .setStyle(ButtonStyle.Primary)
    );

    const components = [buttons];

    if (instagramUrl) {
      if (!instagramUrl.startsWith('https://www.instagram.com/')) {
        return interaction.reply({
          content: '<a:dikkat_arviis:1421402093876674641> **Geçerli bir Instagram profil linki gir.**',
          flags: 64
        });
      }

      const linkButton = new ButtonBuilder()
        .setLabel('Instagram Profili')
        .setStyle(ButtonStyle.Link)
        .setEmoji("<:instagram2_arviis:1421416807545442424>")
        .setURL(instagramUrl);

      components.push(new ActionRowBuilder().addComponents(linkButton));
    }

    await interaction.reply({
      files: [{ attachment: buffer, name: 'instagram.png' }],
      components
    });
  }
};
