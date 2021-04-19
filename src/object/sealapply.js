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
            return { json_fields, json_fields_common };
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