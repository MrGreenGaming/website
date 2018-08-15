const Express = require('express');
const router = module.exports = Express.Router(undefined);

router.param('userId', function (req, res, next, userId) {
    try {
        req.user = Users.get(userId);
    } catch(error) {
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

router.post('/:userId/coins/submitTransaction', async (req, res) => {
    /** @type {User} */
    const user = req.user;

    const amount = req.body.amount;

    if (typeof(amount) !== 'number' || !amount) {
        res.json({
            error: 1,
            errorMessage: 'Invalid amount'
        });
    }

    const output = {
        userId: user.getId(),
        generated: new Date()
    };

    if (amount < 0) {
        const absoluteAmount = Math.abs(amount);
        user.getCoins().take(absoluteAmount);
        output.coinsTaken = absoluteAmount;
    } else {
        user.getCoins().give(amount);
        output.coinsGiven = amount;
    }

    output.coinsBalance = user.getCoins().getBalance();

    res.json(output);
});