const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const express = require('express');
const keep_alive = require('./keep_alive.js');

// Создаем новый экземпляр клиента Discord с указанием намерений
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ]
});

// Токен вашего бота
const TOKEN = process.env.DISCORD_TOKEN;

// Создаем экземпляр Express
const app = express();
const PORT = process.env.PORT || 3001; // Изменяем порт для второго бота

// Пустой обработчик маршрута, чтобы удовлетворить требования Render по открытым портам
app.get('/', (req, res) => {
  res.send('Bot is running!');
});

// Запускаем HTTP-сервер
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Функция для запроса информации о сервере игры
async function retrieveStats() {
  const response = await fetch('https://www.gs4u.net/en/s/147078.html');
  const html = await response.text();

  const playersOnline = parseInt(html.split('<b itemprop="playersOnline">')[1].split('<')[0].trim());
  const currentMap = html.split('Search server with a map: ')[1].split('"')[0];
  const scoreBoard = [];

  const serverPlayers = html.split('<table class="serverplayers tablesorter table table-striped table-hover" style="width:100%;">')[1];
  for (let i = 1; i < playersOnline; i++) {
    const username = serverPlayers.split('<td class="other_color_text">')[i]?.split('<')[0];
    const score = parseInt(serverPlayers.split('<td class="score">')[i]?.split('<')[0]);
    const time = serverPlayers.split('<td class="time">')[i]?.split('<')[0];

    scoreBoard[i] = { username, score, time };
  }

  scoreBoard.shift();
  scoreBoard.sort((a, b) => a.score - b.score);
  scoreBoard.reverse();

  return { playersOnline, currentMap, scoreBoard };
}

// Функция для обновления статуса бота с использованием метода setPresence
async function updateStatus() {
    try {
        const stats = await retrieveStats();
        if (stats) {
            let mapName = stats.currentMap;
            if (mapName.startsWith('RSTE-')) {
                mapName = mapName.substring(5); // Удаляем "TE-" из начала названия карты
            }
            const numPlayers = stats.playersOnline;

            // Обновляем статус с использованием метода setPresence
            client.user.setPresence({
                activities: [{
                    name: `${mapName} with ${numPlayers} players`,
                    type: ActivityType.PLAYING
                }],
                status: 'online'
            });
        } else {
            // Если не удалось получить информацию о сервере игры, устанавливаем статус "Не удалось получить информацию"
            client.user.setPresence({
                activities: [{
                    name: 'Не удалось получить информацию',
                    type: ActivityType.PLAYING
                }],
                status: 'online'
            });
        }
    } catch (error) {
        console.error('Ошибка при запросе информации о сервере игры:', error);
        client.user.setPresence({
            activities: [{
                name: 'Ошибка при запросе информации о сервере игры',
                type: ActivityType.PLAYING
            }],
            status: 'online'
        });
    }
}

// Функция для отправки keep-alive запроса к серверу
async function sendKeepAliveRequest() {
    try {
        await fetch('http://localhost:' + PORT); // Отправляем запрос к корневому маршруту
        console.log('Keep-alive request sent.');
    } catch (error) {
        console.error('Ошибка при отправке keep-alive запроса:', error);
    }
}






// Событие при успешном запуске бота
client.once('ready', () => {
    console.log('Бот запущен!');
    // Вызываем функцию обновления статуса
    updateStatus();
    // Обновляем статус каждые 1 минуту (60 000 миллисекунд)
    setInterval(updateStatus, 60000);


    // Отправляем keep-alive запрос каждые 5 минут (300 000 миллисекунд)
    setInterval(sendKeepAliveRequest, 120000);
});

// Запускаем бота
client.login(TOKEN);
