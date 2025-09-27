const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { exec } = require('child_process');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName("restart")
    .setDescription("Botu yeniden başlatır.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const sahipID = "640056735700221953";
    if (interaction.user.id !== sahipID) {
      return interaction.reply({
        content: "<a:dikkat_arviis:1421402093876674641> **Bu komutu sadece <@640056735700221953> kullanabilir.**",
        flags: 64
      });
    }

    try {
      await interaction.reply({
        content: "<a:yukleniyor_arviis:1058007845364322354> **Yeniden başlatılıyor...**",
        flags: 64
      });

      if (process.env.pm_id || process.env.PM2_HOME) {
        exec(`pm2 restart all`, (err, stdout, stderr) => {
          if (err) {
            console.error(`[RESET - HATA]: ${err}`);
            return interaction.followUp({
              content: "<a:dikkat_arviis:997074866371039322> **PM2 üzerinden yeniden başlatılırken hata oluştu.**",
              flags: 64
            });
          }
          console.log(stdout);
          console.error(stderr);
          interaction.followUp({
            content: "<a:tik_arviis:1046067679884234863> **Bot PM2 üzerinden başarıyla yeniden başlatıldı.**",
            flags: 64
          });
        });
      } else {
    interaction.followUp({
      content: "<a:dikkat_arviis:997074866371039322> **Bot PM2 üzerinden açılmamış, yeniden başlatılıyor...**",
      flags: 64
    });

    const batPath = path.join(__dirname, "../../başlat.bat");

    exec(`taskkill /F /FI "WINDOWTITLE eq başlat.bat*"`, (err) => {
      if (err) {
        console.warn("[BAT KAPATMA HATASI]:", err);
      }

      exec(`start "" "${batPath}" && exit`, (err, stdout, stderr) => {
        if (err) {
          console.error(`[BAT RESTART - HATA]: ${err}`);
        }
        console.log(stdout);
        console.error(stderr);

        process.exit(0);
      });
    });
}
    } catch (error) {
      console.error("[RESET - HATA]:", error);
      return interaction.reply({
        content: "<a:dikkat_arviis:997074866371039322> **Yeniden başlatılırken bir hata oluştu.**",
        flags: 64
      });
    }
  }
};