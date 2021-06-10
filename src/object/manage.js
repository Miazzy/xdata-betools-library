var { storage } = require('./storage');
var { query } = require('./query');
var { tools } = require('./tools');
var { workflow } = require('./workflow');

const manage = {

    /**
     * @description 查询当前自由流程业务
     * @param {*} id
     * @param {*} tools
     */
    async queryCurFreeWorkflow(id) {

        //提交URL
        var queryURL = `${window.BECONFIG['xmysqlAPI']}/api/bs_free_process?_where=(main_key,eq,${id})&_sort=-create_time`;

        //根据业务编号，查询业务数据
        var wflow = [];

        try {
            var res = await superagent.get(queryURL).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');
            console.log(res);

            //如果只有一条数据，则返回[]；如果有多条数据，则返回多个数据
            if (
                typeof res.body == 'undefined' ||
                res.body == null ||
                res.body == '' ||
                res.body.length == 0
            ) {
                wflow = null;
            } else if (res.body.length >= 1) {
                wflow = res.body[0];
            }
        } catch (err) {
            console.log(err);
        }

        return wflow;
    },

    /**
     * @description 查询用户名称信息
     */
    async queryUserName() {

        //查询URL
        var index = 0;
        var queryURL;
        var result = [];

        try {
            //从缓存中获取用户数据
            var userlist = storage.getStore('cache_all_user_name');

            if (
                typeof userlist == 'undefined' ||
                userlist == null ||
                userlist.length == 0
            ) {
                while (index < 10000) {
                    queryURL = `${window.BECONFIG['xmysqlAPI']}/api/v_uname?_p=${index++}&_size=1000`;
                    var res = await superagent.get(queryURL).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');
                    result = result.concat(res.body);
                    //如果返回结果数据小于size，则表示查询到末页，不在查询
                    if (res.body.length < 50) {
                        break;
                    } else {
                        continue;
                    }
                }

                //将用户数据设置到缓存中
                storage.setStore('cache_all_user_name', result, 3600 * 2);
            } else {
                result = userlist;
            }

            return result;
        } catch (err) {
            console.log(err);
        }
    },

    /**
     * @description 将英文名转化为中文名
     */
    async patchEnameCname(origin) {

        //中文名称
        var chinese = '';

        //原始英文名称列表
        var originlist = tools.deNull(origin).split(',');

        //查询用户信息
        var userlist = await queryUserName();

        //遍历用户获取中文名称列表
        for (var ename of originlist) {
            //获取流程发起人的中文信息
            var user = userlist.find(item => {
                return ename == item.username;
            });

            //如果找到用户信息，则设置用户信息
            if (!tools.isNull(user)) {
                chinese = `${chinese},${user.realname}`;
            } else {
                chinese = `${chinese},${ename}`;
            }
        }

        //去掉字符串开头的逗号
        if (chinese.startsWith(',')) {
            chinese = chinese.substring(1);
        }

        //去掉字符串结尾的逗号
        if (chinese.endsWith(',')) {
            chinese = chinese.substring(0, chinese.length - 1);
        }

        //返回中文名称列表
        return chinese;
    },

    /**
     * @description 处理用户信息
     */
    async handleUserInfo(userInfo) {
        //如果没有获取到用户信息，提示用户登录信息过期，请重新登录
        if (typeof userInfo == "undefined" && userInfo == null) {
            //确认用户信息
            // that.$confirm_({
            //     title: "提示信息",
            //     content: "用户登录信息过期，请重新登录！",
            //     onOk: async() => {
            //         //清空缓存信息
            //         storage.clearAll();
            //         //跳转到登录页面
            //         that.$router.push(`/user/login`);
            //     }
            // });
            return false;
        } else {
            return true;
        }
    },

    /**
     * @description 根据数据字典中的节点编号，查询到这个节点对应的流程岗位名称
     */
    async queryProcessLogByID(tableName, id) {

        //大写转小写
        tableName = tableName.toLowerCase();

        //提交URL
        var queryURL = `${window.BECONFIG['xmysqlAPI']}/api/pr_log?_where=(table_name,eq,${tableName})~and(id,eq,${id})`;

        try {
            var res = await superagent.get(queryURL).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');
            console.log(res);
            return res.body[0];
        } catch (err) {
            console.log(err);
        }
    },

    /**
     * @description callback连续执行函数
     */
    setTimeouts(callback, ...times) {
        for (let time of times) {
            setTimeout(() => {
                callback();
            }, time);
        }
    },

    /**
     * 根据数据字典中的节点编号，查询到这个节点对应的员工信息
     */
    async queryProcessNodeEmployee(node, callback) {
        //查询URL
        var queryURL = `${window.BECONFIG['xmysqlAPI']}/api/bs_approve_node?_where=(name,eq,${node})`;

        try {
            var res = await superagent.get(queryURL).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');
            console.log(res.body);

            if (
                typeof res != 'undefined' &&
                res.body instanceof Array &&
                res.body.length > 0 &&
                typeof callback != 'undefined'
            ) {
                callback(res.body[0]['item_text']);
            }

            return res.body;
        } catch (err) {
            console.log(err);
        }
    },

    /**
     * 根据数据字典中的节点编号，查询到这个节点对应的流程岗位名称
     */
    async queryProcessNodeProcName(node, callback) {
        //查询URL
        var queryURL = `${window.BECONFIG['xmysqlAPI']}/api/sys_dict_item?_where=(dict_id,eq,${window.requestAPIConfig.PROCESS_NODE_DICT_ID})~and(item_value,eq,${node})`;

        try {
            var res = await superagent.get(queryURL).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');
            console.log(res);

            if (
                typeof res != 'undefined' &&
                res.body instanceof Array &&
                res.body.length > 0 &&
                typeof callback != 'undefined'
            ) {
                callback(res.body[0]['item_text']);
            }

            return res.body;
        } catch (err) {
            console.log(err);
        }
    },

    /**
     * 获取n位随机数,随机来源chars
     */
    queryRandomStr(length = 32) {

        var res = '';

        try {
            //使用新算法，获取唯一字符串
            res = tools.queryUniqueID(length);
        } catch (error) {
            console.log('获取n位随机数异常：' + error);
        }

        //返回随机数
        return res;
    },

    /**
     * 根据数据字典中的节点编号，查询到这个节点对应的流程岗位名称
     */
    async postProcessLog(node) {
        //提交URL
        var postURL = `${window.BECONFIG['xmysqlAPI']}/api/pr_log`;
        var res = null;

        try {
            node.xid = tools.queryUniqueID();
            res = await superagent.post(postURL).send(node).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');
        } catch (err) {
            delete node.xid;
            res = await superagent.post(postURL).send(node).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');
            console.log(err);
        } finally {
            manage.recordDatabaseLog('process', 'pr_log', '', node).then(() => { console.log(`record database log [type#query] complete ... `); });
        }

        return res.body;
    },

    /**
     * 根据数据字典中的节点编号，查询到这个节点对应的流程岗位名称
     */
    async postProcessLogHistory(node) {
        var postURL = null; //提交URL
        var bflag = node instanceof Array && node.length > 1 ? '/bulk' : ''; //是否批处理
        var res = null;

        //如果只有一条数据,则URL中不���要/bulk路径
        try {
            if (node instanceof Array && node.length == 1) {
                bflag = '';
                node = node[0];
            }
        } catch (error) {
            console.log(error);
        }

        //构建流程历史表提交数据的URL
        try {
            postURL = `${window.BECONFIG['xmysqlAPI']}/api/pr_log_history${bflag}`;
        } catch (error) {
            console.log(error);
        }

        //发送post请求，保存数据
        try {
            node.xid = tools.queryUniqueID();
            res = await superagent.post(postURL).send(node).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');
        } catch (err) {
            delete node.xid;
            res = await superagent.post(postURL).send(node).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');
            console.log(err);
        } finally {
            manage.recordDatabaseLog('process', 'pr_log_history', '', node).then(() => { console.log(`record database log [type#query] complete ... `); });
        }

        return res.body;
    },

    /**
     * 知会记录提交数据
     */
    async postProcessLogInformed(node) {
        var postURL = null; //提交URL
        var res = null;
        var bflag = node instanceof Array && node.length > 1 ? '/bulk' : ''; //是否批处理

        //如果只有一条数据,则URL中不需要/bulk路径
        try {
            if (node instanceof Array && node.length == 1) {
                bflag = '';
                node = node[0];
            }
        } catch (error) {
            console.log(error);
        }

        //构建知会表提交数据的URL
        try {
            postURL = `${window.BECONFIG['xmysqlAPI']}/api/pr_log_informed${bflag}`;
        } catch (error) {
            console.log(error);
        }

        //发送post请求，保存数据
        try {
            node.xid = tools.queryUniqueID();
            res = await superagent.post(postURL).send(node).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');
        } catch (err) {
            delete node.xid;
            res = await superagent.post(postURL).send(node).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');
            console.log(err);
        } finally {
            manage.recordDatabaseLog('process', 'pr_log_informed', '', node).then(() => { console.log(`record database log [type#query] complete ... `); });
        }

        return res.body;
    },

    /**
     * 根据数据字典中的节点编号，查询到这个节点对应的流程岗位名称
     */
    async deleteProcessLog(tableName, node) {
        //大写转小写
        tableName = tableName.toLowerCase();
        //提交URL
        var deleteURL = '';
        //遍历node,取出里面的ids
        var ids = '';

        //如果node不是数组，则转化为数组
        if (!(node instanceof Array)) {
            node = [node];
        }

        try {
            node.map((item) => {
                ids = ids + ',' + item['id'];
            });

            //去掉开头的逗号
            ids = ids.indexOf(',') == 0 ? ids.substring(1) : ids;
        } catch (error) {
            console.log(error);
        }

        try {
            deleteURL = `${window.BECONFIG['xmysqlAPI']}/api/pr_log/bulk?_ids=${ids}`;
        } catch (error) {
            console.log(error);
        }

        try {
            var res = await superagent.delete(deleteURL).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');
            console.log(res);

            return res.body;
        } catch (err) {
            console.log(err);
        }
    },

    /**
     * 根据数据字典中的节点编号，删除到这个节点对应的流程信息
     */
    async deleteProcessLogInf(tableName, node) {
        //大写转小写
        tableName = tableName.toLowerCase();
        //遍历node,取出里面的ids
        var ids = '';
        //提交URL
        var deleteURL = '';

        //如果node不是数组，则转化为数组
        if (!(node instanceof Array)) {
            node = [node];
        }

        try {
            node.map((item) => {
                ids = ids + ',' + item['id'];
            });

            //去掉开头的逗号
            ids = ids.indexOf(',') == 0 ? ids.substring(1) : ids;
        } catch (error) {
            console.log(error);
        }

        try {
            deleteURL = `${window.BECONFIG['xmysqlAPI']}/api/pr_log_informed/bulk?_ids=${ids}`;
        } catch (error) {
            console.log(error);
        }

        try {
            var res = await superagent.delete(deleteURL).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');
            console.log(res);

            return res.body;
        } catch (err) {
            console.log(err);
        }
    },

    /**
     * 查询数据(先查缓存，未命中则查询数据库)
     * @param {*} tableName
     * @param {*} whereSQL
     */
    async queryTableData(tableName, whereSQL) {

        let cacheKey = 'sys_cache_' + tableName + '_#whereSQL#_' + whereSQL;
        let time = await storage.getStoreDB(`${cacheKey}_expire`) || 0;
        let data = await storage.getStoreDB(`${cacheKey}`);
        let curtime = new Date().getTime() / 1000;

        //如果缓存中没有获取到数据，则直接查询服务器
        if (Betools.tools.isNull(data) || (data && data.length == 0)) {
            time = curtime + 3600 * 24 * 365 * 3;
            data = await manage.queryTableDataDB(tableName, whereSQL);
            console.info(`query table data not hit cache and storage cache : ${curtime} data:`, data);
        } else {
            console.info(`query table data hit cache : ${curtime} data: `, data);
        }

        //如果缓存时间快到期，则重新查询数据
        if ((time - 3600 * 24 * 365 * 3 + 0.01) < curtime) {
            (async(tableName, whereSQL) => {
                setTimeout(async() => { manage.queryTableDataDB(tableName, whereSQL); }, 3000);
            })(tableName, whereSQL);
            console.info(`query table data refresh cache : ${curtime} data:`, data);
        }

        return data;
    },

    /**
     * 查询数据
     * @param {*} tableName
     * @param {*} whereSQL
     */
    async queryTableDataDB(tableName, whereSQL) {

        let cacheKey = 'sys_cache_' + tableName + '_#whereSQL#_' + whereSQL;
        let res = null; //查询完成返回对象
        tableName = tableName.toLowerCase(); //大写转小写
        const queryURL = `${window.BECONFIG['xmysqlAPI']}/api/${tableName}?${whereSQL}`;

        try {
            res = await superagent.get(queryURL).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');
            storage.setStoreDB(cacheKey, res.body, 3600 * 24 * 365 * 3);
        } catch (err) {
            console.log(err);
        } finally {
            (async() => {
                setTimeout(() => {
                    (res && res.body && res.body.length > 0) ? res.body.map(element => { query.cacheTableDataByID(tableName, element.id, element); }): null;
                    manage.recordDatabaseLog('query', tableName, '', whereSQL).then(() => { console.log(`record database log [type#query] complete ... `); });
                }, 3000);
            })();
        }

        return res.body;
    },

    /**
     * 查询数据(先查缓存，未命中则查询数据库)
     * @param {*} tableName
     * @param {*} whereSQL
     */
    async queryTableDataCount(tableName, whereSQL) {

        let cacheKey = 'sys_cache_' + tableName + '_#count#whereSQL#_' + whereSQL;
        let time = await storage.getStoreDB(`${cacheKey}_expire`) || 0;
        let data = await storage.getStoreDB(`${cacheKey}`);
        let curtime = new Date().getTime() / 1000;

        //如果缓存中没有获取到数据，则直接查询服务器
        if (Betools.tools.isNull(data) || (data && data.length == 0)) {
            time = curtime + 3600 * 24 * 365 * 3;
            data = await manage.queryTableDataCountDB(tableName, whereSQL);
            console.info(`query table data storage cache : ${curtime} data:`, data);
        } else {
            console.info(`query table data hit cache : ${curtime} data: `, data);
        }

        //如果缓存时间快到期，则重新查询数据
        if ((time - 3600 * 24 * 365 * 3 + 0.01) < curtime) {
            (async(tableName, whereSQL) => {
                setTimeout(async() => { manage.queryTableDataCountDB(tableName, whereSQL); }, 3000);
            })(tableName, whereSQL);
            console.info(`query table data refresh cache : ${curtime} data:`, data);
        }

        return data;
    },

    /**
     * 查询数据
     * @param {*} tableName
     * @param {*} whereSQL
     */
    async queryTableDataCountDB(tableName, whereSQL) {

        let cacheKey = 'sys_cache_' + tableName + '_#count#whereSQL#_' + whereSQL;
        let res = null; //查询完成返回对象
        tableName = tableName.toLowerCase();
        const queryURL = `${window.BECONFIG['xmysqlAPI']}/api/${tableName}/count?${whereSQL}`;

        try {
            res = await superagent.get(queryURL).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');
            storage.setStoreDB(cacheKey, res.body[0]['no_of_rows'], 3600 * 24 * 365 * 3);
        } catch (err) {
            console.log(err);
        } finally {
            manage.recordDatabaseLog('count', tableName, '', whereSQL).then(() => { console.log(`record database log [type#query] complete ... `); });
        }

        return res.body[0]['no_of_rows'];
    },

    /**
     * 查询数据(先查缓存，未命中则查询数据库)
     * @param {*} tableName
     * @param {*} whereSQL
     */
    async queryTableFieldValue(tableName, field, value, _fields = '') {

        let cacheKey = 'sys_cache_' + tableName + '_#FieldValue#Fields#whereSQL#_' + whereSQL;
        let time = await storage.getStoreDB(`${cacheKey}_expire`) || 0;
        let data = await storage.getStoreDB(`${cacheKey}`);
        let curtime = new Date().getTime() / 1000;

        //如果缓存中没有获取到数据，则直接查询服务器
        if (Betools.tools.isNull(data) || (data && data.length == 0)) {
            time = curtime + 3600 * 24 * 365 * 3;
            data = await manage.queryTableFieldValueDB(tableName, field, value, _fields);
            console.info(`query table data storage cache : ${curtime} data:`, data);
        } else {
            console.info(`query table data hit cache : ${curtime} data: `, data);
        }

        //如果缓存时间快到期，则重新查询数据
        if ((time - 3600 * 24 * 365 * 3 + 0.01) < curtime) {
            (async(tableName, field, value, _fields) => {
                setTimeout(async() => { manage.queryTableFieldValueDB(tableName, field, value, _fields); }, 3000)
            })(tableName, field, value, _fields);
            console.info(`query table data refresh cache : ${curtime} data:`, data);
        }

        return data;
    },

    /**
     * 查询数据库某表是否存在field字段为value值的数据
     * @param {*} tableName
     * @param {*} field
     * @param {*} value
     * @param {*} _fields
     */
    async queryTableFieldValueDB(tableName, field, value, _fields = '') {

        let cacheKey = 'sys_cache_' + tableName + '_#FieldValue#Fields#whereSQL#_' + whereSQL;
        let res = null; //查询完成返回对象
        _fields = _fields ? `&_fields=${_fields}` : ''; //如果存在查询字段，则拼接语句
        tableName = tableName.toLowerCase(); //大写转小写

        //查询URL GET	/apis/tableName/:id/exists	True or false whether a row exists or not  /apis/tableName/findOne
        const queryURL = `${window.BECONFIG['xmysqlAPI']}/api/${tableName}?_where=(${field},eq,${value})${_fields}`;

        try {
            res = await superagent.get(queryURL).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');
            storage.setStoreDB(cacheKey, res.body, 3600 * 24 * 365 * 3);
        } catch (err) {
            console.log(err);
        } finally {
            manage.recordDatabaseLog('query', tableName, field, value).then(() => { console.log(`record database log [type#query] complete ... `); });
        }

        return res.body;
    },

    /**
     * 查询数据(先查缓存，未命中则查询数据库)
     * @param {*} tableName
     * @param {*} whereSQL
     */
    async queryTableFieldValueCount(tableName, field, value, _fields = '') {

        let cacheKey = 'sys_cache_' + tableName + '_#count#FieldValue#Fields#whereSQL#_' + whereSQL;
        let time = await storage.getStoreDB(`${cacheKey}_expire`) || 0;
        let data = await storage.getStoreDB(`${cacheKey}`);
        let curtime = new Date().getTime() / 1000;

        //如果缓存中没有获取到数据，则直接查询服务器
        if (Betools.tools.isNull(data) || (data && data.length == 0)) {
            time = curtime + 3600 * 24 * 365 * 3;
            data = await manage.queryTableFieldValueCountDB(tableName, field, value, _fields);
            console.info(`query table data storage cache : ${curtime} data:`, data);
        } else {
            console.info(`query table data hit cache : ${curtime} data: `, data);
        }

        //如果缓存时间快到期，则重新查询数据
        if ((time - 3600 * 24 * 365 * 3 + 0.01) < curtime) {
            (async(tableName, field, value, _fields) => {
                setTimeout(async() => { manage.queryTableFieldValueCountDB(tableName, field, value, _fields); }, 3000);
            })(tableName, field, value, _fields);
            console.info(`query table data refresh cache : ${curtime} data:`, data);
        }

        return data;
    },

    /**
     * 查询数据库某表是否存在field字段为value值的数据Count
     * @param {*} tableName
     * @param {*} field
     * @param {*} value
     * @param {*} _fields
     */
    async queryTableFieldValueCountDB(tableName, field, value, _fields = '') {

        let cacheKey = 'sys_cache_' + tableName + '_#count#FieldValue#Fields#whereSQL#_' + whereSQL;
        let res = null; //查询完成返回对象
        _fields = _fields ? `&_fields=${_fields}` : ''; //如果存在查询字段，则拼接语句
        tableName = tableName.toLowerCase(); //大写转小写

        //查询URL GET	/apis/tableName/:id/exists	True or false whether a row exists or not  /apis/tableName/findOne
        const queryURL = `${window.BECONFIG['xmysqlAPI']}/api/${tableName}/count?_where=(${field},eq,${value})${_fields}`;

        try {
            res = await superagent.get(queryURL).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');
            storage.setStoreDB(cacheKey, res.body, 3600 * 24 * 365 * 3);
        } catch (err) {
            console.log(err);
        } finally {
            manage.recordDatabaseLog('count', tableName, field, value).then(() => { console.log(`record database log [type#query] complete ... `); });
        }

        return res.body;
    },

    /**
     * 查询数据(先查缓存，未命中则查询数据库)
     * @param {*} tableName
     * @param {*} whereSQL
     */
    async queryTableDataByField(tableName, field, value) {

        let cacheKey = 'sys_cache_' + tableName + '_#field#value#_' + whereSQL;
        let time = await storage.getStoreDB(`${cacheKey}_expire`) || 0;
        let data = await storage.getStoreDB(`${cacheKey}`);
        let curtime = new Date().getTime() / 1000;

        //如果缓存中没有获取到数据，则直接查询服务器
        if (Betools.tools.isNull(data) || (data && data.length == 0)) {
            time = curtime + 3600 * 24 * 365 * 3;
            data = await manage.queryTableDataByFieldDB(tableName, field, value);
            console.info(`query table data storage cache : ${curtime} data:`, data);
        } else {
            console.info(`query table data hit cache : ${curtime} data: `, data);
        }

        //如果缓存时间快到期，则重新查询数据
        if ((time - 3600 * 24 * 365 * 3 + 0.01) < curtime) {
            (async(tableName, field, value) => {
                setTimeout(async() => { manage.queryTableDataByFieldDB(tableName, field, value); }, 3000);
            })(tableName, field, value);
            console.info(`query table data refresh cache : ${curtime} data:`, data);
        }

        return data;
    },

    /**
     * 查询数据
     * @param {*} tableName
     * @param {*} foreignKey
     * @param {*} id
     */
    async queryTableDataByFieldDB(tableName, field, value) {

        let cacheKey = 'sys_cache_' + tableName + '_#field#value#_' + whereSQL;
        let res = null; //查询完成返回对象
        tableName = tableName.toLowerCase(); //大写转小写

        //更新URL PATCH	/apis/tableName/:id	Updates row element by primary key
        const queryURL = `${window.BECONFIG['xmysqlAPI']}/api/${tableName}?_where=(${field},eq,${value})`;

        try {
            res = await superagent.get(queryURL).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');
            storage.setStoreDB(cacheKey, res.body, 3600 * 24 * 365 * 3);
        } catch (err) {
            console.log(err);
        } finally {
            manage.recordDatabaseLog('query', tableName, field, value).then(() => { console.log(`record database log [type#query] complete ... `); });
        }

        return res.body;
    },

    /**
     * @description 提交并持久化数据到服务器
     */
    async postTableData(tableName, node) {

        //大写转小写
        tableName = tableName.toLowerCase();
        //Post数据的URL地址
        var insertURL = `${window.BECONFIG['xmysqlAPI']}/api/${tableName}`;
        //设置node为value
        const value = node;
        var res = null;

        //设置时间格式
        Object.keys(value).map(key => {
            value[key] = key.includes('_time') && value[key] ? dayjs(value[key]).format('YYYY-MM-DD HH:mm:ss') : value[key];
        })

        //如果传入数据为数组，则URL添加bulk路径
        if (typeof node != 'undefined' && node != null && node instanceof Array) {
            insertURL = insertURL + '/bulk';
        }

        try {
            node.xid = tools.queryUniqueID();
            node.id = Object.keys(node).includes('id') && tools.isNull(node.id) ? node.xid : node.id;
            res = await superagent.post(insertURL).send(node).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');
        } catch (err) {
            delete node.xid;
            res = await superagent.post(insertURL).send(node).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');
            console.log(err);
        } finally {
            manage.recordDatabaseLog('insert', tableName, '', node).then(() => { console.log(`record database log [type#insert] complete ... `); });
        }

        return res.body;
    },

    /**
     * 更新数据
     * @param {*} tableName
     * @param {*} id
     * @param {*} node
     */
    async patchTableData(tableName, id, node) {

        //大写转小写
        tableName = tableName.toLowerCase();
        //更新URL PATCH	/apis/tableName/:id	Updates row element by primary key
        var patchURL = `${window.BECONFIG['xmysqlAPI']}/api/${tableName}/${id}`;
        var res = null;

        //如果传入数据为空，则直接返回错误
        if (typeof node == 'undefined' || node == null || node == '') {
            return false;
        }

        try {
            node.xid = tools.queryUniqueID();
            res = await superagent.patch(patchURL).send(node).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');
        } catch (err) {
            delete node.xid;
            res = await superagent.patch(patchURL).send(node).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');
            console.log(err);
        } finally {
            manage.recordDatabaseLog('patch', tableName, id, node).then(() => { console.log(`record database log [type#patch] complete ... `); });
        }

        return res.body;
    },

    /**
     * 添加数据
     * @param {*} tableName
     * @param {*} id
     */
    async deleteTableData(tableName, id) {
        let res = '';
        //大写转小写
        tableName = tableName.toLowerCase();
        //Post数据的URL地址
        const deleteURL = `${window.BECONFIG['xmysqlAPI']}/api/${tableName}/${id}`;

        try {
            res = await superagent.delete(deleteURL).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');
        } catch (err) {
            res = await superagent.delete(deleteURL).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');
        } finally {
            manage.recordDatabaseLog('delete', tableName, id, '').then(() => { console.log(`record database log [type#delete] complete ... `); });
        }

        return res.body;
    },

    /**
     * 添加数据
     * @param {*} tableName
     * @param {*} id
     */
    async deleteTableDataByWhere(tableName, fieldName, fieldValue) {
        let res = null;
        //大写转小写
        tableName = tableName.toLowerCase();
        //delete数据的URL地址
        var deleteURL = `${window.BECONFIG['xmysqlAPI']}/api/${tableName}?fieldName=${fieldName}&fieldValue=${fieldValue}`;
        try {
            res = await superagent.delete(deleteURL).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');
        } catch (err) {
            res = await superagent.delete(deleteURL).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');
        } finally {
            manage.recordDatabaseLog('delete', tableName, fieldName, fieldValue).then(() => { console.log(`record database log [type#delete] complete ... `); });
        }
        return res.body;
    },

    /**
     * @description 提交并持久化数据到服务器
     */
    async multiTableData(tableName, node, res = null) {

        //大写转小写
        tableName = tableName.toLowerCase();
        //Post数据的URL地址
        var insertURL = `${window.BECONFIG['xmysqlAPI']}/api/${tableName}/multi`;
        //设置node为value
        const value = node;

        //设置时间格式
        Object.keys(value).map(key => {
            value[key] = key.includes('_time') && value[key] ? dayjs(value[key]).format('YYYY-MM-DD HH:mm:ss') : value[key];
        })

        try {
            node.xid = tools.queryUniqueID();
            res = await superagent.post(insertURL).send(node).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');
        } catch (err) {
            delete node.xid;
            res = await superagent.post(insertURL).send(node).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');
            console.log(err);
        } finally {
            manage.recordDatabaseLog('multi', tableName, '', node).then(() => { console.log(`record database log [type#multi] complete ... `); });
        }

        return res.body;
    },

    /**
     * 记录操作数据库的增删改
     * @param {*} type insert update delete multi
     */
    async recordDatabaseLog(type = 'insert', tname = '', tkey = '', tvalue = '', system = 'ADM', xid = '') {
        let author = await storage.getStore('system_userinfo'); //获取当前登录用户信息
        try {
            tvalue = type != 'delete' ? JSON.stringify(tvalue) : tvalue;
            author = author && (author.username || author.lastname || author.realname || author.name || author.loginid) ? (author.username || author.lastname || author.realname || author.name || author.loginid) : '';
        } catch (e) {
            console.log(`json stringify error:`, e);
        }
        const id = tools.queryUniqueID();
        const node = { id, type, tname, tkey, tvalue, xid, system, author };
        const apiURL = `${window.BECONFIG['xmysqlAPI']}/api/pr_database_log`; //Post数据的URL地址
        (async() => {
            try {
                await superagent.post(apiURL).send(node).set('xid', tools.queryUniqueID()).set('accept', 'json');
            } catch (e) {
                await superagent.post(apiURL).send(node).set('xid', tools.queryUniqueID()).set('accept', 'json');
            }
        })();
    },

    async queryUsernameByID(id) {
        if (!id) {
            return '';
        }
        try {
            //如果用印登记类型为合同类，则查询最大印章编号，然后按序使用更大的印章编号
            var maxinfo = await superagent.get(`${window.BECONFIG['xmysqlAPI']}/api/bs_hrmresource?_where=(loginid,eq,~${id}~)~and(status,ne,5)&_fields=id,lastname,loginid`).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');
            //返回用户信息
            return maxinfo.body[0]['lastname'];
        } catch (error) {
            console.log(error);
            return '';
        }
    },

    async queryUsernameByIDs(ids) {
        try {
            //如果用印登记类型为合同类，则查询最大印章编号，然后按序使用更大的印章编号
            var maxinfo = await superagent.get(`${window.BECONFIG['xmysqlAPI']}/api/bs_hrmresource?_where=(loginid,in,${ids})~and(status,ne,5)`).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');
            //返回用户信息
            return maxinfo.body;
        } catch (error) {
            console.log(error);
            return [];
        }
    },

    /**
     * @description 获取当前名字的用户信息
     */
    async queryUserByNameHRM(name, seclevel = 50) {

        let result = [];

        if (tools.isNull(name)) {
            return [];
        }

        try {

            //如果用印登记类型为合同类，则查询最大印章编号，然后按序使用更大的印章编号
            var temp_ = await superagent.get(`${window.BECONFIG['xmysqlAPI']}/api/bs_hrmresource?_where=((lastname,like,~${name}~)~or(loginid,like,~${name}~))~and(status,ne,5)~and(seclevel,lt,${seclevel})`).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');

            result = [...temp_.body];

            //剔除掉，没有loginid的用户信息
            result = result.filter(item => {
                return !tools.isNull(item.loginid);
            })

            //返回用户信息
            return result;

        } catch (error) {
            console.log(error);
        }

    },

    /**
     * @description 获取当前名字的用户信息
     */
    async queryUserByNameVHRM(name, seclevel = 50) {

        let result = [];

        if (tools.isNull(name)) {
            return [];
        }

        try {

            //如果用印登记类型为合同类，则查询最大印章编号，然后按序使用更大的印章编号
            var temp_ = await superagent.get(`${window.BECONFIG['xmysqlAPI']}/api/v_hrmresource?_where=((name,like,~${name}~)~or(userid,like,~${name}~))~and(seclevel,lt,${seclevel})`).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');

            result = [...temp_.body];

            //剔除掉，没有loginid的用户信息
            result = result.filter(item => {
                return !tools.isNull(item.loginid);
            })

            //返回用户信息
            return result;

        } catch (error) {
            console.log(error);
        }

    },

    /**
     * @description 获取当前名字的用户信息
     */
    async queryUserByNameAndMobile(name, mobile, seclevel = 1000) {

        name = name.trim();
        mobile = mobile.trim();

        let result = [];

        if (tools.isNull(name)) {
            return [];
        }

        try {

            //如果用印登记类型为合同类，则查询最大印章编号，然后按序使用更大的印章编号
            var temp_ = await superagent.get(`${window.BECONFIG['xmysqlAPI']}/api/v_hrmresource?_where=((name,like,~${name}~)~or(userid,like,~${name}~))~and(mobile,like,~${mobile}~)~and(seclevel,lt,${seclevel})`).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');

            result = [...temp_.body];

            //剔除掉，没有loginid的用户信息
            result = result.filter(item => {
                return !tools.isNull(item.loginid);
            })

            //返回用户信息
            return result;

        } catch (error) {
            console.log(error);
        }

    },

    /**
     * @description 获取当前名字的用户信息
     */
    async queryUserByNameReward(name, seclevel = 101) {

        let result = [];

        if (tools.isNull(name)) {
            return [];
        }

        try {

            //如果用印登记类型为合同类，则查询最大印章编号，然后按序使用更大的印章编号
            var temp_ = await superagent.get(`${window.BECONFIG['xmysqlAPI']}/api/bs_hrmresource?_where=((lastname,like,~${name}~)~or(loginid,like,~${name}~))~and(seclevel,lt,${seclevel})`).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');

            result = [...temp_.body];

            //剔除掉，没有loginid的用户信息
            result = result.filter(item => {
                return !tools.isNull(item.loginid);
            })

            //返回用户信息
            return result;

        } catch (error) {
            console.log(error);
        }

    },

    /**
     * @description 获取当前名字的用户信息
     */
    async queryUserByLoginID(name, seclevel = 101) {

        let result = [];

        if (tools.isNull(name)) {
            return [];
        }

        try {

            //如果用印登记类型为合同类，则查询最大印章编号，然后按序使用更大的印章编号
            var temp_ = await superagent.get(`${window.BECONFIG['xmysqlAPI']}/api/bs_hrmresource?_where=((loginid,in,${name}))~and(seclevel,lt,${seclevel})&_fields=loginid`).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');

            result = [...temp_.body];

            //剔除掉，没有loginid的用户信息
            result = result.filter(item => {
                return !tools.isNull(item.loginid);
            })

            //返回用户信息
            return result;

        } catch (error) {
            console.log(error);
        }

    },

    /**
     * @description 获取当前名字的用户信息
     */
    async queryUserByID(name, cname = '融量', seclevel = 101) {

        let result = [];

        if (tools.isNull(name)) {
            return [];
        }

        try {

            //如果用印登记类型为合同类，则查询最大印章编号，然后按序使用更大的印章编号
            var temp_ = await superagent.get(`${window.BECONFIG['xmysqlAPI']}/api/v_hrmresource?_where=((loginid,in,${name}))~and(seclevel,lt,${seclevel})~and(cname,eq,${cname})&_sort=id`).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');

            result = [...temp_.body];

            //剔除掉，没有loginid的用户信息
            result = result.filter(item => {
                return !tools.isNull(item.loginid);
            })

            //返回用户信息
            return result;

        } catch (error) {
            console.log(error);
        }

    },

    /**
     * @description 获取当前输入地址信息对应的所有物品管理员所在办公位置
     */
    async queryAddressByName(name) {

        let result = [];
        if (tools.isNull(name)) {
            return [];
        }
        try {
            var temp_ = await superagent.get(`${window.BECONFIG['xmysqlAPI']}/api/bs_admin_group?_where=(groupname,eq,COMMON_RECEIVE_BORROW)~and(address,like,~${name}~)`).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');
            result = [...temp_.body];
            return result;
        } catch (error) {
            console.log(error);
        }

    },

    /**
     * @description 获取当前名字的用户信息
     */
    async queryUserByNameFindOne(realname, username) {

        if (tools.isNull(realname) || tools.isNull(username)) {
            return [];
        }

        const queryURL = realname.includes('(') || realname.includes('（') || !/^[\u4e00-\u9fa5_a-zA-Z0-9]+$/.test(realname) ? `${window.BECONFIG['xmysqlAPI']}/api/bs_hrmresource?_where=((loginid,like,~${username}~))~and(status,ne,5)` : `${window.BECONFIG['xmysqlAPI']}/api/bs_hrmresource?_where=((lastname,like,~${realname}~)~and(loginid,like,~${username}~))~and(status,ne,5)`;

        try {
            //如果用印登记类型为合同类，则查询最大印章编号，然后按序使用更大的印章编号
            var maxinfo = await superagent.get(queryURL).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');

            //剔除掉，没有loginid的用户信息
            maxinfo.body = maxinfo.body.filter(item => {
                return !tools.isNull(item.loginid);
            });

            //返回用户信息
            if (maxinfo && maxinfo.body && maxinfo.body.length >= 1) {
                return true;
            } else {
                return false;
            }

        } catch (error) {
            console.log(error);
        }

    },

    /**
     * @description 获取当前编号前缀的合同的列表信息
     * @param {*} prefix
     */
    async queryContractInfoByPrefix(prefix) {

        try {
            //构建查询SQL
            const sql = `${window.BECONFIG['xmysqlAPI']}/api/bs_seal_regist?_where=(contract_id,like,${prefix}~)~and(seal_type,eq,合同类)~and(status,in,已用印,已领取,移交前台,已完成,财务归档,档案归档,已归档)&_p=0&_size=8&_sort=-contract_id`;
            //如果用印登记类型为合同类，则查询最大印章编号，然后按序使用更大的印章编号
            var maxinfo = await superagent.get(sql).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');
            //返回用户信息
            if (maxinfo && maxinfo.body && maxinfo.body.length >= 1) {
                return maxinfo.body;
            } else {
                return [];
            }
        } catch (error) {
            console.log(error);
        }

    },

    /**
     * @description 获取当前编号前缀的合同的列表信息
     * @param {*} prefix
     */
    async queryContractInfoByPrefixAll(prefix) {

        try {
            const month = dayjs().subtract(12, 'months').format('YYYY-MM-DD'); //获取最近12个月对应的日期
            const year = dayjs().subtract('1', 'year').format('YYYY');
            const curYear = dayjs().format('YYYY');

            //构建查询SQL 查询一年内，且不为[dayjs().subtract('1', 'year').format('YYYY')]的数据 
            const sql = `${window.BECONFIG['xmysqlAPI']}/api/bs_seal_regist?_where=((contract_id,like,${prefix}[${curYear}]~)~or(contract_id,like,${prefix}~${curYear}~))~and(contract_id,nlike,~[${year}]~)~and(create_time,gt,${month})~and(seal_type,eq,合同类)~and(status,in,待用印,已退回,已废弃,已用印,已领取,移交前台,已完成,财务归档,档案归档,已归档)&_p=0&_size=3&_sort=-contract_id`;
            //如果用印登记类型为合同类，则查询最大印章编号，然后按序使用更大的印章编号
            const maxinfo = await superagent.get(sql).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');

            //返回用户信息
            if (maxinfo && maxinfo.body && maxinfo.body.length >= 1) {
                return maxinfo.body;
            } else {
                return [];
            }
        } catch (error) {
            console.log(error);
        }

    },

    /**
     * @description 获取当前名字的用户信息
     */
    async queryUserBySealData(name) {

        try {
            //如果用印登记类型为合同类，则查询最大印章编号，然后按序使用更大的印章编号
            var maxinfo = await superagent.get(`${window.BECONFIG['xmysqlAPI']}/api/bs_seal_regist?_where=(deal_manager,like,~${name}~)~and(deal_mail,like,~@~)&_size=1&_p=0`).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');
            //返回用户信息
            return maxinfo.body[0];
        } catch (error) {
            console.log(error);
        }

    },

    /**
     * @description 获取当前节点是否有知会或者审批节点信息
     */
    async queryCurNodePageType(pageType) {
        //获取页面类型
        var type = tools.queryUrlString('type');

        try {
            //如果审批详情或者知会详情页面，则设置pageType
            if (type == 'workflow' || type == 'notify') {
                //获取当前节点审批流程数据）
                var flag = await queryProcessLogByID(
                    tools.queryUrlString('table_name'),
                    tools.queryUrlString('processLogID')
                );

                //获取当前节点知会流程数据
                if (tools.deNull(flag) == '') {
                    flag = await queryProcessLogInfByID(
                        tools.queryUrlString('table_name'),
                        tools.queryUrlString('processLogID')
                    );
                }

                //获取页面类型
                pageType = tools.deNull(flag) == '' ? 'view' : pageType;
            } else if (type == 'workflowing') {
                //
                console.log('TODO 暂时不做');
            }
        } catch (error) {
            console.log('获取当前节点是否有知会或者审批节点信息异常:' + error);
        }

        //返回pageType
        return pageType;
    },

    /**
     * 根据数据字典中的节点编号，查询到这个节点对应的流程岗位名称
     */
    async queryProcessLogInfByID(tableName, id) {
        //大写转小写
        tableName = tableName.toLowerCase();
        //提交URL
        var queryURL = `${window.BECONFIG['xmysqlAPI']}/api/pr_log_informed?_where=(table_name,eq,${tableName})~and(id,eq,${id})`;

        try {
            var res = await superagent.get(queryURL).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');
            console.log(res);
            return res.body[0];
        } catch (err) {
            console.log(err);
        }
    },

    /**
     * 根据数据字典中的节点编号，查询到这个节点对应的流程岗位名称
     */
    async queryProcessLog(tableName, businessID) {
        //大写转小写
        tableName = tableName.toLowerCase();
        //提交URL
        var queryURL = `${window.BECONFIG['xmysqlAPI']}/api/pr_log?_where=(table_name,eq,${tableName})~and(business_data_id,eq,${businessID})&_sort=operate_time`;

        try {
            var res = await superagent.get(queryURL).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');
            console.log(res);

            return res.body;
        } catch (err) {
            console.log(err);
        }
    },

    /**
     * 查询流程权责业务信息
     */
    async queryBusinessInfo(tableName, callback) {
        //大写转小写
        tableName = tableName.toLowerCase();
        //查询URL
        var queryURL = `${window.BECONFIG['xmysqlAPI']}/api/pr_rights?_where=(business,like,~${tableName}~)`;

        try {
            var res = await superagent.get(queryURL).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');
            console.log(res.body);

            if (
                typeof res != 'undefined' &&
                res.body instanceof Array &&
                res.body.length > 0 &&
                typeof callback != 'undefined'
            ) {
                callback(res.body);
            }

            return JSON.parse(JSON.stringify(res.body));
        } catch (err) {
            console.log(err);
        }
    },

    /**
     * 检测审批是否存在 存在 false  不存在 true
     * @param {*} tableName
     * @param {*} businessID
     */
    async queryApprovalLength(tableName, businessID) {

        //大写转小写
        tableName = tableName.toLowerCase();
        //查询URL GET	/apis/tableName/:id/exists	True or false whether a row exists or not  /apis/tableName/findOne
        var queryURL = `${window.BECONFIG['xmysqlAPI']}/api/pr_log?_where=(table_name,eq,${tableName})~and(business_data_id,eq,${businessID})`;

        //查询标识
        var vflag = false;

        try {
            var res = await superagent.get(queryURL).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');

            vflag = res.body.length;

            return vflag;
        } catch (err) {
            console.log(err);
        }
    },

    /**
     * @description 将当前自由流程的数据转移到历史数据中
     * @param {*} id
     */
    async transFreeWflowHis(id) {

        //定义返回结果
        var result;

        try {

            //获取本表单业务的所有的自由流程数据
            let wflist = await manage.queryHisFreeWorkflow(id);

            //将历史数据插入到历史自由流程表中
            let wcode = await manage.postTableData("bs_free_process_h", wflist);

            //删除当前自由流程表中历史数据
            result = await manage.deleteTableData("bs_free_process", wflist);

            //打印返回结果
            console.log("result :" + result + " wcode :" + wcode);


        } catch (error) {
            console.log("transfer free workflow node into history " + error);
        }

        return result;

    },

    async queryApprovalExist(tableName, businessID) {

        //大写转小写
        tableName = tableName.toLowerCase();
        //查询URL GET
        var queryURL = `${window.BECONFIG['xmysqlAPI']}/api/pr_log?_where=(table_name,eq,${tableName})~and(business_data_id,eq,${businessID})`;
        //查询标识
        var vflag = false;

        try {
            var res = await superagent.get(queryURL).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');
            vflag = res.body.length > 0 ? true : false;
        } catch (err) {
            console.log(err);
        }

        return vflag;
    },

    /**
     * 根据数据字典中的节点编号，查询到这个节点对应的流程岗位名称
     */
    async postProcessFreeNode(node) {
        //提交URL
        var postURL = `${window.BECONFIG['xmysqlAPI']}/api/bs_free_process`;
        var res = null;
        try {
            node.xid = tools.queryUniqueID();
            res = await superagent.post(postURL).send(node).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');
        } catch (err) {
            delete node.xid;
            res = await superagent.post(postURL).send(node).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');
            console.log(err);
        }
        return res.body;

    },

    /**
     * 首字母大写
     * @param {*} str
     */
    initialUpperCase(str) {
        return str.toLowerCase().replace(/( |^)[a-z]/g, (L) => L.toUpperCase()); // 执行代码
    },

    /**
     * 首字母大写
     * @param {*} str
     */
    prefixUpperCase(str) {
        return String.fromCharCode(str.charCodeAt(0) - 32) + str.slice(1);
    },

    /**
     * 查询用户数据
     * @param {*} searchkey
     * @param {*} data
     */
    async queryUserData(searchkey = '', data = []) {
        try {
            if (searchkey && searchkey.length >= 2) {
                data = await this.queryTableData('bs_hrmresource', `_where=(status,in,0,1,2,3,4)~and(lastname,like,~${searchkey}~)&_sort=id&_p=0&_size=100`); // 获取最近12个月的已用印记录
                data.map((item, index) => {
                    item.code = item.id;
                    item.tel = '';
                    item.name = item.lastname;
                    item.departName = item.textfield1 && item.textfield1.includes('||') ? item.textfield1.split('||')[1] : '';
                    item.title = `${item.lastname} ${item.departName}`;
                    item.isDefault = false;
                });
                data = data.filter((item, index, self) => {
                    const findex = self.findIndex((element) => {
                        return element.loginid == item.loginid;
                    })
                    return findex == index;
                });
                if (searchkey.includes('、') || searchkey.includes('，') || searchkey.includes('；') || searchkey.includes(',') || searchkey.includes(';') || searchkey.includes('/')) {
                    data = data.concat([{ code: '', name: searchkey, lastname: searchkey, title: searchkey }]);
                }
            }
            return data;
        } catch (err) {
            console.log(err);
            return [];
        }
    },

    /**
     * 查询公司数据
     * @param {*} searchkey
     * @param {*} data
     */
    async queryCompanyData(searchkey = '', data = []) {
        try {
            if (searchkey && searchkey.length >= 0) {
                data = await this.queryTableData('bs_company_flow_base', `_where=(status,in,0)~and(level,gt,2)~and(name,like,~${searchkey}~)&_sort=id&_p=0&_size=30`); // 获取最近12个月的已用印记录
                data.map((item, index) => {
                    item.title = item.name.slice(0, 24);
                    item.code = item.id;
                    item.tel = '';
                    item.name = item.name;
                    item.isDefault = false;
                });
            }
            return data;
        } catch (error) {
            console.log(err);
            return [];
        }
    },

    /**
     * 查询公司工商数据
     * @param {*} searchkey
     * @param {*} data
     */
    async queryCompanyICData(searchkey = '', data = []) {
        try {
            if (searchkey && searchkey.length >= 0) {
                data = await this.queryTableData('bs_company_flow_data', `_where=(companyName,like,~${searchkey}~)&_sort=id&_p=0&_size=30`); // 获取最近12个月的已用印记录
                data.map((item, index) => {
                    item.title = item.companyName.slice(0, 24);
                    item.code = item.id;
                    item.tel = '';
                    item.name = item.companyName;
                    item.isDefault = false;
                });
            }
            return data;
        } catch (error) {
            console.log(err);
            return [];
        }
    },

    /**
     * 查询公司及用户数据
     * @param {*} searchkey
     * @param {*} data
     */
    async queryCompanyAndUserData(searchkey = '', data = [], data_ = []) {
        let list = [];

        try {
            if (searchkey && searchkey.length >= 2) {

                data = await Betools.manage.queryUserData(searchkey, data);
                data = data.map(obj => {
                    const { id, code, name, title } = obj;
                    return { id, code, name, title };
                });
                list = list.concat(data);

                data_ = await Betools.manage.queryCompanyData(searchkey, data_);
                data_ = data_.map(obj => {
                    const { id, code, name, title } = obj;
                    return { id, code, name, title };
                });
                list = list.concat(data_);
            }

            return list;
        } catch (error) {
            console.log(err);
            return [];
        }
    },

    /**
     * 查询公司及用户数据
     * @param {*} searchkey
     * @param {*} data
     */
    async queryCommonData(searchkey = '', data = [], type = 'company' /** company|user */ ) {
        let list = [];
        try {
            if (searchkey && searchkey.length >= 2) {
                if (type == 'user') {
                    data = await this.queryUserData(searchkey, data);
                    list.concat(data);
                }
                if (type == 'company') {
                    data = await this.queryCompanyData(searchkey, data);
                    list.concat(data);
                }
                if (type == 'company_ic') {
                    data = await this.queryCompanyICData(searchkey, data);
                    list.concat(data);
                }
                if (type == 'stockholder') {
                    data = await this.queryCompanyAndUserData(searchkey, data);
                    list.concat(data);
                }
            }
            return list;
        } catch (error) {
            console.log(err);
            return [];
        }
    },

    /**
     * 股权管理平台查询用户数据
     * @param {*} data
     * @param {*} value
     * @param {*} key
     * @param {*} fieldKey
     */
    async commonStockSearch(data, value, key, fieldKey, state) {
        const searchkey = value[key];
        data = await this.queryUserData(searchkey, []);
        state.tag['show' + this.prefixUpperCase(fieldKey)] = true;
        state.tag.showKey = key;
        state[fieldKey + 'Columns'] = data;
    },

    /**
     * 股权管理平台查询用户数据
     * @param {*} data
     * @param {*} value
     * @param {*} key
     * @param {*} fieldKey
     */
    async commonUserSearch(data, value, key, fieldKey, state) {
        const searchkey = value[key];
        data = await this.queryUserData(searchkey, []);
        state.tag['show' + this.prefixUpperCase(fieldKey)] = true;
        state.tag.showKey = key;
        state[fieldKey + 'Columns'] = data;
    },

    /**
     * 股权管理平台查询公司数据
     * @param {*} data
     * @param {*} value
     * @param {*} key
     * @param {*} fieldKey
     */
    async commonCompanySearch(data, value, key, fieldKey, state) {
        const searchkey = value[key];
        data = await this.queryCompanyData(searchkey, []);
        state.tag['show' + this.prefixUpperCase(fieldKey)] = true;
        state.tag.showKey = key;
        state[fieldKey + 'Columns'] = data;
    },

    /**
     * 股权管理平台查询公司/用户数据
     * @param {*} data
     * @param {*} value
     * @param {*} key
     * @param {*} fieldKey
     */
    async commonDataSearch(data, value, key, fieldKey, state, type = 'company') {
        const searchkey = value[key];
        if (type == 'company') {
            data = await this.queryCompanyData(searchkey, []);
        } else if (type == 'user') {
            data = await this.queryUserData(searchkey, []);
        } else if (type == 'company_ic') {
            data = await this.queryCompanyICData(searchkey, []);
        } else if (type == 'stockholder') {
            data = await this.queryCompanyAndUserData(searchkey, []);
        }
        state.tag['show' + this.prefixUpperCase(fieldKey)] = true;
        state.tag.showKey = key;
        state[fieldKey + 'Columns'] = data;
    },

    /**
     * 股权管理平台查询公司/用户数据确认
     * @param {*} index
     * @param {*} value
     * @param {*} key
     * @param {*} item
     */
    async commonDataConfirm(index, value, key, item, state, Dialog, type = 'company') {

        state.radio[key] = index;

        if (value && !tools.isNull(value['lastname'])) {
            item[key.replace(/Name/g, '')] = item[key] = value['lastname']
        } else if (value && !tools.isNull(value['name'])) {
            item[key.replace(/Name/g, '')] = item[key] = value['name']
        } else {
            item[key.replace(/Name/g, '')] = item[key] = value;
        }
        state.tag['show' + this.prefixUpperCase(key)] = false;

        //查询公司信息
        if (key == 'companyName' && type == 'company') {
            //检查公司名是否已经存在 //校验公司名称,如果已经存在此公司名称，需要给出提示
            const companyNameCount = await this.queryTableFieldValueCount('bs_company_flow_data', 'companyName', state.item.companyName);
            if (companyNameCount && companyNameCount.length > 0 && companyNameCount[0]['no_of_rows'] > 0) {
                Dialog.confirm({
                    title: '温馨提示',
                    message: '已经存在此公司的基础数据，请勿重复提交！',
                });
                item[key.replace(/Name/g, '')] = item[key] = '';
            }
        }

        //如果confirm了公司名称，需要带出公司的基础信息
        if (key == 'companyName' && type == 'company_ic') {
            const element = state.companyNameColumns.find((item) => { return item.companyName == value });
            const { directorChairman, director, directorExecutive, manager, supervisorChairman, supervisor } = element;
            const { shareholder0, ratioDetail0, shareholder1, ratioDetail1, shareholder2, ratioDetail2, shareholder3, ratioDetail3, shareholder4, ratioDetail4, shareholder5, ratioDetail5, shareholder6, ratioDetail6, shareholder7, ratioDetail7, shareholder8, ratioDetail8, shareholder9, ratioDetail9, shareholder10, ratioDetail10, shareholder11, ratioDetail11, shareholder12, ratioDetail12, shareholder13, ratioDetail13, shareholder14, ratioDetail14, shareholder15, ratioDetail15, shareholder16, ratioDetail16, shareholder17, ratioDetail17, shareholder18, ratioDetail18, shareholder19, ratioDetail19, } = element;
            state.director = { directorChairman, director, directorExecutive, manager, supervisorChairman, supervisor };
            state.stock = { shareholder0, ratioDetail0, shareholder1, ratioDetail1, shareholder2, ratioDetail2, shareholder3, ratioDetail3, shareholder4, ratioDetail4, shareholder5, ratioDetail5, shareholder6, ratioDetail6, shareholder7, ratioDetail7, shareholder8, ratioDetail8, shareholder9, ratioDetail9, shareholder10, ratioDetail10, shareholder11, ratioDetail11, shareholder12, ratioDetail12, shareholder13, ratioDetail13, shareholder14, ratioDetail14, shareholder15, ratioDetail15, shareholder16, ratioDetail16, shareholder17, ratioDetail17, shareholder18, ratioDetail18, shareholder19, ratioDetail19, };
            state.item = element;
            state.item.create_time = dayjs(element.create_time).format('YYYY-MM-DD');
            state.item.paidTime = dayjs(element.paidTime).format('YYYY-MM-DD');
            state.item.paidTureTime = dayjs(element.paidTureTime).format('YYYY-MM-DD');
            state.item.businessTerm = dayjs(element.businessTerm).format('YYYY-MM-DD');
            state.item.establish_time = dayjs(element.establish_time).format('YYYY-MM-DD');
            state.item.examine_date = dayjs(element.examine_date).format('YYYY-MM-DD');
        }

    },

    /**
     * 搜索公司信息
     * @param {*} data 
     * @param {*} key 
     * @param {*} time 
     * @param {*} curtime 
     * @param {*} cacheKey 
     */
    async companySearch(data, key, time, curtime = new Date().getTime() / 1000, cacheKey = 'system_app_home_company_data', state) {
        time = storage.getStore(`${cacheKey}_expire`) || 0;
        data = storage.getStore(`${cacheKey}`);
        //如果缓存中没有获取到数据，则直接查询服务器
        if (tools.isNull(data) || data.length == 0) {
            data = await companySearchData(data, key, cacheKey);
            console.log(`storage cache : ${curtime}`);
        }
        //如果存在state,则设置state属性
        if (state) {
            state.companyColumns = data;
        }
        //如果缓存时间快到期，则重新查询数据
        if ((time - 3600 * 23.95) < curtime) {
            data = await companySearchData(data, key, cacheKey);
            console.log(`refresh cache : ${curtime}`);
        }
        return data;
    },

    /**
     * 查询公司工商数据
     * @param {*} data 
     * @param {*} key 
     * @param {*} cacheKey 
     * @returns 
     */
    async companySearchData(data, key, cacheKey) {
        data = await this.queryTableData('bs_company_flow_data', `_where=(companyName,like,~${key}~)&_sort=-id&_p=0&_size=30`); // 获取最近12个月的已用印记录
        data.map(item => {
            item.establish_time = dayjs(item.establish_time).format('YYYY-MM-DD');
        });
        storage.setStore(`${cacheKey}`, JSON.stringify(data), 3600 * 24 * 31);
        return data;
    },

    /**
     * 查询公司工商数据信息
     * @param {*} tableName 
     * @param {*} id 
     * @param {*} state 
     * @returns 
     */
    async queryCompanyIndustryInfo(tableName = 'bs_company_flow_data', id, state) {
        const list = await Betools.manage.queryTableData(tableName, `_where=(id,eq,${id})`);
        const element = list[0];
        const { directorChairman, director, directorExecutive, manager, supervisorChairman, supervisor } = element;
        const { shareholder0, ratioDetail0, shareholder1, ratioDetail1, shareholder2, ratioDetail2, shareholder3, ratioDetail3, shareholder4, ratioDetail4, shareholder5, ratioDetail5, shareholder6, ratioDetail6, shareholder7, ratioDetail7, shareholder8, ratioDetail8, shareholder9, ratioDetail9, shareholder10, ratioDetail10, shareholder11, ratioDetail11, shareholder12, ratioDetail12, shareholder13, ratioDetail13, shareholder14, ratioDetail14, shareholder15, ratioDetail15, shareholder16, ratioDetail16, shareholder17, ratioDetail17, shareholder18, ratioDetail18, shareholder19, ratioDetail19, } = element;
        state.director = { directorChairman, director, directorExecutive, manager, supervisorChairman, supervisor };
        state.stock = { shareholder0, ratioDetail0, shareholder1, ratioDetail1, shareholder2, ratioDetail2, shareholder3, ratioDetail3, shareholder4, ratioDetail4, shareholder5, ratioDetail5, shareholder6, ratioDetail6, shareholder7, ratioDetail7, shareholder8, ratioDetail8, shareholder9, ratioDetail9, shareholder10, ratioDetail10, shareholder11, ratioDetail11, shareholder12, ratioDetail12, shareholder13, ratioDetail13, shareholder14, ratioDetail14, shareholder15, ratioDetail15, shareholder16, ratioDetail16, shareholder17, ratioDetail17, shareholder18, ratioDetail18, shareholder19, ratioDetail19, };
        state.item = element;
        state.item.create_time = dayjs(element.create_time).format('YYYY-MM-DD');
        state.item.paidTime = dayjs(element.paidTime).format('YYYY-MM-DD');
        state.item.paidTureTime = dayjs(element.paidTureTime).format('YYYY-MM-DD');
        state.item.businessTerm = dayjs(element.businessTerm).format('YYYY-MM-DD');
        state.item.establish_time = dayjs(element.establish_time).format('YYYY-MM-DD');
        state.item.examine_date = dayjs(element.examine_date).format('YYYY-MM-DD');
        return state;
    },

    /**
     * 显示遮罩函数
     * @param {*} action 
     * @param {*} done 
     */
    async showOverlayConfirm(action = 'cancel', done, tag, block) {
        console.log(`action:`, action, ` done:`, done);
        if (action == 'cancel') {
            setTimeout(() => {
                tag.showOverlay = false;
                block.showOverlay = '';
            }, 300);
        } else if (action == 'confirm') {
            tag.showOverlay = true;
            setTimeout(() => {
                block.showOverlay = 'block';
            }, 500);
        }
        if (done) {
            done();
        }
    },

    /**
     * 用印登记申请选中当前前台人员
     * @param {*} value 
     */
    async selectSealApplyFrontUser(value, state) {
        await Betools.tools.sleep(0);
        const id = state.fuserid;
        const user = state.fuserList.find((item, index) => {
            return id == item.id
        });
        //获取盖印人姓名
        state.item.front_name = user.name;
        //当前盖印人编号
        state.item.front = id;
    },

    /**
     * 用印登记申请选中当前财务归档人员
     * @param {*} value 
     */
    async selectSealApplyFinanceUser(value, state) {
        await Betools.tools.sleep(0);
        const id = state.financeUserid;
        const user = state.financeuserList.find((item, index) => {
            return id == item.id
        });
        //获取盖印人姓名
        state.item.finance_name = user.name;
        //当前盖印人编号
        state.item.finance = id;
        //设置归档组
        state.item.archive_name = `${state.item.finance_name},${state.item.record_name}`;
        state.item.archive = `${state.item.finance},${state.item.record}`;
    },

    /**
     * 用印登记申请选中当前档案人员
     * @param {*} value 
     */
    async selectSealApplyRecordUser(value, state) {
        await Betools.tools.sleep(0);
        const id = state.recordUserid;
        const user = state.recorduserList.find((item, index) => {
            return id == item.id
        });
        //获取盖印人姓名
        state.item.record_name = user.name;
        //当前盖印人编号
        state.item.record = id;
        //设置归档组
        state.item.archive_name = `${state.item.finance_name},${state.item.record_name}`;
        state.item.archive = `${state.item.finance},${state.item.record}`;
    },

    /**
     * 用印登记申请选中当前盖印人员
     * @param {*} value 
     */
    async selectSealApplySealUser(value, state) {
        await Betools.tools.sleep(0);
        const id = state.suserid;
        const user = state.suserList.find((item, index) => {
            return id == item.id
        });
        //获取盖印人姓名
        state.item.sealman = user.name;
        //设置盖印人电话
        state.item.seal_mobile = user.mobile;
        state.item.seal = id;
        //当前盖印人编号
        state.sealuserid = id;

        //如果盖印人是总部的，则zonename为集团总部，如果不是总部的，则zonename为空
        state.zoneNameValid();
    },

    /**
     * 用印登记申请选中当前归档人员
     * @param {*} values 
     */
    async selectSealApplyArchiveUser(values, state) {
        await Betools.tools.sleep(0);
        let ids = [];
        let names = [];
        state.$refs.checkboxGroup.$data.checkboxValues.map((value, index) => {
            if (value == 1) {
                ids.push(state.auserList[index].id);
                names.push(state.auserList[index].name);
            }
        })
        state.item.archive_name = names.join(',');
        state.item.archive = ids.join(',');
    },

    /**
     * 查询用印登记申请经办人基本信息
     * @param {*} state 
     */
    async querySealApplyManager(state) {
        //获取经办人信息
        const manager = state.item.dealManager;

        try {
            if (!!manager) {

                //从用户表数据中获取填报人资料
                let user = await Betools.manage.queryUserByNameHRM(manager.trim());
                //从提交的历史数据中获取填报人资料
                let info = await Betools.manage.queryUserBySealData(manager.trim());

                if (!!user) {
                    if (Array.isArray(user)) { //如果是用户数组列表，则展示列表，让用户自己选择

                        try {
                            user.map((elem, index) => {
                                let company = elem.textfield1.split('||')[0];
                                company = company.slice(company.lastIndexOf('>') + 1);
                                let department = elem.textfield1.split('||')[1];
                                department = department.slice(department.lastIndexOf('>') + 1);
                                state.cuserList.push({
                                    id: elem.loginid,
                                    username: elem.loginid,
                                    email: elem.email,
                                    mail: elem.email,
                                    realname: elem.name,
                                    company,
                                    department,
                                    mobile: elem.mobile,
                                    name: elem.lastname,
                                    tel: '',
                                    address: company + "||" + elem.textfield1.split('||')[1],
                                    isDefault: !index
                                });
                            })
                        } catch (error) {
                            console.log(error);
                        }

                    } else {

                        try {
                            state.item.dealManager = user.deal_manager || state.item.dealManager;
                            state.item.mobile = user.mobile;
                            state.item.username = user.loginid;
                            state.item.dealMail = user.email;
                            state.item.signman = manager;
                        } catch (error) {
                            console.log(error);
                        }

                        try {
                            if (!user.email && !!info) {
                                state.item.dealMail = info.deal_mail;
                                state.item.dealDepart = info.deal_depart;
                            }
                        } catch (error) {
                            console.log(error);
                        }

                        try {
                            state.cacheUserInfo(); //缓存特定属性
                        } catch (error) {
                            console.log(error);
                        }

                        try {
                            let company = user.textfield1.split('||')[0];
                            company = company.slice(company.lastIndexOf('>') + 1);
                            let department = user.textfield1.split('||')[1];
                            department = department.slice(department.lastIndexOf('>') + 1);
                            state.item.dealDepart = department;
                            state.cuserList.push({
                                id: user.loginid,
                                username: elem.loginid,
                                email: elem.email,
                                realname: elem.name,
                                company,
                                department,
                                mobile: elem.mobile,
                                name: user.lastname,
                                tel: '',
                                address: company + "||" + user.textfield1.split('||')[1],
                                mail: state.item.dealMail,
                                isDefault: !state.cuserList.length
                            });
                        } catch (error) {
                            console.log(error);
                        }

                    }

                    //遍历去重
                    try {
                        state.cuserList = state.cuserList.filter((item, index) => {
                            item.isDefault = index == 0 ? true : false;
                            let findex = state.cuserList.findIndex((subitem, index) => {
                                return subitem.id == item.id
                            });
                            return index == findex;
                        })
                    } catch (error) {
                        console.log(error);
                    }

                } else if (!user && !!info) {

                    try {
                        //如果是用户数组列表，则展示列表，让用户自己选择
                        if (!Array.isArray(info)) {
                            state.item.mobile = info.mobile;
                            state.item.username = info.username;
                            state.item.signman = manager;
                            state.item.dealMail = info.deal_mail;
                            state.item.dealDepart = info.deal_depart;
                            state.cacheUserInfo(); //缓存特定属性
                        }
                    } catch (error) {
                        console.log(error);
                    }

                }

            }
        } catch (error) {
            console.log(error);
        }

    },

    /**
     * 缓存用印登记申请填报人信息
     */
    async cacheSealApplyUserInfo(item) {
        try {
            //获取特定属性
            const temp = (({
                dealManager,
                mobile,
                username,
                dealMail,
                signman,
                dealDepart
            }) => ({
                dealManager,
                mobile,
                username,
                dealMail,
                signman,
                dealDepart
            }))(item);
            Betools.storage.setStore('system_user_sealinfo', temp, 3600 * 24 * 30); //将用户名存放入缓存中，下次打开页面直接填入
        } catch (error) {
            console.log(error);
        }
    },

    /**
     * 查询用印登记申请消息
     * @param {*} state 
     * @param {*} that 
     */
    async querySealApplyInfo(state, that = state) {

        try {
            state.iswechat = Betools.tools.isWechat();
            state.userinfo = await state.weworkLogin(); //查询当前登录用户
        } catch (error) {
            console.log(error);
        }

        try {
            state.item.sealman = Betools.tools.getUrlParam('sealman');
            state.item.status = state.statusType[Betools.tools.getUrlParam('statustype')];
            state.sealuserid = Betools.tools.getUrlParam('sealuserid');
            state.groupid = Betools.tools.getUrlParam('groupid') || 'Group_LD';

            state.item.seal = Betools.tools.getUrlParam('seal'); //用印管理员成员组
            state.item.front = Betools.tools.getUrlParam('front'); //用印前台接受组
            state.item.archive = Betools.tools.getUrlParam('archive'); //用印归档组(财务/档案)

            // 查询公司名称记录
            const clist = await Betools.manage.queryTableData('bs_company_flow_base', `_where=(status,in,0)~and(level,gt,2)&_sort=id&_p=0&_size=30`); // 获取最近12个月的已用印记录
            clist.map((item, index) => {
                item.title = item.name.slice(0, 24);
                item.code = item.id;
                item.tel = '';
                item.name = item.name;
                item.isDefault = false;
            });
            state.companyColumns = clist;

            //如果盖印人填写为英文，则查询中文名称
            if (/^[a-zA-Z_0-9]+$/.test(state.item.sealman)) {
                //获取盖印人姓名
                state.item.sealman = await Betools.manage.queryUsernameByID(state.item.sealman);
            }

            //如果前台人员填写为英文，则查询中文名称
            if (/^[a-zA-Z_0-9]+$/.test(state.item.front)) {
                //获取盖印人姓名
                state.item.front_name = await Betools.manage.queryUsernameByID(state.item.front);
            }

            //如果盖印人候选列表存在
            if (state.item.seal) {
                //获取可选填报人列表
                let slist = await Betools.manage.queryUsernameByIDs(state.item.seal.split(',').map(item => {
                    return `'${item}'`;
                }).join(','));
                //遍历填报人列表
                slist.map((elem, index) => {
                    let company = elem.textfield1.split('||')[0];
                    company = company.slice(company.lastIndexOf('>') + 1);
                    let department = elem.textfield1.split('||')[1];
                    department = department.slice(department.lastIndexOf('>') + 1);
                    state.sealuserid = elem.loginid;
                    state.suserList.push({
                        id: elem.loginid,
                        name: elem.lastname,
                        tel: '',
                        address: company + "||" + elem.textfield1.split('||')[1],
                        company: company,
                        department: department,
                        mail: elem.email,
                        isDefault: !state.suserList.length
                    });
                })
            }

            //如果前台人候选列表存在
            if (state.item.front) {
                //获取可选填报人列表
                let flist = await Betools.manage.queryUsernameByIDs(state.item.front.split(',').map(item => {
                    return `'${item}'`;
                }).join(','));
                //遍历填报人列表
                flist.map((elem, index) => {
                    let company = elem.textfield1.split('||')[0];
                    company = company.slice(company.lastIndexOf('>') + 1);
                    let department = elem.textfield1.split('||')[1];
                    department = department.slice(department.lastIndexOf('>') + 1);
                    state.fuserList.push({
                        id: elem.loginid,
                        name: elem.lastname,
                        tel: '',
                        address: company + "||" + elem.textfield1.split('||')[1],
                        company: company,
                        department: department,
                        mail: elem.email,
                        isDefault: !state.suserList.length
                    });
                })
            }

            //如果前台人候选列表存在
            if (state.item.archive) {
                let names = [];
                let ids = [];
                //获取可选填报人列表
                let alist = await Betools.manage.queryUsernameByIDs(state.item.archive.split(',').map(item => {
                    return `'${item}'`;
                }).join(','));
                //遍历填报人列表
                alist.map((elem, index) => {
                    let company = elem.textfield1.split('||')[0];
                    company = company.slice(company.lastIndexOf('>') + 1);
                    let department = elem.textfield1.split('||')[1];
                    department = department.slice(department.lastIndexOf('>') + 1);
                    names.push(elem.lastname);
                    ids.push(elem.loginid);
                    state.auserList.push({
                        id: elem.loginid,
                        value: `${elem.lastname},`,
                        label: elem.lastname + ' ' + elem.mobile + " " + elem.textfield1.split('||')[1].replace('中心', ''),
                        name: elem.lastname,
                        tel: '',
                        address: company + "||" + elem.textfield1.split('||')[1],
                        company: company,
                        department: department,
                        mail: elem.email,
                        isDefault: !state.auserList.length
                    });
                })
                state.item.archive = ids.join(',');
                state.item.archive_name = names.join(',');
            }

            //获取缓存的用户数据
            const temp = Betools.storage.getStore('system_user_sealinfo');

            if (!!temp) {
                state.item.dealManager = temp.dealManager;
                state.item.mobile = temp.mobile;
                state.item.username = temp.username;
                state.item.dealMail = temp.dealMail;
                state.item.signman = temp.signman;
                state.item.dealDepart = temp.dealDepart;
            }

            //获取用户信息
            let userinfo = await Betools.storage.getStore('system_userinfo');

            if (!Betools.tools.isNull(userinfo)) {
                state.item.dealManager = userinfo.systemuserinfo.realname;
                state.item.mobile = userinfo.systemuserinfo.mobile;
                state.item.username = userinfo.systemuserinfo.username;
                state.item.signman = userinfo.systemuserinfo.realname;
                state.item.dealDepart = userinfo.systemuserinfo.textfield1.split('||')[1];
                if (state.item.dealDepart.includes('>')) {
                    state.item.dealDepart = state.item.dealDepart.split('>')[1]
                }
            }

            //如果用户邮箱为空，则从以前填写的记录中获取邮箱账号
            if (Betools.tools.isNull(state.item.dealMail) || Betools.tools.isNull(state.item.company)) {
                const tmp = await Betools.query.queryMailBySealData(state.item.signman);
                state.item.dealMail = tmp.deal_mail;
                state.item.dealDepart = tmp.deal_depart;
                state.item.sealman = tmp.seal_man;
                state.item.seal = tmp.seal;
            }

            //如果前台不存在，则添加
            if (Betools.tools.isNull(state.item.front)) {
                const tmp = await Betools.query.queryFrontBySealData(state.item.signman);
                state.item.front = tmp.front;
                state.item.front_name = tmp.front_name;
                state.item.archive = tmp.archive;
                state.item.archive_name = tmp.archive_name;
                state.item.record = tmp.record;
                state.item.record_name = tmp.record_name;
                state.item.finance = tmp.finance;
                state.item.finance_name = tmp.finance_name;
            }

            //是否有最近缓存数据
            const tempitem = Betools.storage.getStore('system_seal_item');

            if (!!tempitem) {
                state.item.filename = tempitem.filename;
                state.item.count = tempitem.count;
                state.item.prefix = tempitem.prefix;
            }

            if (!state.sealuserid) {
                state.sealuserid = state.config[state.item.sealman];
            }

            //加载最近的同类型合同编号
            await state.queryHContract();

        } catch (error) {
            console.log(error);
        }

    },

    //提交用印登记申请
    async handleSealApplyConfirm(state) {

        //显示遮罩
        state.tag.showOverlay = true;

        // TODO 此处可以加分布式锁，防止高并发合同编号相同

        // 可能盖印人没有被选中，此处在选择一次
        if (!state.item.seal || !state.item.sealman) {
            await state.querySealMan();
        }

        if (!state.item.seal || !state.item.sealman) {
            state.tag.showOverlay = false;
            return await vant.Dialog.confirm({ //提示确认用印操作
                title: '用印确认',
                message: '请输入盖印人，并在下拉框中选择盖印人后，进行提交操作！',
            });
        }

        // 获取用户信息
        let userinfo = await Betools.storage.getStore('system_userinfo');

        // 缓存填报人信息
        state.cacheUserInfo();

        // 先验证是否合法
        const keys = (state.item.sealtype == '合同类' && state.isGroupHeader) ?
            Object.keys({
                sealtype: '',
                seal_category: '',
                ordertype: '',
                filename: '',
                count: '',
                dealDepart: '',
                dealManager: '',
                username,
                approveType: '',
                signman: '',
                workno: '',
                company: '',
                seal: '',
                partner: '',
            }) :
            Object.keys({
                sealtype: '',
                seal_category: '',
                ordertype: '',
                filename: '',
                count: '',
                dealDepart: '',
                dealManager: '',
                username,
                approveType: '',
                signman: '',
                workno: '',
                company: '',
                seal: ''
            })

        const invalidKey = keys.find(key => {
            state.validField();
            return !state.validFieldConfirm(key);
        });

        if (!state.item.company || (Array.isArray(state.item.company) && state.item.company.length <= 0)) {
            state.tag.showOverlay = false;
            return await vant.Dialog.alert({
                title: '温馨提示',
                message: '请检查表单填写内容，请选择用印公司！',
            });
        }

        if ((!state.item.partner || Betools.tools.isNull(state.item.partner)) && state.item.sealtype == '合同类') {
            state.tag.showOverlay = false;
            return await vant.Dialog.alert({
                title: '温馨提示',
                message: '请检查表单填写内容，并确认合作方是否填写！',
            });
        }

        if (invalidKey != '' && invalidKey != null) {
            state.tag.showOverlay = false;
            return await vant.Dialog.alert({
                title: '温馨提示',
                message: `请检查表单填写内容，确认内容是否填写完整无误！[Error:${invalidKey}]`,
            });
        }

        // 如果用印登记类型为合同类，则查询最大印章编号，然后按序使用更大的印章编号
        state.noname = '合同编号';

        //根据用户选择的印章实体公司来设置印章编码

        //如果是合同类，则设置合同编号，如果是非合同类，则设置流水编号
        if (state.item.sealtype === '合同类') {
            state.noname = '合同编号';
        } else {
            state.noname = '流水编号';
            state.item.prefix = 'COMMON'; //设置非合同类前缀编号
            await state.queryHContract(); //加载最近的同类型合同编号
        }

        //检查盖章人员 RealName 是否存在 ，以及是否和 seal 匹配，即中文名和英文名是否匹配
        if (!(await Betools.manage.queryUserByNameFindOne(state.item.sealman, state.item.seal))) {
            state.tag.showOverlay = false;
            return await vant.Dialog.alert({
                title: '温馨提示',
                message: '请在盖印人下拉列表，点击选择盖印人后在进行提交，或认真检查盖印人名字是否拼写错误！',
            });
        }

        //如果不是总部员工，则前台移交人员、财务人员、档案人员都设置为印章管理员
        if (!!state.item.seal && (!state.item.front || !state.item.finance || !state.item.record || !state.item.archive)) {
            state.item.front == state.item.seal;
            state.item.finance == state.item.seal;
            state.item.record == state.item.seal;
            state.item.archive == state.item.seal;
            state.item.front_name == state.item.sealman;
            state.item.finance_name == state.item.sealman;
            state.item.record_name == state.item.sealman;
            state.item.archive_name == state.item.sealman;
        }

        //公司工作组
        const groupid = Betools.tools.getUrlParam('groupid') || 'Group_LD';

        //第一步，构造form对象
        const item = state.item;
        const no = 1;
        const id = Betools.tools.queryUniqueID();
        const create_by = item.dealManager;
        const create_time = dayjs().format('YYYY-MM-DD HH:mm:ss');
        const filename = item && item.filename ? item.filename.trim() : item.filename;
        const count = item && item.count ? item.count.trim() : 0;
        const seal_type = item && item.sealtype ? item.sealtype.trim() : '';
        const seal_category = item && item.seal_category ? Array.isArray(item.seal_category) ? item.seal_category.toString() : item.seal_category.trim() : '';
        const order_type = item && item.ordertype ? item.ordertype.trim() : '';
        const deal_depart = item && item.dealDepart ? item.dealDepart.trim() : item.dealDepart;
        const deal_manager = item && item.dealManager ? item.dealManager.trim() : item.dealManager;
        const deal_mail = item && item.dealMail ? item.dealMail.trim() : item.dealMail;
        const username = item && item.username ? item.username.trim() : '';
        const approve_type = item && item.approveType ? item.approveType.trim() : '';
        const seal_time = item && item.sealtime ? item.sealtime.trim() : '';
        const prefix = item && item.prefix ? item.prefix.trim() : '';
        const sign_man = item && item.signman ? item.signman.trim() : '';
        const workno = item && item.workno ? item.workno.trim() : '';
        const mobile = item && item.mobile ? item.mobile.trim() : '';
        const partner = item && item.partner ? item.partner.trim() : '';
        let contract_id = item && item.contractId ? item.contractId.trim() : '';

        //用印注意，此处需要找到用印人的同组用户，写入数据库
        const seal = item.seal;
        const seal_man = item.sealman;
        const front = item.front;
        const front_name = item.front_name;
        const finance = item.finance;
        const finance_name = item.finance_name;
        const record = item.record;
        const record_name = item.record_name;
        const archive = item.archive;
        const archive_name = item.archive_name;
        const send_location = item && item.send_location ? item.send_location.trim() : item.send_location;
        const send_mobile = item && item.send_mobile ? item.send_mobile.trim() : item.send_mobile;
        const company = item && item.company ? item.company.toString() : '';
        const seal_wflow = Betools.tools.getUrlParam('statustype') || 'none';
        const status = state.statusType[Betools.tools.getUrlParam('statustype')] || '待用印';

        //验证合同编号是否含有特殊字符串
        if (contract_id.includes('【') || contract_id.includes('】') || contract_id.includes(' ') || contract_id.includes('，') || contract_id.includes(',')) {
            state.tag.showOverlay = false;
            return await vant.Dialog.alert({
                title: '温馨提示',
                message: '合同编号，请使用英文中括号“[]”且不要使用中文逗号！',
            });
        }

        if (contract_id && contract_id.includes('NaN') && state.item.sealtype == '合同类') {
            state.tag.showOverlay = false;
            //提示确认用印操作
            return await vant.Dialog.confirm({
                title: '用印确认',
                message: '此合同编号有误，请检查是否符合编码规则，注不能出现NaN！',
            });
        }

        contract_id = contract_id.includes('NaN') ? contract_id.replace('NaN', '0000') : contract_id; //如果非合同类出现NaN，则修改为0000
        contract_id = contract_id.includes(']') ? contract_id.replace(contract_id.split(']')[1], '0000') : (contract_id.includes(')') ? contract_id.replace(contract_id.split(')')[1], '0000') : contract_id);

        //查询直接所在工作组
        const resp = await Betools.query.queryRoleGroupList('SEAL_ADMIN', seal);

        //获取到印章管理员组信息
        let seal_group_ids = resp && resp.length > 0 ? resp[0].userlist : '';
        let seal_group_names = resp && resp.length > 0 ? resp[0].enuserlist : '';

        //如果未获取用户名称，则直接设置用印人为分组成员
        if (Betools.tools.isNull(seal_group_ids)) {
            seal_group_ids = seal;
            seal_group_names = seal_man;
        }

        if (!seal_group_ids.includes(seal) && !seal_group_names.includes(seal_man)) {
            state.tag.showOverlay = false;
            //提示确认用印操作
            return await vant.Dialog.confirm({
                title: '用印确认',
                message: '请在下拉列表中，选择印章管理员后在提交！',
            });
        }

        if ((!finance || !finance_name || !record || !record_name) && (state.item.sealtype == '合同类' && state.isGroupHeader)) {
            // state.tag.showOverlay = false;
            // //提示确认用印操作
            // return await vant.Dialog.confirm({
            //     title: '用印登记申请',
            //     message: '请输入并选择财务/档案归档人员！',
            // });
            finance = finance_name = record = record_name = 'yanggc';
        }

        //提示确认用印操作
        await vant.Dialog.confirm({
            title: '用印登记申请',
            message: '确认提交用印登记申请？',
            beforeClose: state.showOverlayConfirm,
        });

        //message消息
        let message = null;
        state.block.showOverlay = 'block';

        try {
            const elem = {
                id,
                no,
                create_by,
                create_time,
                filename,
                count,
                deal_depart,
                deal_manager,
                username,
                deal_mail,
                mobile,
                approve_type,
                seal_type,
                seal_category,
                order_type,
                seal_man,
                contract_id,
                sign_man,
                company,
                workno,
                seal_wflow,
                prefix,
                status,
                send_location,
                send_mobile,
                partner,
                seal,
                front,
                archive,
                front_name,
                archive_name,
                finance,
                finance_name,
                record,
                record_name,
                seal_group_ids,
                seal_group_names
            }; // 待提交元素

            //第二步，向表单提交form对象数据
            state.loading = true;
            const result = await Betools.manage.postTableData('bs_seal_regist', elem);

            //sleep一下
            await Betools.tools.sleep(0);

            //发送自动设置排序号请求
            const patchResp = await superagent.get(Betools.workconfig.queryAPI.autoSerialAPI + `?value=${id}`).set('xid', Betools.tools.queryUniqueID()).set('accept', 'json');
            console.log('auto serialid : ' + JSON.stringify(patchResp));

            //第三步，回显当前用印登记信息，并向印章管理员推送消息
            state.loading = false;

            if (result.protocol41 == true && result.affectedRows > 0) {

                message = '已成功提交用印登记信息！';

                state.status = 'none';
                state.readonly = true;

                const title = '用印登记申请';
                const description = `@印章管理员 @${seal_man} ，${create_by}已提交用印登记信息，请及时处理用印登记申请！`;

                const url = encodeURIComponent(`${window.BECONFIG.domain.replace('www','wechat')}/#/app/sealview?id=${id}&statustype=none`);
                const signmail = state.mailconfig[seal_man];

                //领取地址
                const receiveURL = encodeURIComponent(`${window.BECONFIG.domain.replace('www','wechat')}/#/app/sealreceive?id=${id}&type=receive`);

                try {
                    //通知签收人领取资料(企业微信发送)
                    await superagent.get(`${window.BECONFIG['restAPI']}/api/v1/weappms/${username}/亲爱的同事，您提交的用印登记申请，文件:‘${state.item.filename}’（${state.item.sealtype}），${state.noname}：${state.item.contractId}，已知会盖印人?rurl=${receiveURL}`)
                        .set('xid', Betools.tools.queryUniqueID()).set('accept', 'json');
                } catch (error) {
                    console.log(error);
                }

                try {
                    const message = `亲爱的用印管理员，您有一份新的用印登记申请，文件名‘${state.item.filename}’（${state.item.sealtype}），${state.noname}：${state.item.contractId}，请记得及时处理`;
                    if (state.item.seal_mobile) {
                        //通知印章人领取资料(企业微信发送)
                        await superagent.post(`${window.BECONFIG['restAPI']}/api/v5/wework_message/${state.item.seal_mobile}?message=${message}&url=${url}`).set('xid', Betools.tools.queryUniqueID()).set('accept', 'json');
                    } else {
                        //通知印章人领取资料(企业微信发送)
                        await superagent.get(`${window.BECONFIG['restAPI']}/api/v1/weappms/${state.item.seal}/${message}?rurl=${url}`).set('xid', Betools.tools.queryUniqueID()).set('accept', 'json');
                    }
                } catch (error) {
                    console.log(error);
                }

                //查询数据
                const value = await Betools.query.queryTableData(`bs_seal_regist`, id);

                //显示序列号
                state.item.serialid = value.serialid;

                message = `${message} 排序号为:${value.serialid},请将序号书写在用印文件上！`

                //记录 审批人 经办人 审批表单 表单编号 记录编号 操作(同意/驳回) 意见 内容 表单数据
                const prLogHisNode = {
                    id: Betools.tools.queryUniqueID(),
                    table_name: 'bs_seal_regist',
                    main_value: id,
                    proponents: username,
                    business_data_id: id, //varchar(100)  null comment '业务数据主键值',
                    business_code: '000000000', //varchar(100)  null comment '业务编号',
                    process_name: '用印流程审批', //varchar(100)  null comment '流程名称',
                    employee: userinfo.realname, //varchar(1000) null comment '操作职员',
                    approve_user: userinfo.username, //varchar(100)  null comment '审批人员',
                    action: '发起', //varchar(100)  null comment '操作动作',
                    action_opinion: '发起用印登记申请[待用印]', //text          null comment '操作意见',
                    operate_time: dayjs().format('YYYY-MM-DD HH:mm:ss'), //datetime      null comment '操作时间',
                    functions_station: userinfo.position, //varchar(100)  null comment '职能岗位',
                    process_station: '用印审批[印章管理]', //varchar(100)  null comment '流程岗位',
                    business_data: JSON.stringify(state.item), //text          null comment '业务数据',
                    content: state.item.filename + ' #经办人: ' + state.item.username, //text          null comment '业务内容',
                    process_audit: state.item.workno + '##' + state.item.serialid, //varchar(100)  null comment '流程编码',
                    create_time: dayjs().format('YYYY-MM-DD HH:mm:ss'), //datetime      null comment '创建日期',
                    relate_data: '', //text          null comment '关联数据',
                    origin_data: '',
                }

                await Betools.workflow.approveViewProcessLog(prLogHisNode);

                //同时推送一条待办记录给印章管理员

                //记录 审批人 经办人 审批表单 表单编号 记录编号 操作(同意/驳回) 意见 内容 表单数据
                const prLogNode = {
                    id: Betools.tools.queryUniqueID(),
                    table_name: 'bs_seal_regist',
                    main_value: id,
                    proponents: seal,
                    business_data_id: id, //varchar(100)  null comment '业务数据主键值',
                    business_code: '000000000', //varchar(100)  null comment '业务编号',
                    process_name: '用印流程审批', //varchar(100)  null comment '流程名称',
                    employee: seal_man, //varchar(1000) null comment '操作职员',
                    approve_user: seal, //varchar(100)  null comment '审批人员',
                    action: '', //varchar(100)  null comment '操作动作',
                    action_opinion: '用印登记申请[待用印]', //text          null comment '操作意见',
                    operate_time: dayjs().format('YYYY-MM-DD HH:mm:ss'), //datetime      null comment '操作时间',
                    functions_station: '印章管理', //varchar(100)  null comment '职能岗位',
                    process_station: '用印审批[印章管理]', //varchar(100)  null comment '流程岗位',
                    business_data: JSON.stringify(state.item), //text          null comment '业务数据',
                    content: state.item.filename + ' #待用印 #经办人: ' + state.item.username, //text          null comment '业务内容',
                    process_audit: state.item.workno + '##' + state.item.serialid, //varchar(100)  null comment '流程编码',
                    create_time: dayjs().format('YYYY-MM-DD HH:mm:ss'), //datetime      null comment '创建日期',
                    relate_data: '', //text          null comment '关联数据',
                    origin_data: '',
                }

                await Betools.workflow.taskViewProcessLog(prLogNode);

            } else {
                message = '提交用印登记信息失败，请稍后再试！';
            }
        } catch (error) {
            console.log(error);
        } finally {
            state.tag.showOverlay = false;
            state.block.showOverlay = '';
            await vant.Dialog.alert({
                title: '温馨提示',
                message: message,
            });
        }
    },

    /**
     * 取消函数
     * @param {*} Dialog 
     * @param {*} returnBack 
     * @param {*} title 
     */
    async cancelAndBack(Dialog, returnBack, title) {
        Dialog.confirm({
            title: title,
            message: '点击‘确认’后返回上一页',
        }).then(() => { // on confirm
            returnBack();
        });
    },

    //数据校验
    async checkDataCompanyAdd(element, type) {
        if (type == 'company') {
            //校验公司名称,如果已经存在此公司名称，需要给出提示
            //校验所属行业
            //校验所属区域
            //校验登记状态
            //校验营业执照
            //校验经营范围
            //校验注册地址
            //校验注册资本
            //校验实缴资本
            //校验营业期限
            //校验公司类型
            //校验设立原因
            //校验使用情况
            //校验法人代表
            //校验印章保管人
            //校验备案联络员
            //校验财务负责人
            //校验备注信息
        } else if (type == 'director') {
            //校验董事长
            //校验董事
            //校验执行董事
            //校验总经理
            //校验监事会主席
            //校验监事
        } else if (type == 'stock') {
            //如果没有数据，则提交股东信息
            //如果有数据，校验股东信息及占股比例
        }
    },

    /**
     * 确认函数 CompanyAdd
     * @param {*} elem 
     * @param {*} result 
     * @param {*} validResult 
     * @param {*} response 
     */
    async confirmCompanyAdd(elem, result, validResult, response, state, Dialog) {
        let companyNodes = [];
        let linkNodes = [];
        let stockNodes = [];
        let managerNodes = [];

        // 获取用户信息
        const userinfo = await storage.getStore('system_userinfo');

        const company = state.companyNameColumns.find((item) => { return item.name == state.item.companyName });

        elem = {
            id: tools.queryUniqueID(),
            baseID: company && company.id ? company.id : state.item.baseID,
            ...state.item,
            ...state.director,
            ...state.stock,
            ...state.qualification,
        };

        companyNodes.push(elem);

        console.log(`element:`, JSON.stringify(elem));

        await Dialog.confirm({
            title: '确认提交设立公司申请？',
            message: '点击‘确认’后提交申请',
        });

        try {
            //第一步，执行数据校验
            console.log(`第一步，执行数据校验`);
            validResult = await this.checkDataCompanyAdd(elem, 'company');

            //第二步，检查是否有股东信息，如果有股东、董监高信息，则需要提交股东、董监高信息
            console.log(`第二步，检查是否有股东信息，如果有股东、董监高信息，则需要提交股东、董监高信息`);

            //检查股东信息
            if (state.stock) {
                for (let i = 0; i < 20;) {
                    if (state.stock && state.stock['shareholder' + i]) {
                        //设置股权关系，即股东A 持有 公司B 多少比例 股权
                        const ratio = {
                                id: tools.queryUniqueID(),
                                from_id: state.stock['shareholder' + i],
                                to_id: company.id,
                                from_company: state.stock['shareholder' + i],
                                to_company: elem.companyName,
                                label: state.stock['ratioDetail' + i],
                                linkStatus: 0,
                            }
                            //设置stock信息，即公司A拥有股东B
                        const element = {
                            id: tools.queryUniqueID(),
                            pid: elem.id,
                            baseID: company.id,
                            shareholder: state.stock['shareholder' + i],
                            ratioDetail: state.stock['ratioDetail' + i],
                            type: '100',
                            typeName: 'shareholder',
                            companyName: elem.companyName,
                        }
                        linkNodes.push(ratio);
                        stockNodes.push(element);
                    }
                    i++;
                }
            }
            //设置股权股东信息
            elem['stocklist'] = stockNodes;

            //检查董监高信息
            if (state.director && (state.director.supervisor || state.director.manager || state.director.supervisorChairman || state.director.director || state.director.directorExecutive || state.director.directorChairman)) {

                //设置stock信息，即公司A拥有董监高B //类型 100 股东 200 董事长 300 董事 400 执行董事 500 总经理 600 监事会主席 700 监事 800 法人代表
                for (let name in state.director) {
                    const element = {
                        id: tools.queryUniqueID(),
                        pid: elem.id,
                        baseID: company.id,
                        managerName: state.director[name],
                        type: state.type[name],
                        typeName: name,
                        positionName: state.position[name],
                        companyName: elem.companyName,
                    }
                    managerNodes.push(element);
                }
            }

            //需要提交的表单数据
            const multiElement = {
                'tname': 'bs_company_flow_data,bs_company_flow_link,bs_company_flow_stock,bs_company_flow_manager',
                'bs_company_flow_data': companyNodes,
                'bs_company_flow_link': linkNodes,
                'bs_company_flow_stock': stockNodes,
                'bs_company_flow_manager': managerNodes,
            };

            (async(multiTableData, Dialog, result, multiElement) => {
                //第三步，向表单提交form对象数据
                console.log(`第三步，向表单提交form对象数据`);
                result = await multiTableData('bs_dynamic', multiElement);

                //第四步，如果返回信息成功，则提示用户申请成功
                if (result.protocol41 == true && result.affectedRows > 0) {
                    console.log(`如果返回信息成功，则提示用户申请成功`);
                    await Dialog.confirm({
                        title: '设立公司申请提交成功！',
                    });
                } else {
                    let code = result && result.error && result.error.code ? result.error.code : '';
                    await Dialog.confirm({
                        title: `设立公司申请失败，请检查是否已提交过此公司申请！Error:[${code}]`,
                    });
                }
            })(this.multiTableData, Dialog, result, multiElement);
        } catch (error) {
            console.log(error);
        }

        return elem;
    },

    /**
     * 向主数据接口推送公司工商信息数据
     * @param {*} companyInfo 
     * @param {*} stocks 
     * @param {*} qualification 
     */
    async postMainDataInfoInc(director, company, stocks, qualification, postURL = `https://api.yunwisdom.club:30443/gateway-mdm/api/inner/datahub/producer/serverApi`, postURL_ = `https://api.yunwisdom.club:30443/gateway-mdm-slave/api/inner/datahub/producer/serverApi`, resp = '') {

        console.log(`company info :`, company);
        const stocklist = [];

        if (Array.isArray(stocks)) {
            stocks.map((item, index) => {
                try {
                    stocklist.push({
                        shareholder: item.shareholder,
                        ratioDetail: parseFloat(item['ratioDetail'] / 100).toFixed(2) + '',
                    });
                } catch (error) {
                    console.log(error);
                }
            });
        }

        if (qualification && qualification.length > 0 && qualification[0].qualificationType == '--') {
            qualification = [];
        }

        const node = {
            "appCode": "de",
            "topicCode": "cor_c",
            "jsonData": [{
                "single": [{
                    "sn": company.id,
                    "comPanyNum": company.id,
                    "companyAreaCode": "0000",
                    "registrationStatusCode": "4201",
                    "companyArea": company.companyCode,
                    "comPanyName": company.companyName,
                    "registrationStatus": company.registrationStatus,
                    "businessScope": company.businessScope,
                    "registeredAddress": company.registeredAddress,
                    "registeredCapital": company.registeredCapital,
                    "legalRepresentative": company.legalRepresentative,
                    "directorChairman": director.directorChairman,
                    "director": director.director,
                    "directorExecutive": director.directorExecutive,
                    "manager": director.manager,
                    "supervisorChairman": director.supervisorChairman,
                    "supervisor": director.supervisor,
                    "validStatus": "0",
                    "dataStatus": "0",
                }],
                "ShareholderInformation": stocklist,
                "qualification": qualification,
            }]
        };

        try {
            superagent.post(postURL).send(node).set('accept', 'application/json').then(() => {});
            superagent.post(postURL_).send(node).set('accept', 'application/json').then(() => {});
        } catch (error) {
            superagent.post(postURL).send(node).set('accept', 'application/json').then(() => {});
            superagent.post(postURL_).send(node).set('accept', 'application/json').then(() => {});
            console.log(`post mdm data error : `, error);
        }

        console.log(`post mdm data and response :`, resp, `\n\rpost mdm data :`, node);

        //返回响应结果
        return resp;
    },

    /**
     * 更新主数据法人信息
     * @param {*} state 法人信息
     */
    async patchMainDataInfoInc(state, resp = '', stockList = []) {
        // 载入股东信息
        for (let i = 0; i < 20; i++) {
            const element = {
                shareholder: state.stock['shareholder' + i],
                ratioDetail: state.stock['ratioDetail' + i],
            }
            if (state.stock && state.stock['shareholder' + i]) {
                stockList.push(element);
            }
        }
        // 将资质数据载入基础信息
        const { qualificationType, qualificationLevel, qualificationNumber, validityPeriod1, validityPeriod2, qualificationStatus, cancellationReason, } = state.item;
        const qualificationList = qualificationType == '--' ? [] : [{ qualificationType, qualificationLevel, qualificationNumber, validityPeriod1, validityPeriod2, qualificationStatus, cancellationReason, }];
        // 持久化工商管理数据，如果执行发现数据库存在数据，则改用patch修改公司工商数据
        resp = await Betools.manage.postMainDataInfoInc(state.director, state.item, stockList, qualificationList); //向主数据接口推送公司工商信息数据
        // 返回信息
        return resp;
    },

    /**
     * 更新主数据法人信息
     * @param {*} state 法人信息
     */
    async deleteMainDataInfoInc(id, invalid = '99', postURL = `https://api.yunwisdom.club:30443/gateway-mdm/api/inner/datahub/producer/serverApi`, postURL_ = `https://api.yunwisdom.club:30443/gateway-mdm-slave/api/inner/datahub/producer/serverApi`, resp = 'success') {

        const node = {
            "appCode": "de",
            "topicCode": "cor_c",
            "jsonData": [{
                "single": [{
                    "sn": id,
                    "comPanyNum": id,
                    "companyAreaCode": "",
                    "registrationStatusCode": "",
                    "companyArea": '',
                    "comPanyName": '',
                    "registrationStatus": '',
                    "businessScope": '',
                    "registeredAddress": '',
                    "registeredCapital": '',
                    "legalRepresentative": '',
                    "directorChairman": '',
                    "director": '',
                    "directorExecutive": '',
                    "manager": '',
                    "supervisorChairman": '',
                    "supervisor": '',
                    "validStatus": invalid,
                    "dataStatus": invalid,
                }],
                "ShareholderInformation": [],
                "qualification": [],
            }]
        };

        try {
            superagent.post(postURL).send(node).set('accept', 'application/json').then(() => {});
            superagent.post(postURL_).send(node).set('accept', 'application/json').then(() => {});
        } catch (error) {
            superagent.post(postURL).send(node).set('accept', 'application/json').then(() => {});
            superagent.post(postURL_).send(node).set('accept', 'application/json').then(() => {});
            console.log(`post mdm data error : `, error);
        }

        return resp;
    },

    /**
     * 根据ID向主数据同步公司工商数据
     */
    async syncMainDataCompanyInfo(id, item = {}) {
        const state = { id, item };
        await Betools.manage.queryCompanyIndustryInfo('bs_company_flow_data', state.id, state);
        Betools.manage.patchMainDataInfoInc(state).then(() => { console.log(`更新法人信息_更新推送#主数据:`, JSON.stringify(state.item)) });
    },

    /**
     * 下一步函数 CompanyAdd
     * @param {*} state 
     * @param {*} checkValid 
     * @param {*} Dialog 
     * @param {*} confirm 
     */
    async nextstepCompanyAdd(state, checkValid, Dialog, confirm) {
        if (state.step == 'one') {
            //此次校验，公司基础信息是否填写完整
            const invalidKeys = checkValid(state.item);
            if (tools.isNull(invalidKeys)) {
                state.step = 'two';
            } else {
                Dialog.confirm({
                    title: '请填写完公司设立信息后进行下一步！',
                    message: `请检查缺失信息：${invalidKeys}`
                })
            }
        } else if (state.step == 'two') {
            if (!state.director.directorExecutive) {
                state.director.directorExecutive = '--';
            }
            if (!state.director.directorChairman) {
                state.director.directorChairman = '--';
            }
            if (!state.director.director) {
                state.director.director = '--';
            }
            //此次校验，公司的董事信息是否填写完整
            const invalidKeys = checkValid(state.director);
            if (tools.isNull(invalidKeys)) {
                state.step = 'three';
            } else {
                Dialog.confirm({
                    title: '请填写完公司董事信息后进行下一步！',
                    message: `请检查缺失信息：${invalidKeys}`
                });
            }
        } else if (state.step == 'three') {
            const elem = {
                id: tools.queryUniqueID(),
                ...state.item,
                ...state.director
            };
            console.log(`elemnt:`, JSON.stringify(elem));
            await confirm(elem, null, null);
        }
    },

    /**
     * 上一步函数
     * @param {*} state 
     * @param {*} cancel 
     */
    async prestepCompanyAdd(state, cancel) {
        if (state.step == 'three') {
            state.step = 'two'
        } else if (state.step == 'two') {
            state.step = 'one'
        } else if (state.stop == 'one') {
            await cancel();
        }
    },

    /**
     * 录入董监高确认
     * @param {*} result 
     * @param {*} elem 
     * @param {*} nodes 
     */
    async confirmCompanyDirector(result = null, elem = null, nodes = [], state, Dialog, returnBack) {

        //查询公司名称
        const company = state.companyNameColumns.find((item) => { return item.name == state.item.companyName });

        //董监高对象数据
        elem = {
            id: company.id,
            ...state.director,
        };

        //提交申请确认
        Dialog.confirm({
            title: '确认提交录入董监高申请？',
            message: `董事长:${state.director.directorChairman}，董事:${state.director.director}\n\r执行董事:${state.director.directorExecutive}，总经理:${state.director.manager}\n\r监事会主席:${state.director.supervisorChairman}，监事:${state.director.supervisor}\n\r点击‘确认’后提交录入董监高申请！`,
        }).then(async() => { // on confirm

            //向表单提交form对象数据（董监高）
            result = await Betools.manage.patchTableData('bs_company_flow_data', elem.id, elem);

            //如果提交修改数据成功，则新增id的bs_company_flow_manager数据数据
            if (result.protocol41 == true && result.affectedRows > 0) {

                //删除pid为elem.id的bs_company_flow_manager数据
                result = await Betools.manage.deleteTableDataByWhere('bs_company_flow_manager', 'pid', elem.id);

                //检查董监高信息
                if (result.protocol41 == true && state.director && (state.director.supervisor || state.director.manager || state.director.supervisorChairman || state.director.director || state.director.directorExecutive || state.director.directorChairman)) {
                    //设置stock信息，即公司A拥有董监高B //类型 100 股东 200 董事长 300 董事 400 执行董事 500 总经理 600 监事会主席 700 监事 800 法人代表
                    for (let name in state.director) {
                        const element = {
                            id: Betools.tools.queryUniqueID(),
                            pid: elem.id,
                            baseID: company.baseID,
                            managerName: state.director[name],
                            type: state.type[name],
                            typeName: name,
                            positionName: state.position[name],
                            companyName: state.item.companyName,
                        }
                        nodes.push(element);
                    }
                    result = await Betools.manage.postTableData('bs_company_flow_manager', nodes);
                    await Betools.tools.sleep(Math.random() * 10);
                }

                //提示用户操作成功，并返回上一页
                await Dialog.confirm({ title: '提交录入董监高申请成功！', });
                await Betools.tools.sleep(300);
                await returnBack();
            } else {
                await Dialog.confirm({
                    title: `提交录入申请失败，请联系管理员进行处理，Error:[${JSON.stringify(result)}]！`,
                });
            }

        });

    },

    /**
     * 录入基础信息确认函数
     * @param {*} result 
     * @param {*} elem 
     * @param {*} nodes 
     */
    async confirmCompanyRec(result = null, elem = null, nodes = [], state, Dialog, returnBack) {

        //查询公司名称
        const company = state.companyNameColumns.find((item) => { return item.name == state.item.companyName });

        //董监高对象数据
        elem = { id: company.id, ...state.item, };
        const { id, companyName, companyNameEn, brief_info, industry, taxpayer_id, regist_number, organ_code, establish_time, examine_date, companyCode, registrationStatus, cancellationTime, licenseNumber, businessScope, registeredAddress, registeredCapital, paidCapital, paidTime, paidTureTime, businessTerm, companyType, reason, usages, legalRepresentative, sealKeeper, liaison, responsiblePerson, remark } = elem;
        elem = { id, companyName, companyNameEn, brief_info, industry, taxpayer_id, regist_number, organ_code, establish_time, examine_date, companyCode, registrationStatus, cancellationTime, licenseNumber, businessScope, registeredAddress, registeredCapital, paidCapital, paidTime, paidTureTime, businessTerm, companyType, reason, usages, legalRepresentative, sealKeeper, liaison, responsiblePerson, remark };

        //提交申请确认
        Dialog.confirm({
            title: '确认提交录入工商信息申请？',
            message: `点击‘确认’后提交录入工商信息申请！`,
        }).then(async() => { // on confirm

            //向表单提交form对象数据（工商信息）
            result = await Betools.manage.patchTableData('bs_company_flow_data', elem.id, elem);

            //如果提交修改数据成功，则新增id的bs_company_flow_manager数据数据
            if (result.protocol41 == true && result.affectedRows > 0) {
                //提示用户操作成功，并返回上一页
                await Dialog.confirm({ title: '提交录入工商信息申请成功！', });
                await Betools.tools.sleep(300);
                await returnBack();
            } else {
                await Dialog.confirm({
                    title: `提交录入申请失败，请联系管理员进行处理，Error:[${JSON.stringify(result)}]！`,
                });
            }

        });
    },

    /**
     * 股东确认函数
     * @param {*} result 
     * @param {*} elem 
     * @param {*} nodes 
     * @param {*} state 
     * @param {*} Dialog 
     * @param {*} returnBack 
     */
    async confirmCompanyStockholder(result = null, elem = null, nodes = [], state, Dialog, returnBack) {
        let linkNodes = [];
        let stockNodes = [];

        //查询公司名称
        const company = state.companyNameColumns.find((item) => { return item.name == state.item.companyName });

        //董监高对象数据
        elem = {
            id: company.id,
            ...state.stock,
        };

        //提交申请确认
        Dialog.confirm({
            title: '确认提交录入股东申请？',
            message: `点击‘确认’后提交录入股东申请！`,
        }).then(async() => { // on confirm

            //向表单提交form对象数据（董监高）
            result = await Betools.manage.patchTableData('bs_company_flow_data', elem.id, elem);

            //如果提交修改数据成功，则新增id的bs_company_flow_manager数据数据
            if (result.protocol41 == true && result.affectedRows > 0) {

                //删除pid为elem.id的bs_company_flow_manager数据
                result = await Betools.manage.deleteTableDataByWhere('bs_company_flow_stock', 'pid', elem.id);
                result = await Betools.manage.deleteTableDataByWhere('bs_company_flow_link', 'pid', elem.id);

                //检查董监高信息
                for (let i = 0; i < 20;) {
                    if (state.stock && state.stock['shareholder' + i]) {
                        //设置股权关系，即股东A 持有 公司B 多少比例 股权
                        const ratio = {
                                id: Betools.tools.queryUniqueID(),
                                pid: elem.id,
                                from_id: state.stock['shareholder' + i],
                                to_id: company.id,
                                from_company: state.stock['shareholder' + i],
                                to_company: company.name,
                                label: state.stock['ratioDetail' + i],
                                linkStatus: 0,
                            }
                            //设置stock信息，即公司A拥有股东B
                        const element = {
                            id: Betools.tools.queryUniqueID(),
                            pid: elem.id,
                            shareholder: state.stock['shareholder' + i],
                            ratioDetail: state.stock['ratioDetail' + i],
                            type: '100',
                            typeName: 'shareholder',
                            companyName: company.name,
                        }
                        linkNodes.push(ratio);
                        stockNodes.push(element);
                    }
                    i++;
                }

                //需要提交的表单数据
                const multiElement = {
                    'tname': 'bs_company_flow_link,bs_company_flow_stock',
                    'bs_company_flow_link': linkNodes,
                    'bs_company_flow_stock': stockNodes,
                };

                //第三步，向表单提交form对象数据
                console.log(`第三步，向表单提交form对象数据`);
                result = await Betools.manage.multiTableData('bs_dynamic', multiElement);
                await Betools.tools.sleep(Math.random() * 10);

                //提示用户操作成功，并返回上一页
                await Dialog.confirm({ title: '提交录入股东申请成功！', });
                await Betools.tools.sleep(300);
                await returnBack();
            } else {
                await Dialog.confirm({
                    title: `提交录入申请失败，请联系管理员进行处理，Error:[${JSON.stringify(result)}]！`,
                });
            }

        });

    },

    /**
     * 获取城市数据
     */
    async queryCity(data = null) {
        data = await storage.getStore(`system_city_data`);
        if (tools.isNull(data) || data.length == 0) {
            const options = [
                { "text": "安徽省", "value": "安徽省", "children": [{ "text": "安庆市", "children": [{ "text": "大观区", "value": "大观区" }, { "text": "怀宁县", "value": "怀宁县" }, { "text": "潜山市", "value": "潜山市" }, { "text": "宿松县", "value": "宿松县" }, { "text": "太湖县", "value": "太湖县" }, { "text": "桐城市", "value": "桐城市" }, { "text": "望江县", "value": "望江县" }, { "text": "迎江区", "value": "迎江区" }, { "text": "宜秀区", "value": "宜秀区" }, { "text": "岳西县", "value": "岳西县" }], "value": "安庆市" }, { "text": "蚌埠市", "children": [{ "text": "蚌山区", "value": "蚌山区" }, { "text": "固镇县", "value": "固镇县" }, { "text": "淮上区", "value": "淮上区" }, { "text": "怀远县", "value": "怀远县" }, { "text": "龙子湖区", "value": "龙子湖区" }, { "text": "五河县", "value": "五河县" }, { "text": "禹会区", "value": "禹会区" }], "value": "蚌埠市" }, { "text": "亳州市", "children": [{ "text": "利辛县", "value": "利辛县" }, { "text": "蒙城县", "value": "蒙城县" }, { "text": "谯城区", "value": "谯城区" }, { "text": "涡阳县", "value": "涡阳县" }], "value": "亳州市" }, { "text": "池州市", "children": [{ "text": "东至县", "value": "东至县" }, { "text": "贵池区", "value": "贵池区" }, { "text": "青阳县", "value": "青阳县" }, { "text": "石台县", "value": "石台县" }], "value": "池州市" }, { "text": "滁州市", "children": [{ "text": "定远县", "value": "定远县" }, { "text": "凤阳县", "value": "凤阳县" }, { "text": "来安县", "value": "来安县" }, { "text": "琅琊区", "value": "琅琊区" }, { "text": "明光市", "value": "明光市" }, { "text": "南谯区", "value": "南谯区" }, { "text": "全椒县", "value": "全椒县" }, { "text": "天长市", "value": "天长市" }], "value": "滁州市" }, { "text": "阜阳市", "children": [{ "text": "阜南县", "value": "阜南县" }, { "text": "界首市", "value": "界首市" }, { "text": "临泉县", "value": "临泉县" }, { "text": "太和县", "value": "太和县" }, { "text": "颍东区", "value": "颍东区" }, { "text": "颍泉区", "value": "颍泉区" }, { "text": "颍上县", "value": "颍上县" }, { "text": "颍州区", "value": "颍州区" }], "value": "阜阳市" }, { "text": "合肥市", "children": [{ "text": "包河区", "value": "包河区" }, { "text": "长丰县", "value": "长丰县" }, { "text": "巢湖市", "value": "巢湖市" }, { "text": "肥东县", "value": "肥东县" }, { "text": "肥西县", "value": "肥西县" }, { "text": "庐江县", "value": "庐江县" }, { "text": "庐阳区", "value": "庐阳区" }, { "text": "蜀山区", "value": "蜀山区" }, { "text": "瑶海区", "value": "瑶海区" }], "value": "合肥市" }, { "text": "淮北市", "children": [{ "text": "杜集区", "value": "杜集区" }, { "text": "烈山区", "value": "烈山区" }, { "text": "濉溪县", "value": "濉溪县" }, { "text": "相山区", "value": "相山区" }], "value": "淮北市" }, { "text": "淮南市", "children": [{ "text": "八公山区", "value": "八公山区" }, { "text": "大通区", "value": "大通区" }, { "text": "凤台县", "value": "凤台县" }, { "text": "潘集区", "value": "潘集区" }, { "text": "寿县", "value": "寿县" }, { "text": "田家庵区", "value": "田家庵区" }, { "text": "谢家集区", "value": "谢家集区" }], "value": "淮南市" }, { "text": "黄山市", "children": [{ "text": "黄山区", "value": "黄山区" }, { "text": "徽州区", "value": "徽州区" }, { "text": "祁门县", "value": "祁门县" }, { "text": "屯溪区", "value": "屯溪区" }, { "text": "歙县", "value": "歙县" }, { "text": "休宁县", "value": "休宁县" }, { "text": "黟县", "value": "黟县" }], "value": "黄山市" }, { "text": "六安市", "children": [{ "text": "霍邱县", "value": "霍邱县" }, { "text": "霍山县", "value": "霍山县" }, { "text": "金安区", "value": "金安区" }, { "text": "金寨县", "value": "金寨县" }, { "text": "舒城县", "value": "舒城县" }, { "text": "叶集区", "value": "叶集区" }, { "text": "裕安区", "value": "裕安区" }], "value": "六安市" }, { "text": "马鞍山市", "children": [{ "text": "博望区", "value": "博望区" }, { "text": "当涂县", "value": "当涂县" }, { "text": "含山县", "value": "含山县" }, { "text": "和县", "value": "和县" }, { "text": "花山区", "value": "花山区" }, { "text": "雨山区", "value": "雨山区" }], "value": "马鞍山市" }, { "text": "宿州市", "children": [{ "text": "砀山县", "value": "砀山县" }, { "text": "灵璧县", "value": "灵璧县" }, { "text": "埇桥区", "value": "埇桥区" }, { "text": "泗县", "value": "泗县" }, { "text": "萧县", "value": "萧县" }], "value": "宿州市" }, { "text": "铜陵市", "children": [{ "text": "枞阳县", "value": "枞阳县" }, { "text": "郊区", "value": "郊区" }, { "text": "铜官区", "value": "铜官区" }, { "text": "义安区", "value": "义安区" }], "value": "铜陵市" }, { "text": "芜湖市", "children": [{ "text": "繁昌县", "value": "繁昌县" }, { "text": "镜湖区", "value": "镜湖区" }, { "text": "南陵县", "value": "南陵县" }, { "text": "鸠江区", "value": "鸠江区" }, { "text": "三山区", "value": "三山区" }, { "text": "芜湖县", "value": "芜湖县" }, { "text": "无为县", "value": "无为县" }, { "text": "弋江区", "value": "弋江区" }], "value": "芜湖市" }, { "text": "宣城市", "children": [{ "text": "广德县", "value": "广德县" }, { "text": "旌德县", "value": "旌德县" }, { "text": "泾县", "value": "泾县" }, { "text": "绩溪县", "value": "绩溪县" }, { "text": "郎溪县", "value": "郎溪县" }, { "text": "宁国市", "value": "宁国市" }, { "text": "宣州区", "value": "宣州区" }], "value": "宣城市" }] },
                { "text": "澳门特别行政区", "value": "澳门特别行政区", "children": [{ "text": "澳门城区", "children": [{ "text": "大堂区", "value": "大堂区" }, { "text": "风顺堂区", "value": "风顺堂区" }, { "text": "花地玛堂区", "value": "花地玛堂区" }, { "text": "花王堂区", "value": "花王堂区" }, { "text": "嘉模堂区", "value": "嘉模堂区" }, { "text": "路凼填海区", "value": "路凼填海区" }, { "text": "圣方济各堂区", "value": "圣方济各堂区" }, { "text": "望德堂区", "value": "望德堂区" }], "value": "澳门城区" }] }, { "text": "北京市", "value": "北京市", "children": [{ "text": "北京城区", "children": [{ "text": "昌平区", "value": "昌平区" }, { "text": "朝阳区", "value": "朝阳区" }, { "text": "大兴区", "value": "大兴区" }, { "text": "东城区", "value": "东城区" }, { "text": "房山区", "value": "房山区" }, { "text": "丰台区", "value": "丰台区" }, { "text": "海淀区", "value": "海淀区" }, { "text": "怀柔区", "value": "怀柔区" }, { "text": "门头沟区", "value": "门头沟区" }, { "text": "密云区", "value": "密云区" }, { "text": "平谷区", "value": "平谷区" }, { "text": "石景山区", "value": "石景山区" }, { "text": "顺义区", "value": "顺义区" }, { "text": "通州区", "value": "通州区" }, { "text": "西城区", "value": "西城区" }, { "text": "延庆区", "value": "延庆区" }], "value": "北京城区" }] }, { "text": "重庆市", "value": "重庆市", "children": [{ "text": "重庆城区", "children": [{ "text": "巴南区", "value": "巴南区" }, { "text": "北碚区", "value": "北碚区" }, { "text": "璧山区", "value": "璧山区" }, { "text": "长寿区", "value": "长寿区" }, { "text": "大渡口区", "value": "大渡口区" }, { "text": "大足区", "value": "大足区" }, { "text": "涪陵区", "value": "涪陵区" }, { "text": "合川区", "value": "合川区" }, { "text": "江北区", "value": "江北区" }, { "text": "江津区", "value": "江津区" }, { "text": "九龙坡区", "value": "九龙坡区" }, { "text": "开州区", "value": "开州区" }, { "text": "梁平区", "value": "梁平区" }, { "text": "南岸区", "value": "南岸区" }, { "text": "南川区", "value": "南川区" }, { "text": "黔江区", "value": "黔江区" }, { "text": "綦江区", "value": "綦江区" }, { "text": "荣昌区", "value": "荣昌区" }, { "text": "沙坪坝区", "value": "沙坪坝区" }, { "text": "铜梁区", "value": "铜梁区" }, { "text": "潼南区", "value": "潼南区" }, { "text": "万州区", "value": "万州区" }, { "text": "武隆区", "value": "武隆区" }, { "text": "永川区", "value": "永川区" }, { "text": "渝北区", "value": "渝北区" }, { "text": "渝中区", "value": "渝中区" }], "value": "重庆城区" }, { "text": "重庆郊县", "children": [{ "text": "城口县", "value": "城口县" }, { "text": "垫江县", "value": "垫江县" }, { "text": "丰都县", "value": "丰都县" }, { "text": "奉节县", "value": "奉节县" }, { "text": "彭水苗族土家族自治县", "value": "彭水苗族土家族自治县" }, { "text": "石柱土家族自治县", "value": "石柱土家族自治县" }, { "text": "巫山县", "value": "巫山县" }, { "text": "巫溪县", "value": "巫溪县" }, { "text": "秀山土家族苗族自治县", "value": "秀山土家族苗族自治县" }, { "text": "酉阳土家族苗族自治县", "value": "酉阳土家族苗族自治县" }, { "text": "云阳县", "value": "云阳县" }, { "text": "忠县", "value": "忠县" }], "value": "重庆郊县" }] },
                { "text": "福建省", "value": "福建省", "children": [{ "text": "福州市", "children": [{ "text": "仓山区", "value": "仓山区" }, { "text": "长乐区", "value": "长乐区" }, { "text": "福清市", "value": "福清市" }, { "text": "鼓楼区", "value": "鼓楼区" }, { "text": "晋安区", "value": "晋安区" }, { "text": "连江县", "value": "连江县" }, { "text": "罗源县", "value": "罗源县" }, { "text": "马尾区", "value": "马尾区" }, { "text": "闽侯县", "value": "闽侯县" }, { "text": "闽清县", "value": "闽清县" }, { "text": "平潭县", "value": "平潭县" }, { "text": "台江区", "value": "台江区" }, { "text": "永泰县", "value": "永泰县" }], "value": "福州市" }, { "text": "龙岩市", "children": [{ "text": "长汀县", "value": "长汀县" }, { "text": "连城县", "value": "连城县" }, { "text": "上杭县", "value": "上杭县" }, { "text": "武平县", "value": "武平县" }, { "text": "新罗区", "value": "新罗区" }, { "text": "永定区", "value": "永定区" }, { "text": "漳平市", "value": "漳平市" }], "value": "龙岩市" }, { "text": "南平市", "children": [{ "text": "光泽县", "value": "光泽县" }, { "text": "建瓯市", "value": "建瓯市" }, { "text": "建阳区", "value": "建阳区" }, { "text": "浦城县", "value": "浦城县" }, { "text": "邵武市", "value": "邵武市" }, { "text": "顺昌县", "value": "顺昌县" }, { "text": "松溪县", "value": "松溪县" }, { "text": "武夷山市", "value": "武夷山市" }, { "text": "延平区", "value": "延平区" }, { "text": "政和县", "value": "政和县" }], "value": "南平市" }, { "text": "宁德市", "children": [{ "text": "福安市", "value": "福安市" }, { "text": "福鼎市", "value": "福鼎市" }, { "text": "古田县", "value": "古田县" }, { "text": "蕉城区", "value": "蕉城区" }, { "text": "屏南县", "value": "屏南县" }, { "text": "寿宁县", "value": "寿宁县" }, { "text": "霞浦县", "value": "霞浦县" }, { "text": "柘荣县", "value": "柘荣县" }, { "text": "周宁县", "value": "周宁县" }], "value": "宁德市" }, { "text": "莆田市", "children": [{ "text": "城厢区", "value": "城厢区" }, { "text": "涵江区", "value": "涵江区" }, { "text": "荔城区", "value": "荔城区" }, { "text": "仙游县", "value": "仙游县" }, { "text": "秀屿区", "value": "秀屿区" }], "value": "莆田市" }, { "text": "泉州市", "children": [{ "text": "安溪县", "value": "安溪县" }, { "text": "德化县", "value": "德化县" }, { "text": "丰泽区", "value": "丰泽区" }, { "text": "惠安县", "value": "惠安县" }, { "text": "晋江市", "value": "晋江市" }, { "text": "金门县", "value": "金门县" }, { "text": "鲤城区", "value": "鲤城区" }, { "text": "洛江区", "value": "洛江区" }, { "text": "南安市", "value": "南安市" }, { "text": "泉港区", "value": "泉港区" }, { "text": "石狮市", "value": "石狮市" }, { "text": "永春县", "value": "永春县" }], "value": "泉州市" }, { "text": "三明市", "children": [{ "text": "大田县", "value": "大田县" }, { "text": "将乐县", "value": "将乐县" }, { "text": "建宁县", "value": "建宁县" }, { "text": "梅列区", "value": "梅列区" }, { "text": "明溪县", "value": "明溪县" }, { "text": "宁化县", "value": "宁化县" }, { "text": "清流县", "value": "清流县" }, { "text": "三元区", "value": "三元区" }, { "text": "沙县", "value": "沙县" }, { "text": "泰宁县", "value": "泰宁县" }, { "text": "永安市", "value": "永安市" }, { "text": "尤溪县", "value": "尤溪县" }], "value": "三明市" }, { "text": "厦门市", "children": [{ "text": "海沧区", "value": "海沧区" }, { "text": "湖里区", "value": "湖里区" }, { "text": "集美区", "value": "集美区" }, { "text": "思明区", "value": "思明区" }, { "text": "同安区", "value": "同安区" }, { "text": "翔安区", "value": "翔安区" }], "value": "厦门市" }, { "text": "漳州市", "children": [{ "text": "长泰县", "value": "长泰县" }, { "text": "东山县", "value": "东山县" }, { "text": "华安县", "value": "华安县" }, { "text": "龙海市", "value": "龙海市" }, { "text": "龙文区", "value": "龙文区" }, { "text": "南靖县", "value": "南靖县" }, { "text": "平和县", "value": "平和县" }, { "text": "芗城区", "value": "芗城区" }, { "text": "云霄县", "value": "云霄县" }, { "text": "漳浦县", "value": "漳浦县" }, { "text": "诏安县", "value": "诏安县" }], "value": "漳州市" }] },
                { "text": "甘肃省", "value": "甘肃省", "children": [{ "text": "白银市", "children": [{ "text": "白银区", "value": "白银区" }, { "text": "会宁县", "value": "会宁县" }, { "text": "景泰县", "value": "景泰县" }, { "text": "靖远县", "value": "靖远县" }, { "text": "平川区", "value": "平川区" }], "value": "白银市" }, { "text": "定西市", "children": [{ "text": "安定区", "value": "安定区" }, { "text": "临洮县", "value": "临洮县" }, { "text": "陇西县", "value": "陇西县" }, { "text": "岷县", "value": "岷县" }, { "text": "通渭县", "value": "通渭县" }, { "text": "渭源县", "value": "渭源县" }, { "text": "漳县", "value": "漳县" }], "value": "定西市" }, { "text": "甘南藏族自治州", "children": [{ "text": "迭部县", "value": "迭部县" }, { "text": "合作市", "value": "合作市" }, { "text": "临潭县", "value": "临潭县" }, { "text": "碌曲县", "value": "碌曲县" }, { "text": "玛曲县", "value": "玛曲县" }, { "text": "夏河县", "value": "夏河县" }, { "text": "舟曲县", "value": "舟曲县" }, { "text": "卓尼县", "value": "卓尼县" }], "value": "甘南藏族自治州" }, { "text": "嘉峪关市", "children": [{ "text": "长城区", "value": "长城区" }, { "text": "镜铁区", "value": "镜铁区" }, { "text": "文殊镇", "value": "文殊镇" }, { "text": "新城镇", "value": "新城镇" }, { "text": "雄关区", "value": "雄关区" }, { "text": "峪泉镇", "value": "峪泉镇" }], "value": "嘉峪关市" }, { "text": "金昌市", "children": [{ "text": "金川区", "value": "金川区" }, { "text": "永昌县", "value": "永昌县" }], "value": "金昌市" }, { "text": "酒泉市", "children": [{ "text": "阿克塞哈萨克族自治县", "value": "阿克塞哈萨克族自治县" }, { "text": "敦煌市", "value": "敦煌市" }, { "text": "瓜州县", "value": "瓜州县" }, { "text": "金塔县", "value": "金塔县" }, { "text": "肃北蒙古族自治县", "value": "肃北蒙古族自治县" }, { "text": "肃州区", "value": "肃州区" }, { "text": "玉门市", "value": "玉门市" }], "value": "酒泉市" }, { "text": "兰州市", "children": [{ "text": "安宁区", "value": "安宁区" }, { "text": "城关区", "value": "城关区" }, { "text": "皋兰县", "value": "皋兰县" }, { "text": "红古区", "value": "红古区" }, { "text": "七里河区", "value": "七里河区" }, { "text": "西固区", "value": "西固区" }, { "text": "永登县", "value": "永登县" }, { "text": "榆中县", "value": "榆中县" }], "value": "兰州市" }, { "text": "临夏回族自治州", "children": [{ "text": "东乡族自治县", "value": "东乡族自治县" }, { "text": "广河县", "value": "广河县" }, { "text": "和政县", "value": "和政县" }, { "text": "积石山保安族东乡族撒拉族自治县", "value": "积石山保安族东乡族撒拉族自治县" }, { "text": "康乐县", "value": "康乐县" }, { "text": "临夏市", "value": "临夏市" }, { "text": "临夏县", "value": "临夏县" }, { "text": "永靖县", "value": "永靖县" }], "value": "临夏回族自治州" }, { "text": "陇南市", "children": [{ "text": "成县", "value": "成县" }, { "text": "宕昌县", "value": "宕昌县" }, { "text": "徽县", "value": "徽县" }, { "text": "康县", "value": "康县" }, { "text": "两当县", "value": "两当县" }, { "text": "礼县", "value": "礼县" }, { "text": "文县", "value": "文县" }, { "text": "武都区", "value": "武都区" }, { "text": "西和县", "value": "西和县" }], "value": "陇南市" }, { "text": "平凉市", "children": [{ "text": "崇信县", "value": "崇信县" }, { "text": "华亭市", "value": "华亭市" }, { "text": "泾川县", "value": "泾川县" }, { "text": "静宁县", "value": "静宁县" }, { "text": "崆峒区", "value": "崆峒区" }, { "text": "灵台县", "value": "灵台县" }, { "text": "庄浪县", "value": "庄浪县" }], "value": "平凉市" }, { "text": "庆阳市", "children": [{ "text": "合水县", "value": "合水县" }, { "text": "华池县", "value": "华池县" }, { "text": "环县", "value": "环县" }, { "text": "宁县", "value": "宁县" }, { "text": "庆城县", "value": "庆城县" }, { "text": "西峰区", "value": "西峰区" }, { "text": "正宁县", "value": "正宁县" }, { "text": "镇原县", "value": "镇原县" }], "value": "庆阳市" }, { "text": "天水市", "children": [{ "text": "甘谷县", "value": "甘谷县" }, { "text": "麦积区", "value": "麦积区" }, { "text": "秦安县", "value": "秦安县" }, { "text": "清水县", "value": "清水县" }, { "text": "秦州区", "value": "秦州区" }, { "text": "武山县", "value": "武山县" }, { "text": "张家川回族自治县", "value": "张家川回族自治县" }], "value": "天水市" }, { "text": "武威市", "children": [{ "text": "古浪县", "value": "古浪县" }, { "text": "凉州区", "value": "凉州区" }, { "text": "民勤县", "value": "民勤县" }, { "text": "天祝藏族自治县", "value": "天祝藏族自治县" }], "value": "武威市" }, { "text": "张掖市", "children": [{ "text": "甘州区", "value": "甘州区" }, { "text": "高台县", "value": "高台县" }, { "text": "临泽县", "value": "临泽县" }, { "text": "民乐县", "value": "民乐县" }, { "text": "山丹县", "value": "山丹县" }, { "text": "肃南裕固族自治县", "value": "肃南裕固族自治县" }], "value": "张掖市" }] },
                { "text": "广东省", "value": "广东省", "children": [{ "text": "潮州市", "children": [{ "text": "潮安区", "value": "潮安区" }, { "text": "饶平县", "value": "饶平县" }, { "text": "湘桥区", "value": "湘桥区" }], "value": "潮州市" }, { "text": "东莞市", "children": [{ "text": "长安镇", "value": "长安镇" }, { "text": "常平镇", "value": "常平镇" }, { "text": "茶山镇", "value": "茶山镇" }, { "text": "大朗镇", "value": "大朗镇" }, { "text": "大岭山镇", "value": "大岭山镇" }, { "text": "道滘镇", "value": "道滘镇" }, { "text": "东城街道", "value": "东城街道" }, { "text": "东莞生态园", "value": "东莞生态园" }, { "text": "东坑镇", "value": "东坑镇" }, { "text": "凤岗镇", "value": "凤岗镇" }, { "text": "高埗镇", "value": "高埗镇" }, { "text": "莞城街道", "value": "莞城街道" }, { "text": "横沥镇", "value": "横沥镇" }, { "text": "洪梅镇", "value": "洪梅镇" }, { "text": "厚街镇", "value": "厚街镇" }, { "text": "黄江镇", "value": "黄江镇" }, { "text": "虎门港管委会", "value": "虎门港管委会" }, { "text": "虎门镇", "value": "虎门镇" }, { "text": "寮步镇", "value": "寮步镇" }, { "text": "麻涌镇", "value": "麻涌镇" }, { "text": "南城街道", "value": "南城街道" }, { "text": "桥头镇", "value": "桥头镇" }, { "text": "清溪镇", "value": "清溪镇" }, { "text": "企石镇", "value": "企石镇" }, { "text": "沙田镇", "value": "沙田镇" }, { "text": "石碣镇", "value": "石碣镇" }, { "text": "石龙镇", "value": "石龙镇" }, { "text": "石排镇", "value": "石排镇" }, { "text": "松山湖管委会", "value": "松山湖管委会" }, { "text": "塘厦镇", "value": "塘厦镇" }, { "text": "望牛墩镇", "value": "望牛墩镇" }, { "text": "万江街道", "value": "万江街道" }, { "text": "谢岗镇", "value": "谢岗镇" }, { "text": "樟木头镇", "value": "樟木头镇" }, { "text": "中堂镇", "value": "中堂镇" }], "value": "东莞市" }, { "text": "东沙群岛", "children": [{ "text": "东沙群岛", "value": "东沙群岛" }], "value": "东沙群岛" }, { "text": "佛山市", "children": [{ "text": "禅城区", "value": "禅城区" }, { "text": "高明区", "value": "高明区" }, { "text": "南海区", "value": "南海区" }, { "text": "三水区", "value": "三水区" }, { "text": "顺德区", "value": "顺德区" }], "value": "佛山市" }, { "text": "广州市", "children": [{ "text": "白云区", "value": "白云区" }, { "text": "从化区", "value": "从化区" }, { "text": "番禺区", "value": "番禺区" }, { "text": "海珠区", "value": "海珠区" }, { "text": "花都区", "value": "花都区" }, { "text": "黄埔区", "value": "黄埔区" }, { "text": "荔湾区", "value": "荔湾区" }, { "text": "南沙区", "value": "南沙区" }, { "text": "天河区", "value": "天河区" }, { "text": "越秀区", "value": "越秀区" }, { "text": "增城区", "value": "增城区" }], "value": "广州市" }, { "text": "河源市", "children": [{ "text": "东源县", "value": "东源县" }, { "text": "和平县", "value": "和平县" }, { "text": "连平县", "value": "连平县" }, { "text": "龙川县", "value": "龙川县" }, { "text": "源城区", "value": "源城区" }, { "text": "紫金县", "value": "紫金县" }], "value": "河源市" }, { "text": "惠州市", "children": [{ "text": "博罗县", "value": "博罗县" }, { "text": "惠城区", "value": "惠城区" }, { "text": "惠东县", "value": "惠东县" }, { "text": "惠阳区", "value": "惠阳区" }, { "text": "龙门县", "value": "龙门县" }], "value": "惠州市" }, { "text": "江门市", "children": [{ "text": "恩平市", "value": "恩平市" }, { "text": "鹤山市", "value": "鹤山市" }, { "text": "江海区", "value": "江海区" }, { "text": "开平市", "value": "开平市" }, { "text": "蓬江区", "value": "蓬江区" }, { "text": "台山市", "value": "台山市" }, { "text": "新会区", "value": "新会区" }], "value": "江门市" }, { "text": "揭阳市", "children": [{ "text": "惠来县", "value": "惠来县" }, { "text": "揭东区", "value": "揭东区" }, { "text": "揭西县", "value": "揭西县" }, { "text": "普宁市", "value": "普宁市" }, { "text": "榕城区", "value": "榕城区" }], "value": "揭阳市" }, { "text": "茂名市", "children": [{ "text": "电白区", "value": "电白区" }, { "text": "高州市", "value": "高州市" }, { "text": "化州市", "value": "化州市" }, { "text": "茂南区", "value": "茂南区" }, { "text": "信宜市", "value": "信宜市" }], "value": "茂名市" }, { "text": "梅州市", "children": [{ "text": "大埔县", "value": "大埔县" }, { "text": "丰顺县", "value": "丰顺县" }, { "text": "蕉岭县", "value": "蕉岭县" }, { "text": "梅江区", "value": "梅江区" }, { "text": "梅县区", "value": "梅县区" }, { "text": "平远县", "value": "平远县" }, { "text": "五华县", "value": "五华县" }, { "text": "兴宁市", "value": "兴宁市" }], "value": "梅州市" }, { "text": "清远市", "children": [{ "text": "佛冈县", "value": "佛冈县" }, { "text": "连南瑶族自治县", "value": "连南瑶族自治县" }, { "text": "连山壮族瑶族自治县", "value": "连山壮族瑶族自治县" }, { "text": "连州市", "value": "连州市" }, { "text": "清城区", "value": "清城区" }, { "text": "清新区", "value": "清新区" }, { "text": "阳山县", "value": "阳山县" }, { "text": "英德市", "value": "英德市" }], "value": "清远市" }, { "text": "汕头市", "children": [{ "text": "潮南区", "value": "潮南区" }, { "text": "潮阳区", "value": "潮阳区" }, { "text": "澄海区", "value": "澄海区" }, { "text": "濠江区", "value": "濠江区" }, { "text": "金平区", "value": "金平区" }, { "text": "龙湖区", "value": "龙湖区" }, { "text": "南澳县", "value": "南澳县" }], "value": "汕头市" }, { "text": "汕尾市", "children": [{ "text": "城区", "value": "城区" }, { "text": "海丰县", "value": "海丰县" }, { "text": "陆丰市", "value": "陆丰市" }, { "text": "陆河县", "value": "陆河县" }], "value": "汕尾市" }, { "text": "韶关市", "children": [{ "text": "浈江区", "value": "浈江区" }, { "text": "乐昌市", "value": "乐昌市" }, { "text": "南雄市", "value": "南雄市" }, { "text": "曲江区", "value": "曲江区" }, { "text": "仁化县", "value": "仁化县" }, { "text": "乳源瑶族自治县", "value": "乳源瑶族自治县" }, { "text": "始兴县", "value": "始兴县" }, { "text": "翁源县", "value": "翁源县" }, { "text": "武江区", "value": "武江区" }, { "text": "新丰县", "value": "新丰县" }], "value": "韶关市" }, { "text": "深圳市", "children": [{ "text": "宝安区", "value": "宝安区" }, { "text": "福田区", "value": "福田区" }, { "text": "光明区", "value": "光明区" }, { "text": "龙岗区", "value": "龙岗区" }, { "text": "龙华区", "value": "龙华区" }, { "text": "罗湖区", "value": "罗湖区" }, { "text": "南山区", "value": "南山区" }, { "text": "坪山区", "value": "坪山区" }, { "text": "盐田区", "value": "盐田区" }], "value": "深圳市" }, { "text": "阳江市", "children": [{ "text": "江城区", "value": "江城区" }, { "text": "阳春市", "value": "阳春市" }, { "text": "阳东区", "value": "阳东区" }, { "text": "阳西县", "value": "阳西县" }], "value": "阳江市" }, { "text": "云浮市", "children": [{ "text": "罗定市", "value": "罗定市" }, { "text": "新兴县", "value": "新兴县" }, { "text": "云安区", "value": "云安区" }, { "text": "郁南县", "value": "郁南县" }, { "text": "云城区", "value": "云城区" }], "value": "云浮市" }, { "text": "湛江市", "children": [{ "text": "赤坎区", "value": "赤坎区" }, { "text": "雷州市", "value": "雷州市" }, { "text": "廉江市", "value": "廉江市" }, { "text": "麻章区", "value": "麻章区" }, { "text": "坡头区", "value": "坡头区" }, { "text": "遂溪县", "value": "遂溪县" }, { "text": "吴川市", "value": "吴川市" }, { "text": "霞山区", "value": "霞山区" }, { "text": "徐闻县", "value": "徐闻县" }], "value": "湛江市" }, { "text": "肇庆市", "children": [{ "text": "德庆县", "value": "德庆县" }, { "text": "鼎湖区", "value": "鼎湖区" }, { "text": "端州区", "value": "端州区" }, { "text": "封开县", "value": "封开县" }, { "text": "高要区", "value": "高要区" }, { "text": "广宁县", "value": "广宁县" }, { "text": "怀集县", "value": "怀集县" }, { "text": "四会市", "value": "四会市" }], "value": "肇庆市" }, { "text": "中山市", "children": [{ "text": "板芙镇", "value": "板芙镇" }, { "text": "大涌镇", "value": "大涌镇" }, { "text": "东凤镇", "value": "东凤镇" }, { "text": "东区街道", "value": "东区街道" }, { "text": "东升镇", "value": "东升镇" }, { "text": "阜沙镇", "value": "阜沙镇" }, { "text": "港口镇", "value": "港口镇" }, { "text": "古镇镇", "value": "古镇镇" }, { "text": "横栏镇", "value": "横栏镇" }, { "text": "黄圃镇", "value": "黄圃镇" }, { "text": "火炬开发区街道", "value": "火炬开发区街道" }, { "text": "民众镇", "value": "民众镇" }, { "text": "南朗镇", "value": "南朗镇" }, { "text": "南区街道", "value": "南区街道" }, { "text": "南头镇", "value": "南头镇" }, { "text": "三角镇", "value": "三角镇" }, { "text": "三乡镇", "value": "三乡镇" }, { "text": "沙溪镇", "value": "沙溪镇" }, { "text": "神湾镇", "value": "神湾镇" }, { "text": "石岐区街道", "value": "石岐区街道" }, { "text": "坦洲镇", "value": "坦洲镇" }, { "text": "五桂山街道", "value": "五桂山街道" }, { "text": "小榄镇", "value": "小榄镇" }, { "text": "西区街道", "value": "西区街道" }], "value": "中山市" }, { "text": "珠海市", "children": [{ "text": "斗门区", "value": "斗门区" }, { "text": "金湾区", "value": "金湾区" }, { "text": "香洲区", "value": "香洲区" }], "value": "珠海市" }] }, {
                    "text": "广西壮族自治区",
                    "value": "广西壮族自治区",
                    "children": [{ "text": "百色市", "children": [{ "text": "德保县", "value": "德保县" }, { "text": "靖西市", "value": "靖西市" }, { "text": "乐业县", "value": "乐业县" }, { "text": "凌云县", "value": "凌云县" }, { "text": "隆林各族自治县", "value": "隆林各族自治县" }, { "text": "那坡县", "value": "那坡县" }, { "text": "平果县", "value": "平果县" }, { "text": "田东县", "value": "田东县" }, { "text": "田林县", "value": "田林县" }, { "text": "田阳县", "value": "田阳县" }, { "text": "西林县", "value": "西林县" }, { "text": "右江区", "value": "右江区" }], "value": "百色市" }, { "text": "北海市", "children": [{ "text": "海城区", "value": "海城区" }, { "text": "合浦县", "value": "合浦县" }, { "text": "铁山港区", "value": "铁山港区" }, { "text": "银海区", "value": "银海区" }], "value": "北海市" }, { "text": "崇左市", "children": [{ "text": "大新县", "value": "大新县" }, { "text": "扶绥县", "value": "扶绥县" }, { "text": "江州区", "value": "江州区" }, { "text": "龙州县", "value": "龙州县" }, { "text": "宁明县", "value": "宁明县" }, { "text": "凭祥市", "value": "凭祥市" }, { "text": "天等县", "value": "天等县" }], "value": "崇左市" }, { "text": "防城港市", "children": [{ "text": "东兴市", "value": "东兴市" }, { "text": "防城区", "value": "防城区" }, { "text": "港口区", "value": "港口区" }, { "text": "上思县", "value": "上思县" }], "value": "防城港市" }, { "text": "贵港市", "children": [{ "text": "港北区", "value": "港北区" }, { "text": "港南区", "value": "港南区" }, { "text": "桂平市", "value": "桂平市" }, { "text": "平南县", "value": "平南县" }, { "text": "覃塘区", "value": "覃塘区" }], "value": "贵港市" }, { "text": "桂林市", "children": [{ "text": "叠彩区", "value": "叠彩区" }, { "text": "恭城瑶族自治县", "value": "恭城瑶族自治县" }, { "text": "灌阳县", "value": "灌阳县" }, { "text": "灵川县", "value": "灵川县" }, { "text": "临桂区", "value": "临桂区" }, { "text": "荔浦市", "value": "荔浦市" }, { "text": "龙胜各族自治县", "value": "龙胜各族自治县" }, { "text": "平乐县", "value": "平乐县" }, { "text": "七星区", "value": "七星区" }, { "text": "全州县", "value": "全州县" }, { "text": "象山区", "value": "象山区" }, { "text": "兴安县", "value": "兴安县" }, { "text": "秀峰区", "value": "秀峰区" }, { "text": "阳朔县", "value": "阳朔县" }, { "text": "雁山区", "value": "雁山区" }, { "text": "永福县", "value": "永福县" }, { "text": "资源县", "value": "资源县" }], "value": "桂林市" }, {
                        "text": "河池市",
                        "children": [{ "text": "巴马瑶族自治县", "value": "巴马瑶族自治县" }, { "text": "大化瑶族自治县", "value": "大化瑶族自治县" }, { "text": "东兰县", "value": "东兰县" }, { "text": "都安瑶族自治县", "value": "都安瑶族自治县" }, { "text": "凤山县", "value": "凤山县" }, { "text": "环江毛南族自治县", "value": "环江毛南族自治县" }, { "text": "金城江区", "value": "金城江区" },
                            { "text": "罗城仫佬族自治县", "value": "罗城仫佬族自治县" }, { "text": "南丹县", "value": "南丹县" }, { "text": "天峨县", "value": "天峨县" }, { "text": "宜州区", "value": "宜州区" }
                        ],
                        "value": "河池市"
                    }, { "text": "贺州市", "children": [{ "text": "八步区", "value": "八步区" }, { "text": "富川瑶族自治县", "value": "富川瑶族自治县" }, { "text": "平桂区", "value": "平桂区" }, { "text": "昭平县", "value": "昭平县" }, { "text": "钟山县", "value": "钟山县" }], "value": "贺州市" }, { "text": "来宾市", "children": [{ "text": "合山市", "value": "合山市" }, { "text": "金秀瑶族自治县", "value": "金秀瑶族自治县" }, { "text": "武宣县", "value": "武宣县" }, { "text": "象州县", "value": "象州县" }, { "text": "忻城县", "value": "忻城县" }, { "text": "兴宾区", "value": "兴宾区" }], "value": "来宾市" }, { "text": "柳州市", "children": [{ "text": "城中区", "value": "城中区" }, { "text": "柳北区", "value": "柳北区" }, { "text": "柳城县", "value": "柳城县" }, { "text": "柳江区", "value": "柳江区" }, { "text": "柳南区", "value": "柳南区" }, { "text": "鹿寨县", "value": "鹿寨县" }, { "text": "融安县", "value": "融安县" }, { "text": "融水苗族自治县", "value": "融水苗族自治县" }, { "text": "三江侗族自治县", "value": "三江侗族自治县" }, { "text": "鱼峰区", "value": "鱼峰区" }], "value": "柳州市" }, { "text": "南宁市", "children": [{ "text": "宾阳县", "value": "宾阳县" }, { "text": "横县", "value": "横县" }, { "text": "江南区", "value": "江南区" }, { "text": "良庆区", "value": "良庆区" }, { "text": "隆安县", "value": "隆安县" }, { "text": "马山县", "value": "马山县" }, { "text": "青秀区", "value": "青秀区" }, { "text": "上林县", "value": "上林县" }, { "text": "武鸣区", "value": "武鸣区" }, { "text": "兴宁区", "value": "兴宁区" }, { "text": "西乡塘区", "value": "西乡塘区" }, { "text": "邕宁区", "value": "邕宁区" }], "value": "南宁市" }, { "text": "钦州市", "children": [{ "text": "灵山县", "value": "灵山县" }, { "text": "浦北县", "value": "浦北县" }, { "text": "钦北区", "value": "钦北区" }, { "text": "钦南区", "value": "钦南区" }], "value": "钦州市" }, { "text": "梧州市", "children": [{ "text": "苍梧县", "value": "苍梧县" }, { "text": "岑溪市", "value": "岑溪市" }, { "text": "长洲区", "value": "长洲区" }, { "text": "龙圩区", "value": "龙圩区" }, { "text": "蒙山县", "value": "蒙山县" }, { "text": "藤县", "value": "藤县" }, { "text": "万秀区", "value": "万秀区" }], "value": "梧州市" }, { "text": "玉林市", "children": [{ "text": "北流市", "value": "北流市" }, { "text": "博白县", "value": "博白县" }, { "text": "福绵区", "value": "福绵区" }, { "text": "陆川县", "value": "陆川县" }, { "text": "容县", "value": "容县" }, { "text": "兴业县", "value": "兴业县" }, { "text": "玉州区", "value": "玉州区" }], "value": "玉林市" }]
                },
                { "text": "贵州省", "value": "贵州省", "children": [{ "text": "安顺市", "children": [{ "text": "关岭布依族苗族自治县", "value": "关岭布依族苗族自治县" }, { "text": "平坝区", "value": "平坝区" }, { "text": "普定县", "value": "普定县" }, { "text": "西秀区", "value": "西秀区" }, { "text": "镇宁布依族苗族自治县", "value": "镇宁布依族苗族自治县" }, { "text": "紫云苗族布依族自治县", "value": "紫云苗族布依族自治县" }], "value": "安顺市" }, { "text": "毕节市", "children": [{ "text": "大方县", "value": "大方县" }, { "text": "赫章县", "value": "赫章县" }, { "text": "金沙县", "value": "金沙县" }, { "text": "纳雍县", "value": "纳雍县" }, { "text": "黔西县", "value": "黔西县" }, { "text": "七星关区", "value": "七星关区" }, { "text": "威宁彝族回族苗族自治县", "value": "威宁彝族回族苗族自治县" }, { "text": "织金县", "value": "织金县" }], "value": "毕节市" }, { "text": "贵阳市", "children": [{ "text": "白云区", "value": "白云区" }, { "text": "观山湖区", "value": "观山湖区" }, { "text": "花溪区", "value": "花溪区" }, { "text": "开阳县", "value": "开阳县" }, { "text": "南明区", "value": "南明区" }, { "text": "清镇市", "value": "清镇市" }, { "text": "乌当区", "value": "乌当区" }, { "text": "息烽县", "value": "息烽县" }, { "text": "修文县", "value": "修文县" }, { "text": "云岩区", "value": "云岩区" }], "value": "贵阳市" }, { "text": "六盘水市", "children": [{ "text": "六枝特区", "value": "六枝特区" }, { "text": "盘州市", "value": "盘州市" }, { "text": "水城县", "value": "水城县" }, { "text": "钟山区", "value": "钟山区" }], "value": "六盘水市" }, { "text": "黔东南苗族侗族自治州", "children": [{ "text": "岑巩县", "value": "岑巩县" }, { "text": "从江县", "value": "从江县" }, { "text": "丹寨县", "value": "丹寨县" }, { "text": "黄平县", "value": "黄平县" }, { "text": "剑河县", "value": "剑河县" }, { "text": "锦屏县", "value": "锦屏县" }, { "text": "凯里市", "value": "凯里市" }, { "text": "雷山县", "value": "雷山县" }, { "text": "黎平县", "value": "黎平县" }, { "text": "麻江县", "value": "麻江县" }, { "text": "榕江县", "value": "榕江县" }, { "text": "三穗县", "value": "三穗县" }, { "text": "施秉县", "value": "施秉县" }, { "text": "台江县", "value": "台江县" }, { "text": "天柱县", "value": "天柱县" }, { "text": "镇远县", "value": "镇远县" }], "value": "黔东南苗族侗族自治州" }, { "text": "黔南布依族苗族自治州", "children": [{ "text": "长顺县", "value": "长顺县" }, { "text": "独山县", "value": "独山县" }, { "text": "都匀市", "value": "都匀市" }, { "text": "福泉市", "value": "福泉市" }, { "text": "贵定县", "value": "贵定县" }, { "text": "惠水县", "value": "惠水县" }, { "text": "荔波县", "value": "荔波县" }, { "text": "龙里县", "value": "龙里县" }, { "text": "罗甸县", "value": "罗甸县" }, { "text": "平塘县", "value": "平塘县" }, { "text": "三都水族自治县", "value": "三都水族自治县" }, { "text": "瓮安县", "value": "瓮安县" }], "value": "黔南布依族苗族自治州" }, { "text": "黔西南布依族苗族自治州", "children": [{ "text": "安龙县", "value": "安龙县" }, { "text": "册亨县", "value": "册亨县" }, { "text": "普安县", "value": "普安县" }, { "text": "晴隆县", "value": "晴隆县" }, { "text": "望谟县", "value": "望谟县" }, { "text": "兴仁市", "value": "兴仁市" }, { "text": "兴义市", "value": "兴义市" }, { "text": "贞丰县", "value": "贞丰县" }], "value": "黔西南布依族苗族自治州" }, { "text": "铜仁市", "children": [{ "text": "碧江区", "value": "碧江区" }, { "text": "德江县", "value": "德江县" }, { "text": "江口县", "value": "江口县" }, { "text": "石阡县", "value": "石阡县" }, { "text": "思南县", "value": "思南县" }, { "text": "松桃苗族自治县", "value": "松桃苗族自治县" }, { "text": "万山区", "value": "万山区" }, { "text": "沿河土家族自治县", "value": "沿河土家族自治县" }, { "text": "印江土家族苗族自治县", "value": "印江土家族苗族自治县" }, { "text": "玉屏侗族自治县", "value": "玉屏侗族自治县" }], "value": "铜仁市" }, { "text": "遵义市", "children": [{ "text": "播州区", "value": "播州区" }, { "text": "赤水市", "value": "赤水市" }, { "text": "道真仡佬族苗族自治县", "value": "道真仡佬族苗族自治县" }, { "text": "凤冈县", "value": "凤冈县" }, { "text": "红花岗区", "value": "红花岗区" }, { "text": "汇川区", "value": "汇川区" }, { "text": "湄潭县", "value": "湄潭县" }, { "text": "仁怀市", "value": "仁怀市" }, { "text": "绥阳县", "value": "绥阳县" }, { "text": "桐梓县", "value": "桐梓县" }, { "text": "务川仡佬族苗族自治县", "value": "务川仡佬族苗族自治县" }, { "text": "习水县", "value": "习水县" }, { "text": "余庆县", "value": "余庆县" }, { "text": "正安县", "value": "正安县" }], "value": "遵义市" }] },
                { "text": "海南省", "value": "海南省", "children": [{ "text": "白沙黎族自治县", "children": [{ "text": "邦溪镇", "value": "邦溪镇" }, { "text": "打安镇", "value": "打安镇" }, { "text": "阜龙乡", "value": "阜龙乡" }, { "text": "国营白沙农场", "value": "国营白沙农场" }, { "text": "国营邦溪农场", "value": "国营邦溪农场" }, { "text": "国营龙江农场", "value": "国营龙江农场" }, { "text": "金波乡", "value": "金波乡" }, { "text": "南开乡", "value": "南开乡" }, { "text": "七坊镇", "value": "七坊镇" }, { "text": "青松乡", "value": "青松乡" }, { "text": "荣邦乡", "value": "荣邦乡" }, { "text": "细水乡", "value": "细水乡" }, { "text": "牙叉镇", "value": "牙叉镇" }, { "text": "元门乡", "value": "元门乡" }], "value": "白沙黎族自治县" }, { "text": "保亭黎族苗族自治县", "children": [{ "text": "保城镇", "value": "保城镇" }, { "text": "国营金江农场", "value": "国营金江农场" }, { "text": "国营三道农场", "value": "国营三道农场" }, { "text": "国营新星农场", "value": "国营新星农场" }, { "text": "海南保亭热带作物研究所", "value": "海南保亭热带作物研究所" }, { "text": "加茂镇", "value": "加茂镇" }, { "text": "六弓乡", "value": "六弓乡" }, { "text": "毛感乡", "value": "毛感乡" }, { "text": "南林乡", "value": "南林乡" }, { "text": "三道镇", "value": "三道镇" }, { "text": "什玲镇", "value": "什玲镇" }, { "text": "响水镇", "value": "响水镇" }, { "text": "新政镇", "value": "新政镇" }], "value": "保亭黎族苗族自治县" }, { "text": "昌江黎族自治县", "children": [{ "text": "叉河镇", "value": "叉河镇" }, { "text": "昌化镇", "value": "昌化镇" }, { "text": "国营霸王岭林场", "value": "国营霸王岭林场" }, { "text": "国营红林农场", "value": "国营红林农场" }, { "text": "海南矿业联合有限公司", "value": "海南矿业联合有限公司" }, { "text": "海尾镇", "value": "海尾镇" }, { "text": "七叉镇", "value": "七叉镇" }, { "text": "石碌镇", "value": "石碌镇" }, { "text": "十月田镇", "value": "十月田镇" }, { "text": "王下乡", "value": "王下乡" }, { "text": "乌烈镇", "value": "乌烈镇" }], "value": "昌江黎族自治县" }, { "text": "澄迈县", "children": [{ "text": "大丰镇", "value": "大丰镇" }, { "text": "福山镇", "value": "福山镇" }, { "text": "国营和岭农场", "value": "国营和岭农场" }, { "text": "国营红岗农场", "value": "国营红岗农场" }, { "text": "国营红光农场", "value": "国营红光农场" }, { "text": "国营金安农场", "value": "国营金安农场" }, { "text": "国营昆仑农场", "value": "国营昆仑农场" }, { "text": "国营西达农场", "value": "国营西达农场" }, { "text": "加乐镇", "value": "加乐镇" }, { "text": "金江镇", "value": "金江镇" }, { "text": "老城镇", "value": "老城镇" }, { "text": "桥头镇", "value": "桥头镇" }, { "text": "仁兴镇", "value": "仁兴镇" }, { "text": "瑞溪镇", "value": "瑞溪镇" }, { "text": "文儒镇", "value": "文儒镇" }, { "text": "永发镇", "value": "永发镇" }, { "text": "中兴镇", "value": "中兴镇" }], "value": "澄迈县" }, { "text": "儋州市", "children": [{ "text": "白马井镇", "value": "白马井镇" }, { "text": "大成镇", "value": "大成镇" }, { "text": "东成镇", "value": "东成镇" }, { "text": "峨蔓镇", "value": "峨蔓镇" }, { "text": "光村镇", "value": "光村镇" }, { "text": "国营八一农场", "value": "国营八一农场" }, { "text": "国营蓝洋农场", "value": "国营蓝洋农场" }, { "text": "国营西联农场", "value": "国营西联农场" }, { "text": "国营西培农场", "value": "国营西培农场" }, { "text": "海头镇", "value": "海头镇" }, { "text": "和庆镇", "value": "和庆镇" }, { "text": "华南热作学院", "value": "华南热作学院" }, { "text": "兰洋镇", "value": "兰洋镇" }, { "text": "木棠镇", "value": "木棠镇" }, { "text": "那大镇", "value": "那大镇" }, { "text": "南丰镇", "value": "南丰镇" }, { "text": "排浦镇", "value": "排浦镇" }, { "text": "三都镇", "value": "三都镇" }, { "text": "王五镇", "value": "王五镇" }, { "text": "新州镇", "value": "新州镇" }, { "text": "洋浦经济开发区", "value": "洋浦经济开发区" }, { "text": "雅星镇", "value": "雅星镇" }, { "text": "中和镇", "value": "中和镇" }], "value": "儋州市" }, { "text": "定安县", "children": [{ "text": "定城镇", "value": "定城镇" }, { "text": "富文镇", "value": "富文镇" }, { "text": "国营金鸡岭农场", "value": "国营金鸡岭农场" }, { "text": "国营南海农场", "value": "国营南海农场" }, { "text": "国营中瑞农场", "value": "国营中瑞农场" }, { "text": "翰林镇", "value": "翰林镇" }, { "text": "黄竹镇", "value": "黄竹镇" }, { "text": "雷鸣镇", "value": "雷鸣镇" }, { "text": "岭口镇", "value": "岭口镇" }, { "text": "龙河镇", "value": "龙河镇" }, { "text": "龙湖镇", "value": "龙湖镇" }, { "text": "龙门镇", "value": "龙门镇" }, { "text": "新竹镇", "value": "新竹镇" }], "value": "定安县" }, { "text": "东方市", "children": [{ "text": "板桥镇", "value": "板桥镇" }, { "text": "八所镇", "value": "八所镇" }, { "text": "大田镇", "value": "大田镇" }, { "text": "东方华侨农场", "value": "东方华侨农场" }, { "text": "东河镇", "value": "东河镇" }, { "text": "感城镇", "value": "感城镇" }, { "text": "国营广坝农场", "value": "国营广坝农场" }, { "text": "江边乡", "value": "江边乡" }, { "text": "三家镇", "value": "三家镇" }, { "text": "四更镇", "value": "四更镇" }, { "text": "天安乡", "value": "天安乡" }, { "text": "新龙镇", "value": "新龙镇" }], "value": "东方市" }, { "text": "海口市", "children": [{ "text": "龙华区", "value": "龙华区" }, { "text": "美兰区", "value": "美兰区" }, { "text": "琼山区", "value": "琼山区" }, { "text": "秀英区", "value": "秀英区" }], "value": "海口市" }, { "text": "乐东黎族自治县", "children": [{ "text": "抱由镇", "value": "抱由镇" }, { "text": "大安镇", "value": "大安镇" }, { "text": "佛罗镇", "value": "佛罗镇" }, { "text": "国营保国农场", "value": "国营保国农场" }, { "text": "国营尖峰岭林业公司", "value": "国营尖峰岭林业公司" }, { "text": "国营乐光农场", "value": "国营乐光农场" }, { "text": "国营山荣农场", "value": "国营山荣农场" }, { "text": "国营莺歌海盐场", "value": "国营莺歌海盐场" }, { "text": "黄流镇", "value": "黄流镇" }, { "text": "尖峰镇", "value": "尖峰镇" }, { "text": "九所镇", "value": "九所镇" }, { "text": "利国镇", "value": "利国镇" }, { "text": "千家镇", "value": "千家镇" }, { "text": "万冲镇", "value": "万冲镇" }, { "text": "莺歌海镇", "value": "莺歌海镇" }, { "text": "志仲镇", "value": "志仲镇" }], "value": "乐东黎族自治县" }, { "text": "临高县", "children": [{ "text": "博厚镇", "value": "博厚镇" }, { "text": "波莲镇", "value": "波莲镇" }, { "text": "调楼镇", "value": "调楼镇" }, { "text": "东英镇", "value": "东英镇" }, { "text": "多文镇", "value": "多文镇" }, { "text": "国营红华农场", "value": "国营红华农场" }, { "text": "国营加来农场", "value": "国营加来农场" }, { "text": "和舍镇", "value": "和舍镇" }, { "text": "皇桐镇", "value": "皇桐镇" }, { "text": "临城镇", "value": "临城镇" }, { "text": "南宝镇", "value": "南宝镇" }, { "text": "新盈镇", "value": "新盈镇" }], "value": "临高县" }, { "text": "陵水黎族自治县", "children": [{ "text": "本号镇", "value": "本号镇" }, { "text": "光坡镇", "value": "光坡镇" }, { "text": "国营吊罗山林业公司", "value": "国营吊罗山林业公司" }, { "text": "国营岭门农场", "value": "国营岭门农场" }, { "text": "国营南平农场", "value": "国营南平农场" }, { "text": "黎安镇", "value": "黎安镇" }, { "text": "隆广镇", "value": "隆广镇" }, { "text": "群英乡", "value": "群英乡" }, { "text": "三才镇", "value": "三才镇" }, { "text": "提蒙乡", "value": "提蒙乡" }, { "text": "文罗镇", "value": "文罗镇" }, { "text": "新村镇", "value": "新村镇" }, { "text": "椰林镇", "value": "椰林镇" }, { "text": "英州镇", "value": "英州镇" }], "value": "陵水黎族自治县" }, { "text": "琼海市", "children": [{ "text": "彬村山华侨农场", "value": "彬村山华侨农场" }, { "text": "博鳌镇", "value": "博鳌镇" }, { "text": "长坡镇", "value": "长坡镇" }, { "text": "大路镇", "value": "大路镇" }, { "text": "国营东红农场", "value": "国营东红农场" }, { "text": "国营东升农场", "value": "国营东升农场" }, { "text": "国营东太农场", "value": "国营东太农场" }, { "text": "会山镇", "value": "会山镇" }, { "text": "嘉积镇", "value": "嘉积镇" }, { "text": "龙江镇", "value": "龙江镇" }, { "text": "石壁镇", "value": "石壁镇" }, { "text": "潭门镇", "value": "潭门镇" }, { "text": "塔洋镇", "value": "塔洋镇" }, { "text": "万泉镇", "value": "万泉镇" }, { "text": "阳江镇", "value": "阳江镇" }, { "text": "中原镇", "value": "中原镇" }], "value": "琼海市" }, { "text": "琼中黎族苗族自治县", "children": [{ "text": "长征镇", "value": "长征镇" }, { "text": "吊罗山乡", "value": "吊罗山乡" }, { "text": "国营长征农场", "value": "国营长征农场" }, { "text": "国营加钗农场", "value": "国营加钗农场" }, { "text": "国营黎母山林业公司", "value": "国营黎母山林业公司" }, { "text": "国营乌石农场", "value": "国营乌石农场" }, { "text": "国营阳江农场", "value": "国营阳江农场" }, { "text": "和平镇", "value": "和平镇" }, { "text": "红毛镇", "value": "红毛镇" }, { "text": "黎母山镇", "value": "黎母山镇" }, { "text": "上安乡", "value": "上安乡" }, { "text": "什运乡", "value": "什运乡" }, { "text": "湾岭镇", "value": "湾岭镇" }, { "text": "营根镇", "value": "营根镇" }, { "text": "中平镇", "value": "中平镇" }], "value": "琼中黎族苗族自治县" }, { "text": "三沙市", "children": [{ "text": "南沙群岛", "value": "南沙群岛" }, { "text": "西沙群岛", "value": "西沙群岛" }, { "text": "中沙群岛的岛礁及其海域", "value": "中沙群岛的岛礁及其海域" }], "value": "三沙市" }, { "text": "三亚市", "children": [{ "text": "海棠区", "value": "海棠区" }, { "text": "吉阳区", "value": "吉阳区" }, { "text": "天涯区", "value": "天涯区" }, { "text": "崖州区", "value": "崖州区" }], "value": "三亚市" }, { "text": "屯昌县", "children": [{ "text": "枫木镇", "value": "枫木镇" }, { "text": "国营中建农场", "value": "国营中建农场" }, { "text": "国营中坤农场", "value": "国营中坤农场" }, { "text": "南坤镇", "value": "南坤镇" }, { "text": "南吕镇", "value": "南吕镇" }, { "text": "坡心镇", "value": "坡心镇" }, { "text": "屯城镇", "value": "屯城镇" }, { "text": "乌坡镇", "value": "乌坡镇" }, { "text": "西昌镇", "value": "西昌镇" }, { "text": "新兴镇", "value": "新兴镇" }], "value": "屯昌县" }, { "text": "万宁市", "children": [{ "text": "北大镇", "value": "北大镇" }, { "text": "长丰镇", "value": "长丰镇" }, { "text": "大茂镇", "value": "大茂镇" }, { "text": "地方国营六连林场", "value": "地方国营六连林场" }, { "text": "东澳镇", "value": "东澳镇" }, { "text": "国营东和农场", "value": "国营东和农场" }, { "text": "国营东兴农场", "value": "国营东兴农场" }, { "text": "国营新中农场", "value": "国营新中农场" }, { "text": "和乐镇", "value": "和乐镇" }, { "text": "后安镇", "value": "后安镇" }, { "text": "礼纪镇", "value": "礼纪镇" }, { "text": "龙滚镇", "value": "龙滚镇" }, { "text": "南桥镇", "value": "南桥镇" }, { "text": "三更罗镇", "value": "三更罗镇" }, { "text": "山根镇", "value": "山根镇" }, { "text": "万城镇", "value": "万城镇" }, { "text": "兴隆华侨农场", "value": "兴隆华侨农场" }], "value": "万宁市" }, { "text": "文昌市", "children": [{ "text": "抱罗镇", "value": "抱罗镇" }, { "text": "昌洒镇", "value": "昌洒镇" }, { "text": "东阁镇", "value": "东阁镇" }, { "text": "东郊镇", "value": "东郊镇" }, { "text": "东路镇", "value": "东路镇" }, { "text": "冯坡镇", "value": "冯坡镇" }, { "text": "公坡镇", "value": "公坡镇" }, { "text": "国营东路农场", "value": "国营东路农场" }, { "text": "国营罗豆农场", "value": "国营罗豆农场" }, { "text": "国营南阳农场", "value": "国营南阳农场" }, { "text": "会文镇", "value": "会文镇" }, { "text": "锦山镇", "value": "锦山镇" }, { "text": "龙楼镇", "value": "龙楼镇" }, { "text": "蓬莱镇", "value": "蓬莱镇" }, { "text": "铺前镇", "value": "铺前镇" }, { "text": "潭牛镇", "value": "潭牛镇" }, { "text": "文城镇", "value": "文城镇" }, { "text": "翁田镇", "value": "翁田镇" }, { "text": "文教镇", "value": "文教镇" }, { "text": "重兴镇", "value": "重兴镇" }], "value": "文昌市" }, { "text": "五指山市", "children": [{ "text": "畅好乡", "value": "畅好乡" }, { "text": "番阳镇", "value": "番阳镇" }, { "text": "国营畅好农场", "value": "国营畅好农场" }, { "text": "毛道乡", "value": "毛道乡" }, { "text": "毛阳镇", "value": "毛阳镇" }, { "text": "南圣镇", "value": "南圣镇" }, { "text": "水满乡", "value": "水满乡" }, { "text": "通什镇", "value": "通什镇" }], "value": "五指山市" }] },
                { "text": "河北省", "value": "河北省", "children": [{ "text": "保定市", "children": [{ "text": "安国市", "value": "安国市" }, { "text": "安新县", "value": "安新县" }, { "text": "博野县", "value": "博野县" }, { "text": "定兴县", "value": "定兴县" }, { "text": "定州市", "value": "定州市" }, { "text": "阜平县", "value": "阜平县" }, { "text": "高碑店市", "value": "高碑店市" }, { "text": "高阳县", "value": "高阳县" }, { "text": "竞秀区", "value": "竞秀区" }, { "text": "涞水县", "value": "涞水县" }, { "text": "涞源县", "value": "涞源县" }, { "text": "莲池区", "value": "莲池区" }, { "text": "蠡县", "value": "蠡县" }, { "text": "满城区", "value": "满城区" }, { "text": "清苑区", "value": "清苑区" }, { "text": "曲阳县", "value": "曲阳县" }, { "text": "容城县", "value": "容城县" }, { "text": "顺平县", "value": "顺平县" }, { "text": "唐县", "value": "唐县" }, { "text": "望都县", "value": "望都县" }, { "text": "雄县", "value": "雄县" }, { "text": "徐水区", "value": "徐水区" }, { "text": "易县", "value": "易县" }, { "text": "涿州市", "value": "涿州市" }], "value": "保定市" }, { "text": "沧州市", "children": [{ "text": "泊头市", "value": "泊头市" }, { "text": "沧县", "value": "沧县" }, { "text": "东光县", "value": "东光县" }, { "text": "海兴县", "value": "海兴县" }, { "text": "河间市", "value": "河间市" }, { "text": "黄骅市", "value": "黄骅市" }, { "text": "孟村回族自治县", "value": "孟村回族自治县" }, { "text": "南皮县", "value": "南皮县" }, { "text": "青县", "value": "青县" }, { "text": "任丘市", "value": "任丘市" }, { "text": "肃宁县", "value": "肃宁县" }, { "text": "吴桥县", "value": "吴桥县" }, { "text": "献县", "value": "献县" }, { "text": "新华区", "value": "新华区" }, { "text": "盐山县", "value": "盐山县" }, { "text": "运河区", "value": "运河区" }], "value": "沧州市" }, { "text": "承德市", "children": [{ "text": "承德县", "value": "承德县" }, { "text": "丰宁满族自治县", "value": "丰宁满族自治县" }, { "text": "宽城满族自治县", "value": "宽城满族自治县" }, { "text": "隆化县", "value": "隆化县" }, { "text": "滦平县", "value": "滦平县" }, { "text": "平泉市", "value": "平泉市" }, { "text": "双滦区", "value": "双滦区" }, { "text": "双桥区", "value": "双桥区" }, { "text": "围场满族蒙古族自治县", "value": "围场满族蒙古族自治县" }, { "text": "兴隆县", "value": "兴隆县" }, { "text": "鹰手营子矿区", "value": "鹰手营子矿区" }], "value": "承德市" }, { "text": "邯郸市", "children": [{ "text": "成安县", "value": "成安县" }, { "text": "磁县", "value": "磁县" }, { "text": "丛台区", "value": "丛台区" }, { "text": "大名县", "value": "大名县" }, { "text": "肥乡区", "value": "肥乡区" }, { "text": "峰峰矿区", "value": "峰峰矿区" }, { "text": "复兴区", "value": "复兴区" }, { "text": "广平县", "value": "广平县" }, { "text": "馆陶县", "value": "馆陶县" }, { "text": "邯山区", "value": "邯山区" }, { "text": "鸡泽县", "value": "鸡泽县" }, { "text": "临漳县", "value": "临漳县" }, { "text": "邱县", "value": "邱县" }, { "text": "曲周县", "value": "曲周县" }, { "text": "涉县", "value": "涉县" }, { "text": "魏县", "value": "魏县" }, { "text": "武安市", "value": "武安市" }, { "text": "永年区", "value": "永年区" }], "value": "邯郸市" }, { "text": "衡水市", "children": [{ "text": "安平县", "value": "安平县" }, { "text": "阜城县", "value": "阜城县" }, { "text": "故城县", "value": "故城县" }, { "text": "景县", "value": "景县" }, { "text": "冀州区", "value": "冀州区" }, { "text": "饶阳县", "value": "饶阳县" }, { "text": "深州市", "value": "深州市" }, { "text": "桃城区", "value": "桃城区" }, { "text": "武强县", "value": "武强县" }, { "text": "武邑县", "value": "武邑县" }, { "text": "枣强县", "value": "枣强县" }], "value": "衡水市" }, { "text": "廊坊市", "children": [{ "text": "安次区", "value": "安次区" }, { "text": "霸州市", "value": "霸州市" }, { "text": "大厂回族自治县", "value": "大厂回族自治县" }, { "text": "大城县", "value": "大城县" }, { "text": "广阳区", "value": "广阳区" }, { "text": "固安县", "value": "固安县" }, { "text": "三河市", "value": "三河市" }, { "text": "文安县", "value": "文安县" }, { "text": "香河县", "value": "香河县" }, { "text": "永清县", "value": "永清县" }], "value": "廊坊市" }, { "text": "秦皇岛市", "children": [{ "text": "北戴河区", "value": "北戴河区" }, { "text": "昌黎县", "value": "昌黎县" }, { "text": "抚宁区", "value": "抚宁区" }, { "text": "海港区", "value": "海港区" }, { "text": "卢龙县", "value": "卢龙县" }, { "text": "青龙满族自治县", "value": "青龙满族自治县" }, { "text": "山海关区", "value": "山海关区" }], "value": "秦皇岛市" }, { "text": "石家庄市", "children": [{ "text": "长安区", "value": "长安区" }, { "text": "藁城区", "value": "藁城区" }, { "text": "高邑县", "value": "高邑县" }, { "text": "井陉矿区", "value": "井陉矿区" }, { "text": "井陉县", "value": "井陉县" }, { "text": "晋州市", "value": "晋州市" }, { "text": "灵寿县", "value": "灵寿县" }, { "text": "栾城区", "value": "栾城区" }, { "text": "鹿泉区", "value": "鹿泉区" }, { "text": "平山县", "value": "平山县" }, { "text": "桥西区", "value": "桥西区" }, { "text": "深泽县", "value": "深泽县" }, { "text": "无极县", "value": "无极县" }, { "text": "行唐县", "value": "行唐县" }, { "text": "新华区", "value": "新华区" }, { "text": "辛集市", "value": "辛集市" }, { "text": "新乐市", "value": "新乐市" }, { "text": "元氏县", "value": "元氏县" }, { "text": "裕华区", "value": "裕华区" }, { "text": "赞皇县", "value": "赞皇县" }, { "text": "赵县", "value": "赵县" }, { "text": "正定县", "value": "正定县" }], "value": "石家庄市" }, { "text": "唐山市", "children": [{ "text": "曹妃甸区", "value": "曹妃甸区" }, { "text": "丰南区", "value": "丰南区" }, { "text": "丰润区", "value": "丰润区" }, { "text": "古冶区", "value": "古冶区" }, { "text": "开平区", "value": "开平区" }, { "text": "乐亭县", "value": "乐亭县" }, { "text": "滦南县", "value": "滦南县" }, { "text": "滦州市", "value": "滦州市" }, { "text": "路北区", "value": "路北区" }, { "text": "路南区", "value": "路南区" }, { "text": "迁安市", "value": "迁安市" }, { "text": "迁西县", "value": "迁西县" }, { "text": "玉田县", "value": "玉田县" }, { "text": "遵化市", "value": "遵化市" }], "value": "唐山市" }, { "text": "邢台市", "children": [{ "text": "柏乡县", "value": "柏乡县" }, { "text": "广宗县", "value": "广宗县" }, { "text": "巨鹿县", "value": "巨鹿县" }, { "text": "临城县", "value": "临城县" }, { "text": "临西县", "value": "临西县" }, { "text": "隆尧县", "value": "隆尧县" }, { "text": "南宫市", "value": "南宫市" }, { "text": "南和县", "value": "南和县" }, { "text": "内丘县", "value": "内丘县" }, { "text": "宁晋县", "value": "宁晋县" }, { "text": "平乡县", "value": "平乡县" }, { "text": "桥东区", "value": "桥东区" }, { "text": "桥西区", "value": "桥西区" }, { "text": "清河县", "value": "清河县" }, { "text": "任县", "value": "任县" }, { "text": "沙河市", "value": "沙河市" }, { "text": "威县", "value": "威县" }, { "text": "邢台县", "value": "邢台县" }, { "text": "新河县", "value": "新河县" }], "value": "邢台市" }, { "text": "张家口市", "children": [{ "text": "赤城县", "value": "赤城县" }, { "text": "崇礼区", "value": "崇礼区" }, { "text": "沽源县", "value": "沽源县" }, { "text": "怀安县", "value": "怀安县" }, { "text": "怀来县", "value": "怀来县" }, { "text": "康保县", "value": "康保县" }, { "text": "桥东区", "value": "桥东区" }, { "text": "桥西区", "value": "桥西区" }, { "text": "尚义县", "value": "尚义县" }, { "text": "万全区", "value": "万全区" }, { "text": "蔚县", "value": "蔚县" }, { "text": "下花园区", "value": "下花园区" }, { "text": "宣化区", "value": "宣化区" }, { "text": "阳原县", "value": "阳原县" }, { "text": "张北县", "value": "张北县" }, { "text": "涿鹿县", "value": "涿鹿县" }], "value": "张家口市" }] },
                { "text": "黑龙江省", "value": "黑龙江省", "children": [{ "text": "大庆市", "children": [{ "text": "大同区", "value": "大同区" }, { "text": "杜尔伯特蒙古族自治县", "value": "杜尔伯特蒙古族自治县" }, { "text": "红岗区", "value": "红岗区" }, { "text": "林甸县", "value": "林甸县" }, { "text": "龙凤区", "value": "龙凤区" }, { "text": "让胡路区", "value": "让胡路区" }, { "text": "萨尔图区", "value": "萨尔图区" }, { "text": "肇源县", "value": "肇源县" }, { "text": "肇州县", "value": "肇州县" }], "value": "大庆市" }, { "text": "大兴安岭地区", "children": [{ "text": "呼玛县", "value": "呼玛县" }, { "text": "加格达奇区", "value": "加格达奇区" }, { "text": "漠河市", "value": "漠河市" }, { "text": "塔河县", "value": "塔河县" }], "value": "大兴安岭地区" }, { "text": "哈尔滨市", "children": [{ "text": "阿城区", "value": "阿城区" }, { "text": "巴彦县", "value": "巴彦县" }, { "text": "宾县", "value": "宾县" }, { "text": "道里区", "value": "道里区" }, { "text": "道外区", "value": "道外区" }, { "text": "方正县", "value": "方正县" }, { "text": "呼兰区", "value": "呼兰区" }, { "text": "木兰县", "value": "木兰县" }, { "text": "南岗区", "value": "南岗区" }, { "text": "平房区", "value": "平房区" }, { "text": "尚志市", "value": "尚志市" }, { "text": "双城区", "value": "双城区" }, { "text": "松北区", "value": "松北区" }, { "text": "通河县", "value": "通河县" }, { "text": "五常市", "value": "五常市" }, { "text": "香坊区", "value": "香坊区" }, { "text": "延寿县", "value": "延寿县" }, { "text": "依兰县", "value": "依兰县" }], "value": "哈尔滨市" }, { "text": "鹤岗市", "children": [{ "text": "东山区", "value": "东山区" }, { "text": "工农区", "value": "工农区" }, { "text": "萝北县", "value": "萝北县" }, { "text": "南山区", "value": "南山区" }, { "text": "绥滨县", "value": "绥滨县" }, { "text": "向阳区", "value": "向阳区" }, { "text": "兴安区", "value": "兴安区" }, { "text": "兴山区", "value": "兴山区" }], "value": "鹤岗市" }, { "text": "黑河市", "children": [{ "text": "爱辉区", "value": "爱辉区" }, { "text": "北安市", "value": "北安市" }, { "text": "嫩江县", "value": "嫩江县" }, { "text": "孙吴县", "value": "孙吴县" }, { "text": "五大连池市", "value": "五大连池市" }, { "text": "逊克县", "value": "逊克县" }], "value": "黑河市" }, { "text": "佳木斯市", "children": [{ "text": "东风区", "value": "东风区" }, { "text": "富锦市", "value": "富锦市" }, { "text": "抚远市", "value": "抚远市" }, { "text": "桦川县", "value": "桦川县" }, { "text": "桦南县", "value": "桦南县" }, { "text": "郊区", "value": "郊区" }, { "text": "前进区", "value": "前进区" }, { "text": "汤原县", "value": "汤原县" }, { "text": "同江市", "value": "同江市" }, { "text": "向阳区", "value": "向阳区" }], "value": "佳木斯市" }, { "text": "鸡西市", "children": [{ "text": "城子河区", "value": "城子河区" }, { "text": "滴道区", "value": "滴道区" }, { "text": "恒山区", "value": "恒山区" }, { "text": "虎林市", "value": "虎林市" }, { "text": "鸡东县", "value": "鸡东县" }, { "text": "鸡冠区", "value": "鸡冠区" }, { "text": "梨树区", "value": "梨树区" }, { "text": "麻山区", "value": "麻山区" }, { "text": "密山市", "value": "密山市" }], "value": "鸡西市" }, { "text": "牡丹江市", "children": [{ "text": "爱民区", "value": "爱民区" }, { "text": "东安区", "value": "东安区" }, { "text": "东宁市", "value": "东宁市" }, { "text": "海林市", "value": "海林市" }, { "text": "林口县", "value": "林口县" }, { "text": "穆棱市", "value": "穆棱市" }, { "text": "宁安市", "value": "宁安市" }, { "text": "绥芬河市", "value": "绥芬河市" }, { "text": "西安区", "value": "西安区" }, { "text": "阳明区", "value": "阳明区" }], "value": "牡丹江市" }, { "text": "齐齐哈尔市", "children": [{ "text": "昂昂溪区", "value": "昂昂溪区" }, { "text": "拜泉县", "value": "拜泉县" }, { "text": "富拉尔基区", "value": "富拉尔基区" }, { "text": "富裕县", "value": "富裕县" }, { "text": "甘南县", "value": "甘南县" }, { "text": "建华区", "value": "建华区" }, { "text": "克东县", "value": "克东县" }, { "text": "克山县", "value": "克山县" }, { "text": "龙江县", "value": "龙江县" }, { "text": "龙沙区", "value": "龙沙区" }, { "text": "梅里斯达斡尔族区", "value": "梅里斯达斡尔族区" }, { "text": "讷河市", "value": "讷河市" }, { "text": "碾子山区", "value": "碾子山区" }, { "text": "泰来县", "value": "泰来县" }, { "text": "铁锋区", "value": "铁锋区" }, { "text": "依安县", "value": "依安县" }], "value": "齐齐哈尔市" }, { "text": "七台河市", "children": [{ "text": "勃利县", "value": "勃利县" }, { "text": "茄子河区", "value": "茄子河区" }, { "text": "桃山区", "value": "桃山区" }, { "text": "新兴区", "value": "新兴区" }], "value": "七台河市" }, { "text": "双鸭山市", "children": [{ "text": "宝清县", "value": "宝清县" }, { "text": "宝山区", "value": "宝山区" }, { "text": "尖山区", "value": "尖山区" }, { "text": "集贤县", "value": "集贤县" }, { "text": "岭东区", "value": "岭东区" }, { "text": "饶河县", "value": "饶河县" }, { "text": "四方台区", "value": "四方台区" }, { "text": "友谊县", "value": "友谊县" }], "value": "双鸭山市" }, { "text": "绥化市", "children": [{ "text": "安达市", "value": "安达市" }, { "text": "北林区", "value": "北林区" }, { "text": "海伦市", "value": "海伦市" }, { "text": "兰西县", "value": "兰西县" }, { "text": "明水县", "value": "明水县" }, { "text": "庆安县", "value": "庆安县" }, { "text": "青冈县", "value": "青冈县" }, { "text": "绥棱县", "value": "绥棱县" }, { "text": "望奎县", "value": "望奎县" }, { "text": "肇东市", "value": "肇东市" }], "value": "绥化市" }, { "text": "伊春市", "children": [{ "text": "翠峦区", "value": "翠峦区" }, { "text": "带岭区", "value": "带岭区" }, { "text": "红星区", "value": "红星区" }, { "text": "嘉荫县", "value": "嘉荫县" }, { "text": "金山屯区", "value": "金山屯区" }, { "text": "美溪区", "value": "美溪区" }, { "text": "南岔区", "value": "南岔区" }, { "text": "上甘岭区", "value": "上甘岭区" }, { "text": "汤旺河区", "value": "汤旺河区" }, { "text": "铁力市", "value": "铁力市" }, { "text": "乌马河区", "value": "乌马河区" }, { "text": "乌伊岭区", "value": "乌伊岭区" }, { "text": "五营区", "value": "五营区" }, { "text": "西林区", "value": "西林区" }, { "text": "新青区", "value": "新青区" }, { "text": "伊春区", "value": "伊春区" }, { "text": "友好区", "value": "友好区" }], "value": "伊春市" }] },
                { "text": "河南省", "value": "河南省", "children": [{ "text": "安阳市", "children": [{ "text": "安阳县", "value": "安阳县" }, { "text": "北关区", "value": "北关区" }, { "text": "滑县", "value": "滑县" }, { "text": "林州市", "value": "林州市" }, { "text": "龙安区", "value": "龙安区" }, { "text": "内黄县", "value": "内黄县" }, { "text": "汤阴县", "value": "汤阴县" }, { "text": "文峰区", "value": "文峰区" }, { "text": "殷都区", "value": "殷都区" }], "value": "安阳市" }, { "text": "鹤壁市", "children": [{ "text": "鹤山区", "value": "鹤山区" }, { "text": "浚县", "value": "浚县" }, { "text": "淇滨区", "value": "淇滨区" }, { "text": "淇县", "value": "淇县" }, { "text": "山城区", "value": "山城区" }], "value": "鹤壁市" }, { "text": "焦作市", "children": [{ "text": "博爱县", "value": "博爱县" }, { "text": "解放区", "value": "解放区" }, { "text": "马村区", "value": "马村区" }, { "text": "孟州市", "value": "孟州市" }, { "text": "沁阳市", "value": "沁阳市" }, { "text": "山阳区", "value": "山阳区" }, { "text": "温县", "value": "温县" }, { "text": "武陟县", "value": "武陟县" }, { "text": "修武县", "value": "修武县" }, { "text": "中站区", "value": "中站区" }], "value": "焦作市" }, { "text": "济源市", "children": [{ "text": "济源市北海街道", "value": "济源市北海街道" }, { "text": "济源市承留镇", "value": "济源市承留镇" }, { "text": "济源市大峪镇", "value": "济源市大峪镇" }, { "text": "济源市济水街道", "value": "济源市济水街道" }, { "text": "济源市克井镇", "value": "济源市克井镇" }, { "text": "济源市梨林镇", "value": "济源市梨林镇" }, { "text": "济源市坡头镇", "value": "济源市坡头镇" }, { "text": "济源市沁园街道", "value": "济源市沁园街道" }, { "text": "济源市邵原镇", "value": "济源市邵原镇" }, { "text": "济源市思礼镇", "value": "济源市思礼镇" }, { "text": "济源市天坛街道", "value": "济源市天坛街道" }, { "text": "济源市王屋镇", "value": "济源市王屋镇" }, { "text": "济源市五龙口镇", "value": "济源市五龙口镇" }, { "text": "济源市下冶镇", "value": "济源市下冶镇" }, { "text": "济源市玉泉街道", "value": "济源市玉泉街道" }, { "text": "济源市轵城镇", "value": "济源市轵城镇" }], "value": "济源市" }, { "text": "开封市", "children": [{ "text": "鼓楼区", "value": "鼓楼区" }, { "text": "兰考县", "value": "兰考县" }, { "text": "龙亭区", "value": "龙亭区" }, { "text": "杞县", "value": "杞县" }, { "text": "顺河回族区", "value": "顺河回族区" }, { "text": "通许县", "value": "通许县" }, { "text": "尉氏县", "value": "尉氏县" }, { "text": "祥符区", "value": "祥符区" }, { "text": "禹王台区", "value": "禹王台区" }], "value": "开封市" }, { "text": "漯河市", "children": [{ "text": "临颍县", "value": "临颍县" }, { "text": "舞阳县", "value": "舞阳县" }, { "text": "郾城区", "value": "郾城区" }, { "text": "源汇区", "value": "源汇区" }, { "text": "召陵区", "value": "召陵区" }], "value": "漯河市" }, { "text": "洛阳市", "children": [{ "text": "瀍河回族区", "value": "瀍河回族区" }, { "text": "涧西区", "value": "涧西区" }, { "text": "吉利区", "value": "吉利区" }, { "text": "老城区", "value": "老城区" }, { "text": "栾川县", "value": "栾川县" }, { "text": "洛龙区", "value": "洛龙区" }, { "text": "洛宁县", "value": "洛宁县" }, { "text": "孟津县", "value": "孟津县" }, { "text": "汝阳县", "value": "汝阳县" }, { "text": "嵩县", "value": "嵩县" }, { "text": "西工区", "value": "西工区" }, { "text": "新安县", "value": "新安县" }, { "text": "偃师市", "value": "偃师市" }, { "text": "伊川县", "value": "伊川县" }, { "text": "宜阳县", "value": "宜阳县" }], "value": "洛阳市" }, { "text": "南阳市", "children": [{ "text": "邓州市", "value": "邓州市" }, { "text": "方城县", "value": "方城县" }, { "text": "南召县", "value": "南召县" }, { "text": "内乡县", "value": "内乡县" }, { "text": "社旗县", "value": "社旗县" }, { "text": "唐河县", "value": "唐河县" }, { "text": "桐柏县", "value": "桐柏县" }, { "text": "宛城区", "value": "宛城区" }, { "text": "卧龙区", "value": "卧龙区" }, { "text": "淅川县", "value": "淅川县" }, { "text": "新野县", "value": "新野县" }, { "text": "西峡县", "value": "西峡县" }, { "text": "镇平县", "value": "镇平县" }], "value": "南阳市" }, { "text": "平顶山市", "children": [{ "text": "宝丰县", "value": "宝丰县" }, { "text": "郏县", "value": "郏县" }, { "text": "鲁山县", "value": "鲁山县" }, { "text": "汝州市", "value": "汝州市" }, { "text": "石龙区", "value": "石龙区" }, { "text": "卫东区", "value": "卫东区" }, { "text": "舞钢市", "value": "舞钢市" }, { "text": "新华区", "value": "新华区" }, { "text": "叶县", "value": "叶县" }, { "text": "湛河区", "value": "湛河区" }], "value": "平顶山市" }, { "text": "濮阳市", "children": [{ "text": "范县", "value": "范县" }, { "text": "华龙区", "value": "华龙区" }, { "text": "南乐县", "value": "南乐县" }, { "text": "濮阳县", "value": "濮阳县" }, { "text": "清丰县", "value": "清丰县" }, { "text": "台前县", "value": "台前县" }], "value": "濮阳市" }, { "text": "三门峡市", "children": [{ "text": "湖滨区", "value": "湖滨区" }, { "text": "灵宝市", "value": "灵宝市" }, { "text": "卢氏县", "value": "卢氏县" }, { "text": "陕州区", "value": "陕州区" }, { "text": "渑池县", "value": "渑池县" }, { "text": "义马市", "value": "义马市" }], "value": "三门峡市" }, { "text": "商丘市", "children": [{ "text": "梁园区", "value": "梁园区" }, { "text": "民权县", "value": "民权县" }, { "text": "宁陵县", "value": "宁陵县" }, { "text": "睢县", "value": "睢县" }, { "text": "睢阳区", "value": "睢阳区" }, { "text": "夏邑县", "value": "夏邑县" }, { "text": "永城市", "value": "永城市" }, { "text": "虞城县", "value": "虞城县" }, { "text": "柘城县", "value": "柘城县" }], "value": "商丘市" }, { "text": "新乡市", "children": [{ "text": "长垣县", "value": "长垣县" }, { "text": "封丘县", "value": "封丘县" }, { "text": "凤泉区", "value": "凤泉区" }, { "text": "红旗区", "value": "红旗区" }, { "text": "辉县市", "value": "辉县市" }, { "text": "获嘉县", "value": "获嘉县" }, { "text": "牧野区", "value": "牧野区" }, { "text": "卫滨区", "value": "卫滨区" }, { "text": "卫辉市", "value": "卫辉市" }, { "text": "新乡县", "value": "新乡县" }, { "text": "延津县", "value": "延津县" }, { "text": "原阳县", "value": "原阳县" }], "value": "新乡市" }, { "text": "信阳市", "children": [{ "text": "光山县", "value": "光山县" }, { "text": "固始县", "value": "固始县" }, { "text": "浉河区", "value": "浉河区" }, { "text": "淮滨县", "value": "淮滨县" }, { "text": "潢川县", "value": "潢川县" }, { "text": "罗山县", "value": "罗山县" }, { "text": "平桥区", "value": "平桥区" }, { "text": "商城县", "value": "商城县" }, { "text": "新县", "value": "新县" }, { "text": "息县", "value": "息县" }], "value": "信阳市" }, { "text": "许昌市", "children": [{ "text": "长葛市", "value": "长葛市" }, { "text": "建安区", "value": "建安区" }, { "text": "魏都区", "value": "魏都区" }, { "text": "襄城县", "value": "襄城县" }, { "text": "鄢陵县", "value": "鄢陵县" }, { "text": "禹州市", "value": "禹州市" }], "value": "许昌市" }, { "text": "郑州市", "children": [{ "text": "登封市", "value": "登封市" }, { "text": "二七区", "value": "二七区" }, { "text": "巩义市", "value": "巩义市" }, { "text": "管城回族区", "value": "管城回族区" }, { "text": "惠济区", "value": "惠济区" }, { "text": "金水区", "value": "金水区" }, { "text": "上街区", "value": "上街区" }, { "text": "荥阳市", "value": "荥阳市" }, { "text": "新密市", "value": "新密市" }, { "text": "新郑市", "value": "新郑市" }, { "text": "中牟县", "value": "中牟县" }, { "text": "中原区", "value": "中原区" }], "value": "郑州市" }, { "text": "周口市", "children": [{ "text": "川汇区", "value": "川汇区" }, { "text": "郸城县", "value": "郸城县" }, { "text": "扶沟县", "value": "扶沟县" }, { "text": "淮阳县", "value": "淮阳县" }, { "text": "鹿邑县", "value": "鹿邑县" }, { "text": "商水县", "value": "商水县" }, { "text": "沈丘县", "value": "沈丘县" }, { "text": "太康县", "value": "太康县" }, { "text": "项城市", "value": "项城市" }, { "text": "西华县", "value": "西华县" }], "value": "周口市" }, { "text": "驻马店市", "children": [{ "text": "泌阳县", "value": "泌阳县" }, { "text": "平舆县", "value": "平舆县" }, { "text": "确山县", "value": "确山县" }, { "text": "汝南县", "value": "汝南县" }, { "text": "上蔡县", "value": "上蔡县" }, { "text": "遂平县", "value": "遂平县" }, { "text": "新蔡县", "value": "新蔡县" }, { "text": "西平县", "value": "西平县" }, { "text": "驿城区", "value": "驿城区" }, { "text": "正阳县", "value": "正阳县" }], "value": "驻马店市" }] },
                { "text": "湖北省", "value": "湖北省", "children": [{ "text": "恩施土家族苗族自治州", "children": [{ "text": "巴东县", "value": "巴东县" }, { "text": "恩施市", "value": "恩施市" }, { "text": "鹤峰县", "value": "鹤峰县" }, { "text": "建始县", "value": "建始县" }, { "text": "来凤县", "value": "来凤县" }, { "text": "利川市", "value": "利川市" }, { "text": "咸丰县", "value": "咸丰县" }, { "text": "宣恩县", "value": "宣恩县" }], "value": "恩施土家族苗族自治州" }, { "text": "鄂州市", "children": [{ "text": "鄂城区", "value": "鄂城区" }, { "text": "华容区", "value": "华容区" }, { "text": "梁子湖区", "value": "梁子湖区" }], "value": "鄂州市" }, { "text": "黄冈市", "children": [{ "text": "红安县", "value": "红安县" }, { "text": "黄梅县", "value": "黄梅县" }, { "text": "黄州区", "value": "黄州区" }, { "text": "罗田县", "value": "罗田县" }, { "text": "麻城市", "value": "麻城市" }, { "text": "蕲春县", "value": "蕲春县" }, { "text": "团风县", "value": "团风县" }, { "text": "武穴市", "value": "武穴市" }, { "text": "浠水县", "value": "浠水县" }, { "text": "英山县", "value": "英山县" }], "value": "黄冈市" }, { "text": "黄石市", "children": [{ "text": "大冶市", "value": "大冶市" }, { "text": "黄石港区", "value": "黄石港区" }, { "text": "铁山区", "value": "铁山区" }, { "text": "下陆区", "value": "下陆区" }, { "text": "西塞山区", "value": "西塞山区" }, { "text": "阳新县", "value": "阳新县" }], "value": "黄石市" }, { "text": "荆门市", "children": [{ "text": "东宝区", "value": "东宝区" }, { "text": "掇刀区", "value": "掇刀区" }, { "text": "京山市", "value": "京山市" }, { "text": "沙洋县", "value": "沙洋县" }, { "text": "钟祥市", "value": "钟祥市" }], "value": "荆门市" }, { "text": "荆州市", "children": [{ "text": "公安县", "value": "公安县" }, { "text": "洪湖市", "value": "洪湖市" }, { "text": "江陵县", "value": "江陵县" }, { "text": "监利县", "value": "监利县" }, { "text": "荆州区", "value": "荆州区" }, { "text": "沙市区", "value": "沙市区" }, { "text": "石首市", "value": "石首市" }, { "text": "松滋市", "value": "松滋市" }], "value": "荆州市" }, { "text": "潜江市", "children": [{ "text": "白鹭湖管理区", "value": "白鹭湖管理区" }, { "text": "高场街道", "value": "高场街道" }, { "text": "高石碑镇", "value": "高石碑镇" }, { "text": "广华街道", "value": "广华街道" }, { "text": "浩口原种场", "value": "浩口原种场" }, { "text": "浩口镇", "value": "浩口镇" }, { "text": "后湖管理区", "value": "后湖管理区" }, { "text": "江汉石油管理局", "value": "江汉石油管理局" }, { "text": "积玉口镇", "value": "积玉口镇" }, { "text": "老新镇", "value": "老新镇" }, { "text": "龙湾镇", "value": "龙湾镇" }, { "text": "潜江经济开发区", "value": "潜江经济开发区" }, { "text": "泰丰街道", "value": "泰丰街道" }, { "text": "王场镇", "value": "王场镇" }, { "text": "熊口管理区", "value": "熊口管理区" }, { "text": "熊口镇", "value": "熊口镇" }, { "text": "杨市街道", "value": "杨市街道" }, { "text": "园林街道", "value": "园林街道" }, { "text": "运粮湖管理区", "value": "运粮湖管理区" }, { "text": "渔洋镇", "value": "渔洋镇" }, { "text": "张金镇", "value": "张金镇" }, { "text": "周矶管理区", "value": "周矶管理区" }, { "text": "周矶街道", "value": "周矶街道" }, { "text": "竹根滩镇", "value": "竹根滩镇" }, { "text": "总口管理区", "value": "总口管理区" }], "value": "潜江市" }, { "text": "神农架林区", "children": [{ "text": "红坪镇", "value": "红坪镇" }, { "text": "九湖镇", "value": "九湖镇" }, { "text": "木鱼镇", "value": "木鱼镇" }, { "text": "松柏镇", "value": "松柏镇" }, { "text": "宋洛乡", "value": "宋洛乡" }, { "text": "下谷坪土家族乡", "value": "下谷坪土家族乡" }, { "text": "新华镇", "value": "新华镇" }, { "text": "阳日镇", "value": "阳日镇" }], "value": "神农架林区" }, { "text": "十堰市", "children": [{ "text": "丹江口市", "value": "丹江口市" }, { "text": "房县", "value": "房县" }, { "text": "茅箭区", "value": "茅箭区" }, { "text": "郧西县", "value": "郧西县" }, { "text": "郧阳区", "value": "郧阳区" }, { "text": "张湾区", "value": "张湾区" }, { "text": "竹山县", "value": "竹山县" }, { "text": "竹溪县", "value": "竹溪县" }], "value": "十堰市" }, { "text": "随州市", "children": [{ "text": "广水市", "value": "广水市" }, { "text": "随县", "value": "随县" }, { "text": "曾都区", "value": "曾都区" }], "value": "随州市" }, { "text": "天门市", "children": [{ "text": "白茅湖农场", "value": "白茅湖农场" }, { "text": "沉湖管委会", "value": "沉湖管委会" }, { "text": "多宝镇", "value": "多宝镇" }, { "text": "多祥镇", "value": "多祥镇" }, { "text": "佛子山镇", "value": "佛子山镇" }, { "text": "干驿镇", "value": "干驿镇" }, { "text": "横林镇", "value": "横林镇" }, { "text": "黄潭镇", "value": "黄潭镇" }, { "text": "胡市镇", "value": "胡市镇" }, { "text": "蒋场镇", "value": "蒋场镇" }, { "text": "蒋湖农场", "value": "蒋湖农场" }, { "text": "竟陵街道", "value": "竟陵街道" }, { "text": "净潭乡", "value": "净潭乡" }, { "text": "九真镇", "value": "九真镇" }, { "text": "卢市镇", "value": "卢市镇" }, { "text": "马湾镇", "value": "马湾镇" }, { "text": "麻洋镇", "value": "麻洋镇" }, { "text": "彭市镇", "value": "彭市镇" }, { "text": "侨乡街道开发区", "value": "侨乡街道开发区" }, { "text": "石家河镇", "value": "石家河镇" }, { "text": "拖市镇", "value": "拖市镇" }, { "text": "汪场镇", "value": "汪场镇" }, { "text": "小板镇", "value": "小板镇" }, { "text": "杨林街道", "value": "杨林街道" }, { "text": "岳口镇", "value": "岳口镇" }, { "text": "渔薪镇", "value": "渔薪镇" }, { "text": "皂市镇", "value": "皂市镇" }, { "text": "张港镇", "value": "张港镇" }], "value": "天门市" }, { "text": "武汉市", "children": [{ "text": "蔡甸区", "value": "蔡甸区" }, { "text": "东西湖区", "value": "东西湖区" }, { "text": "汉南区", "value": "汉南区" }, { "text": "汉阳区", "value": "汉阳区" }, { "text": "洪山区", "value": "洪山区" }, { "text": "黄陂区", "value": "黄陂区" }, { "text": "江岸区", "value": "江岸区" }, { "text": "江汉区", "value": "江汉区" }, { "text": "江夏区", "value": "江夏区" }, { "text": "硚口区", "value": "硚口区" }, { "text": "青山区", "value": "青山区" }, { "text": "武昌区", "value": "武昌区" }, { "text": "新洲区", "value": "新洲区" }], "value": "武汉市" }, { "text": "襄阳市", "children": [{ "text": "保康县", "value": "保康县" }, { "text": "樊城区", "value": "樊城区" }, { "text": "谷城县", "value": "谷城县" }, { "text": "老河口市", "value": "老河口市" }, { "text": "南漳县", "value": "南漳县" }, { "text": "襄城区", "value": "襄城区" }, { "text": "襄州区", "value": "襄州区" }, { "text": "宜城市", "value": "宜城市" }, { "text": "枣阳市", "value": "枣阳市" }], "value": "襄阳市" }, { "text": "咸宁市", "children": [{ "text": "赤壁市", "value": "赤壁市" }, { "text": "崇阳县", "value": "崇阳县" }, { "text": "嘉鱼县", "value": "嘉鱼县" }, { "text": "通城县", "value": "通城县" }, { "text": "通山县", "value": "通山县" }, { "text": "咸安区", "value": "咸安区" }], "value": "咸宁市" }, { "text": "仙桃市", "children": [{ "text": "长倘口镇", "value": "长倘口镇" }, { "text": "陈场镇", "value": "陈场镇" }, { "text": "豆河镇", "value": "豆河镇" }, { "text": "干河街道", "value": "干河街道" }, { "text": "工业园区", "value": "工业园区" }, { "text": "郭河镇", "value": "郭河镇" }, { "text": "胡场镇", "value": "胡场镇" }, { "text": "九合垸原种场", "value": "九合垸原种场" }, { "text": "龙华山街道", "value": "龙华山街道" }, { "text": "毛嘴镇", "value": "毛嘴镇" }, { "text": "沔城回族镇", "value": "沔城回族镇" }, { "text": "排湖风景区", "value": "排湖风景区" }, { "text": "彭场镇", "value": "彭场镇" }, { "text": "三伏潭镇", "value": "三伏潭镇" }, { "text": "沙湖原种场", "value": "沙湖原种场" }, { "text": "沙湖镇", "value": "沙湖镇" }, { "text": "沙嘴街道", "value": "沙嘴街道" }, { "text": "通海口镇", "value": "通海口镇" }, { "text": "五湖渔场", "value": "五湖渔场" }, { "text": "西流河镇", "value": "西流河镇" }, { "text": "畜禽良种场", "value": "畜禽良种场" }, { "text": "杨林尾镇", "value": "杨林尾镇" }, { "text": "张沟镇", "value": "张沟镇" }, { "text": "赵西垸林场", "value": "赵西垸林场" }, { "text": "郑场镇", "value": "郑场镇" }], "value": "仙桃市" }, { "text": "孝感市", "children": [{ "text": "安陆市", "value": "安陆市" }, { "text": "大悟县", "value": "大悟县" }, { "text": "汉川市", "value": "汉川市" }, { "text": "孝昌县", "value": "孝昌县" }, { "text": "孝南区", "value": "孝南区" }, { "text": "应城市", "value": "应城市" }, { "text": "云梦县", "value": "云梦县" }], "value": "孝感市" }, { "text": "宜昌市", "children": [{ "text": "长阳土家族自治县", "value": "长阳土家族自治县" }, { "text": "当阳市", "value": "当阳市" }, { "text": "点军区", "value": "点军区" }, { "text": "猇亭区", "value": "猇亭区" }, { "text": "五峰土家族自治县", "value": "五峰土家族自治县" }, { "text": "伍家岗区", "value": "伍家岗区" }, { "text": "西陵区", "value": "西陵区" }, { "text": "兴山县", "value": "兴山县" }, { "text": "宜都市", "value": "宜都市" }, { "text": "夷陵区", "value": "夷陵区" }, { "text": "远安县", "value": "远安县" }, { "text": "枝江市", "value": "枝江市" }, { "text": "秭归县", "value": "秭归县" }], "value": "宜昌市" }] },
                { "text": "湖南省", "value": "湖南省", "children": [{ "text": "常德市", "children": [{ "text": "安乡县", "value": "安乡县" }, { "text": "鼎城区", "value": "鼎城区" }, { "text": "汉寿县", "value": "汉寿县" }, { "text": "津市市", "value": "津市市" }, { "text": "临澧县", "value": "临澧县" }, { "text": "澧县", "value": "澧县" }, { "text": "石门县", "value": "石门县" }, { "text": "桃源县", "value": "桃源县" }, { "text": "武陵区", "value": "武陵区" }], "value": "常德市" }, { "text": "长沙市", "children": [{ "text": "长沙县", "value": "长沙县" }, { "text": "芙蓉区", "value": "芙蓉区" }, { "text": "开福区", "value": "开福区" }, { "text": "浏阳市", "value": "浏阳市" }, { "text": "宁乡市", "value": "宁乡市" }, { "text": "天心区", "value": "天心区" }, { "text": "望城区", "value": "望城区" }, { "text": "岳麓区", "value": "岳麓区" }, { "text": "雨花区", "value": "雨花区" }], "value": "长沙市" }, { "text": "郴州市", "children": [{ "text": "安仁县", "value": "安仁县" }, { "text": "北湖区", "value": "北湖区" }, { "text": "桂东县", "value": "桂东县" }, { "text": "桂阳县", "value": "桂阳县" }, { "text": "嘉禾县", "value": "嘉禾县" }, { "text": "临武县", "value": "临武县" }, { "text": "汝城县", "value": "汝城县" }, { "text": "苏仙区", "value": "苏仙区" }, { "text": "宜章县", "value": "宜章县" }, { "text": "永兴县", "value": "永兴县" }, { "text": "资兴市", "value": "资兴市" }], "value": "郴州市" }, { "text": "衡阳市", "children": [{ "text": "常宁市", "value": "常宁市" }, { "text": "衡东县", "value": "衡东县" }, { "text": "衡南县", "value": "衡南县" }, { "text": "衡山县", "value": "衡山县" }, { "text": "衡阳县", "value": "衡阳县" }, { "text": "耒阳市", "value": "耒阳市" }, { "text": "南岳区", "value": "南岳区" }, { "text": "祁东县", "value": "祁东县" }, { "text": "石鼓区", "value": "石鼓区" }, { "text": "雁峰区", "value": "雁峰区" }, { "text": "蒸湘区", "value": "蒸湘区" }, { "text": "珠晖区", "value": "珠晖区" }], "value": "衡阳市" }, { "text": "怀化市", "children": [{ "text": "辰溪县", "value": "辰溪县" }, { "text": "鹤城区", "value": "鹤城区" }, { "text": "洪江市", "value": "洪江市" }, { "text": "会同县", "value": "会同县" }, { "text": "靖州苗族侗族自治县", "value": "靖州苗族侗族自治县" }, { "text": "麻阳苗族自治县", "value": "麻阳苗族自治县" }, { "text": "通道侗族自治县", "value": "通道侗族自治县" }, { "text": "新晃侗族自治县", "value": "新晃侗族自治县" }, { "text": "溆浦县", "value": "溆浦县" }, { "text": "沅陵县", "value": "沅陵县" }, { "text": "芷江侗族自治县", "value": "芷江侗族自治县" }, { "text": "中方县", "value": "中方县" }], "value": "怀化市" }, { "text": "娄底市", "children": [{ "text": "涟源市", "value": "涟源市" }, { "text": "冷水江市", "value": "冷水江市" }, { "text": "娄星区", "value": "娄星区" }, { "text": "双峰县", "value": "双峰县" }, { "text": "新化县", "value": "新化县" }], "value": "娄底市" }, { "text": "邵阳市", "children": [{ "text": "北塔区", "value": "北塔区" }, { "text": "城步苗族自治县", "value": "城步苗族自治县" }, { "text": "大祥区", "value": "大祥区" }, { "text": "洞口县", "value": "洞口县" }, { "text": "隆回县", "value": "隆回县" }, { "text": "邵东县", "value": "邵东县" }, { "text": "邵阳县", "value": "邵阳县" }, { "text": "双清区", "value": "双清区" }, { "text": "绥宁县", "value": "绥宁县" }, { "text": "武冈市", "value": "武冈市" }, { "text": "新宁县", "value": "新宁县" }, { "text": "新邵县", "value": "新邵县" }], "value": "邵阳市" }, { "text": "湘潭市", "children": [{ "text": "韶山市", "value": "韶山市" }, { "text": "湘潭县", "value": "湘潭县" }, { "text": "湘乡市", "value": "湘乡市" }, { "text": "岳塘区", "value": "岳塘区" }, { "text": "雨湖区", "value": "雨湖区" }], "value": "湘潭市" }, { "text": "湘西土家族苗族自治州", "children": [{ "text": "保靖县", "value": "保靖县" }, { "text": "凤凰县", "value": "凤凰县" }, { "text": "古丈县", "value": "古丈县" }, { "text": "花垣县", "value": "花垣县" }, { "text": "吉首市", "value": "吉首市" }, { "text": "龙山县", "value": "龙山县" }, { "text": "泸溪县", "value": "泸溪县" }, { "text": "永顺县", "value": "永顺县" }], "value": "湘西土家族苗族自治州" }, { "text": "益阳市", "children": [{ "text": "安化县", "value": "安化县" }, { "text": "赫山区", "value": "赫山区" }, { "text": "南县", "value": "南县" }, { "text": "桃江县", "value": "桃江县" }, { "text": "沅江市", "value": "沅江市" }, { "text": "资阳区", "value": "资阳区" }], "value": "益阳市" }, { "text": "永州市", "children": [{ "text": "道县", "value": "道县" }, { "text": "东安县", "value": "东安县" }, { "text": "江华瑶族自治县", "value": "江华瑶族自治县" }, { "text": "江永县", "value": "江永县" }, { "text": "蓝山县", "value": "蓝山县" }, { "text": "零陵区", "value": "零陵区" }, { "text": "冷水滩区", "value": "冷水滩区" }, { "text": "宁远县", "value": "宁远县" }, { "text": "祁阳县", "value": "祁阳县" }, { "text": "双牌县", "value": "双牌县" }, { "text": "新田县", "value": "新田县" }], "value": "永州市" }, { "text": "岳阳市", "children": [{ "text": "华容县", "value": "华容县" }, { "text": "君山区", "value": "君山区" }, { "text": "临湘市", "value": "临湘市" }, { "text": "汨罗市", "value": "汨罗市" }, { "text": "平江县", "value": "平江县" }, { "text": "湘阴县", "value": "湘阴县" }, { "text": "岳阳楼区", "value": "岳阳楼区" }, { "text": "岳阳县", "value": "岳阳县" }, { "text": "云溪区", "value": "云溪区" }], "value": "岳阳市" }, { "text": "张家界市", "children": [{ "text": "慈利县", "value": "慈利县" }, { "text": "桑植县", "value": "桑植县" }, { "text": "武陵源区", "value": "武陵源区" }, { "text": "永定区", "value": "永定区" }], "value": "张家界市" }, { "text": "株洲市", "children": [{ "text": "茶陵县", "value": "茶陵县" }, { "text": "荷塘区", "value": "荷塘区" }, { "text": "醴陵市", "value": "醴陵市" }, { "text": "渌口区", "value": "渌口区" }, { "text": "芦淞区", "value": "芦淞区" }, { "text": "石峰区", "value": "石峰区" }, { "text": "天元区", "value": "天元区" }, { "text": "炎陵县", "value": "炎陵县" }, { "text": "攸县", "value": "攸县" }], "value": "株洲市" }] },
                { "text": "江苏省", "value": "江苏省", "children": [{ "text": "常州市", "children": [{ "text": "金坛区", "value": "金坛区" }, { "text": "溧阳市", "value": "溧阳市" }, { "text": "天宁区", "value": "天宁区" }, { "text": "武进区", "value": "武进区" }, { "text": "新北区", "value": "新北区" }, { "text": "钟楼区", "value": "钟楼区" }], "value": "常州市" }, { "text": "淮安市", "children": [{ "text": "洪泽区", "value": "洪泽区" }, { "text": "淮安区", "value": "淮安区" }, { "text": "淮阴区", "value": "淮阴区" }, { "text": "金湖县", "value": "金湖县" }, { "text": "涟水县", "value": "涟水县" }, { "text": "清江浦区", "value": "清江浦区" }, { "text": "盱眙县", "value": "盱眙县" }], "value": "淮安市" }, { "text": "连云港市", "children": [{ "text": "东海县", "value": "东海县" }, { "text": "赣榆区", "value": "赣榆区" }, { "text": "灌南县", "value": "灌南县" }, { "text": "灌云县", "value": "灌云县" }, { "text": "海州区", "value": "海州区" }, { "text": "连云区", "value": "连云区" }], "value": "连云港市" }, { "text": "南京市", "children": [{ "text": "高淳区", "value": "高淳区" }, { "text": "鼓楼区", "value": "鼓楼区" }, { "text": "江宁区", "value": "江宁区" }, { "text": "建邺区", "value": "建邺区" }, { "text": "溧水区", "value": "溧水区" }, { "text": "六合区", "value": "六合区" }, { "text": "浦口区", "value": "浦口区" }, { "text": "秦淮区", "value": "秦淮区" }, { "text": "栖霞区", "value": "栖霞区" }, { "text": "玄武区", "value": "玄武区" }, { "text": "雨花台区", "value": "雨花台区" }], "value": "南京市" }, { "text": "南通市", "children": [{ "text": "崇川区", "value": "崇川区" }, { "text": "港闸区", "value": "港闸区" }, { "text": "海安市", "value": "海安市" }, { "text": "海门市", "value": "海门市" }, { "text": "启东市", "value": "启东市" }, { "text": "如东县", "value": "如东县" }, { "text": "如皋市", "value": "如皋市" }, { "text": "通州区", "value": "通州区" }], "value": "南通市" }, { "text": "宿迁市", "children": [{ "text": "沭阳县", "value": "沭阳县" }, { "text": "泗洪县", "value": "泗洪县" }, { "text": "泗阳县", "value": "泗阳县" }, { "text": "宿城区", "value": "宿城区" }, { "text": "宿豫区", "value": "宿豫区" }], "value": "宿迁市" }, { "text": "苏州市", "children": [{ "text": "常熟市", "value": "常熟市" }, { "text": "姑苏区", "value": "姑苏区" }, { "text": "虎丘区", "value": "虎丘区" }, { "text": "昆山市", "value": "昆山市" }, { "text": "苏州工业园区", "value": "苏州工业园区" }, { "text": "太仓市", "value": "太仓市" }, { "text": "吴江区", "value": "吴江区" }, { "text": "吴中区", "value": "吴中区" }, { "text": "相城区", "value": "相城区" }, { "text": "张家港市", "value": "张家港市" }], "value": "苏州市" }, { "text": "泰州市", "children": [{ "text": "高港区", "value": "高港区" }, { "text": "海陵区", "value": "海陵区" }, { "text": "姜堰区", "value": "姜堰区" }, { "text": "靖江市", "value": "靖江市" }, { "text": "泰兴市", "value": "泰兴市" }, { "text": "兴化市", "value": "兴化市" }], "value": "泰州市" }, { "text": "无锡市", "children": [{ "text": "滨湖区", "value": "滨湖区" }, { "text": "惠山区", "value": "惠山区" }, { "text": "江阴市", "value": "江阴市" }, { "text": "梁溪区", "value": "梁溪区" }, { "text": "新吴区", "value": "新吴区" }, { "text": "锡山区", "value": "锡山区" }, { "text": "宜兴市", "value": "宜兴市" }], "value": "无锡市" }, { "text": "徐州市", "children": [{ "text": "丰县", "value": "丰县" }, { "text": "鼓楼区", "value": "鼓楼区" }, { "text": "贾汪区", "value": "贾汪区" }, { "text": "沛县", "value": "沛县" }, { "text": "邳州市", "value": "邳州市" }, { "text": "泉山区", "value": "泉山区" }, { "text": "睢宁县", "value": "睢宁县" }, { "text": "铜山区", "value": "铜山区" }, { "text": "新沂市", "value": "新沂市" }, { "text": "云龙区", "value": "云龙区" }], "value": "徐州市" }, { "text": "盐城市", "children": [{ "text": "滨海县", "value": "滨海县" }, { "text": "大丰区", "value": "大丰区" }, { "text": "东台市", "value": "东台市" }, { "text": "阜宁县", "value": "阜宁县" }, { "text": "建湖县", "value": "建湖县" }, { "text": "射阳县", "value": "射阳县" }, { "text": "亭湖区", "value": "亭湖区" }, { "text": "响水县", "value": "响水县" }, { "text": "盐都区", "value": "盐都区" }], "value": "盐城市" }, { "text": "扬州市", "children": [{ "text": "宝应县", "value": "宝应县" }, { "text": "高邮市", "value": "高邮市" }, { "text": "广陵区", "value": "广陵区" }, { "text": "邗江区", "value": "邗江区" }, { "text": "江都区", "value": "江都区" }, { "text": "仪征市", "value": "仪征市" }], "value": "扬州市" }, { "text": "镇江市", "children": [{ "text": "丹徒区", "value": "丹徒区" }, { "text": "丹阳市", "value": "丹阳市" }, { "text": "京口区", "value": "京口区" }, { "text": "句容市", "value": "句容市" }, { "text": "润州区", "value": "润州区" }, { "text": "扬中市", "value": "扬中市" }], "value": "镇江市" }] },
                { "text": "江西省", "value": "江西省", "children": [{ "text": "抚州市", "children": [{ "text": "崇仁县", "value": "崇仁县" }, { "text": "东乡区", "value": "东乡区" }, { "text": "广昌县", "value": "广昌县" }, { "text": "金溪县", "value": "金溪县" }, { "text": "乐安县", "value": "乐安县" }, { "text": "黎川县", "value": "黎川县" }, { "text": "临川区", "value": "临川区" }, { "text": "南城县", "value": "南城县" }, { "text": "南丰县", "value": "南丰县" }, { "text": "宜黄县", "value": "宜黄县" }, { "text": "资溪县", "value": "资溪县" }], "value": "抚州市" }, { "text": "赣州市", "children": [{ "text": "安远县", "value": "安远县" }, { "text": "崇义县", "value": "崇义县" }, { "text": "大余县", "value": "大余县" }, { "text": "定南县", "value": "定南县" }, { "text": "赣县区", "value": "赣县区" }, { "text": "会昌县", "value": "会昌县" }, { "text": "龙南县", "value": "龙南县" }, { "text": "南康区", "value": "南康区" }, { "text": "宁都县", "value": "宁都县" }, { "text": "全南县", "value": "全南县" }, { "text": "瑞金市", "value": "瑞金市" }, { "text": "上犹县", "value": "上犹县" }, { "text": "石城县", "value": "石城县" }, { "text": "信丰县", "value": "信丰县" }, { "text": "兴国县", "value": "兴国县" }, { "text": "寻乌县", "value": "寻乌县" }, { "text": "于都县", "value": "于都县" }, { "text": "章贡区", "value": "章贡区" }], "value": "赣州市" }, { "text": "吉安市", "children": [{ "text": "安福县", "value": "安福县" }, { "text": "吉安县", "value": "吉安县" }, { "text": "井冈山市", "value": "井冈山市" }, { "text": "吉水县", "value": "吉水县" }, { "text": "吉州区", "value": "吉州区" }, { "text": "青原区", "value": "青原区" }, { "text": "遂川县", "value": "遂川县" }, { "text": "泰和县", "value": "泰和县" }, { "text": "万安县", "value": "万安县" }, { "text": "峡江县", "value": "峡江县" }, { "text": "新干县", "value": "新干县" }, { "text": "永丰县", "value": "永丰县" }, { "text": "永新县", "value": "永新县" }], "value": "吉安市" }, { "text": "景德镇市", "children": [{ "text": "昌江区", "value": "昌江区" }, { "text": "浮梁县", "value": "浮梁县" }, { "text": "乐平市", "value": "乐平市" }, { "text": "珠山区", "value": "珠山区" }], "value": "景德镇市" }, { "text": "九江市", "children": [{ "text": "柴桑区", "value": "柴桑区" }, { "text": "德安县", "value": "德安县" }, { "text": "都昌县", "value": "都昌县" }, { "text": "共青城市", "value": "共青城市" }, { "text": "湖口县", "value": "湖口县" }, { "text": "濂溪区", "value": "濂溪区" }, { "text": "庐山市", "value": "庐山市" }, { "text": "彭泽县", "value": "彭泽县" }, { "text": "瑞昌市", "value": "瑞昌市" }, { "text": "武宁县", "value": "武宁县" }, { "text": "修水县", "value": "修水县" }, { "text": "浔阳区", "value": "浔阳区" }, { "text": "永修县", "value": "永修县" }], "value": "九江市" }, { "text": "南昌市", "children": [{ "text": "安义县", "value": "安义县" }, { "text": "东湖区", "value": "东湖区" }, { "text": "进贤县", "value": "进贤县" }, { "text": "南昌县", "value": "南昌县" }, { "text": "青山湖区", "value": "青山湖区" }, { "text": "青云谱区", "value": "青云谱区" }, { "text": "湾里区", "value": "湾里区" }, { "text": "西湖区", "value": "西湖区" }, { "text": "新建区", "value": "新建区" }], "value": "南昌市" }, { "text": "萍乡市", "children": [{ "text": "安源区", "value": "安源区" }, { "text": "莲花县", "value": "莲花县" }, { "text": "芦溪县", "value": "芦溪县" }, { "text": "上栗县", "value": "上栗县" }, { "text": "湘东区", "value": "湘东区" }], "value": "萍乡市" }, { "text": "上饶市", "children": [{ "text": "德兴市", "value": "德兴市" }, { "text": "广丰区", "value": "广丰区" }, { "text": "横峰县", "value": "横峰县" }, { "text": "婺源县", "value": "婺源县" }, { "text": "鄱阳县", "value": "鄱阳县" }, { "text": "铅山县", "value": "铅山县" }, { "text": "上饶县", "value": "上饶县" }, { "text": "万年县", "value": "万年县" }, { "text": "信州区", "value": "信州区" }, { "text": "弋阳县", "value": "弋阳县" }, { "text": "余干县", "value": "余干县" }, { "text": "玉山县", "value": "玉山县" }], "value": "上饶市" }, { "text": "新余市", "children": [{ "text": "分宜县", "value": "分宜县" }, { "text": "渝水区", "value": "渝水区" }], "value": "新余市" }, { "text": "宜春市", "children": [{ "text": "丰城市", "value": "丰城市" }, { "text": "奉新县", "value": "奉新县" }, { "text": "高安市", "value": "高安市" }, { "text": "靖安县", "value": "靖安县" }, { "text": "上高县", "value": "上高县" }, { "text": "铜鼓县", "value": "铜鼓县" }, { "text": "万载县", "value": "万载县" }, { "text": "宜丰县", "value": "宜丰县" }, { "text": "袁州区", "value": "袁州区" }, { "text": "樟树市", "value": "樟树市" }], "value": "宜春市" }, { "text": "鹰潭市", "children": [{ "text": "贵溪市", "value": "贵溪市" }, { "text": "月湖区", "value": "月湖区" }, { "text": "余江区", "value": "余江区" }], "value": "鹰潭市" }] },
                { "text": "吉林省", "value": "吉林省", "children": [{ "text": "白城市", "children": [{ "text": "大安市", "value": "大安市" }, { "text": "洮北区", "value": "洮北区" }, { "text": "洮南市", "value": "洮南市" }, { "text": "通榆县", "value": "通榆县" }, { "text": "镇赉县", "value": "镇赉县" }], "value": "白城市" }, { "text": "白山市", "children": [{ "text": "长白朝鲜族自治县", "value": "长白朝鲜族自治县" }, { "text": "抚松县", "value": "抚松县" }, { "text": "浑江区", "value": "浑江区" }, { "text": "江源区", "value": "江源区" }, { "text": "靖宇县", "value": "靖宇县" }, { "text": "临江市", "value": "临江市" }], "value": "白山市" }, { "text": "长春市", "children": [{ "text": "朝阳区", "value": "朝阳区" }, { "text": "德惠市", "value": "德惠市" }, { "text": "二道区", "value": "二道区" }, { "text": "九台区", "value": "九台区" }, { "text": "宽城区", "value": "宽城区" }, { "text": "绿园区", "value": "绿园区" }, { "text": "南关区", "value": "南关区" }, { "text": "农安县", "value": "农安县" }, { "text": "双阳区", "value": "双阳区" }, { "text": "榆树市", "value": "榆树市" }], "value": "长春市" }, { "text": "吉林市", "children": [{ "text": "昌邑区", "value": "昌邑区" }, { "text": "船营区", "value": "船营区" }, { "text": "丰满区", "value": "丰满区" }, { "text": "桦甸市", "value": "桦甸市" }, { "text": "蛟河市", "value": "蛟河市" }, { "text": "龙潭区", "value": "龙潭区" }, { "text": "磐石市", "value": "磐石市" }, { "text": "舒兰市", "value": "舒兰市" }, { "text": "永吉县", "value": "永吉县" }], "value": "吉林市" }, { "text": "辽源市", "children": [{ "text": "东丰县", "value": "东丰县" }, { "text": "东辽县", "value": "东辽县" }, { "text": "龙山区", "value": "龙山区" }, { "text": "西安区", "value": "西安区" }], "value": "辽源市" }, { "text": "四平市", "children": [{ "text": "公主岭市", "value": "公主岭市" }, { "text": "梨树县", "value": "梨树县" }, { "text": "双辽市", "value": "双辽市" }, { "text": "铁东区", "value": "铁东区" }, { "text": "铁西区", "value": "铁西区" }, { "text": "伊通满族自治县", "value": "伊通满族自治县" }], "value": "四平市" }, { "text": "松原市", "children": [{ "text": "长岭县", "value": "长岭县" }, { "text": "扶余市", "value": "扶余市" }, { "text": "宁江区", "value": "宁江区" }, { "text": "乾安县", "value": "乾安县" }, { "text": "前郭尔罗斯蒙古族自治县", "value": "前郭尔罗斯蒙古族自治县" }], "value": "松原市" }, { "text": "通化市", "children": [{ "text": "东昌区", "value": "东昌区" }, { "text": "二道江区", "value": "二道江区" }, { "text": "辉南县", "value": "辉南县" }, { "text": "集安市", "value": "集安市" }, { "text": "柳河县", "value": "柳河县" }, { "text": "梅河口市", "value": "梅河口市" }, { "text": "通化县", "value": "通化县" }], "value": "通化市" }, { "text": "延边朝鲜族自治州", "children": [{ "text": "安图县", "value": "安图县" }, { "text": "敦化市", "value": "敦化市" }, { "text": "和龙市", "value": "和龙市" }, { "text": "珲春市", "value": "珲春市" }, { "text": "龙井市", "value": "龙井市" }, { "text": "图们市", "value": "图们市" }, { "text": "汪清县", "value": "汪清县" }, { "text": "延吉市", "value": "延吉市" }], "value": "延边朝鲜族自治州" }] },
                { "text": "辽宁省", "value": "辽宁省", "children": [{ "text": "鞍山市", "children": [{ "text": "海城市", "value": "海城市" }, { "text": "立山区", "value": "立山区" }, { "text": "千山区", "value": "千山区" }, { "text": "台安县", "value": "台安县" }, { "text": "铁东区", "value": "铁东区" }, { "text": "铁西区", "value": "铁西区" }, { "text": "岫岩满族自治县", "value": "岫岩满族自治县" }], "value": "鞍山市" }, { "text": "本溪市", "children": [{ "text": "本溪满族自治县", "value": "本溪满族自治县" }, { "text": "桓仁满族自治县", "value": "桓仁满族自治县" }, { "text": "明山区", "value": "明山区" }, { "text": "南芬区", "value": "南芬区" }, { "text": "平山区", "value": "平山区" }, { "text": "溪湖区", "value": "溪湖区" }], "value": "本溪市" }, { "text": "朝阳市", "children": [{ "text": "北票市", "value": "北票市" }, { "text": "朝阳县", "value": "朝阳县" }, { "text": "建平县", "value": "建平县" }, { "text": "喀喇沁左翼蒙古族自治县", "value": "喀喇沁左翼蒙古族自治县" }, { "text": "凌源市", "value": "凌源市" }, { "text": "龙城区", "value": "龙城区" }, { "text": "双塔区", "value": "双塔区" }], "value": "朝阳市" }, { "text": "大连市", "children": [{ "text": "长海县", "value": "长海县" }, { "text": "甘井子区", "value": "甘井子区" }, { "text": "金州区", "value": "金州区" }, { "text": "旅顺口区", "value": "旅顺口区" }, { "text": "普兰店区", "value": "普兰店区" }, { "text": "沙河口区", "value": "沙河口区" }, { "text": "瓦房店市", "value": "瓦房店市" }, { "text": "西岗区", "value": "西岗区" }, { "text": "中山区", "value": "中山区" }, { "text": "庄河市", "value": "庄河市" }], "value": "大连市" }, { "text": "丹东市", "children": [{ "text": "东港市", "value": "东港市" }, { "text": "凤城市", "value": "凤城市" }, { "text": "宽甸满族自治县", "value": "宽甸满族自治县" }, { "text": "元宝区", "value": "元宝区" }, { "text": "振安区", "value": "振安区" }, { "text": "振兴区", "value": "振兴区" }], "value": "丹东市" }, { "text": "抚顺市", "children": [{ "text": "东洲区", "value": "东洲区" }, { "text": "抚顺县", "value": "抚顺县" }, { "text": "清原满族自治县", "value": "清原满族自治县" }, { "text": "顺城区", "value": "顺城区" }, { "text": "望花区", "value": "望花区" }, { "text": "新宾满族自治县", "value": "新宾满族自治县" }, { "text": "新抚区", "value": "新抚区" }], "value": "抚顺市" }, { "text": "阜新市", "children": [{ "text": "阜新蒙古族自治县", "value": "阜新蒙古族自治县" }, { "text": "海州区", "value": "海州区" }, { "text": "清河门区", "value": "清河门区" }, { "text": "太平区", "value": "太平区" }, { "text": "细河区", "value": "细河区" }, { "text": "新邱区", "value": "新邱区" }, { "text": "彰武县", "value": "彰武县" }], "value": "阜新市" }, { "text": "葫芦岛市", "children": [{ "text": "建昌县", "value": "建昌县" }, { "text": "连山区", "value": "连山区" }, { "text": "龙港区", "value": "龙港区" }, { "text": "南票区", "value": "南票区" }, { "text": "绥中县", "value": "绥中县" }, { "text": "兴城市", "value": "兴城市" }], "value": "葫芦岛市" }, { "text": "锦州市", "children": [{ "text": "北镇市", "value": "北镇市" }, { "text": "古塔区", "value": "古塔区" }, { "text": "黑山县", "value": "黑山县" }, { "text": "凌海市", "value": "凌海市" }, { "text": "凌河区", "value": "凌河区" }, { "text": "太和区", "value": "太和区" }, { "text": "义县", "value": "义县" }], "value": "锦州市" }, { "text": "辽阳市", "children": [{ "text": "白塔区", "value": "白塔区" }, { "text": "灯塔市", "value": "灯塔市" }, { "text": "弓长岭区", "value": "弓长岭区" }, { "text": "宏伟区", "value": "宏伟区" }, { "text": "辽阳县", "value": "辽阳县" }, { "text": "太子河区", "value": "太子河区" }, { "text": "文圣区", "value": "文圣区" }], "value": "辽阳市" }, { "text": "盘锦市", "children": [{ "text": "大洼区", "value": "大洼区" }, { "text": "盘山县", "value": "盘山县" }, { "text": "双台子区", "value": "双台子区" }, { "text": "兴隆台区", "value": "兴隆台区" }], "value": "盘锦市" }, { "text": "沈阳市", "children": [{ "text": "大东区", "value": "大东区" }, { "text": "法库县", "value": "法库县" }, { "text": "和平区", "value": "和平区" }, { "text": "皇姑区", "value": "皇姑区" }, { "text": "浑南区", "value": "浑南区" }, { "text": "康平县", "value": "康平县" }, { "text": "辽中区", "value": "辽中区" }, { "text": "沈北新区", "value": "沈北新区" }, { "text": "沈河区", "value": "沈河区" }, { "text": "苏家屯区", "value": "苏家屯区" }, { "text": "铁西区", "value": "铁西区" }, { "text": "新民市", "value": "新民市" }, { "text": "于洪区", "value": "于洪区" }], "value": "沈阳市" }, { "text": "铁岭市", "children": [{ "text": "昌图县", "value": "昌图县" }, { "text": "调兵山市", "value": "调兵山市" }, { "text": "开原市", "value": "开原市" }, { "text": "清河区", "value": "清河区" }, { "text": "铁岭县", "value": "铁岭县" }, { "text": "西丰县", "value": "西丰县" }, { "text": "银州区", "value": "银州区" }], "value": "铁岭市" }, { "text": "营口市", "children": [{ "text": "鲅鱼圈区", "value": "鲅鱼圈区" }, { "text": "大石桥市", "value": "大石桥市" }, { "text": "盖州市", "value": "盖州市" }, { "text": "老边区", "value": "老边区" }, { "text": "西市区", "value": "西市区" }, { "text": "站前区", "value": "站前区" }], "value": "营口市" }] }, { "text": "内蒙古自治区", "value": "内蒙古自治区", "children": [{ "text": "阿拉善盟", "children": [{ "text": "阿拉善右旗", "value": "阿拉善右旗" }, { "text": "阿拉善左旗", "value": "阿拉善左旗" }, { "text": "额济纳旗", "value": "额济纳旗" }], "value": "阿拉善盟" }, { "text": "包头市", "children": [{ "text": "白云鄂博矿区", "value": "白云鄂博矿区" }, { "text": "达尔罕茂明安联合旗", "value": "达尔罕茂明安联合旗" }, { "text": "东河区", "value": "东河区" }, { "text": "固阳县", "value": "固阳县" }, { "text": "九原区", "value": "九原区" }, { "text": "昆都仑区", "value": "昆都仑区" }, { "text": "青山区", "value": "青山区" }, { "text": "石拐区", "value": "石拐区" }, { "text": "土默特右旗", "value": "土默特右旗" }], "value": "包头市" }, { "text": "巴彦淖尔市", "children": [{ "text": "磴口县", "value": "磴口县" }, { "text": "杭锦后旗", "value": "杭锦后旗" }, { "text": "临河区", "value": "临河区" }, { "text": "乌拉特后旗", "value": "乌拉特后旗" }, { "text": "乌拉特前旗", "value": "乌拉特前旗" }, { "text": "乌拉特中旗", "value": "乌拉特中旗" }, { "text": "五原县", "value": "五原县" }], "value": "巴彦淖尔市" }, { "text": "赤峰市", "children": [{ "text": "阿鲁科尔沁旗", "value": "阿鲁科尔沁旗" }, { "text": "敖汉旗", "value": "敖汉旗" }, { "text": "巴林右旗", "value": "巴林右旗" }, { "text": "巴林左旗", "value": "巴林左旗" }, { "text": "红山区", "value": "红山区" }, { "text": "喀喇沁旗", "value": "喀喇沁旗" }, { "text": "克什克腾旗", "value": "克什克腾旗" }, { "text": "林西县", "value": "林西县" }, { "text": "宁城县", "value": "宁城县" }, { "text": "松山区", "value": "松山区" }, { "text": "翁牛特旗", "value": "翁牛特旗" }, { "text": "元宝山区", "value": "元宝山区" }], "value": "赤峰市" }, { "text": "鄂尔多斯市", "children": [{ "text": "达拉特旗", "value": "达拉特旗" }, { "text": "东胜区", "value": "东胜区" }, { "text": "鄂托克旗", "value": "鄂托克旗" }, { "text": "鄂托克前旗", "value": "鄂托克前旗" }, { "text": "杭锦旗", "value": "杭锦旗" }, { "text": "康巴什区", "value": "康巴什区" }, { "text": "乌审旗", "value": "乌审旗" }, { "text": "伊金霍洛旗", "value": "伊金霍洛旗" }, { "text": "准格尔旗", "value": "准格尔旗" }], "value": "鄂尔多斯市" }, { "text": "呼和浩特市", "children": [{ "text": "和林格尔县", "value": "和林格尔县" }, { "text": "回民区", "value": "回民区" }, { "text": "清水河县", "value": "清水河县" }, { "text": "赛罕区", "value": "赛罕区" }, { "text": "土默特左旗", "value": "土默特左旗" }, { "text": "托克托县", "value": "托克托县" }, { "text": "武川县", "value": "武川县" }, { "text": "新城区", "value": "新城区" }, { "text": "玉泉区", "value": "玉泉区" }], "value": "呼和浩特市" }, { "text": "呼伦贝尔市", "children": [{ "text": "阿荣旗", "value": "阿荣旗" }, { "text": "陈巴尔虎旗", "value": "陈巴尔虎旗" }, { "text": "额尔古纳市", "value": "额尔古纳市" }, { "text": "鄂伦春自治旗", "value": "鄂伦春自治旗" }, { "text": "鄂温克族自治旗", "value": "鄂温克族自治旗" }, { "text": "根河市", "value": "根河市" }, { "text": "海拉尔区", "value": "海拉尔区" }, { "text": "满洲里市", "value": "满洲里市" }, { "text": "莫力达瓦达斡尔族自治旗", "value": "莫力达瓦达斡尔族自治旗" }, { "text": "新巴尔虎右旗", "value": "新巴尔虎右旗" }, { "text": "新巴尔虎左旗", "value": "新巴尔虎左旗" }, { "text": "牙克石市", "value": "牙克石市" }, { "text": "扎赉诺尔区", "value": "扎赉诺尔区" }, { "text": "扎兰屯市", "value": "扎兰屯市" }], "value": "呼伦贝尔市" }, { "text": "通辽市", "children": [{ "text": "霍林郭勒市", "value": "霍林郭勒市" }, { "text": "开鲁县", "value": "开鲁县" }, { "text": "科尔沁区", "value": "科尔沁区" }, { "text": "科尔沁左翼后旗", "value": "科尔沁左翼后旗" }, { "text": "科尔沁左翼中旗", "value": "科尔沁左翼中旗" }, { "text": "库伦旗", "value": "库伦旗" }, { "text": "奈曼旗", "value": "奈曼旗" }, { "text": "扎鲁特旗", "value": "扎鲁特旗" }], "value": "通辽市" }, { "text": "乌海市", "children": [{ "text": "海勃湾区", "value": "海勃湾区" }, { "text": "海南区", "value": "海南区" }, { "text": "乌达区", "value": "乌达区" }], "value": "乌海市" }, { "text": "乌兰察布市", "children": [{ "text": "察哈尔右翼后旗", "value": "察哈尔右翼后旗" }, { "text": "察哈尔右翼前旗", "value": "察哈尔右翼前旗" }, { "text": "察哈尔右翼中旗", "value": "察哈尔右翼中旗" }, { "text": "丰镇市", "value": "丰镇市" }, { "text": "化德县", "value": "化德县" }, { "text": "集宁区", "value": "集宁区" }, { "text": "凉城县", "value": "凉城县" }, { "text": "商都县", "value": "商都县" }, { "text": "四子王旗", "value": "四子王旗" }, { "text": "兴和县", "value": "兴和县" }, { "text": "卓资县", "value": "卓资县" }], "value": "乌兰察布市" }, { "text": "锡林郭勒盟", "children": [{ "text": "阿巴嘎旗", "value": "阿巴嘎旗" }, { "text": "东乌珠穆沁旗", "value": "东乌珠穆沁旗" }, { "text": "多伦县", "value": "多伦县" }, { "text": "二连浩特市", "value": "二连浩特市" }, { "text": "苏尼特右旗", "value": "苏尼特右旗" }, { "text": "苏尼特左旗", "value": "苏尼特左旗" }, { "text": "太仆寺旗", "value": "太仆寺旗" }, { "text": "镶黄旗", "value": "镶黄旗" }, { "text": "锡林浩特市", "value": "锡林浩特市" }, { "text": "西乌珠穆沁旗", "value": "西乌珠穆沁旗" }, { "text": "正蓝旗", "value": "正蓝旗" }, { "text": "正镶白旗", "value": "正镶白旗" }], "value": "锡林郭勒盟" }, { "text": "兴安盟", "children": [{ "text": "阿尔山市", "value": "阿尔山市" }, { "text": "科尔沁右翼前旗", "value": "科尔沁右翼前旗" }, { "text": "科尔沁右翼中旗", "value": "科尔沁右翼中旗" }, { "text": "突泉县", "value": "突泉县" }, { "text": "乌兰浩特市", "value": "乌兰浩特市" }, { "text": "扎赉特旗", "value": "扎赉特旗" }], "value": "兴安盟" }] }, { "text": "宁夏回族自治区", "value": "宁夏回族自治区", "children": [{ "text": "固原市", "children": [{ "text": "泾源县", "value": "泾源县" }, { "text": "隆德县", "value": "隆德县" }, { "text": "彭阳县", "value": "彭阳县" }, { "text": "西吉县", "value": "西吉县" }, { "text": "原州区", "value": "原州区" }], "value": "固原市" }, { "text": "石嘴山市", "children": [{ "text": "大武口区", "value": "大武口区" }, { "text": "惠农区", "value": "惠农区" }, { "text": "平罗县", "value": "平罗县" }], "value": "石嘴山市" }, { "text": "吴忠市", "children": [{ "text": "红寺堡区", "value": "红寺堡区" }, { "text": "利通区", "value": "利通区" }, { "text": "青铜峡市", "value": "青铜峡市" }, { "text": "同心县", "value": "同心县" }, { "text": "盐池县", "value": "盐池县" }], "value": "吴忠市" }, { "text": "银川市", "children": [{ "text": "贺兰县", "value": "贺兰县" }, { "text": "金凤区", "value": "金凤区" }, { "text": "灵武市", "value": "灵武市" }, { "text": "兴庆区", "value": "兴庆区" }, { "text": "西夏区", "value": "西夏区" }, { "text": "永宁县", "value": "永宁县" }], "value": "银川市" }, { "text": "中卫市", "children": [{ "text": "海原县", "value": "海原县" }, { "text": "沙坡头区", "value": "沙坡头区" }, { "text": "中宁县", "value": "中宁县" }], "value": "中卫市" }] },
                { "text": "青海省", "value": "青海省", "children": [{ "text": "果洛藏族自治州", "children": [{ "text": "班玛县", "value": "班玛县" }, { "text": "达日县", "value": "达日县" }, { "text": "甘德县", "value": "甘德县" }, { "text": "久治县", "value": "久治县" }, { "text": "玛多县", "value": "玛多县" }, { "text": "玛沁县", "value": "玛沁县" }], "value": "果洛藏族自治州" }, { "text": "海北藏族自治州", "children": [{ "text": "刚察县", "value": "刚察县" }, { "text": "海晏县", "value": "海晏县" }, { "text": "门源回族自治县", "value": "门源回族自治县" }, { "text": "祁连县", "value": "祁连县" }], "value": "海北藏族自治州" }, { "text": "海东市", "children": [{ "text": "化隆回族自治县", "value": "化隆回族自治县" }, { "text": "互助土族自治县", "value": "互助土族自治县" }, { "text": "乐都区", "value": "乐都区" }, { "text": "民和回族土族自治县", "value": "民和回族土族自治县" }, { "text": "平安区", "value": "平安区" }, { "text": "循化撒拉族自治县", "value": "循化撒拉族自治县" }], "value": "海东市" }, { "text": "海南藏族自治州", "children": [{ "text": "共和县", "value": "共和县" }, { "text": "贵德县", "value": "贵德县" }, { "text": "贵南县", "value": "贵南县" }, { "text": "同德县", "value": "同德县" }, { "text": "兴海县", "value": "兴海县" }], "value": "海南藏族自治州" }, { "text": "海西蒙古族藏族自治州", "children": [{ "text": "德令哈市", "value": "德令哈市" }, { "text": "都兰县", "value": "都兰县" }, { "text": "格尔木市", "value": "格尔木市" }, { "text": "海西蒙古族藏族自治州直辖", "value": "海西蒙古族藏族自治州直辖" }, { "text": "茫崖市", "value": "茫崖市" }, { "text": "天峻县", "value": "天峻县" }, { "text": "乌兰县", "value": "乌兰县" }], "value": "海西蒙古族藏族自治州" }, { "text": "黄南藏族自治州", "children": [{ "text": "河南蒙古族自治县", "value": "河南蒙古族自治县" }, { "text": "尖扎县", "value": "尖扎县" }, { "text": "同仁县", "value": "同仁县" }, { "text": "泽库县", "value": "泽库县" }], "value": "黄南藏族自治州" }, { "text": "西宁市", "children": [{ "text": "城北区", "value": "城北区" }, { "text": "城东区", "value": "城东区" }, { "text": "城西区", "value": "城西区" }, { "text": "城中区", "value": "城中区" }, { "text": "大通回族土族自治县", "value": "大通回族土族自治县" }, { "text": "湟源县", "value": "湟源县" }, { "text": "湟中县", "value": "湟中县" }], "value": "西宁市" }, { "text": "玉树藏族自治州", "children": [{ "text": "称多县", "value": "称多县" }, { "text": "囊谦县", "value": "囊谦县" }, { "text": "曲麻莱县", "value": "曲麻莱县" }, { "text": "玉树市", "value": "玉树市" }, { "text": "杂多县", "value": "杂多县" }, { "text": "治多县", "value": "治多县" }], "value": "玉树藏族自治州" }] },
                { "text": "山东省", "value": "山东省", "children": [{ "text": "滨州市", "children": [{ "text": "滨城区", "value": "滨城区" }, { "text": "博兴县", "value": "博兴县" }, { "text": "惠民县", "value": "惠民县" }, { "text": "无棣县", "value": "无棣县" }, { "text": "阳信县", "value": "阳信县" }, { "text": "沾化区", "value": "沾化区" }, { "text": "邹平市", "value": "邹平市" }], "value": "滨州市" }, { "text": "德州市", "children": [{ "text": "德城区", "value": "德城区" }, { "text": "乐陵市", "value": "乐陵市" }, { "text": "陵城区", "value": "陵城区" }, { "text": "临邑县", "value": "临邑县" }, { "text": "宁津县", "value": "宁津县" }, { "text": "平原县", "value": "平原县" }, { "text": "齐河县", "value": "齐河县" }, { "text": "庆云县", "value": "庆云县" }, { "text": "武城县", "value": "武城县" }, { "text": "夏津县", "value": "夏津县" }, { "text": "禹城市", "value": "禹城市" }], "value": "德州市" }, { "text": "东营市", "children": [{ "text": "东营区", "value": "东营区" }, { "text": "广饶县", "value": "广饶县" }, { "text": "河口区", "value": "河口区" }, { "text": "垦利区", "value": "垦利区" }, { "text": "利津县", "value": "利津县" }], "value": "东营市" }, { "text": "菏泽市", "children": [{ "text": "曹县", "value": "曹县" }, { "text": "成武县", "value": "成武县" }, { "text": "单县", "value": "单县" }, { "text": "定陶区", "value": "定陶区" }, { "text": "东明县", "value": "东明县" }, { "text": "鄄城县", "value": "鄄城县" }, { "text": "巨野县", "value": "巨野县" }, { "text": "牡丹区", "value": "牡丹区" }, { "text": "郓城县", "value": "郓城县" }], "value": "菏泽市" }, { "text": "济南市", "children": [{ "text": "长清区", "value": "长清区" }, { "text": "钢城区", "value": "钢城区" }, { "text": "槐荫区", "value": "槐荫区" }, { "text": "济阳区", "value": "济阳区" }, { "text": "莱芜区", "value": "莱芜区" }, { "text": "历城区", "value": "历城区" }, { "text": "历下区", "value": "历下区" }, { "text": "平阴县", "value": "平阴县" }, { "text": "商河县", "value": "商河县" }, { "text": "市中区", "value": "市中区" }, { "text": "天桥区", "value": "天桥区" }, { "text": "章丘区", "value": "章丘区" }], "value": "济南市" }, { "text": "济宁市", "children": [{ "text": "嘉祥县", "value": "嘉祥县" }, { "text": "金乡县", "value": "金乡县" }, { "text": "梁山县", "value": "梁山县" }, { "text": "曲阜市", "value": "曲阜市" }, { "text": "任城区", "value": "任城区" }, { "text": "泗水县", "value": "泗水县" }, { "text": "微山县", "value": "微山县" }, { "text": "汶上县", "value": "汶上县" }, { "text": "兖州区", "value": "兖州区" }, { "text": "鱼台县", "value": "鱼台县" }, { "text": "邹城市", "value": "邹城市" }], "value": "济宁市" }, { "text": "聊城市", "children": [{ "text": "茌平县", "value": "茌平县" }, { "text": "东阿县", "value": "东阿县" }, { "text": "东昌府区", "value": "东昌府区" }, { "text": "高唐县", "value": "高唐县" }, { "text": "冠县", "value": "冠县" }, { "text": "临清市", "value": "临清市" }, { "text": "莘县", "value": "莘县" }, { "text": "阳谷县", "value": "阳谷县" }], "value": "聊城市" }, { "text": "临沂市", "children": [{ "text": "费县", "value": "费县" }, { "text": "河东区", "value": "河东区" }, { "text": "莒南县", "value": "莒南县" }, { "text": "兰陵县", "value": "兰陵县" }, { "text": "兰山区", "value": "兰山区" }, { "text": "临沭县", "value": "临沭县" }, { "text": "罗庄区", "value": "罗庄区" }, { "text": "蒙阴县", "value": "蒙阴县" }, { "text": "平邑县", "value": "平邑县" }, { "text": "郯城县", "value": "郯城县" }, { "text": "沂南县", "value": "沂南县" }, { "text": "沂水县", "value": "沂水县" }], "value": "临沂市" }, { "text": "青岛市", "children": [{ "text": "城阳区", "value": "城阳区" }, { "text": "黄岛区", "value": "黄岛区" }, { "text": "胶州市", "value": "胶州市" }, { "text": "即墨区", "value": "即墨区" }, { "text": "莱西市", "value": "莱西市" }, { "text": "崂山区", "value": "崂山区" }, { "text": "李沧区", "value": "李沧区" }, { "text": "平度市", "value": "平度市" }, { "text": "市北区", "value": "市北区" }, { "text": "市南区", "value": "市南区" }], "value": "青岛市" }, { "text": "日照市", "children": [{ "text": "东港区", "value": "东港区" }, { "text": "莒县", "value": "莒县" }, { "text": "岚山区", "value": "岚山区" }, { "text": "五莲县", "value": "五莲县" }], "value": "日照市" }, { "text": "泰安市", "children": [{ "text": "岱岳区", "value": "岱岳区" }, { "text": "东平县", "value": "东平县" }, { "text": "肥城市", "value": "肥城市" }, { "text": "宁阳县", "value": "宁阳县" }, { "text": "泰山区", "value": "泰山区" }, { "text": "新泰市", "value": "新泰市" }], "value": "泰安市" }, { "text": "潍坊市", "children": [{ "text": "安丘市", "value": "安丘市" }, { "text": "昌乐县", "value": "昌乐县" }, { "text": "昌邑市", "value": "昌邑市" }, { "text": "坊子区", "value": "坊子区" }, { "text": "高密市", "value": "高密市" }, { "text": "寒亭区", "value": "寒亭区" }, { "text": "奎文区", "value": "奎文区" }, { "text": "临朐县", "value": "临朐县" }, { "text": "青州市", "value": "青州市" }, { "text": "寿光市", "value": "寿光市" }, { "text": "潍城区", "value": "潍城区" }, { "text": "诸城市", "value": "诸城市" }], "value": "潍坊市" }, { "text": "威海市", "children": [{ "text": "环翠区", "value": "环翠区" }, { "text": "荣成市", "value": "荣成市" }, { "text": "乳山市", "value": "乳山市" }, { "text": "文登区", "value": "文登区" }], "value": "威海市" }, { "text": "烟台市", "children": [{ "text": "长岛县", "value": "长岛县" }, { "text": "福山区", "value": "福山区" }, { "text": "海阳市", "value": "海阳市" }, { "text": "莱山区", "value": "莱山区" }, { "text": "莱阳市", "value": "莱阳市" }, { "text": "莱州市", "value": "莱州市" }, { "text": "龙口市", "value": "龙口市" }, { "text": "牟平区", "value": "牟平区" }, { "text": "蓬莱市", "value": "蓬莱市" }, { "text": "栖霞市", "value": "栖霞市" }, { "text": "招远市", "value": "招远市" }, { "text": "芝罘区", "value": "芝罘区" }], "value": "烟台市" }, { "text": "枣庄市", "children": [{ "text": "山亭区", "value": "山亭区" }, { "text": "市中区", "value": "市中区" }, { "text": "台儿庄区", "value": "台儿庄区" }, { "text": "滕州市", "value": "滕州市" }, { "text": "薛城区", "value": "薛城区" }, { "text": "峄城区", "value": "峄城区" }], "value": "枣庄市" }, { "text": "淄博市", "children": [{ "text": "博山区", "value": "博山区" }, { "text": "高青县", "value": "高青县" }, { "text": "桓台县", "value": "桓台县" }, { "text": "临淄区", "value": "临淄区" }, { "text": "沂源县", "value": "沂源县" }, { "text": "张店区", "value": "张店区" }, { "text": "周村区", "value": "周村区" }, { "text": "淄川区", "value": "淄川区" }], "value": "淄博市" }] }, { "text": "上海市", "value": "上海市", "children": [{ "text": "上海城区", "children": [{ "text": "宝山区", "value": "宝山区" }, { "text": "长宁区", "value": "长宁区" }, { "text": "崇明区", "value": "崇明区" }, { "text": "奉贤区", "value": "奉贤区" }, { "text": "虹口区", "value": "虹口区" }, { "text": "黄浦区", "value": "黄浦区" }, { "text": "嘉定区", "value": "嘉定区" }, { "text": "静安区", "value": "静安区" }, { "text": "金山区", "value": "金山区" }, { "text": "闵行区", "value": "闵行区" }, { "text": "浦东新区", "value": "浦东新区" }, { "text": "普陀区", "value": "普陀区" }, { "text": "青浦区", "value": "青浦区" }, { "text": "松江区", "value": "松江区" }, { "text": "徐汇区", "value": "徐汇区" }, { "text": "杨浦区", "value": "杨浦区" }], "value": "上海城区" }] },
                { "text": "陕西省", "value": "陕西省", "children": [{ "text": "安康市", "children": [{ "text": "白河县", "value": "白河县" }, { "text": "汉滨区", "value": "汉滨区" }, { "text": "汉阴县", "value": "汉阴县" }, { "text": "岚皋县", "value": "岚皋县" }, { "text": "宁陕县", "value": "宁陕县" }, { "text": "平利县", "value": "平利县" }, { "text": "石泉县", "value": "石泉县" }, { "text": "旬阳县", "value": "旬阳县" }, { "text": "镇坪县", "value": "镇坪县" }, { "text": "紫阳县", "value": "紫阳县" }], "value": "安康市" }, { "text": "宝鸡市", "children": [{ "text": "陈仓区", "value": "陈仓区" }, { "text": "凤县", "value": "凤县" }, { "text": "凤翔县", "value": "凤翔县" }, { "text": "扶风县", "value": "扶风县" }, { "text": "金台区", "value": "金台区" }, { "text": "麟游县", "value": "麟游县" }, { "text": "陇县", "value": "陇县" }, { "text": "眉县", "value": "眉县" }, { "text": "千阳县", "value": "千阳县" }, { "text": "岐山县", "value": "岐山县" }, { "text": "太白县", "value": "太白县" }, { "text": "渭滨区", "value": "渭滨区" }], "value": "宝鸡市" }, { "text": "汉中市", "children": [{ "text": "城固县", "value": "城固县" }, { "text": "佛坪县", "value": "佛坪县" }, { "text": "汉台区", "value": "汉台区" }, { "text": "留坝县", "value": "留坝县" }, { "text": "略阳县", "value": "略阳县" }, { "text": "勉县", "value": "勉县" }, { "text": "南郑区", "value": "南郑区" }, { "text": "宁强县", "value": "宁强县" }, { "text": "西乡县", "value": "西乡县" }, { "text": "洋县", "value": "洋县" }, { "text": "镇巴县", "value": "镇巴县" }], "value": "汉中市" }, { "text": "商洛市", "children": [{ "text": "丹凤县", "value": "丹凤县" }, { "text": "洛南县", "value": "洛南县" }, { "text": "商南县", "value": "商南县" }, { "text": "商州区", "value": "商州区" }, { "text": "山阳县", "value": "山阳县" }, { "text": "镇安县", "value": "镇安县" }, { "text": "柞水县", "value": "柞水县" }], "value": "商洛市" }, { "text": "铜川市", "children": [{ "text": "王益区", "value": "王益区" }, { "text": "耀州区", "value": "耀州区" }, { "text": "宜君县", "value": "宜君县" }, { "text": "印台区", "value": "印台区" }], "value": "铜川市" }, { "text": "渭南市", "children": [{ "text": "白水县", "value": "白水县" }, { "text": "澄城县", "value": "澄城县" }, { "text": "大荔县", "value": "大荔县" }, { "text": "富平县", "value": "富平县" }, { "text": "韩城市", "value": "韩城市" }, { "text": "合阳县", "value": "合阳县" }, { "text": "华阴市", "value": "华阴市" }, { "text": "华州区", "value": "华州区" }, { "text": "临渭区", "value": "临渭区" }, { "text": "蒲城县", "value": "蒲城县" }, { "text": "潼关县", "value": "潼关县" }], "value": "渭南市" }, { "text": "西安市", "children": [{ "text": "灞桥区", "value": "灞桥区" }, { "text": "碑林区", "value": "碑林区" }, { "text": "长安区", "value": "长安区" }, { "text": "高陵区", "value": "高陵区" }, { "text": "蓝田县", "value": "蓝田县" }, { "text": "莲湖区", "value": "莲湖区" }, { "text": "临潼区", "value": "临潼区" }, { "text": "未央区", "value": "未央区" }, { "text": "新城区", "value": "新城区" }, { "text": "阎良区", "value": "阎良区" }, { "text": "雁塔区", "value": "雁塔区" }, { "text": "鄠邑区", "value": "鄠邑区" }, { "text": "周至县", "value": "周至县" }], "value": "西安市" }, { "text": "咸阳市", "children": [{ "text": "彬州市", "value": "彬州市" }, { "text": "长武县", "value": "长武县" }, { "text": "淳化县", "value": "淳化县" }, { "text": "泾阳县", "value": "泾阳县" }, { "text": "礼泉县", "value": "礼泉县" }, { "text": "乾县", "value": "乾县" }, { "text": "秦都区", "value": "秦都区" }, { "text": "三原县", "value": "三原县" }, { "text": "渭城区", "value": "渭城区" }, { "text": "武功县", "value": "武功县" }, { "text": "兴平市", "value": "兴平市" }, { "text": "旬邑县", "value": "旬邑县" }, { "text": "杨陵区", "value": "杨陵区" }, { "text": "永寿县", "value": "永寿县" }], "value": "咸阳市" }, { "text": "延安市", "children": [{ "text": "安塞区", "value": "安塞区" }, { "text": "宝塔区", "value": "宝塔区" }, { "text": "富县", "value": "富县" }, { "text": "甘泉县", "value": "甘泉县" }, { "text": "黄陵县", "value": "黄陵县" }, { "text": "黄龙县", "value": "黄龙县" }, { "text": "洛川县", "value": "洛川县" }, { "text": "吴起县", "value": "吴起县" }, { "text": "延长县", "value": "延长县" }, { "text": "延川县", "value": "延川县" }, { "text": "宜川县", "value": "宜川县" }, { "text": "志丹县", "value": "志丹县" }, { "text": "子长县", "value": "子长县" }], "value": "延安市" }, { "text": "榆林市", "children": [{ "text": "定边县", "value": "定边县" }, { "text": "府谷县", "value": "府谷县" }, { "text": "横山区", "value": "横山区" }, { "text": "佳县", "value": "佳县" }, { "text": "靖边县", "value": "靖边县" }, { "text": "米脂县", "value": "米脂县" }, { "text": "清涧县", "value": "清涧县" }, { "text": "神木市", "value": "神木市" }, { "text": "绥德县", "value": "绥德县" }, { "text": "吴堡县", "value": "吴堡县" }, { "text": "榆阳区", "value": "榆阳区" }, { "text": "子洲县", "value": "子洲县" }], "value": "榆林市" }] },
                { "text": "山西省", "value": "山西省", "children": [{ "text": "长治市", "children": [{ "text": "长子县", "value": "长子县" }, { "text": "壶关县", "value": "壶关县" }, { "text": "黎城县", "value": "黎城县" }, { "text": "潞城区", "value": "潞城区" }, { "text": "潞州区", "value": "潞州区" }, { "text": "平顺县", "value": "平顺县" }, { "text": "沁县", "value": "沁县" }, { "text": "沁源县", "value": "沁源县" }, { "text": "上党区", "value": "上党区" }, { "text": "屯留区", "value": "屯留区" }, { "text": "武乡县", "value": "武乡县" }, { "text": "襄垣县", "value": "襄垣县" }], "value": "长治市" }, { "text": "大同市", "children": [{ "text": "广灵县", "value": "广灵县" }, { "text": "浑源县", "value": "浑源县" }, { "text": "灵丘县", "value": "灵丘县" }, { "text": "平城区", "value": "平城区" }, { "text": "天镇县", "value": "天镇县" }, { "text": "新荣区", "value": "新荣区" }, { "text": "阳高县", "value": "阳高县" }, { "text": "云冈区", "value": "云冈区" }, { "text": "云州区", "value": "云州区" }, { "text": "左云县", "value": "左云县" }], "value": "大同市" }, { "text": "晋城市", "children": [{ "text": "城区", "value": "城区" }, { "text": "高平市", "value": "高平市" }, { "text": "陵川县", "value": "陵川县" }, { "text": "沁水县", "value": "沁水县" }, { "text": "阳城县", "value": "阳城县" }, { "text": "泽州县", "value": "泽州县" }], "value": "晋城市" }, { "text": "晋中市", "children": [{ "text": "和顺县", "value": "和顺县" }, { "text": "介休市", "value": "介休市" }, { "text": "灵石县", "value": "灵石县" }, { "text": "平遥县", "value": "平遥县" }, { "text": "祁县", "value": "祁县" }, { "text": "寿阳县", "value": "寿阳县" }, { "text": "太谷县", "value": "太谷县" }, { "text": "昔阳县", "value": "昔阳县" }, { "text": "榆次区", "value": "榆次区" }, { "text": "榆社县", "value": "榆社县" }, { "text": "左权县", "value": "左权县" }], "value": "晋中市" }, { "text": "临汾市", "children": [{ "text": "安泽县", "value": "安泽县" }, { "text": "大宁县", "value": "大宁县" }, { "text": "汾西县", "value": "汾西县" }, { "text": "浮山县", "value": "浮山县" }, { "text": "古县", "value": "古县" }, { "text": "洪洞县", "value": "洪洞县" }, { "text": "侯马市", "value": "侯马市" }, { "text": "霍州市", "value": "霍州市" }, { "text": "吉县", "value": "吉县" }, { "text": "蒲县", "value": "蒲县" }, { "text": "曲沃县", "value": "曲沃县" }, { "text": "襄汾县", "value": "襄汾县" }, { "text": "乡宁县", "value": "乡宁县" }, { "text": "隰县", "value": "隰县" }, { "text": "尧都区", "value": "尧都区" }, { "text": "翼城县", "value": "翼城县" }, { "text": "永和县", "value": "永和县" }], "value": "临汾市" }, { "text": "吕梁市", "children": [{ "text": "方山县", "value": "方山县" }, { "text": "汾阳市", "value": "汾阳市" }, { "text": "交城县", "value": "交城县" }, { "text": "交口县", "value": "交口县" }, { "text": "岚县", "value": "岚县" }, { "text": "临县", "value": "临县" }, { "text": "离石区", "value": "离石区" }, { "text": "柳林县", "value": "柳林县" }, { "text": "石楼县", "value": "石楼县" }, { "text": "文水县", "value": "文水县" }, { "text": "孝义市", "value": "孝义市" }, { "text": "兴县", "value": "兴县" }, { "text": "中阳县", "value": "中阳县" }], "value": "吕梁市" }, { "text": "朔州市", "children": [{ "text": "怀仁市", "value": "怀仁市" }, { "text": "平鲁区", "value": "平鲁区" }, { "text": "山阴县", "value": "山阴县" }, { "text": "朔城区", "value": "朔城区" }, { "text": "应县", "value": "应县" }, { "text": "右玉县", "value": "右玉县" }], "value": "朔州市" }, { "text": "太原市", "children": [{ "text": "古交市", "value": "古交市" }, { "text": "尖草坪区", "value": "尖草坪区" }, { "text": "晋源区", "value": "晋源区" }, { "text": "娄烦县", "value": "娄烦县" }, { "text": "清徐县", "value": "清徐县" }, { "text": "万柏林区", "value": "万柏林区" }, { "text": "小店区", "value": "小店区" }, { "text": "杏花岭区", "value": "杏花岭区" }, { "text": "阳曲县", "value": "阳曲县" }, { "text": "迎泽区", "value": "迎泽区" }], "value": "太原市" }, { "text": "忻州市", "children": [{ "text": "保德县", "value": "保德县" }, { "text": "代县", "value": "代县" }, { "text": "定襄县", "value": "定襄县" }, { "text": "繁峙县", "value": "繁峙县" }, { "text": "河曲县", "value": "河曲县" }, { "text": "静乐县", "value": "静乐县" }, { "text": "岢岚县", "value": "岢岚县" }, { "text": "宁武县", "value": "宁武县" }, { "text": "偏关县", "value": "偏关县" }, { "text": "神池县", "value": "神池县" }, { "text": "五台县", "value": "五台县" }, { "text": "五寨县", "value": "五寨县" }, { "text": "忻府区", "value": "忻府区" }, { "text": "原平市", "value": "原平市" }], "value": "忻州市" }, { "text": "阳泉市", "children": [{ "text": "城区", "value": "城区" }, { "text": "郊区", "value": "郊区" }, { "text": "矿区", "value": "矿区" }, { "text": "平定县", "value": "平定县" }, { "text": "盂县", "value": "盂县" }], "value": "阳泉市" }, { "text": "运城市", "children": [{ "text": "河津市", "value": "河津市" }, { "text": "绛县", "value": "绛县" }, { "text": "稷山县", "value": "稷山县" }, { "text": "临猗县", "value": "临猗县" }, { "text": "平陆县", "value": "平陆县" }, { "text": "芮城县", "value": "芮城县" }, { "text": "万荣县", "value": "万荣县" }, { "text": "闻喜县", "value": "闻喜县" }, { "text": "夏县", "value": "夏县" }, { "text": "新绛县", "value": "新绛县" }, { "text": "盐湖区", "value": "盐湖区" }, { "text": "永济市", "value": "永济市" }, { "text": "垣曲县", "value": "垣曲县" }], "value": "运城市" }] },
                { "text": "四川省", "value": "四川省", "children": [{ "text": "阿坝藏族羌族自治州", "children": [{ "text": "阿坝县", "value": "阿坝县" }, { "text": "黑水县", "value": "黑水县" }, { "text": "红原县", "value": "红原县" }, { "text": "金川县", "value": "金川县" }, { "text": "九寨沟县", "value": "九寨沟县" }, { "text": "理县", "value": "理县" }, { "text": "马尔康市", "value": "马尔康市" }, { "text": "茂县", "value": "茂县" }, { "text": "壤塘县", "value": "壤塘县" }, { "text": "若尔盖县", "value": "若尔盖县" }, { "text": "松潘县", "value": "松潘县" }, { "text": "汶川县", "value": "汶川县" }, { "text": "小金县", "value": "小金县" }], "value": "阿坝藏族羌族自治州" }, { "text": "巴中市", "children": [{ "text": "巴州区", "value": "巴州区" }, { "text": "恩阳区", "value": "恩阳区" }, { "text": "南江县", "value": "南江县" }, { "text": "平昌县", "value": "平昌县" }, { "text": "通江县", "value": "通江县" }], "value": "巴中市" }, { "text": "成都市", "children": [{ "text": "成华区", "value": "成华区" }, { "text": "崇州市", "value": "崇州市" }, { "text": "大邑县", "value": "大邑县" }, { "text": "都江堰市", "value": "都江堰市" }, { "text": "简阳市", "value": "简阳市" }, { "text": "锦江区", "value": "锦江区" }, { "text": "金牛区", "value": "金牛区" }, { "text": "金堂县", "value": "金堂县" }, { "text": "龙泉驿区", "value": "龙泉驿区" }, { "text": "彭州市", "value": "彭州市" }, { "text": "郫都区", "value": "郫都区" }, { "text": "蒲江县", "value": "蒲江县" }, { "text": "青白江区", "value": "青白江区" }, { "text": "青羊区", "value": "青羊区" }, { "text": "邛崃市", "value": "邛崃市" }, { "text": "双流区", "value": "双流区" }, { "text": "温江区", "value": "温江区" }, { "text": "武侯区", "value": "武侯区" }, { "text": "新都区", "value": "新都区" }, { "text": "新津县", "value": "新津县" }], "value": "成都市" }, { "text": "达州市", "children": [{ "text": "达川区", "value": "达川区" }, { "text": "大竹县", "value": "大竹县" }, { "text": "开江县", "value": "开江县" }, { "text": "渠县", "value": "渠县" }, { "text": "通川区", "value": "通川区" }, { "text": "万源市", "value": "万源市" }, { "text": "宣汉县", "value": "宣汉县" }], "value": "达州市" }, { "text": "德阳市", "children": [{ "text": "广汉市", "value": "广汉市" }, { "text": "旌阳区", "value": "旌阳区" }, { "text": "罗江区", "value": "罗江区" }, { "text": "绵竹市", "value": "绵竹市" }, { "text": "什邡市", "value": "什邡市" }, { "text": "中江县", "value": "中江县" }], "value": "德阳市" }, { "text": "甘孜藏族自治州", "children": [{ "text": "白玉县", "value": "白玉县" }, { "text": "巴塘县", "value": "巴塘县" }, { "text": "丹巴县", "value": "丹巴县" }, { "text": "稻城县", "value": "稻城县" }, { "text": "道孚县", "value": "道孚县" }, { "text": "德格县", "value": "德格县" }, { "text": "得荣县", "value": "得荣县" }, { "text": "甘孜县", "value": "甘孜县" }, { "text": "九龙县", "value": "九龙县" }, { "text": "康定市", "value": "康定市" }, { "text": "理塘县", "value": "理塘县" }, { "text": "泸定县", "value": "泸定县" }, { "text": "炉霍县", "value": "炉霍县" }, { "text": "色达县", "value": "色达县" }, { "text": "石渠县", "value": "石渠县" }, { "text": "乡城县", "value": "乡城县" }, { "text": "新龙县", "value": "新龙县" }, { "text": "雅江县", "value": "雅江县" }], "value": "甘孜藏族自治州" }, { "text": "广安市", "children": [{ "text": "广安区", "value": "广安区" }, { "text": "华蓥市", "value": "华蓥市" }, { "text": "邻水县", "value": "邻水县" }, { "text": "前锋区", "value": "前锋区" }, { "text": "武胜县", "value": "武胜县" }, { "text": "岳池县", "value": "岳池县" }], "value": "广安市" }, { "text": "广元市", "children": [{ "text": "苍溪县", "value": "苍溪县" }, { "text": "朝天区", "value": "朝天区" }, { "text": "剑阁县", "value": "剑阁县" }, { "text": "利州区", "value": "利州区" }, { "text": "青川县", "value": "青川县" }, { "text": "旺苍县", "value": "旺苍县" }, { "text": "昭化区", "value": "昭化区" }], "value": "广元市" }, { "text": "乐山市", "children": [{ "text": "峨边彝族自治县", "value": "峨边彝族自治县" }, { "text": "峨眉山市", "value": "峨眉山市" }, { "text": "夹江县", "value": "夹江县" }, { "text": "犍为县", "value": "犍为县" }, { "text": "井研县", "value": "井研县" }, { "text": "金口河区", "value": "金口河区" }, { "text": "马边彝族自治县", "value": "马边彝族自治县" }, { "text": "沐川县", "value": "沐川县" }, { "text": "沙湾区", "value": "沙湾区" }, { "text": "市中区", "value": "市中区" }, { "text": "五通桥区", "value": "五通桥区" }], "value": "乐山市" }, { "text": "凉山彝族自治州", "children": [{ "text": "布拖县", "value": "布拖县" }, { "text": "德昌县", "value": "德昌县" }, { "text": "甘洛县", "value": "甘洛县" }, { "text": "会东县", "value": "会东县" }, { "text": "会理县", "value": "会理县" }, { "text": "金阳县", "value": "金阳县" }, { "text": "雷波县", "value": "雷波县" }, { "text": "美姑县", "value": "美姑县" }, { "text": "冕宁县", "value": "冕宁县" }, { "text": "木里藏族自治县", "value": "木里藏族自治县" }, { "text": "宁南县", "value": "宁南县" }, { "text": "普格县", "value": "普格县" }, { "text": "西昌市", "value": "西昌市" }, { "text": "喜德县", "value": "喜德县" }, { "text": "盐源县", "value": "盐源县" }, { "text": "越西县", "value": "越西县" }, { "text": "昭觉县", "value": "昭觉县" }], "value": "凉山彝族自治州" }, { "text": "泸州市", "children": [{ "text": "古蔺县", "value": "古蔺县" }, { "text": "合江县", "value": "合江县" }, { "text": "江阳区", "value": "江阳区" }, { "text": "龙马潭区", "value": "龙马潭区" }, { "text": "泸县", "value": "泸县" }, { "text": "纳溪区", "value": "纳溪区" }, { "text": "叙永县", "value": "叙永县" }], "value": "泸州市" }, { "text": "眉山市", "children": [{ "text": "丹棱县", "value": "丹棱县" }, { "text": "东坡区", "value": "东坡区" }, { "text": "洪雅县", "value": "洪雅县" }, { "text": "彭山区", "value": "彭山区" }, { "text": "青神县", "value": "青神县" }, { "text": "仁寿县", "value": "仁寿县" }], "value": "眉山市" }, { "text": "绵阳市", "children": [{ "text": "安州区", "value": "安州区" }, { "text": "北川羌族自治县", "value": "北川羌族自治县" }, { "text": "涪城区", "value": "涪城区" }, { "text": "江油市", "value": "江油市" }, { "text": "平武县", "value": "平武县" }, { "text": "三台县", "value": "三台县" }, { "text": "盐亭县", "value": "盐亭县" }, { "text": "游仙区", "value": "游仙区" }, { "text": "梓潼县", "value": "梓潼县" }], "value": "绵阳市" }, { "text": "内江市", "children": [{ "text": "东兴区", "value": "东兴区" }, { "text": "隆昌市", "value": "隆昌市" }, { "text": "市中区", "value": "市中区" }, { "text": "威远县", "value": "威远县" }, { "text": "资中县", "value": "资中县" }], "value": "内江市" }, { "text": "南充市", "children": [{ "text": "高坪区", "value": "高坪区" }, { "text": "嘉陵区", "value": "嘉陵区" }, { "text": "阆中市", "value": "阆中市" }, { "text": "南部县", "value": "南部县" }, { "text": "蓬安县", "value": "蓬安县" }, { "text": "顺庆区", "value": "顺庆区" }, { "text": "西充县", "value": "西充县" }, { "text": "仪陇县", "value": "仪陇县" }, { "text": "营山县", "value": "营山县" }], "value": "南充市" }, { "text": "攀枝花市", "children": [{ "text": "东区", "value": "东区" }, { "text": "米易县", "value": "米易县" }, { "text": "仁和区", "value": "仁和区" }, { "text": "西区", "value": "西区" }, { "text": "盐边县", "value": "盐边县" }], "value": "攀枝花市" }, { "text": "遂宁市", "children": [{ "text": "安居区", "value": "安居区" }, { "text": "船山区", "value": "船山区" }, { "text": "大英县", "value": "大英县" }, { "text": "蓬溪县", "value": "蓬溪县" }, { "text": "射洪县", "value": "射洪县" }], "value": "遂宁市" }, { "text": "雅安市", "children": [{ "text": "宝兴县", "value": "宝兴县" }, { "text": "汉源县", "value": "汉源县" }, { "text": "芦山县", "value": "芦山县" }, { "text": "名山区", "value": "名山区" }, { "text": "石棉县", "value": "石棉县" }, { "text": "天全县", "value": "天全县" }, { "text": "荥经县", "value": "荥经县" }, { "text": "雨城区", "value": "雨城区" }], "value": "雅安市" }, { "text": "宜宾市", "children": [{ "text": "长宁县", "value": "长宁县" }, { "text": "翠屏区", "value": "翠屏区" }, { "text": "高县", "value": "高县" }, { "text": "珙县", "value": "珙县" }, { "text": "江安县", "value": "江安县" }, { "text": "筠连县", "value": "筠连县" }, { "text": "南溪区", "value": "南溪区" }, { "text": "屏山县", "value": "屏山县" }, { "text": "兴文县", "value": "兴文县" }, { "text": "叙州区", "value": "叙州区" }], "value": "宜宾市" }, { "text": "自贡市", "children": [{ "text": "大安区", "value": "大安区" }, { "text": "富顺县", "value": "富顺县" }, { "text": "贡井区", "value": "贡井区" }, { "text": "荣县", "value": "荣县" }, { "text": "沿滩区", "value": "沿滩区" }, { "text": "自流井区", "value": "自流井区" }], "value": "自贡市" }, { "text": "资阳市", "children": [{ "text": "安岳县", "value": "安岳县" }, { "text": "乐至县", "value": "乐至县" }, { "text": "雁江区", "value": "雁江区" }], "value": "资阳市" }] },
                {
                    "text": "台湾省",
                    "value": "台湾省",
                    "children": [{ "text": "高雄市", "children": [{ "text": "阿莲区", "value": "阿莲区" }, { "text": "大寮区", "value": "大寮区" }, { "text": "大社区", "value": "大社区" }, { "text": "大树区", "value": "大树区" }, { "text": "凤山区", "value": "凤山区" }, { "text": "冈山区", "value": "冈山区" }, { "text": "鼓山区", "value": "鼓山区" }, { "text": "湖内区", "value": "湖内区" }, { "text": "甲仙区", "value": "甲仙区" }, { "text": "苓雅区", "value": "苓雅区" }, { "text": "林园区", "value": "林园区" }, { "text": "六龟区", "value": "六龟区" }, { "text": "路竹区", "value": "路竹区" }, { "text": "茂林区", "value": "茂林区" }, { "text": "美浓区", "value": "美浓区" }, { "text": "弥陀区", "value": "弥陀区" }, { "text": "那玛夏区", "value": "那玛夏区" }, { "text": "内门区", "value": "内门区" }, { "text": "楠梓区", "value": "楠梓区" }, { "text": "鸟松区", "value": "鸟松区" }, { "text": "前金区", "value": "前金区" }, { "text": "前镇区", "value": "前镇区" }, { "text": "桥头区", "value": "桥头区" }, { "text": "茄萣区", "value": "茄萣区" }, { "text": "旗津区", "value": "旗津区" }, { "text": "旗山区", "value": "旗山区" }, { "text": "仁武区", "value": "仁武区" }, { "text": "三民区", "value": "三民区" }, { "text": "杉林区", "value": "杉林区" }, { "text": "桃源区", "value": "桃源区" }, { "text": "田寮区", "value": "田寮区" }, { "text": "小港区", "value": "小港区" }, { "text": "新兴区", "value": "新兴区" }, { "text": "燕巢区", "value": "燕巢区" }, { "text": "盐埕区", "value": "盐埕区" }, { "text": "永安区", "value": "永安区" }, { "text": "梓官区", "value": "梓官区" }, { "text": "左营区", "value": "左营区" }], "value": "高雄市" }, { "text": "花莲县", "children": [{ "text": "丰滨乡", "value": "丰滨乡" }, { "text": "凤林镇", "value": "凤林镇" }, { "text": "富里乡", "value": "富里乡" }, { "text": "光复乡", "value": "光复乡" }, { "text": "花莲市", "value": "花莲市" }, { "text": "吉安乡", "value": "吉安乡" }, { "text": "瑞穗乡", "value": "瑞穗乡" }, { "text": "寿丰乡", "value": "寿丰乡" }, { "text": "万荣乡", "value": "万荣乡" }, { "text": "新城乡", "value": "新城乡" }, { "text": "秀林乡", "value": "秀林乡" }, { "text": "玉里镇", "value": "玉里镇" }, { "text": "卓溪乡", "value": "卓溪乡" }], "value": "花莲县" }, { "text": "嘉义市", "children": [{ "text": "东区", "value": "东区" }, { "text": "西区", "value": "西区" }], "value": "嘉义市" }, { "text": "嘉义县", "children": [{ "text": "阿里山乡", "value": "阿里山乡" }, { "text": "布袋镇", "value": "布袋镇" }, { "text": "大林镇", "value": "大林镇" }, { "text": "大埔乡", "value": "大埔乡" }, { "text": "东石乡", "value": "东石乡" }, { "text": "番路乡", "value": "番路乡" }, { "text": "六脚乡", "value": "六脚乡" }, { "text": "鹿草乡", "value": "鹿草乡" }, { "text": "梅山乡", "value": "梅山乡" }, { "text": "民雄乡", "value": "民雄乡" }, { "text": "朴子市", "value": "朴子市" }, { "text": "水上乡", "value": "水上乡" }, { "text": "太保市", "value": "太保市" }, { "text": "溪口乡", "value": "溪口乡" }, { "text": "新港乡", "value": "新港乡" }, { "text": "义竹乡", "value": "义竹乡" }, { "text": "中埔乡", "value": "中埔乡" }, { "text": "竹崎乡", "value": "竹崎乡" }], "value": "嘉义县" }, { "text": "基隆市", "children": [{ "text": "安乐区", "value": "安乐区" }, { "text": "暖暖区", "value": "暖暖区" }, { "text": "七堵区", "value": "七堵区" }, { "text": "仁爱区", "value": "仁爱区" }, { "text": "信义区", "value": "信义区" }, { "text": "中山区", "value": "中山区" }, { "text": "中正区", "value": "中正区" }], "value": "基隆市" }, { "text": "苗栗县", "children": [{ "text": "大湖乡", "value": "大湖乡" }, { "text": "公馆乡", "value": "公馆乡" }, { "text": "后龙镇", "value": "后龙镇" }, { "text": "苗栗市", "value": "苗栗市" }, { "text": "南庄乡", "value": "南庄乡" }, { "text": "三湾乡", "value": "三湾乡" }, { "text": "三义乡", "value": "三义乡" }, { "text": "狮潭乡", "value": "狮潭乡" }, { "text": "泰安乡", "value": "泰安乡" }, { "text": "铜锣乡", "value": "铜锣乡" }, { "text": "通霄镇", "value": "通霄镇" }, { "text": "头份镇", "value": "头份镇" }, { "text": "头屋乡", "value": "头屋乡" }, { "text": "西湖乡", "value": "西湖乡" }, { "text": "苑里镇", "value": "苑里镇" }, { "text": "造桥乡", "value": "造桥乡" }, { "text": "竹南镇", "value": "竹南镇" }, { "text": "卓兰镇", "value": "卓兰镇" }], "value": "苗栗县" }, { "text": "南投县", "children": [{ "text": "草屯镇", "value": "草屯镇" }, { "text": "国姓乡", "value": "国姓乡" }, { "text": "集集镇", "value": "集集镇" }, { "text": "鹿谷乡", "value": "鹿谷乡" }, { "text": "名间乡", "value": "名间乡" }, { "text": "南投市", "value": "南投市" }, { "text": "埔里镇", "value": "埔里镇" }, { "text": "仁爱乡", "value": "仁爱乡" }, { "text": "水里乡", "value": "水里乡" }, { "text": "信义乡", "value": "信义乡" }, { "text": "鱼池乡", "value": "鱼池乡" }, { "text": "中寮乡", "value": "中寮乡" }, { "text": "竹山镇", "value": "竹山镇" }], "value": "南投县" }, { "text": "澎湖县", "children": [{ "text": "白沙乡", "value": "白沙乡" }, { "text": "湖西乡", "value": "湖西乡" }, { "text": "马公市", "value": "马公市" }, { "text": "七美乡", "value": "七美乡" }, { "text": "望安乡", "value": "望安乡" }, { "text": "西屿乡", "value": "西屿乡" }], "value": "澎湖县" }, { "text": "屏东县", "children": [{ "text": "枋寮乡", "value": "枋寮乡" }, { "text": "枋山乡", "value": "枋山乡" }, { "text": "长治乡", "value": "长治乡" }, { "text": "潮州镇", "value": "潮州镇" }, { "text": "车城乡", "value": "车城乡" }, { "text": "春日乡", "value": "春日乡" }, { "text": "崁顶乡", "value": "崁顶乡" }, { "text": "东港镇", "value": "东港镇" }, { "text": "高树乡", "value": "高树乡" }, { "text": "恒春镇", "value": "恒春镇" }, { "text": "佳冬乡", "value": "佳冬乡" }, { "text": "九如乡", "value": "九如乡" }, { "text": "来义乡", "value": "来义乡" }, { "text": "里港乡", "value": "里港乡" }, { "text": "林边乡", "value": "林边乡" }, { "text": "麟洛乡", "value": "麟洛乡" }, { "text": "琉球乡", "value": "琉球乡" }, { "text": "玛家乡", "value": "玛家乡" }, { "text": "满州乡", "value": "满州乡" }, { "text": "牡丹乡", "value": "牡丹乡" }, { "text": "南州乡", "value": "南州乡" }, { "text": "内埔乡", "value": "内埔乡" }, { "text": "屏东市", "value": "屏东市" }, { "text": "三地门乡", "value": "三地门乡" }, { "text": "狮子乡", "value": "狮子乡" }, { "text": "泰武乡", "value": "泰武乡" }, { "text": "万丹乡", "value": "万丹乡" }, { "text": "万峦乡", "value": "万峦乡" }, { "text": "雾台乡", "value": "雾台乡" }, { "text": "新埤乡", "value": "新埤乡" }, { "text": "新园乡", "value": "新园乡" }, { "text": "盐埔乡", "value": "盐埔乡" }, { "text": "竹田乡", "value": "竹田乡" }], "value": "屏东县" }, { "text": "台北市", "children": [{ "text": "北投区", "value": "北投区" }, { "text": "大安区", "value": "大安区" }, { "text": "大同区", "value": "大同区" }, { "text": "内湖区", "value": "内湖区" }, { "text": "南港区", "value": "南港区" }, { "text": "士林区", "value": "士林区" }, { "text": "松山区", "value": "松山区" }, { "text": "万华区", "value": "万华区" }, { "text": "文山区", "value": "文山区" }, { "text": "信义区", "value": "信义区" }, { "text": "中山区", "value": "中山区" }, { "text": "中正区", "value": "中正区" }], "value": "台北市" }, { "text": "台东县", "children": [{ "text": "卑南乡", "value": "卑南乡" }, { "text": "长滨乡", "value": "长滨乡" }, { "text": "成功镇", "value": "成功镇" }, { "text": "池上乡", "value": "池上乡" }, { "text": "达仁乡", "value": "达仁乡" }, { "text": "大武乡", "value": "大武乡" }, { "text": "东河乡", "value": "东河乡" }, { "text": "关山镇", "value": "关山镇" }, { "text": "海端乡", "value": "海端乡" }, { "text": "金峰乡", "value": "金峰乡" }, { "text": "兰屿乡", "value": "兰屿乡" }, { "text": "鹿野乡", "value": "鹿野乡" }, { "text": "绿岛乡", "value": "绿岛乡" }, { "text": "台东市", "value": "台东市" }, { "text": "太麻里乡", "value": "太麻里乡" }, { "text": "延平乡", "value": "延平乡" }], "value": "台东县" }, { "text": "台南市", "children": [{ "text": "安定区", "value": "安定区" }, { "text": "安南区", "value": "安南区" }, { "text": "安平区", "value": "安平区" }, { "text": "白河区", "value": "白河区" }, { "text": "北门区", "value": "北门区" }, { "text": "北区", "value": "北区" }, { "text": "大内区", "value": "大内区" }, { "text": "东区", "value": "东区" }, { "text": "东山区", "value": "东山区" }, { "text": "关庙区", "value": "关庙区" }, { "text": "官田区", "value": "官田区" }, { "text": "归仁区", "value": "归仁区" }, { "text": "后壁区", "value": "后壁区" }, { "text": "佳里区", "value": "佳里区" }, { "text": "将军区", "value": "将军区" }, { "text": "六甲区", "value": "六甲区" }, { "text": "柳营区", "value": "柳营区" }, { "text": "龙崎区", "value": "龙崎区" }, { "text": "麻豆区", "value": "麻豆区" }, { "text": "南化区", "value": "南化区" }, { "text": "南区", "value": "南区" }, { "text": "楠西区", "value": "楠西区" }, { "text": "七股区", "value": "七股区" }, { "text": "仁德区", "value": "仁德区" }, { "text": "善化区", "value": "善化区" }, { "text": "山上区", "value": "山上区" }, { "text": "下营区", "value": "下营区" }, { "text": "西港区", "value": "西港区" }, { "text": "新化区", "value": "新化区" }, { "text": "新市区", "value": "新市区" }, { "text": "新营区", "value": "新营区" }, { "text": "学甲区", "value": "学甲区" }, { "text": "盐水区", "value": "盐水区" }, { "text": "永康区", "value": "永康区" }, { "text": "玉井区", "value": "玉井区" }, { "text": "中西区", "value": "中西区" }, { "text": "左镇区", "value": "左镇区" }], "value": "台南市" }, { "text": "台中市", "children": [{ "text": "北区", "value": "北区" }, { "text": "北屯区", "value": "北屯区" }, { "text": "大安区", "value": "大安区" }, { "text": "大肚区", "value": "大肚区" }, { "text": "大甲区", "value": "大甲区" }, { "text": "大里区", "value": "大里区" }, { "text": "大雅区", "value": "大雅区" }, { "text": "东区", "value": "东区" }, { "text": "东势区", "value": "东势区" }, { "text": "丰原区", "value": "丰原区" }, { "text": "和平区", "value": "和平区" }, { "text": "后里区", "value": "后里区" }, { "text": "龙井区", "value": "龙井区" }, { "text": "南区", "value": "南区" }, { "text": "南屯区", "value": "南屯区" }, { "text": "清水区", "value": "清水区" }, { "text": "沙鹿区", "value": "沙鹿区" }, { "text": "神冈区", "value": "神冈区" }, { "text": "石冈区", "value": "石冈区" }, { "text": "太平区", "value": "太平区" }, { "text": "潭子区", "value": "潭子区" }, { "text": "外埔区", "value": "外埔区" }, { "text": "雾峰区", "value": "雾峰区" }, { "text": "梧栖区", "value": "梧栖区" }, { "text": "乌日区", "value": "乌日区" }, { "text": "新社区", "value": "新社区" }, { "text": "西区", "value": "西区" }, { "text": "西屯区", "value": "西屯区" }, { "text": "中区", "value": "中区" }], "value": "台中市" }, { "text": "桃园市", "children": [{ "text": "八德市", "value": "八德市" }, { "text": "大溪镇", "value": "大溪镇" }, { "text": "大园乡", "value": "大园乡" }, { "text": "复兴乡", "value": "复兴乡" }, { "text": "观音乡", "value": "观音乡" }, { "text": "龟山乡", "value": "龟山乡" }, { "text": "龙潭乡", "value": "龙潭乡" }, { "text": "芦竹乡", "value": "芦竹乡" }, { "text": "平镇市", "value": "平镇市" }, { "text": "桃园区", "value": "桃园区" }, { "text": "新屋乡", "value": "新屋乡" }, { "text": "杨梅市", "value": "杨梅市" }, { "text": "中坜市", "value": "中坜市" }], "value": "桃园市" }, {
                        "text": "新北市",
                        "children": [{ "text": "八里区", "value": "八里区" }, { "text": "板桥区", "value": "板桥区" }, { "text": "淡水区", "value": "淡水区" }, { "text": "贡寮区", "value": "贡寮区" }, { "text": "金山区", "value": "金山区" }, { "text": "林口区", "value": "林口区" }, { "text": "芦洲区", "value": "芦洲区" }, { "text": "坪林区", "value": "坪林区" },
                            { "text": "平溪区", "value": "平溪区" }, { "text": "瑞芳区", "value": "瑞芳区" }, { "text": "三峡区", "value": "三峡区" }, { "text": "三芝区", "value": "三芝区" }, { "text": "三重区", "value": "三重区" }, { "text": "深坑区", "value": "深坑区" }, { "text": "石碇区", "value": "石碇区" }, { "text": "石门区", "value": "石门区" }, { "text": "双溪区", "value": "双溪区" }, { "text": "树林区", "value": "树林区" }, { "text": "泰山区", "value": "泰山区" }, { "text": "土城区", "value": "土城区" }, { "text": "万里区", "value": "万里区" }, { "text": "五股区", "value": "五股区" }, { "text": "乌来区", "value": "乌来区" }, { "text": "新店区", "value": "新店区" }, { "text": "新庄区", "value": "新庄区" }, { "text": "汐止区", "value": "汐止区" }, { "text": "莺歌区", "value": "莺歌区" }, { "text": "永和区", "value": "永和区" }, { "text": "中和区", "value": "中和区" }
                        ],
                        "value": "新北市"
                    }, { "text": "新竹市", "children": [{ "text": "北区", "value": "北区" }, { "text": "东区", "value": "东区" }, { "text": "香山区", "value": "香山区" }], "value": "新竹市" }, { "text": "新竹县", "children": [{ "text": "宝山乡", "value": "宝山乡" }, { "text": "北埔乡", "value": "北埔乡" }, { "text": "峨眉乡", "value": "峨眉乡" }, { "text": "关西镇", "value": "关西镇" }, { "text": "横山乡", "value": "横山乡" }, { "text": "湖口乡", "value": "湖口乡" }, { "text": "尖石乡", "value": "尖石乡" }, { "text": "五峰乡", "value": "五峰乡" }, { "text": "新丰乡", "value": "新丰乡" }, { "text": "新埔镇", "value": "新埔镇" }, { "text": "芎林乡", "value": "芎林乡" }, { "text": "竹北市", "value": "竹北市" }, { "text": "竹东镇", "value": "竹东镇" }], "value": "新竹县" }, { "text": "宜兰县", "children": [{ "text": "大同乡", "value": "大同乡" }, { "text": "冬山乡", "value": "冬山乡" }, { "text": "礁溪乡", "value": "礁溪乡" }, { "text": "罗东镇", "value": "罗东镇" }, { "text": "南澳乡", "value": "南澳乡" }, { "text": "三星乡", "value": "三星乡" }, { "text": "苏澳镇", "value": "苏澳镇" }, { "text": "头城镇", "value": "头城镇" }, { "text": "五结乡", "value": "五结乡" }, { "text": "宜兰市", "value": "宜兰市" }, { "text": "员山乡", "value": "员山乡" }, { "text": "壮围乡", "value": "壮围乡" }], "value": "宜兰县" }, { "text": "云林县", "children": [{ "text": "褒忠乡", "value": "褒忠乡" }, { "text": "北港镇", "value": "北港镇" }, { "text": "大埤乡", "value": "大埤乡" }, { "text": "东势乡", "value": "东势乡" }, { "text": "斗六市", "value": "斗六市" }, { "text": "斗南镇", "value": "斗南镇" }, { "text": "二仑乡", "value": "二仑乡" }, { "text": "古坑乡", "value": "古坑乡" }, { "text": "虎尾镇", "value": "虎尾镇" }, { "text": "口湖乡", "value": "口湖乡" }, { "text": "林内乡", "value": "林内乡" }, { "text": "仑背乡", "value": "仑背乡" }, { "text": "麦寮乡", "value": "麦寮乡" }, { "text": "水林乡", "value": "水林乡" }, { "text": "四湖乡", "value": "四湖乡" }, { "text": "台西乡", "value": "台西乡" }, { "text": "莿桐乡", "value": "莿桐乡" }, { "text": "土库镇", "value": "土库镇" }, { "text": "西螺镇", "value": "西螺镇" }, { "text": "元长乡", "value": "元长乡" }], "value": "云林县" }, { "text": "彰化县", "children": [{ "text": "北斗镇", "value": "北斗镇" }, { "text": "埤头乡", "value": "埤头乡" }, { "text": "大城乡", "value": "大城乡" }, { "text": "大村乡", "value": "大村乡" }, { "text": "二林镇", "value": "二林镇" }, { "text": "二水乡", "value": "二水乡" }, { "text": "芳苑乡", "value": "芳苑乡" }, { "text": "芬园乡", "value": "芬园乡" }, { "text": "福兴乡", "value": "福兴乡" }, { "text": "和美镇", "value": "和美镇" }, { "text": "花坛乡", "value": "花坛乡" }, { "text": "鹿港镇", "value": "鹿港镇" }, { "text": "埔心乡", "value": "埔心乡" }, { "text": "埔盐乡", "value": "埔盐乡" }, { "text": "伸港乡", "value": "伸港乡" }, { "text": "社头乡", "value": "社头乡" }, { "text": "田尾乡", "value": "田尾乡" }, { "text": "田中镇", "value": "田中镇" }, { "text": "线西乡", "value": "线西乡" }, { "text": "溪湖镇", "value": "溪湖镇" }, { "text": "秀水乡", "value": "秀水乡" }, { "text": "溪州乡", "value": "溪州乡" }, { "text": "永靖乡", "value": "永靖乡" }, { "text": "员林镇", "value": "员林镇" }, { "text": "彰化市", "value": "彰化市" }, { "text": "竹塘乡", "value": "竹塘乡" }], "value": "彰化县" }]
                },
                { "text": "天津市", "value": "天津市", "children": [{ "text": "天津城区", "children": [{ "text": "宝坻区", "value": "宝坻区" }, { "text": "北辰区", "value": "北辰区" }, { "text": "滨海新区", "value": "滨海新区" }, { "text": "东丽区", "value": "东丽区" }, { "text": "河北区", "value": "河北区" }, { "text": "河东区", "value": "河东区" }, { "text": "和平区", "value": "和平区" }, { "text": "河西区", "value": "河西区" }, { "text": "红桥区", "value": "红桥区" }, { "text": "静海区", "value": "静海区" }, { "text": "津南区", "value": "津南区" }, { "text": "蓟州区", "value": "蓟州区" }, { "text": "南开区", "value": "南开区" }, { "text": "宁河区", "value": "宁河区" }, { "text": "武清区", "value": "武清区" }, { "text": "西青区", "value": "西青区" }], "value": "天津城区" }] },
                { "text": "香港特别行政区", "value": "香港特别行政区", "children": [{ "text": "香港城区", "children": [{ "text": "北区", "value": "北区" }, { "text": "大埔区", "value": "大埔区" }, { "text": "东区", "value": "东区" }, { "text": "观塘区", "value": "观塘区" }, { "text": "黄大仙区", "value": "黄大仙区" }, { "text": "九龙城区", "value": "九龙城区" }, { "text": "葵青区", "value": "葵青区" }, { "text": "离岛区", "value": "离岛区" }, { "text": "南区", "value": "南区" }, { "text": "荃湾区", "value": "荃湾区" }, { "text": "沙田区", "value": "沙田区" }, { "text": "深水埗区", "value": "深水埗区" }, { "text": "屯门区", "value": "屯门区" }, { "text": "湾仔区", "value": "湾仔区" }, { "text": "西贡区", "value": "西贡区" }, { "text": "油尖旺区", "value": "油尖旺区" }, { "text": "元朗区", "value": "元朗区" }, { "text": "中西区", "value": "中西区" }], "value": "香港城区" }] }, { "text": "西藏自治区", "value": "西藏自治区", "children": [{ "text": "阿里地区", "children": [{ "text": "措勤县", "value": "措勤县" }, { "text": "噶尔县", "value": "噶尔县" }, { "text": "改则县", "value": "改则县" }, { "text": "革吉县", "value": "革吉县" }, { "text": "普兰县", "value": "普兰县" }, { "text": "日土县", "value": "日土县" }, { "text": "札达县", "value": "札达县" }], "value": "阿里地区" }, { "text": "昌都市", "children": [{ "text": "八宿县", "value": "八宿县" }, { "text": "边坝县", "value": "边坝县" }, { "text": "察雅县", "value": "察雅县" }, { "text": "丁青县", "value": "丁青县" }, { "text": "贡觉县", "value": "贡觉县" }, { "text": "江达县", "value": "江达县" }, { "text": "卡若区", "value": "卡若区" }, { "text": "类乌齐县", "value": "类乌齐县" }, { "text": "洛隆县", "value": "洛隆县" }, { "text": "芒康县", "value": "芒康县" }, { "text": "左贡县", "value": "左贡县" }], "value": "昌都市" }, { "text": "拉萨市", "children": [{ "text": "城关区", "value": "城关区" }, { "text": "当雄县", "value": "当雄县" }, { "text": "达孜区", "value": "达孜区" }, { "text": "堆龙德庆区", "value": "堆龙德庆区" }, { "text": "林周县", "value": "林周县" }, { "text": "墨竹工卡县", "value": "墨竹工卡县" }, { "text": "尼木县", "value": "尼木县" }, { "text": "曲水县", "value": "曲水县" }], "value": "拉萨市" }, { "text": "林芝市", "children": [{ "text": "巴宜区", "value": "巴宜区" }, { "text": "波密县", "value": "波密县" }, { "text": "察隅县", "value": "察隅县" }, { "text": "工布江达县", "value": "工布江达县" }, { "text": "朗县", "value": "朗县" }, { "text": "米林县", "value": "米林县" }, { "text": "墨脱县", "value": "墨脱县" }], "value": "林芝市" }, { "text": "那曲市", "children": [{ "text": "安多县", "value": "安多县" }, { "text": "班戈县", "value": "班戈县" }, { "text": "巴青县", "value": "巴青县" }, { "text": "比如县", "value": "比如县" }, { "text": "嘉黎县", "value": "嘉黎县" }, { "text": "聂荣县", "value": "聂荣县" }, { "text": "尼玛县", "value": "尼玛县" }, { "text": "色尼区", "value": "色尼区" }, { "text": "申扎县", "value": "申扎县" }, { "text": "双湖县", "value": "双湖县" }, { "text": "索县", "value": "索县" }], "value": "那曲市" }, { "text": "日喀则市", "children": [{ "text": "昂仁县", "value": "昂仁县" }, { "text": "白朗县", "value": "白朗县" }, { "text": "定结县", "value": "定结县" }, { "text": "定日县", "value": "定日县" }, { "text": "岗巴县", "value": "岗巴县" }, { "text": "江孜县", "value": "江孜县" }, { "text": "吉隆县", "value": "吉隆县" }, { "text": "康马县", "value": "康马县" }, { "text": "拉孜县", "value": "拉孜县" }, { "text": "南木林县", "value": "南木林县" }, { "text": "聂拉木县", "value": "聂拉木县" }, { "text": "仁布县", "value": "仁布县" }, { "text": "萨嘎县", "value": "萨嘎县" }, { "text": "萨迦县", "value": "萨迦县" }, { "text": "桑珠孜区", "value": "桑珠孜区" }, { "text": "谢通门县", "value": "谢通门县" }, { "text": "亚东县", "value": "亚东县" }, { "text": "仲巴县", "value": "仲巴县" }], "value": "日喀则市" }, { "text": "山南市", "children": [{ "text": "措美县", "value": "措美县" }, { "text": "错那县", "value": "错那县" }, { "text": "贡嘎县", "value": "贡嘎县" }, { "text": "加查县", "value": "加查县" }, { "text": "浪卡子县", "value": "浪卡子县" }, { "text": "隆子县", "value": "隆子县" }, { "text": "洛扎县", "value": "洛扎县" }, { "text": "乃东区", "value": "乃东区" }, { "text": "琼结县", "value": "琼结县" }, { "text": "曲松县", "value": "曲松县" }, { "text": "桑日县", "value": "桑日县" }, { "text": "扎囊县", "value": "扎囊县" }], "value": "山南市" }] },
                {
                    "text": "新疆维吾尔自治区",
                    "value": "新疆维吾尔自治区",
                    "children": [{ "text": "阿克苏地区", "children": [{ "text": "阿克苏市", "value": "阿克苏市" }, { "text": "阿瓦提县", "value": "阿瓦提县" }, { "text": "拜城县", "value": "拜城县" }, { "text": "柯坪县", "value": "柯坪县" }, { "text": "库车县", "value": "库车县" }, { "text": "沙雅县", "value": "沙雅县" }, { "text": "温宿县", "value": "温宿县" }, { "text": "乌什县", "value": "乌什县" }, { "text": "新和县", "value": "新和县" }], "value": "阿克苏地区" }, { "text": "阿拉尔市", "children": [{ "text": "阿拉尔农场", "value": "阿拉尔农场" }, { "text": "兵团八团", "value": "兵团八团" }, { "text": "兵团第一师水利水电工程处", "value": "兵团第一师水利水电工程处" }, { "text": "兵团第一师塔里木灌区水利管理处", "value": "兵团第一师塔里木灌区水利管理处" }, { "text": "兵团第一师幸福农场", "value": "兵团第一师幸福农场" }, { "text": "兵团七团", "value": "兵团七团" }, { "text": "兵团十二团", "value": "兵团十二团" }, { "text": "兵团十六团", "value": "兵团十六团" }, { "text": "兵团十三团", "value": "兵团十三团" }, { "text": "兵团十四团", "value": "兵团十四团" }, { "text": "兵团十团", "value": "兵团十团" }, { "text": "兵团十一团", "value": "兵团十一团" }, { "text": "工业园区", "value": "工业园区" }, { "text": "金银川路街道", "value": "金银川路街道" }, { "text": "南口街道", "value": "南口街道" }, { "text": "青松路街道", "value": "青松路街道" }, { "text": "托喀依乡", "value": "托喀依乡" }, { "text": "幸福路街道", "value": "幸福路街道" }, { "text": "中心监狱", "value": "中心监狱" }], "value": "阿拉尔市" }, { "text": "阿勒泰地区", "children": [{ "text": "阿勒泰市", "value": "阿勒泰市" }, { "text": "布尔津县", "value": "布尔津县" }, { "text": "福海县", "value": "福海县" }, { "text": "富蕴县", "value": "富蕴县" }, { "text": "哈巴河县", "value": "哈巴河县" }, { "text": "吉木乃县", "value": "吉木乃县" }, { "text": "青河县", "value": "青河县" }], "value": "阿勒泰地区" }, { "text": "巴音郭楞蒙古自治州", "children": [{ "text": "博湖县", "value": "博湖县" }, { "text": "和静县", "value": "和静县" }, { "text": "和硕县", "value": "和硕县" }, { "text": "库尔勒市", "value": "库尔勒市" }, { "text": "轮台县", "value": "轮台县" }, { "text": "且末县", "value": "且末县" }, { "text": "若羌县", "value": "若羌县" }, { "text": "尉犁县", "value": "尉犁县" }, { "text": "焉耆回族自治县", "value": "焉耆回族自治县" }], "value": "巴音郭楞蒙古自治州" }, { "text": "北屯市", "children": [{ "text": "北屯镇", "value": "北屯镇" }, { "text": "兵团一八八团", "value": "兵团一八八团" }, { "text": "兵团一八七团", "value": "兵团一八七团" }, { "text": "兵团一八三团", "value": "兵团一八三团" }], "value": "北屯市" }, { "text": "博尔塔拉蒙古自治州", "children": [{ "text": "阿拉山口市", "value": "阿拉山口市" }, { "text": "博乐市", "value": "博乐市" }, { "text": "精河县", "value": "精河县" }, { "text": "温泉县", "value": "温泉县" }], "value": "博尔塔拉蒙古自治州" }, { "text": "昌吉回族自治州", "children": [{ "text": "昌吉市", "value": "昌吉市" }, { "text": "阜康市", "value": "阜康市" }, { "text": "呼图壁县", "value": "呼图壁县" }, { "text": "吉木萨尔县", "value": "吉木萨尔县" }, { "text": "玛纳斯县", "value": "玛纳斯县" }, { "text": "木垒哈萨克自治县", "value": "木垒哈萨克自治县" }, { "text": "奇台县", "value": "奇台县" }], "value": "昌吉回族自治州" }, { "text": "哈密市", "children": [{ "text": "巴里坤哈萨克自治县", "value": "巴里坤哈萨克自治县" }, { "text": "伊吾县", "value": "伊吾县" }, { "text": "伊州区", "value": "伊州区" }], "value": "哈密市" }, { "text": "和田地区", "children": [{ "text": "策勒县", "value": "策勒县" }, { "text": "和田市", "value": "和田市" }, { "text": "和田县", "value": "和田县" }, { "text": "洛浦县", "value": "洛浦县" }, { "text": "民丰县", "value": "民丰县" }, { "text": "墨玉县", "value": "墨玉县" }, { "text": "皮山县", "value": "皮山县" }, { "text": "于田县", "value": "于田县" }], "value": "和田地区" }, { "text": "喀什地区", "children": [{ "text": "巴楚县", "value": "巴楚县" }, { "text": "伽师县", "value": "伽师县" }, { "text": "喀什市", "value": "喀什市" }, { "text": "麦盖提县", "value": "麦盖提县" }, { "text": "莎车县", "value": "莎车县" }, { "text": "疏附县", "value": "疏附县" }, { "text": "疏勒县", "value": "疏勒县" }, { "text": "塔什库尔干塔吉克自治县", "value": "塔什库尔干塔吉克自治县" }, { "text": "叶城县", "value": "叶城县" }, { "text": "英吉沙县", "value": "英吉沙县" }, { "text": "岳普湖县", "value": "岳普湖县" }, { "text": "泽普县", "value": "泽普县" }], "value": "喀什地区" }, { "text": "可克达拉市", "children": [{ "text": "兵团六十八团", "value": "兵团六十八团" }, { "text": "兵团六十六团", "value": "兵团六十六团" }, { "text": "兵团六十七团", "value": "兵团六十七团" }, { "text": "兵团六十三团", "value": "兵团六十三团" }, { "text": "兵团六十四团", "value": "兵团六十四团" }, { "text": "都拉塔口岸", "value": "都拉塔口岸" }], "value": "可克达拉市" }, { "text": "克拉玛依市", "children": [{ "text": "白碱滩区", "value": "白碱滩区" }, { "text": "独山子区", "value": "独山子区" }, { "text": "克拉玛依区", "value": "克拉玛依区" }, { "text": "乌尔禾区", "value": "乌尔禾区" }], "value": "克拉玛依市" }, { "text": "克孜勒苏柯尔克孜自治州", "children": [{ "text": "阿合奇县", "value": "阿合奇县" }, { "text": "阿克陶县", "value": "阿克陶县" }, { "text": "阿图什市", "value": "阿图什市" }, { "text": "乌恰县", "value": "乌恰县" }], "value": "克孜勒苏柯尔克孜自治州" }, { "text": "昆玉市", "children": [{ "text": "兵团二二四团", "value": "兵团二二四团" }, { "text": "兵团皮山农场", "value": "兵团皮山农场" }, { "text": "兵团四十七团", "value": "兵团四十七团" }, { "text": "兵团一牧场", "value": "兵团一牧场" }, { "text": "博斯坦乡", "value": "博斯坦乡" }, { "text": "喀拉喀什镇", "value": "喀拉喀什镇" }, { "text": "阔依其乡", "value": "阔依其乡" }, { "text": "奴尔乡", "value": "奴尔乡" }, { "text": "普恰克其乡", "value": "普恰克其乡" }, { "text": "乌尔其乡", "value": "乌尔其乡" }, { "text": "乌鲁克萨依乡", "value": "乌鲁克萨依乡" }], "value": "昆玉市" }, { "text": "石河子市", "children": [{ "text": "北泉镇", "value": "北泉镇" }, { "text": "兵团一五二团", "value": "兵团一五二团" }, { "text": "东城街道", "value": "东城街道" }, { "text": "红山街道", "value": "红山街道" }, { "text": "老街街道", "value": "老街街道" }, { "text": "石河子乡", "value": "石河子乡" }, { "text": "向阳街道", "value": "向阳街道" }, { "text": "新城街道", "value": "新城街道" }], "value": "石河子市" }, { "text": "双河市", "children": [{ "text": "兵团八十九团", "value": "兵团八十九团" }, { "text": "兵团八十六团", "value": "兵团八十六团" }, { "text": "兵团八十四团", "value": "兵团八十四团" }, { "text": "兵团八十一团", "value": "兵团八十一团" }, { "text": "兵团九十团", "value": "兵团九十团" }], "value": "双河市" }, { "text": "塔城地区", "children": [{ "text": "额敏县", "value": "额敏县" }, { "text": "和布克赛尔蒙古自治县", "value": "和布克赛尔蒙古自治县" }, { "text": "沙湾县", "value": "沙湾县" }, { "text": "塔城市", "value": "塔城市" }, { "text": "托里县", "value": "托里县" }, { "text": "乌苏市", "value": "乌苏市" }, { "text": "裕民县", "value": "裕民县" }], "value": "塔城地区" }, { "text": "铁门关市", "children": [{ "text": "兵团二十九团", "value": "兵团二十九团" }, { "text": "农二师三十团", "value": "农二师三十团" }], "value": "铁门关市" }, { "text": "吐鲁番市", "children": [{ "text": "高昌区", "value": "高昌区" }, { "text": "鄯善县", "value": "鄯善县" }, { "text": "托克逊县", "value": "托克逊县" }], "value": "吐鲁番市" },
                        {
                            "text": "图木舒克市",
                            "children": [{ "text": "兵团四十九团", "value": "兵团四十九团" }, { "text": "兵团四十四团", "value": "兵团四十四团" }, { "text": "兵团图木舒克市喀拉拜勒镇", "value": "兵团图木舒克市喀拉拜勒镇" },
                                { "text": "兵团图木舒克市永安坝", "value": "兵团图木舒克市永安坝" }, { "text": "兵团五十三团", "value": "兵团五十三团" }, { "text": "兵团五十团", "value": "兵团五十团" }, { "text": "兵团五十一团", "value": "兵团五十一团" }, { "text": "前海街道", "value": "前海街道" }, { "text": "齐干却勒街道", "value": "齐干却勒街道" }, { "text": "永安坝街道", "value": "永安坝街道" }
                            ],
                            "value": "图木舒克市"
                        }, { "text": "五家渠市", "children": [{ "text": "兵团一零二团", "value": "兵团一零二团" }, { "text": "兵团一零三团", "value": "兵团一零三团" }, { "text": "兵团一零一团", "value": "兵团一零一团" }, { "text": "军垦路街道", "value": "军垦路街道" }, { "text": "青湖路街道", "value": "青湖路街道" }, { "text": "人民路街道", "value": "人民路街道" }], "value": "五家渠市" }, { "text": "乌鲁木齐市", "children": [{ "text": "达坂城区", "value": "达坂城区" }, { "text": "米东区", "value": "米东区" }, { "text": "沙依巴克区", "value": "沙依巴克区" }, { "text": "水磨沟区", "value": "水磨沟区" }, { "text": "天山区", "value": "天山区" }, { "text": "头屯河区", "value": "头屯河区" }, { "text": "乌鲁木齐县", "value": "乌鲁木齐县" }, { "text": "新市区", "value": "新市区" }], "value": "乌鲁木齐市" }, { "text": "伊犁哈萨克自治州", "children": [{ "text": "察布查尔锡伯自治县", "value": "察布查尔锡伯自治县" }, { "text": "巩留县", "value": "巩留县" }, { "text": "霍城县", "value": "霍城县" }, { "text": "霍尔果斯市", "value": "霍尔果斯市" }, { "text": "奎屯市", "value": "奎屯市" }, { "text": "尼勒克县", "value": "尼勒克县" }, { "text": "特克斯县", "value": "特克斯县" }, { "text": "新源县", "value": "新源县" }, { "text": "伊宁市", "value": "伊宁市" }, { "text": "伊宁县", "value": "伊宁县" }, { "text": "昭苏县", "value": "昭苏县" }], "value": "伊犁哈萨克自治州" }
                    ]
                },
                { "text": "云南省", "value": "云南省", "children": [{ "text": "保山市", "children": [{ "text": "昌宁县", "value": "昌宁县" }, { "text": "龙陵县", "value": "龙陵县" }, { "text": "隆阳区", "value": "隆阳区" }, { "text": "施甸县", "value": "施甸县" }, { "text": "腾冲市", "value": "腾冲市" }], "value": "保山市" }, { "text": "楚雄彝族自治州", "children": [{ "text": "楚雄市", "value": "楚雄市" }, { "text": "大姚县", "value": "大姚县" }, { "text": "禄丰县", "value": "禄丰县" }, { "text": "牟定县", "value": "牟定县" }, { "text": "南华县", "value": "南华县" }, { "text": "双柏县", "value": "双柏县" }, { "text": "武定县", "value": "武定县" }, { "text": "姚安县", "value": "姚安县" }, { "text": "永仁县", "value": "永仁县" }, { "text": "元谋县", "value": "元谋县" }], "value": "楚雄彝族自治州" }, { "text": "大理白族自治州", "children": [{ "text": "宾川县", "value": "宾川县" }, { "text": "大理市", "value": "大理市" }, { "text": "洱源县", "value": "洱源县" }, { "text": "鹤庆县", "value": "鹤庆县" }, { "text": "剑川县", "value": "剑川县" }, { "text": "弥渡县", "value": "弥渡县" }, { "text": "南涧彝族自治县", "value": "南涧彝族自治县" }, { "text": "巍山彝族回族自治县", "value": "巍山彝族回族自治县" }, { "text": "祥云县", "value": "祥云县" }, { "text": "漾濞彝族自治县", "value": "漾濞彝族自治县" }, { "text": "永平县", "value": "永平县" }, { "text": "云龙县", "value": "云龙县" }], "value": "大理白族自治州" }, { "text": "德宏傣族景颇族自治州", "children": [{ "text": "梁河县", "value": "梁河县" }, { "text": "陇川县", "value": "陇川县" }, { "text": "芒市", "value": "芒市" }, { "text": "瑞丽市", "value": "瑞丽市" }, { "text": "盈江县", "value": "盈江县" }], "value": "德宏傣族景颇族自治州" }, { "text": "迪庆藏族自治州", "children": [{ "text": "德钦县", "value": "德钦县" }, { "text": "维西傈僳族自治县", "value": "维西傈僳族自治县" }, { "text": "香格里拉市", "value": "香格里拉市" }], "value": "迪庆藏族自治州" }, { "text": "红河哈尼族彝族自治州", "children": [{ "text": "个旧市", "value": "个旧市" }, { "text": "河口瑶族自治县", "value": "河口瑶族自治县" }, { "text": "红河县", "value": "红河县" }, { "text": "建水县", "value": "建水县" }, { "text": "金平苗族瑶族傣族自治县", "value": "金平苗族瑶族傣族自治县" }, { "text": "开远市", "value": "开远市" }, { "text": "泸西县", "value": "泸西县" }, { "text": "绿春县", "value": "绿春县" }, { "text": "蒙自市", "value": "蒙自市" }, { "text": "弥勒市", "value": "弥勒市" }, { "text": "屏边苗族自治县", "value": "屏边苗族自治县" }, { "text": "石屏县", "value": "石屏县" }, { "text": "元阳县", "value": "元阳县" }], "value": "红河哈尼族彝族自治州" }, { "text": "昆明市", "children": [{ "text": "安宁市", "value": "安宁市" }, { "text": "呈贡区", "value": "呈贡区" }, { "text": "东川区", "value": "东川区" }, { "text": "富民县", "value": "富民县" }, { "text": "官渡区", "value": "官渡区" }, { "text": "晋宁区", "value": "晋宁区" }, { "text": "禄劝彝族苗族自治县", "value": "禄劝彝族苗族自治县" }, { "text": "盘龙区", "value": "盘龙区" }, { "text": "石林彝族自治县", "value": "石林彝族自治县" }, { "text": "嵩明县", "value": "嵩明县" }, { "text": "五华区", "value": "五华区" }, { "text": "西山区", "value": "西山区" }, { "text": "寻甸回族彝族自治县", "value": "寻甸回族彝族自治县" }, { "text": "宜良县", "value": "宜良县" }], "value": "昆明市" }, { "text": "丽江市", "children": [{ "text": "古城区", "value": "古城区" }, { "text": "华坪县", "value": "华坪县" }, { "text": "宁蒗彝族自治县", "value": "宁蒗彝族自治县" }, { "text": "永胜县", "value": "永胜县" }, { "text": "玉龙纳西族自治县", "value": "玉龙纳西族自治县" }], "value": "丽江市" }, { "text": "临沧市", "children": [{ "text": "沧源佤族自治县", "value": "沧源佤族自治县" }, { "text": "凤庆县", "value": "凤庆县" }, { "text": "耿马傣族佤族自治县", "value": "耿马傣族佤族自治县" }, { "text": "临翔区", "value": "临翔区" }, { "text": "双江拉祜族佤族布朗族傣族自治县", "value": "双江拉祜族佤族布朗族傣族自治县" }, { "text": "永德县", "value": "永德县" }, { "text": "云县", "value": "云县" }, { "text": "镇康县", "value": "镇康县" }], "value": "临沧市" }, { "text": "怒江傈僳族自治州", "children": [{ "text": "福贡县", "value": "福贡县" }, { "text": "贡山独龙族怒族自治县", "value": "贡山独龙族怒族自治县" }, { "text": "兰坪白族普米族自治县", "value": "兰坪白族普米族自治县" }, { "text": "泸水市", "value": "泸水市" }], "value": "怒江傈僳族自治州" }, { "text": "普洱市", "children": [{ "text": "江城哈尼族彝族自治县", "value": "江城哈尼族彝族自治县" }, { "text": "景东彝族自治县", "value": "景东彝族自治县" }, { "text": "景谷傣族彝族自治县", "value": "景谷傣族彝族自治县" }, { "text": "澜沧拉祜族自治县", "value": "澜沧拉祜族自治县" }, { "text": "孟连傣族拉祜族佤族自治县", "value": "孟连傣族拉祜族佤族自治县" }, { "text": "墨江哈尼族自治县", "value": "墨江哈尼族自治县" }, { "text": "宁洱哈尼族彝族自治县", "value": "宁洱哈尼族彝族自治县" }, { "text": "思茅区", "value": "思茅区" }, { "text": "西盟佤族自治县", "value": "西盟佤族自治县" }, { "text": "镇沅彝族哈尼族拉祜族自治县", "value": "镇沅彝族哈尼族拉祜族自治县" }], "value": "普洱市" }, { "text": "曲靖市", "children": [{ "text": "富源县", "value": "富源县" }, { "text": "会泽县", "value": "会泽县" }, { "text": "陆良县", "value": "陆良县" }, { "text": "罗平县", "value": "罗平县" }, { "text": "马龙区", "value": "马龙区" }, { "text": "麒麟区", "value": "麒麟区" }, { "text": "师宗县", "value": "师宗县" }, { "text": "宣威市", "value": "宣威市" }, { "text": "沾益区", "value": "沾益区" }], "value": "曲靖市" }, { "text": "文山壮族苗族自治州", "children": [{ "text": "富宁县", "value": "富宁县" }, { "text": "广南县", "value": "广南县" }, { "text": "马关县", "value": "马关县" }, { "text": "麻栗坡县", "value": "麻栗坡县" }, { "text": "丘北县", "value": "丘北县" }, { "text": "文山市", "value": "文山市" }, { "text": "西畴县", "value": "西畴县" }, { "text": "砚山县", "value": "砚山县" }], "value": "文山壮族苗族自治州" }, { "text": "西双版纳傣族自治州", "children": [{ "text": "景洪市", "value": "景洪市" }, { "text": "勐海县", "value": "勐海县" }, { "text": "勐腊县", "value": "勐腊县" }], "value": "西双版纳傣族自治州" }, { "text": "玉溪市", "children": [{ "text": "澄江县", "value": "澄江县" }, { "text": "峨山彝族自治县", "value": "峨山彝族自治县" }, { "text": "红塔区", "value": "红塔区" }, { "text": "华宁县", "value": "华宁县" }, { "text": "江川区", "value": "江川区" }, { "text": "通海县", "value": "通海县" }, { "text": "新平彝族傣族自治县", "value": "新平彝族傣族自治县" }, { "text": "易门县", "value": "易门县" }, { "text": "元江哈尼族彝族傣族自治县", "value": "元江哈尼族彝族傣族自治县" }], "value": "玉溪市" }, { "text": "昭通市", "children": [{ "text": "大关县", "value": "大关县" }, { "text": "鲁甸县", "value": "鲁甸县" }, { "text": "巧家县", "value": "巧家县" }, { "text": "水富市", "value": "水富市" }, { "text": "绥江县", "value": "绥江县" }, { "text": "威信县", "value": "威信县" }, { "text": "盐津县", "value": "盐津县" }, { "text": "彝良县", "value": "彝良县" }, { "text": "永善县", "value": "永善县" }, { "text": "昭阳区", "value": "昭阳区" }, { "text": "镇雄县", "value": "镇雄县" }], "value": "昭通市" }] },
                { "text": "浙江省", "value": "浙江省", "children": [{ "text": "杭州市", "children": [{ "text": "滨江区", "value": "滨江区" }, { "text": "淳安县", "value": "淳安县" }, { "text": "富阳区", "value": "富阳区" }, { "text": "拱墅区", "value": "拱墅区" }, { "text": "建德市", "value": "建德市" }, { "text": "江干区", "value": "江干区" }, { "text": "临安区", "value": "临安区" }, { "text": "上城区", "value": "上城区" }, { "text": "桐庐县", "value": "桐庐县" }, { "text": "下城区", "value": "下城区" }, { "text": "萧山区", "value": "萧山区" }, { "text": "西湖区", "value": "西湖区" }, { "text": "余杭区", "value": "余杭区" }], "value": "杭州市" }, { "text": "湖州市", "children": [{ "text": "安吉县", "value": "安吉县" }, { "text": "长兴县", "value": "长兴县" }, { "text": "德清县", "value": "德清县" }, { "text": "南浔区", "value": "南浔区" }, { "text": "吴兴区", "value": "吴兴区" }], "value": "湖州市" }, { "text": "嘉兴市", "children": [{ "text": "海宁市", "value": "海宁市" }, { "text": "海盐县", "value": "海盐县" }, { "text": "嘉善县", "value": "嘉善县" }, { "text": "南湖区", "value": "南湖区" }, { "text": "平湖市", "value": "平湖市" }, { "text": "桐乡市", "value": "桐乡市" }, { "text": "秀洲区", "value": "秀洲区" }], "value": "嘉兴市" }, { "text": "金华市", "children": [{ "text": "东阳市", "value": "东阳市" }, { "text": "金东区", "value": "金东区" }, { "text": "兰溪市", "value": "兰溪市" }, { "text": "婺城区", "value": "婺城区" }, { "text": "磐安县", "value": "磐安县" }, { "text": "浦江县", "value": "浦江县" }, { "text": "武义县", "value": "武义县" }, { "text": "义乌市", "value": "义乌市" }, { "text": "永康市", "value": "永康市" }], "value": "金华市" }, { "text": "丽水市", "children": [{ "text": "景宁畲族自治县", "value": "景宁畲族自治县" }, { "text": "缙云县", "value": "缙云县" }, { "text": "莲都区", "value": "莲都区" }, { "text": "龙泉市", "value": "龙泉市" }, { "text": "青田县", "value": "青田县" }, { "text": "庆元县", "value": "庆元县" }, { "text": "松阳县", "value": "松阳县" }, { "text": "遂昌县", "value": "遂昌县" }, { "text": "云和县", "value": "云和县" }], "value": "丽水市" }, { "text": "宁波市", "children": [{ "text": "北仑区", "value": "北仑区" }, { "text": "慈溪市", "value": "慈溪市" }, { "text": "奉化区", "value": "奉化区" }, { "text": "海曙区", "value": "海曙区" }, { "text": "江北区", "value": "江北区" }, { "text": "宁海县", "value": "宁海县" }, { "text": "象山县", "value": "象山县" }, { "text": "鄞州区", "value": "鄞州区" }, { "text": "余姚市", "value": "余姚市" }, { "text": "镇海区", "value": "镇海区" }], "value": "宁波市" }, { "text": "衢州市", "children": [{ "text": "常山县", "value": "常山县" }, { "text": "江山市", "value": "江山市" }, { "text": "开化县", "value": "开化县" }, { "text": "柯城区", "value": "柯城区" }, { "text": "龙游县", "value": "龙游县" }, { "text": "衢江区", "value": "衢江区" }], "value": "衢州市" }, { "text": "绍兴市", "children": [{ "text": "嵊州市", "value": "嵊州市" }, { "text": "柯桥区", "value": "柯桥区" }, { "text": "上虞区", "value": "上虞区" }, { "text": "新昌县", "value": "新昌县" }, { "text": "越城区", "value": "越城区" }, { "text": "诸暨市", "value": "诸暨市" }], "value": "绍兴市" }, { "text": "台州市", "children": [{ "text": "黄岩区", "value": "黄岩区" }, { "text": "椒江区", "value": "椒江区" }, { "text": "临海市", "value": "临海市" }, { "text": "路桥区", "value": "路桥区" }, { "text": "三门县", "value": "三门县" }, { "text": "天台县", "value": "天台县" }, { "text": "温岭市", "value": "温岭市" }, { "text": "仙居县", "value": "仙居县" }, { "text": "玉环市", "value": "玉环市" }], "value": "台州市" }, { "text": "温州市", "children": [{ "text": "苍南县", "value": "苍南县" }, { "text": "洞头区", "value": "洞头区" }, { "text": "乐清市", "value": "乐清市" }, { "text": "龙湾区", "value": "龙湾区" }, { "text": "鹿城区", "value": "鹿城区" }, { "text": "瓯海区", "value": "瓯海区" }, { "text": "平阳县", "value": "平阳县" }, { "text": "瑞安市", "value": "瑞安市" }, { "text": "泰顺县", "value": "泰顺县" }, { "text": "文成县", "value": "文成县" }, { "text": "永嘉县", "value": "永嘉县" }], "value": "温州市" }, { "text": "舟山市", "children": [{ "text": "嵊泗县", "value": "嵊泗县" }, { "text": "岱山县", "value": "岱山县" }, { "text": "定海区", "value": "定海区" }, { "text": "普陀区", "value": "普陀区" }], "value": "舟山市" }] }
            ];
            storage.setStore(`system_city_data`, JSON.stringify(options), 3600 * 24 * 365);
            return options;
        } else {
            return data;
        }
    },

    async queryZoneName(data = null) {
        data = [{
            "text": "融量集团",
            "value": "融量集团",
            "children": [{
                    "text": "融量集团总部",
                    "value": "融量集团总部",
                },
                {
                    "text": "地产板块",
                    "value": "地产板块",
                    "children": [
                        { "text": "领地集团总部", "value": "领地集团总部" },
                        { "text": "重庆区域", "value": "重庆区域" },
                        { "text": "两湖区域", "value": "两湖区域" },
                        { "text": "川北区域", "value": "川北区域" },
                        { "text": "成都区域", "value": "成都区域" },
                        { "text": "川南区域", "value": "川南区域" },
                        { "text": "中原区域", "value": "中原区域" },
                        { "text": "攀西区域", "value": "攀西区域" },
                        { "text": "新疆区域", "value": "新疆区域" },
                        { "text": "大湾区域", "value": "大湾区域" },
                        { "text": "北京区域", "value": "北京区域" },
                        { "text": "园林公司", "value": "园林公司" },
                    ]
                },
                {
                    "text": "金融板块",
                    "value": "金融板块",
                    "children": [
                        { "text": "量石投资", "value": "量石投资" },
                    ]
                },
                {
                    "text": "物业板块",
                    "value": "物业板块",
                    "children": [
                        { "text": "领悦集团总部", "value": "领悦集团总部" },
                        { "text": "川南区域", "value": "川南区域" },
                        { "text": "商写事业部", "value": "商写事业部" },
                        { "text": "川北区域", "value": "川北区域" },
                        { "text": "新疆区域", "value": "新疆区域" },
                        { "text": "攀西区域", "value": "攀西区域" },
                        { "text": "长春区域", "value": "长春区域" },
                        { "text": "大湾区域", "value": "大湾区域" },
                        { "text": "郑州荆州区域", "value": "郑州荆州区域" },
                        { "text": "贵阳区域", "value": "贵阳区域" },
                        { "text": "佳美物业公司", "value": "佳美物业公司" },
                    ]
                },
                {
                    "text": "医疗健康板块",
                    "value": "医疗健康板块",
                    "children": [
                        { "text": "健康事业部", "value": "健康事业部" },
                        { "text": "至诚和爱健管中心", "value": "至诚和爱健管中心" },
                        { "text": "高康国际医院", "value": "高康国际医院" },
                    ]
                },
                {
                    "text": "商业板块",
                    "value": "商业板块",
                    "children": [
                        { "text": "宝瑞商管", "value": "宝瑞商管" },
                    ]
                },
                {
                    "text": "合作方财务公司",
                    "value": "合作方财务公司",
                    "children": [
                        { "text": "共享财务中心", "value": "共享财务中心" },
                    ]
                },
            ]
        }];
        return data;
    },

    async queryActionCause(data = null) {
        data = [{
                "text": "人格权纠纷",
                "value": "人格权纠纷",
                "children": [
                    { "text": "名誉权纠纷", "value": "名誉权纠纷" },
                    { "text": "其他人格权纠纷", "value": "其他人格权纠纷" },
                ]
            },
            {
                "text": "物权纠纷",
                "value": "物权纠纷",
                "children": [
                    { "text": "物权确认纠纷", "value": "物权确认纠纷" },
                    { "text": "排除妨害纠纷", "value": "排除妨害纠纷" },
                    { "text": "恢复原状纠纷", "value": "恢复原状纠纷" },
                    { "text": "返还原物纠纷", "value": "返还原物纠纷" },
                    { "text": "业主知情权纠纷", "value": "业主知情权纠纷" },
                    { "text": "相邻关系纠纷", "value": "相邻关系纠纷" },
                    { "text": "业主共有权纠纷", "value": "业主共有权纠纷" },
                    { "text": "建设用地使用权纠纷", "value": "建设用地使用权纠纷" },
                    { "text": "抵押权纠纷", "value": "抵押权纠纷" },
                ]
            },
            {
                "text": "合同纠纷、准合同纠纷",
                "value": "合同纠纷、准合同纠纷",
                "children": [
                    { "text": "确认合同效力纠纷", "value": "确认合同效力纠纷" },
                    { "text": "房屋买卖合同纠纷", "value": "房屋买卖合同纠纷" },
                    { "text": "其他买卖合同纠纷", "value": "其他买卖合同纠纷" },
                    { "text": "租赁合同纠纷", "value": "租赁合同纠纷" },
                    { "text": "建设工程合同纠纷", "value": "建设工程合同纠纷" },
                    { "text": "物业服务合同纠纷-公共收益返还", "value": "物业服务合同纠纷-公共收益返还" },
                    { "text": "物业服务合同纠纷-返水纠纷", "value": "物业服务合同纠纷-返水纠纷" },
                    { "text": "物业服务合同纠纷-进退场纠纷", "value": "物业服务合同纠纷-进退场纠纷" },
                    { "text": "物业服务合同纠纷-物业服务费纠纷", "value": "物业服务合同纠纷-物业服务费纠纷" },
                    { "text": "物业服务合同纠纷-其他", "value": "物业服务合同纠纷-其他" },
                    { "text": "中介合同纠纷", "value": "中介合同纠纷" },
                    { "text": "劳务合同纠纷", "value": "劳务合同纠纷" },
                    { "text": "无因管理、不当得利纠纷", "value": "无因管理、不当得利纠纷" },
                    { "text": "追偿权纠纷", "value": "追偿权纠纷" },
                    { "text": "其他合同纠纷", "value": "其他合同纠纷" },
                    { "text": "缔约过失责任纠纷", "value": "缔约过失责任纠纷" },
                    { "text": "预约合同纠纷", "value": "预约合同纠纷" },
                    { "text": "建设用地使用权合同纠纷", "value": "建设用地使用权合同纠纷" },
                    { "text": "股权合作合同纠纷", "value": "股权合作合同纠纷" },
                    { "text": "委托开发合同纠纷", "value": "委托开发合同纠纷" },
                    { "text": "其他投资合同纠纷", "value": "其他投资合同纠纷" },
                    { "text": "商品房预约合同纠纷", "value": "商品房预约合同纠纷" },
                    { "text": "商品房销/预售合同纠纷-逾期交房纠纷", "value": "商品房销/预售合同纠纷-逾期交房纠纷" },
                    { "text": "商品房销/预售合同纠纷-逾期整改纠纷", "value": "商品房销/预售合同纠纷-逾期整改纠纷" },
                    { "text": "商品房销/预售合同纠纷-逾期办证纠纷", "value": "商品房销/预售合同纠纷-逾期办证纠纷" },
                    { "text": "商品房销/预售合同纠纷-退房纠纷", "value": "商品房销/预售合同纠纷-退房纠纷" },
                    { "text": "商品房销/预售合同纠纷-交付不符纠纷", "value": "商品房销/预售合同纠纷-交付不符纠纷" },
                    { "text": "商品房销/预售合同纠纷-房屋质量纠纷", "value": "商品房销/预售合同纠纷-房屋质量纠纷" },
                    { "text": "商品房销/预售合同纠纷-分包销合同纠纷", "value": "商品房销/预售合同纠纷-分包销合同纠纷" },
                    { "text": "商品房销/预售合同纠纷-用益物权纠纷（使用权转让）", "value": "商品房销/预售合同纠纷-用益物权纠纷（使用权转让）" },
                    { "text": "商品房销/预售合同纠纷-断供纠纷", "value": "商品房销/预售合同纠纷-断供纠纷" },
                    { "text": "商品房销/预售合同纠纷-其他纠纷", "value": "商品房销/预售合同纠纷-其他纠纷" },
                    { "text": "销售代理（中介)合同纠纷", "value": "销售代理（中介)合同纠纷" },
                    { "text": "营销广告合同纠纷", "value": "营销广告合同纠纷" },
                    { "text": "借款（民间借贷）/金融贷款合同纠纷", "value": "借款（民间借贷）/金融贷款合同纠纷" },
                    { "text": "建设工程合同纠纷-工程质量纠纷", "value": "建设工程合同纠纷-工程质量纠纷" },
                    { "text": "建设工程合同纠纷-欠付工程款纠纷", "value": "建设工程合同纠纷-欠付工程款纠纷" },
                    { "text": "建设工程合同纠纷-工程结算纠纷", "value": "建设工程合同纠纷-工程结算纠纷" },
                    { "text": "建设工程合同纠纷-质保金纠纷", "value": "建设工程合同纠纷-质保金纠纷" },
                    { "text": "建设工程合同纠纷-其他纠纷", "value": "建设工程合同纠纷-其他纠纷" },
                    { "text": "演出合同纠纷", "value": "演出合同纠纷" },
                    { "text": "无因管理纠纷", "value": "无因管理纠纷" },
                    { "text": "不当得利纠纷", "value": "不当得利纠纷" },
                ]
            },
            {
                "text": "劳动争议",
                "value": "劳动争议",
                "children": [
                    { "text": "解除劳动合同纠纷", "value": "解除劳动合同纠纷" },
                    { "text": "确认劳动关系纠纷", "value": "确认劳动关系纠纷" },
                    { "text": "追索劳动报酬纠纷", "value": "追索劳动报酬纠纷" },
                    { "text": "竞业限制纠纷", "value": "竞业限制纠纷" },
                    { "text": "社会保险纠纷", "value": "社会保险纠纷" },
                    { "text": "工伤工亡纠纷", "value": "工伤工亡纠纷" },
                    { "text": "劳务派遣合同纠纷", "value": "劳务派遣合同纠纷" },
                    { "text": "其他劳动争议", "value": "其他劳动争议" },
                ]
            },
            {
                "text": "与公司、证券、保险、票据等有关的民事纠纷",
                "value": "与公司、证券、保险、票据等有关的民事纠纷",
                "children": [
                    { "text": "请求变更公司登记纠纷", "value": "请求变更公司登记纠纷" },
                    { "text": "股权转让纠纷", "value": "股权转让纠纷" },
                    { "text": "股东知情权纠纷", "value": "股东知情权纠纷" },
                    { "text": "公司决议纠纷", "value": "公司决议纠纷" },
                    { "text": "公司盈余分配纠纷", "value": "公司盈余分配纠纷" },
                    { "text": "损害股东利益责任纠纷", "value": "损害股东利益责任纠纷" },
                    { "text": "损害公司利益责任纠纷", "value": "损害公司利益责任纠纷" },
                    { "text": "股东出资纠纷", "value": "股东出资纠纷" },
                    { "text": "股权激励纠纷", "value": "股权激励纠纷" },
                    { "text": "公司解散纠纷", "value": "公司解散纠纷" },
                    { "text": "其他与公司有关的纠纷", "value": "其他与公司有关的纠纷" },
                    { "text": "证券纠纷", "value": "证券纠纷" },
                    { "text": "保险合同纠纷", "value": "保险合同纠纷" },
                    { "text": "保险人代位求偿权纠纷", "value": "保险人代位求偿权纠纷" },
                ]
            },
            {
                "text": "著作权侵权纠纷",
                "value": "著作权侵权纠纷",
                "children": [
                    { "text": "著作权侵权纠纷", "value": "著作权侵权纠纷" },
                ]
            },
            {
                "text": "侵权责任纠纷",
                "value": "侵权责任纠纷",
                "children": [
                    { "text": "提供劳务致侵权纠纷", "value": "提供劳务致侵权纠纷" },
                    { "text": "网络侵权责任纠纷", "value": "网络侵权责任纠纷" },
                    { "text": "违反安全保障义务责任纠纷", "value": "违反安全保障义务责任纠纷" },
                    { "text": "生命权、身体权、健康权纠纷", "value": "生命权、身体权、健康权纠纷" },
                    { "text": "高空抛物、坠物致人身或财产损害责任纠纷", "value": "高空抛物、坠物致人身或财产损害责任纠纷" },
                    { "text": "其他致人或致财物损害的侵权责任纠纷", "value": "其他致人或致财物损害的侵权责任纠纷" },
                ]
            },
            {
                "text": "知识产权与竞争纠纷",
                "value": "知识产权与竞争纠纷",
                "children": [
                    { "text": "知识产权与竞争纠纷", "value": "知识产权与竞争纠纷" },
                ]
            },
            {
                "text": "非讼程序案件案由",
                "value": "非讼程序案件案由",
                "children": [
                    { "text": "公司清算案件", "value": "公司清算案件" },
                    { "text": "第三人撤销之诉", "value": "第三人撤销之诉" },
                    { "text": "执行程序中的异议之诉", "value": "执行程序中的异议之诉" },
                ]
            },
        ];
        return data;
    },

    /**
     * 执行上锁(分布式锁)
     * @param {*} tableName
     * @param {*} id
     */
    async lock(lockName = 'crontab_task', lockMS = 100000, lockOperator = '', time = null) {
        try {
            const ctime = time ? time : dayjs().format('YYYY-MM-DD HH:mm:ss');
            const lockList = await query.queryTableDataByWhereSQL('bs_lock_info', `_where=(lock_name,eq,${lockName})~and(status,eq,1)~and(expire_time,gt,${ctime})&_sort=-id`);
            if (lockList && lockList.length > 0) {
                return false; //已经上锁，不能执行操作
            } else { //未上锁，执行操作
                const tempList = await query.queryTableDataByWhereSQL('bs_lock_info', `_where=(lock_name,eq,${lockName})&_sort=-id`); //先查询对应lock_name的所有数据，删除
                for (const item of tempList) {
                    await this.deleteTableData("bs_lock_info", item.id);
                }
                const elem = { //新增本条lock_name数据，上锁
                    id: tools.queryUniqueID(),
                    lock_name: lockName,
                    lock_time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                    expire_time: dayjs().add(lockMS, 'millisecond').format('YYYY-MM-DD HH:mm:ss'),
                    status: 1,
                    lock_username: lockOperator,
                    lock_flag: 'Y',
                };
                await this.postTableData('bs_lock_info', elem);
                return true;
            }
        } catch (error) {
            return false;
        }
    },

    /**
     * 执行解锁(分布式锁)
     * @param {*} tableName
     * @param {*} id
     */
    async unlock(lockName = 'crontab_task') {
        try {
            const tempList = await query.queryTableDataByWhereSQL('bs_lock_info', `_where=(lock_name,eq,${lockName})&_sort=-id`); //先查询对应lock_name的所有数据，删除
            for (const item of tempList) {
                await this.deleteTableData("bs_lock_info", item.id);
            }
            return true;
        } catch (error) {
            return false;
        }
    },

    // 查询首页图片
    async queryImagesUrl(type = 'APP') {
        try {
            const userinfo = await storage.getStore('system_userinfo'); //获取当前登录用户信息
            let whereSQL = null; //查询SQL
            let images = await storage.getStore('system_app_image'); // 获取缓存中的图片
            if (!images) { // 如果存在图片数据，则直接使用图片数据
                whereSQL = userinfo && userinfo.userid == 9058 ? `~and(create_by,eq,zhaoziyu)~and(bpm_status,in,4,5)~and(type,eq,${type})` : `~and(bpm_status,in,4,5)~and(create_by,in,admin,manager)~and(type,eq,${type})`;
                images = await query.queryTableDataByWhereSQL('bs_home_pictures', `_where=(status,in,3)${whereSQL}&_fields=files&_sort=-id`);
                images.map(item => { item.files = `https://upload.yunwisdom.club:30443/${item.files}`; });
                storage.setStore('system_app_image', JSON.stringify(images), 3600 * 24 * 3);
            }
            return images;
        } catch (error) {
            console.log(error);
        }
    },

    /**
     * 
     * @param {*} fieldName 
     * @param {*} item 
     * @returns 
     */
    validField(fieldName, item) {
        if (typeof tools == 'undefined') {
            tools = { isNull: (a) => { return typeof a == 'undefined' || a == null || a == '' } };
        }
        if (typeof state == 'undefined' || tools.isNull(state)) {
            window.state = { message: {} };
        }
        state.message[fieldName] = tools.isNull(item[fieldName]) ? `未填写${fieldName}信息，请填写后在进行提交申请！` : '';
        return tools.isNull(state.message[fieldName]);
    },

    /**
     * 
     * @param {*} element 
     * @param {*} keysElement 
     * @returns 
     */
    checkValid(element, keysElement = element) {
        const keys = Object.keys(keysElement);
        console.log(`element key :${JSON.stringify(keysElement)}`, keys);
        const invalidKey = keys.find(key => {
            return !this.validField(key, element);
        });
        return invalidKey;
    },

    /**
     * 执行记录日志(分布式锁)
     * @param {*} tableName
     * @param {*} recordID
     */
    async logRecord(tableName, recordID, username = '', processName = '', action = '', actionOpinion = '', content = '', position = '', processStation = '', data = '', businessCode = '000000000') {

        let businessData = '';

        //如果表名或者表单ID不存在，则直接返回
        if (!tableName || !recordID) {
            return false;
        }

        try {
            businessData = JSON.stringify(data);
        } catch (error) {
            businessData = data;
        }

        try {
            //记录 审批人 经办人 审批表单 表单编号 记录编号 操作(同意/驳回) 意见 内容 表单数据
            const prLogHisNode = {
                id: tools.queryUniqueID(),
                table_name: tableName,
                main_value: recordID,
                proponents: username,
                business_data_id: recordID,
                business_code: businessCode,
                process_name: processName,
                employee: username,
                approve_user: username,
                action: action,
                action_opinion: actionOpinion,
                operate_time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                functions_station: position,
                process_station: processStation,
                business_data: businessData,
                content: content,
                process_audit: '',
                create_time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                relate_data: '',
                origin_data: '',
            }

            return await workflow.approveViewProcessLog(prLogHisNode);
        } catch (error) {
            return false;
        }

    },

    async querySealListByConStatus(status, month, userinfo, sealTypeSql, searchSql, page) {
        const storage = Betools.storage;
        let cacheKey = 'sys_seal_cache_' + status + month + sealTypeSql + '_#' + userinfo.username + '#_' + searchSql + '#page#_' + page;
        let time = await storage.getStoreDB(`${cacheKey}_expire`) || 0;
        let data = await storage.getStoreDB(`${cacheKey}`);
        let curtime = new Date().getTime() / 1000;

        //如果缓存中没有获取到数据，则直接查询服务器
        if (Betools.tools.isNull(data) || (data && data.length == 0)) {
            time = curtime + 3600 * 24 * 365 * 3;
            data = await manage.querySealListByConStatusDB(status, month, userinfo, sealTypeSql, searchSql, page);
            console.info(`query table data storage cache : ${curtime} data:`, data);
        } else {
            console.info(`query table data hit cache : ${curtime} data: `, data);
        }

        //如果缓存时间快到期，则重新查询数据
        if ((time - 3600 * 24 * 365 * 3 + 0.01) < curtime) {
            (async(status, month, userinfo, sealTypeSql, searchSql, page) => {
                setTimeout(async() => { manage.querySealListByConStatusDB(status, month, userinfo, sealTypeSql, searchSql, page); }, 3000);
            })(status, month, userinfo, sealTypeSql, searchSql, page);
            console.info(`query table data refresh cache : ${curtime} data:`, data);
        }

        return data;
    },

    async querySealListByConStatusDB(status, month, userinfo, sealTypeSql, searchSql, page) {
        let cacheKey = 'sys_seal_cache_' + status + month + sealTypeSql + '_#' + userinfo.username + '#_' + searchSql + '#page#_' + page;
        const whereSQL = `_where=(status,in,${status})~and(create_time,gt,${month})~and(seal_group_ids,like,~${userinfo.username}~)${sealTypeSql}${searchSql}&_sort=-id&_p=${page}&_size=10`;
        const resp = await manage.querySealListByCondition('bs_seal_regist', whereSQL); //获取最近几个月的待用印记录
        Betools.storage.setStoreDB(cacheKey, resp, 3600 * 24 * 365 * 3);
        return resp;
    },

    /**
     * 查询用印数据合同类/非合同类(先查缓存，未命中则查询数据库)
     * @param {*} tableName
     * @param {*} whereSQL
     */
    async querySealListByConType(userinfo, sealTypeSql, searchSql) {

        const storage = Betools.storage;
        let cacheKey = 'sys_seal_cache_' + sealTypeSql + '_#' + userinfo.username + '#_' + searchSql;
        let time = await storage.getStoreDB(`${cacheKey}_expire`) || 0;
        let data = await storage.getStoreDB(`${cacheKey}`);
        let curtime = new Date().getTime() / 1000;

        //如果缓存中没有获取到数据，则直接查询服务器
        if (Betools.tools.isNull(data) || (data && data.length == 0)) {
            time = curtime + 3600 * 24 * 365 * 3;
            data = await manage.querySealListByConTypeDB(userinfo, sealTypeSql, searchSql);
            console.info(`query table data storage cache : ${curtime} data:`, data);
        } else {
            console.info(`query table data hit cache : ${curtime} data: `, data);
        }

        //如果缓存时间快到期，则重新查询数据
        if ((time - 3600 * 24 * 365 * 3 + 10800) < curtime) {
            (async(userinfo, sealTypeSql, searchSql) => {
                setTimeout(async() => { manage.querySealListByConTypeDB(userinfo, sealTypeSql, searchSql); }, 3000);
            })(userinfo, sealTypeSql, searchSql);
            console.info(`query table data refresh cache : ${curtime} data:`, data);
        }

        return data;
    },

    async querySealListByConTypeDB(userinfo, sealTypeSql, searchSql) {
        const cacheKey = 'sys_seal_cache_' + sealTypeSql + '_#' + userinfo.username + '#_' + searchSql;
        const whereSQL = `_where=(seal_group_ids,like,~${userinfo.username}~)${sealTypeSql}${searchSql}&_sort=-id&_p=0&_size=30000`;
        const resp = await manage.querySealListByCondition('bs_seal_regist', whereSQL); //获取最近几个月的待用印记录
        Betools.storage.setStoreDB(cacheKey, resp, 3600 * 24 * 365 * 3);
        return resp;
    },

    /**
     * @param {*} tname 表名
     * @param {*} tcondition whereSQL 
     */
    async querySealListByCondition(tname = 'bs_seal_regist ', tcondition) {
        let result = await Betools.manage.queryTableData(tname, tcondition);
        let size = await Betools.manage.queryTableDataCount(tname, tcondition);
        result.map((item, index) => {
            item.name = item.filename.slice(0, 16),
                item.tel = '';
            item.address = item.seal_type == '合同类' ? item.create_by + ' ' + item.filename + ' 序号:' + item.serialid + ' 流程编号:' + item.workno + ' 合同编号:' + item.contract_id : item.create_by + ' ' + item.filename + ' 序号:' + item.serialid + ' 流程编号:' + item.workno;
            item.isDefault = true;
        });
        result.sort();
        return { size, result };
    },

    /**
     * 向特定用户推送企业微信消息函数
     * @param {*} system agentid 默认系统 reward 奖惩管理系统 stock 股权管理系统 legal 法务管理系统
     * @param {*} content 消息内容
     * @param {*} users 接收消息的用户
     * @param {*} url 跳转网址 
     */
    async sendMessage(system = 'agentid' , content , users , url = '') {
        try{
            const content = window.encodeURIComponent(content.replace(/\//g,''));
            await superagent.get(`${window.BECONFIG['restAPI']}/api/v1/weappms/${users}/${content}?type=${system}&url=${url}`).set('accept', 'json');
        } catch(e) { 
            console.error(e);
        }
    },

    // 记录操作日志
    async handleLog(tableName, element, action = '发起', opinion, content) {

        const userinfo = await Betools.storage.getStore('system_userinfo'); // 获取用户基础信息
        const prLogHisNode = {
            id: Betools.tools.queryUniqueID(),
            table_name: tableName,
            main_value: element.id,
            proponents: userinfo.username,
            business_data_id: element.id,
            business_code: '000000000',
            process_name: opinion,
            employee: userinfo.realname,
            approve_user: userinfo.username,
            action: action,
            action_opinion: opinion,
            operate_time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            functions_station: userinfo.position,
            process_station: '案件审批',
            business_data: JSON.stringify(this.item),
            content: content,
            process_audit: element.id,
            create_time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            relate_data: '',
            origin_data: JSON.stringify(element),
        }
        await Betools.workflow.approveViewProcessLog(prLogHisNode);
    },
};

var manageExports = {
    manage,
}

module.exports = manageExports
module.exports = manageExports