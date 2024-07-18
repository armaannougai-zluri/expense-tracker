// src/services/transactionService.ts
import { Transactions } from '../entities/transaction';
import { MikroORM } from '@mikro-orm/core';
import { CurrencyOption , currencyOptions } from '../currencyOptions';

export class TransactionService {
  private orm: MikroORM;

  constructor(orm: MikroORM) {
    this.orm = orm;
  }

  async validate(transaction: Transactions): Promise<boolean> {
    const date = transaction.date;
    if (date > new Date()) return false;

    const amount = transaction.original_amount_qty;
    if (amount <= 0) return false;

    const description = transaction.description;
    if (!description) return false;

    const currency = transaction.original_amount_currency;
    const currencyList = currencyOptions.map((e: CurrencyOption) => e.value);
    if (!currencyList.includes(currency)) return false;

    return true;
  }

  async save(transaction: Transactions): Promise<void> {
    const em = this.orm.em.fork();
    await em.persistAndFlush(transaction);
  }

  async findAndCountTransactions(page: number): Promise<[Transactions[], number]> {
    const em = this.orm.em.fork();
    return await em.findAndCount(Transactions, {}, {
      limit: 15,
      offset: (page - 1) * 15,
      orderBy: [{ id: -1 }]
    });
  }

  async deleteTransactions(transactionIds: number[]): Promise<number> {
    const em = this.orm.em.fork();
    let cnt = 0;
    await em.transactional(async (em) => {
      for (const id of transactionIds) {
        const transaction = await em.findOne(Transactions, { id });
        if (transaction) {
          cnt++;
          em.remove(transaction);
        }
      }
    });
    await em.flush();
    return cnt;
  }
}
