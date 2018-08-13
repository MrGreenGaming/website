/** @type {Map<number, ApiApp>} */
const cachedApiApps = new Map();

const reloadTime = 600;

class ApiApps {
    /**
     * Load games
     * @return {Promise<void>}
     */
    static load() {
        return new Promise(async (resolve, reject) => {
            log.debug('Loading api apps');

            let dbApiApps;
            try {
                dbApiApps = await db.query(`SELECT \`appId\`, \`name\`, \`secretHash\` FROM \`apiApps\` WHERE \`active\` = 1`);
            } catch (error) {
                reject(error);
                return;
            }

            cachedApiApps.clear();

            for (const dbApiApp of dbApiApps) {
                const apiApp = ApiApps.processDbApiApp(dbApiApp);
                cachedApiApps.set(apiApp.getId(), apiApp);
            }

            //Next reload
            setTimeout(async () => {
                try {
                    await this.load();
                } catch(error) {
                    log.error(error);
                }
            }, reloadTime * 1000);

            resolve();
        });
    }

    /**
     * Process database game
     * @private
     * @param {object} dbApiApp
     * @return {ApiApp} apiApp
     */
    static processDbApiApp(dbApiApp) {
        const ApiApp = require('../classes/apiApp');
        const apiApp = new ApiApp(dbApiApp.appId);
        apiApp.parseDb(dbApiApp);

        return apiApp;
    }

    /**
     * Get API app by id
     * @param {number} id
     * @return {ApiApp|void} apiApp
     */
    static get(id) {
        if (id)
            cachedApiApps.get(id);
    }
}

module.exports = ApiApps;