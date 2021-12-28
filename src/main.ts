import { QbotClient } from './structures/QbotClient';
import { Client as RobloxClient } from 'bloxy';
import { handleInteraction } from './handlers/handleInteraction';
import { handleLegacyCommand } from './handlers/handleLegacyCommand';
import { config } from './config'; 
import { Group } from 'bloxy/dist/structures';
import { recordShout } from './events/shout';
import { checkSuspensions } from './events/suspensions';
import { recordAuditLogs } from './events/audit';
import { recordMemberCount } from './events/member';
import { recordGroupWallPosts } from './events/wall';
require('dotenv').config();
require('./database/router');
require('./api');

// [Clients]
const discordClient = new QbotClient();
discordClient.login(process.env.token);
const robloxClient = new RobloxClient({ credentials: { cookie: process.env.ROBLOX_COOKIE } });
let robloxGroup: Group = null;
(async () => {
    await robloxClient.login().catch(console.error);
    robloxGroup = await robloxClient.getGroup(config.groupId);
    
    // [Events]
    checkSuspensions();
    if(config.logChannels.shout) recordShout();
    if(config.logChannels.wall) recordGroupWallPosts();
    if(config.recordManualActions) recordAuditLogs();
    if(config.memberCount.enabled) recordMemberCount();
})();

// [Handlers]
discordClient.on('interactionCreate', handleInteraction);
discordClient.on('messageCreate', handleLegacyCommand);

// [Module]
export { discordClient, robloxClient, robloxGroup };