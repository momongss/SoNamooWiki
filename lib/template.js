module.exports = {
    HTML:function(MainTitle, title, content, control){
      return `
      <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${MainTitle}</title>
        </head>
        <body>
            <h1><a href="/">${MainTitle}</a></h1>
            <form action="/page">
                <input type="text" name="title" placeholder="검색">
                <input type="submit" value="검색">
            </form>        
            <p>제목 : ${title}</p>
            <p>내용 : ${content}</p>
            <p>${control}</p>
        </body>
        </html>
        `;
    }
}
  