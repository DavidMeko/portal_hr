import React, { useState, useEffect } from 'react';
import { 
    Paper, Typography, Grid, FormControl, InputLabel, Select, MenuItem, 
    Checkbox, ListItemText, OutlinedInput, Button, TextField,
    Dialog, DialogTitle, DialogContent, DialogActions, Chip,
    Radio, RadioGroup, FormControlLabel, CircularProgress
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { format, isValid, parseISO } from 'date-fns';

const ReportGenerator = () => {
    const [dataSource, setDataSource] = useState('sap');
    const [filters, setFilters] = useState({});
    const [selectedColumns, setSelectedColumns] = useState([]);
    const [availableColumns, setAvailableColumns] = useState([]);
    const [reportData, setReportData] = useState([]);
    const [openFilterDialog, setOpenFilterDialog] = useState(false);
    const [currentFilter, setCurrentFilter] = useState({ field: '', value: [], operation: 'include' });
    const [columnValues, setColumnValues] = useState({});
    const [isExporting, setIsExporting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchAvailableColumns();
    }, [dataSource]);

    useEffect(() => {
        fetchColumnValues();
    }, [availableColumns]);

    const fetchAvailableColumns = async () => {
        const columns = dataSource === 'sap' 
            ? [
                'sap_employee_id', 'sap_name', 'sap_title', 'sap_gender', 'sap_birth_date',
                'sap_citizenship', 'sap_personal_id', 'sap_relationship_status', 'sap_status',
                'sap_company', 'sap_hospital', 'sap_employee_group', 'sap_employee_subgroup',
                'sap_department', 'sap_role', 'sap_job_title', 'sap_address', 'sap_city',
                'sap_level', 'sap_email', 'sap_phone', 'sap_employment_start', 'sap_manager_name',
                'sap_job_percentage'
              ]
            : [
                'hilan_employee_id', 'hilan_last_name', 'hilan_first_name', 'hilan_personal_id',
                'hilan_birth_date', 'hilan_city', 'hilan_address', 'hilan_email', 'hilan_citizenship',
                'hilan_relationship_status', 'hilan_gender', 'hilan_phone', 'hilan_status',
                'hilan_hospital', 'hilan_department', 'hilan_title', 'hilan_job_title',
                'hilan_company', 'hilan_manager_name', 'hilan_level', 'hilan_job_percentage',
                'hilan_employment_start', 'hilan_group', 'hilan_role'
              ];
        setAvailableColumns(columns);
        setSelectedColumns(columns.slice(0, 5)); // Default to first 5 columns
    };

    const fetchColumnValues = async () => {
        const values = {};
        for (const column of availableColumns) {
            const result = await window.electron.report.getUniqueColumnValues({
                dataSource,
                column
            });
            if (result.success) {
                values[column] = result.values;
            }
        }
        setColumnValues(values);
    };

    const handleDataSourceChange = (event) => {
        setDataSource(event.target.value);
        setFilters({});
        setReportData([]);
    };

    const handleColumnSelect = (event) => {
        setSelectedColumns(event.target.value);
    };

    const handleAddFilter = () => {
        setOpenFilterDialog(true);
    };

    const handleFilterChange = (field, value, operation) => {
        setCurrentFilter({ ...currentFilter, field, value, operation });
    };

    const handleApplyFilter = () => {
        setFilters({ ...filters, [currentFilter.field]: { value: currentFilter.value, operation: currentFilter.operation } });
        setOpenFilterDialog(false);
        setCurrentFilter({ field: '', value: [], operation: 'include' });
    };

    const handleRemoveFilter = (field) => {
        const newFilters = { ...filters };
        delete newFilters[field];
        setFilters(newFilters);
    };

    const generateReport = async () => {
        setIsLoading(true);
        const result = await window.electron.report.generate({
            dataSource,
            filters,
            columns: selectedColumns,
        });
        if (result.success) {
            setReportData(result.data.map((row, index) => ({ id: index, ...row })));
        } else {
            console.error('Failed to generate report:', result.error);
        }
        setIsLoading(false);
    };

    const exportReport = async (format) => {
        setIsExporting(true);
        try {
            const result = await window.electron.report.export({
                data: reportData,
                format,
                suggestedName: `${dataSource}_report_${new Date().toISOString().replace(/:/g, '-')}.${format}`
            });
            if (result.success) {
                console.log(`Report exported successfully to ${result.filePath}`);
            } else {
                console.error('Failed to export report:', result.error);
            }
        } catch (error) {
            console.error('Error during export:', error);
        } finally {
            setIsExporting(false);
        }
    };

    const formatDate = (dateString) => {
        const date = parseISO(dateString);
        return isValid(date) ? format(date, 'yyyy-MM-dd') : dateString;
    };

    const gridColumns = selectedColumns.map(column => ({
        field: column,
        headerName: column.replace(/_/g, ' ').replace(/(^\w|\s\w)/g, m => m.toUpperCase()),
        flex: 1,
        minWidth: 150,
        valueFormatter: (params) => {
            if (column.toLowerCase().includes('date')) {
                return formatDate(params.value);
            }
            return params.value;
        },
    }));

    return (
        <Paper sx={{ p: 3, m: 2 }}>
            <Typography variant="h5" gutterBottom>Report Generator</Typography>
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                        <InputLabel>Data Source</InputLabel>
                        <Select
                            value={dataSource}
                            onChange={handleDataSourceChange}
                            label="Data Source"
                        >
                            <MenuItem value="sap">SAP</MenuItem>
                            <MenuItem value="hilan">Hilan</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                        <InputLabel>Columns</InputLabel>
                        <Select
                            multiple
                            value={selectedColumns}
                            onChange={handleColumnSelect}
                            input={<OutlinedInput label="Columns" />}
                            renderValue={(selected) => selected.join(', ')}
                        >
                            {availableColumns.map((column) => (
                                <MenuItem key={column} value={column}>
                                    <Checkbox checked={selectedColumns.indexOf(column) > -1} />
                                    <ListItemText primary={column} />
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12}>
                    <Button variant="outlined" onClick={handleAddFilter}>Add Filter</Button>
                    {Object.entries(filters).map(([field, { value, operation }]) => (
                        <Chip
                            key={field}
                            label={`${field} ${operation === 'exclude' ? '!=' : '='} ${value.join(', ')}`}
                            onDelete={() => handleRemoveFilter(field)}
                            sx={{ m: 0.5 }}
                        />
                    ))}
                </Grid>
                <Grid item xs={12}>
                    <Button variant="contained" onClick={generateReport} disabled={isLoading}>
                        {isLoading ? <CircularProgress size={24} /> : 'Generate Report'}
                    </Button>
                </Grid>
            </Grid>

            {reportData.length > 0 && (
                <div style={{ height: 400, width: '100%', marginTop: '20px' }}>
                    <DataGrid
                        rows={reportData}
                        columns={gridColumns}
                        pageSize={10}
                        rowsPerPageOptions={[10, 25, 50, 100]}
                        checkboxSelection
                        disableSelectionOnClick
                        components={{
                            Toolbar: GridToolbar,
                        }}
                    />
                    <Button 
                        onClick={() => exportReport('csv')} 
                        sx={{ mt: 2, mr: 1 }}
                        disabled={isExporting}
                    >
                        {isExporting ? <CircularProgress size={24} /> : 'Export as CSV'}
                    </Button>
                    <Button 
                        onClick={() => exportReport('pdf')} 
                        sx={{ mt: 2 }}
                        disabled={isExporting}
                    >
                        {isExporting ? <CircularProgress size={24} /> : 'Export as PDF'}
                    </Button>
                </div>
            )}

            <Dialog open={openFilterDialog} onClose={() => setOpenFilterDialog(false)}>
                <DialogTitle>Add Filter</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Field</InputLabel>
                        <Select
                            value={currentFilter.field}
                            onChange={(e) => handleFilterChange(e.target.value, currentFilter.value, currentFilter.operation)}
                            label="Field"
                        >
                            {availableColumns.map((column) => (
                                <MenuItem key={column} value={column}>{column}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    {currentFilter.field && (
                        <FormControl fullWidth sx={{ mt: 2 }}>
                            <InputLabel>Value</InputLabel>
                            <Select
                                multiple
                                value={currentFilter.value}
                                onChange={(e) => handleFilterChange(currentFilter.field, e.target.value, currentFilter.operation)}
                                input={<OutlinedInput label="Value" />}
                                renderValue={(selected) => selected.join(', ')}
                            >
                                {columnValues[currentFilter.field]?.map((value) => (
                                    <MenuItem key={value} value={value}>
                                        <Checkbox checked={currentFilter.value.indexOf(value) > -1} />
                                        <ListItemText primary={value} />
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                    <FormControl component="fieldset" sx={{ mt: 2 }}>
                        <RadioGroup
                            row
                            value={currentFilter.operation}
                            onChange={(e) => handleFilterChange(currentFilter.field, currentFilter.value, e.target.value)}
                        >
                            <FormControlLabel value="include" control={<Radio />} label="Include" />
                            <FormControlLabel value="exclude" control={<Radio />} label="Exclude" />
                        </RadioGroup>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenFilterDialog(false)}>Cancel</Button>
                    <Button onClick={handleApplyFilter} variant="contained">Apply</Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
};

export default ReportGenerator;