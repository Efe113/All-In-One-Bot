const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("hesap-bilgi")
        .setDescription("Sunucuda bulunan kişinin hesabı hakkında bilgi verir.")
        .addUserOption(option =>
            option.setName("kişi")
                .setDescription("Kişi seç.")
                .setRequired(false)
        ),

    async execute(interaction) {
        const { options, guild, client } = interaction;
        const user = options.getUser("kişi") || interaction.user;

        await interaction.deferReply(); 

let member;
try {
    member = await guild.members.fetch(user.id);
} catch (err) {
    console.warn("Üye fetch sırasında hata:", err.message);
    member = null; 
}
        const fetchedUser = await client.users.fetch(user.id, { force: true });

        const durumMap = {
    online: "<:online_arviis:1421410143484117093> Çevrimiçi",
    idle: "<:idle_arviis:1421409106807357440> Boşta",
    dnd: "<:dnd_arviis:1421408509051932743> Rahatsız Etmeyin",
    offline: "<:offline_arviis:1421410121594048594> Çevrimdışı"
};

        const cihazMap = {
            desktop: "💻 Masaüstü",
            mobile: "📱 Mobil",
            web: "🌐 Web"
        };

        const presence = member?.presence ?? null;
        const durum = presence?.status
    ? durumMap[presence.status] || presence.status
    : (member ? "<:offline_arviis:1421410121594048594> Çevrimdışı" : "<:carpi_arviis:1421401682348216340> Sunucuda değil.");

        const cihazlar = presence?.clientStatus
            ? Object.keys(presence.clientStatus).map(c => cihazMap[c] || c).join(", ")
            : null;

        const cihazlarMetni = member
    ? (cihazlar?.trim()
        ? cihazlar
        : "<:offline_arviis:1421410121594048594> Çevrimdışı olduğu için veri yok.")
    : "<:carpi_arviis:1421401682348216340> Sunucuda değil.";
            

            const joinedTimestamp = member?.joinedAt?.getTime();
            const girisTarihi = joinedTimestamp
             ? `<t:${Math.floor(joinedTimestamp / 1000)}:D> \n**(**<t:${Math.floor(joinedTimestamp / 1000)}:R>**)**`
             : "<:carpi_arviis:1421401682348216340> Sunucuda değil.";

        const sonGorulmePath = path.join(__dirname, "../../Database/sonGorulme.json");
        let sonGorulme = null;

        if (fs.existsSync(sonGorulmePath)) {
            try {
                const json = JSON.parse(fs.readFileSync(sonGorulmePath, "utf8"));
                if (json[user.id] && json[user.id].SonGorulme) {
                    sonGorulme = json[user.id].SonGorulme;
                }
            } catch (err) {
                console.error("Son görülme verisi okunamadı:", err);
            }
        }

        const sonGorulmeMetni = !presence || presence.status === "offline"
            ? (sonGorulme ? `<t:${parseInt(sonGorulme / 1000)}:R>` : "<:carpi_arviis:1421401682348216340> Veri yok.")
            : "<:online_arviis:1421410143484117093> Şu an aktif.";

        const boostDurumu = member ? (member?.premiumSince
            ? `<a:flying_nitro_boost_arviis:1421408873071247491> <t:${Math.floor(member.premiumSince / 1000)}:D>`
            : "<:carpi_arviis:1421410143484117093> Hayır.")
            : "<:carpi_arviis:1421410143484117093> Sunucuda değil.";
        

        const adminYetkisi = member ? (member?.permissions.has("Administrator")
            ? "<:tik_arviis:1421412906435739698> Evet"
            : "<:carpi_arviis:1421410143484117093> Hayır")
            : "<:carpi_arviis:1421410143484117093> Sunucuda değil.";

        let roller = "<:carpi_arviis:1421410143484117093> Rolü yok.";
        if (member && member.roles.cache) {
            const rollerArray = member.roles.cache
                .filter(role => role.id !== guild.id)
                .sort((a, b) => b.position - a.position)
                .map(role => role.toString());

            if (rollerArray.length > 0) {
                roller = "▫️ " + rollerArray.join("\n▫️ ");
            }
        }

        const KullanıcıBilgiEmbed = new EmbedBuilder()
            .setColor(0x664dd6)
            .setAuthor({
                name: `${user.username} | Hesap Bilgileri`,
                iconURL: guild.iconURL({ dynamic: true })
            })
            .addFields(
                { name: "Kişi", value: `<@${user.id}>`, inline: true },
                { name: "ID", value: user.id, inline: true },
                { name: "Durum", value: durum, inline: true },
                { name: "Son Görülme", value: sonGorulmeMetni, inline: true },
                { name: "Yönetici mi?", value: adminYetkisi, inline: true },
                { name: "Booster mı?", value: boostDurumu, inline: true },
                { name: "Sunucuya Giriş", value: girisTarihi, inline: true },
                { name: "Hesap Oluşturma", value: `<t:${Math.floor(user.createdAt / 1000)}:D> \n**(** <t:${Math.floor(user.createdAt / 1000)}:R> **)**`, inline: true },
                { name: "Cihaz(lar)", value: cihazlarMetni, inline: false },
                { name: "Roller", value: roller, inline: false }
            )
            .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 2048 }));

        if (fetchedUser.banner) {
            KullanıcıBilgiEmbed.setImage(fetchedUser.bannerURL({ dynamic: true, size: 2048 }));
        } else {
            KullanıcıBilgiEmbed.setImage("https://dummyimage.com/800x200/2b2d31/ffffff&text=Bu+kişinin+bannerı+yok.");
        }

        await interaction.editReply({ embeds: [KullanıcıBilgiEmbed] });
    }
};
