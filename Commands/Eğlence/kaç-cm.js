const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const path = require("path");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("kaç-cm")
    .setDescription("Acaba kaç santim?"),

  async execute(interaction) {
    const cm = Math.floor(Math.random() * 100);

    let yorum;
    if (cm >= 70) yorum = "<a:mutlupanda_arviis:1421409835160834098> Vay canına! \n\n<:kalpanda_arviis:1421409341658894346> Sektörün lideri geldi!";
    else if (cm >= 40) yorum = "<a:kertenkelehehe_arviis:1421409406754750464> Fena değil! \n\n<:kalpanda_arviis:1421409341658894346> Kızların gözdesi misin nesin!";
    else yorum = "<:uzgunpanda_arviis:1421413190092460102> Eh işte... \n\n<:kalpanda_arviis:1421409341658894346> Merak etme ameliyatları var, haha!";

    const mesaj = 
      `📏 **Kaç Santim?**\n` +
      `\`${cm} Santimetre\`  **${yorum}**`

    const gifPath = path.join(__dirname, "../../assets/Eğlence/kaccm.gif");
    const attachment = new AttachmentBuilder(gifPath);

    await interaction.reply({
      content: mesaj,
      files: [attachment]
    });
  }
};
