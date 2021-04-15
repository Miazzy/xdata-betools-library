const console = {

    /**
     * 打印日志信息Info
     * @param {*} info 日志副内容(标题)
     * @param {*} content 日志内容
     */
    async info(info = '', content = '', type = 'info', source = '', author = '') {
        try {
            const id = Betools.tools.queryUniqueID();
            Betools.manage.postTableData(`bs_async_log`, { id, content, info, type, source, author }).then(() => {});
            console.info(content);
        } catch (error) {
            console.log(`server async console error:`, error);
        }
    },

    /**
     * 打印日志信息Log
     * @param {*} info 日志副内容(标题)
     * @param {*} content 日志内容
     */
    async log(info = '', content = '', type = 'log', source = '', author = '') {
        try {
            const id = Betools.tools.queryUniqueID();
            Betools.manage.postTableData(`bs_async_log`, { id, content, info, type, source, author }).then(() => {});
            console.log(content);
        } catch (error) {
            console.log(`server async console error:`, error);
        }
    },

    /**
     * 打印日志信息Error
     * @param {*} info 日志副内容(标题)
     * @param {*} content 
     */
    async error(info = '', content = '', type = 'error', source = '', author = '') {
        try {
            const id = Betools.tools.queryUniqueID();
            Betools.manage.postTableData(`bs_async_log`, { id, content, info, type, source, author }).then(() => {});
            console.error(content);
        } catch (error) {
            console.log(`server async console error:`, error);
        }
    },

    /**
     * 打印日志信息Warn
     * @param {*} info 日志副内容(标题)
     * @param {*} content 
     */
    async warn(info = '', content = '', type = 'warn', source = '', author = '') {
        try {
            const id = Betools.tools.queryUniqueID();
            Betools.manage.postTableData(`bs_async_log`, { id, content, info, type, source, author }).then(() => {});
            console.warn(content);
        } catch (error) {
            console.log(`server async console error:`, error);
        }
    },

}

var consoleExports = {
    console,
}

module.exports = consoleExports