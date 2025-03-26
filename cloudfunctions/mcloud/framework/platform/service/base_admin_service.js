/**
 * Notes: 后台管理模块业务基类
 * Date: 2021-03-15 07:48:00 
 * Ver : CCMiniCloud Framework 2.0.8 ALL RIGHTS RESERVED BY cclinux0730 (wechat)
 */

const BaseService = require('./base_service.js');

const timeUtil = require('../../../framework/utils/time_util.js');
const appCode = require('../../../framework/core/app_code.js');

const config = require('../../../config/config.js');
const util = require('../../../framework/utils/util.js');
const AdminModel = require('../model/admin_model.js');
const LogModel = require('../model/log_model.js'); 
const AppError = require('../../../framework/core/app_error.js');

class BaseAdminService extends BaseService {

    async initSetup() {
        // 初始化检测
        let where = {};
        let setup = await AdminModel.getOne(where);
        if (!setup) {
            // 创建默认管理员账号
            let data = {
                ADMIN_NAME: '系统管理员',
                ADMIN_PHONE: '',
                ADMIN_PWD: 'e10adc3949ba59abbe56e057f20f883e', // 123456的md5
                ADMIN_TYPE: 1,
                ADMIN_STATUS: 1,
                ADMIN_ID: 'admin'
            };
            await AdminModel.insert(data);
            setup = await AdminModel.getOne(where);
        }
        return setup;
    }
	/** 是否管理员 */
	async isAdmin() {
        // 获取管理员信息
        let admin = await this.getAdminInfo();
		if (!admin)
			this.AppError('管理员不存在', appCode.ADMIN_ERROR);
		return admin;
	}

	/** 是否超级管理员 */
    async isSuperAdmin() {
        let admin = await this.getAdminInfo();
        if (!admin) return false;

        return (admin.ADMIN_TYPE == 1);
    }

    async checkSuperAdmin() {
        if (!await this.isSuperAdmin()) {
            this.AppError('该功能需要超级管理员权限', appCode.ADMIN_ERROR);
        }
    }

    async getAdminInfo() {
        let token = this.getToken();
        if (!token) {
            return null;
        }

        let where = {
            ADMIN_TOKEN: token,
            ADMIN_STATUS: 1
        }
        let admin = await AdminModel.getOne(where);
        if (!admin) {
            return null;
        }

        // 判断token是否过期
        if (admin.ADMIN_TOKEN_TIME < timeUtil.time() - config.ADMIN_TOKEN_EXPIRE) {
            return null;
        }

        return admin;
    }

    getToken() {
        let token = this._token;
        if (!token) {
            token = util.getToken();
            this._token = token;
        }
        return token;
    }
 
	/** 写入日志 */
	async insertLog(content, admin, type) {
		if (!admin) return;

		let data = {
			LOG_CONTENT: content,
			LOG_ADMIN_ID: admin._id,
			LOG_ADMIN_NAME: admin.ADMIN_NAME,
			LOG_ADMIN_DESC: admin.ADMIN_DESC,
			LOG_TYPE: type
		}
		await LogModel.insert(data);
	} 

}

module.exports = BaseAdminService;