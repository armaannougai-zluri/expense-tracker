/* eslint-disable jsx-a11y/anchor-is-valid */
import * as React from 'react';
import { ColorPaletteProp } from '@mui/joy/styles';
import Avatar from '@mui/joy/Avatar';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Chip from '@mui/joy/Chip';
import Divider from '@mui/joy/Divider';
import Stack from '@mui/joy/Stack';

import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import Link from '@mui/joy/Link';
import Input from '@mui/joy/Input';
import Modal from '@mui/joy/Modal';
import ModalDialog from '@mui/joy/ModalDialog';
import ModalClose from '@mui/joy/ModalClose';
import Select from '@mui/joy/Select';
import Option from '@mui/joy/Option';
import Table from '@mui/joy/Table';
import Sheet from '@mui/joy/Sheet';
import Checkbox from '@mui/joy/Checkbox';
import IconButton, { iconButtonClasses } from '@mui/joy/IconButton';
import Typography from '@mui/joy/Typography';
import Menu from '@mui/joy/Menu';
import MenuButton from '@mui/joy/MenuButton';
import MenuItem from '@mui/joy/MenuItem';
import Dropdown from '@mui/joy/Dropdown';
import Pagination from '@mui/material/Pagination';
import TablePagination from '@mui/material/TablePagination';



import FilterAltIcon from '@mui/icons-material/FilterAlt';
import SearchIcon from '@mui/icons-material/Search';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import BlockIcon from '@mui/icons-material/Block';
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded';

import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded';
import { transaction } from '../entities/transaction';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';



import { v4 as uuid } from "uuid";
import { Tooltip } from '@mui/material';
import { Edit, Padding } from '@mui/icons-material';
import EditTransaction from './EditTransaction';
import { CurrencyRates } from '../entities/conversion_rates';
const inr: string = "INR"
const usd: string = "USD"
const cad: string = "CAD"


function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

type Order = 'asc' | 'desc';

function getComparator<Key extends keyof any>(
  order: Order,
  orderBy: Key,
): (
  a: { [key in Key]: number | string },
  b: { [key in Key]: number | string },
) => number {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

// stableSort() brings sort stability to non-modern bviewers (notably IE11). If you
// only support modern bviewers you can replace stableSort(exampleArray, exampleComparator)
// with exampleArray.slice().sort(exampleComparator)
function stableSort<T>(array: readonly T[], comparator: (a: T, b: T) => number) {
  const stabilizedThis = array.map((el, index) => [el, index] as [T, number]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) {
      return order;
    }
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}


interface Props {
  rows: Array<transaction>
  convert_currency: string
  setRows: React.Dispatch<React.SetStateAction<Array<transaction>>>
  openEditTransaction: boolean
  setOpenEditTransaction: React.Dispatch<React.SetStateAction<boolean>>
  currency_rates?: CurrencyRates
  page: number
}

export default function OrderTable(p: Props) {
  const [order, setOrder] = React.useState<Order>('desc');
  const [selected, setSelected] = React.useState<Array<transaction>>([]);
  const [open, setOpen] = React.useState<boolean>(false);
  const [view, setView] = React.useState<Array<transaction>>(p.rows)
  const [clickedTransaction, setClickedTransaction] = React.useState<transaction>();
  const [hoverId, setHoverId] = React.useState<string>("");

  const convert_currency: string = p.convert_currency

  React.useEffect(() => { setView(p.rows) }, [p.rows])
  async function deleteTransaction(t: Array<transaction>) {

    await fetch('http://localhost:4000/delete', {
      method: 'POST', headers: {
        'Content-Type': 'application/json'
      }, body: JSON.stringify(t)
    })
    const data: Array<transaction> = await (await fetch('http://localhost:4000/transactions', {
      method: 'POST', headers: {
        'Content-Type': 'application/json'
      }, body: JSON.stringify({ page: p.page })
    })).json();
    const newdata = data.map((e) => {
      const newTransaction = new transaction(e.id, new Date(e.date), e.original_amount_currency, e.original_amount_qty, e.converted_amount_qty, e.description);
      return newTransaction;
    })
    console.log(newdata);
    p.setRows(newdata);

  }

  const renderFilters = () => (
    <React.Fragment>
      <FormControl size="md">
        <FormLabel>Date Start</FormLabel>
        <Input type="date" />
      </FormControl>
      <FormControl size="md">
        <FormLabel>Date End</FormLabel>
        <Input type="date" />
      </FormControl>
      <FormControl size="md">
        <FormLabel>Choose original currency</FormLabel>
        <Select size="md" placeholder="ALL" >
          <Option value="ALL">ALL</Option>
          <Option value="EUR">EUR</Option>
          <Option value="INR">INR</Option>
          <Option value="USD">USD</Option>
          <Option value="CAD">CAD</Option>
        </Select>
      </FormControl>
    </React.Fragment >
  );
  return (
    (p.openEditTransaction == true) ?
      <EditTransaction open={p.openEditTransaction} setOpen={p.setOpenEditTransaction} ts={clickedTransaction as transaction} rows={p.rows} setRows={p.setRows} currency_rates={p.currency_rates} /> :
      (<React.Fragment>

        <Sheet
          className="SearchAndFilters-mobile"
          sx={{
            display: { xs: 'flex', sm: 'none' },
            my: 1,
            gap: 1,
            overflow: 'hidden'

          }}
        >
          <Input
            size="md"
            placeholder="Search"
            startDecorator={<SearchIcon />}
            sx={{ flexGrow: 1 }}
          />
          <IconButton
            size="md"
            variant="outlined"
            color="neutral"
            onClick={() => setOpen(true)}
          >
            <FilterAltIcon />
          </IconButton>
          <Modal open={open} onClose={() => setOpen(false)}>
            <ModalDialog aria-labelledby="filter-modal" layout="fullscreen">
              <ModalClose />
              <Typography id="filter-modal" level="h2">
                Filters
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Sheet sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {renderFilters()}
                <Button color="primary" onClick={() => setOpen(false)}>
                  Submit
                </Button>
              </Sheet>
            </ModalDialog>
          </Modal>
        </Sheet>
        <Box
          className="SearchAndFilters-tabletUp"
          sx={{
            borderRadius: 'sm',
            py: 2,
            display: { xs: 'none', sm: 'flex' },
            flexWrap: 'wrap',
            gap: 1.5,
            '& > *': {
              minWidth: { xs: '120px', md: '160px' },
            },
          }}
        >
          <FormControl sx={{ flex: 1 }} size="md">
            <FormLabel>Search for order</FormLabel>
            <Input size="md" placeholder="Search" startDecorator={<SearchIcon />} />
          </FormControl>
          {renderFilters()}
        </Box>
        <Sheet
          className="OrderTableContainer"
          variant="outlined"
          sx={{
            display: { xs: 'none', sm: 'initial' },
            width: '100%',
            borderRadius: 'sm',
            flexShrink: 1,
            overflowY: 'auto',
            minHeight: 0,
          }}
        >
          <Table
            aria-labelledby="tableTitle"
            stickyHeader
            hoverRow
            sx={{
              '--TableCell-headBackground': 'var(--joy-palette-background-level1)',
              '--Table-headerUnderlineThickness': '5px',
              '--TableRow-hoverBackground': 'var(--joy-palette-background-level2)',
              '--TableCell-paddingY': '4px',
              '--TableCell-paddingX': '8px',
            }}
            style={{ fontSize: '1rem' }}
          >
            <thead>
              <tr>
                <th style={{ width: 50, textAlign: 'center', padding: '12px 6px' }}>
                  <Checkbox
                    size="sm"
                    indeterminate={
                      selected.length > 0 && selected.length !== view.length
                    }
                    checked={selected.length === view.length}
                    onChange={(event) => {
                      setSelected(
                        event.target.checked ? view.map((row) => row) : [],
                      );
                    }}
                    color={
                      selected.length > 0 || selected.length === view.length
                        ? 'primary'
                        : undefined
                    }
                    sx={{ verticalAlign: 'text-bottom' }}
                  />
                </th>
                <th style={{ width: '10rem', padding: '12px 6px' }}>
                  <Link
                    underline="none"
                    color="primary"
                    component="button"
                    onClick={() => setOrder(order === 'asc' ? 'desc' : 'asc')}
                    fontWeight="lg"
                    endDecorator={<ArrowDropDownIcon />}
                    sx={{
                      '& svg': {
                        transition: '0.2s',
                        transform:
                          order === 'desc' ? 'rotate(0deg)' : 'rotate(180deg)',
                      },
                    }}
                  >
                    Transaction ID
                  </Link>
                </th>
                <th style={{ width: '8rem', padding: '12px 6px' }}>Date</th>
                <th style={{ width: '8rem', padding: '12px 6px' }}>Original Amount</th>
                <th style={{ width: '8rem', padding: '12px 6px' }}>Converted Amount</th>
                <th style={{ width: '10rem', padding: '12px 6px' }}>Description </th>
                <th style={{ width: '4rem', padding: '12px 6px' }}>
                  {
                    selected.length >
                      0 ?
                      (<Box sx={{ display: 'flex', gap: 2, justifyContent: 'right', }}>
                        <IconButton color={'danger' as ColorPaletteProp} onClick={() => { deleteTransaction(selected); setSelected([]) }} > <DeleteIcon /> </IconButton>

                      </Box>) : null
                  }
                </th>

              </tr>
            </thead>
            <tbody >
              {view.map((row) => (
                <tr key={row.id} onPointerEnter={(e) => { setHoverId(row.id) }} onPointerLeave={(e) => { setHoverId("") }}>
                  <td style={{ textAlign: 'center', width: 120 }}>
                    <Checkbox
                      size="sm"
                      checked={selected.includes(row)}
                      color={selected.includes(row) ? 'primary' : undefined}
                      onChange={(event) => {
                        setSelected((ids) =>
                          event.target.checked
                            ? ids.concat(row)
                            : ids.filter((itemId) => itemId.id !== row.id),
                        );
                      }}
                      slotProps={{ checkbox: { sx: { textAlign: 'left' } } }}
                      sx={{ verticalAlign: 'text-bottom' }}
                    />
                  </td>
                  <td>
                    <Typography level="body-xs" style={{ fontSize: '1rem' }}>{row.id}</Typography>
                  </td>
                  <td >
                    <Typography level="body-xs" style={{ fontSize: '1rem' }}>{row.date.getDate()}/{row.date.getMonth()}/{row.date.getFullYear()}</Typography>
                  </td>
                  <td >
                    <Stack direction="row" spacing={1}>

                      <Chip variant={"solid"} color={(hoverId == row.id) ? "success" : "neutral"}> {row.original_amount_currency} </Chip>
                      <Typography level="body-lg" style={{ fontSize: '1rem' }}>{row.original_amount_qty}</Typography>
                    </Stack>
                  </td>
                  <td>
                    <Stack direction="row" spacing={1}>

                      <Chip variant="solid" color={(hoverId == row.id) ? "success" : "neutral"}  > {convert_currency}  </Chip>
                      <Typography level="body-lg" style={{ fontSize: '1rem' }}>{row.converted_amount_qty}</Typography>
                    </Stack>
                  </td>
                  <td>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <div>
                        <Typography level="body-xs" style={{ fontSize: "1rem" }}>{row.description}</Typography>
                      </div>
                    </Box>
                  </td>
                  <td>
                    {
                      selected.length == 0 ?
                        (<Box sx={{ display: 'flex', gap: 2, justifyContent: 'right', }}>
                          <IconButton color={'neutral' as ColorPaletteProp} onClick={() => { setClickedTransaction(row); p.setOpenEditTransaction(true); }} > <EditIcon /> </IconButton>
                          <IconButton color={'danger' as ColorPaletteProp} onClick={() => deleteTransaction([row])} > <DeleteIcon /> </IconButton>

                        </Box>) : null
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Sheet>


      </React.Fragment >)
  );
}
