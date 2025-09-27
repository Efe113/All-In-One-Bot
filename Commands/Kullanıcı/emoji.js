const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('emoji')
    .setDescription('Emoji ile ilgili işlemler yapar.')
    .addSubcommand(sub =>
      sub.setName('ekle')
        .setDescription('Sunucuya emoji ekler.')
        .addStringOption(opt =>
          opt.setName('emoji')
            .setDescription('Emoji gir.')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('bilgi')
        .setDescription('Emoji hakkında bilgi verir.')
        .addStringOption(opt =>
          opt.setName('emoji')
            .setDescription('Emoji gir.')
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const emojiStr = interaction.options.getString('emoji');

    const match = emojiStr.match(/<(a)?:([\w_]+):(\d+)>/);
    if (!match) return interaction.reply({ content: '<a:dikkat_arviis:1421402093876674641> **Geçerli emoji(ler) gir.**', flags: 64 });

    const animated = Boolean(match[1]);
    const name = match[2];
    const id = match[3];
    const emojiURL = `https://cdn.discordapp.com/emojis/${id}.${animated ? 'gif' : 'png'}?size=512`;

    if (sub === 'ekle') {
  if (!interaction.member.permissions.has(PermissionFlagsBits.ManageEmojisAndStickers)) {
    return interaction.reply({ content: '<a:dikkat_arviis:1421402093876674641> **Bu komutu kullanmak için gerekli yetkilerin yok.**', flags: 64 });
  }

  const matches = [...emojiStr.matchAll(/<(a)?:([\w_]+):(\d+)>/g)];

  if (!matches.length) {
    return interaction.reply({ content: '<a:dikkat_arviis:1421402093876674641> **Geçerli emoji(ler) gir.**', flags: 64 });
  }

  const added = [];

  for (const match of matches) {
    const animated = Boolean(match[1]);
    const name = match[2];
    const id = match[3];
    const url = `https://cdn.discordapp.com/emojis/${id}.${animated ? 'gif' : 'png'}?size=512`;

    try {
      const emoji = await interaction.guild.emojis.create({
        name,
        attachment: url
      });

      added.push(`<${animated ? 'a' : ''}:${name}:${emoji.id}>`);
    } catch (err) {
      console.error(`Emoji eklenemedi ( ${name} ):`, err);
    }
  }

  if (added.length === 0) {
    return interaction.reply({ content: '<a:dikkat_arviis:1421402093876674641> **Emoji(ler) eklenemedi.**', flags: 64 });
  }

  return interaction.reply({
    content: `<:tik_arviis:1421412906435739698> ${added.length} emoji **eklendi.** \n${added.join(' ')}`,
    flags: 64
  });
}

    if (sub === 'bilgi') {
  const emojis = [...emojiStr.matchAll(/<(a)?:([\w_]+):(\d+)>/g)];

  if (!emojis.length) {
    return interaction.reply({ content: '<a:dikkat_arviis:1421402093876674641> **Geçerli emoji(ler) gir.**', flags: 64 });
  }

  let page = 0;

  const getEmbed = (index) => {
    const [ , animated, name, id ] = emojis[index];
    const url = `https://cdn.discordapp.com/emojis/${id}.${animated ? 'gif' : 'png'}?size=512`;
    return new EmbedBuilder()
      .setDescription(`\`${name}\` \`${id}\``)
      .setImage(url)
      .setColor('Blurple');
  };

  const row = (current, total) => {
  const [ , animated, , id ] = emojis[current];
  const url = `https://cdn.discordapp.com/emojis/${id}.${animated ? 'gif' : 'png'}?size=512`;

  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('prev')
      .setEmoji('⬅️')
      .setStyle(ButtonStyle.Success)
      .setDisabled(current === 0),
    new ButtonBuilder()
      .setCustomId('sayfa')
      .setLabel(`${current + 1}/${total}`)
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId('next')
      .setEmoji('➡️')
      .setStyle(ButtonStyle.Success)
      .setDisabled(current === total - 1),
      
    new ButtonBuilder()
      .setLabel('Emojiyi İndir')
      .setStyle(ButtonStyle.Link)
      .setURL(url)
  );
};

  await interaction.reply({
    embeds: [getEmbed(page)],
    components: [row(page, emojis.length)]
  });

  const reply = await interaction.fetchReply();

  const collector = reply.createMessageComponentCollector({
    filter: i => i.user.id === interaction.user.id,
    time: 60_000
  });

  collector.on('collect', async i => {
    if (i.customId === 'prev') page--;
    if (i.customId === 'next') page++;

    await i.update({
      embeds: [getEmbed(page)],
      components: [row(page, emojis.length)]
    });
  });

  collector.on('end', async () => {
    const disabledRow = row(page, emojis.length).setComponents(
      row(page, emojis.length).components.map(btn => btn.setDisabled(true))
    );
    await reply.edit({
      embeds: [getEmbed(page)],
      components: [disabledRow]
    }).catch(() => {});
  });
    }
  }
};
