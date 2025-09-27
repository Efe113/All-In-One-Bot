const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const { createCanvas, loadImage } = require("canvas");

function fitText(ctx, text, maxWidth, baseSize) {
    let size = baseSize;
    do {
        ctx.font = `bold ${size}px Sans-serif`;
        if (ctx.measureText(text).width <= maxWidth) break;
        size -= 1;
    } while (size > 10);
    return size;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("aktiflik-süresi")
        .setDescription("Botun açık olduğu süreyi gösterir."),

    async execute(interaction, client) {
        const gün = Math.floor(client.uptime / 86400000);
        const saat = Math.floor(client.uptime / 3600000) % 24;
        const dakika = Math.floor(client.uptime / 60000) % 60;
        const saniye = Math.floor(client.uptime / 1000) % 60;

        const pad = (n) => String(n).padStart(2, "0");
        const zamanFormatlı = `${pad(saat)}:${pad(dakika)}:${pad(saniye)}`;

        const canvas = createCanvas(700, 250);
        const ctx = canvas.getContext("2d");

        ctx.fillStyle = "#111111";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const title = `${client.user.username} | Aktiflik Süresi`;
        const fontSize = fitText(ctx, title, 640, 28);
        ctx.font = `bold ${fontSize}px Sans-serif`;
        ctx.fillStyle = "#ffffff";
        ctx.fillText(title, 30, 50);

        ctx.font = "24px Sans-serif";
        ctx.fillStyle = "#c0c0c0";
        ctx.fillText(`Gün: ${gün}`, 50, 110);
        ctx.fillText(`Süre: ${zamanFormatlı}`, 50, 160);

        const avatar = await loadImage(client.user.displayAvatarURL({ extension: "png", size: 128 }));
        const x = canvas.width - 150;
        const y = 60;
        const radius = 50;

        ctx.save();
        ctx.beginPath();
        ctx.arc(x + radius, y + radius, radius, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();

        ctx.drawImage(avatar, x, y, radius * 2, radius * 2);
        ctx.restore();

        const attachment = new AttachmentBuilder(canvas.toBuffer("image/png"), {
            name: "aktiflik-süresi.png",
        });

        await interaction.reply({ files: [attachment] });
    },
};
