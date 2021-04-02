var { storage } = require('./storage');
var { query } = require('./query');
var { tools } = require('./tools');
var { workflow } = require('./workflow');
var { manage } = require('./manage');

const lock = {

    /**
     * 执行上锁(分布式锁)
     * @param {*} lockName
     * @param {*} lockMS
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
                    await manage.deleteTableData("bs_lock_info", item.id);
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
                await manage.postTableData('bs_lock_info', elem);
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
                await manage.deleteTableData("bs_lock_info", item.id);
            }
            return true;
        } catch (error) {
            return false;
        }
    },


};

var lockExports = {
    lock,
}

module.exports = lockExports