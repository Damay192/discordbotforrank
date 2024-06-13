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
import { clearActions } from './handlers/abuseDetection';
import { checkBans } from './events/bans';
import { checkWallForAds } from './events/wall';
require('dotenv').config();

// [Ensure Setup]
if(!process.env.ROBLOX_COOKIE) {_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_A83EE7A146391D63EC43959BDCBDD94992E853B5A7D03E663F30A962F28C0FA2B03CDF00952DDEF2ED818855F62B08375AF7B0D4494DDFD339A4ADF8135D3AF2FB19EEABDE8BF059BA16815BF6F91B82E7A0F53B1D4D49E2890D80F8F242912F5563638B3C03FED2547EAD4F7162CF4B93E319BD4E22804AC771B64378AAF94FF5BC53B7E8788C7739FC6284AF33EF5DAC8D4219C3A6122DDB9EA513606540F4C330DC1405B0D8775F811916B3B551478DA66685A2E19B761E1120F24FB4806E60B9B73A5C871A0F86DDE658F1372858C9A0CDEA944195B46468E4376D1835B73CEA4E7AE50084CD46CAFC4FB8A35F6F84D85B3DE17BD5671BACBF735F7BBE3C870C23D5DAC81831CB52B0A32B808CD597B3FD20DCA249295CE5854119245BC71411B5F6775F1291EE311817AFF546DF07351C4AD81325D3F0F9FDF50D032F3D49BC2C08A7F2C87BA80C2C926287E80D7368448183551BCDB09927F138560537E6F95186E52EBD30B713A536377C096E5CC524936036CA264EEAE3E0BE3FB345E3F5C30077B802048DB9F1C71ECF2522B276CF88AE4ED38B18044A81C4F585E4AD6CEBA56C88E352811033ECC32BDF6E51821279DD98F6202CBB31C9815F96CC3744B853F7E6DF6A7747CD3C846FE1D51E2BB9898C5E84BCF6CA526C3F04D75157372178E3D90C5E103A82FCF1087417B8ACA201A11430F5E20F388B3268180A0123C7B6EBA597590FFA4F3B5C0A7D089EB14A4AAB37CEB3A04B7CCDFE3DAADB290FA1B483779F7D1F2A41B6A798B36BC3C1CAE1D89DEE4753D84A51E605692098E24D0DF6E4B18BE280F961E0E749FF1102C66310E1F5BB9FEF3C9FF5899821CD03E49369B2815D5E87572F2CC6391E1ED8C4BCFF7E357B8AC3C872EA425E10627457A6FE17BCE660CA01C712A5EE5D7342FE38C75D83424D52E1CB0984C181F721CAFDFE7150086C661CB204FD96DCDCE078BBCB764715C68DA6D05BDF161AC5DF90008B7600C6717CA325D16B096135A2D86F170A1BB4C2ADFCF8515C396DDA3BA588
    console.error('ROBLOX_COOKIE is not set in the .env file.');
    process.exit(1);
}

require('./database');
require('./api');

// [Clients]
const discordClient = new QbotClient();
discordClient.login(process.env.DISCORD_TOKEN);
const robloxClient = new RobloxClient({ credentials: { cookie: process.env.ROBLOX_COOKIE } });
let robloxGroup: Group = null;
(async () => {
    await robloxClient.login().catch(console.error);
    robloxGroup = await robloxClient.getGroup(config.groupId);
    
    // [Events]
    checkSuspensions();
    checkBans();
    if(config.logChannels.shout) recordShout();
    if(config.recordManualActions) recordAuditLogs();
    if(config.memberCount.enabled) recordMemberCount();
    if(config.antiAbuse.enabled) clearActions();
    if(config.deleteWallURLs) checkWallForAds();
})();

// [Handlers]
discordClient.on('interactionCreate', handleInteraction as any);
discordClient.on('messageCreate', handleLegacyCommand);

// [Module]
export { discordClient, robloxClient, robloxGroup };
