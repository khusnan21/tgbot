const axios = require("axios");

const status = require("../utils/status");
const diskinfo = require("../utils/diskinfo");
const humanTime = require("../utils/humanTime");
const { uploadFileStream } = require("../utils/gdrive");

const api = process.env.SEARCH_SITE || "https://mawiya9.herokuapp.com/";
console.log("Using api: ", api);

const searchRegex = /\/search (piratebay|limetorrent|1337x) (.+)/;
const detailsRegex = /\/details (piratebay|limetorrent|1337x) (.+)/;
const downloadRegex = /\/download (.+)/;
const statusRegex = /\/status (.+)/;
const removeRegex = /\/cancel (.+)/;


var msg_buttons = {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔰  FOLLOW ME ON TWITTER 🔰", url: "https://twitter.com/gr8mawiya" }],
        ]
      },
      parse_mode : "HTML"
    };

    


        
        

function bot(torrent, bot) {
  bot.onText(/\/start/, async msg => {
    // start message
    const startMessage = `
Hi ${msg.from.first_name} 😉️, <b>What Can I Do  👇️,</b>

 - <code>Search torrents from 1337x and piratebay</code>
 - <code>Download torrents for you</code>
 - <code>Save your torrent on cloud</code>
 - <code>Give you direct download link</code>
 - <code>You can add me groups</code>
 <i> :: Note: In groups use normally dont mention me i.e /start magnetLink :: </i>

 - <code>If you loved this bot follow me on twitter.com/gr8mawiya</code>

⚠️ Search may not work
⚠️ Beta: Add me to group but i will reply in Private 
⚠️ Server status Hidden 
🖥️ OVH - US 4TB - 8cpu -32GBram 
,🚀 1 GBps fast download server 
--------------------
🥺 I knew no one will donate so i removed donated button 🔘
`;
    bot.sendMessage(msg.chat.id, startMessage, msg_buttons);
  }),
        
        
  bot.onText(/\/help/, async msg => {
    // help message
    const helpMessage = `
<b>Commands,</b>

<code>/start</code> - Start Me If i am sleeping 🙂️
<code>/download</code> - To Download A Torrent
<code>/cancel</code> - To Remove Downloading Torrent
<code>/status</code> - To Check If Your Torrent is Downloading or Not
<code>/search</code> - To search torrents from 1337x & piratebay
<code>/group </code> - To see if i can work in Group and HowTO 
<code>/help</code> - To Get This Help Message!

<b>Made With ❤️ By Mawiya Aroob</b>
`;
    bot.sendMessage(msg.chat.id, helpMessage, msg_buttons);
  });

      
 /// Start of function for any unknown command
  bot.onText(/\/group/, async msg => {
    // help message
    const msg_group = `
<b>Now i can also work in Groups </b>
<code>Add me in any Group </code>
<code>Make me Group admin </code>
<code>Now anyone can message to me in group </code>
<code>I will reply to users in private</code>
<code>NOTE: Do not include my name after command i.e /start@mawiay... </code>
<code>Just use normally as you use in persoanl chat  </code>



`;
    bot.sendMessage(msg.chat.id, msg_group);
  });    
      
      
           
      
  bot.on("message", async msg => {
    if (!msg.document) return;
    const chatId = msg.chat.id;
    const fileSize = msg.document.file_size;
    const mimeType = msg.document.mimeType;
    const fileName = msg.document.file_name;
    const fileId = msg.document.file_id;
//     if (size > 20000000) {
//       bot.sendMessage(chatId, `Ooops, File size is too big!`) return;
//     }
    try {
      if (fileSize > 200000000) {
       bot.sendMessage(chatId, `Ooops, File size is too big!`);
      } else if (20000000 > fileSize) {
      const statusMessge = bot.sendMessage(chatId, "<code>📤 Uploading Your File to Cloud server </code>", {parse_mode : "HTML"});
      const uploadedFile = await uploadFileStream(fileName, bot.getFileStream(fileId));
      const driveId = uploadedFile.data.id;
      const driveLink = `https://drive.google.com/file/d/${driveId}/view?usp=sharing`;
      const publicLink = `https://drive.google.com/file/d/${driveId}/view?usp=sharing`;
      const statusMessgeId = statusMessge.message_id
      bot.deleteMessage(chatId, statusMessgeId)
      bot.sendMessage(chatId, `<b>💾 Uploaded to random drive </b> \n\n<b>Name 🏷️:</b> <code>${fileName}</code> \n\n<b>Google Drive Link 🔗:</b> ${driveLink} \n<b>Google Drive Link 🔗:</b> ${publicLink} \n\n `, {parse_mode : "HTML"});
      }
    } catch (e) {
      bot.sendMessage(chatId, e.message || "An error occured 🥺");
    }
  });

//   bot.onText(/\/server diskinfo (.+)/, async (msg, match) => {
//     const from = msg.chat.id;
//     const path = match[1];
//     const info = await diskinfo(path);
//     bot.sendMessage(from, info);
//   });

//   bot.onText(/\/server uptime/, async msg => {
//     const from = msg.chat.id;
//     bot.sendMessage(from, humanTime(process.uptime() * 1000));
//   });

  bot.onText(/\/server_status/, async msg => {
    const from = msg.chat.id;
    const currStatus = await status();
    bot.sendMessage(from, currStatus, {parse_mode : "HTML"});
  });

  bot.onText(searchRegex, async (msg, match) => {
    var from = msg.from.id;
    var site = match[1];
    var query = match[2];

    bot.sendMessage(from, "<code>Searching For You Keywords 🔍...</code>", {parse_mode : "HTML"});

    const data = await axios(`${api}api/v1/search/${site}?query=${query}`).then(({ data }) => data);

    if (!data || data.error) {
      bot.sendMessage(from, "An error occured on server!");
    } else if (!data.results || data.results.length === 0) {
      bot.sendMessage(from, "No results found.");
    } else if (data.results.length > 0) {
      let results1 = "";
      let results2 = "";
      let results3 = "";

      data.results.forEach((result, i) => {
        if (i <= 2) {
          results1 += `<b>Name 🏷️:</b> <code>${result.name}</code> \n<b>Seeds 💰:</b> <code>${result.seeds}</code> \n<b>Details 📝:</b> <code>${result.details}</code> \n<b>Link 🖇️:</b> <code>${result.link}</code> \n\n`;
        } else if (2 < i && i <= 5) {
          results2 += `<b>Name 🏷️:</b> <code>${result.name}</code> \n<b>Seeds 💰:</b> <code>${result.seeds}</code> \n<b>Details 📝:</b> <code>${result.details}</code> \n<b>Link 🖇️:</b> <code>${result.link}</code> \n\n`;
        } else if (5 < i && i <= 8) {
          results3 += `<b>Name 🏷️:</b> <code>${result.name}</code> \n<b>Seeds 💰:</b> <code>${result.seeds}</code> \n<b>Details 📝:</b> <code>${result.details}</code> \n<b>Link 🖇️:</b> <code>${result.link}</code> \n\n`;
        }
      });

      bot.sendMessage(from, results1, {parse_mode : "HTML"});
      bot.sendMessage(from, results2, {parse_mode : "HTML"});
      bot.sendMessage(from, results3, {parse_mode : "HTML"});
    }
  });

//   bot.onText(detailsRegex, async (msg, match) => {
//     var from = msg.from.id;
//     var site = match[1];
//     var query = match[2];

//     bot.sendMessage(from, "🕰️ Loading... 🕰️");

//     const data = await axios(`${api}/details/${site}?query=${query}`).then(({ data }) => data);
//     if (!data || data.error) {
//       bot.sendMessage(from, "An error occured 🥺");
//     } else if (data.torrent) {
//       const torrent = data.torrent;
//       let result1 = "";
//       let result2 = "";

//       result1 += `<b>Title 🏷️: ${torrent.title} \n\nInfo: ${torrent.info}`;
//       torrent.details.forEach(item => {
//         result2 += `${item.infoTitle} ${item.infoText} \n\n`;
//       });
//       result2 += "Magnet Link 🧲:";

//       await bot.sendMessage(from, result1);
//       await bot.sendMessage(from, result2);
//       await bot.sendMessage(from, torrent.downloadLink);
//     }
//   });

  bot.onText(downloadRegex, (msg, match) => {
    var from = msg.from.id;
    var link = match[1];
    let messageObj = null;
    let torrInterv = null;

    const reply = async torr => {
      let mess1 = "";
      mess1 += `<b>Name 🏷️:</b> <code>${torr.name}</code>\n\n`;
      mess1 += `<b>Status 📱:</b> <code>${torr.status}</code>\n\n`;
      mess1 += `<b>Size 📏:</b> <code>${torr.total}</code>\n\n`;
      if (!torr.done) {
        mess1 += `<b>Downloaded ✅:</b> <code>${torr.downloaded}</code>\n\n`;
        mess1 += `<b>Speed 🚀:</b> <code>${torr.speed}</code>\n\n`;
        mess1 += `<b>Progress 📥:</b> <code>${torr.progress}%</code>\n\n`;
        mess1 += `<b>Time Remaining ⏳:</b> <code>${torr.redableTimeRemaining}</code>\n\n`;
      } else {
        mess1 += `<b>Download Link 🔗:</b> i have already given to you ... \n\n`;
        clearInterval(torrInterv);
        torrInterv = null;
      }
      mess1 += `<b>Magnet URI 🧲:</b> <code>${torr.magnetURI}</code>`;
      try {
        if (messageObj) {
          if (messageObj.text !== mess1) bot.editMessageText(mess1, { chat_id: messageObj.chat.id, message_id: messageObj.message_id, parse_mode : "HTML" });
        } else messageObj = await bot.sendMessage(from, mess1, {parse_mode : "HTML"});
      } catch (e) {
        console.log(e.message);
      }
    };

    const onDriveUpload = (torr, url) => bot.sendMessage(from, `<b>💾 Uploaded to random drive</b> \n\n<b>Name 🏷️:</b> <code>${torr.name}</code> \n<b>Download 🔗:</b> ${url} \n\n Note: I will not give you link again so keep it safe.  \n\n Will be removed after a month -- With ❤️ by mawiya`, {parse_mode : "HTML"});
    const onDriveUploadStart = torr => bot.sendMessage(from, `📤 Uploading <code>${torr.name}</code> to a random stoarge... \n\n 😜 wo actully ammi bulaa rehi hain warna \n file le ke aap ke ghar aa jaati 🥺`, {parse_mode : "HTML"});

    if (link.indexOf("magnet:") !== 0) {
      bot.sendMessage(from, "Hey! Link is not a magnet link 😒️");
    } else {
      bot.sendMessage(from, "<code>📩️ Download Started 📩️  </code> \n\n to check status type /status 🧲 magnet link ", {parse_mode : "HTML"});
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
        bot.sendMessage(from, "An error occured 🤷‍♀️️\n" + e.message);
      }
    }
  });

  bot.onText(statusRegex, (msg, match) => {
    var from = msg.from.id;
    var link = match[1];

    const torr = torrent.get(link);
    if (link.indexOf("magnet:") !== 0) {
      bot.sendMessage(from, "Hey! Link is not a magnet link 😒️");
    } else if (!torr) {
      bot.sendMessage(from, "Not downloading please add 😌️");
    } else {
      let mess1 = "";
      mess1 += `<b>Name 🏷️:</b> <code>${torr.name}</code>\n\n`;
      mess1 += `<b>Status 📱:</b> <code>${torr.status}</code>\n\n`;
      mess1 += `<b>Size 📏:</b> <code>${torr.total}</code>\n\n`;
      if (!torr.done) {
        mess1 += `<b>Downloaded ✅:</b> <code>${torr.downloaded}</code>\n\n`;
        mess1 += `<b>Speed 🚀:</b> <code>${torr.speed}</code>\n\n`;
        mess1 += `<b>Progress 📥:</b> <code>${torr.progress}</code>\n\n`;
        mess1 += `<b>Time Remaining ⏳:</b> <code>${torr.redableTimeRemaining}</code>\n\n`;
      } else {
        mess1 += `<b>You have the Download Link 🔗 \n  dont ask me if you lost \n 😌️</b>\n\n`;
      }
      mess1 += `<b>Magnet URI 🧲:</b> <code>${torr.magnetURI}</code>`;
      bot.sendMessage(from, mess1, {parse_mode : "HTML"});
    }
  });

  bot.onText(removeRegex, (msg, match) => {
    var from = msg.from.id;
    var link = match[1];

    try {
      torrent.remove(link);
      bot.sendMessage(from, "Cancelled That Torrent 😏️");
    } catch (e) {
      bot.sendMessage(from, `${e.message}`);
    }
  });
}

module.exports = bot;
