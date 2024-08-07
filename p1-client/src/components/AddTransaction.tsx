import * as React from 'react';
import { useState } from 'react';
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
import { ToastContainer, toast } from 'react-toastify';
import { CurrencyOption, currencyOptions } from '../currencyOptions'
import { ColorPaletteProp, IconButton, Typography } from '@mui/joy';
import { isNumber } from '@mui/x-data-grid/internals';
import { Toast } from 'react-toastify/dist/components';
import CancelIcon from '@mui/icons-material/Cancel';




interface Props {
    open: boolean
    setOpen: React.Dispatch<React.SetStateAction<boolean>>
    rows: Array<transaction>
    setRows: React.Dispatch<React.SetStateAction<Array<transaction>>>
    currency_rates?: CurrencyRates
    page: Number
    setPage: React.Dispatch<React.SetStateAction<number>>
}

const formatNumber = (num: number): number => {
    if (Number.isInteger(num)) {
        return num;
    } else {
        return parseFloat(num.toFixed(3));
    }
};


export default function AddTransaction({ open, setOpen, rows, setRows, currency_rates, page, setPage }: Props) {
    const [formData, setFormData] = useState<transaction>(new transaction(new Date("131"), "", 0, 0, "hi world"))

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
    async function addTransactionProcess() {
        const newformData = { ...formData } as transaction;
        newformData.original_amount_qty = formatNumber(formData.original_amount_qty);
        const result = await fetch('http://localhost:4000/transaction', {
            method: 'POST', headers: {
                'Content-Type': 'application/json'
            }, body: JSON.stringify(newformData)
        })
        if (result.status == 200) {
            toast.success("added 1 transaction");
        }
        await getTransactionList();
    }
    const getTransactionList = async function () {
        setPage(1);
        const data: Array<transaction> = await (await fetch('http://localhost:4000/transactions', {
            method: 'POST', headers: {
                'Content-Type': 'application/json'
            }, body: JSON.stringify({ page: 1 })
        })).json();
        const newData = data.map((item) => ({ ...item, date: new Date(item.date) }))
        setRows(newData);
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
                            Add a Transaction
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
                            console.log(formData);
                            if (validate()) {
                                console.log("crazy");
                                addTransactionProcess()
                                setOpen(false);
                            } else {
                                toast.error("validation failed");
                            }
                        }}
                    >
                        <Stack spacing={2} height={"5rems"} >

                            <FormControl>
                                <FormLabel>Date</FormLabel>
                                <Input required type='date' onChange={(e) => { const newFormData = { ...formData }; if (e.target.valueAsDate != null) newFormData.date = e.target.valueAsDate; setFormData(newFormData) }} />
                            </FormControl>

                            <FormLabel>Original Currency</FormLabel>
                            <Stack direction={"row"} spacing={2}>
                                <FormControl>
                                    <Select size="md" placeholder="SELECT" required>
                                        {currencyOptions.map((e) =>
                                            (<Option key={e.value} value={e.value} onClick={(data) => { changeCurrency(e.value) }}>{e.value}</Option>)
                                        )}
                                    </Select>
                                </FormControl>
                                <FormControl>
                                    <Input required type='text' style={{ width: "6rem" }} onChange={(e) => {
                                        const newFormData = { ...formData } as transaction;
                                        if (!isNaN(parseFloat(e.target.value))) {
                                            newFormData.original_amount_qty = parseFloat(e.target.value);
                                        }
                                        else
                                            newFormData.original_amount_qty = 0.0;
                                        convertToINR(newFormData);
                                    }} onBlur={(e) => e.target.value = formData.original_amount_qty.toString()} />
                                </FormControl>

                            </Stack>
                            <FormControl>
                                <FormLabel>Value in INR</FormLabel>
                                <Input required disabled type='text' style={{ width: "8rem" }} value={formData.converted_amount_qty} />
                            </FormControl>


                            <FormControl>
                                <FormLabel>Enter Description</FormLabel>

                                <Input type="text" style={{ height: "6rem", width: "100%" }} required onChange={(e) => {
                                    const newFormData = formData;
                                    newFormData.description = e.target.value;
                                    setFormData(newFormData)
                                }}></Input>
                            </FormControl>
                            {(!isNaN(formData.date.getSeconds()) && formData.date >= new Date()) ? <Typography color={'danger' as ColorPaletteProp} level="body-lg">
                                Date must be past
                            </Typography> : null}
                            <Button type="submit" >Submit</Button>
                            <></>
                        </Stack>
                    </form>
                </ModalDialog>
            </Modal>
            <ToastContainer position='bottom-right' limit={4} />
        </React.Fragment>
    );
}