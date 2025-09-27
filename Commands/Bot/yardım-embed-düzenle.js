const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const fs = require("fs");
const path = require("path");

const veriYolu = path.join(__dirname, "../../Database/yardımEmbed.json");

function veriYaz(key, value) {
  let veri = {};
  if (fs.existsSync(veriYolu)) {
    try {
      veri = JSON.parse(fs.readFileSync(veriYolu, "utf8"));
    } catch {
      veri = {};
    }
  }

  const [anahtar, altAnahtar] = key.split(".");
  if (!veri[anahtar]) veri[anahtar] = {};
  veri[anahtar][altAnahtar] = value;

  fs.writeFileSync(veriYolu, JSON.stringify(veri, null, 2), "utf8");
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("yardım-embed-düzenle")
    .setDescription("Yardım menüsü embed ayarlarını günceller.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option.setName("yardım-renk")
        .setDescription("Yardım embed rengi (HEX kodu).")
        .setRequired(true))
    .addStringOption(option =>
      option.setName("yardım-resim")
        .setDescription("Yardım embed resmi (URL).")
        .setRequired(true))
    .addStringOption(option =>
      option.setName("komut-renk")
        .setDescription("Komut embed rengi (HEX kodu).")
        .setRequired(true))
    .addStringOption(option =>
      option.setName("komut-resim")
        .setDescription("Komut embed resmi (URL).")
        .setRequired(true)),

  async execute(interaction) {
    const yardımRenk = interaction.options.getString("yardım-renk");
    const yardımResim = interaction.options.getString("yardım-resim");
    const komutRenk = interaction.options.getString("komut-renk");
    const komutResim = interaction.options.getString("komut-resim");

    const sahipID = "640056735700221953";
    if (interaction.user.id !== sahipID) {
      return interaction.reply({
        content: "<a:dikkat_arviis:1421402093876674641> **Bu komutu sadece <@640056735700221953> kullanabilir.**",
        flags: 64
      });
    }

    veriYaz("yardım.renk", yardımRenk);
    veriYaz("yardım.resim", yardımResim);
    veriYaz("yardım.komutrenk", komutRenk);
    veriYaz("yardım.komutresim", komutResim);

    await interaction.reply({
      content: `<:tik_arviis:1046067679884234863> Embed ayarları **güncellendi.**`,
      flags: 64
    });
  },
};
