const { SlashCommandBuilder, EmbedBuilder, ButtonStyle, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const dns = require('dns').promises;
const fs = require('fs');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const limitDosyasi = path.join(__dirname, '../../Database/domainSorgulaSinir.json');
const GUNLUK_LIMIT = 5;

function loadLimitData() {
  if (!fs.existsSync(limitDosyasi)) {
    fs.writeFileSync(limitDosyasi, JSON.stringify({}));
  }
  return JSON.parse(fs.readFileSync(limitDosyasi));
}

function saveLimitData(data) {
  fs.writeFileSync(limitDosyasi, JSON.stringify(data, null, 2));
}

function sanitize(str, fallback = '<:carpi_arviis:1046067681515814912> **Yok.**') {
  if (!str || (Array.isArray(str) && str.length === 0)) return `- ${fallback}`;
  if (typeof str === 'string') return str;
  if (Array.isArray(str)) return str.join('\n - ');
  return String(str);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('domain-sorgula')
    .setDescription('Domain hakkında detaylı bilgi verir.')
    .addStringOption(option =>
      option.setName('domain')
        .setDescription('Sorgulamak istediğin domaini gir. (alkan.web.tr)')
        .setRequired(true)
    ),

  async execute(interaction) {
    const domain = interaction.options.getString('domain').toLowerCase();
    const userId = interaction.user.id;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (!/^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/.test(domain)) {
      return interaction.reply({
        content: '<a:dikkat_arviis:1421402093876674641> **Geçerli bir domain gir.** **(** `alkan.web.tr` **)**',
        flags: 64
      });
    }

    let limitData = loadLimitData();
    if (!limitData[userId] || limitData[userId].date !== todayStr) {
      limitData[userId] = { date: todayStr, count: 0 };
    }

    if (limitData[userId].count >= GUNLUK_LIMIT) {
      return interaction.reply({
        content: `<a:dikkat_arviis:1421402093876674641> **Günlük domain sorgulama sınırına ulaştın.** \n<:sadesagok_arviis:1421412348350038058> __Her gün saat 00:00'da sıfırlanır.__`,
        flags: 64
      });
    }

    await interaction.deferReply();

    limitData[userId].count += 1;
    saveLimitData(limitData);
    const kalanSorgu = GUNLUK_LIMIT - limitData[userId].count;

    let ip = null, cname = [], aRecords = [], aaaaRecords = [], mxRecords = [], txtRecords = [], nsRecords = [];
    let ipDetails = {}, whoisData = {};

    
    const debug = false; 

try { aRecords = await dns.resolve4(domain); }
catch (err) { if (debug) console.error('A:', err.code || err.message); }

try { aaaaRecords = await dns.resolve6(domain); }
catch (err) { if (debug) console.error('AAAA:', err.code || err.message); }

try { mxRecords = await dns.resolveMx(domain); }
catch (err) { if (debug) console.error('MX:', err.code || err.message); }

try { txtRecords = await dns.resolveTxt(domain); }
catch (err) { if (debug) console.error('TXT:', err.code || err.message); }

try { nsRecords = await dns.resolveNs(domain); }
catch (err) { if (debug) console.error('NS:', err.code || err.message); }

try {
  ip = (await dns.lookup(domain)).address;
} catch (err) {
  if (debug) console.error('IP:', err.code || err.message);
}

try {
  cname = await dns.resolveCname(domain);
} catch (err) {
  if (debug) console.error('CNAME:', err.code || err.message);
}

    try {
      const res = await fetch(`https://ipwho.is/${ip}`);
      ipDetails = await res.json();
    } catch (err) { console.error('IPWhois:', err); }

    try {
      const res = await fetch(`https://api.api-ninjas.com/v1/whois?domain=${domain}`, {
        headers: { 'X-Api-Key': 'LfsZE+pTFOjIPzlemwZUMA==h6aKXYlXzZtcwzgi' }
      });
      whoisData = await res.json();
    } catch (err) { console.error('WHOIS:', err); }

    const screenshotURL = `https://api.screenshotmachine.com/?key=a5c7df&url=https://${domain}&dimension=1024xfull`;

    const embed = new EmbedBuilder()
      .setColor(0x00B2FF)
      .setDescription(`# <:uyari_arviis:1421413143325839471> YASAL UYARI \n- __**Bu komut eğlence amaçlı yapılmıştır.**__ Kullanımı tamamen sana ait. Başına gelen/gelebilecek şeylerden __**ben sorumlu değilim, sorumluluk kabul etmiyorum**__ bilgin olsun. \n  - Sonradan 'Abi ben bilmiyordum, abi şöyle, abi böyle' deme, __**KOCAMAN**__ yazılarla bilgilendiriyorum. __**Okumaman senin sorunun.**__ \n ឵ `)
      .addFields(
        { name: 'IP', value: sanitize(ip), inline: true },
        { name: 'IPv4 (A)', value: sanitize(aRecords), inline: true },
        { name: 'IPv6 (AAAA)', value: sanitize(aaaaRecords), inline: true },
      )
      .addFields(
  {
    name: 'NS Kayıtları',
    value: sanitize(nsRecords.join('\n - ').slice(0, 1024)),
    inline: true
  }
)
    .addFields(
        { name: 'Ülke', value: sanitize(ipDetails.country), inline: true },
        { name: 'Şehir', value: sanitize(ipDetails.city), inline: true },
        { name: 'WHOIS Bitiş', value: sanitize(whoisData.expiration_date), inline: true },
    )
    .addFields(
        { name: 'WHOIS Oluşturulma', value: sanitize(whoisData.creation_date), inline: true },
        { name: 'WHOIS Güncelleme', value: sanitize(whoisData.updated_date), inline: true },
        { name: 'İSS', value: sanitize(ipDetails.connection?.isp), inline: true },
    )
    .addFields(
        { name: 'Kayıt Firması', value: sanitize(whoisData.registrar), inline: true },
    )
    .addFields(
  { name: 'CNAME', value: sanitize(cname), inline: true },
  {
    name: 'TXT Kayıtları',
    value: txtRecords.length
      ? sanitize(
          txtRecords
            .map(entry =>
              Array.isArray(entry)
                ? entry.map(part => (typeof part === 'string' ? part : String(part))).join(' ')
                : String(entry)
            )
            .join('\n - ')
            .slice(0, 1020) 
        )
      : sanitize(null),
    inline: true
  },
)
.addFields(
        {
          name: 'MX Kayıtları',
          value: mxRecords.length
            ? mxRecords.map(mx =>
                `${sanitize(mx.exchange)} \n **(** P: ${sanitize(mx.priority)} **)**`
              ).join('\n - ')
            : sanitize(null),
          inline: true
        }
    )
      .setImage(screenshotURL);

    const kalanSorguButonu = new ButtonBuilder()
      .setCustomId('kalan_sorgu')
      .setLabel(`${kalanSorgu} / ${GUNLUK_LIMIT}`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true);

    const row = new ActionRowBuilder().addComponents(kalanSorguButonu);

    await interaction.editReply({ embeds: [embed], components: [row] });
  }
};