const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ban")
        .setDescription("Ban işlemleri.")
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addSubcommand(subcommand =>
            subcommand
                .setName("at")
                .setDescription("Kişiyi sunucudan yasaklar.")
                .addUserOption(option =>
                    option.setName("kişi").setDescription("Kişi seç.").setRequired(true)
                )
                .addStringOption(option =>
                    option.setName("sebep").setDescription("Sebep gir.").setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("kaldır")
                .setDescription("Belirtilen ID'deki kişinin yasağını kaldırır.")
                .addStringOption(option =>
                    option.setName("kişi-id").setDescription("ID gir.").setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("temizle")
                .setDescription("Sunucudaki tüm banları kaldırır.")
        ),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const guild = interaction.guild;

        if (sub === "at") {
            const user = interaction.options.getUser("kişi");
            const reason = interaction.options.getString("sebep");

            const member = await guild.members.fetch(user.id).catch(() => null);

            if (user.id === guild.ownerId) {
                return interaction.reply({
                    content: "<a:dikkat_arviis:1421402093876674641> **Sunucu sahibini banlayamazsın.**",
                    flags: 64
                });
            }

            const bans = await guild.bans.fetch();
            if (bans.has(user.id)) {
                return interaction.reply({
                    content: "<a:dikkat_arviis:1421402093876674641> **Bu kişi zaten banlı.**",
                    flags: 64
                });
            }

            if (!member) {
                return interaction.reply({
                    content: "<a:dikkat_arviis:1421402093876674641> **Bu kişiyi sunucuda bulamıyorum.**",
                    flags: 64
                });
            }

            if (member.roles.highest.position >= interaction.member.roles.highest.position) {
                const errEmbed = new EmbedBuilder()
                    .setTitle("YETKİ HATASI")
                    .setDescription(`<a:dikkat_arviis:1421402093876674641> **(** **${user.username}** **)** kişisinin rolü seninkine eşit veya daha yüksek.`)
                    .setColor(0xff4c4c)
                    .setThumbnail(guild.iconURL({ dynamic: true }));

                return interaction.reply({ embeds: [errEmbed], flags: 64 });
            }

            try {
                await member.ban({ reason });

                const banEmbed = new EmbedBuilder()
                    .setAuthor({ name: `"${user.username}" adlı kişi yasaklandı.`, iconURL: guild.iconURL({ dynamic: true }) })
                    .setColor(0xff4c4c)
                    .setThumbnail(user.displayAvatarURL())
                    .addFields(
                        { name: "<:ban_arviis:1421401381683859576> Yasaklanan Kişi", value: `${user}`, inline: true },
                        { name: "<:hashtag_arviis:1421409016701128794> Sebep", value: reason, inline: true },
                        { name: "<:kalkan_arviis:1421409290018881547> Yasaklayan", value: `${interaction.user}`, inline: false }
                    );

                await interaction.reply({ embeds: [banEmbed] });

                await user.send(`<:ban_arviis:1421401381683859576> **(** ${guild.name} **)** sunucusundan **(** **${reason}** **)** sebebiyle yasaklandın.`).catch(() => {});
            } catch (error) {
                return interaction.reply({
                    content: `<a:dikkat_arviis:1421402093876674641> **Hata oluştu.**`,
                    flags: 64
                });
            }

        } else if (sub === "kaldır") {
            const userId = interaction.options.getString("kişi-id");

            if (!/^\d{17,20}$/.test(userId)) {
                return interaction.reply({
                    content: "<a:dikkat_arviis:1421402093876674641>** Lütfen geçerli bir kişi ID'si gir.**",
                    flags: 64
                });
            }

            try {
                const bans = await guild.bans.fetch();
                const bannedUser = bans.get(userId);
                if (!bannedUser) {
                    return interaction.reply({
                        content: "<a:dikkat_arviis:1421402093876674641> **Bu ID'ye ait bir yasak bulunamadı.**",
                        flags: 64
                    });
                }

                await guild.members.unban(userId);

                const unbanEmbed = new EmbedBuilder()
                    .setColor(0x57F287)
                    .setThumbnail(guild.iconURL({ dynamic: true }))
                    .setAuthor({ name: 'YASAK KALDIRILDI', iconURL: guild.iconURL({ dynamic: true }) })
                    .setDescription(`<@${userId}> **(** ${userId} **)** kişisinin yasağı **kaldırıldı.**`);

                return interaction.reply({ embeds: [unbanEmbed] });

            } catch (err) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(0xff4c4c)
                    .setTitle("<a:dikkat_arviis:1421402093876674641> HATA")
                    .setDescription("Kişinin banı kaldırılırken bir sorun oluştu. ID'yi veya yetkileri kontrol et.");

                return interaction.reply({ embeds: [errorEmbed], flags: 64 });
            }

        } else if (sub === "temizle") {
            await interaction.reply({
                content: "<a:yukleniyor_arviis:1421413341859151883> Ban listesi alınıyor...",
                flags: 64,
            });

            try {
                const banList = await guild.bans.fetch();

                if (banList.size === 0) {
                    return interaction.editReply("<:tik_arviis:1421412906435739698> Sunucuda banlı kimse yok.");
                }

                let kaldırılan = 0;
                for (const [userId, banInfo] of banList) {
                    try {
                        await guild.members.unban(userId, "Toplu ban kaldırma");
                        kaldırılan++;
                        await new Promise((r) => setTimeout(r, 1000));
                    } catch (err) {
                        console.warn(`<:carpi_arviis:1421401682348216340> Ban kaldırılamadı: ${banInfo.user.tag} ( ${userId} ) - ${err.message}`);
                    }
                }

                await interaction.editReply(`<:tik_arviis:1421412906435739698> **(** ${kaldırılan} kişinin **)** banı kaldırıldı.`);

            } catch (err) {
                console.error("Ban listesi alınamadı:", err);
                await interaction.editReply("<a:dikkat_arviis:1421402093876674641> **Ban listesi alınırken hata oluştu.**");
            }
        }
    }
};
