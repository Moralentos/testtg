
const token = '5825779457:AAECDwkPKIJe84XNUa4ziog8E4cX8qzA8g4';

const {Telegraf} = require('telegraf');
const bot = new Telegraf(token);
const axios = require('axios');
const fs = require('fs');
const puppeteer = require('puppeteer');

const which = require('which');

// const puppeteer = require('puppeteer-extra');
// const stealth = require('puppeteer-extra-plugin-stealth');

// puppeteer.use(stealth());


bot.on('photo', async (ctx) => {
  const messageProcessing = await ctx.reply("Обработка...")
  let fileId
  try {
  const start = new Date().getTime()
    // Get the file ID of the photo sent by the user
  console.log("1");
  fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
  // Download the photo using the telegram bot API
  const response = await axios.get(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
  const filePath = response.data.result.file_path;
  console.log("2");
  const imageUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;
  // Download the photo using Axios
  const { data } = await axios.get(imageUrl, {
    responseType: 'arraybuffer'
  });
  console.log("3");
  // Write the photo to the "img" folder
  fs.writeFileSync(`img/${fileId}.jpg`, data, 'binary');
  console.log("Запуск puppeteer");

  const browser = await puppeteer.launch({
    // executablePath: 'E:/Chromium/chrome.exe',
    headless: false,
    args: ['--no-sandbox']
    });

    console.log("4");
    // Open a new page in the browser
    const page = await browser.newPage();
    console.log("4.5");
    // Navigate to the Imgur upload page
    await page.goto('https://ezgif.com/image-to-datauri', setTimeout(() => {
    console.log("Wait 1s");
    // page.goto(`https://ezgif.com/image-to-datauri`)
    page.click('.button.primary');
    }, 3000));
    // console.log("Click");
    // await page.click('.button.primary');
    // setTimeout(() => {}, 2000);
    console.log("5");
    // Wait for the file input to be visible and then upload the file
    await page.waitForSelector('input[type="file"]');
    console.log("5.5");
    // await page.click('input[type="file"]');
    console.log("6");
    const inputUpload = await page.$('input[type="file"]');
    let fileToUpload = `img/${fileId}.jpg`;
    // await page.uploadFile(`img/${fileId}.jpg`);
    console.log("7");
    inputUpload.uploadFile(fileToUpload);
    await page.click('.button.primary');
    // Wait for the upload to complete and then extract the URL of the uploaded image
    await page.waitForSelector('#target[src]');
    console.log("8");
    const src = await page.$eval('#target[src]', img => img.src);
    console.log(src);
    // await browser.close();
    fs.unlinkSync(`img/${fileId}.jpg`);

    await page.goto('https://saucenao.com/index.php');
    await page.type('#urlInput', src);
    await page.click('#searchButton');
    await page.waitForSelector('.resulttitle', { timeout: 0 });
    const title = await page.evaluate(() => {
      return document.querySelector('.resulttitle').textContent;
    });
    await browser.close();

    await ctx.telegram.deleteMessage(messageProcessing.chat.id, messageProcessing.message_id) //Удаление сообщения
    console.log(title);
    let end = new Date().getTime()
    ctx.replyWithHTML(
      `✅ Аниме найдено\n\n<b>Название:</b> <i>${title}</i>\n\nВремя выполнения: ${end - start}ms`
    )
  } catch (error){
    await ctx.telegram.deleteMessage(messageProcessing.chat.id, messageProcessing.message_id) //Удаление сообщения
    await ctx.reply("❌ Не удалось обработать картинку")
    console.log(`Текущая ошибка: ${error}`);
      try {fs.unlinkSync(`img/${fileId}.jpg`);}
      catch (error){console.log("Picture not found");}
  }
    // Reply to the user with the URL of the uploaded image
});


bot.on('message', async msg => {
  const text = msg.text;
  const chatId = msg.chat.id;
  bot.telegram.sendMessage(chatId, `123`, {parse_mode: "HTML"})
})

bot.startPolling();