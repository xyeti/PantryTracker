const lambdaLocal = require('lambda-local');
 
var jsonPayload = require('./input.json');


lambdaLocal.execute({
    event: jsonPayload,
    lambdaPath: './index.js',
    timeoutMs: 3000,
    callback: function(err, data) {
        if (err) {
            console.log(err);
        } else {
            console.log(data);
        }
    }
});
