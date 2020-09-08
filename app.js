/**
 *  app.js
 *
 *  Discord bot template.
 */

/*******************
 * Library Imports *
 *******************/
const colors = require("chalk");
const Discord = require("discord.js");
require('dotenv').config();

/*********************
 * Global Properties *
 *********************/

// Config properties
const CONFIG = {
    // Bot token
    token: process.env.DISCORD_TOKEN,
    // Activity shown when the bot appears 'online'
    defaultActivity: {
        type: "LISTENING", // Activity types: 'PLAYING', 'STREAMING', 'LISTENING', 'WATCHING'
        message: "-help",
    },
};

const queue = new Map();
/*************
 * Functions *
 *************/

/**
 *  Handle a command from a Discord user.
 *
 *  @param  {Object}    msg         The message object.
 *  @param  {String}    command     The `commandName` part of the message.
 *  @param  {Array}     args        The optional list of arguments from the message.
 *
 *  @note - Discord messages which are treated as commands are expected to look like: "!commandName arg1 arg2 arg3".
 */
function handleCommand(msg, cmd, args) {
    const serverQueue = queue.get(msg.guild.id),
        channel = msg.channel,
        embed = new Discord.MessageEmbed();

    switch (cmd) {
        case "help":
            channel.send("1...");
            channel.send("2...");
            channel.send("3!");
            break;
        case "play":
            channel.send("3...");
            channel.send("2...");
            channel.send("1!");
            break;
        case "skip":

            break;
        case "stop":

            break;
        default:
            msg.reply(
                `You used the command '!${cmd}' with these arguments: [${args.join(
                    ", "
                )}]`
            );
            break;
    }
}

async function execute(msg, serverQueue) {
    const args = msg.content.split(" "),
        channel = msg.channel;

    const voiceChannel = msg.member.voice.channel;
    if (!voiceChannel) {
        return channel.send(
            "You need to be in a voice channel to play some tunes!"
        );
    }

    const permissions = voiceChannel.permissionsFor(msg.client.user);
    if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
        return channel.send(
            "I need the permissions to join and speak in your voice channel!"
        );
    }

    const songInfo = await yudl.getInfo(args[1]);
    const song = {
        title: songInfo.title,
        url: songInfo.video_url
    };

    if (!serverQueue) {
        const queueConstruct = {
            textChannel: channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 4,
            playing: true
        };

        queue.set(msg.guild.id, queueConstruct);

        queueConstuct.songs.push(song);

        try {
            var connection = await voiceChannel.join();
            queueConstruct.connection = connection;
            play(msg.guild, queueConstruct.songs[0]);
        } catch (err) {
            console.log(err);
            queue.delete(message.guild.id);
            return channel.send(err);
        }
    } else {
        serverQueue.songs.push(song);
        return channel.send(`${song.title} has been added to the queue!`);
    }
}

function skip(msg, serverQueue) {

}

function stop(msg, serverQueue) {

}
/**
 *  Print a Discord message to the console with colors for readability.
 *
 *  @param  {Object}     msg     The message object.
 */
function logMessageWithColors(msg) {
    const d = new Date(msg.createdTimestamp),
        h = d.getHours(),
        m = d.getMinutes(),
        s = d.getSeconds(),
        time = colors.grey(`[${h}:${m}:${s}]`),
        author = colors.cyan(`@${msg.author.username}`);

    console.log(`${time} ${author}: ${msg.content}`);
}

/**************************
 * Discord Initialization *
 **************************/

const client = new Discord.Client();

// Handle bot connected to the server
client.on("ready", () => {
    console.log(colors.green(`Logged in as: ${client.user.tag}`));

    // Set the bot's activity
    client.user
        .setActivity(CONFIG.defaultActivity.message, {
            type: CONFIG.defaultActivity.type,
        })
        .then();
});

client.once('reconnecting', () => {
    console.log('Reconnecting!');
});

client.once('disconnect', () => {
    console.log('Disconnecting!');
});

// Handle message from user
client.on("message", async msg => {
    let words, cmd, args = "";

    // Message is a command (preceded by an exclaimation mark)
    if (msg.content[0] === "-") {
        words = msg.content.split(" "),
        cmd = words.shift().split("-")[1],
        args = words;

        handleCommand(msg, cmd, args);
        return;
    } 
    // Handle messages that aren't commands
    if (msg.content === "ping") {
        msg.reply("pong");
    }
});



// Login with the bot's token
client.login(CONFIG.token).then();
