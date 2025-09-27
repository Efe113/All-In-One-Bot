const fs = require('fs');
const path = require('path');
const Parser = require('rss-parser');
const axios = require('axios');
const cheerio = require('cheerio');
const parser = new Parser();

const dataPath = path.join(__dirname, '../Database/haberSistemi.json');

async function getImageFromHaber(haber) {
  let image = haber.enclosure?.url;
  if (!image && haber['media:content']?.url) image = haber['media:content'].url;

  if (!image && haber.content) {
    const match = haber.content.match(/<img[^>]+src=["']([^"']+)["']/);
    if (match) image = match[1];
  }

  if (!image && haber.link) {
    try {
      const response = await axios.get(haber.link);
      const $ = cheerio.load(response.data);
      const ogImage = $('meta[property="og:image"]').attr('content');
      if (ogImage) image = ogImage;
    } catch {}
  }

  return image;
}

module.exports = async (client) => {
  setInterval(async () => {
    if (!fs.existsSync(dataPath)) return;
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    for (const guildId of Object.keys(data)) {
      const guild = client.guilds.cache.get(guildId);
      if (!guild) continue;

      const ayar = data[guild.id];
      const kanal = await guild.channels.fetch(ayar.kanal).catch(() => null);
      if (!kanal) continue;

      if (kanal.type !== 0 && kanal.type !== 5) continue; 

      const rolTag = ayar.rol ? `<@&${ayar.rol}>` : '';

      let feed;
      try {
        feed = await parser.parseURL(ayar.url);
      } catch (err) {
        console.log(`[${guild.name}] Haber verisi alınamadı:`, err.message);
        continue;
      }

      const yeniHaberler = feed.items.filter(item => !ayar.sonHaberler?.includes(item.guid || item.link));
      if (!yeniHaberler.length) continue;

      for (const haber of yeniHaberler.slice(0, 1)) {
        const description = haber.contentSnippet || haber.content || 'Detay yok';
        const uzunMu = description.length > 500;
        const trimmed = uzunMu ? description.slice(0, 500) + '...' : description;

        const image = await getImageFromHaber(haber);

        const embed = {
          color: 0x575757,
          title: haber.title,
          description: `${trimmed} \n\n[**__\`[𝙷𝙰𝙱𝙴𝚁𝙸̇𝙽 𝚃𝙰𝙼𝙰𝙼𝙸𝙽𝙸 𝙾𝙺𝚄]\`__**](${haber.link})`,
          image: image ? { url: image } : undefined,
        };

        const msg = await kanal.send({ content: rolTag, embeds: [embed] }).catch(() => null);
        if (!msg) continue;

        if (kanal.threads && typeof kanal.threads.create === "function") {
          await kanal.threads.create({
            name: haber.title.slice(0, 80),
            startMessage: msg.id,
            autoArchiveDuration: 60
          }).catch(() => null);
        }

        ayar.sonHaberler = ayar.sonHaberler || [];
        ayar.sonHaberler.push(haber.guid || haber.link);
      }

      ayar.sonHaberler = ayar.sonHaberler.slice(-20);
    }

    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  }, 3600000);
};