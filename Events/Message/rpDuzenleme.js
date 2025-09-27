const { Events, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const dbPath = path.join(__dirname, '../../Database/roleplay.json');
let db = require(dbPath);

module.exports = {
  name: Events.MessageUpdate,
  async execute(oldMessage, newMessage) {
    if (
      !oldMessage.guild ||
      oldMessage.author?.bot ||
      oldMessage.channel.type !== ChannelType.GuildText
    ) return;

    const userId = oldMessage.author.id;

    if (!oldMessage.content || !newMessage.content || oldMessage.content === newMessage.content) return;

    delete require.cache[require.resolve(dbPath)];
    db = require(dbPath);

    const categoryId = oldMessage.channel.parentId;
    if (!db.kategoriler || !db.kategoriler.includes(categoryId)) return;

    const oldWordCount = oldMessage.content.trim().split(/\s+/).length;
    const newWordCount = newMessage.content.trim().split(/\s+/).length;
    const fark = Math.abs(newWordCount - oldWordCount);

    if (!db[userId]) db[userId] = { rp: 0, xp: 0 };

    const eylem = newWordCount > oldWordCount ? 'ekleme' : 'silme';
    const kelimeFarkı = Math.abs(newWordCount - oldWordCount);

    if (eylem === 'ekleme') {
      db[userId].rp += kelimeFarkı;
      db[userId].xp += kelimeFarkı;
    } else {
      db[userId].rp = Math.max(0, db[userId].rp - kelimeFarkı);
      db[userId].xp = Math.max(0, db[userId].xp - kelimeFarkı);
    }

    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

    if (db.logKanal) {
      const logChannel = await oldMessage.guild.channels.fetch(db.logKanal).catch(() => null);
      if (logChannel && logChannel.isTextBased()) {
        logChannel.send({
          embeds: [{
            color: eylem === 'ekleme' ? 0xff9900 : 0xff9900,
            author: { name: oldMessage.guild.name },
            thumbnail: { url: oldMessage.author.displayAvatarURL() },
            description: `\`Rol Düzenlendi\` \n<@${userId}> adlı kişi <#${oldMessage.channel.id}> kanalındaki Roleplay mesajını düzenledi. \n\n${
              eylem === 'ekleme' ? 'Eklenen' : 'Silinen'
            } Kelime: **${kelimeFarkı}** kelime. \n\nEski Kelime Sayısı: **${oldWordCount}** \nYeni Kelime Sayısı: **${newWordCount}**`,
            url: `https://discord.com/channels/${oldMessage.guild.id}/${oldMessage.channel.id}/${newMessage.id}`
          }],
          components: [{
            type: 1,
            components: [{
              type: 2,
              label: 'Mesaja Git',
              style: 5,
              url: newMessage.url,
              emoji: { name: '🧡' }
            }]
          }]
        });
      }
    }
  }
};
