const console = {

    /**
     * 打印日志信息Info
     * @param {*} content 日志内容
     * @param {*} info 日志副内容
     */
    async info(content = '', info = '', type = 'info', source = '', author = '') {
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
     * @param {*} content 日志内容
     * @param {*} info 日志副内容
     */
    async log(content = '', info = '', type = 'log', source = '', author = '') {
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
     * @param {*} content 
     */
    async error(content = '', info = '', type = 'error', source = '', author = '') {
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
     * @param {*} content 
     */
    async warn(content = '', info = '', type = 'warn', source = '', author = '') {
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