var constant = require('./constant')

try {
    if (localforage) {
        localforage.config({
            driver: localforage.WEBSQL,
            name: 'cache',
            version: 1.0,
            size: 4294967296,
            storeName: 'keyvaluepairs',
            description: ''
        });
    } else {
        localforage = { setItem: () => {}, getItem: () => {}, removeItem: () => {}, clear: () => {} };
    }
} catch (error) {
    console.log(error);
}

const storage = {

    /**
     * @description Set storage
     * @param name
     * @param content
     * @param maxAge
     */
    setStore(name, content, maxAge = null) {
        if (!global.window || !name) {
            return;
        }
        if (typeof content !== 'string') {
            content = JSON.stringify(content);
        }
        var storage = global.window.localStorage;
        try {
            storage.setItem(name, content);
            localforage.setItem(name, content);
        } catch (error) {
            console.log(error);
        }
        try {
            var timeout = parseInt(new Date().getTime() / 1000);
            if (maxAge && !isNaN(parseInt(maxAge))) {
                storage.setItem(`${name}_expire`, timeout + maxAge);
                localforage.setItem(`${name}_expire`, timeout + maxAge);
            }
        } catch (error) {
            console.log(error);
        }
    },

    /**
     * @description Get storage
     * @param name
     * @returns {*}
     */
    getStore(name) {
        if (!global.window || !name) {
            return;
        }
        let content = window.localStorage.getItem(name);
        let _expire = window.localStorage.getItem(`${name}_expire`);
        if (_expire) {
            let now = parseInt(new Date().getTime() / 1000);
            if (now > _expire) {
                return;
            }
        }
        try {
            if (typeof content === 'string' && /^[\{|\[](.*)[\}\]]$/.test(content)) {
                content = JSON.parse(content);
            }
        } catch (error) {
            console.log(error);
        }
        return content;
    },

    /**
     * @description clearStore storage
     * @param name
     */
    clearStore(name) {
        if (!global.window || !name) {
            return;
        }
        window.localStorage.removeItem(name);
        window.localStorage.removeItem(`${name}_expire`);
        localforage.removeItem(name);
        localforage.removeItem(`${name}_expire`);
    },

    /**
     * @description Clear all storage
     */
    clearAll(name) {
        if (!global.window || !name) {
            return;
        }
        if (name == 'all') {
            localforage.clear();
            window.localStorage.clear();
        } else if (name == 'storage') {
            window.localStorage.clear();
        } else if (name == 'db') {
            localforage.clear();
        } else {
            window.localStorage.clear();
        }
    },

    /**
     * @description Set storage
     * @param name
     * @param content
     * @param maxAge
     */
    async setStoreAll(name, content, maxAge = null) {

        if (typeof content !== 'string') {
            content = JSON.stringify(content);
        }

        try {
            localforage.setItem(name, content);
        } catch (error) {
            console.log(error);
        }

        try {
            localStorage.setItem(name, content);
        } catch (error) {
            console.log(error);
        }

        if (maxAge && !isNaN(parseInt(maxAge))) {

            let timeout = parseInt(new Date().getTime() / 1000);

            try {
                localforage.setItem(`${name}_expire`, timeout + maxAge);
            } catch (error) {
                console.log(error);
            }

            try {
                localStorage.setItem(`${name}_expire`, timeout + maxAge);
            } catch (error) {
                console.log(error);
            }
        }
    },

    /**
     * @description Get storage
     * @param name
     * @returns {*}
     */
    async getStoreAll(name) {

        let content = await localforage.getItem(name);
        let _expire = await localforage.getItem(`${name}_expire`);

        if (content == null || typeof content == 'undefined') {
            content = localStorage.getItem(name);
        }
        if (_expire == null || typeof _expire == 'undefined') {
            _expire = localStorage.getItem(`${name}_expire`);
        }
        if (_expire) {
            let now = parseInt(new Date().getTime() / 1000);
            if (now > _expire) {
                return;
            }
        }
        try {
            if (typeof content === 'string' && /^[\{|\[](.*)[\}\]]$/.test(content)) {
                content = JSON.parse(content);
            }
        } catch (error) {
            console.log(error);
        }
        return content;
    },

    /**
     * @description Set storage
     * @param name
     * @param content
     * @param maxAge
     */
    async setStoreDB(name, content, maxAge = null) {

        if (typeof content !== 'string') {
            content = JSON.stringify(content);
        }

        try {
            localforage.setItem(name, content);
        } catch (error) {
            console.log(error);
        }

        if (maxAge && !isNaN(parseInt(maxAge))) {

            let timeout = parseInt(new Date().getTime() / 1000);

            try {
                localforage.setItem(`${name}_expire`, timeout + maxAge);
            } catch (error) {
                console.log(error);
            }

        }
    },

    /**
     * @description Get storage
     * @param name
     * @returns {*}
     */
    async getStoreDB(name) {

        let content = await localforage.getItem(name);
        let _expire = await localforage.getItem(`${name}_expire`);

        if (_expire) {
            let now = parseInt(new Date().getTime() / 1000);
            if (now > _expire) {
                return;
            }
        }

        try {
            if (typeof content === 'string' && /^[\{|\[](.*)[\}\]]$/.test(content)) {
                content = JSON.parse(content);
            }
        } catch (error) {
            console.log(error);
        }

        return content;

    },

    /**
     * @description Clear storage
     * @param name
     */
    clearDB(name) {
        if (name == 'all') {
            localforage.clear();
        } else {
            localforage.removeItem(name);
            localforage.removeItem(`${name}_expire`);
        }
    },

    getToken() {
        return getStore(constant.TOKEN_KEY)
    },

    setToken(token) {
        return setStore(constant.TOKEN_KEY, token, 86400 * 30)
    },

    removeToken() {
        return clearStore(constant.TOKEN_KEY)
    },

    async clearLoginInfo() {
        try {
            clearStore('system_linfo');
            clearStore('system_userinfo');
            clearStore('system_token');
            clearStore('system_department');
            clearStore('system_login_time');
            clearDB('system_linfo');
            clearDB('system_userinfo');
            clearDB('system_token');
            clearDB('system_department');
            clearDB('system_login_time');
        } catch (error) {
            console.log(error);
        }
    },

}

var storageExports = {
    storage,
}

module.exports = storageExports