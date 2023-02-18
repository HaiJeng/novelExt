class QueryClass {
    // client: string;
    // gz: number;
    // d: object;
    // is_encrypted: number;
    // platform: string;
    // sign: string;
    constructor() {
        this.d = {};
        this.client = 'web';
        this.gz = 0;
        this.is_encrypted = 0;
        this.platform = 'pc';
        this.sign = '';
    }
};
module.exports = QueryClass;