const Express = require('express');
const router = module.exports = Express.Router({
    strict: App.express.get('strict routing'),
    caseSensitive: App.express.get('case sensitive routing')
});

router.param('userId', async (req, res, next, userId) => {
    userId = parseInt(userId, 10);
    if (isNaN(userId)) {
        res.json({
            error: 1,
            errorMessage: 'Invalid User ID'
        });
        return;
    }

    try {
        req.user = await Users.get(userId);
    } catch (error) {
        log.error(error);
        res.json({
            error: 0,
            errorMessage: 'Internal error'
        });
        return;
    }

    if (!req.user) {
        res.json({
            error: 1,
            errorMessage: 'Unknown user'
        });
        return;
    }

    next();
});

router.get('/:userId/summary', async (req, res) => {
    /** @type {User} */
    const user = req.user;

    res.json({
        userId: user.getId(),
        identifier: user.getIdentifier(),
        name: user.getName(),
        created: user.getCreated(),
        coinsBalance: user.getCoins().getBalance(),
        avatar: user.getAvatar(),
        avatarThumb: user.getAvatarThumb(),
        generated: new Date()
    });
});

router.post('/:userId/coins/changeBalance', async (req, res) => {
    /** @type {User} */
    const user = req.user;

    const amount = req.body.amount;

    if (typeof(amount) !== 'number' || !amount) {
        res.json({
            error: 10,
            errorMessage: 'Invalid amount'
        });
        return;
    }

    const output = {
        userId: user.getId(),
        generated: new Date()
    };

    //user.getCoins().changeBalance(amount);

    let coinsTransactionId;
    try {
        coinsTransactionId = await user.getCoins().submitTransaction(amount, req.appId, 'Balance change', true);
    } catch (error) {
        res.status(500);
        res.json({
            error: 0,
            errorMessage: 'Transaction error'
        });
        log.error(error);
        return;
    }

    if (!coinsTransactionId) {
        output.error = 11;
        output.errorMessage = 'Transaction denied';
    } else {
        output.coinsTransactionId = coinsTransactionId;

        if (amount < 0)
            output.coinsTaken = Math.abs(amount);
        else
            output.coinsGiven = amount;
    }

    //New balance
    output.coinsBalance = user.getCoins().getBalance();

    res.json(output);
});

router.post('/:userId/coins/submitTransaction', async (req, res) => {
    /** @type {User} */
    const user = req.user;

    const amount = req.body.amount;
    const comments = req.body.comments && req.body.comments.length < 1000 ? req.body.comments : undefined;

    if (typeof(amount) !== 'number' || !amount) {
        res.json({
            error: 10,
            errorMessage: 'Invalid amount'
        });
        return;
    }

    const output = {
        userId: user.getId(),
        generated: new Date()
    };

    let coinsTransactionId;
    try {
        coinsTransactionId = await user.getCoins().submitTransaction(amount, req.appId, comments);
    } catch (error) {
        res.status(500);
        res.json({
            error: 0,
            errorMessage: 'Transaction error'
        });
        log.error(error);
        return;
    }

    if (!coinsTransactionId) {
        output.error = 11;
        output.errorMessage = 'Transaction denied';
    } else {
        output.coinsTransactionId = coinsTransactionId;
        if (amount < 0)
            output.coinsTaken = Math.abs(amount);
        else
            output.coinsGiven = amount;
    }

    //New balance
    output.coinsBalance = user.getCoins().getBalance();

    res.json(output);
});