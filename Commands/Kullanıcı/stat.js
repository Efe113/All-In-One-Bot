const { SlashCommandBuilder } = require('discord.js');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const db = require('../../Utils/jsonDB');

GlobalFonts.registerFromPath('./fonts/Poppins-Regular.ttf', 'Poppins');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stat')
    .setDescription('İstatistik kartını gösterir.'),

  async execute(interaction) {
    const user = interaction.user;
    const member = interaction.member;

    const mesaj1D = db.get(`msg_1d_${user.id}`) || 0;
    const mesaj7D = db.get(`msg_7d_${user.id}`) || 0;
    const mesajT  = db.get(`msg_total_${user.id}`) || 0;

    const ses1D = db.get(`voice_1d_${user.id}`) || 0;
    const ses7D = db.get(`voice_7d_${user.id}`) || 0;
    const sesT  = db.get(`voice_total_${user.id}`) || 0;

    const rawAll = db.all();
    const dbEntries = Array.isArray(rawAll)
      ? rawAll
      : Object.entries(rawAll).map(([ID, data]) => ({ ID, data }));
    const kanalMesajVerileri = dbEntries.filter(e =>
      e.ID.startsWith('channelMsgCount_') && e.ID.endsWith(user.id)
    );

    let aktifKanal = 'Yok';
if (kanalMesajVerileri.length > 0) {
  const enAktif = kanalMesajVerileri.sort((a, b) => b.data - a.data)[0];
  const kanalId = enAktif.ID.split('_')[1];
  const kanal = interaction.guild.channels.cache.get(kanalId);
  if (kanal) aktifKanal = sadeKanalisim(kanal.name);
}

    const kanalSesVerileri = dbEntries.filter(e =>
      e.ID.startsWith('channelVoiceTime_') && e.ID.endsWith(user.id)
    );

    let aktifSesKanal = 'Yok';
if (kanalSesVerileri.length > 0) {
  const enAktifSes = kanalSesVerileri.sort((a, b) => b.data - a.data)[0];
  const kanalId = enAktifSes.ID.split('_')[1];
  const kanal = interaction.guild.channels.cache.get(kanalId);
  if (kanal) aktifSesKanal = sadeKanalisim(kanal.name);
}

    const canvas = createCanvas(700, 300);
    const ctx = canvas.getContext('2d');

function sadeKanalisim(kanalAdi) {
  return kanalAdi
    .normalize("NFD")          
    .replace(/[\u0300-\u036f]/g, "") 
    .replace(/[^\x20-\x7E]/g, "")     
    .replace(/[^a-zA-Z0-9-_ ]/g, '');  
}

ctx.fillStyle = '#1e1f22';
ctx.fillRect(0, 0, canvas.width, canvas.height);

ctx.fillStyle = '#ffffff';
ctx.font = 'bold 18px Poppins';
ctx.textAlign = 'start';
ctx.fillText('Aktif Olduğun Kanallar', 20, 30);

//Mesaj Kanalı Kutusu
ctx.fillStyle = '#2f3136';
ctx.beginPath();
ctx.roundRect(20, 45, 300, 30, 10);
ctx.fill();

ctx.fillStyle = '#5865f2';
ctx.beginPath();
ctx.roundRect(20, 45, 220, 30, 10);
ctx.fill();

ctx.fillStyle = '#ffffff';
ctx.font = '13px Poppins';
ctx.fillText(`#${sadeKanalisim(aktifKanal)}`, 30, 65);
ctx.textAlign = 'right';
ctx.fillText(`${mesajT} Mesaj`, 310, 65);


//Ses Kanalı Kutusu
ctx.textAlign = 'start';
ctx.fillStyle = '#2f3136';
ctx.beginPath();
ctx.roundRect(20, 85, 300, 30, 10);
ctx.fill();

ctx.fillStyle = '#43b581';
ctx.beginPath();
ctx.roundRect(20, 85, 100, 30, 10); //Sabit oranlı bar
ctx.fill();

ctx.fillStyle = '#ffffff';
ctx.font = '13px Poppins';
ctx.fillText(`${sadeKanalisim(aktifSesKanal)}`, 30, 105);
ctx.textAlign = 'right';
ctx.fillText(`${sesT} Saniye`, 310, 105);
ctx.textAlign = 'start'; //Geri sıfırla

//Ses Aktifliği Kutusu
ctx.fillStyle = '#2f3136';
ctx.beginPath();
ctx.roundRect(20, 140, 160, 140, 15);
ctx.fill();

//Başlık
ctx.fillStyle = '#ffffff';
ctx.font = 'bold 14px Poppins';
ctx.textAlign = 'center';
ctx.fillText('Ses Aktifliği', 100, 160); //20 + (160 / 2) = 100

//Zaman: 1D
ctx.fillStyle = '#232428';
ctx.beginPath();
ctx.roundRect(30, 175, 40, 25, 8);
ctx.fill();
ctx.fillStyle = '#ffffff';
ctx.font = '11px Poppins';
ctx.fillText('1 Gün', 50, 192);

//Değer: 1D
ctx.fillStyle = '#1a1b1e';
ctx.beginPath();
ctx.roundRect(75, 175, 75, 25, 8);
ctx.fill();
ctx.fillStyle = '#ffffff';
ctx.font = '12px Poppins';
ctx.fillText(`${ses1D} sn`, 112, 192);

//Zaman: 7D
ctx.fillStyle = '#232428';
ctx.beginPath();
ctx.roundRect(30, 205, 40, 25, 8);
ctx.fill();
ctx.fillStyle = '#ffffff';
ctx.fillText('7 Gün', 50, 222);

//Değer: 7D
ctx.fillStyle = '#1a1b1e';
ctx.beginPath();
ctx.roundRect(75, 205, 75, 25, 8);
ctx.fill();
ctx.fillStyle = '#ffffff';
ctx.fillText(`${ses7D} sn`, 112, 222);

//Zaman: T
ctx.fillStyle = '#232428';
ctx.beginPath();
ctx.roundRect(30, 235, 40, 25, 8);
ctx.fill();
ctx.fillStyle = '#ffffff';
ctx.fillText('Toplam', 50, 252);

//Değer: T
ctx.fillStyle = '#1a1b1e';
ctx.beginPath();
ctx.roundRect(75, 235, 75, 25, 8);
ctx.fill();
ctx.fillStyle = '#ffffff';
ctx.fillText(`${sesT} sn`, 112, 252);


//Mesaj Aktifliği Kutusu
ctx.fillStyle = '#2f3136';
ctx.beginPath();
ctx.roundRect(200, 140, 160, 140, 15);
ctx.fill();

//Başlık Ortalanmış
ctx.fillStyle = '#ffffff';
ctx.font = 'bold 14px Poppins';
ctx.textAlign = 'center';
ctx.fillText('Mesaj Aktifliği', 280, 160); // 200 + (160 / 2) = 280

//Zaman: 1D
ctx.fillStyle = '#232428';
ctx.beginPath();
ctx.roundRect(210, 175, 40, 25, 8);
ctx.fill();
ctx.fillStyle = '#ffffff';
ctx.font = '11px Poppins';
ctx.fillText('1 Gün', 230, 192);

//Değer: 1D
ctx.fillStyle = '#1a1b1e';
ctx.beginPath();
ctx.roundRect(255, 175, 75, 25, 8);
ctx.fill();
ctx.fillStyle = '#ffffff';
ctx.font = '12px Poppins';
ctx.fillText(`${mesaj1D} Mesaj`, 292, 192);

//Zaman: 7D
ctx.fillStyle = '#232428';
ctx.beginPath();
ctx.roundRect(210, 205, 40, 25, 8);
ctx.fill();
ctx.fillStyle = '#ffffff';
ctx.fillText('7 Gün', 230, 222);

//Değer: 7D
ctx.fillStyle = '#1a1b1e';
ctx.beginPath();
ctx.roundRect(255, 205, 75, 25, 8);
ctx.fill();
ctx.fillStyle = '#ffffff';
ctx.fillText(`${mesaj7D} Mesaj`, 292, 222);

//Zaman: T
ctx.fillStyle = '#232428';
ctx.beginPath();
ctx.roundRect(210, 235, 40, 25, 8);
ctx.fill();
ctx.fillStyle = '#ffffff';
ctx.fillText('Toplam', 230, 252);

//Değer: T
ctx.fillStyle = '#1a1b1e';
ctx.beginPath();
ctx.roundRect(255, 235, 75, 25, 8);
ctx.fill();
ctx.fillStyle = '#ffffff';
ctx.fillText(`${mesajT} Mesaj`, 292, 252);

//Hizalama sonrası reset
ctx.textAlign = 'start';

//Genişletilmiş Ana Kutu (Avatar + Tarih Bilgileri)
ctx.fillStyle = '#2f3136';
ctx.beginPath();
ctx.roundRect(450, 30, 220, 260, 20); // Büyütülmüş yükseklik
ctx.fill();

//Profil Avatarı (Ortalanmış)
const avatar = await loadImage(user.displayAvatarURL({ extension: 'png', size: 128 }));
ctx.save();
ctx.beginPath();
ctx.arc(560, 90, 40, 0, Math.PI * 2, true); //Merkezde yukarıda
ctx.closePath();
ctx.clip();
ctx.drawImage(avatar, 520, 50, 80, 80);
ctx.restore();

//Oluşturma Tarihi Kutusu
ctx.fillStyle = '#232428';
ctx.beginPath();
ctx.roundRect(470, 150, 180, 40, 10); //Daha geniş ve hizalı
ctx.fill();

ctx.fillStyle = '#ffffff';
ctx.font = '12px Poppins';
ctx.textAlign = 'center'; //Ortalanmış 
ctx.fillText('Oluşturma Tarihi', 560, 167);
ctx.font = 'bold 13px Poppins';
ctx.fillText(user.createdAt.toLocaleDateString('tr-TR'), 560, 185);

//Katılma Tarihi Kutusu arviis.
ctx.fillStyle = '#232428';
ctx.beginPath();
ctx.roundRect(470, 200, 180, 40, 10);
ctx.fill();

ctx.fillStyle = '#ffffff';
ctx.font = '12px Poppins';
ctx.textAlign = 'center';
ctx.fillText('Katılma Tarihi', 560, 217);
ctx.font = 'bold 13px Poppins';
ctx.fillText(member.joinedAt.toLocaleDateString('tr-TR'), 560, 235);

ctx.textAlign = 'start';
     const buffer = canvas.toBuffer('image/png');
    await interaction.reply({ files: [{ attachment: buffer, name: 'istatistik.png' }] });
  }
};