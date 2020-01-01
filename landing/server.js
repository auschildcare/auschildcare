require('regenerator-runtime/runtime');
const express = require('express');
const compression = require('compression');
const expressHelmet = require('helmet');
const morgan = require('morgan');

const { load } = require('cheerio');
const { join } = require('path');

const isDev = process.env.NODE_ENV === 'development';
const root = join(__dirname, 'dist');

// app SSR
const app = express();
app.use(compression());
app.use(expressHelmet());
app.use(morgan(isDev ? 'dev' : 'tiny'));
app.use(express.static(root));

app.get('/*', async (req, res) => {
  if (isDev) {
    delete require.cache[require.resolve('./dist/umi.server')];
  }
  global.window = {};
  const serverRender = require('./dist/umi.server');
  const { ReactDOMServer } = serverRender;
  let { htmlElement, rootContainer, matchPath } = await serverRender.default({
    req,
  });
  // direct unknown url into 404
  if (!matchPath) {
    req.url = '/404';
    res.status(404);
    const notFound = await serverRender.default({
      req,
    });
    htmlElement = notFound.htmlElement;
    rootContainer = notFound.rootContainer;
  }
  const ssrHtml = ReactDOMServer.renderToString(htmlElement);
  const { helmet } = rootContainer.props.context;
  const $ = load(ssrHtml);
  $('title').replaceWith(helmet.title.toString());
  $('head').append(helmet.meta.toString());
  res.type('html').send(`${'<!DOCTYPE html>'}${$.html()}`);
});

// start server
const port = process.env.PORT || 7500;
app.listen(port, () => {
  console.log(`SSR server listening on http://localhost:${port}/`);
});
