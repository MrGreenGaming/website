const appCredentials = {
    id: 1,
    secret: ''
};

/**
 * Run test asynchronously
 * @async
 * @return {void}
 */
const run = async () => {
    const userIdentifier = typeof(process.argv[2]) === 'string' ? process.argv[2] : undefined;
    const userPassword = typeof(process.argv[3]) === 'string' ? process.argv[3] : undefined;

    if (!userIdentifier || !userPassword) {
        console.error(`User identifier and/or password inputs are not valid`);
        return;
    }

    console.log(`Attempting login as '${userIdentifier}' with password...`);

    let results;
    try {
        const rpn = require('request-promise-native');
        results = await rpn({
            uri: 'http://localhost:4000/api/account/login',
            method: 'POST',
            body: {
                appId: appCredentials.id,
                appSecret: appCredentials.secret,
                user: userIdentifier,
                password: userPassword
            },
            json: true
        });
    } catch (error) {
        console.error(`Error ${error.statusCode}: ${JSON.stringify(error.error) || error.error}`);
        return;
    }

    console.info(`Result: ${JSON.stringify(results)}`);
};
run();

