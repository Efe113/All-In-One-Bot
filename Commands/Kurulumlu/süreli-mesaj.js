const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require("discord.js");
const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../../Database/süreliMesaj.json");

function readData() {
  if (!fs.existsSync(filePath)) return {};
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function writeData(data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function parseTime(text) {
  const regex = /(\d+)\s*(saniye|sn|dakika|dk|saat|gün|hafta)?/i;
  const match = text.match(regex);
  if (!match) return NaN;

  const value = parseInt(match[1]);
  const unit = (match[2] || "ms").toLowerCase();

  switch (unit) {
    case "saniye":
    case "sn": return value * 1000;
    case "dakika":
    case "dk": return value * 60 * 1000;
    case "saat": return value * 60 * 60 * 1000;
    case "gün": return value * 24 * 60 * 60 * 1000;
    case "hafta": return value * 7 * 24 * 60 * 60 * 1000;
    default: return value; 
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("süreli-mesaj")
    .setDescription("Süreli mesaj sistemini ayarla ya da sıfırla.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub
        .setName("ayarla")
        .setDescription("Süreli mesaj ayarla.")
        .addChannelOption(option =>
          option.setName("kanal")
            .setDescription("Kanal seç.")
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName("mesaj")
            .setDescription("Mesaj gir.")
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName("süre")
            .setDescription("Süre gir. ('3 gün', '1 hafta', '60000')")
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName("sıfırla")
        .setDescription("Süreli mesaj sistemini sıfırla.")
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const data = readData();

    if (subcommand === "ayarla") {
      const kanal = interaction.options.getChannel("kanal");
      const mesaj = interaction.options.getString("mesaj");
      const sureStr = interaction.options.getString("süre");

      const süre = parseTime(sureStr);
      if (isNaN(süre)) {
        return interaction.reply({
          content: "<a:dikkat_arviis:1421402093876674641> **Geçerli bir süre belirtmelisin. (`3 gün`, `1 hafta`, `60000`)**",
          flags: 64
        });
      }

      data[interaction.guild.id] = {
        kanalID: kanal.id,
        mesaj: mesaj,
        süre: süre
      };
      writeData(data);

      return interaction.reply({
        content: `<:tik_arviis:1421412906435739698> Süreli mesaj **ayarlandı.** \n\n<:hashtag_arviis:1421409016701128794> Kanal: <#${kanal.id}> \n<a:saat_arviis:1421412278544105542> Süre: \`${sureStr}\`\n<:bulut_arviis:1421401475799584928> Mesaj: \n\`\`\`${mesaj}\`\`\``,
        flags: 64
      });

    } else if (subcommand === "sıfırla") {
      if (!data[interaction.guild.id]) {
        return interaction.reply({
          content: "<a:dikkat_arviis:1421402093876674641> **Bu sunucuda ayarlı süreli mesaj bulunamadı.**",
          flags: 64
        });
      }

      delete data[interaction.guild.id];
      writeData(data);

      return interaction.reply({
        content: "<:tik_arviis:1421412906435739698> Süreli mesaj sistemi **sıfırlandı.**",
        flags: 64
      });
    }
  }
};