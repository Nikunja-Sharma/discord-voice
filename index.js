//.env
require("dotenv").config();

const { Client, GatewayIntentBits } = require("discord.js");
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

const triggerChannelId = process.env.TRIGGER_CHANNEL_ID; // ID of the channel that triggers new voice channels creation
const categoryId = process.env.CATEGORY_ID; // Replace with your actual category ID
let activeDuoChannels = new Set(); // Keep track of active Duo channels

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("voiceStateUpdate", async (oldState, newState) => {
  // User joins the trigger channel
  if (newState.channelId === triggerChannelId) {
    // Determine the name for the new Duo channel
    let newChannelName = `Duo 1`;
    let i = 1;
    while (activeDuoChannels.has(newChannelName)) {
      i++;
      newChannelName = `Duo ${i}`;
    }

    // Create the new Duo channel
    const newChannel = await newState.guild.channels.create({
      name: newChannelName,
      type: 2, // Voice channel
      parent: categoryId,
      userLimit: 2,
    });

    // Add the new channel to the tracking set
    activeDuoChannels.add(newChannelName);

    // Move the user to the new channel
    await newState.setChannel(newChannel);
    // Fetch and log all channels in the specified category
    const category = await client.channels.fetch(categoryId);
    const channelsInCategory = category.children.cache.sort(
      (a, b) => a.position - b.position
    );
    console.log(`Channels in category '${category.name}':`);
    channelsInCategory.forEach((channel) =>
      console.log(`${channel.name} (ID: ${channel.id})`)
    );
  }

  // User leaves a channel
  try {
    if (oldState.channelId && activeDuoChannels.has(oldState.channel.name)) {
      const channel = await client.channels.fetch(oldState.channelId);
      if (channel.members.size === 0) {
        // Channel is empty
        activeDuoChannels.delete(channel.name); // Remove from tracking set
        await channel.delete(); // Delete the channel
      }
    }
  } catch (error) {
    console.error(`Failed to delete channel: ${error}`);
  }
});

client.login(process.env.TOKEN);
