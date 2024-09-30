function get429Page (message) {
  return `<!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset='utf-8'>
          <meta name="viewport" content="width=device-width,initial-scale=1">
          <meta name="robots" content="noindex, nofollow">
          <title>Too Many Requests</title>
          <link rel="preconnect" href="https://fonts.gstatic.com">
          <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;900&display=swap" rel="stylesheet">
          <style>
              html, body {
              width: 100%;
              height: 100%;
              margin: 0;
              padding: 0;
              font-family: 'Montserrat', sans-serif;
              font-size: 25px;
              }
              main {
              width: 100%;
              height: 100%;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              }
              h1 {
              background: linear-gradient(90deg, #d53369 0%, #daae51 100%);
              -webkit-background-clip: text;
              -moz-background-clip: text;
              background-clip: text;
              -webkit-text-fill-color: transparent;
              -moz-text-fill-color: transparent;
              text-fill-color: transparent;
              color: #d53369;
              }
          </style>
      </head>
      <body>
          <main>
              <h1>Hey, slow down!</h1>
              <p>${message}</p>
          </main>
      </body>
      </html>
    `;
}

module.exports = get429Page;
