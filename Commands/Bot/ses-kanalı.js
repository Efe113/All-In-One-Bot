const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dosyaYolu = path.join(__dirname, "../../Database/sesKanali.json");

function veriOku() {
  if (!fs.existsSync(dosyaYolu)) return {};
  try {
    return JSON.parse(fs.readFileSync(dosyaYolu, "utf8"));
  } catch {
    return {};
  }
}

function veriYaz(veri) {
  fs.writeFileSync(dosyaYolu, JSON.stringify(veri, null, 2), "utf8");
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ses-kanalı")
    .setDescription("Ses kanalı yönetim komutları.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName("ekle")
        .setDescription("Botun katılabileceği bir ses kanalı ekler.")
        .addChannelOption(opt =>
          opt.setName("kanal")
            .setDescription("Eklenecek ses kanalı.")
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildVoice)
        )
    )
    .addSubcommand(sub =>
      sub.setName("liste")
        .setDescription("Eklenmiş ve aktif ses kanallarını listeler.")
    )
    .addSubcommand(sub =>
      sub.setName("seç")
        .setDescription("Botun aktif kullanacağı ses kanalını belirler.")
        .addChannelOption(opt =>
          opt.setName("kanal")
            .setDescription("Aktif yapılacak ses kanalı.")
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildVoice)
        )
    )
    .addSubcommand(sub =>
      sub.setName("sıfırla")
        .setDescription("Tüm ses kanallarını sıfırlar.")
    ),

  async execute(interaction) {
    const sahipID = "640056735700221953";
    if (interaction.user.id !== sahipID) {
      return interaction.reply({
        content: "<a:dikkat_arviis:1421402093876674641> **Bu komutu sadece <@640056735700221953> kullanabilir.**",
        flags: 64
      });
    }

    const sub = interaction.options.getSubcommand();
    const veri = veriOku();
    let kanallar = veri.sesKanallari || [];

    if (sub === "ekle") {
      const kanal = interaction.options.getChannel("kanal");

      if (kanallar.includes(kanal.id)) {
        return interaction.reply({
          content: "<a:dikkat_arviis:997074866371039322> **Bu kanal zaten listede.**",
          flags: 64
        });
      }

      kanallar.push(kanal.id);
      veri.sesKanallari = kanallar;
      veriYaz(veri);

      return interaction.reply({
        content: `<:tik_arviis:1046067679884234863> **${kanal.name}** listene **eklendi.**`,
        flags: 64
      });
    }

    if (sub === "liste") {
      const aktif = veri.aktifSesKanali;

      if (kanallar.length === 0) {
        return interaction.reply({
          content: "<:carpi_arviis:1046067681515814912> Hiç ses kanalı **eklenmemiş.**",
          flags: 64
        });
      }

      const liste = kanallar.map(k => {
        return `<#${k}> ${aktif === k ? "**(** <:tik_arviis:1046067679884234863> AKTİF **)**" : ""}`;
      }).join("\n");

      return interaction.reply({
        content: `<:hashtag_arviis:1051904217478070276> **Ses Kanal Listesi** \n\n${liste}`,
        flags: 64
      });
    }

    if (sub === "seç") {
      const kanal = interaction.options.getChannel("kanal");

      if (!kanallar.includes(kanal.id)) {
        return interaction.reply({
          content: "<a:dikkat_arviis:997074866371039322> **Bu kanal listede yok.**\n\n<:info_arviis:997609746410504282> Önce `/ses-kanalı ekle` komutuyla **ekle.**",
          flags: 64
        });
      }

      veri.aktifSesKanali = kanal.id;
      veriYaz(veri);

      return interaction.reply({
        content: `<:tik_arviis:1046067679884234863> Ses kanalı **değiştirildi.** <:sadesagok_arviis:1109797490665996349> **(<#${kanal.id}>)**`,
        flags: 64
      });
    }

    if (sub === "sıfırla") {
      if (!veri.sesKanallari || veri.sesKanallari.length === 0) {
        return interaction.reply({
          content: "<a:dikkat_arviis:997074866371039322> **Ayarlanmış herhangi bir ses kanalı yok.**",
          flags: 64
        });
      }

      delete veri.sesKanallari;
      delete veri.aktifSesKanali;
      veriYaz(veri);

      return interaction.reply({
        content: "<:tik_arviis:1046067679884234863> Tüm ses kanalları **sıfırlandı.**",
        flags: 64
      });
    }
  }
};
