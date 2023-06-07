// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const Book = require('./bookUtil');
const superagent = require('superagent');
const QueryClass = require('./querClass');
const cheerio = require('cheerio');
const fs = require('fs');
const epub = require('epub');
// 状态栏
let nextBar = null
let prevBar = null
let hideBar = null
let jumpBar = null

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function init() {
    // 上一页的bar
    prevBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
    prevBar.text = "上一页";
    prevBar.command = 'novelExt.getPreviousPage'

    // 下一页的bar
    nextBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
    nextBar.text = "下一页";
    nextBar.command = 'novelExt.getNextPage'
    // 老板键的bar
    hideBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
    hideBar.text = "隐藏";
    hideBar.command = 'novelExt.displayCode'
    // 展示的bar
    jumpBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
    jumpBar.text = "显示";
    jumpBar.command = 'novelExt.getJumpingPage'
}
/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    init()
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated


    let disposable = vscode.commands.registerCommand('novelExt.helloWorld', function () {
        // The code you place here will be executed every time your command is executed
        vscode.window.showInformationMessage(superagent.toString());
        let q = new QueryClass();
        vscode.window.showInformationMessage(q.client);
        // Display a message box to the user
        vscode.window.showInformationMessage('Hello World from novelExt!');
    });
    let login = function ( /** @type {{ username?: any; password?: any; }} */ info) {
        let query = new QueryClass();
        query.d = info;
        console.log("query", query);
        // @ts-ignore
        superagent.post('https://www.lightnovel.us/proxy/api/user/login')
            .set('content-type', 'application/json; charset=UTF-8')
            .send(query)
            .set({ 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36' })
            .end(function (/** @type {{ text: string; }} */ res,/** @type {{ text: string; }} */ err) {
                console.log(res === null, err === null);
                if (res === null)
                    res = err;
                let ress = JSON.parse(res.text);
                console.log("ress", ress);
                if (ress.code === 0) {
                    // console.log("ress.data.security_key", ress.data.security_key);
                    if (ress.data !== undefined && ress.data.security_key !== undefined) {
                        let security_key = ress.data.security_key;
                        context.workspaceState.update("novelExt.security_key", security_key);
                        context.globalState.update("novelExt.username", info.username);
                        context.globalState.update("novelExt.password", info.password);
                        vscode.window.showInformationMessage(info.username + "登录");
                    } else {
                        vscode.window.showErrorMessage(JSON.stringify(ress));
                    }
                } else {
                    vscode.window.showWarningMessage(ress);
                }
            });
    }
    let tryLogin = vscode.commands.registerCommand('novelExt.login', () => {
        let info = {
            username: context.globalState.get("novelExt.username"),
            password: context.globalState.get("novelExt.password")
        };
        console.log(typeof (info.username), info.username);
        if (info.username !== undefined) {
            login(info);
        } else {
            vscode.window.showInputBox({ // 这个对象中所有参数都是可选参数
                password: false, // 输入内容是否是密码
                ignoreFocusOut: true, // 默认false，设置为true时鼠标点击别的地方输入框不会消失
                placeHolder: '用户名', // 在输入框内的提示信息
                validateInput: function (text) {
                    if (text === undefined) { return '请输入用户名'; }
                    if (text === '') { return '请输入用户名'; }
                } // 对输入内容进行验证并返回
            }).then(msg => {
                console.log("用户输入：" + msg);
                if (msg !== undefined) {
                    info.username = msg;
                    vscode.window.showInputBox({ // 这个对象中所有参数都是可选参数
                        password: false, // 输入内容是否是密码
                        ignoreFocusOut: true, // 默认false，设置为true时鼠标点击别的地方输入框不会消失
                        placeHolder: '密码', // 在输入框内的提示信息
                        validateInput: function (text) {
                            if (text === undefined) { return '请输入密码'; }
                            if (text === '') { return '请输入密码'; }
                        } // 对输入内容进行验证并返回
                    }).then(msg => {
                        console.log("用户输入：" + msg);
                        if (msg !== undefined) {
                            info.password = msg;
                            login(info);
                        }
                    });
                }
            });
        }
    });
    let clearLogin = vscode.commands.registerCommand('novelExt.clearLogin', () => {
        context.globalState.update("novelExt.username", undefined);
        context.globalState.update("novelExt.password", undefined);
    });
    let clearOpenDirBook = vscode.commands.registerCommand('novelExt.clearOpenDirBook', () => {
        let flag=context.globalState.update("novelExt.bookName", undefined);
        if(flag){
            vscode.window.showInformationMessage("清除成功");
        }else{
            vscode.window.showErrorMessage("清除失败");
        }
    });
    let getCollections = vscode.commands.registerCommand('novelExt.getCollections', () => {
        let security_key = context.workspaceState.get("novelExt.security_key");
        console.log(security_key, "coll_se");

        if (security_key !== undefined && security_key !== '') {
            let dict = {
                class: 1,
                page: 1,
                type: 1,
                uid: "1153978",
                security_key: security_key
            };
            let query2 = new QueryClass();
            query2.d = dict;
            console.log("query2", query2);
            superagent.post('https://www.lightnovel.us/proxy/api/history/get-collections')
                .set('Content-Type', 'application/json')
                .send(JSON.stringify(query2))
                .set({ 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36' })
                .end(function (err, res) {
                    if (err) {
                        console.log("err", err);
                    } else {
                        let ress = JSON.parse(res.text);
                        let channel = vscode.window.createOutputChannel("cwmColle");
                        let list = ress.data.list;
                        console.log("list", list);

                        for (let i in list) {
                            console.log(list[i], i);

                            channel.appendLine("name:" + list[i].name);
                            channel.appendLine("sid:" + list[i].sid);
                            channel.appendLine("");
                        }
                        channel.show(true);
                    }
                });
        } else {
            vscode.window.showErrorMessage("请先登录");
        }
    });
    let openDirBook = (/** @type {string} */ msg) => {
        let ls = [];
        var pattern = /(^\"*)|(\"*$)/g;
        console.log(msg.replace(pattern, ""))
        let path = msg.replace(pattern, ""); 
        let tmp = fs.readFileSync(path);
        let x = tmp.toLocaleString();
        x = x.replace(/ +/g, '').replace(/<\/p>/g,'\n').replace(/<p>/g, '').replace(/&emsp;/g, '').replace(/\t/g, '');
        let s = x.split('\r');
        s = s.flatMap(it => it.split('\n'));
        // s.forEach(it => console.log(it));
        s = s.filter(it => it.length > 0);
        for (let it of s) {
            if (it.length < 35) {
                ls.push(it);
            } else {
                let len = it.length;
                for (let i = 0; i < len; i += 35) {
                    ls.push(it.substring(i, i + 35));
                }
            }
        }
        console.log("ls", ls);
        context.globalState.update("novelExt.text", ls);
        console.log("get Book");
        context.workspaceState.update('novelExt.currPageNumber', 0);
        vscode.window.showInformationMessage("数据已抓取,数据长度" + ls.length);
        context.globalState.update("novelExt.bookName", msg);
        hideAllBar();
        return;
        if (path.lastIndexOf('.txt') >= 0) {
            let tmp = fs.readFileSync(path);
            let x = tmp.toLocaleString();
            x = x.replace(/ +/g, '');
            let s = x.split('\r');
            s = s.flatMap(it => it.split('\n'));
            // s.forEach(it => console.log(it));
            s = s.filter(it => it.length > 0);
            for (let it of s) {
                if (it.length < 35) {
                    ls.push(it);
                } else {
                    let len = it.length;
                    for (let i = 0; i < len; i += 35) {
                        ls.push(it.substring(i, i + 35));
                    }
                }
            }
        } else if (path.lastIndexOf('.epub') >= 0) {
            const book = new epub(path);
            book.on("end", function () {
                book.flow.forEach(function (chapter) {
                    console.log("目录：", chapter.id);
                    book.getChapter(chapter.id, function (error, text) {
                        // 在这里把每一章的文本存到 txt 文件里面
                        console.log(error);
                        console.log(text);
                    });
                });
            });
            book.parse();
        } else {
            vscode.window.showErrorMessage("书名错误");
            return;
        }
        console.log("ls", ls);
        context.globalState.update("novelExt.text", ls);
        console.log("get Book");
        context.workspaceState.update('novelExt.currPageNumber', 0);
        vscode.window.showInformationMessage("数据已抓取,数据长度" + ls.length);
        context.globalState.update("novelExt.bookName", msg);
    }
    let jumpToPage = vscode.commands.registerCommand('novelExt.jumpToPage', () => {
        vscode.window.showInputBox({ // 这个对象中所有参数都是可选参数
            password: false, // 输入内容是否是密码
            ignoreFocusOut: true, // 默认false，设置为true时鼠标点击别的地方输入框不会消失
            placeHolder: '章节数，某一段文字', // 在输入框内的提示信息
            validateInput: function (text) {
                if (text === undefined) { return '章节数，某一段文字'; }
                if (text === '') { return '章节数，某一段文字'; }
            } // 对输入内容进行验证并返回
        }).then(msg => {
            console.log("open msg", msg);
            // context.workspaceState.update('novelExt.currPageNumber', 0);
            /** @type string[] */
            let s = context.globalState.get("novelExt.text");
            for (let i = 0; i < s.length; i++) {
                // console.log(s[i]);
                if (s[i].indexOf(msg) > -1) {
                    vscode.window.showInformationMessage('行数:' + i);
                    context.workspaceState.update('novelExt.currPageNumber', i);
                    JumpingPage();
                    break;
                }
            }
        });
    });
    let openBook = (msg) => {
        superagent.get('https://www.lightnovel.us/cn/detail/' + msg)
            .set('Content-Type', 'text/html; charset=utf-8')
            .set({ 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36' })
            .end(function (err, res) {
                if (err) {
                    console.log("err", err);
                } else {
                    let $ = cheerio.load(res.text);
                    let tmp = $('article #article-main-contents').text();
                    console.log(tmp, "tmp");
                    let s = tmp.split("　　");
                    if (s.length < 2)
                        s = s[0].split("　");
                    // s[0] = '';
                    s = s.filter(it => it !== '');
                    let ls = [];
                    for (let it of s) {
                        if (it.length < 35) {
                            ls.push(it);
                        } else {
                            let len = it.length;
                            for (let i = 0; i < len; i += 35) {
                                ls.push(it.substring(i, i + 35));
                            }
                        }
                    }
                    // for (let it of ls) {
                    //     console.log(it);
                    // }
                    context.globalState.update("novelExt.text", ls);
                    console.log("get Book");
                    context.workspaceState.update('novelExt.currPageNumber', 0);
                    // context.workspaceState.update("novelExt.aid", msg);
                    vscode.window.showInformationMessage("数据已抓取,数据长度" + ls.length);
                }
            });
    };
    let tryOpenDirBook = vscode.commands.registerCommand('novelExt.openDirBook', () => {

        let msg = context.globalState.get("novelExt.bookName");
        if (msg !== undefined) {
            openDirBook(msg);
        } else {
            vscode.window.showInputBox({ // 这个对象中所有参数都是可选参数
                password: false, // 输入内容是否是密码
                ignoreFocusOut: true, // 默认false，设置为true时鼠标点击别的地方输入框不会消失
                placeHolder: '书籍名称', // 在输入框内的提示信息
                validateInput: function (text) {
                    if (text === undefined) { return '请输入书籍名称'; }
                    if (text === '') { return '请输入书籍名称'; }
                } // 对输入内容进行验证并返回
            }).then(msg => {
                console.log("open msg", msg);
                openDirBook(msg);
            });
        }
    });
    let tryOpenBook = vscode.commands.registerCommand('novelExt.openBook', () => {
        vscode.window.showInputBox({ // 这个对象中所有参数都是可选参数
            password: false, // 输入内容是否是密码
            ignoreFocusOut: true, // 默认false，设置为true时鼠标点击别的地方输入框不会消失
            placeHolder: '书籍aid', // 在输入框内的提示信息
            validateInput: function (text) {
                if (text === undefined) { return '请输入书籍aid'; }
                if (text === '') { return '请输入书籍aid'; }
            } // 对输入内容进行验证并返回
        }).then(msg => {
            console.log("open msg", msg);
            openBook(msg);
        });
    });
    // 老板键
    let displayCode = vscode.commands.registerCommand('novelExt.displayCode', () => {
        console.log('novelExt.displayCode');
        vscode.window.setStatusBarMessage('');
        hideAllBar();
        // let channel = <OutputChannel>context.workspaceState.get("novelExt.channel");
        // channel.show(true);
        // channel.replace('');
    });

    // 下一页
    let getNextPage = vscode.commands.registerCommand('novelExt.getNextPage', () => {
        console.log('novelExt.getNextPage');
        let books = new Book(context);
        vscode.window.setStatusBarMessage(books.getNextPage());
        showBar();
        // let channel = <OutputChannel>context.workspaceState.get("novelExt.channel");
        // channel.show(true);
        // channel.replace(books.getNextPage());
    });

    // 上一页
    let getPreviousPage = vscode.commands.registerCommand('novelExt.getPreviousPage', () => {
        console.log('novelExt.getPreviousPage');

        let books = new Book(context);
        vscode.window.setStatusBarMessage(books.getPreviousPage());
        showBar();
        // let channel = <OutputChannel>context.workspaceState.get("novelExt.channel");
        // channel.show(true);
        // channel.replace(books.getPreviousPage());
    });

    let JumpingPage = () => {
        let books = new Book(context);
        let tmp = books.getJumpingPage();
        console.log(tmp, "tmp");
        vscode.window.setStatusBarMessage(tmp);
        showBar();
        // let channel = <OutputChannel>context.workspaceState.get("novelExt.channel");
        // console.log("novelExt.channel",channel);

        // channel.show(true);
        // channel.replace(tmp);
    };

    // 跳转某个页面
    let getJumpingPage = vscode.commands.registerCommand('novelExt.getJumpingPage', () => {
        console.log('novelExt.getJumpingPage');
        JumpingPage();
    });

    let showBar = () => {
        prevBar.show()
        nextBar.show()
        hideBar.show()
        jumpBar.hide()
    };
    let hideAllBar = () => {
        prevBar.hide()
        nextBar.hide()
        hideBar.hide()
        jumpBar.show()
    };
    context.subscriptions.push(tryLogin);
    context.subscriptions.push(clearLogin);
    context.subscriptions.push(getCollections);
    context.subscriptions.push(tryOpenBook);
    context.subscriptions.push(disposable);
    context.subscriptions.push(tryOpenDirBook);
    context.subscriptions.push(jumpToPage);

    context.subscriptions.push(displayCode);
    context.subscriptions.push(getPreviousPage);
    context.subscriptions.push(getNextPage);
    context.subscriptions.push(getJumpingPage);
    context.subscriptions.push(clearOpenDirBook);
}

// this method is called when your extension is deactivated
function deactivate() { }

module.exports = {
    activate,
    deactivate
}