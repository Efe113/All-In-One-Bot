const { Events, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');

const ms = require('ms');
const fs = require('fs');
const path = require("path");

const fakeButtonHandler = require("../../Handlers/fakeButtonHandler");
const tweetHandler = require("../../Handlers/tweetHandler");
const tweetCommentHandler = require("../../Handlers/tweetCommentHandler");
const instagramHandler = require("../../Handlers/instagramHandler");
const instagramCommentHandler = require("../../Handlers/instagramCommentHandler");

client.on("interactionCreate", async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return interaction.reply({ content: "Geçersiz komut." });
    command.execute(interaction, client);
    return;
  }

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//TWITER INTR
  if (interaction.isModalSubmit() && interaction.customId.startsWith("comment_modal_")) {
    return tweetCommentHandler(interaction);
  }

  if (interaction.isButton()) {
    if (interaction.customId === "arviston") return fakeButtonHandler(interaction);
    if (interaction.customId.startsWith("like_") || interaction.customId.startsWith("retweet_") || interaction.customId.startsWith("comment_") || interaction.customId.startsWith("showcomments_")) {
      return tweetHandler(interaction);
    }
  }

  module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    if (interaction.isModalSubmit() && interaction.customId.startsWith("comment_modal_")) {
      return tweetCommentHandler(interaction);
    }

    if (interaction.isButton()) {
      if (interaction.customId === "arviston") return fakeButtonHandler(interaction);
      if (
        interaction.customId.startsWith("like_") ||
        interaction.customId.startsWith("retweet_") ||
        interaction.customId.startsWith("comment_") ||
        interaction.customId.startsWith("showcomments_")
      ) {
        return tweetHandler(interaction);
      }
    }

    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction, client);
      } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'Bir hata oluştu.', flags: 64 });
      }
    }
  },
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//INSTAGRAM INTR
  if (interaction.isModalSubmit() && interaction.customId.startsWith("instagramcomment_modal_")) {
    return instagramCommentHandler(interaction);
  }

  if (interaction.isButton()) {
    if (interaction.customId === "arviston2") return fakeButtonHandler(interaction);
    if (interaction.customId.startsWith("instagramlike_")  || interaction.customId.startsWith("instagramcomment_") || interaction.customId.startsWith("instagramshowcomments_")) {
      return instagramHandler(interaction);
    }
  }

  module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    try {
      if (interaction.isModalSubmit()) {
        if (interaction.customId.startsWith("instagramcomment_modal_")) {
          return instagramCommentHandler(interaction);
        }
      }

      if (interaction.isButton()) {
        const customId = interaction.customId;

        if (customId === "arviston2") {
          return fakeButtonHandler(interaction);
        }

        if (
          customId.startsWith("instagramlike_") ||
          customId.startsWith("instagramcomment_") ||
          customId.startsWith("instagramshowcomments_")
        ) {
          return instagramHandler(interaction);
        }
      }

      if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        await command.execute(interaction, client);
      }
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: 'Hata oluştu.',
          flags: 64,
        });
      } else {
        await interaction.reply({
          content: 'Hata oluştu.',
          flags: 64,
        });
      }
    }
  },
};
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//HATIRLATICI SİSTEMİ
client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  if (interaction.customId.startsWith('okundu_')) {
    const [, ownerId, komutMesajId] = interaction.customId.split('_');

    if (interaction.user.id !== ownerId) {
      return interaction.reply({
        content: `<a:dikkat_arviis:1421402093876674641> **Bu butonu <@${ownerId}> kullanabilir.**`,
        flags: 64
      });
    }

    const butonlar = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Orijinal Mesaja Git')
        .setStyle(ButtonStyle.Link)
        .setURL(`https://discord.com/channels/${interaction.guildId}/${interaction.channelId}/${komutMesajId}`),

      new ButtonBuilder()
        .setCustomId(`okundu_${interaction.user.id}_${komutMesajId.id}`)
        .setLabel('Okundu')
        .setStyle(ButtonStyle.Success)
        .setEmoji("<:tik_arviis:1421412906435739698>")
        .setDisabled(true),
    );

    await interaction.update({
      components: [butonlar]
    });
  }
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//YETKİLİ BAŞVURU SİSTEMİ
const path2 = require('path');
const dbFile = path2.join(__dirname, '../../Database/yetkiliBasvuru.json');

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton() || !interaction.customId.startsWith('yetkili_')) return;

  if (!interaction.member.permissions.has('Administrator')) {
    return interaction.reply({ content: '<a:dikkat_arviis:1421402093876674641> **Bu butonu kullanmak için yetkin yok.**', flags: 64 });  
  }

  const [prefix, action, userId] = interaction.customId.split('_');
  const db = JSON.parse(fs.readFileSync(dbFile));
  const guildId = interaction.guild.id;
  const settings = db[guildId];

  if (!settings) return;

  const member = await interaction.guild.members.fetch(userId).catch(() => null);
  if (!member) {
    return interaction.reply({ content: '<a:dikkat_arviis:1421402093876674641> **Kişi bulunamadı.**', flags: 64 });
  }

  if (action === 'onayla') {
    const role = interaction.guild.roles.cache.get(settings.yetkiliRol);
    if (!role) {
      return interaction.reply({ content: '<a:dikkat_arviis:1421402093876674641> **Yetkili rolü ayarlanmamış.**', flags: 64 });
    }

    await member.roles.add(role).catch(() => null);

    const dmMessage = '<:moderator_accept_arviis:1421409744459137044> Tebrikler! Yetkili başvurun **onaylandı.**';
    const channelMessage = `<:moderator_accept_arviis:1421409744459137044> Tebrikler! <@${member.id}> Yetkili başvurun **onaylandı.**`;

    const sentDM = await member.send(dmMessage).catch(() => null);
    if (!sentDM && settings.yetkiliKanal) {
      const yetkiliKanal = interaction.guild.channels.cache.get(settings.yetkiliKanal);
      if (yetkiliKanal && yetkiliKanal.isTextBased()) {
        yetkiliKanal.send(channelMessage).catch(err => console.error('Mesaj gönderme hatası:', err));
      }
    }

    await interaction.update({ content: `<:tik_arviis:1421412906435739698> Başvuru **onaylandı.**`, components: [], embeds: interaction.message.embeds });
  }

  if (action === 'reddet') {
    const dmMessage = '<:sad_pickle_arviis:1421412311708729385> Üzgünüm, yetkili başvurun **reddedildi.**';

    await member.send(dmMessage).catch(() => null);

    await interaction.update({ content: `<:carpi_arviis:1421401682348216340> Başvuru **reddedildi.**`, components: [], embeds: interaction.message.embeds });
  }
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//SELAM VER BUTON
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  const [command, hedefID] = interaction.customId.split('_');
  if (command !== 'selamver') return;

  const hedef = await interaction.guild.members.fetch(hedefID).catch(() => null);
  if (!hedef) {
    return interaction.reply({
      content: '<a:dikkat_arviis:1421402093876674641> **Kişi bulunamadı**.',
      flags: 64
    });
  }

  const disabledButton = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`selamver_${hedefID}`)
      .setLabel('Selam Verildi')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true)
      .setEmoji('<a:parlayanyildiz_arviis:1421412069139415234>')
  );

  await interaction.update({
    components: [disabledButton]
  });

  const mentionIDs = [...new Set([interaction.user.id, hedef.id])];

  await interaction.followUp({
    content: `<@${interaction.user.id}> sana selam verdi <a:pikachuselam_arviis:1421412118091272222>`,
    allowedMentions: { users: mentionIDs }
  });
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//DM DUYURU
client.on("interactionCreate", async interaction => {
  if (!interaction.isModalSubmit()) return;

  if (interaction.customId === "dmDuyuruModal") {
    const mesaj = interaction.fields.getTextInputValue("duyuruMesaji");

    const members = await interaction.guild.members.fetch({ withPresences: false });
    const hedefKitle = members.filter(m => !m.user.bot);
    const toplam = hedefKitle.size;

    const delayMs = 1500; 
    const tahminiSüreSn = Math.ceil(
      (toplam * delayMs +
        Math.floor(toplam / 100) * 60000 +   
        Math.floor(toplam / 500) * 1200000) / 1000 
    );

    await interaction.reply({
      content: `<:tik_arviis:1421412906435739698> **Başarılı.**\n\n<a:saat_arviis:1421412278544105542> Mesajın herkese ulaşması tahmini: **${tahminiSüreSn} saniye**.`,
      flags: 64
    });

    let consecutiveFails = 0;
    let sentCount = 0;

    for (const member of hedefKitle.values()) {
      if (consecutiveFails >= 30) {
        await interaction.followUp({
          content: "<a:dikkat_arviis:1421402093876674641> **30 adet DM gönderilemedi, işlem durduruldu.** \nBot engellenmiş olabilir, kontrol et.",
          flags: 64
        });
        break;
      }

      try {
        await member.send({ content: mesaj });
        consecutiveFails = 0;
        sentCount++;
      } catch {
        consecutiveFails++;
      }

      if (sentCount % 100 === 0) {
        await new Promise(res => setTimeout(res, 60000));
      }

      if (sentCount % 500 === 0) {
        await new Promise(res => setTimeout(res, 20 * 60 * 1000));
      }
      await new Promise(res => setTimeout(res, delayMs));
    }

    if (consecutiveFails < 30) {
      await interaction.followUp({
        content: "<a:tik_arviis:1421412906435739698> **Tüm mesajlar gönderildi.**",
        flags: 64
      });
    }
  }
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//TEMP VOICE SİSTEMİ
const tempVoiceManager = require("../Voice/tempVoiceManager");

module.exports = (client) => {
  client.on("interactionCreate", async (interaction) => {
    if (interaction.isButton() && interaction.customId.startsWith("tempvc_")) {
      const [, prefix, userId] = interaction.customId.split("_");

      if (interaction.user.id !== userId) {
        return interaction.reply({
          content: "<a:dikkat_arviis:1421402093876674641> **Bu kanalın sahibi sen değilsin.**",
          flags: 64
        });
      }

      const data = tempVoiceManager.getChannelIdForUser(userId);
if (!data || !data.voiceChannelId) {
  return interaction.reply({ content: "<:carpi_arviis:1421401682348216340> Kanal **bulunamadı.**", flags: 64 });
}

const channel = interaction.guild.channels.cache.get(data.voiceChannelId);
if (!channel) {
  return interaction.reply({ content: "<:carpi_arviis:1421401682348216340> Kanal **bulunamadı.**", flags: 64 });
}

      const member = await interaction.guild.members.fetch(userId);
      const voiceChannel = member.voice.channel;

      if (!voiceChannel) {
        return interaction.reply({
          content: "<a:dikkat_arviis:1421402093876674641> **Ses kanalında değilsin.**",
          flags: 64
        });
      }

      if (prefix === "kilitle") {
        await voiceChannel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
          Connect: false
        });
        return interaction.reply({ content: "<:colorized_voice_locked_arviis:1421401959193378928> Kanal **kilitlendi.**", flags: 64 });
      }

      if (prefix === "kilitaç") {
        await voiceChannel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
          Connect: true
        });
        return interaction.reply({ content: "<:colorized_screenshare_max_arviis:1421401912380624986> Kanalın kilidi **açıldı.**", flags: 64 });
      }

      if (prefix === "kanalsil") {
        if (!channel) {
          return interaction.reply({
            content: "<a:dikkat_arviis:1421402093876674641> **Kanal zaten silinmiş veya bulunamadı.**",
            flags: 64
          });
        }

        await channel.delete().catch(() => null);
        return interaction.reply({ content: "<:delete_guild_arviis:1421402071231365201> Kanal **silindi.**", flags: 64 });
      }

      if (prefix === "kanallimit") {
        const modal = new ModalBuilder()
          .setCustomId(`tempvc_kanallimitmodal_${userId}`)
          .setTitle("Kanal Limitini Belirle");

        const limitInput = new TextInputBuilder()
          .setCustomId("tempvc_kanal_limit")
          .setLabel("Yeni Kanal Limiti (1-99)")
          .setPlaceholder("Örnek: 5")
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(limitInput));
        return interaction.showModal(modal);
      }

      if (prefix === "kullaniciekle") {
        const modal = new ModalBuilder()
          .setCustomId(`tempvc_kullanicieklemodal_${userId}`)
          .setTitle("Kanalına Kişi Ekle");

        const userInput = new TextInputBuilder()
          .setCustomId("tempvc_kullanici_id")
          .setLabel("Kişi ID")
          .setPlaceholder("Örnek: 216222397349625857")
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(userInput));
        return interaction.showModal(modal);
      }

      if (prefix === "kanalad") {
        const modal = new ModalBuilder()
          .setCustomId(`tempvc_kanaladmodal_${userId}`)
          .setTitle("Kanal Adını Değiştir");

        const input = new TextInputBuilder()
          .setCustomId("tempvc_kanal_ad")
          .setLabel("Yeni Kanal Adı")
          .setPlaceholder("Örnek: ArviS's Room")
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(input));
        return interaction.showModal(modal);
      }

      if (prefix === "kullanicisat") {
        const modal = new ModalBuilder()
          .setCustomId(`tempvc_kullanicisatmodal_${userId}`)
          .setTitle("Kanalından Kişi At");

        const input = new TextInputBuilder()
          .setCustomId("tempvc_kullanici_id")
          .setLabel("Kişi ID")
          .setPlaceholder("Örnek: 216222397349625857")
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(input));
        return interaction.showModal(modal);
      }

      if (prefix === "kullanicisil") {
        const modal = new ModalBuilder()
          .setCustomId(`tempvc_kullanicisilmodal_${userId}`)
          .setTitle("Kanalına Erişimi Kaldır");

        const input = new TextInputBuilder()
          .setCustomId("tempvc_kullanici_id")
          .setLabel("Kişi ID")
          .setPlaceholder("Örnek: 216222397349625857")
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(input));
        return interaction.showModal(modal);
      }

      if (prefix === "bitrate") {
        const modal = new ModalBuilder()
          .setCustomId(`tempvc_bitrate_modal_${userId}`)
          .setTitle("Bitrate Ayarla");

        const input = new TextInputBuilder()
          .setCustomId("tempvc_bitrate")
          .setLabel("Bitrate (8000 - 96000)")
          .setPlaceholder("Örnek: 64000")
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(input));
        return interaction.showModal(modal);
      }

      if (prefix === "region") {
        const selectMenu = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(`tempvc_regionselect_${userId}`)
            .setPlaceholder("Bölge Seç")
            .addOptions(
              { label: "🇧🇷 Brezilya", value: "brazil" },
              { label: "🇭🇰 Hong Kong", value: "hongkong" },
              { label: "🇮🇳 Hindistan", value: "india" },
              { label: "🇯🇵 Japonya", value: "japan" },
              { label: "🇳🇱 Rotterdam", value: "rotterdam" },
              { label: "🇸🇬 Singapur", value: "singapore" },
              { label: "🇰🇷 Güney Kore", value: "south-korea" },
              { label: "🇿🇦 Güney Afrika", value: "southafrica" },
              { label: "🇦🇺 Sidney", value: "sydney" },
              { label: "🇺🇸 Amerika", value: "us-central" },
              { label: "🇺🇸 Doğu Amerika", value: "us-east" },
              { label: "🇦🇷 Güney Amerika", value: "us-south" },
              { label: "🇺🇸 Batı Amerika", value: "us-west" },       
            )
        );

        return interaction.reply({
          components: [selectMenu],
          flags: 64
        });
      }
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith("tempvc_kullanicieklemodal_")) {
      const userId = interaction.customId.split("_")[2];
      const data = tempVoiceManager.getChannelIdForUser(userId);

      if (!data || !data.voiceChannelId) {
    return interaction.reply({ content: "<:carpi_arviis:1421401682348216340> Kanal **bulunamadı.**", flags: 64 });
  }

  const kanal = interaction.guild.channels.cache.get(data.voiceChannelId);

     if (!kanal) {
    return interaction.reply({ content: "<:carpi_arviis:1421401682348216340> Kanal **bulunamadı.**", flags: 64 });
  }

      const input = interaction.fields.getTextInputValue("tempvc_kullanici_id");
      const targetUserId = input.replace(/[<@!>]/g, "");
      const member = await interaction.guild.members.fetch(targetUserId).catch(() => null);

      if (!member) {
        return interaction.reply({ content: "<a:dikkat_arviis:1421402093876674641> **Geçerli bir kişi belirtilmedi.**", flags: 64 });
      }

      await kanal.permissionOverwrites.edit(member.id, {
        Connect: true,
        ViewChannel: true
      });

      return interaction.reply({ content: `<:kullanici_arviis:1421409488921169960> ${member} artık kanala **katılabilir.**`, flags: 64 });
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith("tempvc_kanallimitmodal_")) {
      const userId = interaction.customId.split("_")[2];
      const data = tempVoiceManager.getChannelIdForUser(userId);

      if (!data || !data.voiceChannelId) {
    return interaction.reply({ content: "<:carpi_arviis:1421401682348216340> Kanal **bulunamadı.**", flags: 64 });
  }

  const kanal = interaction.guild.channels.cache.get(data.voiceChannelId);

     if (!kanal) {
    return interaction.reply({ content: "<:carpi_arviis:1421401682348216340> Kanal **bulunamadı.**", flags: 64 });
  }

      const limitStr = interaction.fields.getTextInputValue("tempvc_kanal_limit");
      const limit = parseInt(limitStr);

      if (isNaN(limit) || limit < 1 || limit > 99) {
        return interaction.reply({ content: "<a:dikkat_arviis:1421402093876674641> **1 ile 99 arasında bir sayı gir.**", flags: 64 });
      }

      await kanal.setUserLimit(limit);
      return interaction.reply({ content: `<:colorized_security_filter_arviis:1421401934476218468> Kanal limiti **${limit}** olarak **ayarlandı.**`, flags: 64 });
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith("tempvc_kanaladmodal_")) {
      const userId = interaction.customId.split("_")[2];
      const data = tempVoiceManager.getChannelIdForUser(userId);

      if (!data || !data.voiceChannelId) {
    return interaction.reply({ content: "<:carpi_arviis:1421401682348216340> Kanal **bulunamadı.**", flags: 64 });
  }

  const kanal = interaction.guild.channels.cache.get(data.voiceChannelId);

     if (!kanal) {
    return interaction.reply({ content: "<:carpi_arviis:1421401682348216340> Kanal **bulunamadı.**", flags: 64 });
  }

      const newName = interaction.fields.getTextInputValue("tempvc_kanal_ad");
      await kanal.setName(newName);
      return interaction.reply({ content: `<:discord_channel_from_VEGA_arviis:1421408465947197491> Kanal adı **${newName}** olarak **güncellendi.**`, flags: 64 });
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith("tempvc_kullanicisatmodal_")) {
      const userId = interaction.customId.split("_")[2];
      const data = tempVoiceManager.getChannelIdForUser(userId);

      if (!data || !data.voiceChannelId) {
    return interaction.reply({ content: "<:carpi_arviis:1421401682348216340> Kanal **bulunamadı.**", flags: 64 });
  }

  const kanal = interaction.guild.channels.cache.get(data.voiceChannelId);

     if (!kanal) {
    return interaction.reply({ content: "<:carpi_arviis:1421401682348216340> Kanal **bulunamadı.**", flags: 64 });
  }

      const input = interaction.fields.getTextInputValue("tempvc_kullanici_id");
      const targetUserId = input.replace(/[<@!>]/g, "");
      const member = await interaction.guild.members.fetch(targetUserId).catch(() => null);

      if (!member || member.voice.channelId !== kanal.id) {
        return interaction.reply({ content: "<a:dikkat_arviis:1421402093876674641> **Kişi bu kanalda değil.**", flags: 64 });
      }

      await member.voice.disconnect().catch(() => {});
      return interaction.reply({ content: `<:quarantine_arviis:1421412225549074552> ${member} kanaldan **atıldı.**`, flags: 64 });
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith("tempvc_kullanicisilmodal_")) {
      const userId = interaction.customId.split("_")[2];
      const data = tempVoiceManager.getChannelIdForUser(userId);

      if (!data || !data.voiceChannelId) {
    return interaction.reply({ content: "<:carpi_arviis:1421401682348216340> Kanal **bulunamadı.**", flags: 64 });
  }

  const kanal = interaction.guild.channels.cache.get(data.voiceChannelId);

     if (!kanal) {
    return interaction.reply({ content: "<:carpi_arviis:1421401682348216340> Kanal **bulunamadı.**", flags: 64 });
  }

      const input = interaction.fields.getTextInputValue("tempvc_kullanici_id");
      const targetUserId = input.replace(/[<@!>]/g, "");
      const member = await interaction.guild.members.fetch(targetUserId).catch(() => null);

      if (!member) {
        return interaction.reply({ content: "<a:dikkat_arviis:1421402093876674641> **Geçerli bir kişi değil.**", flags: 64 });
      }

      await kanal.permissionOverwrites.edit(member.id, {
        Connect: false,
        ViewChannel: false,
      });

      return interaction.reply({ content: `<:suspected_spam_activ_arviis:1421412740240511008> ${member} kanal erişiminden **çıkarıldı.**`, flags: 64 });
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith("tempvc_bitrate_modal_")) {
      const userId = interaction.customId.split("_")[3];
      const data = tempVoiceManager.getChannelIdForUser(userId);

      if (!data || !data.voiceChannelId) {
    return interaction.reply({ content: "<:carpi_arviis:1421401682348216340> Kanal **bulunamadı.**", flags: 64 });
  }

  const kanal = interaction.guild.channels.cache.get(data.voiceChannelId);

     if (!kanal) {
    return interaction.reply({ content: "<:carpi_arviis:1421401682348216340> Kanal **bulunamadı.**", flags: 64 });
  }

      const bitrate = parseInt(interaction.fields.getTextInputValue("tempvc_bitrate"));
      if (isNaN(bitrate) || bitrate < 8000 || bitrate > 96000) {
        return interaction.reply({ content: "<a:dikkat_arviis:1421402093876674641> **8000 ile 96000 arasında bir sayı gir.**", flags: 64 });
      }

      await kanal.setBitrate(bitrate);
      return interaction.reply({ content: `<:colorized_ping_connection_arviis:1421401889400033341> Bitrate **${bitrate}** olarak **ayarlandı.**`, flags: 64 });
    }

    if (interaction.isStringSelectMenu() && interaction.customId.startsWith("tempvc_regionselect_")) {
      const userId = interaction.customId.split("_")[2];
      const data = tempVoiceManager.getChannelIdForUser(userId);

      if (!data || !data.voiceChannelId) {
    return interaction.reply({ content: "<:carpi_arviis:1421401682348216340> Kanal **bulunamadı.**", flags: 64 });
  }

  const kanal = interaction.guild.channels.cache.get(data.voiceChannelId);

     if (!kanal) {
    return interaction.reply({ content: "<:carpi_arviis:1421401682348216340> Kanal **bulunamadı.**", flags: 64 });
  }

      const region = interaction.values[0];
      await kanal.setRTCRegion(region);

      return interaction.update({
        content: `<:online_web_arviis:1421412038617468998> Bölge **${region}** olarak **ayarlandı.**`,
        components: []
      });
    }
  });
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//ÇEKİLİŞ SİSTEMİ
const filePath112 = path.join(__dirname, "../../Database/cekilis.json");

if (!fs.existsSync(filePath112)) {
    fs.writeFileSync(filePath112, JSON.stringify({}, null, 4));
}

client.on('interactionCreate', async interaction => {
    const cekilisData = JSON.parse(fs.readFileSync(filePath112, 'utf8'));

    if (interaction.isModalSubmit() && interaction.customId === 'cekilis_baslat') {
        const süreInput = interaction.fields.getTextInputValue('sure');
        const kazananInput = interaction.fields.getTextInputValue('kazanan');
        const odulInput = interaction.fields.getTextInputValue('odul');
        const aciklamaInput = interaction.fields.getTextInputValue('aciklama') || '<:carpi_arviis:1421401682348216340> Çekilişin açıklaması **girilmemiş.**';

        const süreMs = ms(süreInput);
        if (!süreMs || süreMs < 1000) return interaction.reply({ content: '<a:dikkat_arviis:1421402093876674641>  **Geçerli bir süre gir.**', flags: 64 });

        const endTime = Date.now() + süreMs;
        const cekilisId = Date.now().toString();

        cekilisData[cekilisId] = {
            guildId: interaction.guildId,
            channelId: interaction.channelId,
            messageId: null,
            hostId: interaction.user.id,
            prize: odulInput,
            description: aciklamaInput,
            winners: parseInt(kazananInput),
            endTime,
            participants: [],
            ended: false
        };

        const embed = new EmbedBuilder()
            .setTitle(`${odulInput}`)
            .setDescription(`${aciklamaInput} \n\n\n<:crown_arviis:1421402003304747018> Çekiliş Sahibi: **<@${interaction.user.id}>** \n<:id_arviis:1421409084615168000> Çekiliş ID: **${cekilisId}** \n\n<:uye_arviis:1421413166276935763> Kazanan Sayısı: **${kazananInput}** \n<:kullanici_arviis:1421409488921169960> Katılımcı Sayısı: **0** \n\n<a:saat_arviis:1421412278544105542> Bitiş: **<t:${Math.floor(endTime / 1000)}:R>**`)
            .setColor(0x5e74ff)
            .setThumbnail(interaction.user.displayAvatarURL());

        const katilButton = new ButtonBuilder()
            .setCustomId(`giveaway_join_${cekilisId}`)
            .setLabel('Çekilişe Katıl')
            .setEmoji('<a:giveaway_arviis:1421408946215714847>')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(katilButton);

        const msg = await interaction.channel.send({ embeds: [embed], components: [row] });

        cekilisData[cekilisId].messageId = msg.id;
        const filePath = path.join(__dirname, "../../Database/cekilis.json");
        fs.writeFileSync(filePath, JSON.stringify(cekilisData, null, 4));

        interaction.reply({ content: `<:tik_arviis:1421412906435739698> Çekiliş **başlatıldı.**`, flags: 64 });

        setTimeout(async () => {
            const updatedData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            const cekilis = updatedData[cekilisId];
            if (!cekilis || cekilis.ended) return;

            cekilis.ended = true;

            let winnersList = '<:carpi_arviis:1421401682348216340> Katılımcı **yok.**';
let winners = [];
if (cekilis.participants.length) {
    const shuffled = cekilis.participants.sort(() => 0.5 - Math.random());
    winners = shuffled.slice(0, cekilis.winners);
    winnersList = winners.map(id => `<@${id}>`).join(', ');
}

            fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 4));

            const channel = await client.channels.fetch(cekilis.channelId);
            const message = await channel.messages.fetch(cekilis.messageId);

let descriptionText = `${cekilis.description} \n\n\n<:crown_arviis:1421402003304747018> Çekiliş Sahibi: **<@${cekilis.hostId}>** \n<:id_arviis:1421409084615168000> Çekiliş ID: **${cekilisId}** \n\n<:uye_arviis:1421413166276935763> Kazanan Sayısı: **${cekilis.winners}** \n<:kullanici_arviis:1421409488921169960> Katılımcı Sayısı: **${cekilis.participants.length}**`;

if (cekilis.participants.length) {
    descriptionText += ` \n\n<a:odul_arviis:1421410099360170065> Kazanan(lar): ${winnersList}`;
} else {
    descriptionText += ` \n\n<:carpi_arviis:1421401682348216340> Katılımcı **yok.**`;
}

            const updatedEmbed = EmbedBuilder.from(message.embeds[0])
                .setDescription(descriptionText)
                .setColor(0x5e74ff)
                .setThumbnail((await client.users.fetch(cekilis.hostId)).displayAvatarURL());

            const goruntuleButton = new ButtonBuilder()
                .setCustomId(`giveaway_participants_${cekilisId}`)
                .setLabel('Katılımcılar')
                .setStyle(ButtonStyle.Secondary);

            const newRow = new ActionRowBuilder().addComponents(goruntuleButton);

            await message.edit({ embeds: [updatedEmbed], components: [newRow] });

            await channel.send(`## <a:giveaway_arviis:1421408946215714847> Çekiliş **sona erdi.**

${winners.length > 0 ? `<a:odul_arviis:1421410099360170065> Tebrikler ${winnersList}` : '<:carpi_arviis:1421401682348216340> Katılımcı **yok.**'}`);
        }, süreMs);
    }
      const filePath2323 = path.join(__dirname, "../../Database/cekilis.json");

    if (interaction.isButton() && interaction.customId.startsWith('giveaway_')) {
        const parts = interaction.customId.split('_');
        const action = parts[1];
        const cekilisId = parts[2];
        const cekilis = cekilisData[cekilisId];
        if (!cekilis) return interaction.reply({ content: '<a:dikkat_arviis:1421402093876674641> **Çekiliş bulunamadı.**', flags: 64 });

        if (action === 'join') {
            if (cekilis.ended) return interaction.reply({ content: '<a:dikkat_arviis:1421402093876674641> **Bu çekiliş artık aktif değil.**', flags: 64 });

            if (cekilis.participants.includes(interaction.user.id)) {
                return interaction.reply({ content: '<a:dikkat_arviis:1421402093876674641> **Çekilişe zaten katılmışsın.**', flags: 64 });
            }

            cekilis.participants.push(interaction.user.id);
            fs.writeFileSync(filePath2323, JSON.stringify(cekilisData, null, 4));

            const channel = await client.channels.fetch(cekilis.channelId);
            const message = await channel.messages.fetch(cekilis.messageId);

            const updatedEmbed = EmbedBuilder.from(message.embeds[0])
                .setDescription(`${cekilis.description} \n\n\n<:crown_arviis:1421402003304747018> Çekiliş Sahibi: **<@${cekilis.hostId}>** \n<:id_arviis:1421409084615168000> Çekiliş ID: **${cekilisId}** \n\n<:uye_arviis:1421413166276935763> Kazanan Sayısı: **${cekilis.winners}** \n<:kullanici_arviis:1421409488921169960> Katılımcı Sayısı: **${cekilis.participants.length}** \n\n<a:saat_arviis:1421412278544105542> Bitiş: **<t:${Math.floor(cekilis.endTime / 1000)}:R>** `)
                .setColor(0x5e74ff)
                .setThumbnail((await client.users.fetch(cekilis.hostId)).displayAvatarURL());

            await message.edit({ embeds: [updatedEmbed] });

            return interaction.reply({ content: '<a:giveaway_arviis:1421408946215714847> Çekilişe **katıldın.**', flags: 64 });
        }

        if (action === 'participants') {
            const names = cekilis.participants.length
                ? cekilis.participants.map(id => `<@${id}>`).join(', ')
                : '<:carpi_arviis:1421401682348216340> Katılımcı **yok.**';

            return interaction.reply({ content: `## <:uye_arviis:1421413166276935763> Katılımcılar \n- ${names}`, flags: 64 });
        }
    }
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////