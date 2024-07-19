import * as React from 'react';
import { useState, useEffect } from 'react';
import Button from '@mui/joy/Button';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import Input from '@mui/joy/Input';
import Modal from '@mui/joy/Modal';
import ModalDialog from '@mui/joy/ModalDialog';
import DialogTitle from '@mui/joy/DialogTitle';
import DialogContent from '@mui/joy/DialogContent';
import Stack from '@mui/joy/Stack';
import Add from '@mui/icons-material/Add';
import { transaction } from '../entities/transaction';
import Select from '@mui/joy/Select';
import Option from '@mui/joy/Option';
import userEvent from '@testing-library/user-event';
import { CurrencyRates } from '../entities/conversion_rates';
import { CurrencyOption, currencyOptions } from '../currencyOptions';
import { ColorPaletteProp, IconButton, Typography } from '@mui/joy';
import { toast } from 'react-toastify'
import CancelIcon from '@mui/icons-material/Cancel';





interface Props {
    open: boolean
    setOpen: React.Dispatch<React.SetStateAction<boolean>>
    ts: transaction
    rows: Array<transaction>
    setRows: React.Dispatch<React.SetStateAction<Array<transaction>>>
    currency_rates?: CurrencyRates
    page: number
}

const formatNumber = (num: number): number => {
    if (Number.isInteger(num)) {
        return num;
    } else {
        return parseFloat(num.toFixed(3));
    }
};

const inr: string = "INR";
const eur: string = "EUR";
const usd: string = "USD";
const cad: string = "CAD";






export default function EditTransaction({ open, setOpen, ts, rows, setRows, currency_rates, page }: Props) {
    const [formData, setFormData] = useState<transaction>(ts as transaction)
    const [datePlaceholder, setDatePlaceholder] = useState<string>();


    useEffect(() => {
        const formatDate = (date: Date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
            const day = String(date.getDate()).padStart(2, '0');
            setDatePlaceholder(`${year}-${month}-${day}`);
        };
        formatDate(formData.date)
    }, []);

    function changeCurrency(val: string) {
        const newFormData = { ...formData } as transaction;
        newFormData.original_amount_currency = val
        convertToINR(newFormData)
    }
    function convertToINR(formData: transaction) {
        const newformData = { ...formData } as transaction;
        if (currency_rates != null) {
            const val: keyof CurrencyRates = formData.original_amount_currency as keyof CurrencyRates;
            newformData.converted_amount_qty = parseFloat((formData.original_amount_qty / currency_rates[val]).toFixed(3));
        }
        setFormData(newformData)
    }
    const formatDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`
    };
    const getTransactionList = async function () {
        const data: Array<transaction> = await (await fetch('http://localhost:4000/transactions', {
            method: 'POST', headers: {
                'Content-Type': 'application/json'
            }, body: JSON.stringify({ page: page })
        })).json();
        const newData = data.map((item) => ({ ...item, date: new Date(item.date) }))
        setRows(newData);
    }
    async function editTransactionProcess() {
        const newformData = { ...formData } as transaction;
        newformData.original_amount_qty = formatNumber(formData.original_amount_qty);
        const result = await fetch('http://localhost:4000/transaction', {
            method: 'POST', headers: {
                'Content-Type': 'application/json'
            }, body: JSON.stringify(newformData)
        });
        if (result.status == 200) {
            toast.success("edited 1 transaction");
        } else {
            toast.error("editing transaction failed");
        }
        getTransactionList();
    }
    const validate = function (): boolean {
        if (formData.date >= new Date())
            return false;
        if (formData.original_amount_qty <= 0)
            return false;



        return true;
    }

    return (
        <React.Fragment>
            <Button
                variant="outlined"
                color="neutral"
                startDecorator={<Add />}
                onClick={() => setOpen(true)}
            >
                New project
            </Button>
            <Modal open={open} onClose={() => setOpen(false)} >
                <ModalDialog >
                    <Stack direction="row" justifyContent='space-between' alignItems='center'>
                        <Typography level='h4'>
                            Edit a Transaction
                        </Typography>
                        <IconButton color={'danger' as ColorPaletteProp} onClick={() => { setOpen(false) }}>
                            <CancelIcon></CancelIcon>
                        </IconButton>
                    </Stack>
                    <DialogContent>Fill in the transaction information.</DialogContent>
                    <form

                        onKeyPress={(e) => { if (e.key == 'Enter') e.preventDefault() }}

                        onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                            event.preventDefault();
                            if (validate()) {
                                console.log("validated sob")
                                editTransactionProcess()
                                setOpen(false);
                            } else {
                                toast.error("validation failed");
                            }
                        }}
                    >
                        <Stack spacing={2} height={"5rems"} >

                            <FormControl>
                                <FormLabel>Date</FormLabel>
                                <Input required type='date' name='date' value={formatDate(formData.date)} onChange={(e) => {
                                    const newFormData = { ...formData };
                                    if (e.target.valueAsDate != null)
                                        newFormData.date = e.target.valueAsDate;
                                    setFormData(newFormData)
                                }} />
                            </FormControl>

                            <FormLabel>Original Currency</FormLabel>
                            <Stack direction={"row"} spacing={2}>
                                <FormControl>
                                    <Select size="md" value={formData.original_amount_currency} required     >
                                        {currencyOptions.map((e) =>
                                            (<Option key={e.value} value={e.value} onClick={(data) => { changeCurrency(e.value) }}>{e.value}</Option>)
                                        )}
                                    </Select>
                                </FormControl>
                                <FormControl>
                                    <Input required type='text' style={{ width: "6rem" }} placeholder={formData.original_amount_qty.toString()} onChange={(e) => {
                                        const newFormData = { ...formData } as transaction;
                                        if (!isNaN(parseFloat(e.target.value)))
                                            newFormData.original_amount_qty = parseFloat(e.target.value);
                                        else
                                            newFormData.original_amount_qty = 0.0;
                                        convertToINR(newFormData);
                                    }} />
                                </FormControl>

                            </Stack>
                            <FormControl>
                                <FormLabel>Value in INR</FormLabel>
                                <Input required disabled type='text' style={{ width: "8rem" }} value={formData.converted_amount_qty} />
                            </FormControl>


                            <FormControl>
                                <FormLabel>Enter Description</FormLabel>

                                <Input type="text" style={{ height: "6rem", width: "100%" }} required value={formData.description} onChange={(e) => {
                                    const newFormData = { ...formData };
                                    newFormData.description = e.target.value;
                                    setFormData(newFormData)
                                }}></Input>
                            </FormControl>
                            {(!isNaN(formData.date.getSeconds()) && formData.date >= new Date()) ? <Typography color={'danger' as ColorPaletteProp} level="body-lg">
                                Date must be past
                            </Typography> : null}
                            <Button type="submit" >Submit</Button>
                        </Stack>
                    </form>
                </ModalDialog>
            </Modal>
        </React.Fragment>
    );
}