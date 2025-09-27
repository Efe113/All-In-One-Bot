const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const YAML_PATH = path.join(__dirname, '../../Database/builds.yaml');

function readBuilds() {
  if (!fs.existsSync(YAML_PATH)) return { builds: {}, lastKey: null };
  return yaml.load(fs.readFileSync(YAML_PATH, 'utf8')) || { builds: {}, lastKey: null };
}

function writeBuilds(data) {
  fs.writeFileSync(YAML_PATH, yaml.dump(data), 'utf8');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('build')
    .setDescription('Build işlemleri')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('ekle')
        .setDescription('Yeni build verisi ekler.')
        .addStringOption(opt => opt.setName('guncelleme-adi').setDescription('Güncelleme Adı').setRequired(true))
        .addStringOption(opt => opt.setName('duzeltmeler').setDescription('Düzeltmeler').setRequired(true))
        .addStringOption(opt => opt.setName('yenilikler').setDescription('Yenilikler').setRequired(true))
        .addStringOption(opt => opt.setName('yapim-aşamasinda').setDescription('Yapım Aşamasında Olanlar').setRequired(true))
        .addStringOption(opt => opt.setName('yakinda-gelecekler').setDescription('Yakında Gelecekler').setRequired(true))
        .addStringOption(opt => opt.setName('kaldirilanlar').setDescription('Kaldırılanlar').setRequired(true))
        .addStringOption(opt => opt.setName('not').setDescription('Notlar').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('yayınla')
        .setDescription('En son eklenen build verisini yayınlar.')
        .addStringOption(opt => opt.setName('buildid').setDescription('Build ID').setRequired(true))
        .addStringOption(opt => opt.setName('number').setDescription('Güncelleme Numarası').setRequired(true))
        .addStringOption(opt => opt.setName('hash').setDescription('Build Hash').setRequired(true))
        .addStringOption(opt =>
          opt.setName('tip')
            .setDescription('Build tipi')
            .addChoices(
              { name: 'Çıkış Yaptı', value: 'Çıkış Yaptı' },
              { name: 'Beta', value: 'Beta' },
              { name: 'Erken Erişim', value: 'Erken Erişim' }
            )
            .setRequired(true)
        )
        .addChannelOption(opt =>
          opt.setName('kanal')
            .setDescription('Mesajın gönderileceği kanal')
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            .setRequired(true)
        )
        .addRoleOption(opt =>
          opt.setName('rol')
            .setDescription('Etiketlenecek rol')
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const sahipID = "640056735700221953"; 
    if (interaction.user.id !== sahipID) {
      return interaction.reply({ content: "<a:dikkat_arviis:1421402093876674641> **Bu komutu sadece <@640056735700221953> kullanabilir.**", flags: 64 });
    }
    
    const subcommand = interaction.options.getSubcommand();
    const buildData = readBuilds();

    if (subcommand === 'ekle') {
      const clientKey = interaction.options.getString('guncelleme-adi');
      buildData.builds[clientKey] = {
        Endpoints: interaction.options.getString('duzeltmeler'),
        Strings: interaction.options.getString('yenilikler'),
        Experiments: interaction.options.getString('yapim-aşamasinda'),
        Scripts: interaction.options.getString('yakinda-gelecekler'),
        'Kaldırılanlar': interaction.options.getString('kaldirilanlar'),
        'Notlar': interaction.options.getString('not')
      };
      buildData.lastKey = clientKey;

      writeBuilds(buildData);

      return interaction.reply({
        content: `<:tik_arviis:1046067679884234863> \`${clientKey}\` için build verileri **kaydedildi.**`,
        flags: 64
      });
    }

    if (subcommand === 'yayınla') {
      const buildId = interaction.options.getString('buildid');
      const buildNumber = interaction.options.getString('number');
      const buildHash = interaction.options.getString('hash');
      const tip = interaction.options.getString('tip');
      const kanal = interaction.options.getChannel('kanal');
      const rol = interaction.options.getRole('rol');

      const clientKey = buildData.lastKey;
      const data = buildData.builds[clientKey];

      if (!data) {
        return interaction.reply({
          content: '<a:dikkat_arviis:997074866371039322> **Önce `/build ekle` komutu ile veri gir.**',
          flags: 64
        });
      }

      buildData.builds[buildId] = data; 
      writeBuilds(buildData);

      const thumbnails = {
        Stable: 'https://media.discordapp.net/attachments/1069639498637525043/1367121521155244165/discord-logo-7A1EC3216C-seeklogo.com.png',
        Canary: 'https://media.discordapp.net/attachments/1069639498637525043/1367121520920367155/Discord_Canary.png',
        PTB: 'https://media.discordapp.net/attachments/1069639498637525043/1367121521444786176/discord-logo-logodownload-download-logotipos-1.png'
      };

      const embed = new EmbedBuilder()
        .setTitle(`🆕 (${tip}) Yaması Yayınlandı!`)
        .setColor('Orange')
        .setThumbnail(thumbnails[tip])
        .addFields(
          { name: 'Güncelleme Adı', value: `\`${buildId}\``, inline: true },
          { name: 'Güncelleme Numarası', value: `\`${buildNumber}\``, inline: true },
          { name: 'Build Hash', value: `\`${buildHash}\``, inline: false },
          { name: 'Tarih', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
        );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`build_details_${buildId}`)
          .setLabel('Detayları Göster')
          .setEmoji('<:sadesagok_arviis:1109797490665996349>')
          .setStyle(ButtonStyle.Primary)
      );

      await kanal.send({ content: `<@&${rol.id}>`, embeds: [embed], components: [row] });

      return interaction.reply({
        content: `<:tik_arviis:1046067679884234863> Build mesajı **(** <#${kanal.id}> **)** kanalına gönderildi.`,
        flags: 64
      });
    }
  },

  runEvent(client) {
    client.on('interactionCreate', async (interaction) => {
      if (!interaction.isButton()) return;

      const customId = interaction.customId;
      if (customId.startsWith('build_details_')) {
        const buildId = customId.replace('build_details_', '');
        const buildData = readBuilds();
        const data = buildData.builds[buildId];

        if (!data) {
          return interaction.reply({
            content: '<:uzgunpanda_arviis:1050827763516444713> Veri bulunamadı.',
            flags: 64
          });
        }

        const response = `
<:hashtag_arviis:1421409016701128794> **Düzeltmeler:** \`${data["Endpoints"] || 'Yok'}\`
<:hashtag_arviis:1421409016701128794> **Yenilikler:** \`${data["Strings"] || 'Yok'}\`
<:hashtag_arviis:1421409016701128794> **Yapım Aşamasında Olanlar:** \`${data["Experiments"] || 'Yok'}\`
<:hashtag_arviis:1421409016701128794> **Yakında Gelecekler:** \`${data["Scripts"] || 'Yok'}\`
<:hashtag_arviis:1421409016701128794> **Kaldırılanlar:** \`${data["Base Scripts"] || 'Yok'}\`
<:hashtag_arviis:1421409016701128794> **Notlar:** \`${data["Lazy-loaded Scripts"] || 'Yok'}\`
`;
        await interaction.reply({ content: response, flags: 64 }).catch(console.error);
      }
    });
  }
};
