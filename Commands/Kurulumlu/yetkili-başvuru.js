const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dbFile = path.join(__dirname, '../../Database/yetkiliBasvuru.json');

function readDB() {
  if (!fs.existsSync(dbFile)) fs.writeFileSync(dbFile, JSON.stringify({}));
  const raw = fs.readFileSync(dbFile);
  return JSON.parse(raw);
}

function writeDB(data) {
  fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('yetkili-başvuru')
    .setDescription('Yetkili başvuru sistemini ayarlar.')
    .addSubcommand(sub =>
      sub.setName('ayarla')
        .setDescription('Başvuru kanalını ayarlar.')
        .addChannelOption(opt => opt.setName('kanal').setDescription('Kanal seç.').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('sıfırla').setDescription('Başvuru sistemini sıfırlar.')
    )
    .addSubcommand(sub =>
      sub.setName('log-ayarla')
        .setDescription('Log kanalını ayarlar.')
        .addChannelOption(opt => opt.setName('kanal').setDescription('Kanal seç.').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('yetkili-rolü')
        .setDescription('Yetkili rolünü ayarlar.')
        .addRoleOption(opt => opt.setName('rol').setDescription('Rol seç.').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('yetkili-kanalı')
        .setDescription('Yetkili kanalını ayarlar.')
        .addChannelOption(opt => opt.setName('kanal').setDescription('Kanal seç.').setRequired(true))
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    const db = readDB();

    if (!db[guildId]) db[guildId] = {};

    if (sub === 'ayarla') {
      const channel = interaction.options.getChannel('kanal');
      if (channel.type !== ChannelType.GuildText) {
        return interaction.reply({ content: '<a:dikkat_arviis:1421402093876674641> **Geçerli bir mtin kanalı seç.**', flags: 64 });
      }
      db[guildId].basvuruKanal = channel.id;
      writeDB(db);

      const embed = new EmbedBuilder()
        .setDescription('Başvuru formunda şu maddeleri belirtmek zorundasın: \n\n- Adın \n- Yaşın \n- Aktiflik Süren \n- Ne zamandır Discord kullanıyorsun? \n- Bot bilgin ne durumda? \n- Sorunları çözmek için ne yaparsın? \n- Kendini tanıt. Fazla detay verirsen daha iyi olur. \n\nVereceğin bilgiler ASLA kimseyle paylaşılmaz. \n\nÖrnek başvuru formu:')
        .setColor(0xffffff)
        .setImage("https://media.discordapp.net/attachments/1069639498637525043/1375816546257076346/image.png?ex=68331082&is=6831bf02&hm=0d9318ca5c6670f8576dfe283a6a0323ca22676d532c1989bdcd7a3dc087bffc&=&format=webp&quality=lossless&width=726&height=126");

      await channel.send({ embeds: [embed] });
      return interaction.reply({ content: `<:tik_arviis:1421412906435739698> Başvuru kanalı ${channel} olarak **ayarlandı.**`, flags: 64 });

    } else if (sub === 'log-ayarla') {
      const channel = interaction.options.getChannel('kanal');
      if (channel.type !== ChannelType.GuildText) {
        return interaction.reply({ content: '<a:dikkat_arviis:1421402093876674641> **Geçerli bir mtin kanalı seç.**', flags: 64 });
      }
      db[guildId].logKanal = channel.id;
      writeDB(db);
      return interaction.reply({ content: `<:tik_arviis:1421412906435739698> Log kanalı ${channel} olarak **ayarlandı.**`, flags: 64 });

    } else if (sub === 'yetkili-rolü') {
      const rol = interaction.options.getRole('rol');
      db[guildId].yetkiliRol = rol.id;
      writeDB(db);
      return interaction.reply({ content: `<:tik_arviis:1421412906435739698> Yetkili rolü ${rol} olarak **ayarlandı.**`, flags: 64 });

    } else if (sub === 'yetkili-kanalı') {
      const channel = interaction.options.getChannel('kanal');
      if (channel.type !== ChannelType.GuildText) {
        return interaction.reply({ content: '<a:dikkat_arviis:1421402093876674641> **Geçerli bir mtin kanalı seç.**', flags: 64 });
      }
      db[guildId].yetkiliKanal = channel.id;
      writeDB(db);
      return interaction.reply({ content: `<:tik_arviis:1421412906435739698> Yetkili kanalı ${channel} olarak **ayarlandı.**`, flags: 64 });

    } else if (sub === 'sıfırla') {
      delete db[guildId];
      writeDB(db);
      return interaction.reply({ content: '<:tik_arviis:1421412906435739698> Yetkili başvuru sistemi **sıfırlandı.**', flags: 64 });
    }
  }
};
