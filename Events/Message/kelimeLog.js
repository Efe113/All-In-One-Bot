const { Events, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const dbPath = path.join(__dirname, '../../Database/roleplay.json');
let db = require(dbPath);

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    if (
      message.author.bot ||
      message.channel.type !== ChannelType.GuildText
    ) return;

    delete require.cache[require.resolve(dbPath)];
    db = require(dbPath);

    const categoryId = message.channel.parentId;
    if (!db.kategoriler || !db.kategoriler.includes(categoryId)) return;

    const wordCount = message.content.trim().split(/\s+/).length;
    const userId = message.author.id;

    if (!db[userId]) db[userId] = { rp: 0, xp: 0 };

    db[userId].rp += wordCount;
    db[userId].xp += wordCount;

    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

    if (db.logKanal) {
      const logChannel = await message.guild.channels.fetch(db.logKanal).catch(() => null);
      if (logChannel && logChannel.isTextBased()) {
        logChannel.send({
          embeds: [{
            color: 0x00ff00,
            author: { name: message.guild.name },
            thumbnail: { url: message.author.displayAvatarURL() },
            description: `\`Rol Yapıldı\` \n<@${userId}> adlı kişi <#${message.channel.id}> kanalında Roleplay yaptı. \n\nYazılan Kelime: **${wordCount}** kelime.`
          }],
          components: [{
            type: 1,
            components: [{
              type: 2,
              label: 'Mesaja Git',
              style: 5,
              url: message.url,
              emoji: { name: '💚' }
            }]
          }]
        });
      }
    }
  }
};
