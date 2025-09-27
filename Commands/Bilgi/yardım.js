const { ComponentType, EmbedBuilder, SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

const veriYolu = path.join(__dirname, "../../Database/yardımEmbed.json");

function veriOku(key) {
  if (!fs.existsSync(veriYolu)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(veriYolu, "utf8"));
    const [anahtar, altAnahtar] = key.split(".");
    return data[anahtar]?.[altAnahtar] || null;
  } catch {
    return null;
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("yardım")
    .setDescription("Botta bulunan komutları gösterir."),

  async execute(interaction) {
    const emojis = {
      Bildirim: "<a:bildirim_arviis:1421401396996997140>",
      Bilgi: "<a:buyutec_arviis:1421401498352619583>",
      Bot: "<:bot_arviis:1421401456568827904>",
      Döviz: "<a:doviz_arviis:1421408601125425182>",
      Eğlence: "<a:laugh_arviis:1421409519602503774>",
      Kullanıcı: "<:kullanici_arviis:1421409488921169960>",
      Kurulumlu: "<a:ayar_arviis:1421401361769041920>",
      Moderasyon: "<:ban_arviis:1421401381683859576>",
      Sunucu: "<a:4dkalp_arviis:1421401152624398396>",
      Yedek: "<:bulut_arviis:1421401475799584928>",
    };

    const formatString = (str) =>
      str
        .toLocaleLowerCase("tr-TR")
        .split(" ")
        .map(word => word.charAt(0).toLocaleUpperCase("tr-TR") + word.slice(1))
        .join(" ");

    const directories = [
      ...new Set(interaction.client.commands.map((cmd) => cmd.folder)),
    ];

    const categories = directories.map((dir) => {
      const getCommands = interaction.client.commands
        .filter((cmd) => cmd.folder === dir)
        .map((cmd) => ({
          name: cmd.data.name,
          description: cmd.data.description || "Komut açıklaması girilmemiş.",
        }));
      return {
        directory: dir,
        commands: getCommands,
      };
    });

    const embed = new EmbedBuilder()
      .setDescription(`## ${interaction.client.user.username} | Yardım Menüsü

<a:pikachuselam_arviis:1421412118091272222> Selam ${interaction.user}!

<a:asagiok_arviis:1421401315262857256> Aşağıdaki \`Kategori Seç\` menüsünden kategorileri gezebilirsin.
`)
      .setColor(veriOku("yardım.renk") || "#ffffff")
      .setImage(veriOku("yardım.resim") || "https://media.discordapp.net/attachments/1069639498637525043/1268581297668751441/arvis0011-hosgeldinn.gif")
      .setThumbnail(interaction.guild.iconURL({ dynamic: true }));

    const components = (state) => [
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("yardım-menüsü")
          .setPlaceholder("Kategori Seç")
          .setDisabled(state)
          .addOptions(
            categories.map((cmd) => ({
              label: formatString(cmd.directory),
              value: cmd.directory.toLowerCase(),
              emoji: emojis[formatString(cmd.directory)] || undefined,
            }))
          )
      ),
    ];

    const initialMessage = await interaction.reply({
      embeds: [embed],
      components: components(false),
    });

    const collector = interaction.channel.createMessageComponentCollector({
      filter: (i) => i.user.id === interaction.user.id,
      componentType: ComponentType.SelectMenu,
      time: 60_000,
    });

    collector.on("collect", (i) => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({
          content: "<a:dikkat:1421402093876674641> **Bu menüyü sadece komutu kullanan kişi kullanabilir.**",
          flags: 64
        });
      }

      const [directory] = i.values;
      const category = categories.find(
        (x) => x.directory.toLowerCase() === directory
      );

      const categoryEmbed = new EmbedBuilder()
        .setColor(veriOku("yardım.komutrenk") || "#ffffff")
        .setImage(veriOku("yardım.komutresim") || "https://media.discordapp.net/attachments/1069639498637525043/1268581297668751441/arvis0011-hosgeldinn.gif")
        .setDescription(`## ${interaction.client.user.username} | Komut Menüsü`)
        .addFields(
          category.commands.map((cmd) => ({
            name: `**\`${cmd.name}\`**`,
            value: `- ${cmd.description}`,
            inline: true,
          }))
        );

      i.update({ embeds: [categoryEmbed] });
    });

    collector.on("end", () => {
      initialMessage.edit({
        components: [
          new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId("yardım-menüsü")
              .setPlaceholder("⏰ Menünün Süresi Doldu")
              .setDisabled(true)
              .addOptions(
                categories.map((cmd) => ({
                  label: formatString(cmd.directory),
                  value: cmd.directory.toLowerCase(),
                  emoji: emojis[cmd.directory] || undefined,
                }))
              )
          ),
        ],
      });
    });
  }
};
