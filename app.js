/* Immuto Web App Template | (c) Immuto, Inc. and other contributors */
var express = require('express');
var path = require('path')
var bodyParser = require('body-parser')
var immuto = require('immuto-sdk')
var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest
var schedule = require('node-schedule');

/* Project Modules */
var auth = require(path.join(__dirname, 'modules', 'authentication.js'))
var DB = require(path.join(__dirname, 'modules', 'database.js'))

const DEFAULT_PORT = 8001
const IMMUTO_HOST = "https://dev.immuto.io" // dev env default 

var app = express();
var im = immuto.init(true, IMMUTO_HOST) // no params to set production use


app.use(express.static(path.join(__dirname, 'static')));
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json()) 


/******************************* Website Pages ********************************/
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'static', "html", 'index.html'));
})

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'static', "html", 'register.html'));
})

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'static', "html", 'login.html'));
})

app.get('/logout', (req, res) => {
    auth.end_user_session(req).then(() => {
        res.redirect('/login')
    }).catch((err) => {
        console.error(err)
        res.status(500).end()
    })
})

app.get('/dashboard', (req, res) => {
    auth.user_logged_in(req).then((userInfo) => {
        if (userInfo) {
            res.sendFile(path.join(__dirname, 'static', "html", 'dashboard.html'));
        } else {
            res.redirect('/login')
        }
    }).catch((err) => {
        console.error(err)
        res.status(500).end()
    })
})

app.get('/tables', (req, res) => {
    auth.user_logged_in(req).then((userInfo) => {
        if (userInfo) {
            res.sendFile(path.join(__dirname, 'static', "html", 'tables.html'));
        } else {
            res.redirect('/login')
        }    
    }).catch((err) => {
        console.error(err)
        res.status(500).end()
    })
})

app.get('/file-upload', (req, res) => {
    auth.user_logged_in(req).then((userInfo) => {
        if (userInfo) {
            res.sendFile(path.join(__dirname, 'static', "html", 'file_upload.html'));
        } else {
            res.redirect('/login')
        }    
    }).catch((err) => {
        console.error(err)
        res.status(500).end()
    })
})

/************************************ API *************************************/
app.post("/register-org-user", (req, res) => {
    // validate appropriately before use
    // restrict registration as needed 
    let email = req.body.email 

    im.permission_new_user(email)
    .then(regToken => res.status(200).end(regToken))
    .catch(err => {
        console.error(err)
        res.status(500).end()
    })
})

app.post("/login-user", (req, res) => {
    user_logged_in_immuto(req.body.authToken).then((userInfo) => { // verify against Immuto API
        auth.create_user_session(req.body.authToken, userInfo, res).then(() => { // store for local use
            res.status(204).end()
        }).catch((err) => {
            console.error(err)
            res.status(500).end("Internal error.") 
        })
    }).catch((err) => {
        if (err.code && err.code == 401) {
            res.status(401).end("Unauthorized.")
        } else {
            console.error(err)
            res.status(500).end("Internal error.") 
        }
    })
})


/***************************** Utility Functions ******************************/
function user_logged_in_immuto(authToken) {
    return new Promise((resolve, reject) => {
        var http = new XMLHttpRequest()

        let sendstring = "authToken=" + authToken
        http.open("POST", IMMUTO_HOST + "/verify-user-authentication", true)
        http.setRequestHeader("Content-Type", "application/x-www-form-urlencoded")
        http.onreadystatechange = () => {
            if (http.readyState == 4 && http.status == 200) {
                try {
                    let userInfo = JSON.parse(http.responseText)
                    resolve(userInfo)
                } catch(err) {
                    reject(err)
                }
            } else if (http.readyState == 4) {
                let response = {
                    responseText: http.responseText,
                    code: http.status
                }
                reject(response)
            }
        }
        http.send(sendstring)
    })
}

function get_credentials() {
    credentials = {}
    if (process.env.EMAIL && process.env.PASSWORD) {
        credentials.email = process.env.EMAIL
        credentials.password = process.env.PASSWORD
        return credentials
    } else {
        console.error("You must set EMAIL and PASSWORD env variables.")
        process.exit()
    }
}


/* APP START */
let cred = get_credentials()
console.log("Authenticating admin Immuto account.")
im.authenticate(cred.email, cred.password).then(() => { // authentication lasts 24 hours
    console.log("Authentication successful. Starting web server.")
    app.listen((process.env.PORT || DEFAULT_PORT), function() {
        console.log('Node app is running on port: ' + (process.env.PORT || DEFAULT_PORT));
    });
}).catch((err) => {
    console.error("Error authenticating admin Immuto account:")
    console.error(err)
})


// Reauthenticate periodicatlly, credential expires after 24h
// runs ``At minute 0 past every 6th hour''
schedule.scheduleJob('0 */6 * * *', function() { 
    im.deauthenticate()
    .then(() => {
      im.authenticate(cred.email, cred.password)
      .then(() => {
        console.log("Re-Authentication to Immuto successful.");
      })
      .catch(err => {
        console.error("Error authenticating admin Immuto account:");
        console.error(err);
      });
    })
    .catch(err => {
      console.error(err);
      process.exit();
    });
});
