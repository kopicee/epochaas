const common = require('./common.js');


class EpochApp {
    constructor(db) {
        this.db = db;
        
        this.counter = 0;
        this.syncCounterFromDb();
    }

    syncCounterFromDb() {
        let query = 'SELECT max(key) FROM epoch;';
        let maxKey = this.db.get(query, (err, row) => {
            if (err) {
                return common.error(err.message);
            }
            this.counter = row && row.key || 0;
        });
    }

    writeDb(key, epoch, callback) {
        let query = 'INSERT INTO epoch (key, timestamp) VALUES (?, ?)';
        let params = [key, epoch];
        this.db.run(query, params, callback);
    }

    makeKey() {
        return ++this.counter;
    }


    makeEpoch() {
        return Date.now();
    }

    parseKey(queryKey) {
        return parseInt(queryKey);
    }

    getEpoch(key, callback) {
        let query = `SELECT timestamp FROM epoch WHERE key=?`;
        this.db.get(query, [key], (err, res) => {
            res = res || {};
            callback(err, res.timestamp);
        });
    }

    newEpoch(callback) {
        let key = this.makeKey();
        let epoch = this.makeEpoch();
        let err = this.writeDb(key, epoch, (err, res) => {
            if (err) {
                common.error(err.message);
                return callback(err, undefined);
            }
        });
        
        return callback(undefined, [key, epoch]);
    }
    
    bindRoutes(exp) {
        let that = this;
        
        exp.get('/', (request, response) => {
            try {
                const key = that.parseKey(request.query.key);
                if (!key)
                    return response.redirect('/new');
                
                that.getEpoch(key, (err, epoch) => {
                    if (!epoch) {
                        response.status(404);
                        response.send(`No such key: ${key}`);
                    } else {
                        response.json({key: key, epoch: epoch});
                    }
                });
            
            } catch (error) {
                common.error(error);
            }
        });

        exp.get('/new', (request, response) => {
            that.newEpoch((err, res) => {
                if (err) {
                    response.status(502);
                    response.send('Internal server error');
                    return;
                }
                let [key, epoch] = res;
                return response.json({key: key, epoch: epoch});
            });
        });
    }
}


module.exports = {
    EpochApp: EpochApp
}
