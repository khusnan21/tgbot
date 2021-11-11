const axios = require("axios");

const status = require("../utils/status");
const diskinfo = require("../utils/diskinfo");
const humanTime = require("../utils/humanTime");
const { uploadFileStream } = require("../utils/gdrive");

const api = process.env.SEARCH_SITE || "https://mawiya9.herokuapp.com/";
console.log("Using api: ", api);

const searchRegex = /\/search (piratesbay|lt|1337x) (.+)/;
const detailsRegex = /\/details (pb|lt|1337x) (.+)/;
const downloadRegex = /\/download (.+)/;
const statusRegex = /\/status (.+)/;
const removeRegex = /\/remove (.+)/;

const startMessage = `
Hi ${msg.from.first_name} 😉️, <b>What Can I Do  👇️ </b> 

✅ Download Torrents & Give you a link to download 
<code> Links will be removed anytime so make sure you copied file to your drive. </code>

<b> Search </b>: You can search for torrents use sites 1337x
/search {site} {query} - To search for torrents
  - eg: /search 1337x Dune 

<b> Details </b> Get torrent details 
/details {site} {link} ( replace site with 1337x
eg.
    /details 1337x Dune
    
<b> Download </b> Send me a megnet link i will download torrrent 
/download {magnet link} - To start a download
eg.
    /download magnet:?xt=urn:btih:sdfasdfas
<b> Status </b> Get downloading status of your torrent.

/status {magnet link} - To check status of a downloading torrent
info hash is provided when torent download starts
eg.
    /status magnet:?xt=urn:btih:sdfasdfas
    
<b> Remove </b> Simply if you want to remove downloaded/ing torrent.
/remove {magnet link} - To remove an already added torrent
eg.
    /remove magnet:?xt=urn:btih:sdfasdfas

<b> Save </b>  
Send me a file max upto 10GB i will keep in my drive and give you a link.

----------------

With Love by Mawiya Aroob :)
`;

function bot(torrent, bot) {
  bot.onText(/\/start/, async msg => {
    bot.sendMessage(msg.chat.id, startMessage);
  });

  bot.on("message", async msg => {
    if (!msg.document) return;
    const chatId = msg.chat.id;
    const mimeType = msg.document.mimeType;
    const fileName = msg.document.file_name;
    const fileId = msg.document.file_id;

    bot.sendMessage(chatId, "📤 Uploading file...");
    try {
      const uploadedFile = await uploadFileStream(fileName, bot.getFileStream(fileId));
      const driveId = uploadedFile.data.id;
      const driveLink = `https://drive.google.com/file/d/${driveId}/view?usp=sharing`;
 //     const publicLink = `${process.env.SITE}api/v1/drive/file/${fileName}?id=${driveId}`;
      bot.sendMessage(chatId, `${fileName} upload successful\nDrive link: ${driveLink}\nPublic`);
    } catch (e) {
      bot.sendMessage(chatId, e.message || "An error occured 🥺");
    }
  });

  bot.onText(/\/server diskinfo (.+)/, async (msg, match) => {
    const from = msg.chat.id;
    const path = match[1];
    const info = await diskinfo(path);
    bot.sendMessage(from, info);
  });

  bot.onText(/\/server uptime/, async msg => {
    const from = msg.chat.id;
    bot.sendMessage(from, humanTime(process.uptime() * 1000));
  });

  bot.onText(/\/server status/, async msg => {
    const from = msg.chat.id;
    const currStatus = await status();
    bot.sendMessage(from, currStatus);
  });

  bot.onText(searchRegex, async (msg, match) => {
    var from = msg.from.id;
    var site = match[1];
    var query = match[2];

    bot.sendMessage(from, "🔍 Searching...");

    const data = await axios(`${api}api/v1/search/${site}?query=${query}`).then(({ data }) => data);

    if (!data || data.error) {
      bot.sendMessage(from, "An error occured on server 🥺");
    } else if (!data.results || data.results.length === 0) {
      bot.sendMessage(from, "❌ No results found.");
    } else if (data.results.length > 0) {
      let results1 = "";
      let results2 = "";
      let results3 = "";

      data.results.forEach((result, i) => {
        if (i <= 2) {
          results1 += `Name: ${result.name} \nSeeds: ${result.seeds} \nDetails: ${result.details} \nLink: ${result.link} \n\n`;
        } else if (2 < i && i <= 5) {
          results2 += `Name: ${result.name} \nSeeds: ${result.seeds} \nDetails: ${result.details} \nLink: ${result.link} \n\n`;
        } else if (5 < i && i <= 8) {
          results3 += `Name: ${result.name} \nSeeds: ${result.seeds} \nDetails: ${result.details} \nLink: ${result.link} \n\n`;
        }
      });

      bot.sendMessage(from, results1);
      bot.sendMessage(from, results2);
      bot.sendMessage(from, results3);
    }
  });

  bot.onText(detailsRegex, async (msg, match) => {
    var from = msg.from.id;
    var site = match[1];
    var query = match[2];

    bot.sendMessage(from, "⏱️ Loading...");

    const data = await axios(`${api}/details/${site}?query=${query}`).then(({ data }) => data);
    if (!data || data.error) {
      bot.sendMessage(from, "An error occured 🥺");
    } else if (data.torrent) {
      const torrent = data.torrent;
      let result1 = "";
      let result2 = "";

      result1 += `Title 🏷️: ${torrent.title} \n\nInfo: ${torrent.info}`;
      torrent.details.forEach(item => {
        result2 += `${item.infoTitle} ${item.infoText} \n\n`;
      });
      result2 += "Magnet Link 🧲:";

      await bot.sendMessage(from, result1);
      await bot.sendMessage(from, result2);
      await bot.sendMessage(from, torrent.downloadLink);
    }
  });

  bot.onText(downloadRegex, (msg, match) => {
    var from = msg.from.id;
    var link = match[1];
    let messageObj = null;
    let torrInterv = null;

    const reply = async torr => {
      let mess1 = "";
      mess1 += `Name 🏷️: ${torr.name}\n\n`;
      mess1 += `Status 📱: ${torr.status}\n\n`;
      mess1 += `Size 📏: ${torr.total}\n\n`;
      if (!torr.done) {
        mess1 += `Downloaded ✅: ${torr.downloaded}\n\n`;
        mess1 += `Speed 🚀: ${torr.speed}\n\n`;
        mess1 += `Progress 📥: ${torr.progress}%\n\n`;
        mess1 += `Time Remaining ⏳: ${torr.redableTimeRemaining}\n\n`;
      } else {
          
        mess1 += `Download Link 🔗: https://drive.google.com/file/d/${driveId}/view?usp=sharing \n\n`;
   //     mess1 += `Download Link 🔗: ${torr.downloadLink}\n\n`;
        clearInterval(torrInterv);
        torrInterv = null;
      }
      mess1 += `Magnet URI 🧲: ${torr.magnetURI}`;
      try {
        if (messageObj) {
          if (messageObj.text !== mess1) bot.editMessageText(mess1, { chat_id: messageObj.chat.id, message_id: messageObj.message_id });
        } else messageObj = await bot.sendMessage(from, mess1);
      } catch (e) {
        console.log(e.message);
      }
    };

    const onDriveUpload = (torr, url) => bot.sendMessage(from, `${torr.name} uploaded to 📁:\n${url} \n\n File may be removed anytime...`);
    const onDriveUploadStart = torr => bot.sendMessage(from, `📤 Uploading ${torr.name} to cloud server...`);

    if (link.indexOf("magnet:") !== 0) {
      bot.sendMessage(from, "❌ Link is not a magnet link");
    } else {
      bot.sendMessage(from, "✔️ Starting download...");
      try {
        const torren = torrent.download(
          link,
          torr => reply(torr),
          torr => reply(torr),
          onDriveUpload,
          onDriveUploadStart
        );
        torrInterv = setInterval(() => reply(torrent.statusLoader(torren)), 5000);
      } catch (e) {
        bot.sendMessage(from, "An error occured🥺\n" + e.message);
      }
    }
  });

  bot.onText(statusRegex, (msg, match) => {
    var from = msg.from.id;
    var link = match[1];

    const torr = torrent.get(link);
    if (link.indexOf("magnet:") !== 0) {
      bot.sendMessage(from, "Link is not a magnet link 🧲");
    } else if (!torr) {
      bot.sendMessage(from, "❌ Not downloading please add");
    } else {
      let mess1 = "";
      mess1 += `Name 🏷️: ${torr.name}\n\n`;
      mess1 += `Status 📱: ${torr.status}\n\n`;
      mess1 += `Size 📏: ${torr.total}\n\n`;
      if (!torr.done) {
        mess1 += `Downloaded ✅: ${torr.downloaded}\n\n`;
        mess1 += `Speed 🚀: ${torr.speed}\n\n`;
        mess1 += `Progress 📥: ${torr.progress}\n\n`;
        mess1 += `Time Remaining ⏳: ${torr.redableTimeRemaining}\n\n`;
      } else {
        mess1 += `1 Download Link 🔗: ${url}  \n\n`;
      }
      mess1 += `Magnet URI 🧲: ${torr.magnetURI}`;
      bot.sendMessage(from, mess1);
    }
  });

  bot.onText(removeRegex, (msg, match) => {
    var from = msg.from.id;
    var link = match[1];

    try {
      torrent.remove(link);
      bot.sendMessage(from, "Removed 🚮");
    } catch (e) {
      bot.sendMessage(from, `${e.message}`);
    }
  });
}

module.exports = bot;
