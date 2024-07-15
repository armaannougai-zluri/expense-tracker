import { useState, useEffect } from 'react';
import * as React from 'react';

import { CssVarsProvider } from '@mui/joy/styles';
import CssBaseline from '@mui/joy/CssBaseline';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Breadcrumbs from '@mui/joy/Breadcrumbs';
import Link from '@mui/joy/Link';
import Typography from '@mui/joy/Typography';
import Input from '@mui/joy/Input';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';


import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import IconButton, { iconButtonClasses } from '@mui/joy/IconButton';

import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';

import Sidebar from './components/Sidebar';
import OrderTable from './components/OrderTable';
import Header from './components/Header';
import { Add, PlusOne, UploadFile } from '@mui/icons-material';
import { v4 as uuid } from 'uuid';

import AddTransaction from './components/AddTransaction'
import { transaction } from './entities/transaction';
import { CurrencyRates } from './entities/conversion_rates';
import EditTransaction from './components/EditTransaction';
import UploadFileDialog from './components/UploadFileDialog';
const inr: string = "INR"

export default function JoyOrderDashboardTemplate() {
  const [openAddTransaction, setOpenAddTransaction] = useState<boolean>(false);
  const [openEditTransaction, setOpenEditTransaction] = useState<boolean>(false);
  const [openUploadFile, setOpenUploadFile] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);

  const [rows, setRows] = useState<Array<transaction>>([])
  const convert_currency = inr;
  const [currency_rates, setCurrencyRates] = useState<CurrencyRates>()


  const handleChangePage = (
    event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number,
  ) => {
    setPage(newPage);
  };


  useEffect(() => {
    document.title = 'Expense Track'
    const getConversionRates = async function () {
      const data: CurrencyRates = await (await fetch("http://localhost:4000/rates")).json();
      setCurrencyRates(data);
    }


    const getTransactionList = async function () {
      const data: Array<transaction> = await (await fetch('http://localhost:4000/transactions', {
        method: 'POST', headers: {
          'Content-Type': 'application/json'
        }, body: JSON.stringify({ page: page })
      })).json();
      const newdata = data.map((e) => {
        const newTransaction = new transaction(e.id, new Date(e.date), e.original_amount_currency, e.original_amount_qty, e.converted_amount_qty, e.description);
        return newTransaction;
      })
      setRows(newdata);
    }
    getConversionRates();
    getTransactionList();

  }, [page])




  return (
    (openUploadFile == true) ?
      <UploadFileDialog open={openUploadFile} setOpen={setOpenUploadFile} /> :
      (openAddTransaction == true) ?
        <AddTransaction open={openAddTransaction} setOpen={setOpenAddTransaction} id={uuid()} rows={rows} setRows={setRows} currency_rates={currency_rates} />
        : (<CssVarsProvider disableTransitionOnChange>
          <CssBaseline />
          <Box sx={{ display: 'flex', minHeight: '100dvh' }}>
            <Header />
            <Box
              component="main"
              className="MainContent"
              sx={{
                px: { xs: 2, md: 6 },
                pt: {
                  xs: 'calc(12px + var(--Header-height))',
                  sm: 'calc(12px + var(--Header-height))',
                  md: 3,
                },
                pb: { xs: 2, sm: 2, md: 3 },
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minWidth: 0,
                height: '100dvh',
                gap: 1,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>

              </Box>
              <Box
                sx={{
                  display: 'flex',
                  mb: 1,
                  gap: 1,
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'start', sm: 'end' },
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                }}
              >
                <Typography level="h2" component="h1">
                  Transactions
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    mb: 1,
                    gap: 1,
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { sc: 'start', mc: 'center', ec: "end" },
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                  }}
                >

                  <Button
                    component="label"
                    color="primary"
                    startDecorator={<UploadFile />}
                    size="md"
                    onClick={() => setOpenUploadFile(true)}
                  >
                    Upload CSV
                  </Button>
                  <Button
                    color="primary"
                    startDecorator={<Add />}
                    size="md"
                    onClick={() => setOpenAddTransaction(true)}
                  >
                    Add Transaction
                  </Button>
                  <Button
                    color="primary"
                    startDecorator={<DownloadRoundedIcon />}
                    size="md"
                  >
                    Download PDF
                  </Button>
                </Box>
              </Box>
              <OrderTable rows={rows} convert_currency={convert_currency} setRows={setRows} openEditTransaction={openEditTransaction} setOpenEditTransaction={setOpenEditTransaction} currency_rates={currency_rates} page={page} />
              <Box
                className="Pagination-laptopUp"
                sx={{
                  pt: 2,
                  gap: 1,
                  [`& .${iconButtonClasses.root}`]: { borderRadius: '50%' },
                  display: {
                    xs: 'none',
                    md: 'flex',
                  },
                }}
              >
                <Button
                  size="sm"
                  variant="outlined"
                  color="neutral"
                  startDecorator={<KeyboardArrowLeftIcon />}
                  onClick={() => { setPage(page - 1) }}


                >
                  Previous
                </Button>
                <Typography variant="soft" level="h4" color="success" component="h1">
                  {page}
                </Typography>

                <Button
                  size="sm"
                  variant="outlined"
                  color="neutral"
                  endDecorator={<KeyboardArrowRightIcon />}
                  onClick={() => { setPage(page + 1) }}
                >
                  Next
                </Button>
              </Box>
            </Box>
          </Box>
        </CssVarsProvider>)
  )
}
