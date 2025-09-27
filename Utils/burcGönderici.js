const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const { EmbedBuilder, ChannelType } = require('discord.js');
const axios = require('axios');

const burclar = ['koc', 'boga', 'ikizler', 'yengec', 'aslan', 'basak', 'terazi', 'akrep', 'yay', 'oglak', 'kova', 'balik'];

const fixBurcIsmi = (burc) => {
  const map = {
    'Koc': '<:aries_arviis:1375599100166144040> Koç',
    'Boga': '<:taurus_arviis:1375598839406395472> Boğa',
    'Ikizler': '<:gemini_arviis:1375598815419039825> İkizler',
    'Yengec': '<:cancer_arviis:1375598809580699829> Yengeç',
    'Aslan': '<:leo_arviis:1375602273199325375> Aslan',
    'Basak': '<:virgo_arviis:1375598842644271174> Başak',
    'Terazi': '<:libra_arviis:1375598821656104960> Terazi',
    'Akrep': '<:scorpio_arviis:1375602287518552075> Akrep',
    'Yay': '<:sagittarius_arviis:1375602269034250372> Yay',
    'Oglak': '<:capricorn_arviis:1375598812151681024> Oğlak',
    'Kova': '<:aquarius_arviis:1375598804631421018> Kova',
    'Balik': '<:pisces_arviis:1375598827335057468> Balık'
  };
  return map[burc] || burc;
};

const burcGorselleri = {
  koc: 'https://stylecaster.com/wp-content/uploads/2025/01/010825_Zodiac-Banners_3_vARIES.jpg?w=1280',
  boga: 'https://stylecaster.com/wp-content/uploads/2025/01/010825_Zodiac-Banners_3_TAURUS.jpg?w=1280',
  ikizler: 'https://stylecaster.com/wp-content/uploads/2025/01/010825_Zodiac-Banners_3_GEMINI.jpg?w=1280',
  yengec: 'https://stylecaster.com/wp-content/uploads/2025/01/010825_Zodiac-Banners_3_CANCER.jpg?w=1280',
  aslan: 'https://stylecaster.com/wp-content/uploads/2025/01/010825_Zodiac-Banners_3_LEO.jpg?w=1280',
  basak: 'https://stylecaster.com/wp-content/uploads/2025/01/010825_Zodiac-Banners_3_VIRGO.jpg?w=1280',
  terazi: 'https://stylecaster.com/wp-content/uploads/2025/01/010825_Zodiac-Banners_3_LIBRA.jpg?w=1280',
  akrep: 'https://stylecaster.com/wp-content/uploads/2025/01/010825_Zodiac-Banners_3_SCORPIO.jpg?w=1280',
  yay: 'https://stylecaster.com/wp-content/uploads/2025/01/010825_Zodiac-Banners_3_SAGITTARIUS.jpg?w=1280',
  oglak: 'https://stylecaster.com/wp-content/uploads/2025/01/010825_Zodiac-Banners_3_CAPRICORN.jpg?w=1280',
  kova: 'https://stylecaster.com/wp-content/uploads/2025/01/010825_Zodiac-Banners_3_AQUARIUS.jpg?w=1280',
  balik: 'https://stylecaster.com/wp-content/uploads/2025/01/010825_Zodiac-Banners_3_PISCES.jpg?w=1280'
};

const burcRenkleri = {
  koc: 0xf43236,       
  boga: 0x004d0a,      
  ikizler: 0xfd8618,   
  yengec: 0x08bbdb,    
  aslan: 0xffcf02,   
  basak: 0xfeb4a0,   
  terazi: 0xfa2e7c,    
  akrep: 0xc2162c,     
  yay: 0x6726fd,       
  oglak: 0xb6aac3,    
  kova: 0xcbf4e7,      
  balik: 0xa757af     
};


module.exports = (client) => {
  const ayarDosyasi = path.join(__dirname, '../Database/burcAyar.json');


  cron.schedule('0 12 * * *', async () => {
    if (!fs.existsSync(ayarDosyasi)) return;
    const ayarlar = JSON.parse(fs.readFileSync(ayarDosyasi, 'utf8'));

    for (const [guildId, ayar] of Object.entries(ayarlar)) {

      const guild = client.guilds.cache.get(guildId);
      if (!guild) continue;

      const kanal = guild.channels.cache.get(ayar.kanal);
      if (!kanal || (kanal.type !== ChannelType.GuildText && kanal.type !== ChannelType.GuildAnnouncement)) continue;

      for (const burc of burclar) {
        try {
          const response = await axios.get(`https://burc-yorumlari.vercel.app/get/${burc}`);
          const veri = response.data?.[0];

          if (!veri || !veri.GunlukYorum) {
            console.warn(`${burc} Burcu için veri yok.`);
            continue;
          }

          const temizYorum = veri.GunlukYorum.replace(
  /^Uzman Astrolog\s+Aygül Aydın(?:'la| ile)?\s+(?:günlük\s+)?burç yorumları[.:;–\-—\s]*/i,
  ''
).trim();

          const embed = new EmbedBuilder()
            .setDescription(`# ${fixBurcIsmi(veri.Burc)} Burcu Yorumu \n${temizYorum} \n ឵ `)
            .addFields(
              { name: '<:aura_arviis:1375588004818583733> Mottosu', value: `- ${veri.Mottosu}` || '-', inline: false },
              { name: '<:motto_arviis:1375587541511704607> Gezegeni', value: `- ${veri.Gezegeni}` || '-', inline: true },
              { name: '<:element_arviis:1375588006991233246> Elementi', value: `- ${veri.Elementi}` || '-', inline: true }
            )
            .setImage(burcGorselleri[burc])
            .setColor(burcRenkleri[burc] || 0xff9500);

          const rolId = ayar.roller?.[burc];
          const etiket = rolId ? `<@&${rolId}>\n` : '';

          await kanal.send({
            content: etiket,
            embeds: [embed]
          });

        } catch (err) {
          console.error(`${burc} Burcu için veri alınamadı:`, err);
        }
      }
    }
  }, {
    timezone: "Europe/Istanbul"
  });
};