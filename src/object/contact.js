var { storage } = require('./storage');
var { tools } = require('./tools');

const ALL_USER_CACHE_KEY = 'ALL_USER_CACHE_KEY_V10';
const ALL_USER_CACHE_WORK_KEY = 'ALL_USER_CACHE_WORK_KEY_V10';
const ALL_USER_CACHE_DEPART_KEY = 'ALL_USER_CACHE_DEPART_KEY_V10';

const contact = {
    async queryDepartUserList() {

        //获取当前登录用户信息
        const userinfo = await storage.getStore('system_userinfo');
        const system_type = tools.queryUrlString('system_type', 'history');

        //如果没有获取到用户数据，则无法获取部门信息
        if (tools.isNull(userinfo) || tools.isNull(userinfo.main_department)) {
            return { records: [], total: 0 };
        }

        //获取部门信息
        const departID = userinfo.main_department;

        const cache = await storage.getStoreDB(ALL_USER_CACHE_DEPART_KEY + '#depart_id#' + departID);

        if (!tools.isNull(cache)) {
            return cache;
        }

        //查询部门URL
        const queryDepartURL = `${window.BECONFIG['restAPI']}/api/${system_type}/wework_depart_list/${userinfo.main_department}`;

        //获取上级部门编号
        const respDepart = await superagent.get(queryDepartURL).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');

        //获取部门信息
        const department = respDepart.body.department.find(item => {
            return item.id = userinfo.main_department;
        });

        //查询URL
        const queryURL = `${window.BECONFIG['restAPI']}/api/${system_type}/wework_depart_user/${department.parentid}/1`

        var result = {};

        try {

            var res = await superagent.get(queryURL).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');

            //遍历并设置属性
            window.__.each(res.body.userlist, item => {
                try {
                    item['wxid'] = item['userid'];
                } catch (error) {
                    console.log(error);
                }
                try {
                    item["initial"] = item['name'].slice(0, 1).toLowerCase();
                } catch (error) {
                    console.log(error);
                }
                try {
                    if (tools.isNull(item.avatar)) {
                        item["headerUrl"] = "https://cdn.jsdelivr.net/gh/Miazzy/yunwisdoms@v8.0.0/images/icon-manage-16.png";
                    } else {
                        item['headerUrl'] = window._CONFIG['uploaxURL'] + '/' + item.avatar;
                    }
                } catch (error) {
                    console.log(error);
                }
                try {
                    item["nickname"] = item['name'];
                } catch (error) {
                    console.log(error);
                }
                try {
                    item["remark"] = item['name'];
                } catch (error) {
                    console.log(error);
                }
                item["signature"] = "";
                item["album"] = [{
                    imgSrc: ""
                }];
                item["area"] = ["中国", "四川", "成都"];
                item["from"] = "通过企业联系人添加";
                item["tag"] = "";
                item["desc"] = {
                    "title": "",
                    "picUrl": ""
                }
                item['status'] = '1';
                item['orgCode'] = '';
                item['updateBy'] = '';
                item['createTime'] = tools.formatDate(item['create_time'], 'yyyy-MM-dd');
                item['createBy'] = 'admin';
                item['workNo'] = '';
                item['delFlag'] = '0';
                item['status_dictText'] = '';
                item['birthday'] = tools.formatDate(item['birthday'], 'yyyy-MM-dd');
                item['updateTime'] = item['createTime'];
                item['telephone'] = item['phone'];
                item['activitiSync'] = '';
                item['sex'] = '1';
                item['sex_dictText'] = '';
            });

            result.records = res.body.userlist;
            result.total = res.body.userlist.length;

            storage.setStoreDB(ALL_USER_CACHE_DEPART_KEY + '#depart_id#' + departID, result, 3600 * 24 * 3);

            return result;

        } catch (err) {
            console.log(err);
        }
    },

    async queryWorkUserList() {

        //查询URL
        var queryURL = `${window.BECONFIG['restAPI']}/api/v3/employee`;
        var result = {};

        const cache = await storage.getStoreDB(ALL_USER_CACHE_WORK_KEY);

        if (!tools.isNull(cache)) {
            return cache;
        }

        try {

            var res = await superagent.get(queryURL).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');

            //遍历并设置属性
            window.__.each(res.body, item => {
                try {
                    item['wxid'] = item['username'];
                } catch (error) {
                    console.log(error);
                }
                try {
                    item["initial"] = item['username'].slice(0, 1).toLowerCase();
                } catch (error) {
                    console.log(error);
                }
                try {
                    if (tools.isNull(item.avatar)) {
                        item["headerUrl"] = "https://cdn.jsdelivr.net/gh/Miazzy/yunwisdoms@v8.0.0/images/icon-manage-16.png";
                    } else {
                        item['headerUrl'] = window._CONFIG['uploaxURL'] + '/' + item.avatar;
                    }
                } catch (error) {
                    console.log(error);
                }
                try {
                    item["nickname"] = item['realname'];
                } catch (error) {
                    console.log(error);
                }
                try {
                    item["remark"] = item['realname'];
                } catch (error) {
                    console.log(error);
                }
                item["signature"] = "";
                item["album"] = [{
                    imgSrc: ""
                }];
                item["area"] = ["中国", "四川", "成都"];
                item["from"] = "通过企业联系人添加";
                item["tag"] = "";
                item["desc"] = {
                    "title": "",
                    "picUrl": ""
                }
                item['status'] = '1';
                item['orgCode'] = '';
                item['updateBy'] = '';
                item['createTime'] = tools.formatDate(item['create_time'], 'yyyy-MM-dd');
                item['createBy'] = 'admin';
                item['workNo'] = '';
                item['delFlag'] = '0';
                item['status_dictText'] = '';
                item['birthday'] = tools.formatDate(item['birthday'], 'yyyy-MM-dd');
                item['updateTime'] = item['createTime'];
                item['telephone'] = item['phone'];
                item['activitiSync'] = '';
                item['sex'] = '1';
                item['sex_dictText'] = '';
            });

            result.records = res.body;
            result.total = res.body.length;

            storage.setStoreDB(ALL_USER_CACHE_WORK_KEY, result, 3600 * 24 * 3);

            return result;

        } catch (err) {
            console.log(err);
        }

    },

    async queryUserList(params) {

        //pageNo从0开始计算
        params.pageNo = params.pageNo - 1;

        //用户名称
        var whereFlag =
            tools.deNull(params.username) == '' ?
            '' :
            `_where=(username,like,~${params.username}~)~or(realname,like,~${params.username}~)&`;

        //获取排序标识，升序 ‘’ ， 降序 ‘-’
        var ascFlag = params.order == 'asc' ? '' : '-';

        //查询URL
        var queryURL = `${window.BECONFIG['xmysqlAPI']}/api/v_user?${whereFlag}_p=${params.pageNo}&_size=${params.pageSize}&_sort=${ascFlag}${params.column}`;
        var queryCountURL = `${window.BECONFIG['xmysqlAPI']}/api/v_user/count?${whereFlag}`;
        var result = {};

        try {

            var res = await superagent.get(queryURL).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');
            var count = await superagent.get(queryCountURL).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');
            console.log(res);

            //遍历并设置属性
            window.__.each(res.body, item => {
                try {
                    item['wxid'] = item['username'];
                } catch (error) {
                    console.log(error);
                }
                try {
                    item["initial"] = item['username'].slice(0, 1).toLowerCase();
                } catch (error) {
                    console.log(error);
                }
                try {
                    if (tools.isNull(item.avatar)) {
                        item["headerUrl"] = "https://cdn.jsdelivr.net/gh/Miazzy/yunwisdoms@v8.0.0/images/icon-manage-16.png";
                    } else {
                        item['headerUrl'] = window._CONFIG['uploaxURL'] + '/' + item.avatar;
                    }
                } catch (error) {
                    console.log(error);
                }
                try {
                    item["nickname"] = item['realname'];
                } catch (error) {
                    console.log(error);
                }
                try {
                    item["remark"] = item['realname'];
                } catch (error) {
                    console.log(error);
                }
                item["signature"] = "";
                item["album"] = [{
                    imgSrc: ""
                }];
                item["area"] = ["中国", "四川", "成都"];
                item["from"] = "通过企业联系人添加";
                item["tag"] = "";
                item["desc"] = {
                    "title": "",
                    "picUrl": ""
                }
                item['status'] = '1';
                item['orgCode'] = '';
                item['updateBy'] = '';
                item['createTime'] = tools.formatDate(item['create_time'], 'yyyy-MM-dd');
                item['createBy'] = 'admin';
                item['workNo'] = '';
                item['delFlag'] = '0';
                item['status_dictText'] = '';
                item['birthday'] = tools.formatDate(item['birthday'], 'yyyy-MM-dd');
                item['updateTime'] = item['createTime'];
                item['telephone'] = item['phone'];
                item['activitiSync'] = '';
                item['sex'] = '1';
                item['sex_dictText'] = '';
            });

            result.records = res.body;
            result.total =
                count.body[0].no_of_rows <= params.pageSize ?
                res.body.length :
                count.body[0].no_of_rows;

            return result;

        } catch (err) {
            console.log(err);
        }

    },

    async queryContacts() {
        //获取当前登录用户信息
        const userinfo = await storage.getStore('system_userinfo');

        var all = [];
        var count = 0;
        var cache = await storage.getStoreDB(ALL_USER_CACHE_KEY + '#depart#' + userinfo.main_department);

        if (tools.isNull(cache) || cache.length <= 0) {
            let userlist = await queryDepartUserList();
            userlist = userlist.records;
            count = userlist.total;
            if (!(tools.isNull(userlist) || userlist.length <= 0)) {
                all = [...all, ...userlist];
            }
            storage.setStoreDB(ALL_USER_CACHE_KEY + '#depart#' + userinfo.main_department, all, 3600 * 24);
        } else {
            all = cache;
        }

        return all;
    },

    async getUserInfo(wxid) {

        //获取当前登录用户信息
        const userinfo = await storage.getStore('system_userinfo');

        if (!wxid || !userinfo) {
            return;
        } else {

            //从缓存中查询数据
            var contacts = await storage.getStoreDB(ALL_USER_CACHE_KEY + '#depart#' + userinfo.main_department);
            for (var index in contacts) {
                if (contacts[index].wxid == wxid) {
                    return contacts[index]
                }
            }

            //如果没有从缓存数据库中查询处理，则查询服务器
            return await getUserInfoByWxid(wxid);

        }
    },

    async getUserInfoByWxid(wxid) {

        window.userMap = new Map();

        const key = `contacts_cache_wxid${wxid}`;

        if (tools.isNull(wxid) || wxid.startsWith('wxid')) {
            return {};
        }

        //如果没有查询到，则直接查询远程服务器
        var queryURL = `${window.BECONFIG['restAPI']}/api/v2/wework_user/${wxid}`;

        try {
            //获取缓存中的数据
            var cache = (await storage.getStoreDB(`contacts_cache_wxid${wxid}`)) || window.userMap.get(key);

            //返回缓存值
            if (typeof cache != 'undefined' && cache != null && cache != '') {
                return cache;
            }

            var res = await superagent.get(queryURL).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');

            if (res.body != null) {
                window.userMap.set(key, res.body);
                await storage.setStoreDB(key, res.body, 3600 * 24);
            }

            return res.body;
        } catch (err) {
            console.log(err);
        }
    },
};

var contactExports = {
    contact,
};

module.exports = contactExports;