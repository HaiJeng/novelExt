const vscode = require('vscode');

class Book {
    /**
     * @param {vscode.ExtensionContext} extensionContext
     */
    constructor(extensionContext) {
        this.extensionContext = extensionContext;
        this.curr_page_number = 0;
        this.page = 0;
    }
    /**
     * @param {string[]} text
     */
    getSize(text) {
        console.log("text", text)
        this.page = text.length - 1;
    }
    /**
     * @param {string} type
     */
    getPage(type) {

        let curr_page = this.extensionContext.workspaceState.get('novelExt.currPageNumber');
        if (curr_page === undefined) { curr_page = 0; }
        let page = 0;

        if (type === "previous") {
            if (curr_page <= 0) {
                page = 0;
            } else {
                page = curr_page - 1;
            }
        } else if (type === "next") {
            if (curr_page >= this.page) {
                page = this.page;
            } else {
                page = curr_page + 1;
            }
        } else if (type === "curr") {
            page = curr_page;
        }

        this.curr_page_number = page;
        // this.curr_page_number = this.extensionContext.globalState.get("book_page_number", 1);
    }

    updatePage() {

        this.extensionContext.workspaceState.update('novelExt.currPageNumber', this.curr_page_number);
        console.log("this.curr_page_number", this.curr_page_number);

        // this.extensionContext.globalState.update("book_page_number", page);
    }

    readFile() {
        const data = this.extensionContext.globalState.get('novelExt.text');
        // console.log(data);

        return data;
    }

    getPreviousPage() {

        const text = this.readFile();

        this.getSize(text);
        this.getPage("previous");
        this.updatePage();
        return text[this.curr_page_number];
    }

    getNextPage() {

        const text = this.readFile();

        this.getSize(text);
        this.getPage("next");
        this.updatePage();

        return text[this.curr_page_number];
    }

    getJumpingPage() {

        const text = this.readFile();

        this.getSize(text);
        this.getPage("curr");
        this.updatePage();

        return text[this.curr_page_number];
    }
}
module.exports = Book;