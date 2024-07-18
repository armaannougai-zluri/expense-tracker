// src/controllers/transactionController.ts
import { Request, Response } from 'express';
import { TransactionService } from '../services/transactionService';
import { MikroORM } from '@mikro-orm/core';
import { Transactions } from '../entities/transaction';
import { Readable } from 'stream';
import csv from 'csv-parser';
import { currencyOptions, CurrencyOption } from '../currencyOptions';

const formatNumber = (num: number): number => {
    return Number.isInteger(num) ? num : parseFloat(num.toFixed(3));
};

const convertDateFormat = (dateString: string): string => {
    const [day, month, year] = dateString.split('-');
    return `${year}-${month}-${day}`;
};

export class TransactionController {

    private orm: MikroORM;
    private CONV_RATES: any;
    private transactionService: TransactionService;

    constructor(orm: MikroORM , CONV_RATES: any) {
        this.orm = orm;
        this.CONV_RATES = CONV_RATES;
        this.transactionService = new TransactionService(orm);
    }

    createTransaction = async (req: Request, res: Response): Promise<void> => {
        const em = this.orm.em.fork();
        if (!req.body.id) {
            const transaction = new Transactions(new Date(req.body.date), req.body.original_amount_currency, req.body.original_amount_qty, req.body.converted_amount_qty, req.body.description);
            const isValid = await this.transactionService.validate(transaction);
            if (isValid) {
                await this.transactionService.save(transaction);
                res.sendStatus(200);
            } else {
                res.sendStatus(500);
            }
        } else {
            const transaction = await em.findOne(Transactions, { id: req.body.id });
            if (transaction) {
                transaction.date = new Date(req.body.date);
                transaction.original_amount_currency = req.body.original_amount_currency;
                transaction.original_amount_qty = req.body.original_amount_qty;
                transaction.converted_amount_qty = req.body.converted_amount_qty;
                transaction.description = req.body.description;
                const isValid = await this.transactionService.validate(transaction);
                if (isValid) {
                    await this.transactionService.save(transaction);
                    res.sendStatus(200);
                } else {
                    res.sendStatus(500);
                }
            } else {
                res.sendStatus(500);
            }
        }
    };

    getTransactions = async (req: Request, res: Response): Promise<void> => {
        const page = req.body.page;
        const [result, total] = await this.transactionService.findAndCountTransactions(page);
        res.send(JSON.stringify(result));
    };

    deleteTransactions = async (req: Request, res: Response): Promise<void> => {
        const transactionIds = req.body.map((t: { id: number }) => t.id);
        const count = await this.transactionService.deleteTransactions(transactionIds);
        res.send(JSON.stringify({ status: 200, count })).status(200);
    };

    handleFileUpload = async (req: Request, res: Response): Promise<void> => {
        if (!req.file) {
            res.status(400).send('No file uploaded');
            return;
        }

        const results: Transactions[] = [];
        const stream = Readable.from(req.file.buffer.toString());
        const em = this.orm.em.fork();
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
                    const transaction = new Transactions(
                        new Date(newArray[0]),
                        newArray[3],
                        parseFloat(newArray[2]),
                        formatNumber(parseFloat(newArray[2]) / this.CONV_RATES[newArray[3]]),
                        newArray[1]
                    );
                    results.push(transaction);
                } catch (err) {
                    hasErrorOccurred = true;
                    res.status(500).send(JSON.stringify({ message: "File processing failed\n" }));
                }
            })
            .on('end', async () => {
                if (hasErrorOccurred) return;
                try {
                    await em.transactional(async (em) => {
                        for (const transaction of results) {
                            const isValid = await this.transactionService.validate(transaction);
                            lineNumber++;
                            if (!isValid) {
                                res.status(500).send(JSON.stringify({ message: `Validation failed at line: ${lineNumber}` }));
                                throw new Error();
                            }
                            em.persist(transaction);
                        }
                    });
                    res.status(200).send(JSON.stringify({ message: `Transaction inserted ${lineNumber} entries` }));
                } catch (err) {
                    // handle error
                }
            })
            .on('error', (error) => {
                if (!hasErrorOccurred) {
                    hasErrorOccurred = true;
                    res.status(500).send(JSON.stringify({ message: "File processing failed\n" }));
                }
            });
    };
}
