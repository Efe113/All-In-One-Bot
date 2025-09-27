const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('depremler')
    .setDescription('Türkiye’deki güncel deprem istatistiklerini AFAD verileriyle gösterir.'),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const response = await fetch('https://deprem.afad.gov.tr/apiv2/event/filter?last=999');

      if (!response.ok) {
        console.error(`API Hatası: Sunucudan ${response.status} kodu alındı.`);
        return interaction.editReply('<a:dikkat_arviis:1421402093876674641> **AFAD deprem servisine şu an ulaşılamıyor. Lütfen daha sonra tekrar deneyin.**');
      }

      const responseText = await response.text();
      let earthquakes;
      try {
        earthquakes = JSON.parse(responseText);
      } catch (error) {
        console.error('JSON Ayrıştırma Hatası:', error);
        console.error('Alınan Hatalı Cevap:', responseText);
        return interaction.editReply('<a:dikkat_arviis:1421402093876674641> **Deprem verileri alınırken bir format hatası oluştu.**');
      }
      
      if (!earthquakes || !Array.isArray(earthquakes) || earthquakes.length === 0) {
        return interaction.editReply('<a:dikkat_arviis:1421402093876674641> **Gösterilecek güncel deprem verisi bulunamadı.**');
      }

      earthquakes.reverse();

      const lastFive = earthquakes.slice(0, 5)
        .map(eq => {
          const timestamp = Math.floor(new Date(eq.date).getTime() / 1000);
          const location = eq.district ? `${eq.district.toUpperCase('tr-TR')} (${eq.province.toUpperCase('tr-TR')})` : eq.province.toUpperCase('tr-TR');
          return `<t:${timestamp}:R> [**${location}**](https://deprem.afad.gov.tr/last-earthquakes) <:earthquake_arviis:1421408624567386233> ${eq.magnitude}`;
        })
        .join('\n');

      const cityCounts = {};
      earthquakes.forEach(eq => {
        const city = eq.province || 'Bilinmiyor';
        cityCounts[city] = (cityCounts[city] || 0) + 1;
      });

      const topCities = Object.entries(cityCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([city, count]) => `- ${city} (**${count}**)`)
        .join('\n');

       const regionMap = {
        'Akdeniz': ['Antalya', 'Adana', 'Mersin', 'Hatay', 'Osmaniye', 'Kahramanmaraş', 'Isparta', 'Burdur'],
        'Ege': ['İzmir', 'Aydın', 'Muğla', 'Manisa', 'Denizli', 'Afyonkarahisar', 'Kütahya', 'Uşak'],
        'Karadeniz': ['Samsun', 'Trabzon', 'Ordu', 'Giresun', 'Rize', 'Artvin', 'Sinop', 'Zonguldak', 'Bartın', 'Karabük', 'Düzce', 'Bolu', 'Kastamonu', 'Çorum', 'Amasya', 'Tokat', 'Gümüşhane', 'Bayburt'],
        'Marmara': ['İstanbul', 'Bursa', 'Kocaeli', 'Sakarya', 'Tekirdağ', 'Edirne', 'Kırklareli', 'Balıkesir', 'Çanakkale', 'Yalova', 'Bilecik'],
        'Doğu Anadolu': ['Elazığ', 'Malatya', 'Erzurum', 'Van', 'Bingöl', 'Ağrı', 'Ardahan', 'Bitlis', 'Erzincan', 'Hakkâri', 'Iğdır', 'Kars', 'Muş', 'Siirt', 'Tunceli', 'Şırnak'],
        'İç Anadolu': ['Ankara', 'Konya', 'Kayseri', 'Eskişehir', 'Sivas', 'Aksaray', 'Çankırı', 'Karaman', 'Kırıkkale', 'Kırşehir', 'Nevşehir', 'Niğde', 'Yozgat'],
        'Güneydoğu Anadolu': ['Diyarbakır', 'Şanlıurfa', 'Gaziantep', 'Mardin', 'Batman', 'Adıyaman', 'Kilis']
      };

      const regionCounts = {};
      for (const eq of earthquakes) {
          const city = eq.province;
          if (city) {
              let matched = false;
              for (const [region, cities] of Object.entries(regionMap)) {
                  if (cities.includes(city)) {
                      regionCounts[region] = (regionCounts[region] || 0) + 1;
                      matched = true;
                      break;
                  }
              }
               if (!matched) {
                  regionCounts['Diğer/Bilinmiyor'] = (regionCounts['Diğer/Bilinmiyor'] || 0) + 1;
              }
          } else {
              regionCounts['Diğer/Bilinmiyor'] = (regionCounts['Diğer/Bilinmiyor'] || 0) + 1;
          }
      }

      const topRegions = Object.entries(regionCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([region, count]) => `- ${region} (**${count}**)`)
        .join('\n');

      const now = new Date();
      const periods = [
        { label: 'Son 24 Saat', ms: 24 * 60 * 60 * 1000 },
        { label: 'Son 7 Gün', ms: 7 * 24 * 60 * 60 * 1000 },
        { label: 'Toplam Veri', ms: Infinity }
      ];

      const stats = periods.map(p => {
        const count = p.ms === Infinity
          ? earthquakes.length
          : earthquakes.filter(eq => (now - new Date(eq.date)) <= p.ms).length;
        return `- ${p.label}: **${count}**`;
      }).join('\n');

      const description = `
## <a:turkbayragi_arviis:1421412994524643441> Türkiye'deki Son 5 Deprem
${lastFive || '<:carpi_arviis:1421401682348216340> Veri **yok.**'}

## <:sinir_arviis:1421412658543984744> En Çok Deprem Olan Şehirler
${topCities || '<:carpi_arviis:1421401682348216340> Veri **yok.**'}

## <:sinir_arviis:1421412658543984744> En Çok Deprem Olan Bölgeler
${topRegions || '<:carpi_arviis:1421401682348216340> Veri **yok.**'}

## <:istatistik_arviis:1421409224856047617> Deprem İstatistikleri
${stats || '<:carpi_arviis:1421401682348216340> Veri **yok.**'}
      `;

      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle("Türkiye Güncel Deprem Verileri (AFAD)")
        .setDescription(description.trim())
        .setThumbnail("https://media.discordapp.net/attachments/1069639498637525043/1375838158603943948/2270-flagmap-tr.png")
        .setFooter({ text: 'Veriler AFAD Deprem Veri Merkezi\'nden alınmaktadır.' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error("Deprem komutunda bir hata oluştu:", error);

      // Bu özel ağ hatasını yakala ve kullanıcıya daha açıklayıcı bir mesaj ver
      if (error.code === 'ECONNRESET') {
        return interaction.editReply('<a:dikkat_arviis:1421402093876674641> **AFAD sunucularıyla bağlantı kurulamadı. Sunucu yoğun olabilir, lütfen birkaç dakika sonra tekrar deneyin.**');
      }

      // Diğer tüm hatalar için genel bir mesaj göster
      await interaction.editReply('<a:dikkat_arviis:1421402093876674641> **Deprem verileri alınırken beklenmedik bir hata oluştu.**');
    }
  },
};