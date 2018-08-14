const Express = require('express');
const router = module.exports = Express.Router(undefined);

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

    let forumsDbResult;
    try {
        const results = await forumsDb.query('SELECT `member_id`, `members_pass_hash`, `members_pass_salt` FROM `x_utf_l4g_core_members` WHERE (`email` = ? OR `name` = ?) LIMIT 0,1', [username, username]);
        if (results && results.length)
            forumsDbResult = results[0];
    } catch (error) {
        log.error(error);
        res.json({
            error: 3,
            errorMessage: 'Failed to get user information'
        });
        return;
    }

    if (!forumsDbResult || typeof(forumsDbResult.member_id) !== 'number') {
        res.json({
            error: 3,
            errorMessage: 'Unknown forum user/email'
        });
        return;
    }

    const userId = forumsDbResult.member_id;

    if (typeof(data.members_pass_hash) !== 'string') {
        return res.json({
            error: 4,
            errorMessage: 'Missing data for login'
        });
    }

    //Check password salt algorithm
    if (typeof(forumsDbResult.members_pass_salt) === 'string' && forumsDbResult.members_pass_salt.length !== 22) {
        //Old algorithm
        const hashedPassword = Utils.md5(Utils.md5(forumsDbResult.members_pass_salt) + Utils.md5(password));
        if (hashedPassword !== forumsDbResult.members_pass_hash) {
            return res.json({
                error: 6,
                errorMessage: 'Password mismatch.'
            });
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
            log.error(error);
            res.json({
                error: 6,
                errorMessage: 'Password validation failed.'
            });
            return;
        }

        if (!isMatch) {
            res.json({
                error: 6,
                errorMessage: 'Password validation failed.'
            });
            return;
        }
    }

    let user;
    try {
        user = await Users.get(userId);
    } catch (error) {
        log.error(error);
        res.json({
            error: 7,
            errorMessage: 'Unknown user'
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
        greenCoins: user.getCoins().getBalance(),
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
        greenCoins: user.getCoins().getBalance(),
        profile: {
            photo: user.getAvatar(),
            photoThumb: user.getAvatarThumb(),
            title: undefined //Deprecated
        }
    });
});