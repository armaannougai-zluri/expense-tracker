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
    if (req.body.id == undefined) {
        const t1 = new transactions(new Date(req.body.date), req.body.original_amount_currency, req.body.original_amount_qty, req.body.converted_amount_qty, req.body.description);
        await em.persistAndFlush(t1);
        res.sendStatus(200);
    } else {
        const t1 = await em.findOne(transactions, { id: req.body.id });
        if (t1){
            t1.date = req.body.date;
            t1.original_amount_currency = req.body.original_amount_currency;
            t1.original_amount_qty = req.body.original_amount_qty;
            t1.converted_amount_qty = req.body.converted_amount_qty;
            t1.description = req.body.description;
            await em.persistAndFlush(t1);
        }
        res.sendStatus(200);
    }
});

app.post("/transactions", async (req, res) => {
    const page = req.body.page;
    const em = orm.em.fork();
    const [result, total] = await em.findAndCount(transactions, {}, {
        limit: 15,
        offset: (page - 1) * 15,
        orderBy: [{ id: -1 }]
    });
    res.send(JSON.stringify(result));
});

app.post("/delete", async (req: Request, res: Response) => {
    const em = orm.em.fork();
    const tns = req.body as Array<transactions>;
    let cnt = 0;
    await em.transactional(async (em) => {
        for (const e of tns) {
            const ts = await em.findOne(transactions, { id: e.id });
            if (ts) {
                cnt++;
                em.remove(ts);
            }
        }
    }).then(() => {
        em.flush();
        if (cnt)
            res.send(JSON.stringify({ status: 200, count: tns.length }));
        else
            res.send(JSON.stringify({ status: 500 }));

    }).catch(() => {
        res.send(JSON.stringify({ status: 500 }));
    });
});

app.get("/rates", async (req, res) => {
    console.log("giving back rates\n");
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
                new Date(newArray[0]), newArray[3], parseFloat(newArray[2]), formatNumber(parseFloat(newArray[2]) / CONV_RATES[newArray[3]]), newArray[1]
            )
            lineNumber++;
            await em.persistAndFlush(ts);
            clients.forEach(client => client.write(`data: ${lineNumber}\n\n`))
        })
        .on('end', () => {
            res.status(200).json({ message: 'File processed successfully', data: results });
            clients.forEach(client => client.write(`data: ${lineNumber}\n\n`));
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
