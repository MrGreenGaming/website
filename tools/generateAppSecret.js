const bcryptjs = require('bcryptjs');
const saltWorkFactor = 10;

const getRandomString = (charCount) => {
    if (typeof(charCount) !== 'number')
        charCount = 5;

    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < charCount; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
};

const writeData = (data) => {
    const path = require('path');
    const fileName = path.parse(__filename).name + '.txt';

    const fs = require('fs');
    fs.writeFile(fileName, data, (err) => {
        if (err)
            throw err;

        console.log('Data saved to ' + fileName);
    });
};

const pass = (typeof(process.argv[2]) === 'string' ? process.argv[2] : getRandomString(30));

bcryptjs.genSalt(saltWorkFactor, (error, salt) => {
    if (error) {
        console.error(error);
        return;
    }

    bcryptjs.hash(pass, salt, (error, hash) => {
        if (error) {
            console.error(error);
            return;
        }

        console.log('Hash:', hash);

        bcryptjs.compare(pass, hash, (error, isMatch) => {
            if (error) {
                console.error(error);
                return;
            }

            console.log('Do they match?', isMatch);

            if (isMatch)
                writeData('Pass: ' + pass + '\nSalt: ' + salt + '\nHash: ' + hash);
        });
    });
});
