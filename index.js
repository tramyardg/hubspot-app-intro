const express = require("express")
const axios = require("axios")
const bodyParser = require("body-parser")

require('dotenv').config()

const app = express()

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

app.listen(3000, () => console.log(`Listening on http://localhost:3000`))