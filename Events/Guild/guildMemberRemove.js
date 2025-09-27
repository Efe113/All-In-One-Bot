const { } = require("discord.js");
const fs = require("fs");
const path = require("path");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//ÇIKIŞ SİSTEMİ
module.exports = {
  name: "guildMemberRemove",
  async execute(member) {
    const dbPath = path.join(__dirname, "../../Database/girisCikis.json");

    if (!fs.existsSync(dbPath)) return;
    const data = JSON.parse(fs.readFileSync(dbPath, "utf-8"));

    const guildData = data[member.guild.id];
    if (!guildData || !guildData.cikis) return;

    const kanalId = guildData.cikis.kanal;
    const kanal = member.guild.channels.cache.get(kanalId);
    if (!kanal) return;

    kanal.send(`<:cikisok_arviis:1421401871104610325> ${member} **(** ${member.user.username} **)** sunucudan **ayrıldı.**`);
  }
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////