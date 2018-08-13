const thinkTimeoutSeconds = 120;
const cacheTimeoutSeconds = 60 * 10;
if (cacheTimeoutSeconds <= thinkTimeoutSeconds)
    log.error('cacheTimeoutSeconds needs to be a higher value than thinkTimeoutSeconds in user class!');

class User {
    /**
     * Construct User
     * @param {number} id
     */
    constructor(id) {
        /** @private */
        this.id = id;

        /** @private */
        this.initialized = new Date();

        this.lastActivity = new Date();

        /** @private
         * @type {boolean|Date} */
        this.dataChanged = false;

        this.setNextThink();

        const UserCoins = require('./user/coins');
        /** @private */
        this.coins = new UserCoins(this);

        /** @private */
        this.invalidated = false;
    }

    /**
     * Get user coins sub-class
     * @return {UserCoins} userCoins
     */
    getCoins() {
        return this.coins;
    }

    /**
     * Set next think date
     * @private
     * @param {Date} [date=now]
     */
    setNextThink(date) {
        if (!(date instanceof Date)) {
            date = new Date();
            date.setSeconds(date + thinkTimeoutSeconds);
        }

        this.nextThink = date;
    }

    /**
     * Get next think date
     * @return {Date} nextThink
     */
    getNextThink() {
        return this.nextThink;
    }

    /**
     * Get user id
     * @return {number} id
     */
    getId() {
        return this.id;
    }

    /**
     * @param {Date|boolean} [date=now]
     */
    setDataChanged(date) {
        if (!(date instanceof Date) && (typeof(date) !== 'boolean' || date))
            date = new Date();

        this.dataChanged = date;
        this.setLastActivity();
    }

    /**
     * Is data changed?
     * @return {boolean}
     */
    isDataChanged() {
        return this.dataChanged instanceof Date;
    }

    /**
     * Parse database result
     * @param {object} dbResult
     */
    parseDbResult(dbResult) {
        if (dbResult.created instanceof Date)
            this.created = dbResult.created;
        if (typeof(dbResult.coinsBalance) === 'number')
            this.coinsBalance = dbResult.coinsBalance;
    }

    /**
     * Get initialization date
     * @return {Date} initializedDate
     */
    getInitialized() {
       return this.initialized;
    }

    /**
     * Get creation date
     * @return {Date|void} createdDate
     */
    getCreated() {
        return this.created;
    }

    /**
     * Set creation date
     * @param {Date|void} [date=now]
     */
    setCreated(date) {
        if (!(date instanceof Date))
            date = new Date();

        this.created = date;
        this.setDataChanged();
    }

    /**
     * Set last activity date
     * @param {Date|void} [date=now]
     */
    setLastActivity(date) {
        if (!(date instanceof Date))
            date = new Date();

        this.lastActivity = date;
    }

    /**
     * Get last activity
     * @return {Date} date
     */
    getLastActivity() {
        return this.lastActivity;
    }

    /**
     * Think
     * @param {Date} [compareAgainst=now]
     */
    think(compareAgainst) {
        if (!(compareAgainst instanceof Date))
            compareAgainst = new Date();

        if (compareAgainst < this.getNextThink())
            return;
        this.setNextThink();

        if (this.isDataChanged()) {
            this.setDataChanged(false);
            this.save();
        }

        if (!this.isInvalidated() && !this.checkValidity(compareAgainst)) {
            Users.invalidate(this);
            return;
        }
    }

    /**
     * Save to database
     * @async
     * @private
     * @return {void}
     */
    async save() {
        const dbData = {
            coinsBalance: this.getCoins().getCoinsBalance(),
            created: this.getCreated()
        };

        try {
            await db.query(`UPDATE \`users\` SET ? WHERE \`userId\` = ?`, [dbData, this.getId()]);
        } catch(error) {
            log.error(error);
        }
    }

    /**
     * Is user invalidated in cache
     * @return {boolean} valid
     */
    isInvalidated() {
        return this.invalidated;
    }

    /**
     *
     * @param {Date} [compareAgainst=now]
     * @return {boolean} valid
     */
    checkValidity(compareAgainst) {
        if (this.invalidated)
            return false;

        //Check if there are changes left to save
        if (this.isDataChanged())
            return true;

        if (!(compareAgainst instanceof Date))
            compareAgainst = new Date();

        //Add timeout time to last activity
        const lastActivity = new Date(this.getLastActivity().getTime());
        lastActivity.setSeconds(lastActivity.getSeconds() + cacheTimeoutSeconds);

        return compareAgainst <= lastActivity;
    }

    /**
     * Set cache invalidation
     * @param {boolean} invalidated
     */
    setInvalidated(invalidated) {
        this.invalidated = invalidated;
    }
}

module.exports = User;