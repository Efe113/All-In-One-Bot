const { EmbedBuilder } = require('discord.js');
const aktifDB = require('../Utils/aktifDB');

function generateEmbed(data) {
  const entries = aktifDB.all();

  const puanlar = entries
    .filter(d => d.key.startsWith('puan_') && typeof d.value === 'number')
    .map(d => ({ id: d.key.replace('puan_', ''), puan: d.value }))
    .sort((a, b) => b.puan - a.puan)
    .slice(0, 10); 

  const haftaninUyesi = data.aktifUye
    ? `<@${data.aktifUye}>`
    : '<:carpi_arviis:1046067681515814912> Seçilmemiş.';

  const description = puanlar.length === 0
    ? '<:carpi_arviis:1046067681515814912> Veri **yok**.'
    : `# <:cute_active_arviis:1374020692944879687> Aktiflik Sıralaması\n` +
      puanlar.map((x, i) => `**${i + 1}.** <@${x.id}> \n- ${x.puan} mesaj`).join('\n\n') +
      `\n\n# <:new_member_arviis:1374022146090598470> Bu Haftanın Aktif Üyesi\n- ${haftaninUyesi}` +
      `\n\n# <a:attention_bear_arviis:1374022733712719932> NOT\n- Sunucu içerisindeki tüm yazı kanalları sayılır. \n\n- Veriler **otomatik** olarak güncellenir.\n  - Veriler __Pazar'ı Pazartesi'ye bağlayan gece__ **sıfırlanır.**`;

  return new EmbedBuilder()
    .setColor(0x00ff44)
    .setDescription(description);
}

module.exports = { generateEmbed };
