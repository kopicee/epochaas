const fs = require('fs');

const express = require('express');
const sqlite3 = require('sqlite3').verbose();

const common = require('./common.js')
const { EpochApp } = require('./epoch.js');


const DATABASE = './db/epoch.db';
const SCHEMA = './db/epoch-schema.sql';


function setup(callback) {
    let db = new sqlite3.Database(DATABASE, (err, res) => {
        if (err)
            common.error(err);
    });

    // Load schema. Schema should craete tables in an idempotent manner.
    let schema = fs.readFileSync(SCHEMA, 'utf8');
    db.run(schema, (err, res) => {
        if (err) {
            common.error(err.message);
        }
        let epochApp = new EpochApp(db);
        callback(epochApp);
    });

    
}


const PORT = 3000;



setup((epochApp) => {
    let exp = express();
    
    epochApp.bindRoutes(exp);

    exp.listen(PORT, () => {
        common.log(`Listening on port ${PORT}`);
    });
})


