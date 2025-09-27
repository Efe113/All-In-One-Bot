const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, AttachmentBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../../Database/uyari.json");

function readWarnings() {
    if (!fs.existsSync(filePath)) return {};
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeWarnings(data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('uyarı')
        .setDescription('Uyarı sistem komutları')
        .setDefaultMemberPermissions(PermissionFlagsBits.ViewAuditLog)
        .addSubcommand(subcommand =>
            subcommand
                .setName('at')
                .setDescription('Kişiyi uyarır.')
                .addUserOption(option =>
                    option.setName('kişi')
                        .setDescription('Kişi seç.')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('sebep')
                        .setDescription('Sebep gir.')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('liste')
                .setDescription('Kişinin aldığı uyarıları gösterir.')
                .addUserOption(option =>
                    option.setName('kişi')
                        .setDescription('Kişi seç.')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('temizle')
                .setDescription('Kişinin uyarılarını temizler.')
                .addUserOption(option =>
                    option.setName('kişi')
                        .setDescription('Kişi seç.')
                        .setRequired(true)
                )
        ),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const user = interaction.options.getMember('kişi');

        if (!user) {
            return interaction.reply({ content: '<a:dikkat_arviis:1421402093876674641> **Belirtilen kişi bulunamadı**.', flags: 64 });
        }

        const warningsData = readWarnings();
        const userId = user.id;
        const userWarnings = warningsData[userId] || [];

        if (sub === 'at') {
            const reason = interaction.options.getString('sebep');

            if (interaction.member.roles.highest.position <= user.roles.highest.position && interaction.user.id !== interaction.guild.ownerId) {
                return interaction.reply({
                    content: "<a:dikkat_arviis:1421402093876674641> **Bu kişiyi uyaramazsın. Rolü seninkine eşit veya daha yüksek.**",
                    flags: 64
                });
            }

            userWarnings.push(reason);
            warningsData[userId] = userWarnings;
            writeWarnings(warningsData);

            await interaction.reply(
                `<:uyari_arviis:1421413143325839471> ${user} **(** ${user.user.username} **)** adlı kişi **uyarıldı.** \n ឵ ឵ ឵ ឵ ឵ ឵ ឵ ឵ ឵ ឵ ឵ ឵ ឵ ឵ ឵ ឵ ឵ ឵ ឵<:alt_arviis:1421401198723862608>> Toplam **__${userWarnings.length}__ kez** uyarı almış. \n\n` +
                `<:modernsagok_arviis:1421409769788407899> **Uyarı Sebebi:** __${reason}__`
            );

            user.send(
                `<:uyari_arviis:1421413143325839471> **${interaction.guild.name}** sunucusunda uyarı aldın. \n<:modernsagok_arviis:1421409769788407899> **Sebep:** ${reason}`
            ).catch(() => {});

        } else if (sub === 'liste') {
            const warnings = userWarnings;
            const guild = interaction.guild;
            const headerMessage = `<:arti_arviis:1421401298175135775> ${user} **(** ${user.user.username} **)** adlı kişi __toplam__ **${warnings.length} uyarı** almış.`;

            if (warnings.length === 0) {
                return interaction.reply({
                    content: `<:carpi_arviis:1421401682348216340> ${user} **(** ${user.user.username} **)** henüz uyarı **almamış.**`,
                    flags: 64
                });
            }

            const embed = new EmbedBuilder()
                .setColor(0x337fb2)
                .setAuthor({ name: 'UYARI LİSTESİ', iconURL: guild.iconURL({ dynamic: true }) })
                .setThumbnail(user.displayAvatarURL({ dynamic: true }));

            warnings.slice(0, 5).forEach((warning, index) => {
                embed.addFields({ name: `\`${index + 1}. Uyarı\``, value: `- ${warning}`, inline: false });
            });

            const files = [];
            if (warnings.length > 5) {
                const remainingWarnings = warnings.slice(5);
                const fileContent = remainingWarnings.map((w, i) => `${i + 6}-) ${w}`).join("\n");
                const tempFilePath = path.join(__dirname, `../../Database/uyarilar_${user.id}.txt`);
                fs.writeFileSync(tempFilePath, fileContent);

                files.push(new AttachmentBuilder(tempFilePath).setName("uyarilar.txt"));
            }

            await interaction.reply({
                content: headerMessage,
                embeds: [embed],
                files: files.length > 0 ? files : []
            });

            if (files.length > 0) {
                setTimeout(() => {
                    try {
                        fs.unlinkSync(files[0].attachment);
                    } catch (err) {
                        console.error("Dosya silinirken hata:", err);
                    }
                }, 5 * 60 * 1000);
            }

        } else if (sub === 'temizle') {
            if (user.roles.highest.position >= interaction.member.roles.highest.position && interaction.user.id !== interaction.guild.ownerId) {
                return interaction.reply({
                    content: `<a:dikkat_arviis:1421402093876674641> **Bu kişinin rollerine müdahale edecek yetkiye sahip değilsin.**`,
                    flags: 64
                });
            }

            if (user.roles.highest.position >= interaction.guild.members.me.roles.highest.position) {
                return interaction.reply({
                    content: `<a:dikkat_arviis:1421402093876674641> **Bu kişinin rolleri botun yetkisinden daha yüksek.**`,
                    flags: 64
                });
            }

            if (userWarnings.length === 0) {
                return interaction.reply({
                    content: `<:carpi_arviis:1421401682348216340> ${user} **(** ${user.displayName} **)** henüz uyarı **almamış.**`,
                    flags: 64
                });
            }

            delete warningsData[userId];
            writeWarnings(warningsData);

            await interaction.reply({
                content: `<:cop_arviis:1421401983113498705> ${user} **(** ${user.displayName} **)** adlı kişinin toplam **${userWarnings.length} uyarısı** temizlendi.`,
                flags: 64
            });
        }
    }
};
