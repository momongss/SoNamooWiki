// express 버전으로 포팅

const express = require('express');
const app = express();
const fs = require('fs');
const template = require('./lib/template.js');
const qs = require('querystring');
const path = require('path');

app.get('/', function(request, response){
    request.url;
    let title = "소나무위키 대문";

    fs.readFile(`wiki_docs/${title}`, `utf8`, function(err, _description){
        let html = template.HTML(
            `소나무위키~~`, 
            title, 
            _description, 
            `<form action="/edit_page" method="post">
                <input type="submit" value="문서 편집">
                <input type="hidden" name="title" value=${title}>
                <input type="hidden" name="description" value=${_description}>
            </form>`
        );
        response.send(html);
    });
});

function fileExists(filelist, file){
    if (file in filelist)
        return true;
    return false;
}

app.get('/page/:pageId', function(request, response) {
    const pageId = path.parse(request.params.pageId).base;
    fs.readdir(`./wiki_docs`, function(error, filelist){
        if (!fileExists(filelist, pageId)){
            const title = pageId;
            const html = template.HTML(
                `소나무위키~~`,
                title,
                `찾는 문서가 없습니다~~~`,
                `<form action="/create_page?title=${title}" method="post">
                    <input type="submit" value="문서 만들기">
                </form>`
            );
            response.send(html);
            return;
        }
        fs.readFile(`wiki_docs/${pageId}`, `utf8`, function(err, _description){
            const title = pageId;
            const html = template.HTML(
                `소나무위키~~`,
                title,
                _description,
                `<form action="/edit_page" method="post">
                    <input type="submit" value="문서 편집">
                    <input type="hidden" name="title" value=${title}>
                    <input type="hidden" name="description" value=${_description}>
                </form>` 
            );
            response.send(html);
        });
    
    });
});

app.get('/create_page', function(request, response){
    var title = queryData.title;

    template = templateHTML(
        `소나무위키~~`,
        `${title}`,
        `
        <p><button id="hw">Click me</button></p>
        <form action="/create_process" method="post">
            <p><input type="hidden" name="title" value="${title}"></p>                    
            <p><textarea cols="50" rows="10" placeholder="내용" name="description"></textarea></p>
            <p><input type="submit" value="Submit"></p>
        </form>`,
        ``
    );
    response.writeHead(200);
    response.end(template);
});

app.post('/create_process', function(request, response){
    var body = '';
    request.on('data', function(data){
        body += data;
    });
    request.on('end', function(){
        var post = qs.parse(body);
        var title = post.title;
        var description = post.description;
        fs.writeFile(`wiki_docs/${title}`, description, 'utf8', function(err){
            response.writeHead(302, {Location:  `/page/${title}`});
            response.end("success");
        });
    });
});

app.listen(4000, () => console.log('4000 opened'));