const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { deployCommands } = require('./deploy-commands');
const database = require('./database');
const postCommand = require('./commands/post');
const puntiCommand = require('./commands/punti');
const leaderboardCommand = require('./commands/leaderboard');
const adminCommand = require('./commands/admin');
const voteHandler = require('./handlers/voteHandler');
const leaderboardUpdater = require('./handlers/leaderboardUpdater');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ],
});

client.commands = new Collection();
client.commands.set(postCommand.data.name, postCommand);
client.commands.set(puntiCommand.data.name, puntiCommand);
client.commands.set(leaderboardCommand.data.name, leaderboardCommand);
client.commands.set(adminCommand.data.name, adminCommand);

client.once('ready', async () => {
  console.log(`✅ Bot online come ${client.user.tag}`);
  await database.init();
  await deployCommands(client);
  leaderboardUpdater.start(client);
});

client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction, client);
    } catch (error) {
      console.error('Errore comando:', error);
      const msg = { content: '❌ Errore durante l\'esecuzione del comando.', ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(msg);
      } else {
        await interaction.reply(msg);
      }
    }
  }

  if (interaction.isButton()) {
    if (interaction.customId.startsWith('vote_')) {
      await voteHandler.handle(interaction, client);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
