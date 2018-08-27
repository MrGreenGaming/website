const Express = require('express');
const router = module.exports = Express.Router(undefined);

router.use('/', async (req, res, next) => {
    const userId = req.session.userId;
    if (typeof(userId) === 'number' && !req.user) {
        try {
            req.user = await Users.get(userId);
        } catch(error) {
            log.warn(error);
        }
    }

    next();
});

router.get('/', (req, res, next) => {
    const template = require('../views/account/index.marko');
    res.marko(template, {
        page: {
            title: 'Account',
            description: 'Manage your Mr. Green Gaming community account.',
            path: App.getExpressPath(req.baseUrl, req.path)
        }
    });
});

router.get('/login', (req, res, next) => {
    if (req.user) {
        res.redirect('./');
        return;
    }

    const template = require('../views/account/login.marko');
    res.marko(template, {
        page: {
            title: 'Account Login',
            description: 'Login to your Mr. Green Gaming community account.',
            path: App.getExpressPath(req.baseUrl, req.path)
        }
    });
});

router.post('/login', async (req, res, next) => {
    const username = req.body.user;
    const password = req.body.password;

    let user;

    if (typeof(username) === 'string' && typeof(password) === 'string' && username && password && username.length < 100 && password.length < 200) {
        try {
            user = await Users.authenticate(username, password);
        } catch (error) {
            log.warn(error);
        }
    }

    if (user)
        req.session.userId = user.getId();
    else {
        delete req.session.userId;
    }

    if(/application\/json;/.test(req.get('accept'))) {
        res.json({
            loggedIn: !!user
        });
    } else {
        res.redirect(user ? './' : './login?failed');
    }
});

router.all('/logout', (req, res) => {
    delete req.session.userId;

    res.redirect('./login');
});