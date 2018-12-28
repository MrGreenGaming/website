const Express = require('express');
const router = module.exports = Express.Router({
    strict: App.express.get('strict routing'),
    caseSensitive: App.express.get('case sensitive routing')
});

/*router.get('/', (req, res) => {
    if (!req.user) {
        res.redirect(401, './login');
        return;
    }

    const template = require('../views/account/index.marko');
    res.marko(template, {
        page: {
            title: 'Account',
            description: 'Manage your Mr. Green Gaming community account.',
            path: App.getExpressPath(req.baseUrl, req.path)
        },
        user: req.user
    });
});

router.get('/login', (req, res) => {
    if (req.user) {
        res.redirect(403, './');
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

    if (/application\/json;/.test(req.get('accept'))) {
        res.json({
            loggedIn: !!user
        });
    } else {
        res.redirect(user ? './' : './login?failed');
    }
});

router.all('/logout', (req, res) => {
    delete req.session.userId;

    res.redirect(200, './login');
});*/