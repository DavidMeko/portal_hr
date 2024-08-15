import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  TextField, 
  Select, 
  MenuItem, 
  Grid, 
  Box, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { format, isValid } from 'date-fns';
import EditIcon from '@mui/icons-material/Edit';

const HilanInterface = () => {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(100);
  const [totalRows, setTotalRows] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    eventId: '',
    employeeId: '',
    status: 'הכל',
    startDate: null,
    endDate: null
  });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  useEffect(() => {
    fetchData();
  }, [page, pageSize, filters]);

  const fetchData = async () => {
    setLoading(true);
    const result = await window.electron.ipcRenderer.invoke('get-hilan-interface-data', {
      page: page + 1,
      pageSize,
      filters
    });
    if (result.success !== false) {
      console.log('Fetched data:', result.data); // Debug log
      const processedData = result.data.map(row => ({
        ...row,
        id: row.id || `temp-${Math.random()}`,
        Date: row.Date ? new Date(parseFloat(row.Date)) : null // Convert timestamp to Date object
      }));
      setData(processedData);
      setTotalRows(result.total);
    } else {
      console.error('Failed to fetch Hilan Interface data:', result.error);
    }
    setLoading(false);
  };

  const handleFilterChange = (field) => (event) => {
    setFilters({ ...filters, [field]: event.target.value });
  };

  const handleDateChange = (field) => (date) => {
    setFilters({ ...filters, [field]: date });
  };

  const handleEditClick = (record) => {
    setEditingRecord(record);
    setEditDialogOpen(true);
  };

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setEditingRecord(null);
  };

  const handleEditSave = async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke('update-hilan-interface-record', editingRecord.id, {
        Status: editingRecord.Status,
        Note: editingRecord.Note
      });
      if (result.success) {
        fetchData(); // Refresh the data
        handleEditDialogClose();
      } else {
        console.error('Failed to update record:', result.error);
      }
    } catch (error) {
      console.error('Error updating record:', error);
    }
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'EventID', headerName: 'Event ID', width: 100 },
    { field: 'Status', headerName: 'Status', width: 120 },
    { 
      field: 'Date', 
      headerName: 'Date', 
      width: 120,
      valueFormatter: (params) => {
        if (params.value && isValid(params.value)) {
          return format(params.value, 'yyyy-MM-dd');
        }
        return 'Invalid Date';
      }
    },
    { field: 'EmployeeID', headerName: 'Employee ID', width: 120 },
    { field: 'SendCode', headerName: 'Send Code', width: 120 },
    { field: 'SubEvent', headerName: 'Sub Event', width: 120 },
    { field: 'EventName', headerName: 'Event Name', width: 200 },
    { field: 'LastName', headerName: 'Last Name', width: 150 },
    { field: 'FirstName', headerName: 'First Name', width: 150 },
    { field: 'CorrectedValue', headerName: 'Corrected Value', width: 150 },
    { field: 'Error', headerName: 'Error', width: 200 },
    { field: 'Note', headerName: 'Note', width: 200 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      renderCell: (params) => (
        <Button
          onClick={() => handleEditClick(params.row)}
          startIcon={<EditIcon />}
          size="small"
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <Box sx={{ height: '100%', width: '100%', p: 2 }}>
      <Typography variant="h5" gutterBottom>Hilan Interface</Typography>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            label="Event ID"
            value={filters.eventId}
            onChange={handleFilterChange('eventId')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            label="Employee ID"
            value={filters.employeeId}
            onChange={handleFilterChange('employeeId')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Select
            fullWidth
            value={filters.status}
            onChange={handleFilterChange('status')}
            displayEmpty
          >
            <MenuItem value="הכל">הכל</MenuItem>
            <MenuItem value="תקין">תקין</MenuItem>
            <MenuItem value="שגוי">שגוי</MenuItem>
            <MenuItem value="שגוי עכשיו">שגוי עכשיו</MenuItem>
          </Select>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Start Date"
              value={filters.startDate}
              onChange={handleDateChange('startDate')}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </LocalizationProvider>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="End Date"
              value={filters.endDate}
              onChange={handleDateChange('endDate')}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </LocalizationProvider>
        </Grid>
      </Grid>
      <Box sx={{ height: 'calc(100% - 150px)', width: '100%' }}>
        <DataGrid
          rows={data}
          columns={columns}
          pagination
          pageSize={pageSize}
          rowsPerPageOptions={[20, 50, 100]}
          rowCount={totalRows}
          paginationMode="server"
          onPageChange={(newPage) => setPage(newPage)}
          onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
          loading={loading}
          disableSelectionOnClick
          components={{
            Toolbar: GridToolbar,
          }}
        />
      </Box>
      <Dialog open={editDialogOpen} onClose={handleEditDialogClose}>
        <DialogTitle>Edit Record</DialogTitle>
        <DialogContent>
          <Select
            fullWidth
            value={editingRecord?.Status || ''}
            onChange={(e) => setEditingRecord({ ...editingRecord, Status: e.target.value })}
            sx={{ mt: 2 }}
          >
            <MenuItem value="תקין">תקין</MenuItem>
            <MenuItem value="שגוי">שגוי</MenuItem>
            <MenuItem value="שגוי עכשיו">שגוי עכשיו</MenuItem>
          </Select>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Note"
            value={editingRecord?.Note || ''}
            onChange={(e) => setEditingRecord({ ...editingRecord, Note: e.target.value })}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditDialogClose}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained" color="primary">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HilanInterface;