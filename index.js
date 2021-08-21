const express = require("express")
const axios = require("axios")
const bodyParser = require("body-parser")
const session = require("express-session")
const querystring = require("querystring");
const NodeCache = require('node-cache');

require('dotenv').config()

const app = express();

const accessTokenCache = new NodeCache();

app.set('view engine', 'pug')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))

const API_KEY_TEST_PORTAL = process.env.API_KEY_TEST_PORTAL;

app.get('/contact', async (req, res) => {
    const contacts = `https://api.hubapi.com/contacts/v1/lists/all/contacts/recent?hapikey=${API_KEY_TEST_PORTAL}`
    try {
        const resp = await axios.get(contacts);
        const data = resp.data;
        res.json(data)
    } catch (error) {
        console.error(error)
    }
})

app.get("/update", async (req, res) => {
    //http://localhost:3000/update?email=test@email.com
    const email = req.query.email;
    const contacts = `https://api.hubapi.com/contacts/v1/contact/email/${email}/profile?hapikey=${API_KEY_TEST_PORTAL}`
    try {
        const resp = await axios.get(contacts);
        const data = resp.data;
        res.render('update', { userEmail: email, favoriteBook: data.properties.favorite_book.value })
    } catch (error) {
        console.error(error)
    }
})

app.post("/update", async (req, res) => {
    const propUpdate = {
        properties: [{ property: "favorite_book", value: req.body.newVal }],
    };
    const email = req.query.email;
    const contacts = `https://api.hubapi.com/contacts/v1/contact/createOrUpdate/email/${email}/?hapikey=${API_KEY_TEST_PORTAL}`
    try {
        await axios.post(contacts, propUpdate)
        res.redirect('back')
    } catch (error) {
        console.error(error)
    }
});


// OAuth start
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = `http://localhost:3000/oauth-callback`;

const authUrl = `https://app.hubspot.com/oauth/authorize?client_id=86f91697-1ff1-495c-831b-ce5d00a658e2&redirect_uri=http://localhost:3000/oauth-callback&scope=contacts`;

const refreshTokenStore = {};

app.use(session({
    secret: Math.random().toString(36).substring(2),
    resave: false,
    saveUninitialized: true,
}));

const isAuthorized = (userId) => refreshTokenStore[userId] ? true : false;

app.get("/", async (req, res) => {
    if (isAuthorized(req.sessionID)) {
        const accessToken = await getToken(req.sessionID);
        const headers = {
            Authorization: `Bearer ${accessToken}`,
            'Content-type': 'application/json',
        };
        const contacts = `https://api.hubapi.com/contacts/v1/lists/all/contacts/recent`;
        try {
            const resp = await axios.get(contacts, { headers });
            const data = resp.data;
            res.render("home", {
                token: accessToken,
                contacts: data.contacts,
            })
        } catch (error) {
            console.error(error);
        }
    } else {
        res.render("home", {authUrl});
    }
});

const getToken = async (userId) => {
    if(accessTokenCache.get(userId)) {
        console.log(accessTokenCache.get(userId));
        return accessTokenCache.get(userId);
    } else {
        try {
            const refreshTokenProof = {
                grant_type: "refresh_token",
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                redirect_uri: REDIRECT_URI,
                refresh_token: refreshTokenStore[userId],
            };
            const responseBody = await axios.post('https://api.hubapi.com/oauth/v1/token', querystring.stringify(refreshTokenProof));
            refreshTokenStore[userId] = responseBody.data.refresh_token;
            accessTokenCache.set(userId, responseBody.data.access_token, 5);
            console.log("getting refresh token");
            return responseBody.data.access_token;
        } catch (error) {
            
        }
    }
}


app.get('/oauth-callback', async (req, res) => {
    const authCodeProof = {
        grant_type: "authorization_code",
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        code: req.query.code
    };
    try {
        const responseBody = await axios.post('https://api.hubapi.com/oauth/v1/token', querystring.stringify(authCodeProof));
        refreshTokenStore[req.sessionID] = responseBody.data.access_token;
        accessTokenCache.set(req.sessionID, responseBody.data.access_token, 5);
        res.redirect('/')
    } catch (e) {
        console.error(e);
    }
});

// 1. send user to authorization page. this kicks off initial request to oauth server
// 2. get temp authorization code from Oauth server
// 3. complete temp auth code with app credentials and send back to oauth server
// 4. get access and refresh tokens

// OAuth end

app.listen(3000, () => console.log(`Listening on http://localhost:3000`))