var { storage } = require('./storage');
var { tools } = require('./tools');
var { contact } = require('./contact');

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
            var tableInfo = await queryTableDataByField(
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
     * @description 查询表字段信息
     * @param {*} tableName
     */
    async queryTableFieldOrderJSON(tableName) {

        try {
            //查询表单信息
            var tableInfo = await queryTableDataByField(
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
     * 查询数据
     * @param {*} tableName
     * @param {*} id
     */
    async queryTableData(tableName, id) {

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
            }

            return res.body[0];
        } catch (err) {
            console.log(err);
        }
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

            var res = await queryTableDataByField('bs_hrmresource', 'loginid', userid); // await superagent.get(queryURL).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');

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
    async queryWeworkUser() {

        let userinfo = null;
        let response = null;

        try {
            //获取用户CODE
            let code = tools.queryUrlString('code', 'search');
            let system_type = tools.queryUrlString('system_type', 'history') || 'v2';

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
                    userinfo = response && response.body && response.body.userinfo && response.body.userinfo.errcode == 0 ? response.body.userinfo : null;
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
}

var queryExports = {
    query,
}

module.exports = queryExports