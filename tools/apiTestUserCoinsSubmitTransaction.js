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
    const userId = typeof(process.argv[2]) === 'string' ? parseInt(process.argv[2], 10) : undefined;
    const amount = typeof(process.argv[3]) === 'string' ? parseInt(process.argv[3], 10) : undefined;
    if (isNaN(userId) || isNaN(amount)) {
        console.error(`User and/or amount input is not a number`);
        return;
    }

    console.log(`Submitting ${amount} GC transaction for user #${userId}...`);

    let results;
    try {
        const rpn = require('request-promise-native');
        results = await rpn({
            uri: `http://localhost:4000/api/users/${userId}/coins/submitTransaction`,
            method: 'POST',
            body: {
                appId: appCredentials.id,
                appSecret: appCredentials.secret,
                amount,
                comments: 'API test' //Optional
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

