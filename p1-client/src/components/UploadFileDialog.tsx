import * as React from 'react';
import { useState, useEffect } from 'react';
import Button from '@mui/joy/Button';
import Modal from '@mui/joy/Modal';
import ModalDialog from '@mui/joy/ModalDialog';
import Stack from '@mui/joy/Stack';
import Add from '@mui/icons-material/Add';
import { UploadFile } from '@mui/icons-material';
import Input from '@mui/joy/Input';
import { transaction } from '../entities/transaction';
import Typography from '@mui/joy/Typography';
import CancelIcon from '@mui/icons-material/Cancel';
import { currencyOptions } from '../currencyOptions';
import IconButton from '@mui/joy/IconButton';
import { ColorPaletteProp } from '@mui/joy';
import { toast, ToastContainer } from 'react-toastify';



interface Props {
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setRows: React.Dispatch<React.SetStateAction<Array<transaction>>>
    setPage: React.Dispatch<React.SetStateAction<number>>
}

const UploadFileDialog: React.FC<Props> = ({ open, setOpen, setRows, setPage }) => {
    const [file, setFile] = useState<File | null>(null);
    const [progress, setProgress] = useState<number>(0);
    const [state, setState] = useState<number>(0);
    const [message, setMessage] = useState<string>('');


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


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
        }
    };

    const validateFile = async (file: File): Promise<boolean> => {
        let cnt = 0;
        const currencyList = (currencyOptions.map((e) => e.value));
        const text = await file.text();
        const rows = text.split("\n").slice(1); // Assuming the first row is the header

        for (const row of rows) {
            const [dateStr, description, amountStr, currency] = row.split(",");
            if (dateStr.length == 0)
                break;
            const date = new Date(dateStr);
            if (date > new Date()) {
                setState(1);
                toast.error(`Validation Error: Date is in the future, line=${cnt}`);
                return false;
            }

            // Check if amount is greater than 0
            const amount = parseFloat(amountStr);
            if (amount <= 0) {
                setState(1);
                toast.error(`Validation Error: Amount should be greater than 0, line=${cnt}`);
                return false;
            }

            // Check if description is not empty
            if (!description) {
                setState(1);
                toast.error(`Validation Error: Description is empty, entry no. ${cnt}`)
                return false;
            }

            // Trim the currency code and check if it is in the currency list
            if (!currencyList.includes(currency.trim())) {
                setState(1);
                toast.error(`Validation Error: Invalid currency - ${currency.trim()} , entry no. ${cnt}`)
                return false;
            }
            setState(2);
            setMessage(`done validation for ${cnt}`);
            setTimeout(() => { }, 5000);
            cnt++;
        }
        setMessage("Validation Passed");
        return true;
    };


    const handleUpload = async () => {
        if (file) {
            const formData = new FormData();
            formData.append('file', file);



            const data = await validateFile(file);
            if (data) {
                try {
                    const response = await fetch('http://localhost:4000/file', {
                        method: 'POST',
                        body: formData,
                    });
                    const data = await response.json();
                    if (response.status != 200) {
                        setState(1);
                        toast.error(data.message);
                    } else {
                        setState(3);
                        setMessage('Upload Complete');
                        getTransactionList();
                        toast.success(data.message);
                    }
                } catch (error) {
                    toast.error('error uploading file');
                }
            } else {
                console.log(`${message}`);
            }


        }
    };

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
                            Upload a CSV file
                        </Typography>
                        <IconButton color={'danger' as ColorPaletteProp} onClick={() => { setOpen(false) }}>
                            <CancelIcon></CancelIcon>
                        </IconButton>
                    </Stack>
                    <form
                        onKeyPress={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                        onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                            event.preventDefault();
                            handleUpload();
                        }}
                    >
                        <Stack spacing={2} >
                            {
                                (state == 0) ?

                                    <Button
                                        component="label"
                                        color="neutral"
                                        startDecorator={<UploadFile />}
                                        size="md"
                                    >
                                        <Input style={{ display: "none" }} type='file' onChange={handleFileChange} />
                                        Choose file
                                    </Button> : null
                            }
                            {(state == 0) ?
                                <Button type="submit" disabled={file == null || state > 2}>
                                    Upload
                                </Button> : <Button onClick={() => { setState(0); setMessage(""); setFile(null); }}>
                                    Upload Another File
                                </Button>
                            }
                        </Stack>
                    </form>
                </ModalDialog>
            </Modal>
            <ToastContainer position='bottom-right' />
        </React.Fragment >
    );
};

export default UploadFileDialog;
