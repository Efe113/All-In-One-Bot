const { ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, TextDisplayBuilder, SectionBuilder, SeparatorBuilder, MessageFlags } = require('discord.js');
const db2 = require('../../Utils/jsonDB');
const Eris = require('eris');
const ayarlar = require('../../Settings/ayarlar.json');
const fs = require("fs");
const path = require("path");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//SUNUCUYA ATILAN TÜM MESAJLAR KAYIT
client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;

  const id = message.author.id;

  db2.add(`msg_1d_${id}`, 1);
  db2.add(`msg_7d_${id}`, 1);
  db2.add(`msg_total_${id}`, 1);
  db2.add(`channelMsgCount_${message.channel.id}_${message.author.id}`, 1);
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//ROLEPLAY SİSTEMİ
const dbPath121212 = path.join(__dirname, '../../Database/roleplay.json');

client.on('messageCreate', async message => {
  if (message.author.bot || !message.guild || !message.channel.parentId) return;

  let db = require(dbPath121212);
  const kategoriListesi = db.kategoriler || [];

  if (!kategoriListesi.includes(message.channel.parentId)) return;

  const userId = message.author.id;
  const kelimeSayısı = message.content.trim().split(/\s+/).length;

  if (!db[userId]) db[userId] = { rp: 0, xp: 0 };

  db[userId].rp += kelimeSayısı;
  db[userId].xp += kelimeSayısı;
  db[userId].lastChannel = message.channel.id;
  db[userId].lastTime = Date.now();

  fs.writeFile(dbPath121212, JSON.stringify(db, null, 2), err => {
    if (err) console.error('Veri kaydedilirken hata oluştu:', err);
  });
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const aktifDB = require('../../Utils/aktifDB');
const { generateEmbed } = require('../../Utils/embedGenerator');

let lastUpdate = 0;
const updateCooldown = 1000;

const ignoreChannels = [
  "1398734539337105518",
  "1398733334116569241", 
  "1398733405390242024", 
];

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  if (ignoreChannels.includes(message.channel.id)) return;

  const id = message.author.id;
  aktifDB.add(`puan_${id}`, 1);

  const now = Date.now();
  if (now - lastUpdate < updateCooldown) return;
  lastUpdate = now;

  const dataPath = path.join(__dirname, '../../Database/aktifUye.json');
  if (!fs.existsSync(dataPath)) return;

  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  if (!data.kanal || !data.mesaj) return;

  try {
    const kanal = await client.channels.fetch(data.kanal);
    const mesaj = await kanal.messages.fetch(data.mesaj);
    const embed = generateEmbed(data);
    await mesaj.edit({ embeds: [embed] });
  } catch (err) {
    console.log('Embed güncellenemedi:', err.message);
  }
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//YETKİLİ BAŞVURU SİSTEMİ
const dbFile345 = path.join(__dirname, '../../Database/yetkiliBasvuru.json');

function readDB() {
  if (!fs.existsSync(dbFile345)) fs.writeFileSync(dbFile345, JSON.stringify({}));
  const raw = fs.readFileSync(dbFile345);
  return JSON.parse(raw);
}

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  const db = readDB();
  const guildId = message.guild.id;
  const settings = db[guildId];

  if (!settings || !settings.basvuruKanal || message.channel.id !== settings.basvuruKanal) return;

  await message.delete().catch(() => null);

  const logChannel = message.guild.channels.cache.get(settings.logKanal);
  if (!logChannel || logChannel.type !== ChannelType.GuildText) return;

  const embed = new EmbedBuilder()
    .setTitle(`${message.author.globalName} ( ${message.author.username} ) \n${message.author.id}`)
    .setDescription(`${message.content}`)
    .setColor(0xb3ffe6)
    .setThumbnail(message.author.displayAvatarURL());

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`yetkili_onayla_${message.author.id}`)  
      .setLabel('Onayla')
      .setStyle(ButtonStyle.Success)
      .setEmoji('<:tik_arviis:1421412906435739698>'),
    new ButtonBuilder()
      .setCustomId(`yetkili_reddet_${message.author.id}`) 
      .setLabel('Reddet')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('<:carpi_arviis:1421401682348216340>')
  );

  await logChannel.send({ embeds: [embed], components: [row] });
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//AFK SİSTEMİ
const afkPath = path.join(__dirname, "../../Database/afk.json");

function readAfkDB() {
  if (!fs.existsSync(afkPath)) return {};
  return JSON.parse(fs.readFileSync(afkPath, "utf-8"));
}

function writeAfkDB(data) {
  fs.writeFileSync(afkPath, JSON.stringify(data, null, 2));
}

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const db = readAfkDB();
  const afkData = db[message.author.id];

  if (afkData) {
    const sureMs = Date.now() - afkData.zaman;
    const gun = Math.floor(sureMs / (1000 * 60 * 60 * 24));
    const saat = Math.floor(sureMs / (1000 * 60 * 60)) % 24;
    const dakika = Math.floor(sureMs / (1000 * 60)) % 60;
    const saniye = Math.floor(sureMs / 1000) % 60;

    let zamanString = "";
    if (gun > 0) zamanString += `${gun} Gün `;
    zamanString += `${String(saat).padStart(2, "0")}:${String(dakika).padStart(2, "0")}:${String(saniye).padStart(2, "0")}`;

    const member = message.guild.members.cache.get(message.author.id);
    const nickname = member.nickname ? member.nickname.replace("[AFK] ", "") : member.user.globalName;
    member.setNickname(nickname).catch(() => {});

    delete db[message.author.id];
    writeAfkDB(db);

    return message.reply(`**AFK** modundan çıktın. **|** <a:saat_arviis:1421412278544105542> **(** ${zamanString} **)**`).then(sentMsg => {
      setTimeout(() => {
        sentMsg.delete().catch(() => {}); 
      }, 5000);
    });
  }

  const kullanıcı = message.mentions.users.first();
  if (!kullanıcı) return;

  const etiketAFK = db[kullanıcı.id];
if (etiketAFK) {
  message.reply(`Etiketlediğin kişi \`${etiketAFK.sebep}\` sebebiyle **AFK**`).then(sentMsg => {
    setTimeout(() => {
      sentMsg.delete().catch(() => {}); 
    }, 5000);
  });
}
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//OTO PUBLISH SİSTEMİ
const dbPath33 = path.join(__dirname, '../../Database/otoPublish.json');

const publishQueue = [];
let processing = false;

client.on("messageCreate", async (message) => {
  if (!message.guild || message.channel.type !== 5) return;

  let otoPublishData = {};
  try {
    otoPublishData = fs.existsSync(dbPath33)
      ? JSON.parse(fs.readFileSync(dbPath33, 'utf-8'))
      : {};
  } catch (err) {
    console.error('otoPublish.json okuma hatası:', err);
    return;
  }

  const channelIds = otoPublishData[message.guild.id];
  if (!Array.isArray(channelIds) || !channelIds.includes(message.channel.id)) return;

  publishQueue.push(message);
  processQueue();
});

async function processQueue() {
  if (processing || publishQueue.length === 0) return;
  processing = true;

  const message = publishQueue.shift();

  try {
    if (message.crosspostable) {
      await message.crosspost();
    } else {
      console.log('Mesaj crosspostable değil.');
    }
  } catch (err) {
    console.error('crosspost() hatası:', err);
  }

  setTimeout(() => {
    processing = false;
    processQueue();
  }, 1100); 
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//BOT ETİKET CEVAP
client.on("messageCreate", message => {
  if (message.content === `<@${client.user.id}>`) {
    message.reply({ content: "Efendim?" })
  }
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//ALINTI ROL SİSTEMİ
const DATA_PATH33 = path.join(__dirname, "../../Database/alintiRol.json");

function readAlintiRolB() {
  return JSON.parse(fs.readFileSync(DATA_PATH33, "utf-8"));
}

client.on("messageCreate", async (message) => {
  if (!message.guild) return;
  if (message.author.id === client.user.id) return; 

  const data = readAlintiRolB();
  const guildData = data[message.guild.id];
  if (!guildData) return;

  const ayar = guildData[message.channel.id];
  if (!ayar) return;

  if (!ayar.includeBots && message.author.bot) return;

  try {
    await message.reply({
      content: `<@&${ayar.rol}>`,
      allowedMentions: { roles: [ayar.rol] },
    });
  } catch (err) {
    console.error("Alıntı rol sistemi hata:", err);
  }
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//OTOMATİK THREAD SİSTEMİ
const filePath22 = path.join(__dirname, "../../Database/otoThread.json");

function readData() {
  if (!fs.existsSync(filePath22)) return {};
  return JSON.parse(fs.readFileSync(filePath22, "utf-8"));
}

client.on("messageCreate", async (message) => {
  if (message.channel.type !== ChannelType.GuildText) return;

  const data = readData();
  const guildId = message.guild?.id;
  if (!guildId || !data[guildId]) return;

  const ayar = data[guildId][message.channel.id];
  if (!ayar) return;

  if (message.flags.has(1 << 6)) return;

  if (message.author.bot && !ayar.botlar) return;

  try {
    await message.startThread({
      name: ayar.isim,
      autoArchiveDuration: ayar.süre,
      reason: ayar.sebep
    });
  } catch (e) {
    console.error("Thread oluşturulurken hata:", e);
  }
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//VİDEOLARA-FOTOLARA OTOMATİK TEPKİ SİSTEMİ
const jsonPath2 = path.join(__dirname, "../../Database/iceriklereEmoji.json");

function loadEmojiData() {
  if (!fs.existsSync(jsonPath2)) return {};
  return JSON.parse(fs.readFileSync(jsonPath2, "utf8"));
}

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const emojiler = {
    UpVote: "<a:upvote_arviis:1421413096009760922>",
    DisVote: "<a:disvote_arviis:1421408489049423984>"
  };

  const kanalId = message.channelId;
  const data = loadEmojiData();

  if (data[`görsel_${kanalId}`]) {
    if (
      (message.attachments.size > 0 && message.attachments.first().contentType?.startsWith('image')) ||
      message.content.match(/https?:\/\/\S+\.(png|webp|jpg|jpeg|gif)/i)
    ) {
      await message.react(emojiler.UpVote);
      await message.react(emojiler.DisVote);
    }
  }

  if (data[`video_${kanalId}`]) {
    if (
      (message.attachments.size > 0 && message.attachments.first().contentType?.startsWith('video')) ||
      message.content.match(/https?:\/\/\S+\.(mp4|webm)/i)
    ) {
      await message.react(emojiler.UpVote);
      await message.react(emojiler.DisVote);
    }
  }
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//REKLAM ENGEL SİSTEMİ
const reklamEngelPath = path.join(__dirname, "../../Database/reklamEngel.json");

const ReklamKelimeleri = [
  "discord.gg", "discord/gg", "discor.gg", "discord.gg/", "discord.g",
  "disco.gg", "disco.g", "disco/gg", "disco/g", "disco.gg/", "discord.gg//", ".gg/"
];

function oku() {
  if (!fs.existsSync(reklamEngelPath)) return {};
  return JSON.parse(fs.readFileSync(reklamEngelPath, "utf8"));
}

function yaz(data) {
  fs.writeFileSync(reklamEngelPath, JSON.stringify(data, null, 2));
}

module.exports = {
  name: "messageCreate",
  async execute(message, client) {
    if (message.channel.type !== ChannelType.GuildText || message.author.bot) return;

    const data = oku();
    const reklamEngelData = data[message.guild.id];

    if (!reklamEngelData || reklamEngelData.aktif !== true) return;

    const { logKanal, muafRol, muafKanallar, uyariSayilari = {} } = reklamEngelData;

    if (Array.isArray(muafKanallar) && muafKanallar.includes(message.channel.id)) return;
    if (muafRol && message.member.roles.cache.has(muafRol)) return;

    const içerik = message.content.toLowerCase();
    const reklamVar = ReklamKelimeleri.some(kelime => içerik.includes(kelime));
    if (!reklamVar) return;

    try {
      await message.delete();

      const key = message.author.id;
      const uyarıSayısı = uyariSayilari[key] || 0;
      uyariSayilari[key] = uyarıSayısı + 1;
      reklamEngelData.uyariSayilari = uyariSayilari;
      data[message.guild.id] = reklamEngelData;
      yaz(data);

      await message.channel.send({
        content: `<a:dikkat_arviis:1421402093876674641> ${message.author} Reklam **YASAK!**`,
        allowedMentions: { users: [message.author.id] }
      }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));

      if (uyarıSayısı + 1 >= 3) {
        let dmGönderildi = true;

        try {
          await message.author.send("<:ban_arviis:1421401381683859576> Sunucuda reklam yapmaya çalıştığın için **yasaklandın.** \n\n<:info_arviis:1421409198385926295> Bunun bir hata olduğunu düşünüyorsan <@640056735700221953> **(** EfeTR. **)** ile iletişime geçebilirsin.");
        } catch (e) {
          dmGönderildi = false;
        }

        let member = message.member;
        if (!member) {
          try {
            member = await message.guild.members.fetch(message.author.id);
          } catch (e) {
            console.error("Üye çekilemedi:", e);
            return;
          }
        }

        try {
          await member.ban({ reason: "3 kez reklam yaptı." });
        } catch (e) {
          console.error("Ban işlemi başarısız:", e);
        }

        if (logKanal) {
          const logChannel = message.guild.channels.cache.get(logKanal);
          if (logChannel) {
            logChannel.send(`<:ban_arviis:1421401381683859576> ${message.author} adlı kişi 3 kez reklam yaptığı için sunucudan **yasaklandı**.`);
            if (!dmGönderildi) {
              logChannel.send(`<:carpi_arviis:1421401682348216340> ${message.author} DM'i kapalı olduğu için mesaj **gönderilemedi.**`);
            }
          }
        }

        delete uyariSayilari[key];
        reklamEngelData.uyariSayilari = uyariSayilari;
        data[message.guild.id] = reklamEngelData;
        yaz(data);
      }

    } catch (err) {
      console.error("Reklam kontrolünde hata:", err);
    }
  }
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//EMBED OKU ROL ETİKETLE SİSTEMİ
const filePath2 = path.join(__dirname, '../../Database/embedOkuRolEtiket.json');

function veriOku() {
  if (!fs.existsSync(filePath2)) return {};
  return JSON.parse(fs.readFileSync(filePath2, 'utf8'));
}

client.on('messageCreate', async message => {
  if (!message.guild || !message.embeds.length) return;

  const veriler = veriOku();
  const ayarlar = veriler[message.guildId];
  if (!ayarlar || !Array.isArray(ayarlar.kanallar) || !ayarlar.kanallar.includes(message.channel.id)) return;

  const { roller } = ayarlar;

  for (const embed of message.embeds) {
    const embedContent = `${embed.title || ""} ${embed.description || ""} ${embed.fields?.map(f => `${f.name} ${f.value}`).join(" ") || ""}`.toLowerCase();

    for (const [kelime, rolID] of Object.entries(roller)) {
      if (embedContent.includes(kelime.toLowerCase())) {
        try {
          await message.channel.send({
            content: `<@&${rolID}>`,
            allowedMentions: { roles: [rolID] },
            reply: { messageReference: message.id }
          });
        } catch (err) {
          console.error(`[HATA] Rol ( ${rolID} ) etiketlenemedi:`, err);
        }
        return;
      }
    }
  }
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//KANAL YÖNLENDİRME SİSTEMİ
const veriYolu = path.join(__dirname, "../../Database/kanalaYonlendirme.json");

function veriOku() {
  if (!fs.existsSync(veriYolu)) return {};
  return JSON.parse(fs.readFileSync(veriYolu, "utf8"));
}

client.on("messageCreate", async (message) => {
  if (!message.guild || (!message.webhookId && message.author.bot)) return;

  const veri = veriOku();
  const guildVerisi = veri[message.guild.id];
  if (!guildVerisi) return;

  const yönlendirmeler = guildVerisi.yönlendirmeler || [];
  const aktifYönlendirme = yönlendirmeler.find(y => y.kaynakId === message.channel.id);
  if (!aktifYönlendirme) return;

  const hedefKanal = message.guild.channels.cache.get(aktifYönlendirme.hedefId);
  if (!hedefKanal || !hedefKanal.isTextBased()) return;

  const ayarlar = aktifYönlendirme.embedAyar || {}; 
  const rolPing = aktifYönlendirme.rolId ? `<@&${aktifYönlendirme.rolId}> ` : "";

  const isEmbedEmpty = (embed) => {
    const data = embed.data;
    return !data.title &&
           !data.description &&
           !data.fields?.length &&
           !data.footer &&
           !data.image &&
           !data.thumbnail &&
           !data.url &&
           !data.color;
  };

  try {
    if (message.embeds.length > 0) {
      for (const originalEmbed of message.embeds) {
        const title = originalEmbed.title || '';
        const description = originalEmbed.description || '';
        const footer = originalEmbed.footer?.text || '';

        const isAdEmbed =
          /PatchBot Premium/i.test(title + description + footer) ||
          /brought to you by/i.test(description) ||
          /as little as \$?1\.49\/mo/i.test(description) ||
          /role mentioning/i.test(description) ||
          /PatchBot Premium adds role mentioning/i.test(title + description) ||
          /patchbot/i.test(footer);

        if (isAdEmbed) continue;

        const newEmbed = new EmbedBuilder();

        if (ayarlar.title && originalEmbed.title)
          newEmbed.setTitle(originalEmbed.title);
        if (ayarlar.description && originalEmbed.description)
          newEmbed.setDescription(originalEmbed.description);
        if (ayarlar.color && originalEmbed.color)
          newEmbed.setColor(originalEmbed.color);
        if (ayarlar.url && originalEmbed.url)
          newEmbed.setURL(originalEmbed.url);
        if (ayarlar.thumbnail && originalEmbed.thumbnail?.url)
          newEmbed.setThumbnail(originalEmbed.thumbnail.url);
        if (ayarlar.image && originalEmbed.image?.url)
          newEmbed.setImage(originalEmbed.image.url);
        if (ayarlar.fields && originalEmbed.fields?.length > 0)
          newEmbed.setFields(originalEmbed.fields.map(f => ({
            name: f.name,
            value: f.value,
            inline: f.inline ?? false
          })));
        if (ayarlar.footer && originalEmbed.footer?.text)
          newEmbed.setFooter({ text: originalEmbed.footer.text, iconURL: originalEmbed.footer.iconURL || null });

        if (isEmbedEmpty(newEmbed)) {
          console.warn("[Yönlendirme Uyarısı] Embed boş, gönderilmiyor.");
          continue;
        }

        await hedefKanal.send({ content: rolPing, embeds: [newEmbed] });
      }

    } else if (message.components?.length > 0) {
      let componentText = "";

      componentText += message.components
        .map(row => row.components
          .map(comp => comp.label || comp.text || "")
          .filter(Boolean)
          .join(" | ")
        )
        .join("\n");

      const mainContent = message.content || message.interactionMetadata?.name || "";

      const compEmbed = new EmbedBuilder()
        .setColor(0x5865F2); 

      if (ayarlar.title && mainContent)
        compEmbed.setTitle(mainContent);

      if (ayarlar.description && componentText.trim())
        compEmbed.setDescription(componentText.trim());

      if (ayarlar.image && message.attachments.size > 0) {
        const firstAttachment = message.attachments.first();
        compEmbed.setImage(firstAttachment.url);
      }

      if (!isEmbedEmpty(compEmbed)) {
        await hedefKanal.send({ content: rolPing, embeds: [compEmbed] });
      } else {
        await hedefKanal.send({ content: `${rolPing}${mainContent || "*Boş mesaj.*"}` });
      }

    } else {
      await hedefKanal.send({ content: `${rolPing}${message.content || "*Boş mesaj.*"}` });
    }
  } catch (err) {
    console.error("[Yönlendirme Hatası]:", err);
  }
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//BOTA ROL ETİKET SİSTEMİ
const DATA_PATH2 = path.join(__dirname, '../../Database/botRolEtiket.json');

function loadData() {
  if (!fs.existsSync(DATA_PATH2)) return [];
  return JSON.parse(fs.readFileSync(DATA_PATH2, 'utf8'));
}

client.on('messageCreate', async (message) => {
  if (!message.guild || message.author.id === client.user.id) return;

  const kurallar = loadData();

  for (const kural of kurallar) {
    if (
      message.channel.id === kural.kanalID &&
      message.author.id === kural.botID
    ) {
      try {
        await message.reply(`<@&${kural.rolID}>`);
      } catch (error) {
        console.error('Etiketleme sırasında sorun oluştu:', error);
      }
      break;
    }
  }
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//OTOMATİK SELAM SİSTEMİ
const _client = new Eris(ayarlar.token, {
  intents: ["all"]
});
_client.connect();

_client.on("ready", () => {
});

const selamlar = [
  "sa", "saa", "saaa", "saaaa",
  "sea", "selam", "selm", "slm", "salam",
  "selam aleykum", "selamaleykum", "selam aleyküm", "selamaleyküm",
  "selamun aleyküm", "selamunaleyküm", "selamın aleyküm", "selamınaleyküm",
  "selamün aleyküm", "selamünaleyküm",
  "selamlar", "selamlr", "slmlar"
];

const merhabalar = [
  "merhaba", "merhb", "mrhb", "mrb",
  "merhabalar", "mrhblar", "merhablar", "mrblar"
];

_client.on("messageCreate", (msg) => {
  const content = msg.content.toLowerCase();

  if (selamlar.includes(content)) {
    msg.channel.createMessage({
      content: `Selam, **hoş geldin!** ${msg.author.mention}`,
      messageReference: { messageID: msg.id }
    });
  }

  if (merhabalar.includes(content)) {
    msg.channel.createMessage({
      content: `Merhaba, **hoş geldin!** ${msg.author.mention}`,
      messageReference: { messageID: msg.id }
    });
  }
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//İTİRAF SİSTEMİ
const ayarDosyasi = path.join(__dirname, '../../Database/itirafAyar.json');
let itirafAyar = {};
if (fs.existsSync(ayarDosyasi)) {
  itirafAyar = JSON.parse(fs.readFileSync(ayarDosyasi, 'utf8'));
}

const webhookCache = new Map();

async function getOrCreateWebhook(channel) {
  if (webhookCache.has(channel.id)) return webhookCache.get(channel.id);

  const webhooks = await channel.fetchWebhooks();
  let webhook = webhooks.find(w => w.name === 'itiraf_webhook');

  if (!webhook) {
    webhook = await channel.createWebhook({
      name: 'itiraf_webhook',
      avatar: 'https://cdn.discordapp.com/embed/avatars/0.png',
    });
  }

  webhookCache.set(channel.id, webhook);
  return webhook;
}

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  const guildAyar = itirafAyar[message.guild.id];
  if (!guildAyar) return;

  const { itirafKanal, logKanal } = guildAyar;
  if (message.channel.id !== itirafKanal) return;

  const karakterSayisi = message.content.replace(/\s/g, '').length;
  if (karakterSayisi < 10) {
    try {
      await message.delete();
    } catch (err) {
      console.error('Kısa itiraf mesajı silinemedi:', err);
    }

    const uyari = await message.channel.send({
      content: `<a:dikkat_arviis:1421402093876674641> <@${message.author.id}> **İtirafın çok kısa.** (En az 10 karakter olmalı)`,
    });

    setTimeout(() => uyari.delete().catch(() => {}), 5000);
    return;
  }

  try {
    const globalName = message.member.globalName || message.member.displayName;
    const harfliIsim = globalName.charAt(0).toUpperCase() + '****';
    const defaultAvatar = 'https://cdn.discordapp.com/embed/avatars/0.png';

    const webhook = await getOrCreateWebhook(message.channel);

    await message.delete().catch((err) =>
      console.error('Mesaj silinemedi:', err)
    );

    const webhookMessage = await webhook.send({
      content: message.content,
      username: harfliIsim,
      avatarURL: defaultAvatar,
    });

    const emojiler = [
      '👍🏻',
      '<a:redheart_arviis:1421412254800154694>',
      '<a:laugh_arviis:1421409519602503774>',
      '<a:think_arviis:1421412847958884405>',
      '<a:anxious_arviis:1421401235667419247>',
      '<a:sob_arviis:1421412681331511367>',
      '<a:swear_arviis:1421412778454945854>',
    ];
    for (const emoji of emojiler) {
      await webhookMessage.react(emoji);
    }

    if (logKanal) {
      const logChannel = message.guild.channels.cache.get(logKanal);
      if (logChannel) {
        const embed = new EmbedBuilder()
          .setTitle(`${message.author.globalName} (${message.author.username})\n${message.author.id}`)
          .setDescription(`# <:speechbubble_arviis:1421412705868189768> İtiraf İçeriği \n${message.content}\n\n# <:pin:1421412138773381121> Mesaj \n[**__[Mesaja Git]__**](${webhookMessage.url}) <:sadesagok_arviis:1421412348350038058> ${webhookMessage.url} \nMesaj ID <:sadesagok_arviis:1421412348350038058> ${webhookMessage.id}`)
          .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
          .setColor(0x2F3136);

        await logChannel.send({ embeds: [embed] });
      }
    }
  } catch (err) {
    console.error('İtiraf sistemi hatası:', err);
  }
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///OYUN SİSTEMİ
//SAYI SAYMACA
const dbPath = path.join(__dirname, '../../Database/oyunKanallari.json');
const sayiPath = path.join(__dirname, '../../Database/sayiSaymaca.json');

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  if (!fs.existsSync(dbPath)) return;
  const kanalVerisi = JSON.parse(fs.readFileSync(dbPath, 'utf-8'))[message.guildId];
  if (!kanalVerisi || !kanalVerisi.sayi) return;
  if (message.channelId !== kanalVerisi.sayi) return;

  const webhooks = await message.channel.fetchWebhooks();
  let webhook = webhooks.find(w => w.name === 'Sayı Saymaca Webhook');
  if (!webhook) {
    webhook = await message.channel.createWebhook({
      name: 'Sayı Saymaca Webhook',
      avatar: client.user.displayAvatarURL(),
    }).catch(console.error);
  }

  await message.delete().catch(() => {});

  let oyunVerisi = {};
  if (fs.existsSync(sayiPath)) {
    oyunVerisi = JSON.parse(fs.readFileSync(sayiPath, 'utf-8'));
  }

  const onceki = oyunVerisi[message.guildId]?.sayi || 0;
  const yazilanSayi = Number(message.content);

  if (!Number.isInteger(yazilanSayi) || yazilanSayi !== onceki + 1) {
    const hata = await message.channel.send(
      `<a:dikkat_arviis:1421402093876674641> ${message.member || message.author} **Sırayı bozma. Doğru sayı:** \`${onceki + 1}\``
    );
    setTimeout(() => hata.delete().catch(() => {}), 5000);
    return;
  }

  try {
    const gönderilen = await webhook.send({
      content: `${yazilanSayi}`,
      username: message.member?.displayName || message.author.globalName || message.author.username,
      avatarURL: message.author.displayAvatarURL(),
      allowedMentions: { parse: [] }
    });

    if (gönderilen && gönderilen.react) {
      await gönderilen.react('<:tik_arviis:1421412906435739698>');
    }

    oyunVerisi[message.guildId] = { sayi: yazilanSayi };
    fs.writeFileSync(sayiPath, JSON.stringify(oyunVerisi, null, 2));
  } catch (err) {
    console.error('Webhook hatası:', err);
  }
});

//BOM
const bomPath = path.join(__dirname, '../../Database/bom.json');

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (!fs.existsSync(dbPath)) return;
  const kanalVerisi = JSON.parse(fs.readFileSync(dbPath, 'utf-8'))[message.guildId];
  if (!kanalVerisi || !kanalVerisi.bom) return;
  if (message.channelId !== kanalVerisi.bom) return;

  const webhooks = await message.channel.fetchWebhooks();
  let webhook = webhooks.find(w => w.name === 'Bom Webhook');

  if (!webhook) {
    webhook = await message.channel.createWebhook({
      name: 'Bom Webhook',
      avatar: client.user.displayAvatarURL(),
    });
  }

  await message.delete().catch(() => {});

  let oyunVerisi = {};
  if (fs.existsSync(bomPath)) {
    oyunVerisi = JSON.parse(fs.readFileSync(bomPath, 'utf-8'));
  }

  const onceki = oyunVerisi[message.guildId]?.sayi || 0;
  const sonraki = onceki + 1;
  const icerik = message.content.toLowerCase();

  const dogruIcerik = sonraki % 5 === 0 ? 'bom' : String(sonraki);

  if (
    (sonraki % 5 === 0 && icerik !== 'bom') ||
    (sonraki % 5 !== 0 && icerik === 'bom') ||
    (sonraki % 5 !== 0 && icerik !== String(sonraki))
  ) {
    const msg = await message.channel.send(`<a:dikkat_arviis:1421402093876674641> ${message.member} **Sıra hatalı veya yanlış kullanım. Beklenen:** \`${dogruIcerik}\``);
    setTimeout(() => msg.delete().catch(() => {}), 5000);
    return;
  }

  const sent = await webhook.send({
    content: icerik,
    username: message.member.displayName,
    avatarURL: message.author.displayAvatarURL(),
    allowedMentions: { parse: [] }
  });

  if (icerik === 'bom') {
    const fetched = await message.channel.messages.fetch({ limit: 10 });
    const webhookMsg = fetched.find(m => m.author.id === webhook.id && m.content === 'bom');
    if (webhookMsg) {
      webhookMsg.react('<:bomb_arviis:1421401439632228383>').catch(() => {});
    }
  }

  oyunVerisi[message.guildId] = { sayi: sonraki };
  fs.writeFileSync(bomPath, JSON.stringify(oyunVerisi, null, 2));
});

//KELİME OYUNU
const kelimePath = path.join(__dirname, '../../Database/kelime.json');
const txtPath = path.join(__dirname, '../../Database/kelimeler.txt');

const tdkListesi = fs.readFileSync(txtPath, 'utf-8')
  .split('\n')
  .map(k => k.trim().toLowerCase())
  .filter(Boolean); 

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const dbPath = path.join(__dirname, '../../Database/oyunKanallari.json');
  if (!fs.existsSync(dbPath)) return;
  const kanalVerisi = JSON.parse(fs.readFileSync(dbPath, 'utf-8'))[message.guildId];
  if (!kanalVerisi || !kanalVerisi.kelime) return;
  if (message.channelId !== kanalVerisi.kelime) return;

  const kelime = message.content.toLowerCase().replace(/[^a-zçğıöşü]/gi, '');

  const webhooks = await message.channel.fetchWebhooks();
  let webhook = webhooks.find(w => w.name === 'Kelime Webhook');

  if (!webhook) {
    webhook = await message.channel.createWebhook({
      name: 'Kelime Webhook',
      avatar: client.user.displayAvatarURL(),
    });
  }

  await message.delete().catch(() => {});

  let veri = {};
  if (fs.existsSync(kelimePath)) {
    veri = JSON.parse(fs.readFileSync(kelimePath, 'utf-8'));
  }

  if (!veri[message.guildId]) {
    const baslangic = tdkListesi[Math.floor(Math.random() * tdkListesi.length)];
    veri[message.guildId] = {
      sonKelime: baslangic,
      kullanilanlar: [baslangic],
    };
    await message.channel.send(`<:tik_arviis:1421412906435739698> Kelime oyunu **başlatıldı.** \n\n<:info_arviis:1421409198385926295> İlk Kelime: \`${baslangic}\``);
    fs.writeFileSync(kelimePath, JSON.stringify(veri, null, 2));
    return;
  }

  const { sonKelime, kullanilanlar } = veri[message.guildId];
  const beklenenHarf = sonKelime.slice(-1);

  if (!kelime.startsWith(beklenenHarf)) {
    const msg = await message.channel.send(`<:carpi_arviis:1421401682348216340> ${message.member} kelimen \`${beklenenHarf}\` harfiyle **başlamalı.**`);
    return setTimeout(() => msg.delete().catch(() => {}), 5000);
  }

  if (kullanilanlar.includes(kelime)) {
    const msg = await message.channel.send(`<:carpi_arviis:1421401682348216340> ${message.member} \`${kelime}\` daha önce **kullanılmış.**`);
    return setTimeout(() => msg.delete().catch(() => {}), 5000);
  }

  if (!tdkListesi.includes(kelime)) {
    const msg = await message.channel.send(`<:carpi_arviis:1421401682348216340> ${message.member} \`${kelime}\` kelimesi TDK'da **yok.**`);
    return setTimeout(() => msg.delete().catch(() => {}), 5000);
  }

  const gönderilen = await webhook.send({
    content: `${kelime}`,
    username: message.member?.displayName || message.author.globalName || message.author.username,
    avatarURL: message.author.displayAvatarURL(),
    allowedMentions: { parse: [] }
  });

    if (gönderilen && gönderilen.react) {
      await gönderilen.react('<:tik_arviis:1421412906435739698>');
    }

  veri[message.guildId].sonKelime = kelime;
  veri[message.guildId].kullanilanlar.push(kelime);
  fs.writeFileSync(kelimePath, JSON.stringify(veri, null, 2));
});

//TUTTU-TUTMADI
const dbPath123 = path.join(__dirname, '../../Database/oyunKanallari.json');
const lastPlayers = new Map();

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  if (!fs.existsSync(dbPath123)) return;
  const db = JSON.parse(fs.readFileSync(dbPath123, 'utf-8'));
  const guildData = db[message.guild.id];
  if (!guildData || message.channel.id !== guildData.tuttu) return;

  const content = message.content.toLowerCase();
  if (!content.startsWith('tuttu') && !content.startsWith('tutmadı')) {
    const msg = await message.reply('<:carpi_arviis:1421401682348216340> Mesaj "Tuttu" ya da "Tutmadı" ile **başlamalı.**');
    setTimeout(() => msg.delete().catch(() => {}), 5000);
    return message.delete().catch(() => {});
  }

  const lastPlayer = lastPlayers.get(message.guild.id);
  if (lastPlayer === message.author.id) {
    const msg = await message.reply('<:carpi_arviis:1421401682348216340> Sıranı **bekle.**');
    setTimeout(() => msg.delete().catch(() => {}), 5000);
    return message.delete().catch(() => {});
  }

  lastPlayers.set(message.guild.id, message.author.id);

  const webhooks = await message.channel.fetchWebhooks();
  let webhook = webhooks.find(w => w.name === 'TuttuBot');
  if (!webhook) {
    webhook = await message.channel.createWebhook({
      name: 'TuttuBot',
      avatar: client.user.displayAvatarURL(),
    });
  }
  const gönderilen = await webhook.send({
    content: `${content}`,
    username: message.member?.displayName || message.author.globalName || message.author.username,
    avatarURL: message.author.displayAvatarURL(),
    allowedMentions: { parse: [] }
  });

    if (gönderilen && gönderilen.react) {
      await gönderilen.react('👇🏻');
    }

  await message.delete().catch(() => {});
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////