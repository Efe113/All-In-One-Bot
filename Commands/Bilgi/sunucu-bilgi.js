const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sunucu-bilgi')
        .setDescription('Sunucu hakkında bilgi verir.'),

    async execute(interaction) {
        const guild = interaction.guild;
        const owner = await guild.fetchOwner();
        const verificationLevel = guild.verificationLevel;
        const roles = guild.roles.cache.size;
        const channels = guild.channels.cache.size;
        const emojis = guild.emojis.cache.size;
        const afkChannel = guild.afkChannel ? guild.afkChannel.name : 'Ayarlanmamış.';
        const afkTimeout = guild.afkTimeout / 60;

        const totalMembers = guild.memberCount;
        const botCount = guild.members.cache.filter(m => m.user.bot).size;
        const humanCount = totalMembers - botCount;

        const boostCount = guild.premiumSubscriptionCount;
        const boostTier = guild.premiumTier;

        const bannerURL = guild.bannerURL({ size: 1024, extension: 'png' });

        const embed = new EmbedBuilder()
            .setDescription(`## ${guild.name} | Sunucu Bilgisi`)
            .setColor(0x664dd6)
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .addFields(
                { name: "📅 Oluşturulma", value: `<t:${parseInt(guild.createdAt / 1000)}:D>`, inline: true },
                { name: "<:crown_arviis:1421402003304747018> Sunucu Sahibi", value: `${owner}`, inline: true },
                { name: "🌍 Sunucu Dili", value: guild.preferredLocale, inline: true },

                { name: "<:uye_arviis:1421413166276935763> Üye Sayısı [Botlu]", value: `${totalMembers}`, inline: true },
                { name: "<:kullanici_arviis:1421409488921169960> Üye Sayısı [Botsuz]", value: `${humanCount}`, inline: true },
                { name: "<:mdeveloper_arviis:1421409722342441052> Botlar", value: `${botCount}`, inline: true },

               
                { name: "<:ampul_arviis:1421401217040515142> Rol Sayısı", value: `${roles}`, inline: true },
                { name: "<:hashtag_arviis:1421409016701128794> Kanal Sayısı", value: `${channels}`, inline: true },
                { name: "<:konfeti_arviis:1421409462417227867> Emoji Sayısı", value: `${emojis}`, inline: true },

                { name: "💤 AFK Kanalı", value: afkChannel, inline: true },
                { name: "<a:saat_arviis:1421412278544105542> AFK Süresi", value: `${afkTimeout} Dakika`, inline: true },
                { name: "<:info_arviis:1421409198385926295> Doğrulama", value: `${verificationLevel} . Seviye`, inline: true },

                { name: "<a:nitroboost_arviis:1421410021010313268> Toplam Boost & Seviye", value: `**${boostCount}** Boost | **${boostTier}.** Seviye`, inline: true },

                { name: "<:discord_arviis:1421408432547692595> Sunucu ID", value: `${guild.id}`, inline: false },
            );

        if (bannerURL) {
    embed.setImage(bannerURL);
} else {
    embed.setImage('https://dummyimage.com/800x200/2b2d31/ffffff&text=Sunucunun+Bannerı+Yok');
}

        await interaction.reply({ embeds: [embed] });
    },
};
