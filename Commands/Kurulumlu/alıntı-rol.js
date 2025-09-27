const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require("discord.js");
const fs = require("fs");
const path = require("path");

const DATA_PATH33 = path.join(__dirname, "../../Database/alintiRol.json");

function loadData() {
  if (!fs.existsSync(DATA_PATH33)) return {};
  return JSON.parse(fs.readFileSync(DATA_PATH33, "utf8"));
}

function saveData(data) {
  fs.writeFileSync(DATA_PATH33, JSON.stringify(data, null, 2), "utf8");
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("alıntı-rol")
    .setDescription("Alıntı rol sistemini ayarlar.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName("ayarla")
        .setDescription("Kanalda mesaj yazıldığında rol etiketlemesini ayarlar.")
        .addChannelOption(option =>
          option.setName("kanal")
            .setDescription("Kanal seç.")
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            .setRequired(true))
        .addRoleOption(option =>
          option.setName("rol")
            .setDescription("Rol seç.")
            .setRequired(true))
        .addStringOption(option =>
          option.setName("botlar")
            .setDescription("Botlar dahil edilsin mi?")
            .setRequired(true)
            .addChoices(
              { name: "Evet", value: "evet" },
              { name: "Hayır", value: "hayir" }
            )))

    .addSubcommand(subcommand =>
      subcommand
        .setName("sıfırla")
        .setDescription("Kanaldaki alıntı rol sistemini sıfırlar.")
        .addChannelOption(option =>
          option.setName("kanal")
            .setDescription("Kanal seç.")
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            .setRequired(true))
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const data = loadData();
    const guildId = interaction.guild.id;

    if (subcommand === "ayarla") {
      const kanal = interaction.options.getChannel("kanal");
      const rol = interaction.options.getRole("rol");
      const botlar = interaction.options.getString("botlar") === "evet";

      if (!data[guildId]) data[guildId] = {};
      data[guildId][kanal.id] = {
        kanal: kanal.id,
        rol: rol.id,
        includeBots: botlar
      };

      saveData(data);

      return interaction.reply({
        content: `<:tik_arviis:1421412906435739698> Alıntı rol sistemi **ayarlandı.** \n\n<:hashtag_arviis:1421409016701128794> Kanal: <#${kanal.id}> \n<:ampul_arviis:1421401217040515142> Rol: <@&${rol.id}> \n-# <:sadesagok_arviis:1421412348350038058> Bot mesajları: **${botlar ? "__Dahil__" : "__Hariç__"}**`,
        flags: 64
      });
    }

    if (subcommand === "sıfırla") {
      const kanal = interaction.options.getChannel("kanal");

      if (!data[guildId] || !data[guildId][kanal.id]) {
        return interaction.reply({
          content: "<a:dikkat_arviis:1421402093876674641> **Bu kanalda ayarlanmış bir alıntı sistemi yok.**",
          flags: 64
        });
      }

      delete data[guildId][kanal.id];
      if (Object.keys(data[guildId]).length === 0) delete data[guildId];

      saveData(data);

      return interaction.reply({
        content: "<:tik_arviis:1421412906435739698> Bu kanaldaki alıntı rol sistemi **sıfırlandı.**",
        flags: 64
      });
    }
  }
};