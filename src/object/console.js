const _console = window.console;
const console = {

    /**
     * 打印日志信息Info
     * @param {*} info 日志副内容(标题)
     * @param {*} content 日志内容
     */
    async info(info = '', content = '', type = 'info', source = '', author = '') {
        (async(info, content, type, source, author) => {
            try {
                const id = Betools.tools.queryUniqueID();
                Betools.manage.postTableData(`bs_async_log`, { id, content, info, type, source, author }).then(() => {});
                _console.info(content);
            } catch (error) {
                _console.log(`server async console error:`, error);
            }
        })(info, content, type, source, author);
    },

    /**
     * 打印日志信息Log
     * @param {*} info 日志副内容(标题)
     * @param {*} content 日志内容
     */
    async log(info = '', content = '', type = 'log', source = '', author = '') {
        (async(info, content, type, source, author) => {
            try {
                const id = Betools.tools.queryUniqueID();
                Betools.manage.postTableData(`bs_async_log`, { id, content, info, type, source, author }).then(() => {});
                _console.log(content);
            } catch (error) {
                _console.log(`server async console error:`, error);
            }
        })(info, content, type, source, author);
    },

    /**
     * 打印日志信息Error
     * @param {*} info 日志副内容(标题)
     * @param {*} content 
     */
    async error(info = '', content = '', type = 'error', source = '', author = '') {
        (async(info, content, type, source, author) => {
            try {
                const id = Betools.tools.queryUniqueID();
                Betools.manage.postTableData(`bs_async_log`, { id, content, info, type, source, author }).then(() => {});
                _console.error(content);
            } catch (error) {
                _console.log(`server async console error:`, error);
            }
        })(info, content, type, source, author);
    },

    /**
     * 打印日志信息Warn
     * @param {*} info 日志副内容(标题)
     * @param {*} content 
     */
    async warn(info = '', content = '', type = 'warn', source = '', author = '') {
        (async(info, content, type, source, author) => {
            try {
                const id = Betools.tools.queryUniqueID();
                Betools.manage.postTableData(`bs_async_log`, { id, content, info, type, source, author }).then(() => {});
                _console.warn(content);
            } catch (error) {
                _console.log(`server async console error:`, error);
            }
        })(info, content, type, source, author);
    },

}

var consoleExports = {
    console,
}

module.exports = consoleExports