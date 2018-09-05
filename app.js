#!/usr/bin/env node

console.log('#############################');
console.log('Mr. Green Gaming website');
console.log('#############################');

class App {
    static initLog() {
        const bunyan = require('bunyan');
        global.log = bunyan.createLogger({
            name: 'mrgreen-website',
            streams: [
                {
                    level: this.isDevelopment ? 'trace' : 'info',
                    stream: process.stdout
                },
                /*{
                    type: 'rotating-file',
                    path: 'logs/trace.log',
                    level: 'trace',
                    period: '1d',
                    count: 5
                },*/
                {
                    type: 'rotating-file',
                    path: 'logs/info.log',
                    level: 'info',
                    period: '1d',
                    count: 5
                },
                {
                    type: 'rotating-file',
                    path: 'logs/error.log',
                    level: 'warn',
                    period: '1d',
                    count: 5
                },
                {
                    type: 'rotating-file',
                    path: 'logs/fatal.log',
                    level: 'fatal',
                    period: '1d',
                    count: 5
                }
            ],
            src: false
            //src: this.isDevelopment
        });
    }

    static initConfig() {
        const _ = require('lodash');
        const module = './config/env.json';
        delete require.cache[require.resolve(module)];
        const env = require(module);

        if (typeof(env[this.env]) !== 'object') {
            log.warn('No custom environment config set!');
            global.Config = env['base'];
        } else
            global.Config = _.defaultsDeep(_.clone(env[this.env]), env['base']);

        if (!Config.configReloadTimeSeconds) {
            log.warn('No config reload time set. Reloading is disabled.');
            return;
        }

        setTimeout(() => {
            log.debug('Reloading server configuration');
            this.initConfig();
        }, Config.configReloadTimeSeconds * 1000);
    }

    static initDatabases() {
        return new Promise(async (resolve, reject) => {
            const Database = require('./base/database');

            let dbConfig = Config.databases.base;
            global.db = new Database(dbConfig.socket, dbConfig.host, dbConfig.port, dbConfig.user, dbConfig.password, dbConfig.databaseName, dbConfig.connectionLimit);


            dbConfig = Config.databases.forums;
            global.forumsDb = new Database(dbConfig.socket, dbConfig.host, dbConfig.port, dbConfig.user, dbConfig.password, dbConfig.databaseName, dbConfig.connectionLimit);

            try {
                await db.connect();
                await forumsDb.connect();
            } catch (error) {
                reject(error);
                return;
            }

            resolve();
        });
    }

    static initExpress() {
        const Express = require('express');
        const express = this.express = Express();
        express.set('x-powered-by', false);
        express.set('trust proxy', Config.http.trustProxy ? 1 : 0);

        this.server = require('http').createServer(express);

        //Body Parser
        const bodyParser = require('body-parser');
        express.use(bodyParser.json());
        express.use(bodyParser.urlencoded({
            extended: false
        }));
        //Fixes body being an array when coming from MTASA. Needs further investigation.
        express.use('/', (req, res, next) => {
            if (req.body instanceof Array && req.body.length === 1)
                req.body = req.body[0];

            next();
        });

        //Sessions
        const session = require('express-session');
        const mySqlStore = require('express-mysql-session')(session);
        const sessionStore = new mySqlStore({
            createDatabaseTable: true,
            charset: 'utf8mb4_general_ci',
            schema: {
                tableName: 'sessions',
                columnNames: {
                    session_id: 'sessionId',
                    expires: 'expires',
                    data: 'data'
                }
            }
        }, db.getPool());
        express.use(session({
            secret: Config.http.cookieSecret,
            secure: Config.http.cookieSecure,
            resave: false,
            store: sessionStore,
            saveUninitialized: false,
            name: 'mrgreen'
        }));

        //Marko render engine
        require('marko/node-require').install();
        const markoExpress = require('marko/express'); //enable res.marko
        express.use(markoExpress());
        express.locals.layout = '/views/layouts/defaultLayout.marko';

        //Set Marko globals
        express.locals.site = {
            title: Config.site.title,
            googleAnalyticsTrackingId: Config.site.googleAnalyticsTrackingId,
            //description: '',
            publicUrl: Config.site.publicUrl
        };
        express.locals.author = {
            name: Config.site.author.name,
            emailAddress: Config.site.author.emailAddress
        };
    }

    static listenExpress() {
        return new Promise((resolve, reject) => {
            this.server.listen(Config.host.port, Config.host.address);
            this.server.on('error', (error) => {
                if (error.syscall !== 'listen')
                    throw error;

                switch (error.code) {
                    case 'EACCES':
                        reject(new Error(`Host requires elevated privileges`));
                        break;
                    case 'EADDRINUSE':
                        reject(new Error(`Host is already in use`));
                        break;
                    default:
                        throw error;
                }
            });
            this.server.on('listening', () => {
                const addr = this.server.address();
                const bind = typeof(addr.port) === 'string' ? `pipe ${addr.port}` : `port ${addr.port}`;
                log.info(`Listening on ${addr.address} ${bind} (${addr.family})`);
                resolve();
            });
        });
    }

    static initRoutes() {
        const express = require('express');
        const path = require('path');
        this.express.use('/', express.static(path.join(__dirname, 'public'), {
            etag: !App.isDevelopment
        }));

        //Redirect trailing slash requests
        this.express.use((req, res, next) => {
            if (req.path.substr(-1) === '/' && req.path.length > 1) {
                const query = req.url.slice(req.path.length);
                res.redirect(301, req.path.slice(0, -1) + query);
            } else
                next();
        });

        //Get user when logged in
        this.express.use('/', async (req, res, next) => {
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

        this.express.use('/', require('./routes/static'));
        this.express.use('/account', require('./routes/account'));
        this.express.use('/games', require('./routes/games'));
        this.express.use('/api', require('./routes/api'));

        //Error Handler is our last stop
        this.express.use((req, res, next) => {
            const error = new Error('Not Found');
            error.originalUrl = req.originalUrl;
            error.path = req.path;
            error.status = 404;
            next(error);
        });

        //Deal with errors
        this.express.use((error, req, res, next) => {
            log.warn(`Express: ${JSON.stringify(error)}`);

            if (!error.status)
                error.status = 500;

            switch (error.status) {
                case 403:
                    error.statusMessage = 'No permission';
                    break;
                case 404:
                    error.statusMessage = 'Not found';
                    break;
                case 500:
                    error.statusMessage = 'An internal server error occurred';
                    break;
                default:
                    error.statusMessage = 'A server error occurred';
                    break;
            }

            if (!error.message)
                error.message = 'An unknown problem occurred. Please try again later.';

            res.status(error.status);
            const layout = require('./views/error.marko');
            res.marko(layout, {
                error,
                isDevelopment: this.isDevelopment,
                page: {
                    title: error.message,
                    description: error.statusMessage,
                    path: this.getExpressPath(req.baseUrl, req.path)
                }
            });
        });
    }

    /**
     * Helper function
     * ToDo: Move to utility class
     * @param {string} baseUrl
     * @param {string} path
     * @returns {string}
     */
    static getExpressPath(baseUrl, path) {
        return baseUrl.replace(/\/$/, '') + path.replace(/\/$/, '');
    }

    /**
     * Initialize modules
     * @return {Promise<void>}
     */
    static initModules() {
        return new Promise(async (resolve, reject) => {
            this.modules = {};

            const ApiApps = global.ApiApps = require('./base/apiApps');
            const Games = global.Games = require('./base/games');
            try {
                await ApiApps.load();
                await Games.load();
            } catch (error) {
                reject(error);
                return;
            }

            global.Users = require('./base/users');
            global.Utils = require('./utils/utils');
            global.CommunityNews = require('./base/communityNews');

            resolve();
        });
    }

    static initPaths() {
        const path = require('path');

        this.paths = {
            data: path.join(__dirname, 'data')
        };
    }

    /**
     * Init application
     * @async
     * @return {void}
     */
    static async init() {
        this.env = process.env.NODE_ENV;
        this.isDevelopment = process.env.NODE_ENV === 'development';


        this.initLog();
        this.initConfig();
        log.info(`Current environment: ${this.env} (debug: %s}`, this.isDevelopment);

        this.initPaths();

        //Display detailed info about Unhandled Promise rejections and Uncaught Exceptions
        process.on('unhandledRejection', (reason, p) => log.fatal('Unhandled Rejection at:', p, 'reason:', reason));
        process.on('uncaughtException', error => log.fatal('Uncaught Exception:', error));

        try {
            await this.initDatabases();
            this.initExpress();
            this.initRoutes();
            await this.initModules();
            await this.listenExpress();
        } catch (error) {
            log.error(error);
            process.exit(1);
            return;
        }

        log.info('Application is initialized and ready for use');
    }
}

global.App = App;

App.init();