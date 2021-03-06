// 기본 nodeJS 버전

var http = require('http');
var fs = require('fs');
var qs = require('querystring');
var url = require('url');
var schedule = require('node-schedule');

// topN 조회수 기록 주기
// *  *  *  *  *  *
// 초 분 시 일 달 주
var j = schedule.scheduleJob('1 * * * * *', function(){
    console.log('time event');
    RecordTopViewedDocs(5);
});


function templateHTML(MainTitle, title, content, control, list){
    var mainURL = `http://localhost:3001`;

    var template = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${MainTitle}</title>
    </head>
    <body>
        <script type="text/javascript" src="buttonEvent.js"></script>
        <h1><a href="/">${MainTitle}</a></h1>
        <form action="/">
            <input type="text" name="title" placeholder="검색">
            <input type="submit" value="검색">
        </form>
        <p>${list}</p>
        <p>제목 : ${title}</p>
        <p>내용 : ${content}</p>
        <p>${control}</p>
    </body>
    </html>
    `;
    return template;
}

// 조회수 상위 n 인 문서 이름가져오기
function RecordTopViewedDocs(N){ 
    fs.readFile(`wiki_docs/meta/viewCount`, `utf8`, function(err, rawData){
        dict = JSON.parse(rawData);
        let titleList = Object.keys(dict);
        let List = [];
        for (let i in titleList){            
            List.push([titleList[i], dict[titleList[i]]]);
        }
        let sortedList = List.sort(function(a, b){
            return b[1] - a[1];
        });

        let topN = [];
        for (let i=0; i < N; i++){
            topN.push(sortedList[i][0]);
        }
        console.log("상위 N개 문서 : ", topN);
        
        fs.writeFile(
            `wiki_docs/meta/topN`, JSON.stringify(topN), 'utf8', function(err){});
    });
}

function UpdateViewCount(title){
    fs.readFile(`wiki_docs/meta/viewCount`, `utf8`, function(err, rawData){
        dict = JSON.parse(rawData);
        if (title in dict) {
            dict[title] += 1;    
        } else {
            console.log('Error : 조회수 데이터 사라짐.');
            dict[title] = 0;
        }
        fs.writeFile(
            `wiki_docs/meta/viewCount`, JSON.stringify(dict), 'utf8', function(err){});
    });
}

var app = http.createServer(function(request,response){
    var _url = request.url;
    var queryData = url.parse(_url, true).query;
    var pathname = url.parse(_url, true).pathname;

    console.log(pathname);

    if (pathname === `/`){
        let title;
        if (queryData.title === undefined) {
            title = "소나무위키 대문";
        }            
        else {
            title = queryData.title;
        }
        fs.readdir('./wiki_docs', function(error, filelist){
            if (filelist.includes(title)){
                fs.readFile(`wiki_docs/${title}`, `utf8`, function(err, _description){
                    fs.readFile(`wiki_docs/meta/topN`, `utf8`, function(err, rawTopNList){
                        let topNList = JSON.parse(rawTopNList);
                        let topNLink = ``;
                        for (let i in topNList){
                            topNLink += `<p><a href="/?title=${topNList[i]}">${topNList[i]}</a></p>`
                        }

                        let template = templateHTML(
                            `소나무위키~~`,
                            title,
                            _description,
                            `<form action="/edit_page" method="post">
                                <input type="submit" value="문서 편집">
                                <input type="hidden" name="title" value=${title}>
                                <input type="hidden" name="description" value=${_description}>
                            </form>`,
                            topNLink
                        );
    
                        response.writeHead(200);
                        response.end(template);
                    });
                    
                    UpdateViewCount(title);
                });
            } else {
                let template = templateHTML(
                    `소나무위키~~`,
                    `${title}`,
                    `찾는 문서가 없습니다~~~`,
                    `<form action="/create_page?title=${title}" method="post">
                        <input type="submit" value="새 문서 만들기!!!">
                    </form>`
                );
                response.writeHead(200);
                response.end(template);
            }
        });     
    }
    
    else if (pathname === `/create_page`) {
        var template = ``;

        // Processing
        if (queryData.status === `process`){
            var body = '';
            request.on('data', function(data){
                body += data;
            });
            request.on('end', function(){
                let post = qs.parse(body);
                let title = post.title;
                let description = post.description;
                let viewCount = 0;
                fs.writeFile(
                    `wiki_docs/${title}`, 
                    description, 
                    'utf8', 
                    function(err){
                        response.writeHead(302, {Location:  `/?title=` + qs.escape(title)});
                        response.end("success");
                    }
                );

                UpdateViewCount(title);
            });
        }

        // Create Page
        else {
            var title = queryData.title;

            template = templateHTML(
                `소나무위키~~`,
                `${title}`,
                `
                <p><button id="hw">Click me</button></p>
                <form action="/create_page?status=process" method="post">
                    <p><input type="hidden" name="title" value="${title}"></p>                    
                    <p><textarea cols="50" rows="10" placeholder="내용" name="description"></textarea></p>
                    <p><input type="submit" value="Submit"></p>
                </form>`,
                ``
            );
            response.writeHead(200);
            response.end(template);
        }
    }
    
    else if (pathname === `/edit_page`) {
        if (queryData.status === `process`){
            var body = '';
            request.on('data', function(data){
                body += data;
            });
            request.on('end', function(){
                var post = qs.parse(body);
                var title = post.title;
                var description = post.description;
                fs.writeFile(`wiki_docs/${title}`, description, 'utf8', function(err){
                    response.writeHead(302, {Location: `/?title=` + qs.escape(title)});
                    response.end("success");
                });
            });
        }

        else {
            var body = '';
            request.on('data', function(data){
                body += data;
            });
            request.on('end', function(){
                var post = qs.parse(body);
                var title = post.title;
                var description = post.description;
                template = templateHTML(
                    `소나무위키~~`,
                    `${title}`,
                    `
                    <form action="/edit_page?status=process" method="post">
                        
                        <p><input type="hidden" name="title" value="${title}"></p>
                        <p><textarea cols="50" rows="10" name="description">${description}</textarea></p>
                        <p><input type="submit" value="편집"></p>
                    </form>`,
                    ``
                );
                response.writeHead(200);
                response.end(template);
            });
        }
    } 

    // 사이트내 존재하지 않는 페이지일 경우 메인페이지로 이동
    // 여기서 else 문을 처리해주지 않을 경우 페이지 로드가 정상적으로 안될 수 있음.
    else {
        response.writeHead(302, {Location: `/`});
        response.end("success");
    }
});
app.listen(3000); // ==> ip & port 번호까지 완료