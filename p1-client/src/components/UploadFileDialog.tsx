import * as React from 'react';
import { useState, useEffect } from 'react';
import Button from '@mui/joy/Button';
import Modal from '@mui/joy/Modal';
import ModalDialog from '@mui/joy/ModalDialog';
import DialogTitle from '@mui/joy/DialogTitle';
import Stack from '@mui/joy/Stack';
import Add from '@mui/icons-material/Add';
import { UploadFile } from '@mui/icons-material';
import Input from '@mui/joy/Input';

interface Props {
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const UploadFileDialog: React.FC<Props> = ({ open, setOpen }) => {
    const [file, setFile] = useState<File | null>(null);
    const [progress, setProgress] = useState<number>(0);
    const [status, setStatus] = useState<string>('');

    useEffect(() => {
        const eventSource = new EventSource('http://localhost:4000/events');

        eventSource.onmessage = (event) => {
            if (event.data === 'complete') {
                setStatus('Validation Complete');
                eventSource.close();
            } else {
                setProgress(event.data);
            }
        };

        eventSource.onerror = (err) => {
            console.error('EventSource failed:', err);
            eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (file) {
            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await fetch('http://localhost:4000/file', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error('File upload failed');
                }
            } catch (error) {
                console.error('Error uploading file:', error);
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
                    <DialogTitle>Upload a CSV file</DialogTitle>
                    <form
                        onKeyPress={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                        onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                            event.preventDefault();
                            handleUpload();
                            // setOpen(false);
                        }}
                    >
                        <Stack spacing={2} height={"5rem"} >
                            <Button
                                component="label"
                                color="neutral"
                                startDecorator={<UploadFile />}
                                size="md"
                            >
                                <Input style={{ display: "none" }} type='file' onChange={handleFileChange} />
                                Choose file
                            </Button>
                            <Button type="submit">Upload</Button>
                        </Stack>
                    </form>
                    <div>
                        <h2>Progress: {progress} entries processed </h2>
                        <h2>Status: {status}</h2>
                    </div>
                </ModalDialog>
            </Modal>
        </React.Fragment>
    );
};

export default UploadFileDialog;
