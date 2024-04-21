const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000; // Устанавливаем порт 10000 по умолчанию или получаем его из переменной окружения PORT

app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Прослушиваем порт на хосте 0.0.0.0
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
