const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const COLORS = {
  RED: 0xE01B1B,
  DARK: 0x0D1117,
  WHITE: 0xFFFFFF,
  GOLD: 0xFFD700,
};

function buildPostEmbed(title, videoUrl, targetUser, description, postId) {
  const embed = new EmbedBuilder()
    .setColor(COLORS.RED)
    .setTitle(`🎬 ${title}`)
    .setFooter({
      text: `🃏 TROLLED • Vota la clip!`,
    })
    .setTimestamp();

  // Video preview
  const videoInfo = parseVideoUrl(videoUrl);

  let descriptionText = '';
  if (description) {
    descriptionText += `📝 **${description}**\n\n`;
  }
  descriptionText += `🎥 **Clip di:** ${targetUser}\n`;
  descriptionText += `🔗 **[▶️ Guarda il video](${videoUrl})**\n`;

  if (videoInfo.type === 'youtube') {
    embed.setImage(`https://img.youtube.com/vi/${videoInfo.id}/maxresdefault.jpg`);
    descriptionText += `\n> 📺 *YouTube • Clicca il link per guardare*`;
  } else if (videoInfo.type === 'streamable') {
    descriptionText += `\n> 🎬 *Streamable • Clicca il link per guardare*`;
  }

  embed.setDescription(descriptionText);

  return embed;
}

function buildVoteButtons(postId, votes = {}) {
  const stars = [1, 2, 3, 4, 5];
  const row = new ActionRowBuilder();

  for (const star of stars) {
    const emoji = getStarEmoji(star);
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`vote_${postId}_${star}`)
        .setLabel(`${emoji} ${star}`)
        .setStyle(ButtonStyle.Secondary)
    );
  }

  return row;
}

function buildVoteRow(postId, userVote = null, voteCount = 0, avgStars = 0) {
  const stars = [1, 2, 3, 4, 5];
  const row = new ActionRowBuilder();

  for (const star of stars) {
    const isVoted = userVote === star;
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`vote_${postId}_${star}`)
        .setLabel(`${star}⭐`)
        .setStyle(isVoted ? ButtonStyle.Danger : ButtonStyle.Secondary)
    );
  }

  return row;
}

function getStarEmoji(star) {
  const emojis = ['', '⭐', '⭐', '⭐', '⭐', '⭐'];
  return emojis[star] || '⭐';
}

function parseVideoUrl(url) {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return { type: 'youtube', id: ytMatch[1] };

  // Streamable
  const stMatch = url.match(/streamable\.com\/([a-zA-Z0-9]+)/);
  if (stMatch) return { type: 'streamable', id: stMatch[1] };

  return { type: 'unknown', id: null };
}

function buildLeaderboardEmbed(topUsers) {
  const embed = new EmbedBuilder()
    .setColor(COLORS.RED)
    .setTitle('🏆 TROLLED — LEADERBOARD')
    .setTimestamp()
    .setFooter({ text: '🃏 TROLLED • Aggiornata automaticamente' });

  if (topUsers.length === 0) {
    embed.setDescription('> *Nessun utente in classifica ancora.*\n> Inizia a votare le clip!');
    return embed;
  }

  const medals = ['🥇', '🥈', '🥉'];
  let description = '';

  topUsers.forEach((user, index) => {
    const position = index + 1;
    const medal = medals[index] || `**${position}.**`;
    const avg = user.total_votes > 0 ? (user.points / user.total_votes).toFixed(1) : '0.0';
    description += `${medal} <@${user.user_id}>\n`;
    description += `   ┣ ⭐ **${user.points} punti** • 🗳️ ${user.total_votes} voti • 📊 Media: ${avg}\n\n`;
  });

  embed.setDescription(description);
  return embed;
}

function buildPuntiEmbed(user, targetUser) {
  const avg = user.total_votes > 0 ? (user.points / user.total_votes).toFixed(1) : '0.0';

  const embed = new EmbedBuilder()
    .setColor(COLORS.RED)
    .setTitle(`🃏 Punti di ${targetUser.username || targetUser.displayName}`)
    .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
    .addFields(
      { name: '⭐ Punti totali', value: `\`${user.points}\``, inline: true },
      { name: '🗳️ Voti ricevuti', value: `\`${user.total_votes}\``, inline: true },
      { name: '📊 Media voti', value: `\`${avg}/5\``, inline: true },
    )
    .setFooter({ text: '🃏 TROLLED' })
    .setTimestamp();

  return embed;
}

module.exports = {
  buildPostEmbed,
  buildVoteButtons,
  buildVoteRow,
  buildLeaderboardEmbed,
  buildPuntiEmbed,
  parseVideoUrl,
  COLORS,
};
