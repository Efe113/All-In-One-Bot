const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("nickname-değiştir")
        .setDescription("Belirtilen kişinin sunucudaki ismini değiştirir.")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames)
        .addUserOption(option => 
            option.setName("kişi")
                .setDescription("Kişi seç.")
                .setRequired(true)
        )
        .addStringOption(option => 
            option.setName("isim")
                .setDescription("İsmi gir.")
                .setRequired(true)
        ),

    async execute(interaction) {
        const { guild } = interaction;
        const member = interaction.options.getMember("kişi");
        const yeniIsim = interaction.options.getString("isim");
        const eskiIsim = member.displayName;

        try {
            await member.setNickname(yeniIsim);

            const embed = new EmbedBuilder()
                .setAuthor({ name: 'NICKNAME DEĞİŞTİRİLDİ', iconURL: guild.iconURL({ dynamic: true }) })
                .setDescription(`**${eskiIsim}** <:sadesagok_arviis:1421412348350038058> \`${yeniIsim}\` \n${member} adlı kişinin nickname'i **değiştirildi.**`)
                .setColor(0x57F287)
                .setThumbnail(member.displayAvatarURL({ dynamic: true, size: 2048 }));

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error("Nickname değiştirme hatası:", error);

            await interaction.reply({
                content: "<a:dikkat_arviis:1421402093876674641> **Nickname değiştirilemedi.**",
                flags: 64
            });
        }
    }
};