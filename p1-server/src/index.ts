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
import { CurrencyOption, currencyOptions } from './currencyOptions';

dotenv.config();


const app = express();
const port: number | undefined =
    (process.env.PORT != null) ?
        parseInt(process.env.PORT)
        :
        undefined;



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
function validate(t: transactions): boolean {
    const date = t.date;
    if (date > new Date())
        return false;

    const amount = t.original_amount_qty;
    if (amount <= 0)
        return false;


    // Check if description is not empty
    const description = t.description;
    if (!description)
        return false;

    const currency = t.original_amount_currency;
    const currencyList = currencyOptions.map((e: CurrencyOption) => e.value);
    // Trim the currency code and check if it is in the currency list
    if (!currencyList.includes(currency))
        return false;
    return true;
}

function convertDateFormat(dateString: string): string {
    const [day, month, year] = dateString.split('-');
    return `${year}-${month}-${day}`;
}


app.post("/transaction", async (req, res) => {
    const em = orm.em.fork();
    if (req.body.id == undefined) {
        const t1 = new transactions(new Date(req.body.date), req.body.original_amount_currency, req.body.original_amount_qty, req.body.converted_amount_qty, req.body.description);
        const result = await validate(t1);
        if (result) {
            await em.persistAndFlush(t1);
            res.sendStatus(200);
        } else {
            res.sendStatus(500);
        }
    } else {
        const t1 = await em.findOne(transactions, { id: req.body.id });
        if (t1) {
            const result = await validate(t1);
            if (result) {
                t1.date = req.body.date;
                t1.original_amount_currency = req.body.original_amount_currency;
                t1.original_amount_qty = req.body.original_amount_qty;
                t1.converted_amount_qty = req.body.converted_amount_qty;
                t1.description = req.body.description;
                await em.persistAndFlush(t1);
                res.sendStatus(200);
            } else {
                res.sendStatus(500);
            }
        } else
            res.sendStatus(500);
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

    }).catch((err) => {
        res.send(JSON.stringify({ status: 500 }));
    });
});

app.get("/rates", async (req, res) => {
    console.log("giving back rates\n");
    res.send(JSON.stringify(CONV_RATES));
});

app.post("/file", upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded');
    }

    const results: Array<transactions> = [];
    const stream = Readable.from(req.file.buffer.toString());
    const em = orm.em.fork();
    let lineNumber = 0;
    let hasErrorOccurred = false;

    stream.pipe(csv())
        .on('data', async (data) => {
            if (hasErrorOccurred) return;

            try {
                const newArray = (Object.keys(data).map((e) => data[e]));
                if (isNaN(new Date(newArray[0]).getTime())) {
                    newArray[0] = convertDateFormat(newArray[0]);
                }

                const ts = new transactions(
                    new Date(newArray[0]),
                    newArray[3],
                    parseFloat(newArray[2]),
                    formatNumber(parseFloat(newArray[2]) / CONV_RATES[newArray[3]]),
                    newArray[1]
                );
                results.push(ts);
            } catch (err) {
                hasErrorOccurred = true;
                res.sendStatus(500).send(JSON.stringify({message:"file processing failed\n"}));
            }
        }
        )
        .on('end', async () => {
            if (hasErrorOccurred)
                return
            try {
                await em.transactional(async (em) => {
                    for (const ts of results) {
                        const isValid = validate(ts);
                        lineNumber++;
                        if (!isValid) {
                            res.status(500).send(JSON.stringify({ message: `Validation failed at line: ${lineNumber}` }));

                            throw new Error();
                        }
                        em.persist(ts);
                    }
                });

                res.status(200).send(JSON.stringify({ message: `Transaction inserted ${lineNumber} entries` }));
            } catch (err) {
            }
        })
        .on('error', (error) => {
            if (!hasErrorOccurred) {
                hasErrorOccurred = true;
                res.sendStatus(500).send(JSON.stringify({ message: "file processing failed\n" }));
            }
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
