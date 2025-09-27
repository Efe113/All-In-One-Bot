const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Botun gecikme değerlerini gösterir."),

    async execute(interaction, client) {
        const websocketPing = client.ws.ping;

        const botStart = Date.now();
        await interaction.reply({
  content: "<a:yukleniyor_arviis:1421413341859151883> Ping ölçülüyor..."
});
const reply = await interaction.fetchReply();
        const botPing = Date.now() - botStart;

        const restStart = Date.now();
        await client.guilds.fetch(interaction.guildId);
        const restPing = Date.now() - restStart;

        const canvas = createCanvas(800, 300);
        const ctx = canvas.getContext("2d");

        ctx.fillStyle = "#111111";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const avatar = await loadImage(client.user.displayAvatarURL({ extension: "png", size: 128 }));
        const avatarX = 20, avatarY = 20, radius = 40;
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX + radius, avatarY + radius, radius, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, avatarX, avatarY, radius * 2, radius * 2);
        ctx.restore();

        let fontSize = 40;
ctx.font = `bold ${fontSize}px Sans-serif`;

while (ctx.measureText(`${client.user.username} | GECİKME SÜRELERİ`).width > 600) {
    fontSize -= 2;
    ctx.font = `bold ${fontSize}px Sans-serif`;
}

ctx.fillStyle = "#ffffff";
ctx.fillText(`${client.user.username} | GECİKME SÜRELERİ`, 120, 75);

        ctx.font = "28px Sans-serif";
        ctx.fillStyle = "#c0c0c0";
        ctx.fillText(`> WebSocket Ping: ${websocketPing} ms`, 50, 140);
        ctx.fillText(`> Yanıt Süresi: ${botPing} ms`, 50, 205);
        ctx.fillText(`> REST API Gecikmesi: ${restPing} ms`, 50, 270);

        const attachment = new AttachmentBuilder(canvas.toBuffer("image/png"), {
            name: "ping-bilgileri.png",
        });

        await interaction.editReply({ content: "", files: [attachment] });
    },
};
