const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nuke')
    .setDescription('Kanalı patlatır.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const channel = interaction.channel;

    await interaction.reply({ content: '<a:yukleniyor_arviis:1421413341859151883> Kanal sıfırlanıyor...', flags: 64 });

    try {
      const cloned = await channel.clone({
        name: channel.name,
        type: channel.type,
        topic: channel.topic,
        nsfw: channel.nsfw,
        bitrate: channel.bitrate,
        userLimit: channel.userLimit,
        rateLimitPerUser: channel.rateLimitPerUser,
        permissionOverwrites: channel.permissionOverwrites.cache.map(perm => ({
          id: perm.id,
          allow: perm.allow.bitfield,
          deny: perm.deny.bitfield,
          type: perm.type,
        }))
      });

      await interaction.followUp({
        content: `<:tik_arviis:1421412906435739698> Kanal yeniden **oluşturuldu.** \n\n<:hashtag_arviis:1421409016701128794> <#${cloned.id}>`,
        flags: 64
      });

      await channel.delete();

      await cloned.send({
        content: `<a:nuke_arviis:1421410072281481256> Kanal **sıfırlandı.**`,
      });

    } catch (error) {
      console.error('Nuke hatası:', error);
      try {
        await interaction.followUp({
          content: '<a:dikkat_arviis:1421402093876674641> **Kanal yeniden oluşturulurken hata oluştu.**',
          flags: 64
        });
      } catch (err) {
        console.error('FollowUp başarısız:', err);
      }
    }
  }
};
