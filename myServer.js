var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var info = {
    "code": 0,
    "message": "操作成功",
    "data": []
};
const puppeteer = require('puppeteer');
const xlsx = require('node-xlsx');
const fs = require('fs');
const sql = require('mysql');
const connection = sql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'email'
})
const path = require('path');
const template = require('art-template');
const nodemailer = require('nodemailer');

app.use(express.static("public")).listen(8080, function() {
    console.log('Server running at http://127.0.0.1:8080');
    connection.connect(); //卧槽，竟然可行了！
});

var urlencodeParser = bodyParser.urlencoded({ extended: false });
app.post('/post', urlencodeParser, (req, res) => {
    if (req.body.search) {
        (async() => {
            const browser = await puppeteer.launch({ 'headless': false }); //开启浏览器
            const page = await browser.newPage(); //新建页面
            await page.goto('https://www.tianyancha.com/') //跳转至天眼查官方页面
                //设置窗口大小
            await page.setViewport({
                width: 1920,
                height: 1080
            });

            await page.focus('.home-group .input'); //聚焦至输入框
            await page.keyboard.sendCharacter(req.body.search); //输入框输入检索关键字
            await page.click('.home-group .input-group-btn'); //点击查询按钮
            console.log("跳转至搜索页面"); //控制台输出状态信息

            //初始化xlsx文件输入数组
            var excelData = [];
            var addInfo = {};
            addInfo.data = [
                ["公司名称", "邮箱地址"],
            ];

            let count = 1; //由于查询页数限制，设置计数器

            //--------------查询内容页跳转---------------------
            await page.on('load', async() => {
                var arrayTitle = new Array();
                var arrayEmail = new Array(); //用于控制台输出检验
                for (var i = 0; i <= 20; i++) { //第一页的数据编号为0-2和4-20(第一页无第3项数据)，后四页数据编号为0-19.
                    var inform = new Array(); //初始化信息项数组 [公司名，邮箱]
                    try {
                        //获取公司名
                        const title = await page.$eval('#search_company_' + i + ' .search-result-single .header .name', ele => ele.innerText);
                        arrayTitle.push('第' + i + '个公司名：' + title);
                        inform.push(title); //将公司名添加进信息项数组第一个元素
                    } catch (err) { //当搜索到不存在的元素时，直接跳过，进行下一步 例如第一页没有编号为3的数据
                        continue;
                    }
                    try {
                        //获取邮箱
                        const email = await page.$eval('#search_company_' + i + ' .search-result-single .content .contact :nth-child(2) :nth-child(2)', ele => ele.innerText);
                        arrayEmail.push('第' + i + '个公司邮箱：' + email);
                        inform.push(email); //将邮箱添加进信息项第二个元素
                    } catch (err) { //当某一公司邮箱为空,捕获异常并将空元素添加进数组
                        const email = "";
                        arrayEmail.push('第' + i + '个公司邮箱：' + email);
                        inform.push(email); //将邮箱添加进信息项第二个元素
                    }

                    //console.log("ATTENTION:" + inform);
                    addInfo.data.push(inform); //将

                }
                //控制台输出数组验证
                console.log(arrayTitle);
                console.log(arrayEmail);

                //页数限制
                if (count < 5) { //设置在前5页进行数据查询
                    count = count + 1;
                    await page.click('.pagination .-next'); //下一页按钮 跳转下一页
                } else {
                    //写入xlsx数据文件
                    (async() => {
                        await excelData.push(addInfo);
                        var buffer = xlsx.build(excelData);
                        await fs.writeFile('./data.xlsx', buffer, function(err) {
                            if (err) {
                                throw err;
                            }
                            console.log('Write to xlsx has finished');
                        });
                        await browser.close();
                    })();
                }
            });

        })();
    }

    res.redirect('/loading.html');
})

//POST body  GET query

app.get('/get', (req, res) => {
    function push(result) {
        if (info.data.length == 0) { //info.data为.js文件定义的用于存储数据库记录的数组
            for (var i = 0; i < result.length; i++) { //循环将数据库记录添加进info.data数组
                info.data.push({
                    "id": result[i].id,
                    "company": result[i].company,
                    "email": result[i].email,
                    "first": result[i].first,
                    "second": result[i].second,
                    "third": result[i].third,
                    "fourth": result[i].fourth,
                    "fifth": result[i].fifth,
                    "received": result[i].received
                })
            }
        }

    }
    var sql = 'SELECT * FROM send'; //查询数据库表所有数据
    connection.query(sql, function(err, result) {
        if (err) {
            console.log('[SELECT ERROR] - ', err.message);
            return;
        }
        push(result); //将result值传至push函数
    });
    return res.json(info);
})

app.get('/insert', (req, res) => {
    const sheets = xlsx.parse('./test.xlsx'); //读取excel文件
    //connection.connect();
    sheets.forEach(sheet => { //文件中表的遍历，只设置一个sheet表
        const len = sheet['data'].length - 1;
        for (var i = 1; i <= len; i++) { //循环获取公司名和邮箱数据项并加入数据库
            const email = JSON.stringify(sheet['data'][i][1]);
            const company = JSON.stringify(sheet['data'][i][0]); //将 JavaScript 值转换为 JSON 字符串。
            if (email.indexOf("@") > 0) { //判断是否为正确邮箱格式
                var addSql = 'INSERT INTO send(id,company,email) VALUES(?,?,?)';
                var addSqlParams = [i, company, email];
                connection.query(addSql, addSqlParams, function(err, result) {
                    if (err) {
                        console.log('[数据添加失败]', err.message);
                        return;
                    }
                    console.log("[数据添加成功]");
                });
            } else {
                var addSql = 'INSERT INTO send(id,company,email) VALUES(?,?,?)';
                var addSqlParams = [i, company, 'null'];
                connection.query(addSql, addSqlParams, function(err, result) {
                    if (err) {
                        console.log('[数据添加失败]', err.message);
                        return;
                    }
                    console.log("[数据添加成功]");
                });
            }
        }
    })
    res.redirect('/stushow.html');
})

app.get('/send', (req, res) => {
    console.log(req.query);
    //email pass server postname subject core
    if (res) {
        function sendSuccess(info, id, times) {
            if (JSON.stringify(info).indexOf("OK") > 0) { //正确发送时在info字符串中会有ok字符 以此判断是否发送成功
                var timesCol = 'first';
                if (times == 1) {
                    timesCol = 'second';
                } else if (times == 2) {
                    timesCol = 'third';
                } else if (times == 3) {
                    timesCol = 'fourth';
                } else if (times == 4) {
                    timesCol = 'fifth';
                }
                var d = new Date(),
                    str = "";
                str += d.getMonth() + 1 + '月';
                str += d.getDate() + '日';
                str += d.getHours() + ':';
                str += d.getMinutes();

                var modSql = 'UPDATE send SET times = ?,' + timesCol + '=? WHERE id = ?'; //发送成功后修改表中对应公司记录的times及第n次时间的数据项
                var modSqlParams = [times + 1, str, id];
                connection.query(modSql, modSqlParams, function(err, result) {
                    if (err) {
                        console.log('[UPDATE ERROR] - ', err.message);
                        return;
                    }
                    console.log(id, "号公司邮件发送成功");
                    return;
                });
                return;
            } else { //未成功发送
                console.log("邮件未成功发送");
                return;
            }
        }

        function sendMail(email, id, times) { //nodemail发送邮件
            const htmla = template(path.join(__dirname, req.query.core), {}); //根据要发送内容的html地址读取文件
            let transporter = nodemailer.createTransport({
                host: req.query.server,
                port: 465,
                secure: true,
                auth: {
                    user: req.query.email, //req.query为前端传入值
                    pass: req.query.pass
                }
            });
            let mailOptions = {
                from: req.query.postname + '<' + req.query.email + '>',
                to: email,
                subject: req.query.subject,
                html: htmla
            };
            transporter.sendMail(mailOptions, (err, info) => {
                if (err) { //发送失败
                    console.log(err);
                    sendSuccess(err, id, times);
                    return;
                } else { //发送成功
                    sendSuccess(info.response, id, times); //传值并执行sendSuccess方法
                    return;
                }
            });
        }

        function process(result) {
            console.log("待发送邮箱数：", result.length);
            for (var i = 0; i < result.length; i++) {
                var email = result[i]['email'];
                var id = result[i]['id'];
                var times = result[i]['times'];
                console.log("开始发送-", email);
                if (times < 5) { //当此邮箱未发送超过5次
                    sendMail(email, id, times); //正常执行发送方法
                } else {
                    console.log(id, "号发送超过5次了,现在将要退出");
                    continue;
                }
            }
            return;
        }

        var sql = 'SELECT id,email,times FROM send where email!="null" and received=0';
        //The requirements of sending is that Email col is not null and it hasnt been recevied
        connection.query(sql, function(err, result) {
            if (err) {
                console.log('[SELECT ERROR] - ', err.message);
                return;
            }
            process(result);
            return;
        });
        res.redirect('/stushow.html');
    }
})

app.get('/confirm', (req, res) => {
    var modSql = 'UPDATE send SET received = ? WHERE id = ?';
    var modSqlParams = [1, req.query.confirm];
    connection.query(modSql, modSqlParams, function(err, result) {
        if (err) {
            console.log('[UPDATE ERROR] - ', err.message);
            return;
        }
        return;
    });
    res.redirect('/stushow.html');
})

app.get('/change', (req, res) => {
    if (req.query.address.indexOf("@") > 0) { //判断输入的邮箱地址是否正确
        var modSql = 'UPDATE send SET email=? WHERE Id = ?';
        var modSqlParams = [req.query.address, req.query.id];
        connection.query(modSql, modSqlParams, function(err, result) {
            if (err) {
                console.log('[UPDATE ERROR] - ', err.message);
                return;
            }
            return;
        });
    } else {
        console.log("请输入正确修改的邮箱地址格式");
    }
    res.redirect('/stushow.html'); //重定向至浏览页面
})

app.get('/destory', (req, res) => {
    var modSql = 'UPDATE send SET email=? WHERE Id = ?';
    var modSqlParams = [null, req.query.id];
    connection.query(modSql, modSqlParams, function(err, result) {
        if (err) {
            console.log('[UPDATE ERROR] - ', err.message);
            return;
        }
        return;
    });
    res.redirect('/stushow.html');
})