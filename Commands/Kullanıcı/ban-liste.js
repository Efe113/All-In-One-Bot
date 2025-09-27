const { EmbedBuilder, SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ban-liste")
    .setDescription("Yasaklanan kişileri listeler."),

  async execute(interaction) {
    const { guild } = interaction;

    const bans = await guild.bans.fetch();
    if (!bans.size) {
      const NoBanEmbed = new EmbedBuilder()
        .setAuthor({ name: `${guild.name} Tertemiz`, iconURL: guild.iconURL({ dynamic: true }) })
        .setDescription("Sunucuda yasaklı kimse bulunmuyor.")
        .setColor(0xff0000);

      return interaction.reply({ embeds: [NoBanEmbed] });
    }

    const bannedUsers = bans.map(ban => ban.user.username);
    const first20 = bannedUsers.slice(0, 20);
    const extraUsers = bannedUsers.slice(20);

    const embed = new EmbedBuilder()
      .setAuthor({ name: `${guild.name} | Ban Listesi`, iconURL: guild.iconURL({ dynamic: true }) })
      .setColor(0xffc403)
      .setThumbnail(guild.iconURL({ dynamic: true }));

    for (const name of first20) {
      embed.addFields({ name: '\u200B', value: `\`${name}\``, inline: true });
    }

    if (extraUsers.length > 0) {
      const filePath = path.join(__dirname, "ban-listesi.txt");
      const content = bannedUsers.map((name, i) => `${i + 1}. ${name}`).join("\n");

      fs.writeFileSync(filePath, content);

      const attachment = new AttachmentBuilder(filePath).setName("ban-listesi.txt");

      await interaction.reply({
        embeds: [embed],
        files: [attachment]
      });

      fs.unlinkSync(filePath); 
    } else {
      await interaction.reply({
        embeds: [embed]
      });
    }
  }
};
