# Discord Voice Channel Manager Bot

This Discord bot, built using the discord.js library, dynamically creates and deletes voice channels in a Discord server based on user activity. It listens for users joining a specific "trigger" voice channel and automatically creates a new, temporary "Duo" voice channel for them. When the channel becomes empty, it is automatically deleted.

## Features

- **Dynamic Voice Channel Creation:** Automatically creates a new voice channel when a user joins a designated trigger channel.
- **Automatic Channel Cleanup:** Deletes the voice channel when it becomes empty, keeping your server clean and organized.
- **Customizable:** Easily set the trigger channel and category for new channels through environment variables.

## Setup

1. **Install Dependencies:**
Ensure you have Node.js 16.11.0 or newer installed. Then, install the required packages:
    
    ```bash
    npm install discord.js dotenv
    
    ```
    
    ([discord.js Documentation](https://discord.js.org/docs/packages/discord.js/14.14.1))
    
2. **Configure Environment Variables:**
Create a `.env` file in your project root with the following variables:
    
    ```
    TOKEN=Your_Discord_Bot_Token
    TRIGGER_CHANNEL_ID=ID_of_Trigger_Channel
    CATEGORY_ID=ID_of_Category_for_New_Channels
    
    ```
    
3. **Run the Bot:**
Start your bot by running:
    
    ```bash
    node index.js
    
    ```
    

## How It Works

- The bot listens for the `voiceStateUpdate` event to detect when a user joins or leaves a voice channel.
- If a user joins the designated trigger channel, the bot creates a new voice channel named "Duo 1", "Duo 2", etc., under a specified category, and moves the user to this new channel.
- The bot tracks active "Duo" channels in a `Set` to ensure unique names and to manage cleanup.
- When a user leaves a "Duo" channel and it becomes empty, the bot deletes the channel to avoid clutter.

## Code Snippets

- **Bot Initialization and Event Listeners:**

```
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

```

- **Handling Voice State Updates (Creating and Deleting Channels):**

```
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
}

```

## Note

- Ensure your bot has the necessary permissions in your Discord server to create and delete channels, and to move users between channels.
- Customize the trigger channel and category IDs to fit your server's structure.

For more detailed information on discord.js and its capabilities, refer to the [official documentation](https://discord.js.org/docs/packages/discord.js/14.14.1).