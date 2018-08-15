/** @type {Map<number, User>} */
const cachedUsersById = new Map();

const thinkTimeoutSeconds = 5;

class Users {
    /**
     * Authenticate by username/emailaddress and password
     * @param {string} username
     * @param {string} password
     * @return {Promise<User|void>}
     */
    static authenticate(username, password) {
        return new Promise(async (resolve, reject) => {
            let forumsDbResult;
            try {
                const results = await forumsDb.query('SELECT `member_id`, `members_pass_hash`, `members_pass_salt` FROM `x_utf_l4g_core_members` WHERE (`email` = ? OR `name` = ?) LIMIT 0,1', [username, username]);
                if (results && results.length)
                    forumsDbResult = results[0];
            } catch (error) {
                reject(error);
                return;
            }

            if (!forumsDbResult || typeof(forumsDbResult.member_id) !== 'number') {
                resolve();
                return;
            }

            const userId = forumsDbResult.member_id;

            if (typeof(data.members_pass_hash) !== 'string') {
                resolve();
                return;
            }

            //Check password salt algorithm
            if (typeof(forumsDbResult.members_pass_salt) === 'string' && forumsDbResult.members_pass_salt.length !== 22) {
                //Old algorithm
                const hashedPassword = Utils.md5(Utils.md5(forumsDbResult.members_pass_salt) + Utils.md5(password));
                if (hashedPassword !== forumsDbResult.members_pass_hash) {
                    resolve();
                    return;
                }
            } else {
                //New algorithm
                const bcrypt = require('bcrypt');
                //console.log("Test1", password);
                //console.log("Test2", password, data.members_pass_hash);
                //console.log("Test3", password, data.members_pass_hash, bcrypt.compareSync(password, data.members_pass_hash));

                let isMatch;
                try {
                    isMatch = await bcrypt.compare(password, forumsDbResult.members_pass_hash);
                } catch (error) {
                    reject(error);
                    return;
                }

                if (!isMatch) {
                    resolve();
                    return;
                }
            }

            let user;
            try {
                user = await Users.get(userId);
            } catch (error) {
                reject(error);
                return;
            }

            resolve(user);
        });
    }

    /**
     * Get all users in cache
     * @return {Set<User>} users
     */
    static getAllCached() {
        return new Set(cachedUsersById.values());
    }

    /**
     * Adds user to database
     * @private
     * @param {object} forumsDbResult
     * @return {Promise<object>} dbResult
     */
    static addUserToDb(forumsDbResult) {
        return new Promise(async (resolve, reject) => {
            const dbResult = {
                userId: forumsDbResult.member_id,
                created: typeof(forumsDbResult.joined) === 'number' && forumsDbResult.joined > 0 ? new Date(forumsDbResult.joined * 1000) : new Date(),
            };

            //Add to users table
            try {
                await db.query(`INSERT INTO \`users\` SET ?`, [dbResult]);
            } catch(error) {
                reject(error);
                return;
            }

            resolve(dbResult);
        });
    }

    /**
     * Get user by id
     * @param {number} id
     * @return {Promise<User|void>} user
     */
    static get(id) {
        return new Promise(async (resolve, reject) => {
            if (typeof(id) !== 'number' || !id) {
                resolve();
                return;
            }

            //Get from cache
            if (cachedUsersById.has(id)) {
                resolve(cachedUsersById.get(id));
                return;
            }

            let dbUserResult, forumsDbUserResult;
            try {
                const dbResults = await db.query(`SELECT \`userId\`, \`created\`, \`coinsBalance\` FROM \`users\` WHERE \`userId\` = ? LIMIT 0,1`, [id]);
                if (dbResults && dbResults.length)
                    dbUserResult = dbResults[0];

                const forumsDbResults = config.forums.enabled ? await forumsDb.query(`SELECT \`member_id\`, \`name\`, \`joined\`, \`pp_main_photo\`, \`pp_thumb_photo\`, \`members_seo_name\` FROM \`x_utf_l4g_core_members\` WHERE \`member_id\` = ? LIMIT 0,1`, [id]) : undefined;
                if (forumsDbResults && forumsDbResults.length)
                    forumsDbUserResult = forumsDbResults[0];
            } catch (error) {
                reject(error);
                return;
            }

            if (!dbUserResult) {
                if (!forumsDbUserResult) {
                    //User not found
                    resolve();
                    return;
                }

                try {
                    dbUserResult = await this.addUserToDb(forumsDbUserResult);
                } catch(error) {
                    reject(error);
                    return;
                }
            }

            //ToDo: Check if user is banned on forums

            const User = require('../classes/user');
            const user = new User(dbUserResult.userId);
            user.parseDbResults(dbUserResult || {}, forumsDbUserResult || {});

            cachedUsersById.set(user.getId(), user);

            log.debug(`Cached user #${user.getId()}`);
            resolve(user);
        });
    }

    /**
     * Get user by id from cache
     * @param {number} id
     * @return {User|void} user
     */
    static getCache(id) {
        if (typeof(id) === 'number' && id)
            return cachedUsersById.get(id);
    }

    /**
     * Forcefully invalidate user
     * @param {User} user
     */
    static invalidate(user) {
        user.setInvalidated(true);
        cachedUsersById.delete(user.getId());
        log.debug(`Invalidated user #${user.getId()}`);
    }

    static think() {
        const users = this.getAllCached();
        const now = new Date();
        for (const user of users) {
            user.think(now);
        }

        setTimeout(() => Users.think(), thinkTimeoutSeconds * 1000);
    }
}

setTimeout(() => Users.think(), thinkTimeoutSeconds * 1000);

module.exports = Users;