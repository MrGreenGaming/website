class UserCoins {
    /**
     * Construct UserCoins class
     * @param {User} user
     */
    constructor(user) {
        this.user = user;

        /** @private **/
        this.balance = 0;
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

        this.setBalance(this.getBalance() + amount);
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

        this.setBalance(this.getBalance() - amount);
    }

    /**
     * Set new coins balance
     * @param {number} newBalance
     */
    setBalance(newBalance) {
        if (typeof(newBalance) !== 'number')
            return;

        newBalance = Utils.mathClamp(newBalance, -2147483648, 2147483647);
        if (newBalance === this.balance)
            return;

        //Clamp to MySQL `int` types limits
        this.balance = newBalance;
        this.getUser().setDataChanged();
    }

    /**
     * Get current coins balance
     * @return {number} coinsBalance
     */
    getBalance() {
        return typeof(this.balance) === 'number' ? this.balance : 0;
    }
}

module.exports = UserCoins;