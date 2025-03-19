// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import Book from './model/bookUtil';
import fs from 'fs';
import { error } from 'console';
// 状态栏
let nextBar: vscode.StatusBarItem | null = null
let prevBar: vscode.StatusBarItem | null = null
let hideBar: vscode.StatusBarItem | null = null
let jumpBar: vscode.StatusBarItem | null = null
function init() {
	// 上一页的bar
	prevBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
	prevBar.text = "上一页";
	prevBar.command = 'novelexttype.getPreviousPage'

	// 下一页的bar
	nextBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
	nextBar.text = "下一页";
	nextBar.command = 'novelexttype.getNextPage'
	// 老板键的bar
	hideBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
	hideBar.text = "隐藏";
	hideBar.command = 'novelexttype.displayCode'
	// 展示的bar
	jumpBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
	jumpBar.text = "显示";
	jumpBar.command = 'novelexttype.getJumpingPage'
}
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	init();

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "novelexttype" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('novelexttype.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from NovelExtType!');
	});

	const clearOpenDirBook = vscode.commands.registerCommand('novelexttype.clearOpenDirBook', () => {
		context.globalState.update("novelexttype.bookName", undefined)
			.then(() => {
				vscode.window.showInformationMessage("清除成功");
			}, () => {
				vscode.window.showErrorMessage("清除失败");
			});
	});
	const openDirBook = (msg: string) => {
		let ls = [];
		var pattern = /(^\"*)|(\"*$)/g;
		console.log(msg.replace(pattern, ""))
		let path = msg.replace(pattern, "");
		let tmp = fs.readFileSync(path);
		let x = tmp.toLocaleString();
		x = x.replace(/ +/g, '').replace(/<\/p>/g, '\n').replace(/<p>/g, '').replace(/&emsp;/g, '').replace(/\t/g, '');
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
		context.globalState.update("novelexttype.text", ls);
		console.log("get Book");
		context.workspaceState.update('novelexttype.currPageNumber', 0);
		vscode.window.showInformationMessage("数据已抓取,数据长度" + ls.length);
		context.globalState.update("novelexttype.bookName", msg);
		hideAllBar();
	};
	const jumpToPage = vscode.commands.registerCommand('novelexttype.jumpToPage', () => {
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
			// context.workspaceState.update('novelexttype.currPageNumber', 0);
			/** @type string[] */
			let s = context.globalState.get<string>("novelexttype.text") ?? "";
			for (let i = 0; i < s.length; i++) {
				// console.log(s[i]);
				if (s[i].indexOf(msg as string) > -1) {
					vscode.window.showInformationMessage('行数:' + i);
					context.workspaceState.update('novelexttype.currPageNumber', i);
					JumpingPage();
					break;
				}
			}
		});
	});
	const tryOpenDirBook = vscode.commands.registerCommand('novelexttype.openDirBook', () => {

		let msg = context.globalState.get<string>("novelexttype.bookName");
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
				openDirBook(msg as string);
			});
		}
	});
	// 老板键
	const displayCode = vscode.commands.registerCommand('novelexttype.displayCode', () => {
		console.log('novelexttype.displayCode');
		vscode.window.setStatusBarMessage('');
		hideAllBar();
	});

	// 下一页
	const getNextPage = vscode.commands.registerCommand('novelexttype.getNextPage', () => {
		console.log('novelexttype.getNextPage');
		let books = new Book(context);
		vscode.window.setStatusBarMessage(books.getNextPage());
		showBar();
	});

	// 上一页
	const getPreviousPage = vscode.commands.registerCommand('novelexttype.getPreviousPage', () => {
		console.log('novelexttype.getPreviousPage');

		let books = new Book(context);
		vscode.window.setStatusBarMessage(books.getPreviousPage());
		showBar();
	});

	const JumpingPage = () => {
		let books = new Book(context);
		let tmp = books.getJumpingPage();
		console.log(tmp, "tmp");
		vscode.window.setStatusBarMessage(tmp);
		showBar();
	};

	// 跳转某个页面
	const getJumpingPage = vscode.commands.registerCommand('novelexttype.getJumpingPage', () => {
		console.log('novelexttype.getJumpingPage');
		JumpingPage();
	});

	const showBar = () => {
		prevBar?.show();
		nextBar?.show();
		hideBar?.show();
		jumpBar?.hide();
	};
	const hideAllBar = () => {
		prevBar?.hide();
		nextBar?.hide();
		hideBar?.hide();
		jumpBar?.show();
	};
	context.subscriptions.push(disposable);
	context.subscriptions.push(tryOpenDirBook);
	context.subscriptions.push(jumpToPage);

	context.subscriptions.push(displayCode);
	context.subscriptions.push(getPreviousPage);
	context.subscriptions.push(getNextPage);
	context.subscriptions.push(getJumpingPage);
	context.subscriptions.push(clearOpenDirBook);
}

// This method is called when your extension is deactivated
export function deactivate() { }
