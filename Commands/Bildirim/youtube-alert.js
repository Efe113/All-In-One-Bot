const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const fs = require("fs");
const path = require("path");

const veriYolu = path.join(__dirname, "../../Database/youtubeAlert.json");

function okuVeri() {
  try {
    if (!fs.existsSync(veriYolu)) return {};
    return JSON.parse(fs.readFileSync(veriYolu, "utf8"));
  } catch (e) {
    console.error("Veri okunamadı:", e);
    return {};
  }
}

function yazVeri(data) {
  try {
    fs.writeFileSync(veriYolu, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error("Veri kaydedilemedi:", e);
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("youtube-alert")
    .setDescription("YouTube video duyuru sistemini ayarlar.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option.setName("aktiflik")
        .setDescription("Sistem aktif mi?")
        .setRequired(true)
        .addChoices(
          { name: "Evet", value: "yes" },
          { name: "Hayır", value: "no" }
        )
    )
    .addStringOption(option =>
      option.setName("webhook")
        .setDescription("Webhook URL'si")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("kanallar")
        .setDescription("Bildirim atılacak kanal ID'leri (virgül ile ayır)")
        .setRequired(true)
    )
    .addRoleOption(option =>
      option.setName("rol")
        .setDescription("Etiketlenecek rol")
        .setRequired(true)
    ),

  async execute(interaction) {
    const aktiflik = interaction.options.getString("aktiflik");
    const webhook = interaction.options.getString("webhook");
    const kanallarRaw = interaction.options.getString("kanallar");
    const rol = interaction.options.getRole("rol");

    const kanallar = kanallarRaw.split(",").map(id => id.trim());

    const data = {
      aktif: aktiflik === "yes",
      webhook,
      kanallar,
      rol: rol.id
    };

    yazVeri(data);

    return interaction.reply({
      content: `<:tik_arviis:1421412906435739698> YouTube duyuru sistemi **${aktiflik === "yes" ? "aktif edildi" : "devre dışı bırakıldı"}** ve ayarlandı. \n\n<:ampul_arviis:1421401217040515142> **Etiketlenecek Rol:** <@&${rol.id}>`,
      flags: 64
    });
  }
};
