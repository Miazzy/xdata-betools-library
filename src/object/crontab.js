var { tools } = require('./tools');
var { storage } = require('./storage');
var { manage } = require('./manage');
var { query } = require('./query');

const crontab = {

    async queryCrontab(express = '18:0') {

        const userinfo = await storage.getStore('system_userinfo');
        const username = userinfo && userinfo.username ? userinfo.username : '';

        try {
            const nowtime = dayjs().format('HH:mm');
            const nowdate = dayjs().format('YYYYMMDD');

            //向数据库上锁，如果查询到数据库有锁，则不推送消息
            const lockFlag = await manage.lock('crontab_mission', 5000, username);
            console.log(`lock flag : `, lockFlag, ` nowtime: `, nowtime);

            if (!!lockFlag) {
                //查询当日尚未到访的预约申请信息，并发送知会通知
                try {
                    const task = await query.queryTableDataByWhereSQL('bs_crontab_task', `_where=(task_name,eq,crontab_mission_visitor)~and(status,eq,100)&_sort=-id`);
                    express = task && task.length > 0 ? task[0]['time'] : '18:0';
                    if (nowtime.includes('18:0') || nowtime.includes('18:1') || nowtime.includes('18:2') || nowtime.includes(express)) {
                        const vlist = await query.queryTableDataByWhereSQL('bs_visit_apply', `_where=(status,in,init,confirm)&_sort=-id`);
                        for (const item of vlist) {
                            const curdate = dayjs(item.time).add(8, 'hour').format('YYYYMMDD');
                            if (nowdate >= curdate) {
                                const receiveURL = encodeURIComponent(`${window.BECONFIG.domain.replace('www','wechat')}/#/app/visitorreceive?id=${item.id}&statustype=office&role=edit`);
                                const queryURL = `${window.BECONFIG['restAPI']}/api/v1/weappms/${item.mobile}/亲爱的同事，访客：${item.visitor_name} 预约于${dayjs(item.create_time).format('YYYY-MM-DD')}的拜访申请尚未到访，您可以作废或调整拜访预约时间?rurl=${receiveURL}`;
                                const resp = await superagent.get(queryURL).set('xid', tools.queryUniqueID()).set('accept', 'json');
                                const element = {
                                    status: 'devisit',
                                }; // 待处理元素 未到访
                                const result = await manage.patchTableData('bs_visit_apply', item.id, element); //第二步，向表单提交form对象数据
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
                        const blist = await query.queryTableDataByWhereSQL('bs_goods_borrow', `_where=(status,in,已借用)&_sort=-id`);
                        for (const item of blist) {
                            if (item.id == item.pid) {
                                const ctimestamp = dayjs().subtract(12, 'hour').valueOf();
                                const ntimestamp = tools.isNull(item.notify_time) ? 0 : dayjs(item.notify_time).valueOf();
                                if (ntimestamp < ctimestamp) {
                                    const date = dayjs(item.create_time).format('YYYY-MM-DD');
                                    const receiveURL = encodeURIComponent(`${window.BECONFIG.domain.replace('www','wechat')}/#/app/borrowview?id=${item.id}&statustype=office&role=receive`);
                                    const queryURL = `${window.BECONFIG['restAPI']}/api/v1/weappms/${item.create_by}/亲爱的同事，您于${date}借用的物品请在18:00前及时归还?rurl=${receiveURL}`;
                                    const resp = await superagent.get(queryURL).set('xid', tools.queryUniqueID()).set('accept', 'json');
                                    await manage.patchTableData('bs_goods_borrow', item.id, {
                                        notify_time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                                    }); //已推送的消息，添加到消息推送记录表中
                                }
                            } else {
                                const mlist = await query.queryTableDataByWhereSQL('bs_goods_borrow', `_where=(id,eq,${item.pid})&_size=1&_sort=-id`); //查询Pid对应数据状态，如果是已完成，则修改为已完成，如果是已驳回，则修改为已驳回
                                if (mlist && mlist.length > 0) {
                                    await manage.patchTableData('bs_goods_borrow', item.id, {
                                        status: mlist[0].status,
                                    });
                                }
                            }
                        }
                        //查询当日尚未领取办公用品的申请信息 ***** call goods_complete('bs_goods_receive' , 'status' , '已准备' , '已完成' , 10 ); //超过10天未领取，默认已完成
                        const rmessage = await superagent.get(`${window.BECONFIG['restAPI']}/api/v2/mysql/goods_complete`).set('xid', tools.queryUniqueID()).set('accept', 'json'); //检查已推送消息表，如果消息尚未被推送，则将领取信息推送给用户，提醒用户领取用品，超过5天未领取，则状态修改为已领取
                        const rlist = await query.queryTableDataByWhereSQL('bs_goods_receive', `_where=(status,in,已准备)&_sort=-id`);
                        for (const item of rlist) {
                            if (item.id == item.pid) {
                                const ctimestamp = dayjs().subtract(12, 'hour').valueOf();
                                const ntimestamp = tools.isNull(item.notify_time) ? 0 : dayjs(item.notify_time).valueOf();
                                if (ntimestamp < ctimestamp) {
                                    const date = dayjs(item.create_time).format('YYYY-MM-DD');
                                    const receiveURL = encodeURIComponent(`${window.BECONFIG.domain.replace('www','wechat')}/#/app/goodsview?id=${item.id}&statustype=office&role=view`);
                                    const queryURL = `${window.BECONFIG['restAPI']}/api/v1/weappms/${item.create_by}/亲爱的同事，您于${date}预约的办公用品已准备，请在17:00-18:00至前台领取?rurl=${receiveURL}`;
                                    const resp = await superagent.get(queryURL).set('xid', tools.queryUniqueID()).set('accept', 'json');
                                    await manage.patchTableData('bs_goods_receive', item.id, {
                                        notify_time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                                    });
                                }
                            } else {
                                const mlist = await query.queryTableDataByWhereSQL('bs_goods_receive', `_where=(id,eq,${item.pid})&_size=1&_sort=-id`); //查询Pid对应数据状态，如果是已完成，则修改为已完成，如果是已驳回，则修改为已驳回
                                if (mlist && mlist.length > 0) {
                                    await manage.patchTableData('bs_goods_receive', item.id, {
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
                        const resp = await superagent.get(queryURL).set('xid', tools.queryUniqueID()).set('accept', 'json');
                    }
                } catch (e) {
                    console.log(e);
                }

                /** 推送每季度绩效考核指标填写计划 */
                try {
                    if ('/[03-20|06-20|09-20|12-20|03-25|06-25|09-25|12-25||03-30|06-30|09-30|12-30]/'.includes(dayjs().format('MM-DD')) && nowtime.includes('15:00')) { //检查是否为每季度末下午，如果是，推送提示
                        const rurl = window.encodeURIComponent('https://www.italent.cn//143616195/UpaasNewMobileHome#/');
                        const queryURL = `${window.BECONFIG['restAPI']}/api/v1/weappms/zhaozy1028/亲爱的同事，本季度工作即将结束，请记得及时在HR系统上填写本季度工作汇报和发起绩效考核流程哦！?rurl=${rurl}`;
                        const resp = await superagent.get(queryURL).set('xid', tools.queryUniqueID()).set('accept', 'json');
                    }
                } catch (e) {
                    console.log(e);
                }

                //向数据库解锁
                await manage.unlock('crontab_mission');
            }

        } catch (error) {
            console.log(error);
        }
    },


};

var crontabExports = {
    crontab,
}

module.exports = crontabExports