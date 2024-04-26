// Импорт необходимых модулей
const express = require('express');
const fs = require('fs');
const path = require('path');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { StaticRouter, matchPath } = require('react-router-dom');

// Создание экземпляра Express
const app = express();

// Импорт компонента App и маршрутов
const { App } = require('../src/components/app');
const routes = require('./routes');

// Статическая выдача файлов
app.get(/\.(js|css|map|ico)$/, express.static(path.resolve(__dirname, '../dist')));

// Обработка всех остальных запросов
app.use('*', async (req, res) => {
    // Определение соответствующего маршрута
    const matchRoute = routes.find(route => matchPath(req.originalUrl, route));

    // Получение данных компонента, если они есть
    let componentData = null;
    if (typeof matchRoute.component.fetchData === 'function') {
        componentData = await matchRoute.component.fetchData();
    }

    // Чтение содержимого файла index.html
    let indexHTML = fs.readFileSync(path.resolve(__dirname, '../dist/index.html'), {
        encoding: 'utf8',
    });

    // Рендеринг компонента App в строку HTML
    let appHTML = ReactDOMServer.renderToString(
        <StaticRouter location={req.originalUrl} context={componentData}>
            <App />
        </StaticRouter>
    );

    // Вставка строки HTML с компонентом App в макет index.html
    indexHTML = indexHTML.replace('<div id="app"></div>', `<div id="app">${appHTML}</div>`);

    // Установка значения глобальной переменной initial_state
    indexHTML = indexHTML.replace(
        'var initial_state = null;',
        `var initial_state = ${JSON.stringify(componentData)};`
    );

    // Установка заголовка и статуса
    res.contentType('text/html');
    res.status(200);

    // Отправка HTML-страницы в качестве ответа на запрос
    return res.send(indexHTML);
});

// Запуск Express-сервера на порту 9000
app.listen('9000', () => {
    console.log('Express server started at http://localhost:9000');
});
