const { REST, Routes } = require('discord.js');
const postCommand = require('./commands/post');
const puntiCommand = require('./commands/punti');
const leaderboardCommand = require('./commands/leaderboard');
const adminCommand = require('./commands/admin');

async function deployCommands(client) {
  const commands = [
    postCommand.data.toJSON(),
    puntiCommand.data.toJSON(),
    leaderboardCommand.data.toJSON(),
    adminCommand.data.toJSON(),
  ];

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

  try {
    console.log('⏳ Registrazione comandi slash...');
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );
    console.log('✅ Comandi slash registrati globalmente');
  } catch (error) {
    console.error('❌ Errore registrazione comandi:', error);
  }
}

module.exports = { deployCommands };
