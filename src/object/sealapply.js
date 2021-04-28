const sealapply = {

        /**
         * 查询归档人员
         * @param {*} state
         */
        async querySealApplyArchiveMan(state) {
            //获取盖章人信息
            const archive_name = state.item.archive_name;
            try {
                if (!!archive_name) {
                    //从用户表数据中获取填报人资料
                    let user = await Betools.manage.queryUserByNameHRM(archive_name.trim());
                    if (!!user) {
                        //如果是用户数组列表，则展示列表，让用户自己选择
                        if (Array.isArray(user)) {
                            try {
                                user.map((elem, index) => {
                                    let company = elem.textfield1.split('||')[0];
                                    company = company.slice(company.lastIndexOf('>') + 1);
                                    let department = elem.textfield1.split('||')[1];
                                    department = department.slice(department.lastIndexOf('>') + 1);
                                    state.auserList.push({
                                        id: elem.loginid,
                                        value: `${user.lastname},`,
                                        label: elem.lastname + ' ' + elem.mobile + " " + elem.textfield1.split('||')[1].replace('中心', ''),
                                        name: elem.lastname,
                                        tel: '',
                                        address: company + "||" + elem.textfield1.split('||')[1],
                                        company: company,
                                        department: department,
                                        mail: elem.email,
                                        isDefault: !index
                                    });
                                })
                            } catch (error) {
                                console.log(error);
                            }
                        } else { //如果只有一个用户数据，则直接设置
                            try {
                                let company = user.textfield1.split('||')[0];
                                company = company.slice(company.lastIndexOf('>') + 1);
                                let department = user.textfield1.split('||')[1];
                                department = department.slice(department.lastIndexOf('>') + 1);
                                let elem = user;
                                //将用户数据推送至对方数组
                                state.auserList.push({
                                    id: user.loginid,
                                    value: `${user.lastname},`,
                                    label: elem.lastname + ' ' + elem.mobile + " " + elem.textfield1.split('||')[1].replace('中心', ''),
                                    name: `${user.lastname}`,
                                    tel: user.mobile,
                                    address: company + "||" + user.textfield1.split('||')[1],
                                    company: company,
                                    department: department,
                                    mail: state.item.dealMail,
                                    isDefault: !state.auserList.length
                                });
                            } catch (error) {
                                console.log(error);
                            }
                        }

                        try {
                            state.auserList = state.auserList.filter((item, index) => { //遍历去重
                                item.isDefault = index == 0 ? true : false;
                                let findex = state.auserList.findIndex((subitem, index) => {
                                    return subitem.id == item.id
                                });
                                return index == findex;
                            })
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
         * 查询用印登记需导出的字段
         * @returns 
         */
        querySealExportFields() {
            const json_fields = {
                '排序编号': 'serialid',
                '登记时间': 'create_time',
                '文件名称': 'filename',
                '用印数量': 'count',
                '用印部门': 'deal_depart',
                '经办人员': 'deal_manager',
                '用印公司': 'company',
                '合同编号': 'contract_id',
                '签收人员': 'signman',
                '审批类型': 'approve_type',
                '关联流程': 'workno',
                '用印类型': 'seal_type',
                '印章类型': 'seal_category',
                '合作方': 'partner',
                '排序类型': 'order_type',
                '盖章人员': 'seal_man',
                '备注信息': 'message',
                '用印状态': 'status',
            };
            const json_fields_common = {
                '排序编号': 'serialid',
                '登记时间': 'create_time',
                '文件名称': 'filename',
                '用印数量': 'count',
                '用印部门': 'deal_depart',
                '经办人员': 'deal_manager',
                '用印公司': 'company',
                '签收人员': 'signman',
                '审批类型': 'approve_type',
                '关联流程': 'workno',
                '用印类型': 'seal_type',
                '印章类型': 'seal_category',
                '合作方': 'partner',
                '排序类型': 'order_type',
                '盖章人员': 'seal_man',
                '备注信息': 'message',
                '用印状态': 'status',
            };
            const sealApplyATypeList = {
                '1': 'initContractList',
                '2': 'sealContractList',
                '3': 'receiveContractList',
                '4': 'frontContractList',
                '5': 'doneContractList',
                '6': 'failContractList',
            };
            return { json_fields, json_fields_common, sealApplyATypeList };
        },

        /**
         * 查询用印登记的不同状态的列表数据
         * @param {*} tabname 
         * @param {*} page 
         * @param {*} whereSQL 
         * @param {*} resp 
         * @returns 
         */
        async querySealApplyTabList(tabname, page = 0, whereSQL = '', resp = '', searchWord = '', sealType = 0) {

            const userinfo = await Betools.storage.getStore('system_userinfo'); //获取当前用户信息

            let { initContractList, sealContractList, failContractList, json_data, json_data_common } = {};
            let month = dayjs().subtract(12, 'months').format('YYYY-MM-DD'); // 获取最近几个月对应的日期
            let searchSql = !searchWord ? '' : `~and((filename,like,~${searchWord}~)~or(serialid,like,~${searchWord}~)~or(create_by,like,~${searchWord}~)~or(workno,like,~${searchWord}~)~or(contract_id,like,~${searchWord}~)~or(seal_man,like,~${searchWord}~)~or(sign_man,like,~${searchWord}~)~or(front_name,like,~${searchWord}~)~or(archive_name,like,~${searchWord}~)~or(mobile,like,~${searchWord}~)~or(deal_depart,like,~${searchWord}~)~or(approve_type,like,~${searchWord}~))`;
            let sealTypeSql = (sealType === 0 || tabname == '合同类') ? `~and(seal_type,like,合同类)` : ((sealType === 1 || tabname == '非合同类') ? `~and(seal_type,like,非合同类)` : '');
            let status = tabname == 1 ? '待用印' : (tabname == 2 ? '已用印,已领取,移交前台,财务归档,档案归档,已完成' : (tabname == 6 || tabname == 0 ? '已退回' : ''));

            if (tabname == 1 || tabname == 2 || tabname == 6 || tabname == 0) {
                resp = await Betools.manage.querySealListByConStatus(status, month, userinfo, sealTypeSql, searchSql, page);
                initContractList = tabname == 1 ? resp.result : initContractList;
                sealContractList = tabname == 2 ? resp.result : sealContractList;
                failContractList = (tabname == 6 || tabname == 0) ? resp.result : failContractList;
            } else if (tabname == '非合同类' || tabname == '合同类') {
                resp = await Betools.manage.querySealListByConType(userinfo, sealTypeSql, '~and(status,ne,已作废)' + searchSql);
                json_data_common = tabname == '非合同类' ? resp.result : json_data_common;
                json_data = tabname == '合同类' ? resp.result : json_data;
            }

            return { initContractList, sealContractList, failContractList, json_data, json_data_common, resp };
        },

        /**
         * 刷新用印登记的不同状态的列表数据
         */
        async refreshSealApplyTabList() {
            setTimeout(() => {
                Betools.sealapply.querySealApplyTabList(1, 0, '', '', '', '');
                Betools.sealapply.querySealApplyTabList(2, 0, '', '', '', '');
                Betools.sealapply.querySealApplyTabList(6, 0, '', '', '', '');
            }, 500);
            setTimeout(() => {
                Betools.sealapply.querySealApplyTabList(1, 0, '', '', '', '');
                Betools.sealapply.querySealApplyTabList(2, 0, '', '', '', '');
                Betools.sealapply.querySealApplyTabList(6, 0, '', '', '', '');
            }, 1000);
        },

        /**
         * 跳转到用印合同详情
         * @param {*} item 
         * @param {*} tabname 
         * @param {*} $router 
         */
        async redirectSealContractInfo(item, tabname, $router) {
            //根据当前状态，跳转到不同页面
            if (tabname == '1') {
                Betools.storage.setStore('system_seal_list_tabname', tabname);
                $router.push(`/app/sealview?id=${item.id}&statustype=none&back=seallist`); //跳转到相应的用印界面
            } else if (tabname == '2' && item.seal_type == '非合同类') {
                Betools.storage.setStore('system_seal_list_tabname', tabname);
                $router.push(`/app/sealreceive?id=${item.id}&statustype=none&type=receive&back=seallist`); //跳转到相应的用印界面
            } else if (tabname == '2' || tabname == '3') {
                Betools.storage.setStore('system_seal_list_tabname', tabname);
                $router.push(`/app/sealview?id=${item.id}&statustype=none&type=front&back=seallist`); //跳转到相应的用印界面
            } else if (tabname == '4' || tabname == '5' || tabname == '6' || tabname == '0') {
                Betools.storage.setStore('system_seal_list_tabname', tabname);
                $router.push(`/app/sealview?id=${item.id}&statustype=none&type=done&back=seallist`); //跳转到相应的用印界面
            }
        },

        async queryTabSealApplyTypeList(typeName, searchWord, statusType) {
            let json_data = null;
            if (typeName == '合同类' || typeName == '非合同类') {
                json_data = await sealapply.querySealApplyTypeList('bs_seal_regist', typeName, searchWord, statusType);
            } else if (typeName == '财务归档') {
                json_data = await sealapply.querySealApplyTypeList('bs_seal_regist_finance', '合同类', searchWord, statusType);
            } else if (typeName == '档案归档') {
                json_data = await sealapply.querySealApplyTypeList('bs_seal_regist_archive', '合同类', searchWord, statusType);
            }
            return json_data;
        },

        async querySealApplyTypeList(tableName = 'bs_seal_regist', typeName = '合同类', searchWord, statusType) {
            const userinfo = await Betools.storage.getStore('system_userinfo'); //获取当前用户信息
            const searchSql = Betools.tools.isNull(searchWord) ? '' : `~and((filename,like,~${searchWord}~)~or(create_by,like,~${searchWord}~)~or(workno,like,~${searchWord}~)~or(contract_id,like,~${searchWord}~)~or(seal_man,like,~${searchWord}~)~or(sign_man,like,~${searchWord}~)~or(front_name,like,~${searchWord}~)~or(archive_name,like,~${searchWord}~)~or(mobile,like,~${searchWord}~)~or(deal_depart,like,~${searchWord}~)~or(approve_type,like,~${searchWord}~))`; //如果存在搜索关键字
            const month = dayjs().subtract(36, 'months').format('YYYY-MM-DD'); // 获取最近数月对应的日期
            const sealTypeSql = `~and(seal_type,like,${typeName})`;
            const whereSQL = `_where=(status,ne,已作废)~and(create_time,gt,${month})~and(seal_group_ids,like,~${userinfo.username}~)${sealTypeSql}${searchSql}&_sort=-serialid&_p=0&_size=10000`;
            const tlist = await Betools.manage.queryTableData(tableName, whereSQL);
            tlist.map((item, index) => {
                item.create_time = dayjs(item.create_time).format('YYYY-MM-DD HH:mm:ss');
                item.seal_time = dayjs(item.seal_time).format('YYYY-MM-DD HH:mm:ss');
                item.receive_time = dayjs(item.receive_time).format('YYYY-MM-DD HH:mm:ss');
                item.status = item.status_w = statusType[item.status];
            });
            return tlist;
        },

        /**
         * 用户选择财务归档人员
         * @param {*} state 
         */
        async querySealApplyFinanceArchiveMan(state) {

            //获取盖章人信息financeuserList
            const finance_name = state.item.finance_name;

            try {
                if (!!finance_name) {

                    //从用户表数据中获取填报人资料
                    let user = await Betools.manage.queryUserByNameHRM(finance_name.trim());

                    if (!!user) {

                        //如果是用户数组列表，则展示列表，让用户自己选择
                        if (Array.isArray(user)) {

                            try {
                                user.map((elem, index) => {
                                    let company = elem.textfield1.split('||')[0];
                                    company = company.slice(company.lastIndexOf('>') + 1);
                                    let department = elem.textfield1.split('||')[1];
                                    department = department.slice(department.lastIndexOf('>') + 1);
                                    state.financeuserList.push({
                                        id: elem.loginid,
                                        name: elem.lastname,
                                        tel: '',
                                        address: company + "||" + elem.textfield1.split('||')[1],
                                        company: company,
                                        department: department,
                                        mail: elem.email,
                                        isDefault: !index
                                    });
                                });
                                //获取盖印人姓名
                                state.item.finance_name = user[0].lastname;
                                //当前盖印人编号
                                state.item.finance = user[0].loginid;
                            } catch (error) {
                                console.log(error);
                            }

                        } else { //如果只有一个用户数据，则直接设置

                            try {
                                let company = user.textfield1.split('||')[0];
                                company = company.slice(company.lastIndexOf('>') + 1);
                                let department = user.textfield1.split('||')[1];
                                department = department.slice(department.lastIndexOf('>') + 1);
                                //当前盖印人编号
                                state.item.finance = user.loginid;
                                //获取盖印人姓名
                                state.item.finance_name = user.lastname;
                                //将用户数据推送至对方数组
                                state.financeuserList.push({
                                    id: user.loginid,
                                    name: `${user.lastname}`,
                                    tel: user.mobile,
                                    address: company + "||" + user.textfield1.split('||')[1],
                                    company: company,
                                    department: department,
                                    mail: state.item.dealMail,
                                    isDefault: !state.financeuserList.length
                                });
                            } catch (error) {
                                console.log(error);
                            }

                        }

                        //遍历去重
                        try {
                            state.financeuserList = state.financeuserList.filter((item, index) => {
                                item.isDefault = index == 0 ? true : false;
                                let findex = state.financeuserList.findIndex((subitem, index) => {
                                    return subitem.id == item.id
                                });
                                return index == findex;
                            })
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
         * 用户选择档案归档人员
         * @param {*} state 
         */
        async querySealApplyRecordArchiveMan(state) {
            //获取盖章人信息
            const record_name = state.item.record_name;

            try {
                if (!!record_name) {

                    //从用户表数据中获取填报人资料
                    let user = await Betools.manage.queryUserByNameHRM(record_name.trim());

                    if (!!user) {

                        //如果是用户数组列表，则展示列表，让用户自己选择
                        if (Array.isArray(user)) {

                            try {
                                user.map((elem, index) => {
                                    let company = elem.textfield1.split('||')[0];
                                    company = company.slice(company.lastIndexOf('>') + 1);
                                    let department = elem.textfield1.split('||')[1];
                                    department = department.slice(department.lastIndexOf('>') + 1);
                                    state.recorduserList.push({
                                        id: elem.loginid,
                                        name: elem.lastname,
                                        tel: '',
                                        address: company + "||" + elem.textfield1.split('||')[1],
                                        company: company,
                                        department: department,
                                        mail: elem.email,
                                        isDefault: !index
                                    });
                                });

                                //获取盖印人姓名
                                state.item.record_name = user[0].lastname;
                                //当前盖印人编号
                                state.item.record = user[0].loginid;

                            } catch (error) {
                                console.log(error);
                            }

                        } else { //如果只有一个用户数据，则直接设置

                            try {
                                let company = user.textfield1.split('||')[0];
                                company = company.slice(company.lastIndexOf('>') + 1);
                                let department = user.textfield1.split('||')[1];
                                department = department.slice(department.lastIndexOf('>') + 1);
                                //当前盖印人编号
                                state.item.record = user.loginid;
                                //获取盖印人姓名
                                state.item.record_name = user.lastname;
                                //将用户数据推送至对方数组
                                state.recorduserList.push({
                                    id: user.loginid,
                                    name: `${user.lastname}`,
                                    tel: user.mobile,
                                    address: company + "||" + user.textfield1.split('||')[1],
                                    company: company,
                                    department: department,
                                    mail: state.item.dealMail,
                                    isDefault: !state.recorduserList.length
                                });
                            } catch (error) {
                                console.log(error);
                            }

                        }

                        //遍历去重
                        try {
                            state.recorduserList = state.recorduserList.filter((item, index) => {
                                item.isDefault = index == 0 ? true : false;
                                let findex = state.recorduserList.findIndex((subitem, index) => {
                                    return subitem.id == item.id
                                });
                                return index == findex;
                            })
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
         * 用户选择前台接待人员
         * @param {*} state 
         */
        async querySealApplyFrontMan(state) {
            //获取盖章人信息
            const front_name = state.item.front_name;

            try {
                if (!!front_name) {

                    //从用户表数据中获取填报人资料
                    let user = await Betools.manage.queryUserByNameHRM(front_name.trim());

                    if (!!user) {

                        //如果是用户数组列表，则展示列表，让用户自己选择
                        if (Array.isArray(user)) {

                            try {
                                user.map((elem, index) => {
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
                                        isDefault: !index
                                    });
                                });

                                //获取盖印人姓名
                                state.item.front_name = user[0].lastname;
                                //当前盖印人编号
                                state.item.front = user[0].loginid;

                            } catch (error) {
                                console.log(error);
                            }

                        } else { //如果只有一个用户数据，则直接设置

                            try {
                                let company = user.textfield1.split('||')[0];
                                company = company.slice(company.lastIndexOf('>') + 1);
                                let department = user.textfield1.split('||')[1];
                                department = department.slice(department.lastIndexOf('>') + 1);
                                //当前盖印人编号
                                state.item.front = user.loginid;
                                //获取盖印人姓名
                                state.item.front_name = user.lastname;
                                //将用户数据推送至对方数组
                                state.fuserList.push({
                                    id: user.loginid,
                                    name: `${user.lastname}`,
                                    tel: user.mobile,
                                    address: company + "||" + user.textfield1.split('||')[1],
                                    company: company,
                                    department: department,
                                    mail: state.item.dealMail,
                                    isDefault: !state.fuserList.length
                                });
                            } catch (error) {
                                console.log(error);
                            }

                        }

                        //遍历去重
                        try {
                            state.fuserList = state.fuserList.filter((item, index) => {
                                item.isDefault = index == 0 ? true : false;
                                let findex = state.fuserList.findIndex((subitem, index) => {
                                    return subitem.id == item.id
                                });
                                return index == findex;
                            })
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
         * 用户选择盖印人员
         * @param {*} state 
         * @returns 
         */
        async querySealApplySealMan(state) {

            //获取盖章人信息
            const sealman = state.item.sealman;

            //姓名输入至少2个字才开始查询
            if (sealman && sealman.length <= 1) {
                return false;
            }

            try {
                if (!!sealman) {

                    //从用户表数据中获取填报人资料
                    let user = await Betools.manage.queryUserByNameHRM(sealman.trim());

                    if (!!user) {

                        //如果是用户数组列表，则展示列表，让用户自己选择
                        if (Array.isArray(user)) {

                            try {
                                user.map((elem, index) => {
                                    let company = elem.textfield1.split('||')[0];
                                    company = Betools.tools.isNull(company) ? company : company.slice(company.lastIndexOf('>') + 1);
                                    let department = elem.textfield1.split('||')[1];
                                    department = Betools.tools.isNull(department) ? department : department.slice(department.lastIndexOf('>') + 1);
                                    state.suserList.push({
                                        id: elem.loginid,
                                        name: elem.lastname,
                                        mobile: elem.mobile,
                                        tel: '',
                                        address: Betools.tools.isNull(company) ? '' : company + "||" + Betools.tools.deNull(elem.textfield1.split('||')[1]),
                                        company: company,
                                        department: department,
                                        mail: elem.email,
                                        isDefault: !index
                                    });
                                })

                                //获取盖印人姓名
                                state.item.sealman = user[0].lastname;
                                //当前盖印人编号
                                state.item.seal = state.sealuserid = user[0].loginid;
                                //设置盖印人电话
                                state.item.seal_mobile = user[0].mobile;

                                //如果盖印人是总部的，则zonename为集团总部，如果不是总部的，则zonename为空
                                state.zoneNameValid();

                            } catch (error) {
                                console.log(error);
                            }

                        } else { //如果只有一个用户数据，则直接设置

                            try {
                                let company = user.textfield1.split('||')[0];
                                company = company.slice(company.lastIndexOf('>') + 1);
                                let department = user.textfield1.split('||')[1];
                                department = department.slice(department.lastIndexOf('>') + 1);
                                //将用户数据推送至对方数组
                                state.suserList.push({
                                    id: user.loginid,
                                    name: user.lastname,
                                    mobile: user.mobile,
                                    tel: '',
                                    address: company + "||" + user.textfield1.split('||')[1],
                                    company: company,
                                    department: department,
                                    mail: state.item.dealMail,
                                    isDefault: !state.suserList.length
                                });
                                //获取盖印人姓名
                                state.item.sealman = user.lastname;
                                //当前盖印人编号
                                state.item.seal = state.sealuserid = user.loginid;
                                //设置盖印人电话
                                state.item.seal_mobile = user.mobile;

                                //如果盖印人是总部的，则zonename为集团总部，如果不是总部的，则zonename为空
                                state.zoneNameValid();

                            } catch (error) {
                                console.log(error);
                            }

                        }

                        //遍历去重
                        try {
                            state.suserList = state.suserList.filter((item, index) => {
                                item.isDefault = index == 0 ? true : false;
                                let findex = state.suserList.findIndex((subitem, index) => {
                                    return subitem.id == item.id
                                });
                                return index == findex;
                            })
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
         * 选中当前填报人
         * @param {*} user 
         * @param {*} id 
         */
        async selectSealApplyCreateUser(user, id, state) {
            try {
                state.item.dealManager = user.name;
                state.item.mobile = user.mobile;
                state.item.username = user.username;
                state.item.signman = user.name;
                state.item.dealDepart = user.department;
                state.item.dealMail = user.mail ? user.mail : (await Betools.query.querySealManMail(user.name)).deal_mail;
            } catch (error) {
                console.log(error);
            }
            state.cacheUserInfo(); //缓存特定属性
        },

        /**
         * 选中当前合同编号
         * @param {*} value 
         */
        async selectSealApplyHContract(value, state) {
            await Betools.tools.sleep(0);
            const id = state.hContractID;
            const item = state.hContractList.find((item, index) => {
                return id == item.id
            });
            if (state.item.filename.includes('商品房买卖合同') || state.item.filename.includes('商品房购房合同')) {
                console.log('买卖合同等');
            } else if (id.includes('[') && id.includes(']')) {
                let no = parseInt(id.split(`[${dayjs().format('YYYY')}]`)[1]) + 1;
                no = `00000${no}`.slice(Betools.workconfig.CON_SEAL_CODE_LENGTH);
                state.item.contractId = `${state.item.prefix}[${dayjs().format('YYYY')}]${no}`;
            } else if (id.includes('-') && id.includes(`-${dayjs().format('YYYY')}-`)) {
                let no = parseInt(id.split(`-${dayjs().format('YYYY')}-`)[1]) + 1;
                no = `00000${no}`.slice(Betools.workconfig.CON_SEAL_CODE_LENGTH);
                state.item.contractId = `${id.split(`-${dayjs().format('YYYY')}-`)[0]}-${dayjs().format('YYYY')}-${no}`;
            }
        },

        /**
         * 查询公司列表信息
         * @param {*} data 
         * @param {*} key 
         * @returns 
         */
        async queryCompanyCommonSearch(data, key) {

            //查询缓存，如果缓存中含有数据，则直接返回
            data = await Betools.storage.setStoreDB('bs_company_flow_base#cache#find_company' + key);

            if(!(Betools.tools.isNull(data) || data.length == 0)){
                return data;
            }

            const companyAPI = `${window.BECONFIG['xmysqlAPI'].replace('gateway-xmysql','gateway-config')}/system.admin.config`;
            let companyArray = "领地控股集团有限公司,领地香港有限公司,成都玺达企业管理有限公司,成都恒禧企业管理咨询有限公司,领地集团有限公司,四川领地泛亚房地产开发有限公司,乐山领地房地产开发有限公司,四川陆地房地产开发有限公司,大连领地房地产开发有限公司,四川新领域房地产开发有限公司,贵州领地房地产开发有限公司,湖南省领创房地产开发有限公司,成都恒量企业管理咨询有限公司,北京清大怡豪投资有限公司,广西领地房地产开发有限公司,四川御成瑞海房地产开发有限公司,重庆源地川达企业管理咨询有限公司,吉林省领地房地产开发有限公司,雅安领地房地产开发有限公司,徐州方锦置业有限公司,成都领地泛太房地产开发有限公司,徐州辉创房地产开发有限公司,徐州唯创房地产开发有限公司,领地集团股份有限公司成都分公司,领地集团股份有限公司眉山分公司,领地集团股份有限公司乐山分公司,河北都能房地产开发有限公司,承德领地房地产开发有限公司,四川汉瑞达酒店管理有限公司,四川凯旋房地产开发有限公司,安徽省川达房地产开发有限公司,眉山领地房地产开发有限公司,武汉领地房地产开发有限公司,成都汉景实业有限公司,乐山恒邦置业发展有限公司,西安都能房地产开发有限公司,贵州省领悦房地产开发有限公司,四川源地房地产开发有限公司,四川宏晟悦华房地产开发有限公司,新疆领地房地产开发有限公司,乐山海纳房地产开发有限公司,郑州领域房地产开发有限公司,西昌领地房地产开发有限公司,江西省川达房地产开发有限公司,广东领悦房地产开发有限公司,山东省领地房地产开发有限公司,广东领地房地产开发有限公司,云南川达房地产开发有限公司,融量集团有限公司,四川量源投资有限公司,四川利保清大投资有限公司,四川都能矿业投资有限公司,成都唯美佳装饰工程有限公司,量源资产管理有限公司,乐山市创投融资理财信息咨询有限公司,成都宏图伟创企业管理合伙企业（有限合伙）,成都盛誉房地产营销策划有限公司,四川同源唯创企业管理咨询有限公司,四川领域企业管理咨询有限公司,海城市景地基业有限公司,成都市首华融资理财信息咨询有限公司,成都领民广源企业管理合伙企业（有限合伙）,成都领民悦华企业管理合伙企业（有限合伙）,成都睿威房地产开发有限公司,成都恒御企业管理有限公司,成都领汇达房地产开发有限公司,成都领盛源房地产开发有限公司,成都恒域房地产开发有限公司,北京当代领地置业有限公司,成都国创投资有限公司,霍尔果斯融汇通商务咨询服务有限公司,成都创达房地产营销策划有限公司,西藏瑞鼎商贸有限公司,四川创瑞达贸易有限公司,成都锐鼎鑫企业管理咨询有限公司,西藏泛誉达商贸有限公司,西藏明宇融汇商贸有限公司,西藏明宇时誉商贸有限公司,西藏瑞呈达商贸有限公司,深圳市中创华拓科技有限公司,西藏创普房地产营销有限公司,西藏恒睿房地产营销有限公司,成都御合呈玺企业管理咨询有限公司,成都鼎轩企业管理有限公司,成都睿轩科技有限公司,邛崃创达房地产营销策划有限公司,邛崃创达房地产营销策划有限公司天府新区分公司,成都瑞呈达企业管理有限公司,成都玺祥企业管理有限公司,成都航睿企业管理有限公司,成都乾汇泰富企业管理有限公司,成都航誉企业管理有限公司,成都鼎合瑞新企业管理有限公司,成都御和泰商贸有限公司,成都航玺企业管理有限公司,邛崃嘉升企业管理有限责任公司,成都星升企业管理咨询有限公司,成都星创企业管理咨询有限公司,成都旭合汇企业管理咨询有限公司,成都森思益企业管理咨询有限公司,成都浩合然实业有限公司,四川省鑫合远企业管理有限公司,成都联茂房地产营销策划有限公司,成都量誉房地产营销策划有限公司,四川优盛源企业管理有限公司,四川鑫诚丰企业管理有限公司,四川益满嘉企业管理有限公司,郫县升达置业有限责任公司,成都新隆置业有限公司,新津菁阳投资有限公司,成都金凯盛瑞房地产开发有限公司,成都领跑房地产开发有限公司,成都悦航房地产开发有限公司,成都领悦房地产开发有限公司,领地集团有限公司成都分公司,成都汉景实业有限公司青羊分公司,成都源地房地产开发有限公司,惠州领域房地产开发有限公司,成都佳雪置业有限公司,成都高新源地川达企业管理有限公司,成都航悦企业管理有限公司,成都新昱企业管理有限公司,成都港基房地产开发有限公司,北京信勉置业有限公司,成都信勉置业有限公司,彭州旭合置业有限公司,彭州都能房地产开发有限公司,四川长寿坊房地产开发有限责任公司,仁寿源地房地产开发有限公司,仁寿圣域房地产开发有限公司,,成都天府新区圣域房地产开发有限公司,仁寿领创房地产开发有限公司,四川省瑞与祥房地产开发有限公司,瀛凯众成文化投资有限公司,成都京领英赫置业有限公司,成都领源英赫置业有限公司,成都润德英赫置业有限公司,成都领尚房地产开发有限公司,眉山都能房地产开发有限公司,峨眉山市乐蜀酒店管理有限公司,成都领秀房地产开发有限公司,成都领纳房地产开发有限公司,重庆泛太房地产开发有限公司,重庆新唯创企业管理咨询有限责任公司,成都闻创博汇企业管理公司,成都创燊汇企业管理公司,广元唯创房地产开发有限公司,绵阳领创汇通房地产开发有限公司,广元川达房地产开发有限公司,德阳川达房地产开发有限公司,雅安领悦房地产开发有限公司,雅安源地房地产开发有限公司,雅安城投领地房地产开发有限公司,雅安泛亚房地产开发有限公司,雅安唯创房地产开发有限公司,雅安川达房地产开发有限公司,雅安海纳房地产开发有限公司,雅安圣域房地产开发有限公司,雅安金宏房地产开发有限公司,雅安恒量房地产开发有限公司,雅安鼎创房地产开发有限公司,雅安新领域房地产开发有限公司,雅安中恒基房地产开发有限公司,绵阳嘉瑞诚房地产开发有限公司,绵阳市三和实业有限公司,绵阳鸿远领悦房地产开发有限公司,绵阳泛太亚房地产开发有限公司,江油碧智房地产开发有限公司,绵阳领地房地产开发有限公司,绵阳市宇航数码科技有限公司,绵阳金泰实业有限公司,绵阳鑫亮平科技有限责任公司,绵阳盛兴泰来科技有限责任公司,绵阳恒量房地产开发有限公司,绵阳唯创房地产开发有限公司,绵阳瑞华文科技有限责任公司,绵阳都能房地产开发有限公司,绵阳远地房地产开发有限公司,南充领创房地产开发有限公司,绵阳华瑞达房地产开发有限公司,南充领悦房地产开发有限公司,南充唯创房地产开发有限公司,南充源地房地产开发有限公司,南充泛亚房地产开发有限公司,南充海纳房地产开发有限公司,南充川达房地产开发有限公司,南充华瑞房地产开发有限公司,南充恒量房地产开发有限公司,遂宁川达房地产开发有限公司,华蓥市创达房地产销售有限公司,领地集团有限公司乐山分公司,沐川海纳房地产开发有限公司,乐山领悦房地产开发有限公司,乐山华汇达房地产开发有限公司,乐山川达房地产开发有限公司,乐山华瑞房地产开发有限公司,乐山领创房地产开发有限公司,领地集团有限公司眉山分公司,眉山唯创房地产开发有限公司,眉山青竹沟旅游开发有限公司,眉山川达房地产开发有限公司,眉山海纳房地产开发有限公司,眉山泛亚房地产开发有限公司,张家口领域房地产开发有限公司,成都众志达企业管理合伙企业（有限合伙）,四川众誉嘉教育管理有限公司,四川华展旅游开发有限公司,四川鸿瑞通商贸有限公司,四川旭峰汇实业有限公司,成都联众创展企业管理咨询有限公司,绵阳鑫鼎泰企业策划有限公司,西藏亿美新实业有限公司,西藏恒量实业有限公司,成都领域文化旅游开发有限公司,张家口原绿房地产开发有限公司,乐山恒瑞达商业管理有限公司,眉山华瑞房地产开发有限公司,眉山华汇达房地产开发有限公司,眉山华瑞宏大置业有限公司,眉山川瑞达房地产开发有限公司,眉山领悦房地产开发有限公司,眉山协创企业管理服务有限公司,贵州川达房地产开发有限公司,泸州泛亚房地产开发有限公司,宜宾川瑞达房地产开发有限公司,凯里凯龙置业有限公司,凯里唯创房地产开发有限公司,贵阳唯创房地产开发有限公司,西昌嘉悦蜀韵酒店管理有限公司,西昌嘉悦蜀韵酒店管理有限公司桔子酒店,西昌宝瑞商业管理有限公司,西昌宝莱商业管理有限公司,西昌唯创房地产开发有限公司,西昌市海诚旅游开发有限公司,西昌领悦房地产开发有限公司,西昌领域房地产开发有限公司,西昌海域酒店管理有限公司桔子酒店,西昌海域酒店管理有限公司汉普顿酒店,西昌源地房地产开发有限公司,西昌泛太房地产开发有限公司,西昌唯创房地产开发有限公司隐居酒店,西昌海域酒店管理有限公司,西昌广源房地产开发有限公司,西昌领恒房地产开发有限公司,昆明恒量房地产开发有限公司,西昌领创房地产开发有限公司,西昌会理广量房地产开发有限公司,会理霞光置业有限公司,西昌恒量房地产开发有限公司,攀枝花领悦房地产开发有限公司,攀枝花唯创房地产开发有限公司,西昌市盛碧房地产开发有限公司,荆州领悦房地产开发有限公司,荆州领创房地产开发有限公司,新松机器人产业发展（张家界）有限公司,长沙领悦房地产开发有限公司,岳阳唯创房地产开发有限公司,济宁领域房地产开发有限公司,郑州川达房地产开发有限公司,郑州泛达房地产开发有限公司,郑州洛然房地产开发有限公司,徐州川达房地产开发有限公司,商丘川达房地产开发有限公司,驻马店皇家驿站文化旅游开发有限公司,驻马店盛世伟光房地产开发有限公司,驻马店盛世汇通房地产开发有限公司,驻马店伟昇房地产开发有限公司,驻马店伟顺房地产开发有限公司,驻马店伟汇房地产开发有限公司,徐州领源房地产开发有限公司,徐州源地房地产开发有限公司,漯河唯创房地产开发有限公司,漯河伟悦房地产开发有限公司,深圳丰盛实力钢管有限公司,佛山市南海领地房地产开发有限公司,佛山市禅城区领悦房地产开发有限公司,深圳市荣启投资发展有限公司,中山市御成房地产开发有限公司,惠州领悦房地产开发有限公司,惠州领地房地产开发有限公司,汕尾市领地房地产开发有限公司,深圳市唯创源科技有限公司,深圳新盛腾科技有限公司,广东领地泛太房地产开发有限公司,承德市君越房地产开发有限公司,承德市双滦区海建房地产开发有限公司,承德市雅昱装饰工程有限责任公司,承德川达房地产开发有限公司,承德双滦区创昱房地产营销有限公司,承德市腾庆装饰工程有限公司,北京都能企业管理有限公司,北京领地房地产开发有限公司,库尔勒领创房地产开发有限公司,巴州宝瑞企业管理有限公司,巴州宝瑞企业管理有限公司库尔勒一分公司,乌鲁木齐领地凯悦房地产开发有限公司,新疆兆龙诚祥房地产开发有限公司,乌鲁木齐领创汇通房地产开发有限公司,乌鲁木齐晟胜瑞华房地产开发有限公司,新疆民佰房地产开发有限公司,乌鲁木齐领地恒达房地产开发有限公司,乌鲁木齐领地瑞华房地产开发有限公司,乌鲁木齐领创汇生房地产开发有限公司,乌鲁木齐源地恒博房地产开发有限公司,领悦物业服务集团有限公司,四川领汇企业管理有限公司,领悦物业服务集团有限公司乐山分公司,领悦物业服务集团有限公司眉山分公司,领悦物业服务集团有限公司雅安分公司,领悦物业服务集团有限公司西昌分公司,领悦物业服务集团有限公司南海分公司,领悦物业服务集团有限公司禅城分公司,领悦物业服务集团有限公司巴州分公司,领悦物业服务集团有限公司吉林省分公司,吉林省君逸物业服务有限公司,领悦物业服务集团有限公司绵阳分公司,领悦物业服务集团有限公司惠州分公司,领悦物业服务集团有限公司承德分公司,领悦物业服务集团有限公司汕尾分公司,领悦物业服务集团有限公司攀枝花分公司,乌鲁木齐领汇都能物业服务有限公司,领悦物业服务集团有限公司华蓥分公司,领悦物业服务集团有限公司新乡分公司,领悦物业服务集团有限公司驻马店分公司,领悦物业服务集团有限公司昌吉分公司,巴州领汇物业服务有限公司,四川汇丰亿景物业服务有限公司,镇雄领汇物业管理有限公司,眉山市天富物业管理服务有限公司,领悦物业服务集团有限公司南充分公司,领悦物业服务集团有限公司荆州分公司,领悦物业服务集团有限公司凯里分公司,成都和诚领汇物业管理有限责任公司,新乡领汇物业服务有限公司,新乡市领汇美满物业服务有限公司,眉山领汇延天物业服务有限公司,领悦物业服务集团有限公司遵义分公司,领悦物业服务集团有限公司重庆分公司,领悦物业服务集团有限公司商丘分公司,四川融悦嘉汇房地产经纪有限公司,绵阳融汇领悦物业管理有限公司,领悦物业服务集团有限公司纳雍分公司,领悦物业服务集团有限公司郑州分公司,恩施州大博物业管理有限公司,铜仁市碧江区领汇物业服务有限公司,资阳市车城佳美物业有限公司,四川悦汇绿色环境发展有限公司,领悦物业服务集团有限公司泸州分公司,巴州汇悦美湖物业服务有限公司,领悦物业服务集团有限公司贵阳分公司,驻马店汇悦物业服务有限公司,领悦物业服务集团有限公司喀什分公司,库车星宇悦物业服务有限公司,领悦物业服务集团有限公司宜宾分公司,领悦物业服务集团有限公司广元分公司,新地物业服务有限公司（成都）,成都嘉锐宸汇企业管理有限公司,成都嘉锐宸汇企业管理有限公司雅安分公司,成都嘉锐宸汇企业管理有限公司乐山分公司,成都嘉锐宸汇企业管理有限公司眉山分公司,成都嘉锐宸汇企业管理有限公司西昌分公司,成都嘉锐宸汇企业管理有限公司吉林省分公司,成都嘉锐宸汇企业管理有限公司承德分公司,成都嘉锐宸汇企业管理有限公司佛山分公司,四川领居智慧生活服务有限公司,领悦物业服务集团有限公司张家界分公司,郑州汇悦物业服务有限公司,领悦物业服务集团有限公司漯河分公司,领悦物业服务集团有限公司深圳分公司,成都嘉锐宸汇企业管理有限公司巴州分公司,西昌融悦物业服务有限公司,成都量石成长股权投资中心（有限合伙）,成都量源创新股权投资合伙企业（有限合伙）,眉山市东坡区泛美企业管理有限责任公司,四川世纪融邦企业管理咨询有限公司,量石投资有限公司,广东趋势道资产管理有限公司,广东融量财富资产管理有限公司,四川泛美企业管理咨询有限公司,拉萨金沙江创业投资有限公司,北京世纪融邦投资管理有限公司,邛崃市中恒基商贸有限公司,四川华易通商贸有限公司,成都市中瑞达商贸有限公司,成都瑞通行商贸有限公司,成都宝瑞商业管理有限公司,成都宝瑞商业管理有限公司成华分公司,长春宝瑞企业管理有限公司,长春宝瑞企业管理有限公司净月分公司,四川华致信工程监理有限责任公司,眉山高康医院有限公司,成都青羊至诚和爱门诊部有限公司,四川领慈健康产业有限公司,成都双奇企业管理有限责任公司,成都杰瑞达企业管理中心（有限合伙）,成都美德康企业管理中心（有限合伙）,成都中恒达商贸有限公司,四川海纳园林绿化有限公司,中亚建业建设工程有限公司,中亚建业建设工程有限公司成都分公司,中亚建业建设工程有限公司眉山市彭山分公司,中亚建业建设工程有限公司攀枝花分公司,中亚建业建设工程有限公司乐山分公司,中亚建业建设工程有限公司荆州分公司,中亚建业建设工程有限公司巴州分公司,中亚建业建设工程有限公司绵阳分公司,中亚建业建设工程有限公司卫辉分公司,中亚建业建设工程有限公司惠州市分公司,四川博雅泰建筑工程有限公司,成都新领源房地产开发有限公司,米易川达房地产开发有限公司,米易海纳房地产开发有限公司,昆明网龙计算机信息技术有限公司,昆明网龙建设开发有限公司,驻马店盛世皇家驿站房地产开发有限公司,领悦物业服务集团有限公司达州分公司,南通新松新智置业集团有限公司,四川鸿泰云天企业管理有限公司,乐山澜山物业服务处,中共领悦物业服务集团有限公司支部委员会,眉山领域企业管理咨询有限公司,成都融悦景汇企业管理有限公司,西藏陆地实业有限公司,新地(成都)物业服务有限公司工会委员会,四川金恒源商贸有限公司,成都领樾房地产开发有限公司,成都领铭房地产开发有限公司,喀什合创汇悦物业服务有限公司,乐山东方广场物业服务处,乐山蘭台府物业服务处 ,乐山清江蘭台物业服务处,中融国际信托有限公司,上海兆苇企业管理合伙企业（有限合伙）,上海济清企业管理中心,成都领岚房地产开发有限公司,贵州美隆达实业发展有限公司,成都金科房地产有限公司,北京领地国科企业管理有限公司,广发银行股份有限公司成都分行"; 
            let array =[...new Set(companyArray.split(','))];
            let tempData = [];
            data = array.filter(item => item.includes(key));

            //查询默认配置的公司列表信息，如果存在则直接返回
            if(!(Betools.tools.isNull(data) || data.length == 0)){
                data.map((item) => tempData.push({ title: item, name:item, code:item, }));
                data = tempData;
            } 
            
            //查询配置服务中心是否含有公司列表信息，返回配置中心的公司列表
            const companyArr = await superagent.get(companyAPI).set('Content-Type','application/json;charset=UTF-8').set('accept', 'json')
            if(!Betools.tools.isNull(companyArr)){
                let text = JSON.parse(companyArr.text);
                companyArray = text.simple_company_array;
                array =[...new Set(companyArray.split(','))];
                data = array.filter(item => item.includes(key));
                if(!(Betools.tools.isNull(data) || data.length == 0)){
                    data.map((item) => tempData.push({ title: item, name:item, code:item, }));
                    data = tempData;
                }
            }

            //查询数据库的公司列表信息
            if((Betools.tools.isNull(data) || data.length == 0)){
                //查询数据库的公司列表信息
                data = await Betools.manage.queryTableData('bs_company_flow_base', `_where=(status,in,0)~and(level,gt,2)~and(name,like,~${key}~)&_fields=id,ename,name,xid&_sort=id&_p=0&_size=30`); // 获取最近12个月的已用印记录
                data.map((item, index) => { item.title = item.code = item.name; });
            }

            //保存缓存信息，下次直接使用缓存数据
            Betools.storage.setStoreDB('bs_company_flow_base#cache#find_company' + key, data, 3600);

            return data;
        },

        /**
         * 获取合同编号
         * @param {*} state 
         */
        async querySealApplyHContract(state) {
            const prefix = state.item.prefix = state.item.prefix.toUpperCase(); //获取合同编号前缀
            try {
                if (!!prefix) {
                    let list = await Betools.manage.queryContractInfoByPrefixAll(prefix.trim()); //从用户表数据中获取填报人资料
                    state.hContractList = []; //清空原数据
                    list = list.filter((item, index) => {
                        return item.id.includes(`${dayjs().format('YYYY')}`);
                    });
                    if (!!list && Array.isArray(list) && list.length > 0) { //如果数据含有[]，且为去年数据，则清空
                        try { //如果是用户数组列表，则展示列表，让用户自己选择
                            list.map((elem, index) => {
                                state.hContractList.push({
                                    id: elem.contract_id,
                                    value: `${elem.filename}[${elem.seal_type}] ${elem.contract_id},`,
                                    label: `${elem.filename}[${elem.seal_type}] ${elem.contract_id},`,
                                    address: elem.deal_manager + " " + elem.deal_depart + " 合同编号: " + elem.contract_id,
                                    name: elem.filename,
                                    tel: '',
                                    mail: elem.mail,
                                    isDefault: !index
                                });
                            })
                            state.hContractList = state.hContractList.sort((n1, n2) => {
                                const year = `[${dayjs().format('YYYY')}]`;
                                const value1 = n1.id.split(year)[1];
                                const value2 = n2.id.split(year)[1];
                                return value2 - value1;
                            });
                            state.hContractList = state.hContractList.filter((item, index) => { //遍历去重
                                item.isDefault = index == 0 ? true : false;
                                let findex = state.hContractList.findIndex((subitem, index) => {
                                    return subitem.id == item.id
                                });
                                return index == findex;
                            });
                        } catch (error) {
                            console.log(error);
                        }
                        try {
                            const id = state.hContractList[0].id;
                            if (state.item.filename.includes('商品房买卖合同') || state.item.filename.includes('商品房购房合同')) {
                                console.log('买卖合同等');
                            } else if (id.includes('[') && id.includes(']')) {
                                let no = parseInt(id.split(`[${dayjs().format('YYYY')}]`)[1]) + 1;
                                no = `00000${no}`.slice(Betools.workconfig.CON_SEAL_CODE_LENGTH);
                                state.item.contractId = `${state.item.prefix}[${dayjs().format('YYYY')}]${no}`;
                            } else if (id.includes('-') && id.includes(`-${dayjs().format('YYYY')}-`)) {
                                let no = parseInt(id.split(`-${dayjs().format('YYYY')}-`)[1]) + 1;
                                no = `00000${no}`.slice(Betools.workconfig.CON_SEAL_CODE_LENGTH);
                                state.item.contractId = `${id.split(`-${dayjs().format('YYYY')}-`)[0]}-${dayjs().format('YYYY')}-${no}`;
                        }
                    } catch (error) {
                        console.log(error);
                    }
                } else if (!!list && Array.isArray(list) && list.length == 0) { // 如果没有发现合同编号，则可以自动生成一个合同编号，500开头
                    const contract_id = `${prefix}[${dayjs().format('YYYY')}]0000`;
                    state.hContractList.push({
                        id: contract_id,
                        value: `${prefix}[${dayjs().format('YYYY')}]0000`,
                        label: `自动合同编号 `,
                        address: `编号 ${contract_id} (系统中无此编号前缀，自动生成)`,
                        name: `合同编号：${contract_id}`,
                        tel: ''
                    });

                    const id = state.hContractList[0].id;
                    if (state.item.filename.includes('商品房买卖合同') || state.item.filename.includes('商品房购房合同')) {
                        console.log('买卖合同等');
                    } else if (id.includes('[') && id.includes(']')) {
                        let no = parseInt(id.split(`[${dayjs().format('YYYY')}]`)[1]) + 1;
                        no = `00000${no}`.slice(Betools.workconfig.CON_SEAL_CODE_LENGTH);
                        state.item.contractId = `${state.item.prefix}[${dayjs().format('YYYY')}]${no}`;
                    } else if (id.includes('-') && id.includes(`-${dayjs().format('YYYY')}-`)) {
                        let no = parseInt(id.split(`-${dayjs().format('YYYY')}-`)[1]) + 1;
                        no = `00000${no}`.slice(Betools.workconfig.CON_SEAL_CODE_LENGTH);
                        state.item.contractId = `${id.split(`-${dayjs().format('YYYY')}-`)[0]}-${dayjs().format('YYYY')}-${no}`;
                    }

                }
                state.item.contractId = state.item.contractId.includes('NaN') ? state.item.contractId.replace('NaN', '0000') : state.item.contractId; //如果非合同类出现NaN，则修改状态
            }
        } catch (error) {
            console.log(error);
        }
    },

}

var sealapplyExports = {
    sealapply,
}

module.exports = sealapplyExports