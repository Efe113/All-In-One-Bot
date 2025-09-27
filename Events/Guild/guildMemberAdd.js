const { ButtonBuilder, ActionRowBuilder, ButtonStyle, AttachmentBuilder } = require("discord.js");
const path = require('path');
const canvafy = require('canvafy');
const fs = require("fs");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//GİRİŞ SİSTEMİ
function loadDB() {
  const dbPath = path.join(__dirname, "../../Database/girisCikis.json");
  if (!fs.existsSync(dbPath)) return {};
  return JSON.parse(fs.readFileSync(dbPath, "utf-8"));
}

client.on('guildMemberAdd', async member => {
  const data = loadDB();
  const guildData = data[member.guild.id];
  if (!guildData || !guildData.giris) return;

  const giris = guildData.giris;
  const kanal = member.guild.channels.cache.get(giris.kanal);
  if (!kanal) return;

  const mesajIcerik = giris.mesaj.replace('{user}', `<@${member.id}>`);

  const buton = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`selamver_${member.id}`)
      .setLabel('Selam Ver')
      .setStyle(ButtonStyle.Success)
      .setEmoji('<a:elsallama_arviis:1421408797787684975>')
  );

  if (giris.resimli === 'evet' && giris.gorsel) {
    try {
      const backgroundPath = path.join(__dirname, '../../assets/Giriş-Çıkış', giris.gorsel);

      const security = await new canvafy.Security()
        .setAvatar(member.user.displayAvatarURL({ extension: "png", forceStatic: true }))
        .setBackground("image", backgroundPath)
        .setCreatedTimestamp(member.user.createdTimestamp)
        .setSuspectTimestamp(604800000)
        .setBorder('#f0f0f0')
        .setLocale("tr")
        .setAvatarBorder('#f0f0f0')
        .setOverlayOpacity(0.9)
        .build();

      const attachment = new AttachmentBuilder(security, { name: 'hosgeldin.png' });

      kanal.send({
        content: `${mesajIcerik} <:girisok_arviis:1421408917816082515> ${member} **(** ${member.user.username} **)**`,
        files: [attachment],
        components: [buton]
      });

    } catch (err) {
      console.error('Görsel oluşturulurken hata oluştu:', err);
      kanal.send({
        content: mesajIcerik,
        components: [buton]
      });
    }
  } else {
    kanal.send({
      content: mesajIcerik,
      components: [buton]
    });
  }
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//ÖZELDEN HOŞ GELDİN MESAJI
client.on("guildMemberAdd", async (member) => {
  const gifPath = path.join(__dirname, "../../assets/Giriş-Çıkış/hosgeldin.gif");

  try {
    await member.send({
      content: "<a:pikachuselam_arviis:1421412118091272222> **Selam!** Aramıza hoş geldin. \n\n<a:4dkalp_arviis:1421401152624398396> Keyifli vakit geçirmen dileğiyle...",
      files: [{
        attachment: gifPath,
        name: "hosgeldin.gif"
      }]
    });
  } catch (err) {
    console.warn(`${member.user.tag} kişisine DM gönderilemedi:`, err.message);
  }
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////