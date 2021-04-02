var { tools } = require('./tools');
var { storage } = require('./storage');

const announce = {

    /**
     * 获取行政公告数据
     */
    async queryAnnounceList(page = 0, size = 50) {

        //提交URL
        var queryURL = `${window.BECONFIG['xmysqlAPI']}/api/bs_announce?_where=(bpm_status,in,4,5)&_sort=-create_time&_p=${page}&_size=${size}`;

        try {
            //先检测缓存中，是否有数据，如果没有数据，则从数据库中查询
            let resultInfo = storage.getStore(`system_announce_administration`);

            if (tools.isNull(resultInfo) || resultInfo.length <= 0 || resultInfo == 'undefined') {

                var res = await superagent.get(queryURL).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');

                var result = res.body;

                //遍历并格式化日期
                result.map(item => {
                    var optime = tools.formatDate(item['operate_time'], 'yyyy-MM-dd');
                    var ctime = tools.formatDate(item['create_time'], 'yyyy-MM-dd');
                    var time = tools.formatDate(item['create_time'], 'yyyyMMddhhmmss');
                    item['operate_time'] = optime;
                    item['create_time'] = ctime;
                    item['timestamp'] = time;
                    item['username'] = tools.deNull(item['username']).split(',');
                    item['table_name'] = 'bs_announce';
                    item['content'] = item['content'] || item['title'];
                });

                resultInfo = result;

                storage.setStore(`system_announce_administration`, result, 3600 * 2);
            }

            return resultInfo;
        } catch (err) {
            console.log(err);
        }
    },

    /**
     * 获取红头文件数据
     */
    async queryHeadList(page = 0, size = 50) {
        //提交URL
        var queryURL = `${window.BECONFIG['xmysqlAPI']}/api/bs_redhead?_where=(bpm_status,in,4,5)&_sort=-create_time&_p=${page}&_size=${size}`;

        try {

            //先检测缓存中，是否有数据，如果没有数据，则从数据库中查询
            let resultInfo = storage.getStore(`system_announce_redhead`);

            if (tools.isNull(resultInfo) || resultInfo.length <= 0 || resultInfo == 'undefined') {

                var res = await superagent.get(queryURL).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');

                var result = res.body;

                //遍历并格式化日期
                result.map(item => {
                    var optime = tools.formatDate(item['operate_time'], 'yyyy-MM-dd');
                    var ctime = tools.formatDate(item['create_time'], 'yyyy-MM-dd');
                    var time = tools.formatDate(item['create_time'], 'yyyyMMddhhmmss');
                    item['operate_time'] = optime;
                    item['create_time'] = ctime;
                    item['timestamp'] = time;
                    item['username'] = tools.deNull(item['username']).split(',');
                    item['table_name'] = 'bs_redhead';
                    item['content'] = item['content'] || item['title'];
                });

                resultInfo = result;

                storage.setStore(`system_announce_redhead`, result, 3600 * 2);
            }

            return resultInfo;
        } catch (err) {
            console.log(err);
        }
    },

    /**
     * 获取新闻资讯数据
     */
    async queryNewsList(page = 0, size = 50) {
        //提交URL
        var queryURL = `${window.BECONFIG['xmysqlAPI']}/api/bs_news?_where=(bpm_status,in,4,5)&_sort=-create_time&_p=${page}&_size=${size}`;

        try {

            //先检测缓存中，是否有数据，如果没有数据，则从数据库中查询
            let resultInfo = storage.getStore(`system_announce_news`);

            if (tools.isNull(resultInfo) || resultInfo.length <= 0 || resultInfo == 'undefined') {

                var res = await superagent.get(queryURL).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');

                var result = res.body;

                //遍历并格式化日期
                result.map(function(item) {
                    var optime = tools.formatDate(item['operate_time'], 'yyyy-MM-dd');
                    var ctime = tools.formatDate(item['create_time'], 'yyyy-MM-dd');
                    var time = tools.formatDate(item['create_time'], 'yyyyMMddhhmmss');
                    item['operate_time'] = optime;
                    item['create_time'] = ctime;
                    item['timestamp'] = time;
                    item['username'] = tools.deNull(item['username']).split(',');
                    item['table_name'] = 'bs_news';
                    item['content'] = item['content'] || item['title'];
                });

                resultInfo = result;

                storage.setStore(`system_announce_news`, result, 3600 * 2);
            }

            return resultInfo;
        } catch (err) {
            console.log(err);
        }
    },

    /**
     * 获取奖罚通报数据
     */
    async queryNoticeList(page = 0, size = 50) {
        //提交URL
        var queryURL = `${window.BECONFIG['xmysqlAPI']}/api/bs_notice?_where=(bpm_status,in,4,5)&_sort=-create_time&_p=${page}&_size=${size}`;

        try {

            //先检测缓存中，是否有数据，如果没有数据，则从数据库中查询
            let resultInfo = storage.getStore(`system_announce_notice`);

            if (tools.isNull(resultInfo) || resultInfo.length <= 0 || resultInfo == 'undefined') {

                var res = await superagent.get(queryURL).set('xid', tools.queryUniqueID()).set('id', tools.queryUniqueID()).set('accept', 'json');
                var result = res.body;

                //遍历并格式化日期
                result.map(function(item) {
                    var optime = tools.formatDate(item['operate_time'], 'yyyy-MM-dd');
                    var ctime = tools.formatDate(item['create_time'], 'yyyy-MM-dd');
                    var time = tools.formatDate(item['create_time'], 'yyyyMMddhhmmss');
                    item['operate_time'] = optime;
                    item['create_time'] = ctime;
                    item['timestamp'] = time;
                    item['username'] = tools.deNull(item['username']).split(',');
                    item['table_name'] = 'bs_notice';
                    item['content'] = item['content'] || item['title'];
                });

                resultInfo = result;

                storage.setStore(`system_announce_notice`, result, 3600 * 2);
            }

            return resultInfo;
        } catch (err) {
            console.log(err);
        }
    }

};


var announceExports = {
    announce,
}

module.exports = announceExports;