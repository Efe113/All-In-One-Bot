const { ActivityType } = require('discord.js');
const fs = require("fs");
const path = require("path");
const db2 = require('../../Utils/jsonDB');
const ayarlar = require('../../Settings/ayarlar.json');
const Eris = require('eris');
const schedule = require('node-schedule');

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const aylar = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

const TARIH_KANAL_ID = "1035600694536835214";

function getTotalMembers(client) {
    let count = 0;
    client.guilds.cache.forEach(guild => {
        count += guild.memberCount;
    });
    return count;
}

function getOnlineCount(client) {
    let count = 0;
    client.guilds.cache.forEach(guild => {
        guild.members.cache.forEach(member => {
            if (
                !member.user.bot &&
                member.presence &&
                ["online", "dnd", "idle"].includes(member.presence.status)
            ) {
                count++;
            }
        });
    });
    return count;
}

module.exports = {
    name: "ready",
    once: true,
    async execute(client) {
        console.log(`🟢 [AKTİF] ${client.user.username}`);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//BOT OYNUYOR
        client.user.setPresence({
            activities: [{ name: `${getOnlineCount(client)} Çevrimiçi ・ ${getTotalMembers(client)} Üye`, type: ActivityType.Custom }],
            status: "online"
        });

        setInterval(() => {
            client.user.setPresence({
                activities: [{ name: `${getOnlineCount(client)} Çevrimiçi ・ ${getTotalMembers(client)} Üye`, type: ActivityType.Custom }],
                status: "online"
            });
        }, 5 * 60 * 1000);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//HATIRLATICI SİSTEMİ
        const hatirlaticilariKontrolEt = require('../../Utils/hatirlaticiKontrol');
        await hatirlaticilariKontrolEt(client);
        setInterval(() => {
            hatirlaticilariKontrolEt(client);
        }, 60 * 1000);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//OTOMATİK TARİH SİSTEMİ
        setInterval(() => updateDateChannel(client), 60 * 60 * 1000);
        updateDateChannel(client);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//SÜRELİ MESAJ SİSTEMİ
        const filePath = path.join(__dirname, "../../Database/süreliMesaj.json");
        function readData() {
            if (!fs.existsSync(filePath)) return {};
            return JSON.parse(fs.readFileSync(filePath, "utf-8"));
        }

        client.guilds.cache.forEach(guild => {
            const data = readData();
            const veri = data[guild.id];
            if (!veri) return;

            const kanal = guild.channels.cache.get(veri.kanalID);
            if (!kanal) return;

            setInterval(() => {
                kanal.send(veri.mesaj).catch(console.error);
            }, veri.süre);
        });
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//GÜNLÜK-HAFTALIK VERİ SIFIRLAMA
        const lastReset = { daily: null, weekly: null };

        schedule.scheduleJob({ hour: 0, minute: 0, tz: 'Europe/Istanbul' }, async () => {
            const today = new Date().toDateString();
            if (lastReset.daily === today) return;

            const all = db2.all();
            for (const entry of all) {
                if (entry.ID.startsWith("msg_1d_") || entry.ID.startsWith("voice_1d_")) {
                    db2.delete(entry.ID);
                }
            }

            const kanalID = db2.get("reset_log_channel");
            if (kanalID) {
                try {
                    const kanal = await client.channels.fetch(kanalID);
                    await kanal.send("🌇 Günlük veriler **sıfırlandı.**");
                } catch (err) {
                    console.error("Günlük sıfırlama log kanalı bulunamadı:", err);
                }
            }
            lastReset.daily = today;
        });

        schedule.scheduleJob({ hour: 0, minute: 0, dayOfWeek: 0, tz: 'Europe/Istanbul' }, async () => {
            const today = new Date().toDateString();
            if (lastReset.weekly === today) return;

            const all = db2.all();
            for (const entry of all) {
                if (entry.ID.startsWith("msg_7d_") || entry.ID.startsWith("voice_7d_")) {
                    db2.delete(entry.ID);
                }
            }

            const kanalID = db2.get("reset_log_channel");
            if (kanalID) {
                try {
                    const kanal = await client.channels.fetch(kanalID);
                    await kanal.send("📅 Haftalık veriler **sıfırlandı.**");
                } catch (err) {
                    console.error("Haftalık sıfırlama log kanalı bulunamadı:", err);
                }
            }
            lastReset.weekly = today;
        });
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//ERİS SES
        const dosyaYolu = path.join(__dirname, "../../Database/sesKanali.json");
        function veriOku() {
            if (!fs.existsSync(dosyaYolu)) return {};
            try {
                return JSON.parse(fs.readFileSync(dosyaYolu, "utf8"));
            } catch {
                return {};
            }
        }

        const _client = new Eris(ayarlar.token, { intents: ["all"] });
        _client.connect();

        _client.on("ready", async () => {
            const veri = veriOku();
            const aktifKanal = veri.aktifSesKanali;

            if (!aktifKanal) {
                console.log("⚠️ [SES - HATA] Ses kanalı seçilmemiş.");
                return;
            }

            try {
                await _client.joinVoiceChannel(aktifKanal, { selfMute: false, selfDeaf: true });
                console.log(`🟢 [SES - BAŞARILI] Bot Ses kanalına katıldı.`);
            } catch (err) {
                console.error(`⚠️ [SES - HATA] Bot ${aktifKanal} kanalına katılamadı:`, err);
            }
        });

        _client.on('disconnect', (error) => {
            if (error?.code === 4022) {
                setTimeout(() => joinVoice(guildId, channelId), 2500);
            }
        });
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//YOUTUBE ALERT
        setInterval(async () => {
            require("../../Commands/Bildirim/ytalertconf")(client);
        }, 20000);

        Promise.prototype.sil = function (time) {
            if (this) this.then(s => {
                if (s.deletable) {
                    setTimeout(async () => {
                        s.delete().catch(e => { });
                    }, time * 1000);
                }
            });
        };
    },
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function getIstanbulParts() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(new Date());

  const obj = {};
  for (const p of parts) {
    if (p.type !== 'literal') obj[p.type] = p.value;
  }
  return obj; 
}

//TARİH GÜNCELLEME
function updateDateChannel(client) {
  const p = getIstanbulParts();
  const gun = p.day;
  const ayIndex = Number(p.month) - 1;
  const ay = aylar[ayIndex] || aylar[new Date().getMonth()];
  const yil = p.year;

  const channel = client.channels.cache.get(TARIH_KANAL_ID);
  if (channel) {
    channel.setName(`🗓️・Tarih · ${gun} ${ay} ${yil}`).catch(console.error);
  }
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////