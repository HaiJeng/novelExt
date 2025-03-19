import * as vscode from 'vscode';
class Book {
    extensionContext: vscode.ExtensionContext;
    curr_page_number: number;
    page: number;
    constructor(extensionContext: vscode.ExtensionContext) {
        this.extensionContext = extensionContext;
        this.curr_page_number = 0;
        this.page = 0;
    }
    getSize(text: string[]) {
        console.log("text", text);
        this.page = text.length - 1;
    }
    getPage(type: string) {

        let curr_page = this.extensionContext.workspaceState.get<number>('novelexttype.currPageNumber');
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
    }

    updatePage() {

        this.extensionContext.workspaceState.update('novelexttype.currPageNumber', this.curr_page_number);
        console.log("this.curr_page_number", this.curr_page_number);

        // this.extensionContext.globalState.update("book_page_number", page);
    }

    readFile(): string[] {
        const data = this.extensionContext.globalState.get<string[]>('novelexttype.text') ?? [];
        // console.log(data);

        return data;
    }

    getPreviousPage(): string {

        const text = this.readFile();

        this.getSize(text);
        this.getPage("previous");
        this.updatePage();
        return text[this.curr_page_number];
    }

    getNextPage(): string {

        const text = this.readFile();

        this.getSize(text);
        this.getPage("next");
        this.updatePage();

        return text[this.curr_page_number];
    }

    getJumpingPage(): string {

        const text = this.readFile();

        this.getSize(text);
        this.getPage("curr");
        this.updatePage();

        return text[this.curr_page_number];
    }
}
export default Book;