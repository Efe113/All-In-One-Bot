const { Events, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const dbPath = path.join(__dirname, '../../Database/roleplay.json');
let db = require(dbPath);

module.exports = {
  name: Events.MessageDelete,
  async execute(message) {
    if (
      !message.guild ||
      message.author?.bot ||
      message.channel.type !== ChannelType.GuildText ||
      !message.content
    ) return;

    delete require.cache[require.resolve(dbPath)];
    db = require(dbPath);

    const categoryId = message.channel.parentId;
    const userId = message.author.id;

    if (!db.kategoriler || !db.kategoriler.includes(categoryId)) return;

    const wordCount = message.content.trim().split(/\s+/).length;
    if (!db[userId]) db[userId] = { rp: 0, xp: 0 };

    db[userId].rp = Math.max(0, (db[userId].rp || 0) - wordCount);
    db[userId].xp = Math.max(0, (db[userId].xp || 0) - wordCount);

    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

    if (db.logKanal) {
      const logChannel = await message.guild.channels.fetch(db.logKanal).catch(() => null);
      if (logChannel && logChannel.isTextBased()) {
        logChannel.send({
          embeds: [{
            color: 0xff0000,
            author: { name: message.guild.name },
            thumbnail: { url: message.author.displayAvatarURL() },
            description: `\`Rol Silindi\` \n<@${userId}> adlı kişi <#${message.channel.id}> kanalındaki Roleplay mesajını sildi. \n\nSilinen Kelime: **${wordCount}** kelime.`,
          }],
          components: [{
            type: 1,
            components: [{
              type: 2,
              label: 'Mesaja Git',
              style: 5,
              url: `https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id}`,
              emoji: { name: '❤️' }
            }]
          }]
        });
      }
    }
  }
};
