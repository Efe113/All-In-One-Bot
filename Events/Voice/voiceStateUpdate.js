const fs = require("fs");
const path = require("path");
const sesVeriDosyasi = path.join(__dirname, "../../Database/sesVerileri.json");
const sesVeriDosyasi2 = path.join(__dirname, "../../Database/sesMesajVeri.json");
const tempVoiceManager = require("../Voice/tempVoiceManager");

function okuVeriYol(yol) {
  try {
    if (!fs.existsSync(yol)) return {};
    return JSON.parse(fs.readFileSync(yol, "utf8"));
  } catch (err) {
    console.error(`Veri okunamadı (${yol}):`, err);
    return {};
  }
}

function yazVeriYol(yol, data) {
  try {
    fs.writeFileSync(yol, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error(`Veri kaydedilemedi (${yol}):`, err);
  }
}

module.exports = {
  name: "voiceStateUpdate",
  async execute(oldState, newState) {
    const userId = newState.id;
    const guildId = newState.guild.id;

    //SAY KOMUTU İÇİN
    {
      let data = okuVeriYol(sesVeriDosyasi);

      if (!oldState.channel && newState.channel) {
        if (!data[guildId]) data[guildId] = {};
        if (!data[guildId][userId]) data[guildId][userId] = {};
        data[guildId][userId].lastJoin = Date.now();
        yazVeriYol(sesVeriDosyasi, data);
      }

      if (oldState.channel && !newState.channel) {
        const userData = data[guildId]?.[userId];
        if (userData?.lastJoin) {
          const sessionDuration = Date.now() - userData.lastJoin;
          userData.totalTime = (userData.totalTime || 0) + sessionDuration;
          delete userData.lastJoin;
          yazVeriYol(sesVeriDosyasi, data);
        }
      }
    }

    //STAT KOMUTU İÇİN
    if (!newState.member || newState.member.user.bot) return;

    {
      const channelId = oldState.channelId || newState.channelId;
      let data = okuVeriYol(sesVeriDosyasi2);

      if (!oldState.channel && newState.channel) {
        data[`lastJoin_${userId}`] = Date.now();
        yazVeriYol(sesVeriDosyasi2, data);
      }

      if (oldState.channel && !newState.channel) {
        const joinedAt = data[`lastJoin_${userId}`];
        if (joinedAt) {
          const duration = Math.floor((Date.now() - joinedAt) / 1000);

          data[`voice_1d_${userId}`] = (data[`voice_1d_${userId}`] || 0) + duration;
          data[`voice_7d_${userId}`] = (data[`voice_7d_${userId}`] || 0) + duration;
          data[`voice_total_${userId}`] = (data[`voice_total_${userId}`] || 0) + duration;
          data[`channelVoiceTime_${channelId}_${userId}`] = (data[`channelVoiceTime_${channelId}_${userId}`] || 0) + duration;

          delete data[`lastJoin_${userId}`];

          yazVeriYol(sesVeriDosyasi2, data);
        }
      }
    }

    //TEMP VOICE SİSTEMİ
    const oldChannel = oldState.channel;
    const newChannel = newState.channel;

    if (
      newChannel &&
      newChannel.id === tempVoiceManager.getTriggerChannelId()
    ) {
      const data = tempVoiceManager.getChannelIdForUser(newState.member.id);
      const actualChannel = data
        ? newState.guild.channels.cache.get(data.voiceChannelId)
        : null;

      if (!data || !actualChannel) {
        await tempVoiceManager.handleVoiceJoin(newState.member);
      }
    }

    if (
      oldChannel &&
      oldChannel.id !== tempVoiceManager.getTriggerChannelId() &&
      oldChannel.members.size === 0 &&
      oldChannel.parentId === oldState.guild.channels.cache.get(tempVoiceManager.getTriggerChannelId())?.parentId
    ) {
      const userId = [...tempVoiceManager.userChannels.entries()].find(
        ([, value]) => value.voiceChannelId === oldChannel.id
      )?.[0];

      if (userId) {
        const data = tempVoiceManager.getChannelIdForUser(userId);
        const textChannel = oldState.guild.channels.cache.get(data?.textChannelId);

        setTimeout(async () => {
          if (oldChannel.members.size === 0) {
            await oldChannel.delete().catch(() => null);
            if (textChannel) await textChannel.delete().catch(() => null);
            tempVoiceManager.removeChannelsForUser(userId);
          }
        }, 100);
      }
    }
  }
};
