/**
 * @description 过滤对象中为空的属性
 * @param obj
 * @returns {*}
 */
function filterObj(obj) {
    if (!(typeof obj == 'object')) {
        return;
    }
    for (var key in obj) {
        if (
            obj.hasOwnProperty(key) &&
            (obj[key] == null || obj[key] == undefined || obj[key] === '')
        ) {
            delete obj[key];
        }
    }
    return obj;
}

/**
 * 时间格式化
 * @param value
 * @param fmt
 * @returns {*}
 */
function formatDate(value, fmt) {
    //如果时间格式含有T，yyyy-MM-ddThh:mm:ss,yyyy-MM-ddThh:mm:ss.SSSZ，这样做可以自动把+0:00时区的时间转为+8:00的时间
    if (typeof value == 'string' && value.includes('T')) {
        value = new Date(value);
    }

    //正则表达式
    var regPos = /^\d+(\.\d+)?$/;

    if (regPos.test(value) || value instanceof Date) {
        //如果是数字
        let getDate = value instanceof Date ? value : new Date(value);
        let o = {
            'M+': getDate.getMonth() + 1,
            'd+': getDate.getDate(),
            'h+': getDate.getHours(),
            'm+': getDate.getMinutes(),
            's+': getDate.getSeconds(),
            'q+': Math.floor((getDate.getMonth() + 3) / 3),
            S: getDate.getMilliseconds(),
        };
        if (/(y+)/.test(fmt)) {
            fmt = fmt.replace(
                RegExp.$1,
                (getDate.getFullYear() + '').substr(4 - RegExp.$1.length)
            );
        }
        for (let k in o) {
            if (new RegExp('(' + k + ')').test(fmt)) {
                fmt = fmt.replace(
                    RegExp.$1,
                    RegExp.$1.length === 1 ?
                    o[k] :
                    ('00' + o[k]).substr(('' + o[k]).length)
                );
            }
        }

        try {
            fmt = fmt.replace('T', ' ');
        } catch (error) {
            console.log('formate date error : ' + error);
        }

        return fmt;
    } else {
        //TODO
        try {
            if (typeof value == 'undefined' || value == null) {
                value = '--';
            }
            value = value.trim();
            fmt = value.substr(0, fmt.length);
            fmt = fmt.replace('T', ' ');
        } catch (error) {
            console.log('formate date error : ' + error);
        }
        return fmt;
    }
}

/**
 * @description 过滤空对象
 * @param {*} data
 */
function deNull(data, defaultValue = '') {
    try {
        if (typeof data == 'undefined' || data == null || data == '' || JSON.stringify(data) == "{}") {
            return defaultValue;
        } else {
            return data;
        }
    } catch (error) {
        console.log(error);
    }
}

/**
 * @description 过滤空对象
 * @param {*} data
 */
function isNull(data) {
    try {
        if (typeof data == 'undefined' || data == null || data == '' || JSON.stringify(data) == "{}") {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.log(error);
    }
}

/**
 * @description 过滤空对象
 * @param {*} data
 */
function isBlank(data) {
    try {
        return isNull(data);
    } catch (error) {
        console.log(error);
    }
}

/**
 * @description 过滤空对象
 * @param {*} data
 */
function isEmpty(data) {
    try {
        return isNull(data);
    } catch (error) {
        console.log(error);
    }
}

/**
 * @description JS Sleep休眠函数
 * @param {*} time
 */
async function sleep(time = 1000) {
    return new Promise(function(resolve) { return setTimeout(resolve, time) });
}

/**
 * @description 获取百分率占比(除法)
 * @param {*} value
 * @param {*} total
 * @param {*} ratio
 */
function divisionPercentage(value = 0.0, total = 100.00, ratio = (0.00).toFixed(2)) {
    value = typeof value == 'string' ? parseFloat(value) : value;
    total = typeof total == 'string' ? parseFloat(total) : total;
    try {
        ratio = isNull(total) ? (0.00).toFixed(2) : parseFloat(value / total * 100).toFixed(2);
    } catch (error) {
        console.log(error);
    }
    return ratio;
}


/**
 * 深度克隆对象、数组
 * @param obj 被克隆的对象
 * @return 克隆后的对象
 */
function cloneObject(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * @description clone对象
 * @param {*} obj 被克隆对象
 */
function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * 随机生成数字
 *
 * 示例：生成长度为 12 的随机数：randomNumber(12)
 * 示例：生成 3~23 之间的随机数：randomNumber(3, 23)
 *
 * @param1 最小值 | 长度
 * @param2 最大值
 * @return int 生成后的数字
 */
function randomNumber() {
    // 生成 最小值 到 最大值 区间的随机数
    const random = (min, max) => {
        return Math.floor(Math.random() * (max - min + 1) + min);
    };
    if (arguments.length === 1) {
        let [length] = arguments;
        // 生成指定长度的随机数字，首位一定不是 0
        let nums = [...Array(length).keys()].map(
            i => (i > 0 ? random(0, 9) : random(1, 9))
        );
        return parseInt(nums.join(''));
    } else if (arguments.length >= 2) {
        let [min, max] = arguments;
        return random(min, max);
    } else {
        return Number.NaN;
    }
}

/**
 * @description 检查是否为微信
 */
function isWechat() {
    var ua = navigator.userAgent.toLowerCase();
    var sua = window.localStorage.getItem('system_navigator_useragent') || '';
    if (ua.match(/MicroMessenger/i) == "micromessenger" || sua.match(/MicroMessenger/i) == "micromessenger") { //这就是微信用的内置浏览器
        return true;
    } else {
        return true;
    }
}

/**
 * @description 检查是否为微信
 */
function isWework() {
    var ua = navigator.userAgent.toLowerCase();
    if (ua.match(/MicroMessenger/i) == "micromessenger") { //这就是微信用的内置浏览器
        return true;
    } else {
        return false;
    }
}

/**
 * @description 检查是否为微信
 */
function isPCWeb() {
    var ua = navigator.userAgent.toLowerCase();
    var sua = window.localStorage.getItem('system_navigator_useragent') || '';
    if (ua.match(/MicroMessenger/i) == "micromessenger" || sua.match(/MicroMessenger/i) == "micromessenger") { //这就是微信用的内置浏览器
        return false;
    } else {
        return true;
    }
}

function queryZoneProject(company = '', name, zone = '', project = '') {
    let temp = company.split(name);
    console.log(`${temp.toString()}`);
    if (temp[1].includes('>')) {
        temp[1] = temp[1].replace('项目组>', '');
        zone = temp[1].split('>')[0];
        project = temp[1].split('>')[1];
    } else {
        zone = temp[1];
    }
    return { company, zone, project };
}

function queryZoneProjectAll(company, cnamelist, department = '') {
    try {
        let zone = '';
        let project = department ? department.slice(0, department.lastIndexOf('>')) : '';
        department = department ? department.slice(department.lastIndexOf('>') + 1) : '';
        for (const name of cnamelist) {
            if (company.includes(`>${name}>`)) {
                let temp = queryZoneProject(company, `>${name}>`);
                company = name;
                zone = temp.zone;
                project = !temp.project ? project : temp.project;
                break;
            }
        }
        return { company, zone, project, department };
    } catch (error) {
        return { company, zone: '', project: '', department };
    }
}

/**
 * 随机生成字符串
 * @param length 字符串的长度
 * @param chats 可选字符串区间（只会生成传入的字符串中的字符）
 * @return string 生成的字符串
 */
function randomString(length, chats) {
    if (!length) length = 1;
    if (!chats) chats = '0123456789qwertyuioplkjhgfdsazxcvbnm';
    let str = '';
    for (let i = 0; i < length; i++) {
        let num = randomNumber(0, chats.length - 1);
        str += chats[num];
    }
    return str;
}

/**
 * 随机生成uuid
 * @return string 生成的uuid
 */
function randomUUID() {
    let chats = '0123456789abcdef';
    return randomString(32, chats);
}

/**
 * 下划线转驼峰
 * @param string
 * @returns {*}
 */
function underLine2CamelCase(string) {
    return string.replace(/_([a-z])/g, function(all, letter) {
        return letter.toUpperCase();
    });
}

/**
 * 邮箱
 * @param {*} s
 */
function isEmail(s) {
    return /^([a-zA-Z0-9._-])+@([a-zA-Z0-9_-])+((.[a-zA-Z0-9_-]{2,3}){1,2})$/.test(s)
}

/**
 * 手机号码
 * @param {*} s
 */
function isMobile(s) {
    return /^1[0-9]{10}$/.test(s)
}

/**
 * 电话号码
 * @param {*} s
 */
function isPhone(s) {
    return /^([0-9]{3,4}-)?[0-9]{7,8}$/.test(s)
}

/**
 * URL地址
 * @param {*} s
 */
function isURL(s) {
    return /^http[s]?:\/\/.*/.test(s)
}

/**
 * 提取字符串中的数字
 * @param {*} str 
 */
function queryNumber(str) {
    return str.replace(/[^0-9]/ig, "");
}

/**
 * @description 去除字符串中html标签
 * @param {*} str
 */
function delHtmlTag(str) {
    try {
        if (isNull(str)) {
            return ""; //去掉所有的html标记
        } else {
            return deNull(str).replace(/<[^>]+>/g, "").replace(/&nbsp;/g, ""); //去掉所有的html标记
        }
    } catch (error) {
        console.log(error);
    }
}

/**
 * @description 字符串缩略函数
 * @param {*} str
 */
function abbreviation(str, length = 75) {
    try {

        if (deNull(str).length < length) {
            return deNull(str).trim();
        } else {
            return deNull(str).trim().substring(0, length) + '...';
        }
    } catch (error) {
        console.log(error);
    }
}

/**
 * @description 检测URL是否有效
 * @param {*} url
 */
async function queryUrlValid(url) {
    var queryURL = `${window.BECONFIG['validURL']}${url}`;
    try {
        var res = await superagent.get(queryURL);
        console.log(' url :' + url + ' result :' + JSON.stringify(res));
        return res.body.success;
    } catch (err) {
        console.log(err);
    }
}

/**
 * 获取URL参数值
 * @param {*} val
 */
function getUrlParam(name) {
    try {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)"); //构造一个含有目标参数的正则表达式对象
        var r = window.location.hash.substr(window.location.hash.indexOf('?') + 1).match(reg); //匹配目标参数
        if (r != null) return decodeURI(r[2]);
        return null; //返回参数值
    } catch (error) {
        console.log(error);
    }
}

/**
 * 获取URL参数值
 * @param {*} val
 */
function queryUrlParam(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)"); //构造一个含有目标参数的正则表达式对象
    var r = window.location.hash.substr(window.location.hash.indexOf('?') + 1).match(reg); //匹配目标参数
    if (r != null) return decodeURI(r[2]);
    return null; //返回参数值
}

/**
 * @description URI加密
 * @param {*} value
 */
function encodeURI(value) {
    return window.encodeURIComponent(value);
}

/**
 * @description URI解密
 * @param {*} value
 */
function decodeURI(value) {
    return window.decodeURIComponent(value);
}

/**
 * 获取URL参数值
 * @param {*} val
 */
function queryUrlString(name, flag = 'history') {
    try {
        if (flag == 'history') {
            var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)"); //构造一个含有目标参数的正则表达式对象
            var r = window.location.hash.substr(window.location.hash.indexOf('?') + 1).match(reg); //匹配目标参数
            if (r != null) {
                if (name == 'system_type') {
                    localStorage.setItem('system_type', decodeURI(r[2]));
                }
                return decodeURI(r[2]);
            } else if (name == 'system_type') {
                return localStorage.getItem('system_type') || 'v2'
            }
            return null; //返回参数值
        } else {
            var reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)');
            var r = window.location.search.substr(1).match(reg); //search,查询？后面的参数，并匹配正则
            if (r != null) return unescape(r[2]);
        }
    } catch (error) {
        console.error(error);
    }
    return '';
}

/**
 * @description 合成唯一编码
 */
function queryUniqueID(length = 32) {
    //日期格式化
    var timestamp = new Date().getTime();
    //定义动态编码
    var id = formatDate(timestamp, "yyyyMMddhhmmssS");
    //打印日志
    console.log('动态编号 :' + id);
    //定义随机编码
    var random = (Math.floor(Math.random() * 100000000000000000000) + "") + (Math.floor(Math.random() * 100000000000000000000) + "");
    //打印随机编码
    console.log('随机编号 :' + random);
    //合成动态编码
    id = (id + random).replace(/\./g, '').substring(0, length);
    //返回唯一编码
    return id;
}

/**
 * @description 电话号码隐藏中间4位
 * @param {*} mobile 
 */
function mobileHide(mobile) {
    mobile = mobile.slice(0, 11);
    var re = /(\d{3})(\d{4})(\d{4})/;
    return mobile.replace(re, "$1****$3");
}

/**
 * @description 电话号码隐藏中间4位
 * @param {*} mobile 
 */
function mobileEnsconce(mobile) {
    mobile = mobile.slice(0, 11);
    var re = /(\d{3})(\d{4})(\d{4})/;
    return mobile.replace(re, "$1****$3");
}

/**
 * @description 检测字符串是否包含字符函数
 * @param {*} origin
 * @param {*} arg
 */
function contain(origin, arg) {

    //设置前后缀信息
    origin = `,${origin},`;

    //设置包含的用户
    var ready = '';

    //设置数组信息
    var array = null;

    try {
        array = arg.split(',');

        //遍历数据，并查询出含有的用户数据
        for (var item of array) {
            ready = origin.includes(`,${item},`) ? `${ready},${item}` : ready;
        }

    } catch (error) {
        console.log(error);
    }

    //去掉字符串开头的逗号
    if (ready.startsWith(',')) {
        ready = ready.substring(1);
    }

    //去掉字符串结尾的逗号
    if (ready.endsWith(',')) {
        ready = ready.substring(0, ready.length - 1);
    }

    //返回包含的用户数据
    return ready;
}

var toolsExports = {
    tools: {
        filterObj,
        formatDate,
        deNull,
        isNull,
        isBlank,
        isEmpty,
        sleep,
        divisionPercentage,
        cloneObject,
        clone,
        randomNumber,
        isWechat,
        isWework,
        isPCWeb,
        queryZoneProject,
        queryZoneProjectAll,
        randomString,
        randomUUID,
        underLine2CamelCase,
        isEmail,
        isMobile,
        isPhone,
        isURL,
        delHtmlTag,
        abbreviation,
        queryUrlValid,
        getUrlParam,
        queryUrlParam,
        encodeURI,
        decodeURI,
        queryUrlString,
        queryUniqueID,
        mobileHide,
        mobileEnsconce,
        contain,
    },
}

module.exports = toolsExports