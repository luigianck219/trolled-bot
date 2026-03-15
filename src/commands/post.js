const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { v4: uuidv4 } = require('uuid');
const database = require('../database');
const { buildPostEmbed, buildVoteButtons, parseVideoUrl } = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('post')
    .setDescription('📹 Pubblica una clip con sistema di votazione (solo staff)')
    .addStringOption(opt =>
      opt.setName('titolo')
        .setDescription('Titolo del post')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('video')
        .setDescription('Link del video (YouTube o Streamable)')
        .setRequired(true)
    )
    .addUserOption(opt =>
      opt.setName('utente')
        .setDescription('Utente a cui appartiene la clip')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('descrizione')
        .setDescription('Descrizione aggiuntiva (opzionale)')
        .setRequired(false)
    ),

  async execute(interaction, client) {
    // Check staff role
    const staffRoleName = process.env.STAFF_ROLE_NAME || 'Staff';
    const hasStaffRole = interaction.member.roles.cache.some(
      r => r.name.toLowerCase() === staffRoleName.toLowerCase()
    );
    const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);

    if (!hasStaffRole && !isAdmin) {
      return interaction.reply({
        content: '❌ Solo i membri con il ruolo **Staff** possono usare questo comando!',
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: true });

    const title = interaction.options.getString('titolo');
    const videoUrl = interaction.options.getString('video');
    const targetUser = interaction.options.getUser('utente');
    const description = interaction.options.getString('descrizione');

    // Validate URL
    const videoInfo = parseVideoUrl(videoUrl);
    if (videoInfo.type === 'unknown') {
      return interaction.editReply({
        content: '❌ URL non valido! Usa un link YouTube (`youtube.com` o `youtu.be`) o Streamable (`streamable.com`).',
      });
    }

    // Get post channel
    const postChannelId = process.env.POST_CHANNEL_ID;
    let postChannel = postChannelId ? interaction.guild.channels.cache.get(postChannelId) : interaction.channel;

    if (!postChannel) {
      postChannel = interaction.channel;
    }

    // Upsert the target user in DB
    await database.upsertUser(targetUser.id, targetUser.username);

    const postId = uuidv4();
    const embed = buildPostEmbed(title, videoUrl, `<@${targetUser.id}>`, description, postId);
    const voteRow = buildVoteButtons(postId);

    const message = await postChannel.send({
      embeds: [embed],
      components: [voteRow],
    });

    // Save post to DB
    await database.savePost(postId, message.id, postChannel.id, targetUser.id, title, videoUrl, description || '');

    await interaction.editReply({
      content: `✅ Post pubblicato con successo in ${postChannel}!`,
    });
  },
};
