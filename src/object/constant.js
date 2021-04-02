//定义配置文件对象
window.BECONFIG = {};
//Vue服务器顶级域名
window.BECONFIG['topdomain'] = window.BECONFIG['topDomain'] = window._CONFIG && window._CONFIG['topDomain'] ? window._CONFIG['topDomain'] : window.location.host.split('.').slice(-2).join('.');
//Vue服务器域名
window.BECONFIG['domain'] = 'https://www.' + window.BECONFIG['topdomain'];
//Vue-REST-API服务器域名
window.BECONFIG['restAPI'] = 'https://api.' + window.BECONFIG['topdomain'] + '/gateway';
//Vue-XMYSQL-API服务器域名
window.BECONFIG['xmysqlAPI'] = 'https://api.' + window.BECONFIG['topdomain'] + '/gateway-xmysql';
//API端服务器URL
window.BECONFIG['domainURL'] = window.BECONFIG['domain'] + '/jeecg-boot';
//Vue服务器域名,不要删除domian属性，因为有些组件是这样写的，而且位于node_module里面
window.BECONFIG['domian'] = window.BECONFIG['domain'];
//API端服务器URL,不要删除domianURL属性，因为有些组件是这样写的，而且位于node_module里面
window.BECONFIG['domianURL'] = window.BECONFIG['domain'] + '/jeecg-boot';
//下载服务器域名
window.BECONFIG['uploadURL'] = 'https://upload.' + window.BECONFIG['topdomain'];
//下载服务器域名
window.BECONFIG['uploaxURL'] = `https://oa-system-oss.oss-cn-beijing.aliyuncs.com`;
//下载服务器域名
window.BECONFIG['downloadURL'] = window.BECONFIG['uploaxURL'];
//OSS对象服务域名
window.BECONFIG['ossURL'] = window.BECONFIG['uploaxURL'];
//document下载服务器地址
window.BECONFIG['docDownURL'] = window.BECONFIG['uploadURL'];
//图片服务器域名
window.BECONFIG['imgDomainURL'] = window.BECONFIG['uploadURL'];
//KKFileView文档预览URL
window.BECONFIG['previewURL'] = 'https://fileview.' + window.BECONFIG['topdomain'] + '/onlinePreview?officePreviewType=image&url=';
//微软文档预览URL
window.BECONFIG['officeURL'] = 'https://view.officeapps.live.com/op/view.aspx?src=';
//图片压缩裁剪URL
window.BECONFIG['thumborURL'] = 'https://thumbor.' + window.BECONFIG['topdomain'] + '/unsafe/fill/100/60/sm/0/plain/';
//图片预览URL
window.BECONFIG['imageURL'] = window.BECONFIG['previewURL'];
//多媒体预览URL
window.BECONFIG['videoURL'] = window.BECONFIG['previewURL'];
//内置文档预览URL
window.BECONFIG['viewURL'] = window.BECONFIG['domainURL'] + '/generic/web/viewer.html?file=';
//单独登录URL
window.BECONFIG['casPrefixUrl'] = 'https://sso.' + window.BECONFIG['topdomain'] + '/cas';
//检测URL文件是否存在
window.BECONFIG['validURL'] = window.BECONFIG['domain'] + '/sys/common/url?path=';
//下载地址URL
window.BECONFIG['staticDomainURL'] = window.BECONFIG['uploadURL'];
//查询浏览器IP地址，所属地区
window.BECONFIG['ipLocationURL'] = `https://apis.map.qq.com/ws/location/v1/ip?key=3BFBZ-ZKD3X-LW54A-ZT76D-E7AHO-4RBD5`;
//查询天气预报URL
window.BECONFIG['weatherURL'] = `https://weather.${window.BECONFIG['topdomain']}`;
//设置公式名称
window.BECONFIG['company'] = '领地集团';
//文档转换时间
window.BECONFIG['office_expire_time'] = 10000;

const REQUEST_API_CONFIG = {
    domain: window.BECONFIG['domain'],
    restapi: window.BECONFIG['restAPI'],
    token: `${window.BECONFIG['domain']}/jeecg-boot/sys/common/token`,
    user: `${window.BECONFIG['domain']}/jeecg-boot/api/user`,
    role: `${window.BECONFIG['domain']}/jeecg-boot/api/role`,
    service: `${window.BECONFIG['domain']}/jeecg-boot/api/service`,
    permission: `${window.BECONFIG['domain']}/jeecg-boot/api/permission`,
    permissionNoPager: `${window.BECONFIG['domain']}/jeecg-boot/api/permission/no-pager`,
};
const PDF_PREVIEW_URL = `/jeecg-boot/generic/web/viewer.html?file=`;
const OFFICE_PREVIEW_URL = '/onlinePreview?officePreviewType=image&url=';
const OFFICE_PREVIEW_TYPE = ['doc', 'docx', 'xlsx', 'xls', 'ppt', 'pptx'];
const WORKFLOW_STATUS = { 1: '待提交', 2: '处理中', 3: '审核中', 4: '已完成', 5: '已知会' };
const WORKSTEP_STATUS = { 1: '-1', 2: '0', 3: '1', 4: '2', 5: '3' };
const WORKSTEP_TYPE = { 1: 'none', 2: 'primary', 3: 'primary', 4: 'success', 5: 'success' };
const LEAVE_TYPE = { 'affairs_leave': '事假', 'sick_leave': '病假', 'marital_leave': '婚假', 'funeral_leave': '丧假', 'maternity_leave': '产假', 'paternity_leave': '陪产假', 'annual_leave': '年假', 'wr_injury_leave': '工伤假', 'other_leave': '其他' };
const STORAGE_KEY = 'system_oa_app';
const TOKEN_KEY = 'Access-Token';

var constExports = {
    PDF_PREVIEW_URL,
    OFFICE_PREVIEW_URL,
    OFFICE_PREVIEW_TYPE,
    WORKFLOW_STATUS,
    WORKSTEP_STATUS,
    WORKSTEP_TYPE,
    LEAVE_TYPE,
    REQUEST_API_CONFIG,
    STORAGE_KEY,
    TOKEN_KEY
}

module.exports = constExports