const database = require('../database');
const { buildLeaderboardEmbed } = require('../utils/embeds');

const UPDATE_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

function start(client) {
  console.log('⏱️ Leaderboard auto-updater avviato (ogni 10 minuti)');

  const update = async () => {
    try {
      // Fetch all guilds the bot is in
      for (const [guildId] of client.guilds.cache) {
        const lbMsg = await database.getLeaderboardMessage(guildId);
        if (!lbMsg) continue;

        const channel = await client.channels.fetch(lbMsg.channel_id).catch(() => null);
        if (!channel) continue;

        const message = await channel.messages.fetch(lbMsg.message_id).catch(() => null);
        if (!message) continue;

        const topUsers = await database.getTopUsers(10);
        const embed = buildLeaderboardEmbed(topUsers);

        await message.edit({ embeds: [embed] });
        console.log(`✅ Leaderboard aggiornata per guild ${guildId}`);
      }
    } catch (err) {
      console.error('❌ Errore aggiornamento leaderboard:', err);
    }
  };

  // Run immediately on start, then every interval
  setTimeout(update, 5000);
  setInterval(update, UPDATE_INTERVAL_MS);
}

module.exports = { start };
