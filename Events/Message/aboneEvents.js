const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const aboneDBPath = path.join(__dirname, '../../Database/aboneSetup.json');

function readAboneData() {
  if (!fs.existsSync(aboneDBPath)) return {};
  return JSON.parse(fs.readFileSync(aboneDBPath, 'utf-8'));
}

module.exports = (client) => {
  client.on(Events.MessageCreate, async message => {
    if (message.author.bot || !message.attachments.size) return;

    const ayar = readAboneData()[message.guild?.id];
    if (!ayar || message.channel.id !== ayar.kanal) return;

    const attachment = message.attachments.first();
    if (!attachment.contentType?.startsWith('image/')) return;

    await message.react('✅');
    await message.react('❌');

    const modRole = message.guild.roles.cache.get(ayar.yetkili);
    const activeMods = modRole.members.filter(m => ['online', 'idle', 'dnd'].includes(m.presence?.status));
    const mentions = activeMods.map(m => `<@${m.id}>`).join(' ') || "<:offline_arviis:1421410121594048594> Hiçbir yetkili çevrimiçi değil.";

    const embed = new EmbedBuilder()
      .setColor(0xa9ff47)
      .setTitle("<:tik_arviis:1421412906435739698> Ekran Görüntüsü Alındı")
      .setDescription("- Lütfen aktif yetkilinin ilgilenmesini __sabırla__ bekle.\n- Bu süre zarfında yetkilileri __tekrar etiketleme.__");

    const msg = await message.reply({ content: "<:online_arviis:1421410143484117093> Aktif Yetkililer: " + mentions, embeds: [embed] });
    setTimeout(() => msg.delete().catch(() => {}), 120000);
  });

  client.on(Events.MessageReactionAdd, async (reaction, user) => {
    if (user.bot || !['✅', '❌'].includes(reaction.emoji.name)) return;

    const ayar = readAboneData()[reaction.message.guild?.id];
    if (!ayar || reaction.message.channel.id !== ayar.kanal) return;

    const member = await reaction.message.guild.members.fetch(user.id);
    if (!member.roles.cache.has(ayar.yetkili)) {
      try {
        await reaction.users.remove(user.id);
        await user.send('<a:dikkat_arviis:1421402093876674641> **Bu işlemi yapma yetkin yok.**');
      } catch (err) {
        reaction.message.channel.send(`<a:dikkat_arviis:1421402093876674641> **Bu işlemi yapma yetkin yok.** <@${user.id}>`)
          .then(msg => setTimeout(() => msg.delete().catch(() => {}), 3000));
      }
      return;
    }

    const targetMember = await reaction.message.guild.members.fetch(reaction.message.author.id);

    if (reaction.emoji.name === '✅') {
      await targetMember.roles.add(ayar.rol);
      reaction.message.channel.send(`<:tik_arviis:1421412906435739698> Abone rolün **verildi.** <@${targetMember.id}>`);
    } else if (reaction.emoji.name === '❌') {
      const msgLink = `https://discord.com/channels/${reaction.message.guild.id}/${reaction.message.channel.id}/${reaction.message.id}`;
      const embed = new EmbedBuilder()
        .setTitle("<:carpi_arviis:1421401682348216340> Hatalı Ekran Görüntüsü")
        .setDescription(`<:info_arviis:1421409198385926295> [**Mesaja Git**](${msgLink})`)
        .setColor('Red');

      const row = new ActionRowBuilder().addComponents(
        ['Kırpılmış', 'Saat/Tarih Yok', 'Bildirimler Açık Değil', 'TÜM Red Sebepleri'].map(reason =>
          new ButtonBuilder()
            .setCustomId(`red-${reason}`)
            .setLabel(reason)
            .setStyle(ButtonStyle.Danger)
        )
      );

      await reaction.message.reply({ embeds: [embed], components: [row] });
    }
  });

  client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isButton() || !interaction.customId.startsWith('red-')) return;

    const ayar = readAboneData()[interaction.guild.id];
    if (!ayar) return;

    if (!interaction.member.roles.cache.has(ayar.yetkili)) {
      await interaction.reply({ content: '<a:dikkat_arviis:1421402093876674641> **Bu işlemi yapma yetkin yok.**', flags: 64 });
      return;
    }

    try {
      const reason = interaction.customId.split('red-')[1];
      const refMsg = await interaction.channel.messages.fetch(interaction.message.reference.messageId);
      const user = refMsg.author;

      const embed = new EmbedBuilder()
        .setTitle("<:carpi_arviis:1421401682348216340> Ekran görüntün reddedildi.")
        .setDescription(`<:info_arviis:1421409198385926295> Sebep: **${reason}** \n\n<a:buyutec_arviis:1421401498352619583> Kontrol Et: ${ayar.kontrolMesaj}`)
        .setColor('Red');

      await refMsg.reply({ content: `<@${user.id}>`, embeds: [embed] });
      setTimeout(() => interaction.message.delete().catch(console.error), 1000);
    } catch (err) {
      console.error(err);
      await interaction.reply({ content: '<:carpi_arviis:1421401682348216340> Mesaj bulunamadı veya başka bir hata oluştu.', flags: 64 });
    }
  });
};