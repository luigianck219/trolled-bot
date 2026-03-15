const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const database = require('../database');
const { buildLeaderboardEmbed } = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('🏆 Mostra o imposta la leaderboard dei punti')
    .addSubcommand(sub =>
      sub.setName('mostra')
        .setDescription('Mostra la classifica attuale')
    )
    .addSubcommand(sub =>
      sub.setName('imposta')
        .setDescription('Imposta questo canale come canale leaderboard (solo admin)')
    ),

  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: false });
    const sub = interaction.options.getSubcommand();

    if (sub === 'mostra') {
      const topUsers = await database.getTopUsers(10);
      const embed = buildLeaderboardEmbed(topUsers);
      return interaction.editReply({ embeds: [embed] });
    }

    if (sub === 'imposta') {
      const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
      if (!isAdmin) {
        return interaction.editReply({
          content: '❌ Solo gli amministratori possono impostare il canale leaderboard!',
        });
      }

      const topUsers = await database.getTopUsers(10);
      const embed = buildLeaderboardEmbed(topUsers);

      const msg = await interaction.channel.send({ embeds: [embed] });
      await database.setLeaderboardMessage(interaction.guild.id, interaction.channel.id, msg.id);

      await interaction.editReply({
        content: `✅ Canale leaderboard impostato! La classifica si aggiornerà automaticamente ogni 10 minuti.`,
      });
    }
  },
};
