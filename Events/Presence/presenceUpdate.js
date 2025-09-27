const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../../Database/sonGorulme.json");

client.on("presenceUpdate", (oldPresence, newPresence) => {
    const userId = newPresence.userId;
    const oldStatus = oldPresence?.status;
    const newStatus = newPresence?.status;

    if (oldStatus !== "offline" && newStatus === "offline") {
        let data = {};

        if (fs.existsSync(filePath)) {
            const raw = fs.readFileSync(filePath, "utf-8");
            try {
                data = JSON.parse(raw);
            } catch (err) {
                console.error("JSON parse hatası:", err);
            }
        }

        data[userId] = {
            SonGorulme: Date.now()
        };
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    }
});