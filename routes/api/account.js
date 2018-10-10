/**
 * This is a legacy API end-point
 */

const Express = require('express');
const router = module.exports = Express.Router({
    strict: App.express.get('strict routing'),
    caseSensitive: App.express.get('case sensitive routing')
});

router.post('/login', async (req, res) => {
    let username = req.body.user;
    let password = req.body.password;

    if (typeof(username) !== 'string' || typeof(password) !== 'string' || username.length < 2 || username.length > 150 || password.length < 2 || password.length > 150) {
        res.json({
            error: 2,
            errorMessage: 'Input invalid'
        });
        return;
    }

    username = unescape(username);
    password = unescape(password);

    let user;
    try {
        user = await Users.authenticate(username, password);
    } catch (error) {
        log.error(error);
        res.json({
            error: 1,
            errorMessage: 'Internal error'
        });
        return;
    }

    if (!user) {
        res.json({
            error: 7,
            errorMessage: 'Unknown user'
        });
        return;
    }

    res.json({
        userId: user.getId(),
        user: user.getName(), //Deprecated
        name: user.getName(),
        emailAddress: undefined, //Deprecated
        profile: {
            photo: user.getAvatar(),
            photoThumb: user.getAvatarThumb(),
            title: undefined //Deprecated
        },
        coinsBalance: user.getCoins().getBalance(),
        joinDate: user.getCreated(),
        joinTimestamp: user.getCreated() ? Math.round(user.getCreated().getTime() / 1000) : undefined
    });
});


router.post('/details', async (req, res) => {
    const userId = parseInt(req.body.userId, 10);
    if (isNaN(userId)) {
        res.json({
            error: 1,
            errorMessage: 'Invalid user'
        });
        return;
    }

    let user;
    try {
        user = await Users.get(userId);
    } catch (error) {
        log.error(error);
        res.json({
            error: 2,
            errorMessage: 'Unknown user'
        });
        return;
    }

    if (!user) {
        res.json({
            error: 2,
            errorMessage: 'Unknown user'
        });
        return;
    }

    res.json({
        userId: user.getId(),
        name: user.getName(),
        emailAddress: undefined, //Deprecated
        joinDate: user.getCreated(),
        joinTimestamp: user.getCreated() ? Math.round(user.getCreated().getTime() / 1000) : undefined,
        coinsBalance: user.getCoins().getBalance(),
        profile: {
            photo: user.getAvatar(),
            photoThumb: user.getAvatarThumb(),
            title: undefined //Deprecated
        }
    });
});