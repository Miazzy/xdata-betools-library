var { tools } = require('./tools');
var { query } = require('./query');

const task = {

    async queryProcessLogDone(
        username,
        realname,
        page = 0,
        size = 50,
    ) {

        // 查询用户数据信息
        if (tools.isNull(username) || tools.isNull(realname)) {
            return [];
        }

        //查询URL
        var queryURL = `${window.BECONFIG['xmysqlAPI']}/api/v_handled_events_unq?_where=(username,like,~${username}~)~or(username,like,~${realname}~)&_p=${page}&_size=${size}&_sort=-create_time`;
        var result = {};
        try {
            var res = await superagent.get(queryURL).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');
            console.log(res);
            result = res.body;
            result = result.filter(item => { //遍历并格式化日期
                var optime = dayjs(item['operate_time']).format('YYYY-MM-DD'); //格式化日期
                var ctime = dayjs(item['create_time']).format('YYYY-MM-DD');
                var time = dayjs(item['create_time']).format('YYYYMMDDhhmmss');
                var dtime = dayjs(item['create_time']).format('YYYY-MM-DD HH:mm:ss');
                item['createtime'] = dtime;
                item['operate_time'] = optime;
                item['create_time'] = ctime;
                item['timestamp'] = time;
                item['username'] = tools.deNull(item['username']).split(',');
                item['content'] = tools.abbreviation(tools.delHtmlTag(item['content']));
                item['topic'] = tools.abbreviation(tools.delHtmlTag(item['topic']));
                var flag = (item['username'].includes(username) || item['username'].includes(realname)); //查询是否存在此用户名            
                return flag; //返回结果
            });
            try {
                for (let item of result) {
                    try {
                        if (tools.isNull(item['sponsor']) && !tools.isNull(item.proponents)) {
                            const temp = await query.queryUserInfoByAccount(item.proponents);
                            item['sponsor'] = temp.realname || temp.lastname;
                        }
                    } catch (error) {
                        console.log(error);
                    }
                };
            } catch (error) {
                console.log(error);
            }
            result = result.filter((item, index, list) => { const tindex = list.findIndex(elem => { return elem.id == item.id }); return index === tindex; }); // 根据ID编号去掉重复的数据
            return result;
        } catch (err) {
            console.log(err);
        }
    },

    async queryProcessLogWait(
        username,
        realname,
        page = 0,
        size = 50,
    ) {

        // 查询用户数据信息
        if (tools.isNull(username) || tools.isNull(realname)) {
            return [];
        }

        //查询URL
        var queryURL = `${window.BECONFIG['xmysqlAPI']}/api/v_handling_events?_where=(username,like,~${username}~)~or(username,like,~${realname}~)&_p=${page}&_size=${size}&_sort=-create_time`;
        var result = {};

        try {
            var res = await superagent.get(queryURL).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');
            result = res.body;

            try {
                result = result.filter(item => {
                    //格式化日期
                    var optime = dayjs(item['operate_time']).format('YYYY-MM-DD');
                    var ctime = dayjs(item['create_time']).format('YYYY-MM-DD');
                    var time = dayjs(item['create_time']).format('YYYYMMDDHHmmss');
                    var dtime = dayjs(item['create_time']).format('YYYY-MM-DD HH:mm:ss');
                    item['createtime'] = dtime;
                    item['timestamp'] = time;
                    item['operate_time'] = optime;
                    item['create_time'] = ctime;
                    item['username'] = tools.deNull(item['username']).split(',');
                    item['content'] = tools.abbreviation(tools.delHtmlTag(item['content']));
                    item['topic'] = tools.abbreviation(tools.delHtmlTag(item['topic']));

                    //查询是否存在此用户名，且已处理用户中，不含登录用户
                    if (item.tname === 'bs_seal_regist') {
                        var flag = (item['username'].includes(username) || item['username'].includes(realname));
                        return flag;
                    } else if (item.tname === 'bs_goods_receive') {
                        var flag = (item['username'].includes(username) || item['username'].includes(realname));
                        return flag;
                    } else {
                        var flag = (item['username'].includes(username) || item['username'].includes(realname)) && (!item.user.includes(username));
                        return flag;
                    }
                });
            } catch (error) {
                console.log(error);
            }

            try {
                for (let item of result) {
                    try {
                        if (tools.isNull(item['sponsor']) && !tools.isNull(item.proponents)) {
                            if (!item.proponents.includes(',')) {
                                const temp = await query.queryUserInfoByAccount(item.proponents);
                                item['sponsor'] = temp.realname || temp.lastname;
                            }
                        }
                    } catch (error) {
                        console.log(error);
                    }
                };
            } catch (error) {
                console.log(error);
            }

            return result;
        } catch (err) {
            console.log(err);
        }
    },

    async queryProcessLogWaitSeal(
        username,
        realname,
        page = 0,
        size = 50,
    ) {

        // 查询用户数据信息
        if (tools.isNull(username) || tools.isNull(realname)) {
            return [];
        }

        //查询URL
        var queryURL = `${window.BECONFIG['xmysqlAPI']}/api/v_handling_events?_where=(username,like,~${username}~)~or(username,like,~${realname}~)&_p=${page}&_size=${size}&_sort=-create_time`;
        var result = {};

        try {
            var res = await superagent.get(queryURL).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');
            result = res.body;

            try {
                result = result.filter(item => {
                    //格式化日期
                    var optime = dayjs(item['operate_time']).format('YYYY-MM-DD');
                    var ctime = dayjs(item['create_time']).format('YYYY-MM-DD');
                    var time = dayjs(item['create_time']).format('YYYYMMDDHHmmss');
                    var dtime = dayjs(item['create_time']).format('YYYY-MM-DD HH:mm:ss');
                    item['createtime'] = dtime;
                    item['timestamp'] = time;
                    item['operate_time'] = optime;
                    item['create_time'] = ctime;
                    item['username'] = tools.deNull(item['username']).split(',');
                    item['content'] = tools.abbreviation(tools.delHtmlTag(item['content']));
                    item['topic'] = tools.abbreviation(tools.delHtmlTag(item['topic']));

                    // 查询是否存在此用户名，且已处理用户中，不含登录用户
                    if (item.tname === 'bs_seal_regist') {
                        return (item['username'].includes(username) || item['username'].includes(realname));
                    } else if (item.tname === 'bs_goods_receive') {
                        return (item['username'].includes(username) || item['username'].includes(realname));
                    } else {
                        return false;
                    }

                });
            } catch (error) {
                console.log(error);
            }

            try {
                for (let item of result) {
                    try {
                        if (tools.isNull(item['sponsor']) && !tools.isNull(item.proponents)) {
                            if (!item.proponents.includes(',')) {
                                const temp = await query.queryUserInfoByAccount(item.proponents);
                                item['sponsor'] = temp.realname || temp.lastname;
                            }
                        }
                    } catch (error) {
                        console.log(error);
                    }
                };
            } catch (error) {
                console.log(error);
            }

            return result;
        } catch (err) {
            console.log(err);
        }
    },
};

var taskExports = {
    task,
}

module.exports = taskExports