const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');
const csfetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const fs = require("fs");

function safeText(text, maxLength = 16) {
	return (typeof text === "string" ? text : text?.toString() || "—").slice(0, maxLength);
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('tahvil')
		.setDescription('AKTIF TAHVIL - TRT131119T19 kur bilgilerini gösterir.'),

	async execute(interaction) {
		await interaction.reply("📊  AKTIF TAHVIL - TRT131119T19 bilgileri yükleniyor...");

		const res = await csfetch("https://api.bigpara.hurriyet.com.tr/doviz/headerlist/anasayfa");
		const json = await res.json();
		const TAHVIL = json.data.find(c => c.SEMBOL === "TAHVIL");

		if (!TAHVIL) return interaction.editReply("<:carpi_arviis:1421401682348216340> AKTIF TAHVIL - TRT131119T19 verisi alınamadı.");

		const canvas = createCanvas(650, 450);
		const ctx = canvas.getContext('2d');

		ctx.fillStyle = '#1e1e2f';
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		ctx.font = 'bold 26px Sans';
		ctx.fillStyle = '#00ffae';
		ctx.fillText(`${TAHVIL.SEMBOL} | AKTIF TAHVIL - TRT131119T19 Kuru`, 20, 40);

		ctx.font = 'bold 42px Sans';
		ctx.fillStyle = '#ffffff';
		ctx.fillText(`${safeText(TAHVIL.SATIS)} ₺`, 20, 90);

		ctx.font = '22px Sans';
		ctx.fillStyle = '#bbbbbb';
		ctx.fillText(`Alış: ${safeText(TAHVIL.ALIS)} ₺`, 20, 130);
		ctx.fillText(`En Yüksek: ${safeText(TAHVIL.YUKSEK)} ₺`, 20, 170);
    	ctx.fillText(`En Düşük: ${safeText(TAHVIL.DUSUK)} ₺`, 20, 210);
		ctx.fillText(`Açılış: ${safeText(TAHVIL.ACILIS)} ₺`, 20, 250);
		ctx.fillText(`Kapanış: ${safeText(TAHVIL.KAPANIS)} ₺`, 20, 290);
		ctx.fillText(`Dünkü Kapanış: ${safeText(TAHVIL.DUNKUKAPANIS)} ₺`, 20, 330);
		ctx.fillText(`NET: ${safeText(TAHVIL.NET)}`, 20, 370);
		ctx.fillText(`Hacim TL: ${safeText(TAHVIL.HACIMTL)} ₺`, 20, 410);

    const now = new Date().toLocaleString('tr-TR');
		const tarih = safeText(TAHVIL.TARIH);
		const saat = safeText(TAHVIL.SAAT);
		ctx.fillStyle = '#888888';
		ctx.font = '18px Sans';
		ctx.fillText(`${safeText(now)}`, 440, 400);
		ctx.fillText(`Veri Tarihi: ${tarih} ${saat}`, 380, 430);

const degisimHam = TAHVIL.YUZDEDEGISIM || TAHVIL.DEGisim || null;

if (degisimHam) {
	const degisim = safeText(degisimHam, 8);
	const yukseliyor = !degisim.startsWith('-');
	const renk = yukseliyor ? '#4caf50' : '#ff5e5e';

	const ikonPath = path.join(__dirname, '../../assets/Döviz', yukseliyor ? 'up.png' : 'down.png');
	try {
		const ikonData = fs.readFileSync(ikonPath); 
		const ikon = await loadImage(ikonData);   

		ctx.drawImage(ikon, 550, 35, 86, 86); 
	} catch (err) {
		console.error("İkon yüklenemedi:", err); 
	}

	ctx.fillStyle = renk;
	ctx.font = '22px Sans';
	ctx.fillText(`Değişim: %${degisim}`, 440, 370);
}

		const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'tahvil-kuru.png' });
		await interaction.editReply({ content: "", files: [attachment] });
	},
};