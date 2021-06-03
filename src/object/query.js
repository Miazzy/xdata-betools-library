var { storage } = require('./storage');
var { tools } = require('./tools');
var { contact } = require('./contact');
const { async } = require('regenerator-runtime');

const query = {

    /**
     * @description 查询用户基础信息
     * @param {*} tableName
     */
    async queryUserInfoByView(username) {
        var queryURL = `${window.BECONFIG['xmysqlAPI']}/api/v_user?_where=(username,eq,${username})`;
        var result = null;
        try {
            //先检测缓存中，是否有数据，如果没有数据，则从数据库中查询
            result = storage.getStore(`system_v_user_info@username$${username}`);
            if (!(typeof result != 'undefined' && result != null && result != '')) {
                //发送HTTP请求，获取返回值后，设置数据
                var res = await superagent.get(queryURL).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');
                //设置返回结果
                result = res.body;
                //设置缓存数据，缓存时间，暂定为5秒钟
                storage.setStore(`system_v_user_info@username$${username}`, result, 3600 * 24);
            }
        } catch (err) {
            console.log(err);
        }
        //返回查询后的动态数据
        return result;
    },

    /**
     * @description 查询表字段信息
     * @param {*} tableName
     */
    async queryTableFieldInfoJSON(tableName) {

        try {
            //查询表单信息
            var tableInfo = await Betools.manage.queryTableDataByField(
                'v_table_info',
                'id',
                tableName
            );
            //如果信息不为空，则解析表单信息
            if (tools.deNull(tableInfo) != '' && tableInfo.length > 0) {
                try {
                    tableInfo = tools.deNull(tableInfo[0]['value']);
                } catch (error) {
                    console.log('tabale info :' + tableInfo);
                }
            }
            //如果信息不为空，则进行解析数据
            if (tools.deNull(tableInfo) != '') {
                try {
                    tableInfo = JSON.parse(tableInfo);
                } catch (error) {
                    console.log('tabale info :' + tableInfo);
                }
            }
        } catch (error) {
            console.log('query table field info json error :' + error);
        }
        return tableInfo;
    },

    /**
     * 查询公司列表信息
     * @param {*} dataID 
     * @param {*} groupID 
     * @param {*} key 
     * @returns 
     */
    async queryNacosConfig(dataID = '', key = '', groupID = 'DEFAULT_GROUP', ) {

        try {
            const cacheKey = `nacos#config#cache#${groupID}#${dataID}`;
            const cacheAPI = `${window.BECONFIG['xmysqlAPI'].replace('gateway-xmysql','gateway-config')}/${dataID}`;
            let data = await Betools.storage.getStoreDB(cacheKey); //查询缓存，如果缓存中含有数据，则直接返回

            if (!(Betools.tools.isNull(data) || data.length == 0)) {
                (async() => {
                    const tArray = await superagent.get(cacheAPI).set('Content-Type', 'application/json;charset=UTF-8').set('accept', 'json'); //查询配置服务中心是否含有信息，如果含有返回配置中心的信息数据列表
                    if (!Betools.tools.isNull(tArray)) {
                        const text = JSON.parse(tArray.text);
                        const tData = Betools.tools.isNull(key) ? text : text[key];
                        Betools.storage.setStoreDB(cacheKey, tData, 3600 * 24 * 365); //保存缓存信息，下次直接使用缓存数据
                    }
                })();
                return data;
            }

            const arr = await superagent.get(cacheAPI).set('Content-Type', 'application/json;charset=UTF-8').set('accept', 'json'); //查询配置服务中心是否含有信息，如果含有返回配置中心的信息数据列表
            if (!Betools.tools.isNull(arr)) {
                const text = JSON.parse(arr.text);
                data = Betools.tools.isNull(key) ? text : text[key];
                Betools.storage.setStoreDB(cacheKey, data, 3600 * 24 * 365); //保存缓存信息，下次直接使用缓存数据
            }

            return data;
        } catch (error) {
            console.error(`query nacos config :`, error);
        }
    },

    /**
     * @description 查询表字段信息
     * @param {*} tableName
     */
    async queryTableFieldOrderJSON(tableName) {

        try {
            //查询表单信息
            var tableInfo = await Betools.manage.queryTableDataByField(
                'v_table_info',
                'id',
                tableName
            );
            //如果信息不为空，则解析表单信息
            if (tools.deNull(tableInfo) != '' && tableInfo.length > 0) {
                try {
                    tableInfo = tools.deNull(tableInfo[0]['num']);
                } catch (error) {
                    console.log('tabale info :' + tableInfo);
                }
            }
            //如果信息不为空，则进行解析数据
            if (tools.deNull(tableInfo) != '') {
                try {
                    tableInfo = JSON.parse(tableInfo);
                } catch (error) {
                    console.log('tabale info :' + tableInfo);
                }
            }
        } catch (error) {
            console.log('query table field info json error :' + error);
        }
        return tableInfo;
    },

    /**
     * 查询数据
     * @param {*} tableName
     * @param {*} foreignKey
     * @param {*} id
     */
    async queryTableDataByField(tableName, field, value) {
        tableName = tableName.toLowerCase();
        var queryURL = `${window.BECONFIG['xmysqlAPI']}/api/${tableName}?_where=(${field},eq,${value})`;
        try {
            var res = await superagent.get(queryURL).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');
            return res.body;
        } catch (err) {
            console.log(err);
        }
    },

    /**
     * 查询数据(先查缓存，未命中则查询数据库)
     * @param {*} tableName
     * @param {*} id
     */
    async queryTableData(tableName, id) {

        let cacheKey = 'sys_cache_' + tableName + '_#id#_' + id;
        let time = await Betools.storage.getStoreDB(`${cacheKey}_expire`) || 0;
        let data = await Betools.storage.getStoreDB(`${cacheKey}`);
        let curtime = new Date().getTime() / 1000;

        //如果缓存中没有获取到数据，则直接查询服务器
        if (Betools.tools.isNull(data)) {
            time = curtime + 3600 * 24 * 365 * 3;
            data = await query.queryTableDataDB(tableName, id);
            console.info(`query table data storage cache : ${curtime} data:`, data);
        } else {
            console.info(`query table data hit cache : ${curtime} data: `, data);
        }

        //如果缓存时间快到期，则重新查询数据
        if ((time - 3600 * 24 * 365 * 3 + 0.15) < curtime) {
            (async(tableName, id) => {
                setTimeout(async() => { query.queryTableDataDB(tableName, id); }, 3000);
            })(tableName, id);
            console.info(`query table data refresh cache : ${curtime} data:`, data);
        }

        return data;
    },

    /**
     * 查询数据(直接查询数据库)
     * @param {*} tableName
     * @param {*} id
     */
    async queryTableDataDB(tableName, id) {

        let cacheKey = 'sys_cache_' + tableName + '_#id#_' + id;

        tableName = tableName.toLowerCase();
        var queryURL = `${window.BECONFIG['xmysqlAPI']}/api/${tableName}/${id}`;

        try {
            //获取缓存中的数据
            var cache = storage.getStore(`sys_user_cache@${tableName}&id${id}`);

            //返回缓存值
            if (typeof cache != 'undefined' && cache != null && cache != '') {
                return cache;
            }

            var res = await superagent.get(queryURL).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');

            if (res.body != null && res.body.length > 0) {
                storage.setStore(`sys_user_cache@${tableName}&id${id}`, res.body[0], 2);
                storage.setStore(cacheKey, res.body[0], 3600 * 24 * 365 * 3);
            }

            return res.body[0];
        } catch (err) {
            console.log(err);
        }
    },

    // 基于实时缓存查询列表信息
    async cacheQueryList(callback, argValue) {
        const key = JSON.stringify([...argValue]);
        const time = await Betools.storage.getStoreDB(`${key}_expire`) || 0;
        const curtime = new Date().getTime() / 1000;
        const args = JSON.parse(key);
        let list = null;
        list = await Betools.storage.getStoreDB(key);
        if (Betools.tools.isNull(list) || (list && list.length == 0)) {
            list = await callback(...args);
            Betools.storage.setStoreDB(key, list, 3600 * 24 * 365 * 3);
        }
        if ((time - 3600 * 24 * 365 * 3 + 5) < curtime) {
            (async() => {
                setTimeout(async() => {
                    const list = await callback(...args);
                    Betools.storage.setStoreDB(key, list, 3600 * 24 * 365 * 3);
                }, 100);
            })();
        }
        return list;
    },

    /**
     * 查询不同状态的领用数据
     * @param {*} tableName 
     * @param {*} departKey 
     * @param {*} page 
     * @param {*} size 
     * @returns 
     */
    async queryLawyerList(tableName = 'v_hrmresource', departKey = '法务', page = 0, size = 10000) {
        let list = await Betools.manage.queryTableData(tableName, `_where=(company,like,~${departKey}~)&_fields=id,userid,loginid,mobile,name,position,gender,cname,company&_sort=-id&_p=${page}&_size=${size}`);
        return list;
    },

    /**
     * 缓存表数据
     * @param {*} tableName 
     * @param {*} id 
     * @param {*} elem 
     */
    async cacheTableDataByID(tableName, id, elem) {
        let cacheKey = 'sys_cache_' + tableName + '_#id#_' + id;
        storage.setStoreDB(cacheKey, elem, 3600 * 24 * 365 * 3);
    },

    /**
     * 查询数据
     * @param {*} tableName
     * @param {*} id
     */
    async queryTableDataByPid(tableName, id) {

        tableName = tableName.toLowerCase();
        var queryURL = `${window.BECONFIG['xmysqlAPI']}/api/${tableName}?_where=(pid,eq,${id})&_sort=create_time`;

        try {
            //获取缓存中的数据
            var cache = storage.getStore(`sys_user_cache@${tableName}&pid${id}`);

            //返回缓存值
            if (typeof cache != 'undefined' && cache != null && cache != '') {
                return cache;
            }

            var res = await superagent.get(queryURL).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');

            if (res.body != null && res.body.length > 0) {
                storage.setStore(`sys_user_cache@${tableName}&pid${id}`, res.body, 2);
            }

            return res.body;
        } catch (err) {
            console.log(err);
        }
    },

    /**
     * 查询数据
     * @param {*} tableName
     * @param {*} id
     */
    async queryRoleGroupList(name, username = '') {

        var queryURL = `${window.BECONFIG['xmysqlAPI']}/api/bs_admin_group?_where=(groupname,eq,${name})~and(userlist,like,~${username}~)&_sort=create_time`;

        try {
            //获取缓存中的数据
            var cache = storage.getStore(`sys_user_cache@bs_admin_group&groupname${name}`);

            //返回缓存值
            if (typeof cache != 'undefined' && cache != null && cache != '') {
                return cache;
            }

            var res = await superagent.get(queryURL).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');

            if (res.body != null && res.body.length > 0) {
                storage.setStore(`sys_user_cache@bs_admin_group&groupname${name}`, res.body, 2);
            }

            return res.body;
        } catch (err) {
            console.log(err);
        }
    },

    /**
     * 查询数据
     * @param {*} mobile
     */
    async queryUserInfoByMobile(mobile) {

        var queryURL = `${window.BECONFIG['restAPI']}/api/v2/wework_mobile/${mobile}`;

        try {
            //获取缓存中的数据
            var cache = storage.getStore(`sys_user_cache_mobile_userinfo${mobile}`);

            //返回缓存值
            if (typeof cache != 'undefined' && cache != null && cache != '') {
                console.log(`mobile: ${JSON.stringify(cache)}`);
                return cache;
            }

            var res = await superagent.get(queryURL).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');

            if (res.body != null && res.body.length > 0) {
                console.log(`mobile: ${JSON.stringify(res.body)}`);
                storage.setStore(`sys_user_cache_mobile_userinfo${mobile}`, res.body, 3600 * 24 * 7);
            }

            return res.body;
        } catch (err) {
            console.log(err);
        }
    },

    /**
     * 查询数据
     * @param {*} tableName
     * @param {*} id
     */
    async queryMessages(wxid, wxid_, maxId = 0) {

        const tableName = 'bs_message';
        var queryURL = `${window.BECONFIG['xmysqlAPI']}/api/${tableName}?_where=((team,like,~${wxid},${wxid_}~)~or(team,like,~${wxid_},${wxid}~))&_sort=-id`;

        try {
            //获取缓存中的数据
            var cache = storage.getStore(`sys_message_cache##v1@${tableName}&wxid${wxid}_wxid_${wxid_}_maxid${maxId}`);

            //返回缓存值
            if (typeof cache != 'undefined' && cache != null && cache != '') {
                return cache;
            }

            var res = await superagent.get(queryURL).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');

            if (res.body != null && res.body.length > 0) {
                storage.setStore(`sys_message_cache##v1@${tableName}&wxid${wxid}_wxid_${wxid_}_maxid${maxId}`, res.body, 1);
            }

            return res.body;
        } catch (err) {
            console.log(err);
        }
    },

    /**
     * @description 查询用印申请人员邮箱号码
     * @param {*} username 
     */
    async querySealManMail(username) {

        var queryURL = `${window.BECONFIG['xmysqlAPI']}/api/bs_seal_regist?_where=(sign_man,eq,${username})&_fields=deal_mail,create_by&_p=0&_size=1`;

        try {
            //获取缓存中的数据
            var cache = storage.getStore(`sys_seal_man_mail_cache#v1@${username}`);

            //返回缓存值
            if (typeof cache != 'undefined' && cache != null && cache != '') {
                return cache.length > 0 ? cache[0] : '';
            }

            var res = await superagent.get(queryURL).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');

            if (res.body != null && res.body.length > 0) {
                storage.setStore(`sys_seal_man_mail_cache#v1@${username}`, res.body, 1);
            }

            return res.body.length ? res.body[0] : '';
        } catch (err) {
            console.log(err);
        }

    },

    /**
     * 查询数据
     * @param {*} tableName
     * @param {*} whereSQL
     */
    async queryTableDataByWhereSQL(tableName, whereSQL) {
        //大写转小写
        tableName = tableName.toLowerCase();
        //更新URL PATCH	/apis/tableName/:id	Updates row element by primary key
        var queryURL = `${window.BECONFIG['xmysqlAPI']}/api/${tableName}?${whereSQL}`;

        try {

            var res = await superagent.get(queryURL).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');
            return res.body;

        } catch (err) {
            console.log(err);
        }
    },

    /**
     * 查询数据
     * @param {*} tableName
     * @param {*} whereSQL
     */
    async queryMailBySealData(username) {

        const tableName = 'bs_seal_regist';
        const whereSQL = `_where=(create_by,eq,${username})~and(deal_mail,like,~@~)&_p=0&_size=1`;

        //更新URL PATCH	/apis/tableName/:id	Updates row element by primary key
        var queryURL = `${window.BECONFIG['xmysqlAPI']}/api/${tableName}?${whereSQL}`;

        try {
            var res = await superagent.get(queryURL).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');
            return res.body[0];
        } catch (err) {
            console.log(err);
        }
    },

    /**
     * 查询数据
     * @param {*} tableName
     * @param {*} whereSQL
     */
    async queryFrontBySealData(username) {

        const tableName = 'bs_seal_regist';
        const whereSQL = `_where=(create_by,eq,${username})~and(seal_type,eq,合同类)&_p=0&_size=1`;

        //更新URL PATCH	/apis/tableName/:id	Updates row element by primary key
        var queryURL = `${window.BECONFIG['xmysqlAPI']}/api/${tableName}?${whereSQL}`;

        try {
            var res = await superagent.get(queryURL).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');
            return res.body[0];
        } catch (err) {
            console.log(err);
        }
    },

    /**
     * 查询数据
     * @param {*} tableName
     * @param {*} whereSQL
     */
    async queryUserInfoByAccount(userid) {

        if (tools.isNull(userid)) {
            return {};
        }

        //更新URL PATCH	/apis/tableName/:id	Updates row element by primary key
        var queryURL = `${window.BECONFIG['restAPI']}/api/v2/queryemployee/${userid}`;

        //获取缓存中的数据
        var cache = storage.getStore(`sys_user_cache_account#queryemployee#@${userid}`);

        //返回缓存值
        if (typeof cache != 'undefined' && cache != null && cache != '') {
            return cache;
        }

        try {

            var res = await Betools.manage.queryTableDataByField('bs_hrmresource', 'loginid', userid); // await superagent.get(queryURL).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');

            if (res != null && res.length > 0) {
                storage.setStore(`sys_user_cache_account#queryemployee#@${userid}`, res[0], 3600 * 24 * 31);
                return res[0];
            } else if (!tools.isNull(res.text)) {
                storage.setStore(`sys_user_cache_account#queryemployee#@${userid}`, res.text, 3600 * 24 * 31);
                return JSON.parse(res.text);
            }

        } catch (err) {
            console.log(err);
        }
    },

    /**
     * @description 企业微信查询登录用户函数
     */
    async queryWeworkUser(codeSearchType = "search", systemSearchType = "history", version = 'v2') {

        let userinfo = null;
        let response = null;

        try {
            //获取用户CODE
            let code = tools.queryUrlString('code', codeSearchType);
            let system_type = tools.queryUrlString('system_type', systemSearchType) || version;

            //获取用户信息
            if (code) {

                //获取缓存中的数据
                var cache = storage.getStore(`sys_wework_user_code#wework_user_code#@${code}`);

                //返回缓存值
                if (typeof cache != 'undefined' && cache != null && cache != '') {
                    return cache;
                }

                try {
                    response = await superagent.get(`${window.BECONFIG['restAPI']}/api/${system_type}/wework_user_code/${code}`);
                    userinfo = response && response.body && response.body.userinfo ? response.body.userinfo : null;
                } catch (error) {
                    console.log(error);
                }

                //设置system_userinfo
                storage.setStore('system_linfo', JSON.stringify({ username: response && response.body && response.body.userinfo ? response.body.userinfo.userid || response.body.userinfo.username : '', password: '************' }), 3600 * 24 * 30);
                storage.setStore('system_userinfo', JSON.stringify(response && response.body && response.body.userinfo ? response.body.userinfo : ''), 3600 * 24 * 30);
                storage.setStore('system_token', JSON.stringify(code), 3600 * 24 * 30);
                storage.setStore('system_department', JSON.stringify(response && response.body && response.body.userinfo ? response.body.userinfo.department || '' : ''), 3600 * 24 * 30);
                storage.setStore('system_login_time', dayjs().format('YYYY-MM-DD HH:mm:ss'), 3600 * 24 * 30);
                storage.setStore(`sys_wework_user_code#wework_user_code#@${code}`, JSON.stringify(userinfo), 3600 * 24 * 30);
                Betools.console.info('loggin', `token:${code}`, 'info', 'ADM', userinfo.realname);
                Betools.console.info('userinfo', JSON.stringify(userinfo), 'info', 'ADM', userinfo.realname);
            } else {
                userinfo = storage.getStore('system_userinfo');
            }

            return userinfo;
        } catch (error) {
            console.log(error);
        }
    },

    /**
     * 根据数据字典中的节点编号，查询到这个节点对应的流程岗位名称
     */
    async queryProcessLogByUserName(tableName, username) {
        //大写转小写
        tableName = tableName.toLowerCase();
        //提交URL
        var queryURL = `${window.BECONFIG['xmysqlAPI']}/api/pr_log?_where=(table_name,eq,${tableName})~and(business_code,eq,000000000)~and(employee,eq,${username})&_sort=-operate_time`;

        try {
            var res = await superagent.get(queryURL).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');
            console.log(res);
            return res.body;
        } catch (err) {
            console.log(err);
        }
    },

    /**
     * 查询用户以前的填写的物品管理员
     */
    async queryGoodsAdmin(username) {
        var queryURL = `${window.BECONFIG['xmysqlAPI']}/api/bs_goods_receive?_where=(create_by,eq,${username})~and(status,in,待处理,已领取,已完成)&_sort=-create_time&_p=0&_size=1`;
        try {
            var res = await superagent.get(queryURL).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');
            console.log(res);
            return res.body;
        } catch (err) {
            console.log(err);
        }
    },

    /**
     * 查询用户以前的填写的物品管理员
     */
    async queryAdminAdress(name) {
        var queryURL = `${window.BECONFIG['xmysqlAPI']}/api/bs_admin_address?_where=(name,like,~${name}~)~and(status,eq,100)&_sort=-id`;
        try {
            var res = await superagent.get(queryURL).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');
            console.log(res);
            return res.body;
        } catch (err) {
            console.log(err);
        }
    },

    /**
     * 根据数据字典中的节点编号，查询到这个节点对应的流程岗位名称
     */
    async queryProcessLogHistoryByUserName(tableName, username) {
        //大写转小写
        tableName = tableName.toLowerCase();
        //提交URL
        var queryURL = `${window.BECONFIG['xmysqlAPI']}/api/pr_log_history?_where=(table_name,eq,${tableName})~and(business_code,eq,000000000)~and(employee,eq,${username})&_sort=-operate_time`;

        try {
            var res = await superagent.get(queryURL).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');
            console.log(res);
            return res.body;
        } catch (err) {
            console.log(err);
        }
    },

    /**
     * 添加数据
     * @param {*} tableName
     * @param {*} id
     */
    async deleteTableData(tableName, id) {
        //大写转小写
        tableName = tableName.toLowerCase();
        //Post数据的URL地址
        var deleteURL = `${window.BECONFIG['xmysqlAPI']}/api/${tableName}/${id}`;

        try {
            var res = await superagent.delete(deleteURL).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');
            return res.body;
        } catch (err) {
            console.log(err);
        }
    },

    /**
     * 查询数据
     * @param {*} tableName
     * @param {*} id
     */
    async queryVMessages(wxid, username, maxId = 0) {

        try {
            const tableName = 'v_messages'; //大写转小写
            var queryURL = `${window.BECONFIG['xmysqlAPI']}/api/${tableName}?_where=(team,like,~${wxid}~)&_sort=-id&_p=0&_size=100`; //更新URL PATCH	/apis/tableName/:id	Updates row element by primary key
            var cache = storage.getStore(`sys_message_cache##v2@${tableName}&wxid${wxid}}&maxid${maxId}`); //获取缓存中的数据
            if (typeof cache != 'undefined' && cache != null && cache != '') { //返回缓存值
                return cache;
            }

            var res = await superagent.get(queryURL).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');

            if (res.body != null && res.body.length > 0) {

                for (let item of res.body) {

                    item.mid = item.id;
                    item.newMsgCount = 1;
                    item.quiet = item.quiet == 'true' ? true : false;
                    item.read = item.read_ == 'true' ? true : false;
                    item.type = 'friend';
                    item.heuserid = item.groupid.replace(wxid, '').replace(username, '').replace(/,/g, '');

                    const temp = await contact.getUserInfo(item.heuserid);

                    //获取聊天对象信息
                    item.user = [temp];
                    item.msg = [{ text: item.content, date: item.create_time }];

                };

                storage.setStore(`sys_message_cache##v2@${tableName}&wxid${wxid}}&maxid${maxId}`, res.body, 1);
            }

            return res.body;
        } catch (err) {
            console.log(err);
        }
    },


    /**
     * 获取奖罚月度/季度报表
     */
    async queryRewardDataByID(period) {

        //提交URL
        var queryURL = `${window.BECONFIG['xmysqlAPI']}/api/v_reward_data?_where=(period,like,${period})&_sort=amount&_p=0&_size=1000`;

        //获取缓存中的数据
        var cache = storage.getStore(`sys_v_reward_data&id${period}`);

        //返回缓存值
        if (typeof cache != 'undefined' && cache != null && cache != '') {
            return cache;
        }

        try {
            var res = await superagent.get(queryURL).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');

            console.log(res);

            if (res.body != null && res.body.length > 0) {
                storage.setStore(`sys_v_reward_data&id${period}`, res.body, 60);
            }

            return res.body;
        } catch (err) {
            console.log(err);
        }

    },

    /**
     * 查询首页图片
     * @param {*} type 
     * @param {*} images 
     * @param {*} prefixURL 
     * @returns 
     */
    async queryHomeTopImage(type = 'APP', images = '', prefixURL = 'https://upload.yunwisdom.club:30443/') {
        try {
            const userinfo = await Betools.storage.getStore('system_userinfo'); //获取当前登录用户信息
            if (userinfo && (userinfo.userid == 9058 || `emhhb3p5MTAyOA==` == window.btoa(userinfo.username || ''))) {
                return [`https://cdn.jsdelivr.net/gh/Miazzy/xdata-vuechat-service@v1.0.01/src/assets/images/home_top_app.png`];
            }
            images = await Betools.storage.getStore('system_app_image'); // 获取缓存中的图片
            if (!images) { // 如果存在图片数据，则直接使用图片数据
                images = await Betools.query.queryTableDataByWhereSQL('bs_home_pictures', `_where=(status,in,3)&_fields=files&_sort=-id`);
                images.map(item => { item.files = `${prefixURL}${item.files}`; });
                Betools.storage.setStore('system_app_image', JSON.stringify(images), 3600 * 24 * 365 * 3);
            }
            return images;
        } catch (error) {
            console.log(error);
        }
    },

    /**
     * 查询定时任务，推送定时消息
     * @param {*} express 
     */
    async queryCrontab(express = '18:0') {
        const userinfo = await Betools.storage.getStore('system_userinfo');
        const username = userinfo && userinfo.username ? userinfo.username : '';
        try {
            const nowtime = dayjs().format('HH:mm');
            const nowdate = dayjs().format('YYYYMMDD');

            //向数据库上锁，如果查询到数据库有锁，则不推送消息
            const lockFlag = await Betools.manage.lock('crontab_mission', 5000, username);
            console.log(`lock flag : `, lockFlag, ` nowtime: `, nowtime);

            if (!!lockFlag) {
                //查询当日尚未到访的预约申请信息，并发送知会通知
                try {
                    const task = await Betools.query.queryTableDataByWhereSQL('bs_crontab_task', `_where=(task_name,eq,crontab_mission_visitor)~and(status,eq,100)&_sort=-id`);
                    express = task && task.length > 0 ? task[0]['time'] : '18:0';
                    if (nowtime.includes('18:0') || nowtime.includes('18:1') || nowtime.includes('18:2') || nowtime.includes(express)) {
                        const vlist = await Betools.query.queryTableDataByWhereSQL('bs_visit_apply', `_where=(status,in,init,confirm)&_sort=-id`);
                        for (const item of vlist) {
                            const curdate = dayjs(item.time).add(8, 'hour').format('YYYYMMDD');
                            if (nowdate >= curdate) {
                                const receiveURL = encodeURIComponent(`${window.BECONFIG.domain.replace('www','wechat')}/#/app/visitorreceive?id=${item.id}&statustype=office&role=edit`);
                                const queryURL = `${window.BECONFIG['restAPI']}/api/v1/weappms/${item.mobile}/亲爱的同事，访客：${item.visitor_name} 预约于${dayjs(item.create_time).format('YYYY-MM-DD')}的拜访申请尚未到访，您可以作废或调整拜访预约时间?rurl=${receiveURL}`;
                                const resp = await superagent.get(queryURL).set('xid', Betools.tools.queryUniqueID()).set('accept', 'json');
                                const element = {
                                    status: 'devisit',
                                }; // 待处理元素 未到访
                                const result = await Betools.manage.patchTableData('bs_visit_apply', item.id, element); //第二步，向表单提交form对象数据
                                console.log(`response :`, JSON.stringify(resp), `\n\r query url:`, queryURL, `\n\r result:`, result);
                            }
                        }
                    }
                } catch (error) {
                    console.log(error);
                }

                /** 推送设备借用归还消息 */
                try {
                    if (nowtime.includes('17:0') || nowtime.includes('17:1') || nowtime.includes('17:2') || nowtime.includes('17:3') || nowtime.includes('17:4') || nowtime.includes('17:5')) { // 如果当前时间为17:00点左右，则执行推送消息操作
                        //查询当日尚未归还信息设备的申请信息 ***** //检查已推送消息表，如果消息尚未被推送，则将归还信息推送给用户，提醒用户归还设备
                        const blist = await Betools.query.queryTableDataByWhereSQL('bs_goods_borrow', `_where=(status,in,已借用)&_sort=-id`);
                        for (const item of blist) {
                            if (item.id == item.pid) {
                                const ctimestamp = dayjs().subtract(12, 'hour').valueOf();
                                const ntimestamp = Betools.tools.isNull(item.notify_time) ? 0 : dayjs(item.notify_time).valueOf();
                                if (ntimestamp < ctimestamp) {
                                    const date = dayjs(item.create_time).format('YYYY-MM-DD');
                                    const receiveURL = encodeURIComponent(`${window.BECONFIG.domain.replace('www','wechat')}/#/app/borrowview?id=${item.id}&statustype=office&role=receive`);
                                    const queryURL = `${window.BECONFIG['restAPI']}/api/v1/weappms/${item.create_by}/亲爱的同事，您于${date}借用的物品请在18:00前及时归还?rurl=${receiveURL}`;
                                    const resp = await superagent.get(queryURL).set('xid', Betools.tools.queryUniqueID()).set('accept', 'json');
                                    await Betools.manage.patchTableData('bs_goods_borrow', item.id, {
                                        notify_time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                                    }); //已推送的消息，添加到消息推送记录表中
                                }
                            } else {
                                const mlist = await Betools.query.queryTableDataByWhereSQL('bs_goods_borrow', `_where=(id,eq,${item.pid})&_size=1&_sort=-id`); //查询Pid对应数据状态，如果是已完成，则修改为已完成，如果是已驳回，则修改为已驳回
                                if (mlist && mlist.length > 0) {
                                    await Betools.manage.patchTableData('bs_goods_borrow', item.id, {
                                        status: mlist[0].status,
                                    });
                                }
                            }
                        }
                        //查询当日尚未领取办公用品的申请信息 ***** call goods_complete('bs_goods_receive' , 'status' , '已准备' , '已完成' , 10 ); //超过10天未领取，默认已完成
                        const rmessage = await superagent.get(`${window.BECONFIG['restAPI']}/api/v2/mysql/goods_complete`).set('xid', Betools.tools.queryUniqueID()).set('accept', 'json'); //检查已推送消息表，如果消息尚未被推送，则将领取信息推送给用户，提醒用户领取用品，超过5天未领取，则状态修改为已领取
                        const rlist = await Betools.query.queryTableDataByWhereSQL('bs_goods_receive', `_where=(status,in,已准备)&_sort=-id`);
                        for (const item of rlist) {
                            if (item.id == item.pid) {
                                const ctimestamp = dayjs().subtract(12, 'hour').valueOf();
                                const ntimestamp = Betools.tools.isNull(item.notify_time) ? 0 : dayjs(item.notify_time).valueOf();
                                if (ntimestamp < ctimestamp) {
                                    const date = dayjs(item.create_time).format('YYYY-MM-DD');
                                    const receiveURL = encodeURIComponent(`${window.BECONFIG.domain.replace('www','wechat')}/#/app/goodsview?id=${item.id}&statustype=office&role=view`);
                                    const queryURL = `${window.BECONFIG['restAPI']}/api/v1/weappms/${item.create_by}/亲爱的同事，您于${date}预约的办公用品已准备，请在17:00-18:00至前台领取?rurl=${receiveURL}`;
                                    const resp = await superagent.get(queryURL).set('xid', Betools.tools.queryUniqueID()).set('accept', 'json');
                                    await Betools.manage.patchTableData('bs_goods_receive', item.id, {
                                        notify_time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                                    });
                                }
                            } else {
                                const mlist = await Betools.query.queryTableDataByWhereSQL('bs_goods_receive', `_where=(id,eq,${item.pid})&_size=1&_sort=-id`); //查询Pid对应数据状态，如果是已完成，则修改为已完成，如果是已驳回，则修改为已驳回
                                if (mlist && mlist.length > 0) {
                                    await Betools.manage.patchTableData('bs_goods_receive', item.id, {
                                        status: mlist[0].status,
                                    });
                                }
                            }
                        }

                    }
                } catch (e) {
                    console.log(e)
                };

                /** 推送每周周报填写计划 */
                try {
                    if (dayjs().get('day') == 5 && (nowtime.includes('15:00') || nowtime.includes('16:00') || nowtime.includes('17:00'))) { //检查是否为周五下午，如果是，推送提示，填写周报
                        const rurl = window.encodeURIComponent('http://yp.leading-group.com:9036/H5#/folder/ent');
                        const queryURL = `${window.BECONFIG['restAPI']}/api/v1/weappms/zhaozy1028/亲爱的同事，本周工作即将结束，请记得及时填写本周工作汇报哦！?rurl=${rurl}`;
                        const resp = await superagent.get(queryURL).set('xid', Betools.tools.queryUniqueID()).set('accept', 'json');
                    }
                } catch (e) {
                    console.log(e);
                }

                /** 推送每季度绩效考核指标填写计划 */
                try {
                    if ('/[03-20|06-20|09-20|12-20|03-25|06-25|09-25|12-25||03-30|06-30|09-30|12-30]/'.includes(dayjs().format('MM-DD')) && nowtime.includes('15:00')) { //检查是否为每季度末下午，如果是，推送提示
                        const rurl = window.encodeURIComponent('https://www.italent.cn//143616195/UpaasNewMobileHome#/');
                        const queryURL = `${window.BECONFIG['restAPI']}/api/v1/weappms/zhaozy1028/亲爱的同事，本季度工作即将结束，请记得及时在HR系统上填写本季度工作汇报和发起绩效考核流程哦！?rurl=${rurl}`;
                        const resp = await superagent.get(queryURL).set('xid', Betools.tools.queryUniqueID()).set('accept', 'json');
                    }
                } catch (e) {
                    console.log(e);
                }

                /** 查询即将开庭的案件记录 */
                try {
                    if (nowtime.includes('17:0') || nowtime.includes('15:0') || nowtime.includes('09:0') || nowtime.includes('10:3')) {
                        const legalLockFlag = await Betools.manage.lock('crontab_legal_message_mission', 3600, username); //向数据库上锁，如果查询到数据库有锁，则不推送消息
                        console.log(`lock flag : `, legalLockFlag, ` nowtime: `, nowtime);
                        if (!!legalLockFlag) {
                            const legalList = await Betools.query.queryLawList();
                            for await (const legal of legalList) {
                                const rurl = window.encodeURIComponent('https://legal.yunwisdom.club:30443/');
                                if (!Betools.tools.isNull(legal.apply_username)) {
                                    const queryURL = `${window.BECONFIG['restAPI']}/api/v1/weappms/${legal.apply_username}/您好，您跟进的案件：${legal.caseID}，项目：${legal.zoneProject}，即将开庭，请在开庭前好在准备工作，如需修改案件信息，请前往法务诉讼系统就行操作！?rurl=${rurl}`;
                                    const resp = await superagent.get(queryURL).set('xid', Betools.tools.queryUniqueID()).set('accept', 'json');
                                }
                                if (!Betools.tools.isNull(legal.inHouseLawyersMobile)) {
                                    const queryURL = `${window.BECONFIG['restAPI']}/api/v1/weappms/${legal.inHouseLawyersMobile}/您好，您跟进的案件：${legal.caseID}，项目：${legal.zoneProject}，即将开庭，请在开庭前好在准备工作，如需修改案件信息，请前往法务诉讼系统就行操作！?rurl=${rurl}`;
                                    const resp = await superagent.get(queryURL).set('xid', Betools.tools.queryUniqueID()).set('accept', 'json');
                                }
                            }
                        }
                    }
                } catch (e) {
                    console.log(e);
                }

                //向数据库解锁
                await Betools.manage.unlock('crontab_task');
            }

            if ('13:30|14:30|15:30'.includes(nowtime)) { //特定时间解下锁
                await Betools.manage.unlock('crontab_task');
            }

        } catch (error) {
            console.log(error);
        }
    },

    /**
     * 查询即将开庭的案件列表
     * @param {*} tableName 
     * @param {*} page 
     * @param {*} size 
     * @returns 
     */
    async queryLawList(tableName = 'bs_legal', page = 0, size = 10000) {
        const startDate = dayjs().format('YYYY-MM-DD');
        const endDate = dayjs().add(24 * 5, 'hour').format('YYYY-MM-DD');
        let list = await Betools.manage.queryTableData(tableName, `_where=(fstCourtDate,gt,${startDate})~and(fstCourtDate,lt,${endDate})&_sort=-id&_p=${page}&_size=${size}`);
        list.map((item) => {
            item.create_time = dayjs(item.create_time).format('YYYY-MM-DD');
            item.receiveTime = dayjs(item.receiveTime).format('YYYY-MM-DD') == 'Invalid Date' ? '/' : dayjs(item.receiveTime).format('YYYY-MM-DD');
            item.lawRTime = dayjs(item.lawRTime).format('YYYY-MM-DD') == 'Invalid Date' ? '/' : dayjs(item.lawRTime).format('YYYY-MM-DD');
            item.handledTime = dayjs(item.handledTime).format('YYYY-MM-DD') == 'Invalid Date' ? '/' : dayjs(item.handledTime).format('YYYY-MM-DD');
        });
        return list;
    },

    /**
     * 查询拜访列表信息
     * @param {*} tableName 
     * @param {*} status 
     * @param {*} userinfo 
     * @param {*} searchSql 
     * @param {*} page 
     * @param {*} size 
     * @returns 
     */
    async queryVisitList(tableName = 'bs_visit_apply', status = 'init,confirm', userinfo, searchSql = '', page = 0, size = 1000) {
        (Betools.tools.isNull(userinfo) || typeof userinfo == 'string') ? userinfo = { username: '' }: null;
        const vstatus = { init: '待处理', confirm: '未到访', visit: '已到访', devisit: '已作废', invalid: '已作废' };
        const cstatus = { init: 5, confirm: 6, visit: 7, devisit: 8, invalid: 9, };
        const startDate = dayjs().add(-1, 'day').format('YYYY-MM-DD');
        let list = await Betools.manage.queryTableData(tableName, `_where=(time,gt,${startDate})~and(status,in,${status})~and(user_group_ids,like,~${userinfo.username.replace(/\(|\)/g,'_')}~)${searchSql}&_sort=-id&_p=${page}&_size=${size}`);
        list.map((item, index) => {
            item.name = item.address;
            item.address = item.visitor_company + '的' + item.visitor_name + `预计${dayjs(item.time).format('YYYY-MM-DD')} ${item.dtime}到访。`;
            item.tel = '';
            item.isDefault = true;
        });
        list = list.sort(function(a, b) { //callback
            const value = cstatus[a.status] * 100000000000000 + (100000000000000 - parseInt(dayjs(a.create_time).format('YYYYMMDDHHmmss')));
            const value_ = cstatus[b.status] * 100000000000000 + (100000000000000 - parseInt(dayjs(b.create_time).format('YYYYMMDDHHmmss')));
            return value - value_; //返回正数 ，b排列在a之前
        });
        list = list.filter(item => { return item.id == item.pid; });
        return list;
    },

    /**
     * 搜索角色信息
     * @param {*} userinfo 
     * @param {*} resp 
     * @param {*} role 
     * @param {*} cacheKey 
     * @param {*} time 
     * @param {*} curtime 
     * @returns 
     */
    async queryRoleInfo(userinfo = {}, resp = '', role = 'view', cacheKey = 'system_role_rights_v1', time = 0, curtime = 0) {

        userinfo = await Betools.storage.getStore('system_userinfo');
        time = await Betools.storage.getStore(`${cacheKey}_expire`) || 0;
        role = await Betools.storage.getStore(`${cacheKey}`);
        curtime = new Date().getTime() / 1000;

        //开启debugger模式
        if (role && (role.includes('COMMON_DEBUG_ADMIN') || role.includes('SEAL_ADMIN'))) {
            try {
                window.vConsole = window.vConsole ? window.vConsole : new VConsole();
            } catch (error) {
                console.info(`vconsole error ... `);
            }
        }

        //如果缓存中没有获取到数据，则直接查询服务器
        if (Betools.tools.isNull(role)) {
            time = curtime + 3600 * 24 * 365 * 3;
            role = await Betools.query.queryRoleInfoDB(userinfo, resp, role, cacheKey);
            console.info(`storage cache : ${curtime} role:`, role);
        } else {
            console.info(`hit cache : ${curtime} role: `, role);
        }

        //如果缓存时间快到期，则重新查询数据
        if ((time - 3600 * 24 * 365 * 3 + 1000) < curtime) {
            (async(userinfo, resp, role, cacheKey) => {
                setTimeout(async() => { Betools.query.queryRoleInfoDB(userinfo, resp, role, cacheKey); }, 3000);
            })(userinfo, resp, role, cacheKey);
            console.info(`refresh cache : ${curtime} role:`, role);
        }

        return role;
    },

    /**
     * 查询用户Role权限信息
     * @param {*} userinfo 
     * @param {*} resp 
     * @param {*} role 
     * @param {*} cacheKey 
     * @returns 
     */
    async queryRoleInfoDB(userinfo, resp = '', role = 'view', cacheKey = 'system_role_rights_v1') {
        try {
            const username = userinfo && userinfo.username ? userinfo.username : '';
            resp = await Betools.query.queryRoleGroupList('COMMON_RECEIVE_BORROW', username);
            if (resp && resp.length > 0 && resp[0].userlist.includes(username)) {
                role += ',COMMON_RECEIVE_BORROW';
            };
            resp = await Betools.query.queryRoleGroupList('SEAL_ADMIN', username);
            if (resp && resp.length > 0 && resp[0].userlist.includes(username)) {
                role += ',SEAL_ADMIN';
            };
            resp = await Betools.query.queryRoleGroupList('SEAL_FRONT_SERVICE', username);
            if (resp && resp.length > 0 && resp[0].userlist.includes(username)) {
                role += ',SEAL_FRONT_SERVICE';
            };
            resp = await Betools.query.queryRoleGroupList('SEAL_ARCHIVE_ADMIN', username);
            if (resp && resp.length > 0 && resp[0].userlist.includes(username)) {
                role += ',SEAL_ARCHIVE_ADMIN';
            };
            resp = await Betools.query.queryRoleGroupList('COMMON_AUTH_ADMIN', username);
            if (resp && resp.length > 0 && resp[0].userlist.includes(username)) {
                role += ',COMMON_AUTH_ADMIN';
            };
            resp = await Betools.query.queryRoleGroupList('JOB_HR_ADMIN', username);
            if (resp && resp.length > 0 && resp[0].userlist.includes(username)) {
                role += ',JOB_HR_ADMIN';
            };
            resp = await Betools.query.queryRoleGroupList('JOB_EXEC_ADMIN', username);
            if (resp && resp.length > 0 && resp[0].userlist.includes(username)) {
                role += ',JOB_EXEC_ADMIN';
            };
            resp = await Betools.query.queryRoleGroupList('JOB_FRONT_ADMIN', username);
            if (resp && resp.length > 0 && resp[0].userlist.includes(username)) {
                role += ',JOB_FRONT_ADMIN';
            };
            resp = await Betools.query.queryRoleGroupList('JOB_MEAL_ADMIN', username);
            if (resp && resp.length > 0 && resp[0].userlist.includes(username)) {
                role += ',JOB_MEAL_ADMIN';
            };
            resp = await Betools.query.queryRoleGroupList('COMMON_VISIT_AUTH', username);
            if (resp && resp.length > 0 && resp[0].userlist.includes(username)) {
                role += ',COMMON_VISIT_AUTH';
            };
            resp = await Betools.query.queryRoleGroupList('COMMON_DEBUG_ADMIN', username);
            if (resp && resp.length > 0 && resp[0].userlist.includes(username)) {
                role += ',COMMON_DEBUG_ADMIN';
                window.vConsole = window.vConsole ? window.vConsole : new VConsole(); // 初始化vconsole
            };
            try {
                role = role.replace('null', 'view');
                role = [...new Set(role.split(','))].toString();
            } catch (error) {
                console.log(`role error :`, role);
            }
            Betools.storage.setStore(cacheKey, role, 3600 * 24 * 365 * 3);
            return role;
        } catch (error) {
            console.log(error);
        }
    },

}

var queryExports = {
    query,
}

module.exports = queryExports