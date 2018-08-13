class UserCoins {
    /**
     * Construct UserCoins class
     * @param {User} user
     */
    constructor(user) {
        this.user = user;

        /** @private **/
        this.coinsBalance = 0;
    }

    /**
     * Get parent user
     * @return {User} user
     */
    getUser() {
        return this.user;
    }

    /**
     * Give coins
     * @param {number} amount
     */
    give(amount) {
        if (typeof(amount) !== 'number' || amount <= 0) {
            log.warn('Coins amount to give was an invalid number', typeof(amount), amount);
            return;
        }

        this.setCoinsBalance(this.getCoinsBalance() + amount);
    }

    /**
     * Take coins
     * @param {number} amount
     */
    take(amount) {
        if (typeof(amount) !== 'number'  || amount <= 0) {
            log.warn('Coins amount to take was an invalid number', typeof(amount), amount);
            return;
        }

        this.setCoinsBalance(this.getCoinsBalance() - amount);
    }

    /**
     * Set new coins balance
     * @param {number} newBalance
     */
    setCoinsBalance(newBalance) {
        if (newBalance === this.coinsBalance || typeof(newBalance) !== 'number')
            return;

        //Clamp to MySQL `int` types limits
        this.coinsBalance = Utils.mathClamp(newBalance, -2147483648, 2147483647);
        this.getUser().setDataChanged();
    }

    /**
     * Get current coins balance
     * @return {number} coinsBalance
     */
    getCoinsBalance() {
        return typeof(this.coinsBalance) === 'number' ? this.coinsBalance : 0;
    }
}

module.exports = UserCoins;