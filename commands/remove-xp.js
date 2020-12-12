const roblox = require('noblox.js');
const Discord = require('discord.js');
const path = require('path');
require('dotenv').config();

const config = {
    description: 'Decreases a user\'s XP count.',
    aliases: ['removexp'],
    usage: '<username> <decrement>',
    rolesRequired: ['Ranking Permissions', 'XP Permissions']
}

module.exports = {
    config,
    run: async (client, message, args) => {
        let embed = new Discord.MessageEmbed();

        if(!client.constants.xpRankup.enabled) {
            embed.setDescription(`The XP Rankup system must be enabled in the bot configuration.`);
            embed.setColor(client.constants.colors.error);
            embed.setAuthor(message.author.tag, message.author.displayAvatarURL());
            return message.channel.send(embed);
        }

        let username = args[0];
        if(!username) {
            embed.setDescription(`Missing arguments.\n\nUsage: \`${process.env.prefix}${path.basename(__filename).split('.')[0]}${' ' + config.usage || ''}\``);
            embed.setColor(client.constants.colors.error);
            embed.setAuthor(message.author.tag, message.author.displayAvatarURL());
            return message.channel.send(embed);
        }
        
        let id = await roblox.getIdFromUsername(username).catch(async (err) => {
            embed.setDescription(`${username} is not a Roblox user.`);
            embed.setColor(client.constants.colors.error);
            embed.setAuthor(message.author.tag, message.author.displayAvatarURL());
            return message.channel.send(embed);
        });

        let rankInGroup = await roblox.getRankInGroup(Number(process.env.group.id), id);

        if(process.env.verificationChecks === 'true') {
            let linkedUser = await client.utils.getLinkedUser(message.author.id, message.guild.id);
            if(!linkedUser) {
                embed.setDescription('You must be verified on either of the sites below to use this command.\n\n**Bloxlink:** https://blox.link\n**RoVer:** https://verify.eryn.io');
                embed.setColor(client.constants.colors.error);
                embed.setAuthor(message.author.tag, message.author.displayAvatarURL());
                return message.channel.send(embed);
            }

            if(linkedUser === 'RATE_LIMITS') {
                embed.setDescription('Verification checks are currently on cooldown.');
                embed.setColor(client.constants.colors.error);
                embed.setAuthor(message.author.tag, message.author.displayAvatarURL());
                return message.channel.send(embed);
            }

            if(linkedUser === id) {
                embed.setDescription('You can\'t rank yourself!');
                embed.setColor(client.constants.colors.error);
                embed.setAuthor(message.author.tag, message.author.displayAvatarURL());
                return message.channel.send(embed);
            }

            let linkedUserRankInGroup = await roblox.getRankInGroup(Number(process.env.group.id), linkedUser);
            if(rankInGroup >= linkedUserRankInGroup) {
                embed.setDescription('You can only change the XP count of people with a rank lower than yours.');
                embed.setColor(client.constants.colors.error);
                embed.setAuthor(message.author.tag, message.author.displayAvatarURL());
                return message.channel.send(embed);
            }
        }

        let decrement = args[1];
        if(!decrement) {
            embed.setDescription(`Missing arguments.\n\nUsage: \`${process.env.prefix}${path.basename(__filename).split('.')[0]}${' ' + config.usage || ''}\``);
            embed.setColor(client.constants.colors.error);
            embed.setAuthor(message.author.tag, message.author.displayAvatarURL());
            return message.channel.send(embed);
        }

        let xpInfo = await client.databases.xp.findOrCreate({
            where: {
                userId: id
            },
            defaults: {
                userId: id,
                xp: 0
            }
        });

        let beforeChangeXP = xpInfo.xp;

        xpInfo[0].decrement('xp', { by: decrement });

        let displayUsername = await roblox.getUsernameFromId(id);
        embed.setDescription(`Removed \`${decrement}xp\` from ${displayUsername}'s XP count. They now have \`${xpInfo[0].dataValues.xp}xp\`.`);
        embed.setColor(client.constants.colors.success);
        embed.setAuthor(message.author.tag, message.author.displayAvatarURL());
        message.channel.send(embed);

        if(process.env.logChannelId !== 'false') {
            let logEmbed = new Discord.MessageEmbed();
            let logChannel = await client.channels.fetch(process.env.logChannelId);
            logEmbed.setDescription(`**Moderator:** <@${message.author.id}> (\`${message.author.id}\`)\n**Action:** Remove XP\n**User:** ${username} (\`${id}\`)\n**XP Change:** ${beforeChangeXP} -> ${xpInfo.xp} (removed ${decrement})`);
            logEmbed.setColor(client.constants.colors.info);
            logEmbed.setAuthor(message.author.tag, message.author.displayAvatarURL());
            logEmbed.setTimestamp();
            logEmbed.setThumbnail(`https://www.roblox.com/Thumbs/Avatar.ashx?x=150&y=150&format=png&username=${username}`);
            return logChannel.send(logEmbed);
        } else {
            return;
        }
    }
}