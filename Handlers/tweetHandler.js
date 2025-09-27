const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

const veriYolu = path.join(__dirname, '../Database/twitter.json');

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

module.exports = async function tweetHandler(interaction) {
  const [action, tweetId] = interaction.customId.split(/_(.+)/);
  const data = veriOku();
  const tweet = data[tweetId];
  const userId = interaction.user.id;

  if (!tweet)
    return interaction.reply({
      content: '<a:dikkat_arviis:997074866371039322> **Tweet bulunamadı.**',
      flags: 64
    });

  if (!tweet.users) tweet.users = {};
  if (!tweet.users[userId])
    tweet.users[userId] = { liked: false, retweeted: false, commented: false };

  if (action === 'like') {
    tweet.users[userId].liked ? tweet.likes-- : tweet.likes++;
    tweet.users[userId].liked = !tweet.users[userId].liked;
    await interaction.reply({
      content: tweet.users[userId].liked
        ? '❤️ Tweeti **beğendin.**'
        : '♻️ Beğeni **geri çekildi.**',
      flags: 64
    });
  }

  if (action === 'retweet') {
    tweet.users[userId].retweeted ? tweet.retweets-- : tweet.retweets++;
    tweet.users[userId].retweeted = !tweet.users[userId].retweeted;
    await interaction.reply({
      content: tweet.users[userId].retweeted
        ? '🔁 **Retweet** yaptın.'
        : '♻️ Retweet **geri çekildi.**',
      flags: 64
    });
  }

  if (action === 'comment') {
    if (tweet.users[userId].commented)
      return interaction.reply({
        content: '<:carpi_arviis:1046067681515814912> **Zaten yorum yapmışsın.**',
        flags: 64
      });

    const modal = new ModalBuilder()
      .setCustomId(`comment_modal_${tweetId}`)
      .setTitle('Yorum Yap')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('comment_name')
            .setLabel('Kullanıcı Adın')
            .setStyle(TextInputStyle.Short)
            .setMaxLength(10)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('comment_text')
            .setLabel('Yorumun')
            .setStyle(TextInputStyle.Paragraph)
            .setMaxLength(50)
            .setRequired(true)
        )
      );

    return interaction.showModal(modal);
  }

  if (action === 'showcomments') {
    const yorumlar = tweet.yorumlar || [];
    if (yorumlar.length === 0) {
      return interaction.reply({
        content: '<:carpi_arviis:1046067681515814912> **Bu tweete henüz yorum yapılmamış.**',
        flags: 64
      });
    }

    const yorumMetni = yorumlar.map(y => `**${y.name}:** ${y.comment}`).join('\n\n');
    const embed = new EmbedBuilder().setDescription(yorumMetni).setColor(0x323339);
    return interaction.reply({ embeds: [embed], flags: 64 });
  }

  data[tweetId] = tweet;
  veriYaz(data);

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`like_${tweetId}`)
      .setLabel(`❤️ Beğeni: ${tweet.likes}`)
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`retweet_${tweetId}`)
      .setLabel(`🔁 Retweet: ${tweet.retweets}`)
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`comment_${tweetId}`)
      .setLabel(`💬 Yorum: ${tweet.comments}`)
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`showcomments_${tweetId}`)
      .setLabel('Yorumları Göster')
      .setStyle(ButtonStyle.Primary)
  );

  if (interaction.message)
    await interaction.message.edit({ components: [buttons] });
};