const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

const afkPath = path.join(__dirname, "../../Database/afk.json");

function readAfkDB() {
  return JSON.parse(fs.readFileSync(afkPath, "utf-8"));
}

function writeAfkDB(data) {
  fs.writeFileSync(afkPath, JSON.stringify(data, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("afk")
    .setDescription("AFK moduna geçmeni sağlar.")
    .addStringOption(option =>
      option.setName("sebep").setDescription("AFK sebebini yaz").setRequired(true)
    ),

  async execute(interaction) {
    const sebep = interaction.options.getString("sebep");
    const userId = interaction.user.id;
    const db = readAfkDB();

    if (db[userId]) {
      delete db[userId];
      writeAfkDB(db);
      const member = interaction.guild.members.cache.get(userId);
      const nickname = member.globalName ? member.nickname.replace("[AFK] ", "") : member.user.globalName;
      member.setNickname(nickname);
    } else {
      db[userId] = {
        sebep,
        zaman: Date.now()
      };
      writeAfkDB(db);
      const member = interaction.guild.members.cache.get(userId);
      member.setNickname(`[AFK] ${member.nickname || member.user.username}`);
      interaction.reply(`**AFK** moduna geçildi: \`${sebep}\``);
    }
  }
};
