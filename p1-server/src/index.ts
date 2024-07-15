import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { MikroORM } from '@mikro-orm/core';
import config from '../mikro-orm.config';
import { transactions } from './entities/transaction';
import axios from 'axios';
import multer from 'multer';
import csv from 'csv-parser';
import { Readable } from 'stream';
import https from 'https'
import { v4 as uuid } from 'uuid'
import dotenv from 'dotenv'

dotenv.config();


const app = express();
const port: number | undefined =
    (process.env.PORT != null) ?
        parseInt(process.env.PORT)
        :
        undefined;

const clients: any[] = [];


let orm: MikroORM;
const upload = multer({ storage: multer.memoryStorage() });
let CONV_RATES: any;

app.use(bodyParser.json());
app.use(cors());

const formatNumber = (num: number): number => {
    if (Number.isInteger(num)) {
        return num;
    } else {
        return parseFloat(num.toFixed(3));
    }
};

function convertDateFormat(dateString: string): string {
    const [day, month, year] = dateString.split('-');
    return `${year}-${month}-${day}`;
}


app.post("/transaction", async (req, res) => {
    const em = orm.em.fork();
    const t1 = new transactions(req.body.id, new Date(req.body.date), req.body.original_amount_currency, req.body.original_amount_qty, req.body.converted_amount_qty, req.body.description);
    await em.persistAndFlush(t1);
    console.log("transaction inserted: ", t1);
    res.sendStatus(200);
});

app.post("/transactions", async (req, res) => {
    const page = req.body.page;
    const em = orm.em.fork();
    const [result, total] = await em.findAndCount(transactions, {}, {
        limit: 10,
        offset: (page - 1) * 10
    });
    const data = result.map(e => { return new transactions(e.id, e.date, e.original_amount_currency, e.original_amount_qty, e.converted_amount_qty, e.description); });
    res.send(JSON.stringify(data));
});

app.post("/delete", async (req: Request, res: Response) => {
    const em = orm.em.fork();
    const tns = req.body as Array<transactions>;
    const ts = tns.map((e) => {
        return new transactions(e.id, new Date(e.date), e.original_amount_currency, e.original_amount_qty, e.converted_amount_qty, e.description);
    })
    await em.remove(ts).flush();
    res.sendStatus(200);
});

app.get("/rates", async (req, res) => {
    console.log("rated\n");

    res.send(JSON.stringify(CONV_RATES));
});

// File upload endpoint
app.post("/file", upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded');
    }

    const results: Array<transactions> = [];
    const stream = Readable.from(req.file.buffer.toString());

    const em = orm.em.fork();

    let lineNumber: number = 0;

    stream.pipe(csv())
        .on('data', async (data) => {
            const newArray = (Object.keys(data).map((e) => data[e]))
            if (isNaN(new Date(newArray[0]).getTime()))
                newArray[0] = convertDateFormat(newArray[0]);

            const ts = new transactions(
                uuid(), new Date(newArray[0]), newArray[3], parseFloat(newArray[2]), formatNumber(parseFloat(newArray[2]) / CONV_RATES[newArray[3]]), newArray[1]
            )
            lineNumber++;
            await em.persistAndFlush(ts);
            // console.log("done\n");
            clients.forEach(client => client.write(`data: ${lineNumber}\n\n`))
        })
        .on('end', () => {
            console.log("full done\n");
            res.status(200).json({ message: 'File processed successfully', data: results });
            clients.forEach(client => client.write(`data: complete\n\n`));
            clients.forEach(client => client.end());
        })
        .on('error', (error) => {
            console.error(error);
            res.status(500).send('Error processing file');
        });
});

// SSE endpoint
app.get('/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    clients.push(res);

    req.on('close', () => {
        clients.splice(clients.indexOf(res), 1);
        res.end();
    });
});

app.listen(port, async () => {
    orm = await MikroORM.init(config);
    const response = await axios.get(`https://v6.exchangerate-api.com/v6/${process.env.API_KEY}/latest/INR`, {
        httpsAgent: new https.Agent({
            rejectUnauthorized: false
        }),
    });
    CONV_RATES = response.data.conversion_rates;
    console.log(`Server is running on port ${port}`);
});
