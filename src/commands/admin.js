const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const database = require('../database');
const { buildLeaderboardEmbed } = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('admin')
    .setDescription('🔧 Comandi amministrativi (solo Admin)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

    // /admin punti
    .addSubcommand(sub =>
      sub.setName('punti')
        .setDescription('Aggiungi o rimuovi punti a un utente')
        .addUserOption(opt =>
          opt.setName('utente')
            .setDescription('Utente da modificare')
            .setRequired(true)
        )
        .addIntegerOption(opt =>
          opt.setName('quantita')
            .setDescription('Punti da aggiungere (positivo) o rimuovere (negativo). Es: +100 o -50')
            .setRequired(true)
        )
    )

    // /admin reset_utente
    .addSubcommand(sub =>
      sub.setName('reset_utente')
        .setDescription('Azzera tutti i dati (punti e voti) di un utente')
        .addUserOption(opt =>
          opt.setName('utente')
            .setDescription('Utente da resettare')
            .setRequired(true)
        )
    )

    // /admin reset_leaderboard
    .addSubcommand(sub =>
      sub.setName('reset_leaderboard')
        .setDescription('⚠️ Azzera TUTTI i punti di TUTTI gli utenti')
    ),

  async execute(interaction, client) {
    // Double-check admin
    const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
    if (!isAdmin) {
      return interaction.reply({
        content: '❌ Questo comando è riservato agli **Amministratori**!',
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: true });
    const sub = interaction.options.getSubcommand();

    // ── /admin punti ──────────────────────────────────────────
    if (sub === 'punti') {
      const targetUser = interaction.options.getUser('utente');
      const quantita = interaction.options.getInteger('quantita');

      await database.upsertUser(targetUser.id, targetUser.username);
      await database.setPoints(targetUser.id, quantita);

      const updated = await database.getUserPoints(targetUser.id);
      const sign = quantita >= 0 ? `+${quantita}` : `${quantita}`;

      return interaction.editReply({
        content: [
          `✅ Punti aggiornati per <@${targetUser.id}>`,
          `> **Modifica:** \`${sign}\` punti`,
          `> **Totale ora:** \`${updated.points}\` punti`,
        ].join('\n'),
      });
    }

    // ── /admin reset_utente ───────────────────────────────────
    if (sub === 'reset_utente') {
      const targetUser = interaction.options.getUser('utente');

      await database.resetUser(targetUser.id);

      return interaction.editReply({
        content: [
          `✅ Dati azzerati per <@${targetUser.id}>`,
          `> Punti, voti ricevuti e tutti i voti dati sono stati rimossi.`,
        ].join('\n'),
      });
    }

    // ── /admin reset_leaderboard ──────────────────────────────
    if (sub === 'reset_leaderboard') {
      await database.resetAllPoints();

      // Aggiorna anche il messaggio leaderboard se esiste
      try {
        const lbMsg = await database.getLeaderboardMessage(interaction.guild.id);
        if (lbMsg) {
          const channel = await client.channels.fetch(lbMsg.channel_id).catch(() => null);
          if (channel) {
            const message = await channel.messages.fetch(lbMsg.message_id).catch(() => null);
            if (message) {
              const embed = buildLeaderboardEmbed([]);
              await message.edit({ embeds: [embed] });
            }
          }
        }
      } catch (err) {
        console.error('Errore aggiornamento leaderboard dopo reset:', err);
      }

      return interaction.editReply({
        content: [
          `✅ **Leaderboard resettata!**`,
          `> Punti e voti di **tutti gli utenti** sono stati azzerati.`,
          `> La classifica è stata aggiornata.`,
        ].join('\n'),
      });
    }
  },
};
