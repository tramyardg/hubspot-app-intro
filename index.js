const express = require("express")
const axios = require("axios")

require('dotenv').config()

const app = express()

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

app.listen(3000, () => console.log(`Listening on http://localhost:3000`))