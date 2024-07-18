// src/index.ts
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { MikroORM } from '@mikro-orm/core';
import dotenv from 'dotenv';
import { transactionRoutes } from './routes/transactionRoutes';
import axios from 'axios';
import https from 'https';
import config from '../mikro-orm.config';

dotenv.config();

const app = express();
const port: number | undefined = process.env.PORT ? parseInt(process.env.PORT) : undefined;

let orm: MikroORM;
let CONV_RATES: any;

app.use(bodyParser.json());
app.use(cors());


app.get('/rates', async (req, res) => {
    res.send(JSON.stringify(CONV_RATES));
});

app.listen(port, async () => {
    orm = await MikroORM.init(config);
    const response = await axios.get(`https://v6.exchangerate-api.com/v6/${process.env.API_KEY}/latest/INR`, {
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    });
    CONV_RATES = response.data.conversion_rates;
    app.use(transactionRoutes(orm, CONV_RATES));

    console.log(`Server is running on port ${port}`);
});
