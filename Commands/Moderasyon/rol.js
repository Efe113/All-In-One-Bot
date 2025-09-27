const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rol')
        .setDescription('Rol ver ya da al.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addSubcommand(subcommand =>
            subcommand
                .setName('ver')
                .setDescription('Belirtilen kişiye belirtilen rolü verir.')
                .addUserOption(option =>
                    option.setName('kişi')
                        .setDescription('Kişi seç.')
                        .setRequired(true)
                )
                .addRoleOption(option =>
                    option.setName('rol')
                        .setDescription('Rol seç.')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('al')
                .setDescription('Belirtilen kişiden belirtilen rolü alır.')
                .addUserOption(option =>
                    option.setName('kişi')
                        .setDescription('Kişi seç.')
                        .setRequired(true)
                )
                .addRoleOption(option =>
                    option.setName('rol')
                        .setDescription('Rol seç.')
                        .setRequired(true)
                )
        ),

    async execute(interaction) {
        const { guild, member: komutuKullanan } = interaction;
        const subcommand = interaction.options.getSubcommand();
        const user = interaction.options.getMember('kişi');
        const role = interaction.options.getRole('rol');
        const ikon = user.displayAvatarURL({ dynamic: true, size: 2048 });

        if (komutuKullanan.roles.highest.position <= role.position && komutuKullanan.id !== guild.ownerId) {
            return interaction.reply({
                content: `<a:dikkat_arviis:1421402093876674641> **Bu rol senin rolünün üstünde.**`,
                flags: 64
            });
        }

        if (guild.members.me.roles.highest.position <= role.position) {
            return interaction.reply({
                content: `<a:dikkat_arviis:1421402093876674641> **Bu rol botun yetkisinden daha yüksek.**`,
                flags: 64
            });
        }

        if (subcommand === 'ver') {
            if (user.roles.cache.has(role.id)) {
                return interaction.reply({
                    content: `<a:dikkat_arviis:1421402093876674641> **Bu kişide zaten <@&${role.id}> rolü var.**`,
                    flags: 64
                });
            }

            await user.roles.add(role).catch(() => null);

            const rolVerEmbed = new EmbedBuilder()
                .setAuthor({ name: 'ROL VERİLDİ', iconURL: guild.iconURL({ dynamic: true }) })
                .setColor(0x57F287)
                .setDescription(`<@${user.id}> **(** ${user.user.username} **)** adlı kişiye <@&${role.id}> rolü verildi.`)
                .setThumbnail(ikon);

            await interaction.reply({ embeds: [rolVerEmbed] });

        } else if (subcommand === 'al') {
            if (!user.roles.cache.has(role.id)) {
                return interaction.reply({
                    content: `<a:dikkat_arviis:1421402093876674641> **Bu kişide zaten <@&${role.id}> rolü yok.**`,
                    flags: 64
                });
            }

            await user.roles.remove(role).catch(() => null);

            const rolAlEmbed = new EmbedBuilder()
                .setAuthor({ name: 'ROL ALINDI', iconURL: guild.iconURL({ dynamic: true }) })
                .setColor(0xff4c4c)
                .setDescription(`<@${user.id}> **(** ${user.user.username} **)** adlı kişiden <@&${role.id}> rolü alındı.`)
                .setThumbnail(ikon);

            await interaction.reply({ embeds: [rolAlEmbed] });
        }
    }
};
