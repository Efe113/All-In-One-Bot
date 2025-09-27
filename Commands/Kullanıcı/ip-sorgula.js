const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits
} = require('discord.js');
const dns = require('dns').promises;
const fs = require('fs');
const path = require('path');
const ipaddr = require('ipaddr.js'); // Özel IP’leri engellemek için
const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));
require('dotenv').config();

const limitDosyasi = path.join(__dirname, '../../Database/ipSorgulaSinir.json');
const GUNLUK_LIMIT = 1;

// Güvenlik için global rate limiting
const globalRateLimitDosyasi = path.join(__dirname, '../../Database/ipSorgulaGlobalLimit.json');
const GLOBAL_RATE_LIMIT = 10; // Tüm bot için dakikada maksimum 10 sorgu
const RATE_LIMIT_WINDOW = 60000; // 1 dakika

// Günlük log dosyası
const logDosyasi = path.join(__dirname, '../../Database/ipSorgulaLog.json');

// Tehlikeli IP listesi (manually blocked IPs)
const BLOCKED_IPS = [
  '127.0.0.1',    // localhost
  '0.0.0.0',      // unspecified
  '255.255.255.255' // broadcast
];

// Bilinen tehlikeli IP aralıkları (CIA, FBI, etc.)
const DANGEROUS_IP_RANGES = [
  '149.164.0.0/16',   // U.S. government networks
  '152.190.0.0/16',   // U.S. government networks  
  '192.168.0.0/16',   // Private networks
  '172.16.0.0/12',    // Private networks
  '10.0.0.0/8',       // Private networks
  '169.254.0.0/16',   // Link-local
  '127.0.0.0/8',      // Loopback
  '224.0.0.0/4',      // Multicast
  '240.0.0.0/4',      // Reserved (future use)
];

// IP formatı doğrulama (regex + ipaddr ile çifte kontrol)
function isValidIp(ip) {
  // Temel format kontrolü
  const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  if (!ipRegex.test(ip)) return false;

  try {
    const addr = ipaddr.parse(ip);
    // Sadece unicast (genel) IP'leri kabul et
    const range = addr.range();
    return range === 'unicast';
  } catch {
    return false; // geçersiz format
  }
}

// Özel veya tehlikeli IP aralıklarını kontrol et
function isPrivateOrReservedIp(ip) {
  try {
    const addr = ipaddr.parse(ip);
    const range = addr.range();
    
    // Tehlikeli veya özel aralıklar
    const dangerousRanges = [
      'loopback',      // 127.0.0.0/8
      'private',       // 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
      'multicast',     // 224.0.0.0/4
      'linkLocal',     // 169.254.0.0/16
      'reserved',      // 240.0.0.0/4
      'unspecified',   // 0.0.0.0
      'broadcast'      // 255.255.255.255
    ];
    
    // Manually blocked IPs check
    if (BLOCKED_IPS.includes(ip)) {
      return true;
    }
    
    return dangerousRanges.includes(range);
  } catch {
    return true; // geçersiz format
  }
}

// Check if IP is in dangerous ranges
function isDangerousIpRange(ip) {
  try {
    const addr = ipaddr.parse(ip);
    
    // Check against known dangerous ranges
    for (const range of DANGEROUS_IP_RANGES) {
      const [rangeAddr, prefixLength] = range.split('/');
      const rangeParsed = ipaddr.parse(rangeAddr);
      const rangePrefix = parseInt(prefixLength);
      
      if (addr.match(rangeParsed, rangePrefix)) {
        return true;
      }
    }
    
    return false;
  } catch {
    return true; // Error in parsing, treat as dangerous
  }
}

// Check for potential SSRF attempts
function isPotentialSSRF(ip) {
  // Check for internal IPs that could be used for SSRF
  try {
    const addr = ipaddr.parse(ip);
    const range = addr.range();
    
    // If it's not a public IP, it could be used for SSRF
    return range !== 'unicast' || isPrivateOrReservedIp(ip);
  } catch {
    return true; // Invalid IP format
  }
}

// Timeout ile fetch
function fetchWithTimeout(url, options = {}, timeout = 5000) {
  return Promise.race([
    fetch(url, { ...options, timeout }),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Zaman aşımı')), timeout)
    )
  ]);
}

// Rate limiting verilerini yükle
function loadLimitData() {
  if (!fs.existsSync(limitDosyasi)) {
    fs.writeFileSync(limitDosyasi, JSON.stringify({}));
  }
  return JSON.parse(fs.readFileSync(limitDosyasi, 'utf8'));
}

// Rate limiting verilerini kaydet
function saveLimitData(data) {
  fs.writeFileSync(limitDosyasi, JSON.stringify(data, null, 2));
}

// Global rate limiting verilerini yükle
function loadGlobalRateLimitData() {
  if (!fs.existsSync(globalRateLimitDosyasi)) {
    fs.writeFileSync(globalRateLimitDosyasi, JSON.stringify({ timestamps: [] }));
  }
  return JSON.parse(fs.readFileSync(globalRateLimitDosyasi, 'utf8'));
}

// IP-based rate limiting verilerini yükle
function loadIpRateLimitData() {
  const ipRateLimitDosyasi = path.join(__dirname, '../../Database/ipSorgulaIpRateLimit.json');
  if (!fs.existsSync(ipRateLimitDosyasi)) {
    fs.writeFileSync(ipRateLimitDosyasi, JSON.stringify({}));
  }
  return JSON.parse(fs.readFileSync(ipRateLimitDosyasi, 'utf8'));
}

// IP-based rate limiting verilerini güncelle
function updateIpRateLimit(ip) {
  const ipRateLimitDosyasi = path.join(__dirname, '../../Database/ipSorgulaIpRateLimit.json');
  const now = Date.now();
  const WINDOW_MS = 300000; // 5 minutes
  const IP_RATE_LIMIT = 3; // Max 3 queries per IP per 5 minutes
  
  let data = loadIpRateLimitData();
  
  if (!data[ip]) {
    data[ip] = { timestamps: [] };
  }
  
  // Eski kayıtları temizle (5 dakikadan eski olanlar)
  data[ip].timestamps = data[ip].timestamps.filter(timestamp => 
    now - timestamp < WINDOW_MS
  );
  
  // Yeni kaydı ekle
  data[ip].timestamps.push(now);
  
  // Sınırı kontrol et
  const isOverLimit = data[ip].timestamps.length > IP_RATE_LIMIT;
  
  fs.writeFileSync(ipRateLimitDosyasi, JSON.stringify(data, null, 2));
  
  return isOverLimit;
}

// Global rate limiting verilerini güncelle
function updateGlobalRateLimitData() {
  const now = Date.now();
  let data = loadGlobalRateLimitData();
  
  // Eski kayıtları temizle (1 dakikadan eski olanlar)
  data.timestamps = data.timestamps.filter(timestamp => 
    now - timestamp < RATE_LIMIT_WINDOW
  );
  
  // Yeni kaydı ekle
  data.timestamps.push(now);
  
  // Sınırı kontrol et
  const isOverLimit = data.timestamps.length > GLOBAL_RATE_LIMIT;
  
  fs.writeFileSync(globalRateLimitDosyasi, JSON.stringify(data, null, 2));
  
  return isOverLimit;
}

// Suspicious activity tracking
function trackSuspiciousActivity(userId, ip, reason) {
  const suspiciousDosyasi = path.join(__dirname, '../../Database/ipSorgulaSuspicious.json');
  const now = Date.now();
  const WINDOW_MS = 3600000; // 1 hour
  const THRESHOLD = 5; // Threshold for suspicious activity
  
  let data = {};
  if (fs.existsSync(suspiciousDosyasi)) {
    data = JSON.parse(fs.readFileSync(suspiciousDosyasi, 'utf8'));
  }
  
  if (!data[userId]) {
    data[userId] = { attempts: [], timestamps: [] };
  }
  
  // Clean old records
  const validIndices = data[userId].timestamps.filter(ts => now - ts < WINDOW_MS);
  data[userId].timestamps = validIndices;
  data[userId].attempts = data[userId].attempts.filter((_, i) => validIndices.includes(data[userId].timestamps[i]));
  
  // Add new attempt
  data[userId].timestamps.push(now);
  data[userId].attempts.push({ ip, reason, timestamp: now });
  
  // Check if user is suspicious
  const isSuspicious = data[userId].timestamps.length > THRESHOLD;
  
  fs.writeFileSync(suspiciousDosyasi, JSON.stringify(data, null, 2));
  
  return isSuspicious;
}

// Güvenlik loglarını kaydet
function logSecurityEvent(userId, ip, action, details = '') {
  const logEntry = {
    timestamp: new Date().toISOString(),
    userId,
    ip,
    action,
    details
  };
  
  let logs = [];
  if (fs.existsSync(logDosyasi)) {
    logs = JSON.parse(fs.readFileSync(logDosyasi, 'utf8'));
  }
  
  logs.push(logEntry);
  
  // Sadece son 1000 logu tut
  if (logs.length > 1000) {
    logs = logs.slice(-1000);
  }
  
  fs.writeFileSync(logDosyasi, JSON.stringify(logs, null, 2));
}

// IP itibar kontrolü
async function checkIpReputation(ip) {
  // AbuseIPDB kontrolü (API key varsa)
  if (process.env.ABUSEIPDB_API_KEY) {
    try {
      const abuseRes = await fetchWithTimeout(
        `https://api.abuseipdb.com/api/v2/check?ipAddress=${encodeURIComponent(ip)}&maxAgeInDays=90`,
        {
          headers: {
            Key: process.env.ABUSEIPDB_API_KEY,
            Accept: 'application/json'
          }
        },
        3000 // 3 saniye timeout
      );
      
      if (abuseRes.ok) {
        const abuseData = await abuseRes.json();
        if (abuseData?.data?.abuseConfidenceScore > 50) {
          return {
            isDangerous: true,
            reason: `Yüksek kötü niyetli IP skoru: ${abuseData.data.abuseConfidenceScore}/100`,
            score: abuseData.data.abuseConfidenceScore
          };
        }
      }
    } catch (err) {
      console.warn('AbuseIPDB kontrol hatası:', err.message);
    }
  }
  
  return { isDangerous: false };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ip-sorgula')
    .setDescription('IP adresi hakkında detaylı bilgi verir.')
    .addStringOption(option =>
      option.setName('ip-adresi')
        .setDescription('Sorgulanacak IP adresi.')
        .setRequired(true)
    ),
  async execute(interaction) {
    // ⚠️ İsteğe bağlı: Rol koruması (aşağıdaki yorumu kaldırarak aktif edebilirsin)
    /*
    const requiredRole = 'ROL_ID';
    if (!interaction.member.roles.cache.has(requiredRole)) {
      return interaction.reply({
        content: 'Bu komutu kullanmak için gerekli yetkiye sahip değilsin.',
        ephemeral: true
      });
    }
    */

    const ip = interaction.options.getString('ip-adresi').trim();
    const userId = interaction.user.id;

    // 🔒 Güvenlik: Giriş temizleme ve doğrulama
    if (!ip || ip.length > 15 || ip.length < 7) {
      logSecurityEvent(userId, ip, 'INVALID_FORMAT', 'IP formatı çok kısa veya uzun');
      return interaction.reply({
        content: `<a:dikkat_arviis:1421402093876674641> **Geçersiz IP adresi formatı.** Lütfen doğru bir IPv4 adresi girin.`,
        ephemeral: true
      });
    }

    // 🔒 Güvenlik: Özel / dahili / geçersiz IP engelleme
    if (isPrivateOrReservedIp(ip)) {
      logSecurityEvent(userId, ip, 'PRIVATE_IP_ATTEMPT', 'Özel veya rezerve IP adresi');
      return interaction.reply({
        content: `<a:dikkat_arviis:1421402093876674641> **Geçersiz veya özel IP adresi.** Lütfen genel (public) bir IPv4 adresi gir.`,
        ephemeral: true
      });
    }

    // 🔒 Güvenlik: Tehlikeli IP aralığı kontrolü
    if (isDangerousIpRange(ip)) {
      logSecurityEvent(userId, ip, 'DANGEROUS_IP_RANGE', 'Tehlikeli IP aralığından IP');
      return interaction.reply({
        content: `<a:dikkat_arviis:1421402093876674641> **Tehlikeli IP aralığı.** Bu IP adresi güvenli olmayan bir ağ parçasına ait.`,
        ephemeral: true
      });
    }

    // 🔒 Güvenlik: SSRF koruması
    if (isPotentialSSRF(ip)) {
      logSecurityEvent(userId, ip, 'SSRF_ATTEMPT', 'Potansiyel SSRF saldırısı');
      return interaction.reply({
        content: `<a:dikkat_arviis:1421402093876674641> **SSRF koruması:** Güvenlik nedeniyle bu IP adresi engellendi.`,
        ephemeral: true
      });
    }

    // 🔒 Güvenlik: IP formatı doğrulama
    if (!isValidIp(ip)) {
      logSecurityEvent(userId, ip, 'INVALID_IP_FORMAT', 'Geçersiz IP formatı');
      return interaction.reply({
        content: `<a:dikkat_arviis:1421402093876674641> **Geçersiz IP adresi formatı.** Lütfen doğru bir IPv4 adresi girin.`,
        ephemeral: true
      });
    }

    // 🔒 Güvenlik: Global rate limiting kontrolü
    if (updateGlobalRateLimitData()) {
      logSecurityEvent(userId, ip, 'GLOBAL_RATE_LIMIT_EXCEEDED', 'Global rate limit aşıldı');
      return interaction.reply({
        content: `<a:dikkat_arviis:1421402093876674641> **Sistem aşırı yüklendi.** Lütfen biraz sonra tekrar deneyin.`,
        ephemeral: true
      });
    }

    // 🔒 Güvenlik: IP bazlı rate limiting
    if (updateIpRateLimit(ip)) {
      logSecurityEvent(userId, ip, 'IP_RATE_LIMIT_EXCEEDED', 'IP bazlı rate limit aşıldı');
      return interaction.reply({
        content: `<a:dikkat_arviis:1421402093876674641> **Bu IP için sorgu limiti aşıldı.** Lütfen daha sonra tekrar deneyin.`,
        ephemeral: true
      });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    let limitData = loadLimitData();

    if (!limitData[userId] || limitData[userId].date !== todayStr) {
      limitData[userId] = { date: todayStr, count: 0 };
    }

    if (limitData[userId].count >= GUNLUK_LIMIT) {
      logSecurityEvent(userId, ip, 'DAILY_LIMIT_EXCEEDED', 'Günlük limit aşıldı');
      return interaction.reply({
        content: `<a:dikkat_arviis:1421402093876674641> **Günlük IP sorgulama sınırına ulaştın.** 
<:sadesagok_arviis:1421412348350038058> __Her gün saat 00:00'da sıfırlanır.__`,
        ephemeral: true
      });
    }

    // 🔒 Güvenlik: Şüpheli kullanıcı kontrolü
    if (trackSuspiciousActivity(userId, ip, 'QUERY_ATTEMPT')) {
      logSecurityEvent(userId, ip, 'SUSPICIOUS_USER', 'Şüpheli kullanıcı tespit edildi');
      return interaction.reply({
        content: `<a:dikkat_arviis:1421402093876674641> **Şüpheli aktivite tespit edildi.** Hesabınızın güvenliği nedeniyle bu işlem engellendi.`,
        ephemeral: true
      });
    }

    // 🔒 Güvenlik: IP itibar kontrolü
    try {
      const reputation = await checkIpReputation(ip);
      if (reputation.isDangerous) {
        logSecurityEvent(userId, ip, 'DANGEROUS_IP_DETECTED', reputation.reason);
        return interaction.reply({
          content: `<a:dikkat_arviis:1421402093876674641> **Güvenlik uyarısı:** Bu IP adresi tehlikeli olarak işaretlenmiş. Sorgulama engellendi.`,
          ephemeral: true
        });
      }
    } catch (err) {
      console.warn('IP itibar kontrol hatası:', err.message);
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      limitData[userId].count += 1;
      saveLimitData(limitData);
      const kalanSorgu = GUNLUK_LIMIT - limitData[userId].count;

      // 🌐 Ana IP sorgusu (ipwho.is)
      const res = await fetchWithTimeout(`https://ipwho.is/${encodeURIComponent(ip)}`);
      const data = await res.json();

      if (!data.success) {
        logSecurityEvent(userId, ip, 'IPWHOIS_ERROR', data.message || 'Servis hatası');
        return interaction.editReply({
          content: `<a:dikkat_arviis:1421402093876674641> **IP sorgusunda hata**: ${data.message || 'Geçersiz IP veya servis hatası.'}`
        });
      }

      // 🔍 Hostname (PTR kaydı)
      let hostname = '<:carpi_arviis:1421401682348216340> **Yok.**';
      try {
        const [ptr] = await dns.reverse(ip);
        if (ptr) hostname = ptr;
      } catch {}

      // 🗺️ Harita ve URL’ler
      const flagUrl = data.country_code
        ? `https://flagcdn.com/w320/${data.country_code.toLowerCase()}.png`
        : null;
      const staticMap = `https://staticmap.openstreetmap.de/staticmap.php?center=${data.latitude},${data.longitude}&zoom=10&size=600x300&markers=${data.latitude},${data.longitude},red-pushpin`;
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${data.latitude},${data.longitude}`)}`;
      const jsonViewUrl = `https://ipwhois.app/json/${encodeURIComponent(ip)}`;

      // 🛡️ AbuseIPDB
      let abuseScore = '<:carpi_arviis:1421401682348216340> **Bilinmiyor.**';
      if (process.env.ABUSEIPDB_API_KEY) {
        try {
          const abuseRes = await fetchWithTimeout(
            `https://api.abuseipdb.com/api/v2/check?ipAddress=${encodeURIComponent(ip)}`,
            {
              headers: {
                Key: process.env.ABUSEIPDB_API_KEY,
                Accept: 'application/json'
              }
            }
          );
          const abuseData = await abuseRes.json();
          if (abuseData?.data?.abuseConfidenceScore !== undefined) {
            abuseScore = `${abuseData.data.abuseConfidenceScore} / 100`;
          }
        } catch (err) {
          console.warn('AbuseIPDB sorgusu başarısız:', err.message);
        }
      }

      // 📍 IPinfo
      let ipinfoOrg = '<:carpi_arviis:1421401682348216340> **Bilinmiyor.**';
      let ipinfoLoc = '<:carpi_arviis:1421401682348216340> **Bilinmiyor.**';
      if (process.env.IPINFO_TOKEN) {
        try {
          const ipinfoRes = await fetchWithTimeout(
            `https://ipinfo.io/${encodeURIComponent(ip)}?token=${process.env.IPINFO_TOKEN}`
          );
          const ipinfoData = await ipinfoRes.json();
          ipinfoOrg = ipinfoData.org || ipinfoOrg;
          ipinfoLoc = ipinfoData.loc || ipinfoLoc;
        } catch (err) {
          console.warn('IPinfo sorgusu başarısız:', err.message);
        }
      }

      // 🌍 Ülke bilgisi (restcountries)
      let countryInfo = null;
      if (data.country_code) {
        try {
          const countryRes = await fetchWithTimeout(
            `https://restcountries.com/v3.1/alpha/${data.country_code}`
          );
          const countryData = await countryRes.json();
          if (Array.isArray(countryData) && countryData.length > 0) {
            countryInfo = countryData[0];
          }
        } catch (err) {
          console.warn('Ülke bilgisi alınamadı:', err.message);
        }
      }

      // ☀️ Hava durumu
      let weatherInfo = '<:carpi_arviis:1421401682348216340> **Bilinmiyor.**';
      if (data.latitude && data.longitude && process.env.OPENWEATHERMAP_APPID) {
        try {
          const weatherRes = await fetchWithTimeout(
            `https://api.openweathermap.org/data/2.5/weather?lat=${data.latitude}&lon=${data.longitude}&appid=${process.env.OPENWEATHERMAP_APPID}&units=metric&lang=tr`
          );
          const weatherData = await weatherRes.json();
          if (weatherData?.weather?.[0]?.description && weatherData?.main?.temp) {
            weatherInfo = `${weatherData.weather[0].description}, ${weatherData.main.temp}°C`;
          }
        } catch (err) {
          console.warn('Hava durumu alınamadı:', err.message);
        }
      }

      // 📦 Embed oluşturma
      const embed = new EmbedBuilder()
        .setColor(data.connection?.proxy ? 0xFF0000 : 0x00C896)
        .setDescription(
          "# <:uyari_arviis:1421413143325839471> YASAL UYARI\n" +
          "- __**Bu komut eğlence amaçlı yapılmıştır.**__ Kullanımı tamamen sana ait. Başına gelen/gelebilecek şeylerden __**ben sorumlu değilim, sorumluluk kabul etmiyorum**__ bilgin olsun.\n" +
          "- Sonradan 'Abi ben bilmiyordum...' deme, __**KOCAMAN**__ yazılarla bilgilendiriyorum. __**Okumaman senin sorunun.**__"
        )
        .setThumbnail(staticMap)
        .setImage(flagUrl)
        .addFields(
          { name: 'IP Türü', value: data.type || '<:carpi_arviis:1421401682348216340> **Bilinmiyor.**', inline: true },
          { name: 'Kıta', value: data.continent || '<:carpi_arviis:1421401682348216340> **Bilinmiyor.**', inline: true },
          { name: 'Ülke', value: data.country || '<:carpi_arviis:1421401682348216340> **Bilinmiyor.**', inline: true },
          { name: 'Bölge', value: data.region || '<:carpi_arviis:1421401682348216340> **Bilinmiyor.**', inline: true },
          { name: 'Şehir', value: data.city || '<:carpi_arviis:1421401682348216340> **Bilinmiyor.**', inline: true },
          { name: 'Posta Kodu', value: data.postal || '<:carpi_arviis:1421401682348216340> **Yok.**', inline: true },
          { name: 'Koordinatlar', value: `${data.latitude}, ${data.longitude}`, inline: true },
          { name: 'Başkent', value: data.capital || '<:carpi_arviis:1421401682348216340> **Bilinmiyor.**', inline: true },
          { name: 'Telefon Kodu', value: `+${data.calling_code || '<:carpi_arviis:1421401682348216340> **Yok.**'}`, inline: true },
          { name: 'AB Üyesi mi?', value: data.is_eu ? '<:tik_arviis:1421412906435739698> **Evet.**' : '<:carpi_arviis:1421401682348216340> **Hayır.**', inline: true },
          { name: 'Zaman Dilimi', value: `${data.timezone?.id || '<:carpi_arviis:1421401682348216340> **Yok.**'} (**${data.timezone?.utc || 'UTC bilgisi yok.'}**)`, inline: true },
          { name: 'İSS', value: data.connection?.isp || '<:carpi_arviis:1421401682348216340> **Bilinmiyor.**', inline: true },
          { name: 'VPN / Proxy?', value: data.connection?.proxy ? '<:tik_arviis:1421412906435739698> **Evet.**' : '<:carpi_arviis:1421401682348216340> **Hayır.**', inline: true },
          { name: 'Hostname (PTR)', value: hostname, inline: true },
          { name: 'Mobil Bağlantı mı?', value: data.connection?.mobile ? '<:tik_arviis:1421412906435739698> **Evet.**' : '<:carpi_arviis:1421401682348216340> **Hayır.**', inline: true },
          { name: 'Hosting mi?', value: data.connection?.hosting ? '<:tik_arviis:1421412906435739698> **Evet.**' : '<:carpi_arviis:1421401682348216340> **Hayır.**', inline: true },
          { name: 'Tor Ağı?', value: data.security?.tor ? '<:tik_arviis:1421412906435739698> **Tor Exit Node.**' : '<:carpi_arviis:1421401682348216340> **Hayır.**', inline: true },
          { name: 'Kullanıcı Türü', value: data.connection?.org || '<:carpi_arviis:1421401682348216340> **Bilinmiyor.**', inline: true },
          { name: 'AbuseIPDB Skoru', value: abuseScore, inline: true },
          { name: 'Organizasyon (IPinfo)', value: ipinfoOrg, inline: true },
          { name: 'Lokasyon (IPinfo)', value: ipinfoLoc, inline: true },
          { name: 'Hava Durumu', value: weatherInfo, inline: true },
          { name: 'Ülke Nüfusu', value: countryInfo?.population?.toLocaleString('tr-TR') || '<:carpi_arviis:1421401682348216340> **Yok.**', inline: true },
          { name: 'Ülke Dili', value: countryInfo?.languages ? Object.values(countryInfo.languages).join(', ') : '<:carpi_arviis:1421401682348216340> **Yok.**', inline: true },
          { name: 'Para Birimi', value: countryInfo?.currencies ? Object.values(countryInfo.currencies).map(c => c.name).join(', ') : '<:carpi_arviis:1421401682348216340> **Yok.**', inline: true }
        );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('Google Maps\'te Gör')
          .setStyle(ButtonStyle.Link)
          .setURL(googleMapsUrl),
        new ButtonBuilder()
          .setCustomId('kalan_sorgu')
          .setLabel(`${kalanSorgu} / ${GUNLUK_LIMIT}`)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
        new ButtonBuilder()
          .setLabel('JSON Detayları')
          .setStyle(ButtonStyle.Link)
          .setURL(jsonViewUrl)
      );

      // Başarılı sorgulama logla
      logSecurityEvent(userId, ip, 'SUCCESSFUL_QUERY', 'IP sorgulama başarılı');
      await interaction.editReply({ embeds: [embed], components: [row] });

    } catch (error) {
      console.error('IP Sorgulama Hatası:', error.message || error);
      logSecurityEvent(userId, ip, 'QUERY_ERROR', error.message || 'Bilinmeyen hata');
      await interaction.editReply({
        content: 'Bir hata oluştu ve IP adresi sorgulanamadı. Lütfen daha sonra tekrar dene.',
        ephemeral: true
      });
    }
  }
};