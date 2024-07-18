// src/routes/transactionRoutes.ts
import express from 'express';
import { TransactionController } from '../controllers/transactionController';
import multer from 'multer';
import { MikroORM } from '@mikro-orm/core';

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

export const transactionRoutes = (orm: MikroORM , CONV_RATES: any) => {
  const controller = new TransactionController(orm , CONV_RATES);

  router.post('/transaction', controller.createTransaction);
  router.post('/transactions', controller.getTransactions);
  router.post('/delete', controller.deleteTransactions);
  router.post('/file', upload.single('file'), controller.handleFileUpload);

  return router;
};
