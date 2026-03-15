const database = require('../database');
const { buildVoteRow, buildPostEmbed } = require('../utils/embeds');
const { EmbedBuilder } = require('discord.js');

async function handle(interaction, client) {
  // customId format: vote_{postId}_{stars}
  const parts = interaction.customId.split('_');
  // postId can contain dashes (UUID), so rejoin properly
  const stars = parseInt(parts[parts.length - 1]);
  const postId = parts.slice(1, parts.length - 1).join('_');

  if (isNaN(stars) || stars < 1 || stars > 5) {
    return interaction.reply({ content: '❌ Voto non valido.', ephemeral: true });
  }

  const post = await database.getPost(postId);
  if (!post) {
    return interaction.reply({ content: '❌ Post non trovato.', ephemeral: true });
  }

  // Prevent self-voting
  if (interaction.user.id === post.target_user_id) {
    return interaction.reply({
      content: '❌ Non puoi votare la tua stessa clip!',
      ephemeral: true,
    });
  }

  // Check if already voted
  const existingVote = await database.getVote(postId, interaction.user.id);
  if (existingVote) {
    return interaction.reply({
      content: `❌ Hai già votato questa clip con **${existingVote.stars}⭐**. Non puoi cambiare il voto!`,
      ephemeral: true,
    });
  }

  // Save vote
  await database.saveVote(postId, interaction.user.id, stars);

  // Add points to target user
  const targetUser = await client.users.fetch(post.target_user_id).catch(() => null);
  await database.upsertUser(post.target_user_id, targetUser?.username || 'Unknown');
  await database.addPoints(post.target_user_id, stars);

  // Update the message embed with new vote counts
  const voteStats = await database.getPostVotes(postId);
  const avgStr = voteStats.avg ? parseFloat(voteStats.avg).toFixed(1) : '0.0';

  try {
    // Update the embed footer with vote stats
    const message = interaction.message;
    const oldEmbed = message.embeds[0];

    const updatedEmbed = EmbedBuilder.from(oldEmbed)
      .setFooter({
        text: `🃏 TROLLED • ${voteStats.count} voti • Media: ${avgStr}⭐`,
      });

    await interaction.update({
      embeds: [updatedEmbed],
      components: message.components,
    });
  } catch (err) {
    console.error('Errore aggiornamento embed:', err);
    await interaction.reply({
      content: `✅ Hai votato **${stars}⭐** questa clip!`,
      ephemeral: true,
    }).catch(() => {});
    return;
  }

  // Notify with ephemeral
  await interaction.followUp({
    content: `✅ Hai votato **${stars}⭐** per questa clip! Punti aggiunti a <@${post.target_user_id}>.`,
    ephemeral: true,
  });
}

module.exports = { handle };
