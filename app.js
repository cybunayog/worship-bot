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
const ytdl = require("ytdl-core");

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
            embed
                .setAuthor("Worship Bot Commands to Use")
                .addFields(
                    {
                        name: "-help",
                        value: "Displays a list of commands available for this bot"
                    },
                    {
                        name: "-play",
                        value: "Plays a song based on the YouTube link.\n Example: -play https://www.youtube.com/watch?v=5qap5aO4i9A&ab_channel=ChilledCow"
                    },
                    {
                        name: "-skip",
                        value: "Skips the current song to the next queued song. If there are no songs in the queue, the bot will automatically stop."
                    },
                    {
                        name: "-stop",
                        value: "Stops the current song and turns the bot off."
                    },
            );

            channel.send(embed); 
            break;
        case "play":
            execute(msg, serverQueue);
            break;
        case "skip":
            skip(msg, serverQueue);
            break;
        case "stop":
            stop(msg, serverQueue);
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

/**
 *  Handles playing audio into voice channels.
 *
 *  @param  {Object}    msg         The message object.
 *  @param  {Object}    serverQueue The map of songs in the queue.
 */
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
    console.log("URL: " + args[1]);
    const songInfo = await ytdl.getInfo(args[1]);
    const song = {
        title: songInfo.videoDetails.title,
        url: songInfo.videoDetails.video_url
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
        queueConstruct.songs.push(song);

        try {
            var connection = await voiceChannel.join();
            queueConstruct.connection = connection;
            play(msg.guild, queueConstruct.songs[0]);
        } catch (err) {
            console.log(err);
            queue.delete(msg.guild.id);
            return channel.send(err);
        }
    } else {
        serverQueue.songs.push(song);
        return channel.send(`${song.title} has been added to the queue!`);
    }
}

/**
 *  Handles skipping function into voice channels.
 *
 *  @param  {Object}    msg         The message object.
 *  @param  {Object}    serverQueue The map of songs in the queue.
 */
function skip(msg, serverQueue) {
    const channel = msg.channel;
    if (!msg.member.voice.channel) {
        return channel.send(
            "You have to be in a voice channel to stop the music!"
        );
    }

    if (!serverQueue) {
        return channel.send(
            "There is no song I could skip!"
        );
    }

    serverQueue.connection.dispatcher.end();
}

/**
 *  Handles stopping audio into voice channels.
 *
 *  @param  {Object}    msg         The message object.
 *  @param  {Object}    serverQueue The map of songs in the queue.
 */
function stop(msg, serverQueue) {
    const channel = msg.channel;
    if (!msg.member.voice.channel) {
        return channel.send(
            "You have to be in a voice channel to stop the music!"
        );
    }
    serverQueue.songs = [];
    serverQueue.connection.dispatcher.end();
}

/**
 *  Handles play function into voice channels.
 *
 *  @param  {Object}    guild         The guild object.
 *  @param  {String}    song          The song entered into the query.
 */
function play(guild, song) {
    const serverQueue = queue.get(guild.id);
    if (!song) {
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }

    const dispatcher = serverQueue.connection
        .play(ytdl(song.url))
        .on("finish", () => {
            serverQueue.songs.shift();
            play(guild, serverQueue.songs[0]);
        })
        .on("error", error => console.error(error));
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    serverQueue.textChannel.send(`Start playing: **${song.title}**`)
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
