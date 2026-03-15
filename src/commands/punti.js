const { SlashCommandBuilder } = require('discord.js');
const database = require('../database');
const { buildPuntiEmbed } = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('punti')
    .setDescription('⭐ Visualizza i punti di un utente')
    .addUserOption(opt =>
      opt.setName('utente')
        .setDescription('Utente di cui vedere i punti (lascia vuoto per i tuoi)')
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: false });

    const targetMember = interaction.options.getMember('utente') || interaction.member;
    const targetUser = targetMember.user;

    // Ensure user exists in DB
    await database.upsertUser(targetUser.id, targetUser.username);

    const userData = await database.getUserPoints(targetUser.id);
    const embed = buildPuntiEmbed(userData, targetMember);

    await interaction.editReply({ embeds: [embed] });
  },
};
